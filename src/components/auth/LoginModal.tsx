import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { X } from 'lucide-react'

interface LoginModalProps {
    isOpen: boolean
    onClose: () => void
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
    const [email, setEmail] = useState('')
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const { signInWithEmail } = useAuth()

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setStatus('loading')
        try {
            await signInWithEmail(email)
            setStatus('success')
        } catch (error) {
            console.error(error)
            setStatus('error')
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white text-slate-900 p-8 rounded-lg shadow-xl max-w-md w-full relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                >
                    <X className="w-6 h-6" />
                </button>

                <h2 className="text-2xl font-serif font-bold text-center mb-6 text-slate-800">
                    Connexion - Les Joyeux Marcheurs
                </h2>

                {status === 'success' ? (
                    <div className="text-center space-y-4">
                        <div className="text-emerald-600 font-medium">Lien de connexion envoyé !</div>
                        <p className="text-slate-600">Vérifiez votre boîte mail ({email}).</p>
                        <button
                            onClick={onClose}
                            className="w-full py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-serif"
                        >
                            Fermer
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                placeholder="votre@email.com"
                            />
                        </div>

                        {status === 'error' && (
                            <div className="text-red-500 text-sm text-center">Une erreur est survenue. Réessayez.</div>
                        )}

                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors font-serif disabled:opacity-50"
                        >
                            {status === 'loading' ? 'Envoi...' : 'Recevoir le lien magique'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}
