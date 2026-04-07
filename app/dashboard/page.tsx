import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { WellnessDashboardClient } from '@/components/wellness-dashboard-client'

export const metadata = {
  title: 'Student Dashboard - Sentire',
  description: 'Student wellness and academic monitoring dashboard',
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  const role = profile?.role || user.user_metadata?.role

  if (role === 'teacher') {
    redirect('/dashboard/overview')
  }

  if (role === 'admin') {
    redirect('/dashboard/admin')
  }

  return (
    <WellnessDashboardClient
      profile={profile}
      email={user.email!}
      logs={[]}
    />
  )
}
