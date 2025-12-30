import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, Maximize2, Loader2, ImageOff, Play, Pause } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface GalleryPhoto {
    id: string
    storage_path: string
    caption?: string
    aspect?: string // Optional, computed or stored? for now let's random or standard
}

interface GalleryGridProps {
    hikeId?: string
}

export function GalleryGrid({ hikeId }: GalleryGridProps) {
    const [images, setImages] = useState<GalleryPhoto[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedImage, setSelectedImage] = useState<number | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)

    useEffect(() => {
        fetchPhotos()
    }, [hikeId])

    useEffect(() => {
        let interval: NodeJS.Timeout
        if (isPlaying && selectedImage !== null) {
            interval = setInterval(() => {
                setSelectedImage(prev => (prev === null || prev === images.length - 1) ? 0 : prev + 1)
            }, 3000)
        }
        return () => clearInterval(interval)
    }, [isPlaying, selectedImage, images.length])

    // Stop slideshow when closing modal
    useEffect(() => {
        if (selectedImage === null) {
            setIsPlaying(false)
        }
    }, [selectedImage])

    async function fetchPhotos() {
        try {
            let query = supabase
                .from('photos')
                .select('*')
                .order('created_at', { ascending: false })

            if (hikeId) {
                query = query.eq('hike_id', hikeId)
            }

            const { data, error } = await query

            if (error) throw error

            // Construct full URLs
            const formattedImages = data.map((photo: any) => {
                // Assuming storage_path is the path in 'photos' bucket
                const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(photo.storage_path)
                return {
                    id: photo.id,
                    storage_path: publicUrl,
                    caption: photo.caption,
                    aspect: Math.random() > 0.5 ? "aspect-[4/3]" : "aspect-[3/4]" // Random aspect for masonry effect (simulated)
                }
            })

            setImages(formattedImages)
        } catch (error) {
            console.error('Error fetching photos:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleNext = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation()
        setSelectedImage(prev => (prev === null || prev === images.length - 1) ? 0 : prev + 1)
    }, [images.length])

    const handlePrev = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation()
        setSelectedImage(prev => (prev === null || prev === 0) ? images.length - 1 : prev - 1)
    }, [images.length])

    const togglePlay = (e: React.MouseEvent) => {
        e.stopPropagation()
        setIsPlaying(!isPlaying)
    }

    if (loading) {
        return <div className="py-12 flex justify-center text-slate-500"><Loader2 className="animate-spin" /></div>
    }

    if (images.length === 0) {
        if (hikeId) return null // Hide if empty in detail view
        return (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                <ImageOff className="w-12 h-12 mb-4" />
                <p>Aucune photo pour le moment.</p>
            </div>
        )
    }

    return (
        <section className={hikeId ? "py-8" : "py-24 bg-white"} id="galerie">
            <div className="container mx-auto px-4">
                {!hikeId && (
                    <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                        <div className="max-w-xl">
                            <h2 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-4 font-serif">
                                Galerie Photo
                            </h2>
                            <p className="text-slate-600 text-lg font-serif">
                                Nos meilleurs souvenirs capturés sur le vif. Partagez l'émotion des sommets.
                            </p>
                        </div>
                    </div>
                )}

                {/* Masonry Grid (CSS Columns) */}
                <div className="columns-1 md:columns-2 lg:columns-4 gap-4 space-y-4">
                    {images.map((img, index) => (
                        <motion.div
                            key={img.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            viewport={{ once: true }}
                            className="break-inside-avoid relative group cursor-pointer overflow-hidden rounded-2xl"
                            onClick={() => setSelectedImage(index)}
                        >
                            <img
                                src={img.storage_path}
                                alt={img.caption || `Souvenir ${index + 1}`}
                                className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${img.aspect}`}
                                loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Maximize2 className="text-white w-8 h-8 drop-shadow-lg" />
                            </div>
                            {img.caption && (
                                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                    {img.caption}
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Lightbox Modal */}
            <AnimatePresence>
                {selectedImage !== null && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
                        onClick={() => setSelectedImage(null)}
                    >
                        {/* Toolbar */}
                        <div className="absolute top-4 right-4 flex items-center gap-4 z-50">
                            <button
                                className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-colors flex items-center gap-2"
                                onClick={togglePlay}
                            >
                                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 pl-0.5" />}
                                <span className="text-sm font-medium hidden md:inline">{isPlaying ? 'Pause' : 'Diaporama'}</span>
                            </button>
                            <button
                                className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-colors"
                                onClick={() => setSelectedImage(null)}
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <button
                            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-white/50 hover:text-white transition-colors hover:bg-white/10 rounded-full"
                            onClick={handlePrev}
                        >
                            <ChevronLeft className="w-8 h-8" />
                        </button>

                        <motion.img
                            key={selectedImage}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            src={images[selectedImage].storage_path}
                            alt="Vue en plein écran"
                            className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />

                        <button
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white/50 hover:text-white transition-colors hover:bg-white/10 rounded-full"
                            onClick={handleNext}
                        >
                            <ChevronRight className="w-8 h-8" />
                        </button>

                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/70 font-medium bg-black/50 px-4 py-2 rounded-full backdrop-blur-md">
                            {selectedImage + 1} / {images.length}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    )
}
