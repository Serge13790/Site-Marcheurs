import { useState, useEffect } from 'react'
import { Plus, Search, Calendar, MapPin, X, Trash, Edit, Mountain, Upload, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { AdminLayout } from './AdminLayout'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

// Supabase Hikes Table Types
interface Hike {
    id: string
    title: string
    date: string
    location: string
    status: 'published' | 'draft' | 'planned'
    difficulty?: 'Facile' | 'Moyen' | 'Difficile'
    duration?: string
    participants_count?: number
    cover_image_url?: string
    description?: string
    // New fields
    distance?: number
    elevation?: number
    map_embed_code?: string
    start_time?: string
    meeting_point?: string
}

interface Photo {
    id: string
    storage_path: string // or public_url if we compute it
    hike_id: string
    caption?: string
}

export function AdminHikes() {
    const [hikes, setHikes] = useState<Hike[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [filterStatus, setFilterStatus] = useState<string>('all')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [currentHike, setCurrentHike] = useState<Partial<Hike>>({})
    const [isEditing, setIsEditing] = useState(false)

    // Gallery Selector State
    const [isGalleryOpen, setIsGalleryOpen] = useState(false)
    const [galleryPhotos, setGalleryPhotos] = useState<any[]>([])
    const [loadingGallery, setLoadingGallery] = useState(false)
    const [galleryPage, setGalleryPage] = useState(0)
    const [totalGalleryPhotos, setTotalGalleryPhotos] = useState(0)
    const PHOTOS_PER_PAGE = 24

    // Hike Photos Management State
    const [hikePhotos, setHikePhotos] = useState<Photo[]>([])
    const [loadingHikePhotos, setLoadingHikePhotos] = useState(false)
    const [uploading, setUploading] = useState(false)

    // Fetch Hikes
    useEffect(() => {
        fetchHikes()
    }, [])

    // Fetch Hike Photos when editing
    useEffect(() => {
        if (isEditing && currentHike.id && isModalOpen) {
            fetchHikePhotos(currentHike.id)
        } else {
            setHikePhotos([])
        }
    }, [isEditing, currentHike.id, isModalOpen])

    async function fetchHikes() {
        try {
            const { data, error } = await supabase
                .from('hikes')
                .select('*')
                .order('date', { ascending: false })

            if (error) throw error
            if (data) setHikes(data as Hike[])
        } catch (error) {
            console.error('Error fetching hikes:', error)
        } finally {
            setLoading(false)
        }
    }

    async function fetchHikePhotos(hikeId: string) {
        setLoadingHikePhotos(true)
        try {
            const { data, error } = await supabase
                .from('photos')
                .select('*')
                .eq('hike_id', hikeId)
                .order('created_at', { ascending: false })

            if (error) throw error

            // Format for display (get public URL)
            const formatted = (data || []).map(p => {
                const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(p.storage_path)
                return { ...p, publicUrl }
            })
            setHikePhotos(formatted)
        } catch (error) {
            console.error("Error fetching hike photos", error)
        } finally {
            setLoadingHikePhotos(false)
        }
    }

    async function fetchGalleryPhotos(page = 0) {
        setLoadingGallery(true)
        try {
            const from = page * PHOTOS_PER_PAGE
            const to = from + PHOTOS_PER_PAGE - 1

            // Fetch count and data
            const { count } = await supabase.from('photos').select('*', { count: 'exact', head: true })
            if (count !== null) setTotalGalleryPhotos(count)

            const { data, error } = await supabase
                .from('photos')
                .select('*')
                .order('created_at', { ascending: false })
                .range(from, to)

            if (error) throw error

            const formatted = (data || []).map(p => {
                const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(p.storage_path)
                return { ...p, publicUrl }
            })
            setGalleryPhotos(formatted)
            setGalleryPage(page)
        } catch (error) {
            console.error("Error fetching gallery", error)
        } finally {
            setLoadingGallery(false)
        }
    }

    // Filter Logic
    const filteredHikes = hikes.filter(hike => {
        const matchesSearch = hike.title.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = filterStatus === 'all' || hike.status === filterStatus
        return matchesSearch && matchesStatus
    })

    // CRUD Handlers
    const handleOpenCreate = () => {
        setCurrentHike({
            status: 'draft',
            date: new Date().toISOString().split('T')[0],
            meeting_point: 'Parking village',
            start_time: '08:00'
        })
        setIsEditing(false)
        setIsModalOpen(true)
    }

    const handleOpenEdit = (hike: Hike) => {
        // Ensure date is YYYY-MM-DD for input
        const dateStr = hike.date ? new Date(hike.date).toISOString().split('T')[0] : ''
        setCurrentHike({ ...hike, date: dateStr })
        setIsEditing(true)
        setIsModalOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette randonnée ?')) {
            try {
                const { error } = await supabase.from('hikes').delete().eq('id', id)
                if (error) throw error
                setHikes(prev => prev.filter(h => h.id !== id))
            } catch (error) {
                console.error('Error deleting hike:', error)
                alert('Erreur lors de la suppression')
            }
        }
    }

    const handleDeletePhoto = async (photoId: string, storagePath: string) => {
        if (!confirm("Supprimer cette photo ?")) return

        try {
            // 1. Delete from Storage
            const { error: storageError } = await supabase.storage.from('photos').remove([storagePath])
            if (storageError) console.warn("Storage deletion error (might be already gone):", storageError)

            // 2. Delete from DB
            const { error: dbError } = await supabase.from('photos').delete().eq('id', photoId)
            if (dbError) throw dbError

            setHikePhotos(prev => prev.filter(p => p.id !== photoId))
        } catch (error) {
            console.error("Error deleting photo:", error)
            alert("Erreur lors de la suppression de la photo")
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const payload = {
                title: currentHike.title,
                date: currentHike.date,
                location: currentHike.location,
                status: currentHike.status,
                difficulty: currentHike.difficulty,
                duration: currentHike.duration,
                description: currentHike.description,
                cover_image_url: currentHike.cover_image_url,
                // New Fields
                distance: currentHike.distance,
                elevation: currentHike.elevation,
                map_embed_code: currentHike.map_embed_code,
                start_time: currentHike.start_time,
                meeting_point: currentHike.meeting_point
            }

            if (isEditing && currentHike.id) {
                // Update
                const { data, error } = await supabase
                    .from('hikes')
                    .update(payload)
                    .eq('id', currentHike.id)
                    .select()
                    .single()

                if (error) throw error
                if (data) {
                    setHikes(prev => prev.map(h => (h.id === (data as Hike).id ? (data as Hike) : h)))
                }
            } else {
                // Create
                const { data, error } = await supabase
                    .from('hikes')
                    .insert([payload])
                    .select()
                    .single()

                if (error) throw error
                if (data) {
                    setHikes(prev => [data as Hike, ...prev])
                }
            }
            setIsModalOpen(false)
        } catch (error) {
            console.error('Error saving hike:', error)
            alert('Erreur lors de l\'enregistrement')
        }
    }

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            if (!event.target.files || event.target.files.length === 0) {
                return
            }
            if (!currentHike.id) {
                alert("Veuillez d'abord créer la randonnée avant d'ajouter des photos.")
                return
            }

            setUploading(true)
            const file = event.target.files[0]
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
            const filePath = `hikes/${currentHike.id}/${fileName}`

            // 1. Upload to Storage
            const { error: uploadError } = await supabase.storage
                .from('photos')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            // 2. Add to DB
            const { error: dbError } = await supabase
                .from('photos')
                .insert([
                    {
                        storage_path: filePath,
                        hike_id: currentHike.id,
                        caption: file.name
                    }
                ])

            if (dbError) throw dbError

            // 3. Refresh list
            await fetchHikePhotos(currentHike.id)

        } catch (error) {
            console.error('Error uploading photo:', error)
            alert('Erreur lors de l\'upload')
        } finally {
            setUploading(false)
        }
    }

    // Tab State
    const [activeTab, setActiveTab] = useState<'infos' | 'photos'>('infos')

    return (
        <AdminLayout>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Gestion des Randonnées</h1>
                    <p className="text-slate-500 dark:text-slate-400">Gérez le planning et les détails des sorties.</p>
                </div>
                <button
                    onClick={handleOpenCreate}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg shadow-blue-900/20"
                >
                    <Plus className="w-4 h-4" />
                    Nouvelle Rando
                </button>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
                {/* Filters */}
                <div className="p-4 border-b border-slate-200 dark:border-white/5 flex gap-4 flex-wrap">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Rechercher une randonnée..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-lg text-slate-900 dark:text-white px-4 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                        <option value="all">Tous les statuts</option>
                        <option value="published">Publié</option>
                        <option value="draft">Brouillon</option>
                        <option value="planned">Planifié</option>
                    </select>
                </div>

                {/* List */}
                <div className="divide-y divide-slate-200 dark:divide-white/5">
                    {loading ? (
                        <div className="p-8 text-center text-slate-500">Chargement...</div>
                    ) : filteredHikes.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">Aucune randonnée trouvée.</div>
                    ) : (
                        filteredHikes.map((hike) => (
                            <div key={hike.id} className="p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 overflow-hidden">
                                        {hike.cover_image_url ? (
                                            <img src={hike.cover_image_url} alt={hike.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <Mountain className="w-6 h-6" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-slate-900 dark:text-white font-medium">{hike.title}</h3>
                                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mt-1">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(hike.date).toLocaleDateString()}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                {hike.location}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <span className={cn(
                                        "px-3 py-1 rounded-full text-xs font-medium border",
                                        hike.status === 'published' ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20" :
                                            hike.status === 'draft' ? "bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600" :
                                                "bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20"
                                    )}>
                                        {hike.status === 'published' ? 'Publié' : hike.status === 'draft' ? 'Brouillon' : 'Planifié'}
                                    </span>

                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleOpenEdit(hike)}
                                            className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                                            title="Modifier"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(hike.id)}
                                            className="p-2 text-red-400 hover:text-red-500 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                            title="Supprimer"
                                        >
                                            <Trash className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )))}
                </div>
            </div>

            {/* Edit/Create Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                        />

                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-0 shadow-2xl z-10 my-8 flex flex-col max-h-[90vh]"
                        >
                            {/* Header & Tabs */}
                            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/10">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                        {isEditing ? 'Modifier la randonnée' : 'Nouvelle randonnée'}
                                    </h2>
                                    <div className="flex gap-4 mt-4">
                                        <button
                                            onClick={() => setActiveTab('infos')}
                                            className={cn(
                                                "pb-2 text-sm font-medium transition-colors relative",
                                                activeTab === 'infos' ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
                                            )}
                                        >
                                            Informations
                                            {activeTab === 'infos' && <motion.div layoutId="tab-line" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />}
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('photos')}
                                            className={cn(
                                                "pb-2 text-sm font-medium transition-colors relative",
                                                activeTab === 'photos' ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
                                            )}
                                        >
                                            Photos & Couverture
                                            {activeTab === 'photos' && <motion.div layoutId="tab-line" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />}
                                        </button>
                                    </div>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white -mt-8">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                <form id="hikeForm" onSubmit={handleSubmit} className="space-y-6">
                                    {activeTab === 'infos' ? (
                                        <div className="space-y-6">
                                            {/* Basic Info */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Titre</label>
                                                        <input
                                                            type="text"
                                                            value={currentHike.title || ''}
                                                            onChange={e => setCurrentHike({ ...currentHike, title: e.target.value })}
                                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                                                            required
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Date</label>
                                                            <input
                                                                type="date"
                                                                value={currentHike.date || ''}
                                                                onChange={e => setCurrentHike({ ...currentHike, date: e.target.value })}
                                                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                                                                required
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Heure Départ</label>
                                                            <input
                                                                type="time"
                                                                value={currentHike.start_time || ''}
                                                                onChange={e => setCurrentHike({ ...currentHike, start_time: e.target.value })}
                                                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Lieu (Ville/Région)</label>
                                                        <input
                                                            type="text"
                                                            value={currentHike.location || ''}
                                                            onChange={e => setCurrentHike({ ...currentHike, location: e.target.value })}
                                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Point de RDV</label>
                                                        <input
                                                            type="text"
                                                            value={currentHike.meeting_point || ''}
                                                            onChange={e => setCurrentHike({ ...currentHike, meeting_point: e.target.value })}
                                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                                                            placeholder="ex: Parking de la Mairie"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    {/* Stats */}
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="block text-xs font-medium text-slate-700 dark:text-slate-400 mb-1">Difficulté</label>
                                                            <select
                                                                value={currentHike.difficulty || 'Moyen'}
                                                                onChange={e => setCurrentHike({ ...currentHike, difficulty: e.target.value as any })}
                                                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-2 text-sm text-slate-900 dark:text-white"
                                                            >
                                                                <option value="Facile">Facile</option>
                                                                <option value="Moyen">Moyen</option>
                                                                <option value="Difficile">Difficile</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-slate-700 dark:text-slate-400 mb-1">Durée</label>
                                                            <input
                                                                type="text"
                                                                value={currentHike.duration || ''}
                                                                onChange={e => setCurrentHike({ ...currentHike, duration: e.target.value })}
                                                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-2 text-sm text-slate-900 dark:text-white"
                                                                placeholder="ex: 3h"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-slate-700 dark:text-slate-400 mb-1">Distance (km)</label>
                                                            <input
                                                                type="number"
                                                                value={currentHike.distance || ''}
                                                                onChange={e => setCurrentHike({ ...currentHike, distance: parseFloat(e.target.value) })}
                                                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-2 text-sm text-slate-900 dark:text-white"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-slate-700 dark:text-slate-400 mb-1">Dénivelé (m)</label>
                                                            <input
                                                                type="number"
                                                                value={currentHike.elevation || ''}
                                                                onChange={e => setCurrentHike({ ...currentHike, elevation: parseFloat(e.target.value) })}
                                                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-2 text-sm text-slate-900 dark:text-white"
                                                            />
                                                        </div>
                                                        <div className="col-span-2">
                                                            <label className="block text-xs font-medium text-slate-700 dark:text-slate-400 mb-1">Statut</label>
                                                            <select
                                                                value={currentHike.status || 'draft'}
                                                                onChange={e => setCurrentHike({ ...currentHike, status: e.target.value as any })}
                                                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-2 text-sm text-slate-900 dark:text-white font-semibold"
                                                            >
                                                                <option value="draft">Brouillon (Masqué)</option>
                                                                <option value="planned">Planifié (Visible)</option>
                                                                <option value="published">Publié (Visible)</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Detailed Description & Map */}
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Description</label>
                                                    <textarea
                                                        value={currentHike.description || ''}
                                                        onChange={e => setCurrentHike({ ...currentHike, description: e.target.value })}
                                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 h-32"
                                                        placeholder="Description de la randonnée..."
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Code d'intégration Carte (iframe) ou URL GPX</label>
                                                    <textarea
                                                        value={currentHike.map_embed_code || ''}
                                                        onChange={e => setCurrentHike({ ...currentHike, map_embed_code: e.target.value })}
                                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 h-20 text-xs font-mono"
                                                        placeholder='<iframe src="..." ...></iframe>'
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {/* Cover Image Selection */}
                                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-white/5">
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-2">Image de couverture</label>
                                                <div className="flex flex-col md:flex-row gap-4 items-start">
                                                    {currentHike.cover_image_url ? (
                                                        <div className="relative w-full md:w-1/3 aspect-video rounded-lg overflow-hidden border border-slate-200 dark:border-white/10 shadow-md">
                                                            <img src={currentHike.cover_image_url} alt="Cover" className="w-full h-full object-cover" />
                                                            <button
                                                                type="button"
                                                                onClick={() => setCurrentHike({ ...currentHike, cover_image_url: '' })}
                                                                className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="w-full md:w-1/3 aspect-video rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                                            <Mountain className="w-10 h-10" />
                                                        </div>
                                                    )}

                                                    <div className="flex-1 space-y-3">
                                                        <p className="text-sm text-slate-500">Sélectionnez une image existante ou collez une URL.</p>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                fetchGalleryPhotos(0);
                                                                setIsGalleryOpen(true);
                                                            }}
                                                            className="w-full py-2 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm flex items-center justify-center gap-2"
                                                        >
                                                            <Search className="w-4 h-4" />
                                                            Choisir dans la galerie globale
                                                        </button>
                                                        <input
                                                            type="text"
                                                            placeholder="Ou URL directe..."
                                                            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white"
                                                            value={currentHike.cover_image_url || ''}
                                                            onChange={e => setCurrentHike({ ...currentHike, cover_image_url: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Associated Photos */}
                                            {isEditing ? (
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <h3 className="text-md font-semibold text-slate-800 dark:text-white">Photos de la randonnée</h3>
                                                        <div className="flex items-center gap-2">
                                                            <label className={cn(
                                                                "cursor-pointer px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2 shadow-sm",
                                                                uploading && "opacity-50 cursor-not-allowed"
                                                            )}>
                                                                {uploading ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                ) : (
                                                                    <Upload className="w-4 h-4" />
                                                                )}
                                                                <span className="hidden sm:inline">{uploading ? 'Upload...' : 'Ajouter une photo'}</span>
                                                                <input
                                                                    type="file"
                                                                    className="hidden"
                                                                    accept="image/*"
                                                                    onChange={handleFileUpload}
                                                                    disabled={uploading}
                                                                />
                                                            </label>
                                                            <a href={`/app/rando/${currentHike.id}`} target="_blank" className="text-sm text-blue-600 hover:underline px-2 hidden sm:inline">
                                                                Voir fiche
                                                            </a>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                                        {loadingHikePhotos ? (
                                                            <p className="text-sm text-slate-500">Chargement...</p>
                                                        ) : hikePhotos.length === 0 ? (
                                                            <p className="text-sm text-slate-500 col-span-full italic py-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-200">
                                                                Aucune photo uploadée pour cette randonnée.
                                                            </p>
                                                        ) : (
                                                            hikePhotos.map(photo => (
                                                                <div key={photo.id} className="relative group aspect-square rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/5">
                                                                    <img src={(photo as any).publicUrl} className="w-full h-full object-cover" />
                                                                    {/* Overlay Actions */}
                                                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setCurrentHike({ ...currentHike, cover_image_url: (photo as any).publicUrl })}
                                                                            className="px-3 py-1.5 bg-white text-slate-900 text-xs font-bold rounded-full hover:bg-blue-50 transition-colors"
                                                                        >
                                                                            Définir couverture
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleDeletePhoto(photo.id, photo.storage_path)}
                                                                            className="p-2 text-white hover:text-red-400 transition-colors"
                                                                            title="Supprimer la photo"
                                                                        >
                                                                            <Trash className="w-5 h-5" />
                                                                        </button>
                                                                    </div>
                                                                    {/* Selected Indicator */}
                                                                    {currentHike.cover_image_url === (photo as any).publicUrl && (
                                                                        <div className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm">
                                                                            Couverture
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="p-8 text-center text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-200">
                                                    Enregistrez la randonnée pour ajouter des photos.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </form>
                            </div>

                            {/* Footer Actions */}
                            <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 rounded-b-2xl flex justify-end gap-3 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={() => document.getElementById('hikeForm')?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-lg shadow-blue-600/20"
                                >
                                    {isEditing ? 'Enregistrer les modifications' : 'Créer la randonnée'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Gallery Selector Modal */}
            <AnimatePresence>
                {isGalleryOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsGalleryOpen(false)}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-2xl z-10 h-[80vh] flex flex-col"
                        >
                            <div className="flex items-center justify-between mb-4 shrink-0">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                    Choisir une photo
                                </h2>
                                <button onClick={() => setIsGalleryOpen(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto min-h-0 p-1">
                                {loadingGallery ? (
                                    <div className="flex items-center justify-center h-full"><span className="text-slate-500">Chargement...</span></div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {galleryPhotos.map(photo => (
                                            <button
                                                key={photo.id}
                                                onClick={() => {
                                                    setCurrentHike({ ...currentHike, cover_image_url: photo.publicUrl })
                                                    setIsGalleryOpen(false)
                                                }}
                                                className="relative group aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 focus:outline-none focus:border-blue-500 transition-all bg-slate-100 dark:bg-slate-800"
                                            >
                                                <img src={photo.publicUrl} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Pagination */}
                            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-between shrink-0">
                                <span className="text-sm text-slate-500 dark:text-slate-400">
                                    Page {galleryPage + 1} sur {Math.ceil(totalGalleryPhotos / PHOTOS_PER_PAGE) || 1}
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => fetchGalleryPhotos(galleryPage - 1)}
                                        disabled={galleryPage === 0 || loadingGallery}
                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 transition-colors"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => fetchGalleryPhotos(galleryPage + 1)}
                                        disabled={(galleryPage + 1) * PHOTOS_PER_PAGE >= totalGalleryPhotos || loadingGallery}
                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 transition-colors"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </AdminLayout>
    )
}
