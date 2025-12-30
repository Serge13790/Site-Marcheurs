
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// --- Configuration ---
const LEAD_DIR = path.join(process.cwd(), 'v1', 'diaporamaPHP')
const BUCKET_NAME = 'photos'

// Determine __dirname in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local')
let envContent = ''
try {
    envContent = fs.readFileSync(envPath, 'utf8')
} catch (e) {
    console.log('No .env.local found, relying on process.env')
}

const envVars: Record<string, string> = {}
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/)
    if (match) {
        const key = match[1].trim()
        const value = match[2].trim().replace(/^['"]|['"]$/g, '') // remove quotes
        envVars[key] = value
    }
})

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || envVars.VITE_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || envVars.SUPABASE_SERVICE_ROLE_KEY
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || envVars.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL) {
    console.error('Missing VITE_SUPABASE_URL')
    process.exit(1)
}

// Prefer Service Key for migration to bypass RLS, otherwise fallback to Anon (might fail if RLS blocks)
const supabaseKey = SERVICE_KEY || ANON_KEY
if (!supabaseKey) {
    console.error('Missing SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY')
    process.exit(1)
}

if (!SERVICE_KEY) {
    console.warn('⚠️  WARNING: Running with ANON KEY. Migration might fail due to Row Level Security (RLS).')
    console.warn('   Please add SUPABASE_SERVICE_ROLE_KEY to .env.local for full access.')
}

const supabase = createClient(SUPABASE_URL, supabaseKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    }
})

async function getAdminUser() {
    // Try to find an admin user to attribute content to
    if (SERVICE_KEY) {
        // With service key we can query profiles directly without auth
        const { data, error } = await supabase
            .from('profiles')
            .select('id')
            .eq('role', 'admin')
            .limit(1)

        if (data && data.length > 0) return data[0].id
    }
    return null // content will be anonymous or we'll let it fail if not null required
}

async function migrate() {
    console.log('🚀 Starting migration...')
    console.log(`📂 Scanning directory: ${LEAD_DIR}`)

    if (!fs.existsSync(LEAD_DIR)) {
        console.error(`❌ Directory not found: ${LEAD_DIR}`)
        process.exit(1)
    }

    const adminId = await getAdminUser()
    if (adminId) console.log(`👤 Attributing content to admin ID: ${adminId}`)
    else console.log('⚠️  No admin user found or accessible. Content might have null created_by.')

    // Ensure bucket exists
    const { data: bucket, error: bucketError } = await supabase.storage.getBucket(BUCKET_NAME)
    if (bucketError && bucketError.message.includes('not found')) {
        console.log(`🪣 Creating storage bucket: ${BUCKET_NAME}`)
        const { error: createBucketError } = await supabase.storage.createBucket(BUCKET_NAME, {
            public: true
        })
        if (createBucketError) {
            console.error(`❌ Failed to create bucket: ${createBucketError.message}`)
            process.exit(1)
        }
    } else if (bucketError) {
        // Warning only, as getBucket might fail on permissions but create/upload might still work or not
        console.warn(`⚠️ Warning checking bucket: ${bucketError.message}`)
    } else {
        console.log(`✅ Bucket '${BUCKET_NAME}' exists.`)
    }

    const items = fs.readdirSync(LEAD_DIR, { withFileTypes: true })

    for (const item of items) {
        if (!item.isDirectory()) continue

        // Parse folder name: YYYY_MM_DD_Title
        // Example: 2021_04_02_Tour du lac de Bimont
        const match = item.name.match(/^(\d{4})[_-](\d{2})[_-](\d{2})[_-](.+)$/)
        if (!match) {
            console.log(`⏩ Skipping invalid folder format: ${item.name}`)
            continue
        }

        const [_, year, month, day, rawTitle] = match
        const date = `${year}-${month}-${day}`
        const title = rawTitle.replace(/[_-]/g, ' ') // Replace separators with spaces

        console.log(`\n🏔️  Processing Hike: [${date}] ${title}`)

        // 1. Check/Create Hike
        let hikeId: string | null = null

        // Check existence
        const { data: existing } = await supabase
            .from('hikes')
            .select('id')
            .eq('date', date)
            .eq('title', title)
            .single()

        if (existing) {
            console.log(`   ✅ Hike already exists (ID: ${existing.id})`)
            hikeId = existing.id
        } else {
            // Create
            const { data: newHike, error: createError } = await supabase
                .from('hikes')
                .insert({
                    title,
                    date,
                    description: 'Importé depuis l\'ancien site',
                    created_by: adminId
                    // status field removed as it doesn't exist in schema
                })
                .select()
                .single()

            if (createError) {
                console.error(`   ❌ Failed to create hike: ${createError.message}`)
                continue
            }
            if (newHike) {
                console.log(`   ✨ Created new hike (ID: ${newHike.id})`)
                hikeId = newHike.id
            }
        }

        if (!hikeId) continue

        // 2. Process Photos
        const folderPath = path.join(LEAD_DIR, item.name)
        const files = fs.readdirSync(folderPath)

        for (const file of files) {
            if (!file.match(/\.(jpg|jpeg|png)$/i)) continue

            const filePath = path.join(folderPath, file)
            const fileStat = fs.statSync(filePath)
            const fileBuffer = fs.readFileSync(filePath)

            // Storage path: hikes/{hikeId}/{filename}
            const storagePath = `${hikeId}/${file}`

            // Check if photo record exists
            // Ideally we check if file is in storage, but checking DB is faster proxy
            // But duplicates in DB?
            // Let's just try to upload. Supabase storage "upsert" is false by default.

            // Upload to Storage
            console.log(`      📸 Uploading ${file}...`)
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from(BUCKET_NAME)
                .upload(storagePath, fileBuffer, {
                    contentType: 'image/jpeg', // Simple assumption, verify ext if needed
                    upsert: true
                })

            if (uploadError) {
                console.error(`      ❌ Upload failed: ${uploadError.message}`)
            } else {
                // Create DB record
                // Check if exists first to avoid dupes in DB
                const { data: existingPhoto } = await supabase
                    .from('photos')
                    .select('id')
                    .eq('hike_id', hikeId)
                    .eq('storage_path', storagePath)
                    .single()

                if (!existingPhoto) {
                    const { error: dbError } = await supabase
                        .from('photos')
                        .insert({
                            hike_id: hikeId,
                            user_id: adminId,
                            storage_path: storagePath,
                            caption: file
                        })

                    if (dbError) console.error(`      ❌ DB Insert failed: ${dbError.message}`)
                    else console.log(`      ✅ Linked in DB`)
                } else {
                    console.log(`      Existing in DB`)
                }
            }
        }
    }

    console.log('\n🎉 Migration complete!')
}

migrate().catch(console.error)
