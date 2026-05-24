import AdminSidebar from './AdminSidebar'
import { logoutAction } from './actions'

export const dynamic = 'force-dynamic'

export default function AdminLayout({ children }) {
  // Auth is handled by middleware.js — no cookie check needed here
  return (
    <AdminSidebar logoutAction={logoutAction}>
      {children}
    </AdminSidebar>
  )
}
