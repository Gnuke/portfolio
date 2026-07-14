import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import AdminApp from './AdminApp'
import { createAdminRepository } from './adminRepository'
import { getSupabaseClient } from '../lib/supabaseClient'
import './admin.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AdminApp repo={createAdminRepository(getSupabaseClient())} />
  </StrictMode>,
)
