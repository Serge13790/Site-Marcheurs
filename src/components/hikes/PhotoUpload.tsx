
import { useState, useRef } from 'react'
import { Upload, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'

interface PhotoUploadProps {
    hikeId: string
    userId: string
    onUploadComplete: () => void
}

export function PhotoUpload({ hikeId, userId, onUploadComplete }: PhotoUploadProps) {
    const [isUploading, setIsUploading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [files, setFiles] = useState<File[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            // Filter only images and limit to 10 files at once
            const selected = Array.from(e.target.files).filter(f => f.type.startsWith('image/'))
            setFiles(prev => [...prev, ...selected].slice(0, 10))
        }
    }

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index))
    }

    const handleUpload = async () => {
        if (files.length === 0) return

        setIsUploading(true)
        setProgress(0)
        let completed = 0

        for (const file of files) {
            try {
                // Resize or optimize could happen here, keeping it simple for now
                const fileExt = file.name.split('.').pop()
                const uniqueId = Math.random().toString(36).substring(2, 11)
                const storagePath = `${hikeId}/${uniqueId}.${fileExt}`

                // 1. Upload to Storage
                const { error: uploadError } = await supabase.storage
                    .from('photos')
                    .upload(storagePath, file)

                if (uploadError) throw uploadError

                // 2. Insert into DB
                const { error: dbError } = await supabase
                    .from('photos')
                    .insert({
                        hike_id: hikeId,
                        user_id: userId,
                        storage_path: storagePath,
                        caption: file.name
                    })

                if (dbError) throw dbError

            } catch (error) {
                console.error('Error uploading file:', file.name, error)
                // Continue with other files
            } finally {
                completed++
                setProgress((completed / files.length) * 100)
            }
        }

        setIsUploading(false)
        setFiles([])
        onUploadComplete()
    }

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600" />
                Partagez vos photos
            </h3>

            <div className="space-y-4">
                {/* Drop Zone / Select Button */}
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        multiple
                        accept="image/*"
                        className="hidden"
                    />
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-600 font-medium">Cliquez pour ajouter des photos</p>
                    <p className="text-slate-400 text-sm">JPG, PNG supportés</p>
                </div>

                {/* File List */}
                <AnimatePresence>
                    {files.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-2 overflow-hidden"
                        >
                            {files.map((file, i) => (
                                <div key={i} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg text-sm">
                                    <span className="text-slate-700 truncate max-w-[200px]">{file.name}</span>
                                    <button
                                        onClick={() => removeFile(i)}
                                        className="text-slate-400 hover:text-red-500"
                                        disabled={isUploading}
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Progress & Action */}
                {files.length > 0 && (
                    <div className="flex items-center gap-4">
                        {isUploading ? (
                            <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div
                                    className="bg-blue-600 h-full transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        ) : (
                            <button
                                onClick={handleUpload}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Upload className="w-5 h-5" />
                                Envoyer {files.length} photo{files.length > 1 ? 's' : ''}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
