import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TeacherOverviewClient } from '@/components/teacher-overview-client'

export default async function TeacherOverviewPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const role = profile?.role ?? user.user_metadata?.role ?? 'student'

  // Only teachers can access this page
  if (role !== 'teacher') {
    redirect('/dashboard')
  }

  // Fetch all students
  const { data: students } = await supabase
    .from('profiles')
    .select('id, full_name, student_id, course, year_level, role')
    .eq('role', 'student')

  // Fetch recent wellness logs
  const { data: wellnessLogs } = await supabase
    .from('wellness_logs')
    .select('id, user_id, mood, stress, logged_at')
    .order('logged_at', { ascending: false })
    .limit(100)

  // Fetch academic records
  const { data: academicRecords } = await supabase
    .from('academics')
    .select('id, user_id, subject, grade, units')

  return (
    <TeacherOverviewClient
      students={students ?? []}
      wellnessLogs={wellnessLogs ?? []}
      academicRecords={academicRecords ?? []}
    />
  )
}
