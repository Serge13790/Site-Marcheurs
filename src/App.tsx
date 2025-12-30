import { useAuth } from '@/contexts/AuthContext'
import { MainLayout } from '@/components/layout/MainLayout'
import { Landing } from '@/components/home/Landing'
import { HomePrivate } from '@/components/home/HomePrivate'
import { ProfileCompletion } from '@/components/auth/ProfileCompletion'

function AppContent() {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-white text-slate-500 font-serif">Chargement...</div>
  }

  // Not logged in -> Landing
  if (!user) {
    return (
      <Landing />
    )
  }


  // Profile not completed -> Onboarding
  if (profile && !profile.is_profile_completed && profile.role !== 'admin') {
    return (
      <MainLayout>
        <ProfileCompletion />
      </MainLayout>
    )
  }

  // Logged in but not approved -> Pending screen
  if (profile && !profile.approved && profile.role !== 'admin') { // Admins bypass strict approval if they somehow set their role without approval flag
    return (
      <MainLayout>
        <div className="text-center py-20 font-serif text-slate-800">
          <h2 className="text-2xl font-bold mb-4">Compte en attente</h2>
          <p>Votre demande est en cours de validation par un administrateur.</p>
          <button onClick={() => window.location.reload()} className="mt-8 text-blue-600 hover:underline">Rafraîchir</button>
        </div>
      </MainLayout>
    )
  }

  // Logged in but profile missing (should not happen usually)
  if (user && !profile) {
    return (
      <MainLayout>
        <div className="text-center py-20 font-serif text-slate-800">
          <h2 className="text-xl font-bold mb-4">Erreur de profil</h2>
          <p>Impossible de charger votre profil. Veuillez réessayer ou contacter l'admin.</p>
          <button onClick={() => window.location.reload()} className="mt-4 text-blue-600 hover:underline">Rafraîchir</button>
        </div>
      </MainLayout>
    )
  }

  // Approved -> Private Content
  return (
    <MainLayout>
      <HomePrivate />
    </MainLayout>
  )
}

function App() {
  return (
    <div className="min-h-screen bg-white">
      <AppContent />
    </div>
  )
}

export default App
