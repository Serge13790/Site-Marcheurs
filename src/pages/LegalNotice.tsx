import { MainLayout } from '@/components/layout/MainLayout'

export function LegalNotice() {
    return (
        <MainLayout>
            <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8 border-b border-slate-200 dark:border-slate-700 pb-4">
                    Mentions Légales
                </h1>

                <div className="space-y-8 text-slate-700 dark:text-slate-300">
                    <section>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">1. Éditeur du site</h2>
                        <p>
                            Le site <strong>Les Joyeux Marcheurs de Châteauneuf-le-Rouge</strong> est édité par l'association "Les Joyeux Marcheurs".
                            <br />
                            Association régie par la loi du 1er juillet 1901.
                        </p>
                        <ul className="list-disc ml-5 mt-2 space-y-1">
                            <li><strong>Siège social :</strong> Mairie de Châteauneuf-le-Rouge, 13790 Châteauneuf-le-Rouge</li>
                            <li><strong>Email :</strong> contact@example.com</li>
                            <li><strong>Téléphone :</strong> 04 XX XX XX XX</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">2. Directeur de la publication</h2>
                        <p>
                            Le directeur de la publication est le Président de l'association, Monsieur/Madame [Nom du Président].
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">3. Hébergement</h2>
                        <p>
                            Ce site est hébergé par Vercel Inc.
                            <br />
                            Adresse : [Adresse de l'hébergeur]
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">4. Propriété intellectuelle</h2>
                        <p>
                            L'ensemble de ce site relève de la législation française et internationale sur le droit d'auteur et la propriété intellectuelle. Tous les droits de reproduction sont réservés, y compris pour les documents téléchargeables et les représentations iconographiques et photographiques.
                        </p>
                        <p className="mt-2">
                            La reproduction de tout ou partie de ce site sur un support électronique ou papier quel qu'il soit est formellement interdite sauf autorisation expresse du directeur de la publication.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">5. Protection des données personnelles</h2>
                        <p>
                            Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez d'un droit d'accès, de rectification et de suppression des données vous concernant.
                        </p>
                        <p className="mt-2">
                            Pour exercer ce droit, vous pouvez nous contacter par email à l'adresse indiquée ci-dessus.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">6. Cookies</h2>
                        <p>
                            Ce site peut être amené à utiliser des cookies pour améliorer l'expérience utilisateur et réaliser des statistiques de visites. Vous pouvez configurer votre navigateur pour refuser les cookies.
                        </p>
                    </section>
                </div>
            </div>
        </MainLayout>
    )
}
