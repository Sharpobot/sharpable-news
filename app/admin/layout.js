import AdminSidebar from './AdminSidebar'
import AdminLoader from '@/app/components/AdminLoader'
import { logoutAction } from './actions'

export const dynamic = 'force-dynamic'

export default function AdminLayout({ children }) {
  // Auth is handled by middleware.js — no cookie check needed here
  return (
    /* Dark bg at layout level prevents any unstyled white flash during navigation */
    <div style={{ minHeight: '100vh', background: '#0a0a0a' }}>
      <AdminLoader />
      <AdminSidebar logoutAction={logoutAction}>
        {children}
      </AdminSidebar>
    </div>
  )
}
