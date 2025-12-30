import { HikesList } from '@/components/hikes/HikesList'


export function HomePrivate() {
    return (
        <div className="space-y-12">
            {/* Hero Section */}
            <section className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-8 md:p-16">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-40"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/60 to-transparent"></div>

                <div className="relative z-10 max-w-2xl">
                    <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                        L'aventure commence <span className="text-blue-400">ici</span>.
                    </h1>
                    <p className="text-lg md:text-xl text-slate-300 mb-8 leading-relaxed">
                        Découvrez nos prochaines randonnées, partagez vos meilleurs clichés et rejoignez une communauté de passionnés.
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <a href="#calendrier" className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-600/25">
                            Voir le calendrier
                        </a>
                        <a href="#archives" className="inline-flex items-center justify-center px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-slate-900/25 border border-slate-700">
                            Voir les randos passées
                        </a>
                    </div>
                </div>
            </section>

            <HikesList />
        </div>
    )
}
