'use server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function loginAction(prevState, formData) {
  const password = formData.get('password')
  if (password === process.env.ADMIN_PASSWORD) {
    const cookieStore = await cookies()
    cookieStore.set('admin-auth', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 8, // 8 hours
      path: '/',
      sameSite: 'lax',
    })
    redirect('/admin')
  }
  return { error: 'Kata laluan tidak sah.' }
}

export async function logoutAction() {
  const cookieStore = await cookies()
  cookieStore.delete('admin-auth')
  redirect('/admin')
}
