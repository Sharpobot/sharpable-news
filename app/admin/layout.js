import { cookies } from 'next/headers'
import LoginForm from './LoginForm'
import AdminSidebar from './AdminSidebar'
import { logoutAction } from './actions'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }) {
  const cookieStore = await cookies()
  const isAuth = cookieStore.get('admin-auth')?.value === 'true'

  if (!isAuth) return <LoginForm />

  return (
    <AdminSidebar logoutAction={logoutAction}>
      {children}
    </AdminSidebar>
  )
}
