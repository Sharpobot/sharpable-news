import AdminSidebar from './AdminSidebar'
import AdminLoader from '@/app/components/AdminLoader'
import { logoutAction } from './actions'

export const dynamic = 'force-dynamic'

export default function AdminLayout({ children }) {
  // Auth is handled by middleware.js — no cookie check needed here
  return (
    <>
      <AdminLoader />
      <AdminSidebar logoutAction={logoutAction}>
        {children}
      </AdminSidebar>
    </>
  )
}
