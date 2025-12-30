import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Save, User, MapPin, Phone } from 'lucide-react'

export function ProfileCompletion() {
    const { user, profile } = useAuth()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        first_name: profile?.first_name || '',
        last_name: profile?.last_name || '',
        address: profile?.address || '',
        address_complement: profile?.address_complement || '',
        postal_code: profile?.postal_code || '',
        city: profile?.city || '',
        phone_mobile: profile?.phone_mobile || '',
        phone_fixed: profile?.phone_fixed || ''
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const validateForm = () => {
        const errors: string[] = []

        // Postal Code: 5 digits
        if (!/^\d{5}$/.test(formData.postal_code)) {
            errors.push("Le code postal doit contenir exactement 5 chiffres.")
        }

        // City: No numbers (basic check, allows hyphen/space/apostrophe)
        if (/\d/.test(formData.city)) {
            errors.push("La ville ne doit pas contenir de chiffres.")
        }

        // Mobile Phone: 10 digits (French format mostly, but let's stick to 10 digits clean)
        // We clean spaces/dots/dashes before check
        const cleanMobile = formData.phone_mobile.replace(/[\s.-]/g, '')
        if (!/^\d{10}$/.test(cleanMobile)) {
            errors.push("Le numéro de portable doit contenir 10 chiffres.")
        }

        // Fixed Phone: 10 digits if provided
        if (formData.phone_fixed) {
            const cleanFixed = formData.phone_fixed.replace(/[\s.-]/g, '')
            if (!/^\d{10}$/.test(cleanFixed)) {
                errors.push("Le numéro fixe doit contenir 10 chiffres.")
            }
        }

        return errors
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const errors = validateForm()
        if (errors.length > 0) {
            alert(errors.join('\n'))
            return
        }

        setLoading(true)
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    ...formData,
                    is_profile_completed: true,
                })
                .eq('id', user?.id)

            if (error) throw error
            window.location.reload()
        } catch (error) {
            console.error('Error updating profile:', error)
            alert("Erreur lors de la mise à jour du profil.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex justify-center items-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-slate-100"
            >
                <div className="text-center">
                    <h2 className="mt-2 text-3xl font-bold text-slate-900 font-serif">Finaliser votre inscription</h2>
                    <p className="mt-2 text-sm text-slate-500">
                        Pour valider votre adhésion aux Joyeux Marcheurs, nous avons besoin de quelques informations complémentaires.
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm space-y-4">

                        {/* Identité */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
                            <div className="flex items-center gap-2 text-blue-600 font-medium border-b border-blue-100 pb-2 mb-2">
                                <User className="w-5 h-5" />
                                <h3>Identité</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Prénom *</label>
                                    <input
                                        name="first_name"
                                        type="text"
                                        required
                                        value={formData.first_name}
                                        onChange={handleChange}
                                        className="appearance-none relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-500 text-slate-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Nom *</label>
                                    <input
                                        name="last_name"
                                        type="text"
                                        required
                                        value={formData.last_name}
                                        onChange={handleChange}
                                        className="appearance-none relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-500 text-slate-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Coordonnées */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
                            <div className="flex items-center gap-2 text-blue-600 font-medium border-b border-blue-100 pb-2 mb-2">
                                <MapPin className="w-5 h-5" />
                                <h3>Adresse Postale</h3>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Adresse *</label>
                                <input
                                    name="address"
                                    type="text"
                                    required
                                    value={formData.address}
                                    onChange={handleChange}
                                    className="appearance-none relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-500 text-slate-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="ex: 12 Rue des Lavandes"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Complément d'adresse</label>
                                <input
                                    name="address_complement"
                                    type="text"
                                    value={formData.address_complement}
                                    onChange={handleChange}
                                    className="appearance-none relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-500 text-slate-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Code Postal *</label>
                                    <input
                                        name="postal_code"
                                        type="text"
                                        required
                                        value={formData.postal_code}
                                        onChange={handleChange}
                                        className="appearance-none relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-500 text-slate-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        placeholder="13000"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Ville *</label>
                                    <input
                                        name="city"
                                        type="text"
                                        required
                                        value={formData.city}
                                        onChange={handleChange}
                                        className="appearance-none relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-500 text-slate-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        placeholder="Aix-en-Provence"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Contact */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
                            <div className="flex items-center gap-2 text-blue-600 font-medium border-b border-blue-100 pb-2 mb-2">
                                <Phone className="w-5 h-5" />
                                <h3>Contact</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Mobile *</label>
                                    <input
                                        name="phone_mobile"
                                        type="tel"
                                        required
                                        value={formData.phone_mobile}
                                        onChange={handleChange}
                                        className="appearance-none relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-500 text-slate-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        placeholder="06 12 34 56 78"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Fixe</label>
                                    <input
                                        name="phone_fixed"
                                        type="tel"
                                        value={formData.phone_fixed}
                                        onChange={handleChange}
                                        className="appearance-none relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-500 text-slate-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        placeholder="04 42 12 34 56"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg shadow-blue-600/20 transition-all"
                        >
                            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                                <Save className="h-5 w-5 text-blue-500 group-hover:text-blue-400" aria-hidden="true" />
                            </span>
                            {loading ? 'Enregistrement...' : 'Valider mon inscription'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    )
}
