import { Facebook, Mail, MapPin } from 'lucide-react'

export function Footer() {
    return (
        <footer className="bg-slate-950 border-t border-white/10 pt-16 pb-8">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    <div className="col-span-1 md:col-span-2">
                        <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 mb-4">
                            Les Joyeux Marcheurs
                        </h3>
                        <p className="text-slate-400 max-w-sm">
                            Association de randonnée pédestre. Découverte de la nature, convivialité et sport pour tous les niveaux.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-semibold text-white mb-4">Liens Rapides</h4>
                        <ul className="space-y-2 text-slate-400">
                            <li><a href="#" className="hover:text-blue-400 transition-colors">À propos</a></li>
                            <li><a href="#" className="hover:text-blue-400 transition-colors">Adhésion</a></li>
                            <li><a href="#" className="hover:text-blue-400 transition-colors">Mentions Légales</a></li>
                            <li><a href="#" className="hover:text-blue-400 transition-colors">Contact</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-white mb-4">Contact</h4>
                        <ul className="space-y-4 text-slate-400">
                            <li className="flex items-center gap-3">
                                <MapPin className="w-5 h-5 text-blue-400" />
                                <span>Mairie de la Ville<br />12345 Ville-sur-Forêt</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail className="w-5 h-5 text-blue-400" />
                                <a href="mailto:contact@marcheurs.fr" className="hover:text-white">contact@marcheurs.fr</a>
                            </li>
                            <li className="flex items-center gap-3">
                                <Facebook className="w-5 h-5 text-blue-400" />
                                <a href="#" className="hover:text-white">Suivez-nous sur Facebook</a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/10 text-center text-slate-500 text-sm">
                    <p>© {new Date().getFullYear()} Les Joyeux Marcheurs. Tous droits réservés.</p>
                </div>
            </div>
        </footer>
    )
}
