import { ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { LogOut, Mountain, Shield, Sun, Moon } from 'lucide-react'

interface MainLayoutProps {
    children: ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
    const { user, profile, signOut } = useAuth()
    const { theme, setTheme } = useTheme()

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
            <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                            <Mountain className="w-6 h-6" />
                        </div>
                        <span className="font-bold text-lg md:text-xl tracking-tight text-slate-900 dark:text-white truncate max-w-[200px] md:max-w-none">
                            Les Joyeux Marcheurs de Châteauneuf-le-Rouge
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Public Theme Switcher */}
                        <button
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
                        >
                            {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                        </button>

                        {user && (
                            <>
                                <div className="hidden md:flex flex-col items-end mr-2">
                                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                        {(profile?.first_name || profile?.last_name)
                                            ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
                                            : (profile?.display_name || user.email?.split('@')[0])}
                                    </span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">{profile?.role === 'admin' ? 'Administrateur' : profile?.role === 'editor' ? 'Éditeur' : 'Marcheur'}</span>
                                </div>
                                {(profile?.role === 'admin' || profile?.role === 'editor') && (
                                    <a
                                        href="/admin"
                                        className="hidden md:flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors border border-transparent hover:border-blue-100 dark:hover:border-blue-800"
                                    >
                                        <Shield className="w-4 h-4" />
                                        Admin
                                    </a>
                                )}
                                <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-700 hidden md:block"></div>
                                <button
                                    onClick={() => signOut()}
                                    className="flex items-center gap-2 px-3 py-2 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                                    title="Se déconnecter"
                                >
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <main className="flex-1 container mx-auto px-4 py-8">
                {children}
            </main>

            <footer className="w-full bg-slate-200 dark:bg-slate-900 border-t border-slate-300 dark:border-slate-800 py-4 text-center transition-colors duration-300">
                <div className="container mx-auto px-4 flex flex-col items-center gap-2">
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                        Copyright {new Date().getFullYear()} Joyeux marcheurs de Châteauneuf-le-rouge - Tous droits réservés
                    </p>
                    <div className="flex items-center gap-4">
                        <a href="/mentions-legales" className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:underline text-sm">
                            Mentions légales
                        </a>
                        <span className="text-slate-300 dark:text-slate-700">|</span>
                        <a href="mailto:contact@example.com" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline text-sm font-medium">
                            Écrire au webmestre
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    )
}
