import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Hike, HikeCard } from './HikeCard'

export function HikesList() {
    const [hikes, setHikes] = useState<Hike[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchHikes()
    }, [])

    async function fetchHikes() {
        try {
            const { data, error } = await supabase
                .from('hikes')
                .select('*')
                .order('date', { ascending: false }) // Sort by newest first

            if (error) {
                console.error('Error fetching hikes:', error)
            } else if (data) {
                // Map Supabase data to compatible Hike interface if needed
                // Currently assuming db columns match Hike interface roughly or we adapt here
                // Note: DB has 'cover_image_url' but interface has 'image'
                const formattedHikes: Hike[] = data
                    .filter((h: any) => h.status !== 'draft') // Hide drafts from public view
                    .map((h: any) => ({
                        id: h.id,
                        title: h.title,
                        date: h.date, // Keep ISO string for easy comparison
                        location: h.location || 'Lieu non précisé',
                        difficulty: h.difficulty || 'Moyen',
                        duration: h.duration || 'N/A',
                        participants: h.participants_count || 0,
                        image: h.cover_image_url || 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&q=80&w=800'
                    }))
                setHikes(formattedHikes)
            }
        } catch (e) {
            console.error('Exception fetching hikes:', e)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return <div className="py-12 text-center font-serif text-slate-500">Chargement des randonnées...</div>
    }

    if (hikes.length === 0) {
        return (
            <section id="calendrier" className="text-center py-12 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="container mx-auto px-4">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Nos Randonnées</h2>
                    <p className="text-slate-500">Aucune randonnée prévue pour le moment.</p>
                </div>
            </section>
        )
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const upcomingHikes = hikes.filter(h => new Date(h.date) >= today)
    const pastHikes = hikes.filter(h => new Date(h.date) < today)

    return (
        <section id="calendrier" className="scroll-mt-24">
            <div className="">
                {/* Upcoming Hikes */}
                <div className="mb-16">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-6">
                        <div className="max-w-xl">
                            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                                Prochaines Sorties
                            </h2>
                            <p className="text-slate-500 text-lg">
                                Préparez vos chaussures ! Voici les randonnées à venir.
                            </p>
                        </div>
                    </div>

                    {upcomingHikes.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {upcomingHikes.map((hike, index) => (
                                <HikeCard key={hike.id} hike={hike} index={index} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-500 italic">Aucune randonnée à venir pour le moment.</p>
                    )}
                </div>

                {/* Archives */}
                {pastHikes.length > 0 && (
                    <div id="archives" className="scroll-mt-24">
                        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-6">
                            <div className="max-w-xl">
                                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                                    Archives
                                </h2>
                                <p className="text-slate-500">
                                    Souvenirs de nos précédentes aventures.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {pastHikes.map((hike, index) => (
                                <HikeCard key={hike.id} hike={hike} index={index} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </section>
    )
}
