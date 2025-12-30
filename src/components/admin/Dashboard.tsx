
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Users, Calendar, Image, User, ArrowRight } from 'lucide-react'
import { AdminLayout } from './AdminLayout'
import { supabase } from '@/lib/supabase'

export function Dashboard() {
    const [stats, setStats] = useState({
        members: 0,
        pendingMembers: 0,
        hikes: 0,
        photos: 0
    })
    const [recentUsers, setRecentUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchStats() {
            try {
                // Fetch counts
                const { count: membersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
                const { count: pendingCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('approved', false)
                const { count: hikesCount } = await supabase.from('hikes').select('*', { count: 'exact', head: true })
                const { count: photosCount } = await supabase.from('photos').select('*', { count: 'exact', head: true })

                // Fetch recent users
                const { data: recentData } = await supabase
                    .from('profiles')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(5)

                setStats({
                    members: membersCount || 0,
                    pendingMembers: pendingCount || 0,
                    hikes: hikesCount || 0,
                    photos: photosCount || 0
                })
                setRecentUsers(recentData || [])
            } catch (e) {
                console.error("Error fetching admin stats", e)
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [])

    const statCards = [
        { label: 'Membres Total', value: stats.members, icon: Users, color: 'blue', sub: `${stats.pendingMembers} en attente` },
        { label: 'Randonnées', value: stats.hikes, icon: Calendar, color: 'emerald', sub: 'Planifiées & Passées' },
        { label: 'Photos', value: stats.photos, icon: Image, color: 'purple', sub: 'Dans la galerie' },
        // { label: 'Visites', value: 'N/A', icon: TrendingUp, color: 'amber', sub: 'Non suivi' }, // Removed specific tracking for now
    ]

    return (
        <AdminLayout>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2 font-serif">Tableau de bord</h1>
                <p className="text-slate-500 dark:text-slate-400">Bienvenue dans l'espace d'administration des Joyeux Marcheurs.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {statCards.map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl relative overflow-hidden group hover:shadow-lg transition-all"
                    >
                        <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-${stat.color}-500`}>
                            <stat.icon className="w-16 h-16" />
                        </div>

                        <div className={`w-12 h-12 rounded-xl bg-${stat.color}-50 dark:bg-${stat.color}-900/20 flex items-center justify-center mb-4 text-${stat.color}-600 dark:text-${stat.color}-400`}>
                            <stat.icon className="w-6 h-6" />
                        </div>

                        <div className="flex items-end gap-2 mb-1">
                            {loading ? (
                                <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 animate-pulse rounded"></div>
                            ) : (
                                <span className="text-3xl font-bold text-slate-800 dark:text-white">{stat.value}</span>
                            )}
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 font-medium">{stat.label}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{stat.sub}</p>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Registrations */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Inscriptions Récentes</h2>
                        <Link to="/admin/users" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1 group">
                            Tout voir <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    <div className="space-y-4">
                        {loading ? (
                            [1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-50 dark:bg-slate-800 animate-pulse rounded-xl"></div>)
                        ) : recentUsers.length > 0 ? (
                            recentUsers.map((user) => (
                                <div key={user.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/50 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold shadow-sm">
                                            {(user.first_name || user.full_name || '').charAt(0).toUpperCase() || <User className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <h4 className="text-slate-900 dark:text-white font-medium">
                                                {user.full_name || (user.first_name || user.last_name ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'Inconnu')}
                                            </h4>
                                            <p className="text-slate-500 dark:text-slate-400 text-xs">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${user.approved
                                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30'
                                            : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30'
                                            }`}>
                                            {user.approved ? 'Validé' : 'En attente'}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-slate-500 dark:text-slate-400 text-center py-8">Aucune inscription récente.</p>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm h-fit">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Actions Rapides</h2>
                    <div className="space-y-3">
                        <Link to="/admin/hikes" className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 group">
                            <Calendar className="w-4 h-4" />
                            <span className="group-hover:translate-x-0.5 transition-transform">Gérer les randos</span>
                        </Link>
                        <Link to="/admin/photos" className="w-full py-3 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2">
                            <Image className="w-4 h-4" />
                            Photos
                        </Link>
                        <Link to="/admin/users" className="w-full py-3 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2">
                            <Users className="w-4 h-4" />
                            Valider les inscrits
                        </Link>
                    </div>
                </div>
            </div>
        </AdminLayout>
    )
}
