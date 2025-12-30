import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Image, Trash2, MapPin, User, AlertTriangle, Loader } from 'lucide-react'
import { AdminLayout } from './AdminLayout'
import { supabase } from '@/lib/supabase'

export function AdminPhotos() {
    const [photos, setPhotos] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [photoToDelete, setPhotoToDelete] = useState<any | null>(null)

    useEffect(() => {
        fetchPhotos()
    }, [])

    async function fetchPhotos() {
        try {
            const { data, error } = await supabase
                .from('photos')
                .select(`
                    *,
                    profiles:user_id (first_name, last_name, display_name, email),
                    hikes:hike_id (title)
                `)
                .order('created_at', { ascending: false })
                .not('user_id', 'is', null) // Exclude migration/orphan photos

            if (error) throw error

            // Filter out photos where profile could not be joined (deleted users)
            const validPhotos = (data || []).filter(p => p.profiles)
            setPhotos(validPhotos)
        } catch (error) {
            console.error("Error fetching photos:", error)
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete(photo: any) {
        try {
            // 1. Delete from Storage
            const { error: storageError } = await supabase.storage
                .from('photos')
                .remove([photo.storage_path])

            if (storageError) {
                console.error("Error deleting from storage", storageError)
                alert("Erreur lors de la suppression du fichier image.")
                return
            }

            // 2. Delete from Database (Row)
            const { error: dbError } = await supabase
                .from('photos')
                .delete()
                .eq('id', photo.id)

            if (dbError) throw dbError

            // UI Update
            setPhotos(photos.filter(p => p.id !== photo.id))
            setPhotoToDelete(null)

        } catch (error) {
            console.error("Error deleting photo:", error)
            alert("Erreur lors de la suppression en base de données.")
        }
    }

    function getAuthorName(profile: any) {
        if (!profile) return 'Utilisateur inconnu'
        if (profile.first_name || profile.last_name) {
            return `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
        }
        return profile.display_name || profile.email
    }

    // Reconstruction de l'URL publique
    const getPhotoUrl = (path: string) => {
        const { data } = supabase.storage.from('photos').getPublicUrl(path)
        return data.publicUrl
    }

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-96">
                    <Loader className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            </AdminLayout>
        )
    }

    return (
        <AdminLayout>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2 font-serif">Gestion des Photos</h1>
                <p className="text-slate-500 dark:text-slate-400">
                    Visualisez et modérez les photos ajoutées par les membres ({photos.length} photos).
                </p>
            </div>

            {photos.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <Image className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">Aucune photo n'a encore été postée.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <AnimatePresence>
                        {photos.map((photo) => (
                            <motion.div
                                key={photo.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all"
                            >
                                {/* Image Container */}
                                <div className="aspect-square relative bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                    <img
                                        src={getPhotoUrl(photo.storage_path)}
                                        alt="Post"
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        loading="lazy"
                                    />

                                    {/* Overlay Actions */}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4">
                                        <a
                                            href={getPhotoUrl(photo.storage_path)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 bg-white/20 hover:bg-white/40 text-white rounded-full backdrop-blur-sm transition-colors"
                                            title="Voir en grand"
                                        >
                                            <Image className="w-5 h-5" />
                                        </a>
                                        <button
                                            onClick={() => setPhotoToDelete(photo)}
                                            className="p-2 bg-red-500/80 hover:bg-red-600 text-white rounded-full backdrop-blur-sm transition-colors"
                                            title="Supprimer"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="p-4">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 font-medium truncate">
                                            <User className="w-3 h-3 flex-shrink-0" />
                                            <span className="truncate" title={getAuthorName(photo.profiles)}>
                                                {getAuthorName(photo.profiles)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500 mb-3 truncate">
                                        <MapPin className="w-3 h-3 flex-shrink-0" />
                                        <span className="truncate" title={photo.hikes?.title || 'Rando inconnue'}>
                                            {photo.hikes?.title || 'Rando supprimée'}
                                        </span>
                                    </div>

                                    <div className="text-xs text-slate-400">
                                        {new Date(photo.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* DELETE MODAL */}
            {photoToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setPhotoToDelete(null)}
                    ></div>

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-sm w-full relative z-10 overflow-hidden"
                    >
                        <div className="p-6 text-center">
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Supprimer cette photo ?</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                                Cette action est irréversible et retirera la photo de la galerie publique.
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setPhotoToDelete(null)}
                                    className="flex-1 py-2.5 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={() => handleDelete(photoToDelete)}
                                    className="flex-1 py-2.5 px-4 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
                                >
                                    Supprimer
                                </button>
                            </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-950/50 p-4 border-t border-slate-100 dark:border-slate-800 flex justify-center">
                            <img
                                src={getPhotoUrl(photoToDelete.storage_path)}
                                alt="Thumbnail"
                                className="h-16 w-16 object-cover rounded-lg border border-slate-200 dark:border-slate-700 opacity-60"
                            />
                        </div>
                    </motion.div>
                </div>
            )}
        </AdminLayout>
    )
}
