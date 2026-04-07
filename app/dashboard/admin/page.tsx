import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminDashboardView } from '@/components/admin-dashboard-view'

export const metadata = {
  title: 'Admin Dashboard - Sentire',
  description: 'Emotion-aware academic monitoring system admin dashboard',
}

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  return (
    <AdminDashboardView 
      profile={profile} 
      email={user.email || ''} 
    />
  )
}
