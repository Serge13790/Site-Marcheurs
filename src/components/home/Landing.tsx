import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { X, Loader2, Sparkles, LogIn } from 'lucide-react'

export function Landing() {
    const { signInWithEmail } = useAuth()
    const [isLoginOpen, setIsLoginOpen] = useState(false)
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)
        try {
            await signInWithEmail(email)
            setMessage({ type: 'success', text: 'Lien envoyé ! Vérifiez vos emails (et spams).' })
            setEmail('')
        } catch (error: any) {
            console.error(error)
            let errorMsg = 'Erreur lors de l\'envoi.'
            if (error.message?.includes('Rate limit')) errorMsg = 'Trop de tentatives. Attendez 60s.'
            else if (error.message) errorMsg = error.message

            setMessage({ type: 'error', text: errorMsg })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="relative h-screen w-full overflow-hidden bg-slate-900">
            {/* Background Panorama */}
            <div
                className="absolute inset-0 bg-[url('/panorama.jpg')] bg-cover bg-center"
            >
                <div className="absolute inset-0 bg-black/40"></div>
            </div>

            {/* Content Centered */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 font-serif tracking-tight drop-shadow-lg">
                        Les Joyeux Marcheurs
                    </h1>
                    <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-2xl mx-auto font-light drop-shadow-md">
                        Découvrez la Provence à travers nos randonnées conviviales.
                        Rejoignez le club de Châteauneuf-le-Rouge.
                    </p>

                    <button
                        onClick={() => setIsLoginOpen(true)}
                        className="group relative px-8 py-4 bg-white text-slate-900 rounded-full text-lg font-bold hover:bg-slate-100 hover:scale-105 transition-all shadow-xl shadow-black/20 flex items-center gap-2 mx-auto overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <span className="relative flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-blue-600" />
                            Accéder à l'Espace Membre
                        </span>
                    </button>

                </motion.div>
            </div>

            {/* Absolute Footer */}
            <footer className="absolute bottom-0 w-full p-4 text-center text-white/60 text-xs z-10 flex flex-col md:flex-row gap-2 md:gap-8 justify-center items-center">
                <p>Copyright © {new Date().getFullYear()} Joyeux marcheurs de Châteauneuf-le-rouge - Tous droits réservés</p>
                <a href="/mentions-legales" className="hover:text-white transition-colors underline">Mentions Légales</a>
                <a href="mailto:joyeuxmarcheurs@nazarian.ovh" className="hover:text-white transition-colors">Contact Webmestre</a>
            </footer>

            {/* Login Modal */}
            <AnimatePresence>
                {isLoginOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsLoginOpen(false)}
                            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                        />

                        {/* Modal Card */}
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 z-10 border border-white/10"
                        >
                            <button
                                onClick={() => setIsLoginOpen(false)}
                                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-100 rounded-full"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="text-center mb-8">
                                <h3 className="text-2xl font-bold text-slate-900 mb-2 font-serif">Espace Membre</h3>
                                <p className="text-slate-500 text-sm">
                                    Connexion sécurisée sans mot de passe (Magic Link).<br />
                                    <span className="text-orange-600 font-medium text-xs">
                                        (Inscription soumise à validation du webmestre)
                                    </span>
                                </p>
                            </div>

                            <form onSubmit={handleLogin} className="space-y-4">
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1 text-left">
                                        Email
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400"
                                        placeholder="votre@email.com"
                                        required
                                        autoFocus
                                    />
                                </div>

                                {message && (
                                    <div className={`p-4 rounded-xl text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                                        }`}>
                                        {message.text}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-600/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Envoi en cours...
                                        </>
                                    ) : (
                                        <>
                                            <LogIn className="w-5 h-5" />
                                            Recevoir mon lien de connexion
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="mt-6 text-center bg-slate-50 p-4 rounded-xl">
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    <strong>Votre session reste active</strong> jusqu'à ce que vous vous déconnectiez.
                                </p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
