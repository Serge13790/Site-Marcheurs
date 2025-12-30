import { motion } from 'framer-motion'
import { Calendar, MapPin, Clock, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Link } from 'react-router-dom'

export interface Hike {
    id: string
    title: string
    date: string
    location: string
    difficulty: string
    duration: string
    participants: number
    image: string
}

interface HikeCardProps {
    hike: Hike
    index: number
}

export function HikeCard({ hike, index }: HikeCardProps) {
    return (
        <Link to={`/hikes/${hike.id}`} className="block w-full">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group relative h-[400px] w-full overflow-hidden rounded-3xl bg-slate-200 cursor-pointer shadow-md hover:shadow-2xl hover:shadow-blue-900/20 hover:ring-1 hover:ring-white/50 transition-all duration-500"
            >
                {/* Background Image */}
                <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                    style={{ backgroundImage: `url(${hike.image})` }}
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-90" />

                {/* Content */}
                <div className="absolute inset-0 p-6 flex flex-col justify-end">
                    {/* Status Badge (Based on Date) */}
                    <div className="absolute top-6 right-6">
                        {new Date(hike.date) >= new Date(new Date().setHours(0, 0, 0, 0)) ? (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 backdrop-blur-md">
                                À venir
                            </span>
                        ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-500/50 text-slate-200 border border-white/10 backdrop-blur-md">
                                Passée
                            </span>
                        )}
                    </div>

                    {/* Badges */}
                    <div className="flex gap-2 mb-4 transform translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                        <span className={cn(
                            "px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md",
                            hike.difficulty === 'Facile' ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" :
                                hike.difficulty === 'Moyen' ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
                                    "bg-red-500/20 text-red-300 border border-red-500/30"
                        )}>
                            {hike.difficulty}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 backdrop-blur-md flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {hike.duration}
                        </span>
                    </div>

                    {/* Title & Info */}
                    <div className="transform transition-transform duration-300 group-hover:-translate-y-2">
                        <div className="flex items-center gap-2 text-slate-300 text-sm mb-2">
                            <Calendar className="w-4 h-4 text-blue-400" />
                            <span>{new Date(hike.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>

                        <h3 className="text-2xl font-bold text-white mb-2 leading-tight group-hover:text-blue-300 transition-colors">
                            {hike.title}
                        </h3>

                        <div className="flex items-center justify-between text-slate-400 text-sm">
                            <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                <span>{hike.location}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                <span>{hike.participants} inscrits</span>
                            </div>
                        </div>
                    </div>

                    {/* CTA Button (appears on hover) */}
                    <div className="absolute bottom-6 right-6 opacity-0 transform translate-x-10 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
                        <button className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-colors">
                            <MapPin className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </motion.div>
        </Link>
    )
}
