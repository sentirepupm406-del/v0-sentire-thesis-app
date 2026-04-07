import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminDashboardClient } from '@/components/admin-dashboard-client'

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

  // 1. Check permissions
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  // 2. FETCH REAL DATA: Get summary stats for the dashboard
  // This assumes you have student logs and profiles populated
  const { data: stats } = await supabase
    .from('profiles')
    .select(`
      course,
      wellness_logs (
        mood,
        stress
      )
    `)
    .eq('role', 'student')

  // 3. FETCH RECENT COMMENTS: Get the "Common Struggles"
  const { data: comments } = await supabase
    .from('survey_responses')
    .select('q20_comments')
    .not('q20_comments', 'is', null)
    .limit(10)

  // Pass the real data into your Client Component
  return (
    <AdminDashboardClient
      userId={user.id}
      initialStats={stats || []}
      recentComments={comments || []}
    />
  )
}
