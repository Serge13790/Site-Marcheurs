import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, MapPin, Clock, Users, ArrowLeft, Mountain, Ruler, TrendingUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { GalleryGrid } from '@/components/gallery/GalleryGrid'
import { PhotoUpload } from './PhotoUpload'

interface HikeDetailType {
    id: string
    title: string
    description?: string
    date: string
    location: string
    difficulty: string
    duration: string
    participants_count: number
    cover_image_url: string
    status: string
    distance?: number
    elevation?: number
    map_embed_code?: string
    start_time?: string
    meeting_point?: string
}

export function HikeDetail() {
    const { id } = useParams<{ id: string }>()
    const [hike, setHike] = useState<HikeDetailType | null>(null)
    const [loading, setLoading] = useState(true)

    const [user, setUser] = useState<any>(null)
    const [galleryKey, setGalleryKey] = useState(0)

    const handleUploadComplete = () => {
        setGalleryKey(prev => prev + 1)
    }

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null)
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
        })

        return () => subscription.unsubscribe()
    }, [])

    useEffect(() => {
        async function fetchHike() {
            if (!id) return
            try {
                const { data, error } = await supabase
                    .from('hikes')
                    .select('*')
                    .eq('id', id)
                    .single()

                if (error) throw error
                setHike(data)
            } catch (error) {
                console.error('Error fetching hike:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchHike()
    }, [id])

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin text-blue-600">
                    <Mountain className="w-8 h-8" />
                </div>
            </div>
        )
    }

    if (!hike) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
                <h2 className="text-2xl font-bold text-slate-800">Randonnée introuvable</h2>
                <Link to="/" className="text-blue-600 hover:underline">
                    Retour à l'accueil
                </Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Hero Image */}
            <div className="relative h-[60vh] w-full overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${hike.cover_image_url || 'https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=2070&auto=format&fit=crop'})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

                <div className="absolute top-8 left-4 md:left-8 z-10">
                    <Link
                        to="/"
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Retour
                    </Link>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                    <div className="container mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="flex flex-wrap gap-3 mb-4">
                                {hike.difficulty && (
                                    <span className={cn(
                                        "px-3 py-1 rounded-full text-sm font-semibold backdrop-blur-md border",
                                        hike.difficulty === 'Facile' ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" :
                                            hike.difficulty === 'Moyen' ? "bg-amber-500/20 text-amber-300 border-amber-500/30" :
                                                "bg-red-500/20 text-red-300 border-red-500/30"
                                    )}>
                                        {hike.difficulty}
                                    </span>
                                )}
                                {hike.duration && (
                                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 backdrop-blur-md flex items-center gap-1">
                                        <Clock className="w-4 h-4" /> {hike.duration}
                                    </span>
                                )}
                                {hike.distance && (
                                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 backdrop-blur-md flex items-center gap-1">
                                        <Ruler className="w-4 h-4" /> {hike.distance} km
                                    </span>
                                )}
                                {hike.elevation && (
                                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 backdrop-blur-md flex items-center gap-1">
                                        <TrendingUp className="w-4 h-4" /> {hike.elevation}m D+
                                    </span>
                                )}
                            </div>
                            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
                                {hike.title}
                            </h1>
                            <div className="flex flex-wrap items-center gap-6 text-slate-300 text-lg">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-blue-400" />
                                    <span>{new Date(hike.date).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-emerald-400" />
                                    <span>{hike.location}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users className="w-5 h-5 text-amber-400" />
                                    <span>{hike.participants_count || 0} participants</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Main Description */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <Mountain className="w-6 h-6 text-blue-600" />
                                À propos de cette rando
                            </h2>
                            <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed">
                                {hike.description ? (
                                    hike.description.split('\n').map((paragraph, idx) => (
                                        <p key={idx} className="mb-4 last:mb-0">{paragraph}</p>
                                    ))
                                ) : (
                                    <p className="italic text-slate-500">Aucune description disponible pour le moment.</p>
                                )}
                            </div>
                        </div>

                        {/* Map Section */}
                        {hike.map_embed_code && (
                            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                                <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                    <MapPin className="w-6 h-6 text-emerald-600" />
                                    Carte & Itinéraire
                                </h2>
                                <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200" dangerouslySetInnerHTML={{ __html: hike.map_embed_code }} />
                            </div>
                        )}

                        {/* Gallery Preview */}
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                            <h2 className="text-2xl font-bold text-slate-800 mb-6">Souvenirs de la sortie</h2>
                            <GalleryGrid key={galleryKey} hikeId={hike.id} />

                            {user && (
                                <div className="mt-8 pt-8 border-t border-slate-100 bg-slate-50/50 rounded-xl p-6">
                                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Ajouter des photos</h3>
                                    <PhotoUpload
                                        hikeId={hike.id}
                                        userId={user.id}
                                        onUploadComplete={handleUploadComplete}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 sticky top-24">
                            <h3 className="text-lg font-bold text-slate-800 mb-4">Détails pratiques</h3>
                            <ul className="space-y-4">
                                <li className="flex items-center justify-between py-2 border-b border-slate-50">
                                    <span className="text-slate-500">Date</span>
                                    <span className="font-medium text-slate-800">{new Date(hike.date).toLocaleDateString()}</span>
                                </li>
                                <li className="flex items-center justify-between py-2 border-b border-slate-50">
                                    <span className="text-slate-500">Heure de départ</span>
                                    <span className="font-medium text-slate-800">{hike.start_time || '08:00 (est.)'}</span>
                                </li>
                                <li className="flex items-center justify-between py-2 border-b border-slate-50">
                                    <span className="text-slate-500">Lieu de RDV</span>
                                    <span className="font-medium text-slate-800">{hike.meeting_point || 'Parking village'}</span>
                                </li>
                                {hike.distance && (
                                    <li className="flex items-center justify-between py-2 border-b border-slate-50">
                                        <span className="text-slate-500">Distance</span>
                                        <span className="font-medium text-slate-800">{hike.distance} km</span>
                                    </li>
                                )}
                                {hike.elevation && (
                                    <li className="flex items-center justify-between py-2 border-b border-slate-50">
                                        <span className="text-slate-500">Dénivelé</span>
                                        <span className="font-medium text-slate-800">{hike.elevation} m</span>
                                    </li>
                                )}
                                <li className="pt-4">
                                    <button className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors shadow-lg shadow-blue-600/20">
                                        Je participe !
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
