import { useState, useEffect } from 'react'
import { Menu, X, Mountain, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { LoginModal } from '@/components/auth/LoginModal'

export function Header() {
    const [isScrolled, setIsScrolled] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [loginModalOpen, setLoginModalOpen] = useState(false)

    // Auth hook
    const { user, profile, signOut } = useAuth()

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <>
            <header
                className={cn(
                    'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
                    isScrolled
                        ? 'bg-slate-950/80 backdrop-blur-md border-b border-white/10 py-4'
                        : 'bg-transparent py-6'
                )}
            >
                <div className="container mx-auto px-4 flex items-center justify-between">
                    <a href="/" className="flex items-center gap-2 group">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg group-hover:scale-105 transition-transform">
                            <Mountain className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                            Les Joyeux Marcheurs
                        </span>
                    </a>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-8">
                        {['Accueil', 'Calendrier', 'Galerie', 'Membres'].map((item) => (
                            <a
                                key={item}
                                href={`#${item.toLowerCase()}`}
                                className="text-sm font-medium text-slate-300 hover:text-white transition-colors relative group"
                            >
                                {item}
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-emerald-400 transition-all group-hover:w-full" />
                            </a>
                        ))}

                        {/* Admin Link */}
                        {profile?.role === 'admin' && (
                            <a
                                href="/admin"
                                className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors relative group"
                            >
                                Administration
                            </a>
                        )}

                        {/* Auth Buttons */}
                        {!user ? (
                            <button
                                onClick={() => setLoginModalOpen(true)}
                                className="px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium transition-colors border border-white/10"
                            >
                                Connexion
                            </button>
                        ) : (
                            <button
                                onClick={() => signOut()}
                                className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                Déconnexion
                            </button>
                        )}
                    </nav>

                    {/* Mobile Toggle */}
                    <button
                        className="md:hidden p-2 text-slate-300"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>

                {/* Mobile Nav */}
                {mobileMenuOpen && (
                    <div className="md:hidden absolute top-full left-0 right-0 bg-slate-950 border-b border-white/10 p-4 animate-in slide-in-from-top-5">
                        <nav className="flex flex-col gap-4">
                            {['Accueil', 'Calendrier', 'Galerie', 'Membres'].map((item) => (
                                <a
                                    key={item}
                                    href={`#${item.toLowerCase()}`}
                                    className="text-lg font-medium text-slate-300 hover:text-white"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {item}
                                </a>
                            ))}
                            {profile?.role === 'admin' && (
                                <a
                                    href="/admin"
                                    className="text-lg font-medium text-blue-400 hover:text-blue-300"
                                >
                                    Administration
                                </a>
                            )}
                            {!user ? (
                                <button
                                    onClick={() => {
                                        setMobileMenuOpen(false)
                                        setLoginModalOpen(true)
                                    }}
                                    className="w-full py-3 rounded-lg bg-blue-600 font-medium text-white"
                                >
                                    Connexion
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        setMobileMenuOpen(false)
                                        signOut()
                                    }}
                                    className="w-full py-3 rounded-lg bg-red-600/20 text-red-400 font-medium"
                                >
                                    Déconnexion
                                </button>
                            )}
                        </nav>
                    </div>
                )}
            </header>

            <LoginModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
        </>
    )
}
