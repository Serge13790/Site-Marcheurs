import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { Dashboard } from './components/admin/Dashboard.tsx'
import { AdminHikes } from './components/admin/AdminHikes.tsx'
import { AdminUsers } from './components/admin/AdminUsers.tsx'
import { AdminPhotos } from './components/admin/AdminPhotos.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'
import { HikeDetail } from './components/hikes/HikeDetail.tsx'
import { LegalNotice } from './pages/LegalNotice.tsx'

import { ThemeProvider } from './contexts/ThemeContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="light" storageKey="les-marcheurs-theme">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/hikes/:id" element={<HikeDetail />} />
            <Route path="/admin" element={<Dashboard />} />
            <Route path="/admin/hikes" element={<AdminHikes />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/photos" element={<AdminPhotos />} />
            <Route path="/mentions-legales" element={<LegalNotice />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
