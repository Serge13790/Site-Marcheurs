
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, CheckCircle, XCircle, Shield, User, X, MapPin, Phone, Calendar, Mail } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { AdminLayout } from './AdminLayout'
import { useAuth } from '@/contexts/AuthContext'

interface Profile {
    id: string
    email: string
    full_name: string // composite or display_name fallback
    first_name?: string
    last_name?: string
    address?: string
    address_complement?: string
    postal_code?: string
    city?: string
    phone_mobile?: string
    phone_fixed?: string
    role: 'admin' | 'editor' | 'walker'
    approved: boolean
    created_at: string
}

export function AdminUsers() {
    const [profiles, setProfiles] = useState<Profile[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState<'all' | 'pending' | 'admin'>('all')
    const [selectedUser, setSelectedUser] = useState<Profile | null>(null)

    useEffect(() => {
        fetchProfiles()
    }, [])

    const fetchProfiles = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setProfiles(data || [])
        } catch (error) {
            console.error('Error fetching profiles:', error)
        } finally {
            setLoading(false)
        }
    }

    const toggleApproval = async (profile: Profile) => {
        try {
            const newStatus = !profile.approved

            // Optimistic update
            const updatedProfiles = profiles.map(p =>
                p.id === profile.id ? { ...p, approved: newStatus } : p
            )
            setProfiles(updatedProfiles)

            // Also update selectedUser if it's the one being modified
            if (selectedUser?.id === profile.id) {
                setSelectedUser({ ...selectedUser, approved: newStatus })
            }

            const { error } = await supabase
                .from('profiles')
                .update({ approved: newStatus })
                .eq('id', profile.id)

            if (error) throw error

            // TODO: Here we would trigger an email notification
            if (newStatus) {
                console.log(`Sending approval email to ${profile.email}...`)
            }

        } catch (error) {
            console.error('Error updating profile:', error)
            fetchProfiles() // Revert on error
        }
    }

    const updateRole = async (id: string, newRole: Profile['role']) => {
        try {
            // Optimistic update
            setProfiles(profiles.map(p =>
                p.id === id ? { ...p, role: newRole } : p
            ))

            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', id)

            if (error) throw error
        } catch (error) {
            console.error('Error updating role:', error)
            fetchProfiles()
        }
    }

    const filteredProfiles = profiles.filter(profile => {
        const matchesSearch = (profile.full_name?.toLowerCase() || '').includes(search.toLowerCase()) ||
            (profile.email?.toLowerCase() || '').includes(search.toLowerCase())

        if (filter === 'pending') return matchesSearch && !profile.approved
        if (filter === 'admin') return matchesSearch && (profile.role === 'admin' || profile.role === 'editor')
        return matchesSearch
    })

    const { profile } = useAuth()

    if (profile?.role !== 'admin') {
        return (
            <AdminLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
                    <Shield className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Accès Restreint</h2>
                    <p className="text-slate-500 dark:text-slate-400 max-w-md">
                        Vous devez être administrateur afin de pouvoir accéder à cette page.
                    </p>
                </div>
            </AdminLayout>
        )
    }

    return (
        <AdminLayout>
            <div className="max-w-6xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2 font-serif">Gestion des Utilisateurs</h1>
                    <p className="text-slate-600 dark:text-slate-400">Validez les nouveaux comptes et gérez les rôles.</p>
                </motion.div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
                                <User className="w-6 h-6" />
                            </div>
                            <span className="text-2xl font-bold text-slate-800 dark:text-white">{profiles.length}</span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Utilisateurs total</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl">
                                <CheckCircle className="w-6 h-6" />
                            </div>
                            <span className="text-2xl font-bold text-slate-800 dark:text-white">
                                {profiles.filter(p => !p.approved).length}
                            </span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">En attente de validation</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
                                <Shield className="w-6 h-6" />
                            </div>
                            <span className="text-2xl font-bold text-slate-800 dark:text-white">
                                {profiles.filter(p => p.role === 'admin' || p.role === 'editor').length}
                            </span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Administrateurs & Éditeurs</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Rechercher un utilisateur..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                        />
                    </div>
                    <div className="flex gap-2 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                        >
                            Tous
                        </button>
                        <button
                            onClick={() => setFilter('pending')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${filter === 'pending' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                        >
                            En attente
                            {profiles.some(p => !p.approved) && (
                                <span className="w-2 h-2 rounded-full bg-amber-500" />
                            )}
                        </button>
                        <button
                            onClick={() => setFilter('admin')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'admin' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                        >
                            Staff
                        </button>
                    </div>
                </div>

                {/* Users List */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-400">Utilisateur</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-400">Rôle</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-400">Statut</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-400">Date d'inscription</th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600 dark:text-slate-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                <AnimatePresence mode='popLayout'>
                                    {filteredProfiles.map((profile) => (
                                        <motion.tr
                                            key={profile.id}
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                                                        {profile.full_name?.charAt(0).toUpperCase() || <User className="w-5 h-5" />}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-slate-900 dark:text-white">
                                                            {profile.full_name || (profile.first_name || profile.last_name ? `${profile.first_name || ''} ${profile.last_name || ''}` : 'Sans nom')}
                                                        </div>
                                                        <div className="text-sm text-slate-500 dark:text-slate-400">{profile.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <select
                                                    value={profile.role}
                                                    onChange={(e) => updateRole(profile.id, e.target.value as any)}
                                                    className="bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-blue-500 text-slate-900 dark:text-slate-200"
                                                >
                                                    <option value="walker" className="dark:bg-slate-900">Marcheur</option>
                                                    <option value="editor" className="dark:bg-slate-900">Éditeur</option>
                                                    <option value="admin" className="dark:bg-slate-900">Admin</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${profile.approved
                                                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400'
                                                    : 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400'
                                                    }`}>
                                                    {profile.approved ? 'Validé' : 'En attente'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                                                {new Date(profile.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => toggleApproval(profile)}
                                                        className={`p-2 rounded-lg transition-colors ${profile.approved
                                                            ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                                                            : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 bg-emerald-50/50 dark:bg-emerald-900/10'
                                                            }`}
                                                        title={profile.approved ? "Révoquer l'accès" : "Valider le compte"}
                                                    >
                                                        {profile.approved ? <XCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                                                    </button>
                                                    <button
                                                        onClick={() => setSelectedUser(profile)}
                                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                        title="Voir détails"
                                                    >
                                                        <Search className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                            Chargement des utilisateurs...
                        </div>
                    ) : filteredProfiles.length === 0 && (
                        <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                            Aucun utilisateur trouvé.
                        </div>
                    )}
                </div>

                {/* User Detail Modal */}
                <AnimatePresence>
                    {selectedUser && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setSelectedUser(null)}
                                className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden z-10 border border-slate-200 dark:border-slate-800"
                            >
                                {/* Header */}
                                <div className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 p-6 flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                                            {selectedUser.first_name?.charAt(0).toUpperCase() || <User className="w-8 h-8" />}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                                                {selectedUser.full_name || (selectedUser.first_name || selectedUser.last_name ? `${selectedUser.first_name || ''} ${selectedUser.last_name || ''}` : 'Utilisateur')}
                                            </h3>
                                            <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-1">
                                                <Mail className="w-3 h-3" /> {selectedUser.email}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedUser(null)}
                                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="p-6 space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Adresse</label>
                                            <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                                                <MapPin className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <p>{selectedUser.address || 'Non renseigné'}</p>
                                                    {selectedUser.address_complement && <p className="text-sm text-slate-500">{selectedUser.address_complement}</p>}
                                                    <p>{selectedUser.postal_code} {selectedUser.city}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Téléphone</label>
                                            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                                <Phone className="w-4 h-4 text-slate-400" />
                                                <span>{selectedUser.phone_mobile || selectedUser.phone_fixed || 'Non renseigné'}</span>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Inscrit le</label>
                                            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                                <Calendar className="w-4 h-4 text-slate-400" />
                                                <span>{new Date(selectedUser.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                                        <h4 className="font-semibold text-slate-800 dark:text-white mb-2">Statut du compte</h4>
                                        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                                            <div className="flex items-center gap-2">
                                                {selectedUser.approved ? (
                                                    <CheckCircle className="w-6 h-6 text-emerald-500" />
                                                ) : (
                                                    <Shield className="w-6 h-6 text-amber-500" />
                                                )}
                                                <div>
                                                    <p className="font-medium text-slate-900 dark:text-white">
                                                        {selectedUser.approved ? 'Compte validé' : 'En attente de validation'}
                                                    </p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                        {selectedUser.approved
                                                            ? 'L\'utilisateur a accès à l\'espace membre.'
                                                            : 'L\'accès est restreint.'}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => toggleApproval(selectedUser)}
                                                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${selectedUser.approved
                                                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-900/50'
                                                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20'
                                                    }`}
                                            >
                                                {selectedUser.approved ? 'Révoquer' : 'Valider l\'inscription'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </AdminLayout>
    )

}
