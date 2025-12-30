# Les Joyeux Marcheurs de Châteauneuf-le-Rouge

Site web officiel de l'association de randonnée "Les Joyeux Marcheurs". Ce projet est une application web moderne permettant la gestion des adhérents, des randonnées et de la galerie photo.

## 🛠 Stack Technique

*   **Frontend** : [React](https://react.dev/) + [Vite](https://vitejs.dev/)
*   **Langage** : TypeScript
*   **Styling** : [Tailwind CSS](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/) / Lucide Icons
*   **Backend / Base de données** : [Supabase](https://supabase.com/) (PostgreSQL + Auth + Storage + Edge Functions)
*   **Emails** : Brevo (via Supabase Edge Functions)
*   **Animation** : Framer Motion

## 🚀 Installation & Démarrage

### Pré-requis
*   Node.js (v18+)
*   NPM ou Yarn
*   Compte Supabase & Brevo

### 1. Cloner le projet
```bash
git clone <repository-url>
cd les-marcheurs
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configuration de l'environnement
Créez un fichier `.env.local` à la racine :
```env
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_cle_anon_publique
```

### 4. Lancer le serveur de développement
```bash
npm run dev
```

## 🏗 Architecture Supabase

### Tables
*   **profiles** : Extension des utilisateurs (Auth). Contient rôles, infos personnelles et statut d'approbation.
*   **hikes** : Randonnées (titre, date, lieu, difficulté...).
*   **photos** : Galerie photo liée aux utilisateurs et aux randos.
*   **registrations** : Inscriptions des membres aux randonnées (compteur auto via triggers).

### Edge Functions
*   **notify-admin** : Notifie l'admin à chaque inscription.
*   **notify-approval** : Notifie l'utilisateur quand son compte est validé.
*   **notify-content** : "Newsletter" automatique.
    *   Nouvelle rando publiée -> Email à tous les membres.
    *   Rando brouillon -> Email à l'admin uniquement.
    *   Nouvelle photo -> Email à l'admin.

## 📦 Commandes Utiles

*   `npm run build` : Compile l'application pour la production.
*   `npm run lint` : Vérifie le code.
*   `npx supabase functions deploy [name]` : Déploie une Cloud Function.

## 🔐 Sécurité & Rôles
*   **Walker (Marcheur)** : Accès au contenu privé après validation par un admin. Peut uploader des photos.
*   **Editor (Éditeur)** : Peut créer/modifier des randonnées et gérer les photos.
*   **Admin** : Accès complet, validation des utilisateurs, suppression de contenu.
