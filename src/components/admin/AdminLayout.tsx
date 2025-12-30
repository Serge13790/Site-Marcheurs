import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { LayoutDashboard, Map, Users, LogOut, Menu, X, Mountain, Loader2, Sun, Moon, Monitor, ArrowLeft, Image } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'

interface AdminLayoutProps {
    children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const { user, profile, loading, signOut } = useAuth()
    const { theme, setTheme } = useTheme()
    const navigate = useNavigate()
    const location = useLocation()

    useEffect(() => {
        if (!loading) {
            if (!user) {
                navigate('/')
            } else if (profile?.role !== 'admin' && profile?.role !== 'editor') {
                navigate('/')
            }
        }
    }, [user, profile, loading, navigate])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        )
    }

    if (!user || (profile?.role !== 'admin' && profile?.role !== 'editor')) {
        return null
    }

    const menuItems = [
        { icon: LayoutDashboard, label: 'Tableau de bord', path: '/admin' },
        { icon: Map, label: 'Randonnées', path: '/admin/hikes' },
        ...(profile?.role === 'admin' ? [{ icon: Users, label: 'Membres', path: '/admin/users' }] : []),
        { icon: Image, label: 'Photos', path: '/admin/photos' },
    ]

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
            {/* Sidebar */}
            <motion.aside
                initial={{ width: 280 }}
                animate={{ width: sidebarOpen ? 280 : 80 }}
                className="bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col fixed h-full z-20 transition-all duration-300 shadow-sm"
            >
                <div className="p-6 flex items-center justify-between">
                    {sidebarOpen && (
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-blue-600 rounded-lg shadow-md shadow-blue-600/20">
                                <Mountain className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-bold text-slate-800 dark:text-white tracking-tight text-lg">Admin</span>
                        </div>
                    )}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>

                <nav className="flex-1 px-4 py-8 space-y-2">
                    {menuItems.map((item) => (
                        <button
                            key={item.label}
                            onClick={() => navigate(item.path)}
                            className={cn(
                                "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group relative",
                                location.pathname === item.path
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                            )}
                        >
                            <item.icon className={cn("w-5 h-5 min-w-[20px]", location.pathname === item.path ? "text-white" : "text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400")} />
                            {sidebarOpen && (
                                <span className="font-medium whitespace-nowrap overflow-hidden">
                                    {item.label}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    {/* Theme Switcher */}
                    {sidebarOpen ? (
                        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg mb-4">
                            {(['light', 'dark', 'system'] as const).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTheme(t)}
                                    className={cn(
                                        "flex-1 flex items-center justify-center p-1.5 rounded-md transition-all text-slate-500",
                                        theme === t ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm" : "hover:text-slate-900 dark:hover:text-white"
                                    )}
                                    title={t === 'light' ? 'Clair' : t === 'dark' ? 'Sombre' : 'Système'}
                                >
                                    {t === 'light' && <Sun className="w-4 h-4" />}
                                    {t === 'dark' && <Moon className="w-4 h-4" />}
                                    {t === 'system' && <Monitor className="w-4 h-4" />}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <button
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="w-full flex items-center justify-center p-3 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                        >
                            {theme === 'light' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>
                    )}

                    <button
                        onClick={() => navigate('/')}
                        className="w-full flex items-center gap-3 p-3 text-slate-500 dark:text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition-colors group"
                        title="Retour au site"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:translate-x-[-2px] transition-transform" />
                        {sidebarOpen && <span className="font-medium">Retour au site</span>}
                    </button>

                    <button
                        onClick={() => signOut()}
                        className="w-full flex items-center gap-3 p-3 text-slate-500 dark:text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors group"
                        title="Déconnexion"
                    >
                        <LogOut className="w-5 h-5 group-hover:text-red-500" />
                        {sidebarOpen && <span className="font-medium">Déconnexion</span>}
                    </button>
                </div>
            </motion.aside>

            {/* Main Content */}
            <main className={cn(
                "flex-1 transition-all duration-300 p-8",
                sidebarOpen ? "ml-[280px]" : "ml-[80px]"
            )}>
                {children}
            </main>
        </div>
    )
}

