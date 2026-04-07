'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function getBaseUrl() {
  const headersList = await headers()
  const host = headersList.get('host') || 'localhost:3000'
  const protocol = host.includes('localhost') ? 'http' : 'https'
  return `${protocol}://${host}`
}

export async function submitWellnessSurvey(data: {
  fullName: string;
  email: string;
  program: string;
  yearLevel: string; // Updated to accept yearLevel
  answers: Record<string, string>;
}) {
  const admin = createAdminClient()
  const testPassword = "PUP_Student_2026!"

  try {
    console.log("--- Starting Submission for:", data.email)

    // 1. AUTH STEP
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: data.email,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        full_name: data.fullName,
        role: 'student'
      },
    })

    let userId = authData?.user?.id

    if (authError) {
      if (authError.message.includes("already been registered")) {
        const { data: users } = await admin.auth.admin.listUsers()
        userId = users.users.find(u => u.email?.toLowerCase() === data.email.toLowerCase())?.id
      } else {
        return { error: "Auth Step Failed: " + authError.message }
      }
    }

    if (!userId) return { error: "User ID could not be determined." }

    // 2. PROFILE STEP (Updated to use yearLevel from arguments)
    const { error: profileError } = await admin.from('profiles').upsert({
      id: userId,
      full_name: data.fullName,
      email: data.email,
      program: data.program,
      course: data.program,
      role: 'student'
    })

    if (profileError) return { error: "Database Error (Profile): " + profileError.message }

    // 3. RESPONSES STEP (Updated mapping to match your survey questions)
    const { error: surveyError } = await admin.from('survey_responses').insert({
      student_id: userId,
      user_id: userId,
      program: data.program,
      gender: data.answers.gender || null,
      responses: data.answers,
      // Loneliness Section
      q2_lonely_1: data.answers.q2_lonely_1 || null,
      q3_lonely_2: data.answers.q3_lonely_2 || null,
      q4_lonely_3: data.answers.q4_lonely_3 || null,
      q5_lonely_4: data.answers.q5_lonely_4 || null,
      // Procrastination Section
      q6_procrastinate_1: data.answers.q6_procrastinate_1 || null,
      q7_procrastinate_2: data.answers.q7_procrastinate_2 || null,
      q8_procrastinate_3: data.answers.q8_procrastinate_3 || null,
      q9_procrastinate_4: data.answers.q9_procrastinate_4 || null,
      q10_procrastinate_5: data.answers.q10_procrastinate_5 || null,
      // Depression Section
      q11_depressed_1: data.answers.q11_depressed_1 || null,
      q12_depressed_2: data.answers.q12_depressed_2 || null,
      q13_depressed_3: data.answers.q13_depressed_3 || null,
    })

    if (surveyError) return { error: "Database Error (Survey): " + surveyError.message }

    // 4. LOG STEP (Default mood for registration)
    await admin.from('wellness_logs').insert({
      student_id: userId,
      emotion: 'neutral',
      reason: 'Initial Registration Survey',
      created_at: new Date().toISOString()
    })

    return { success: true, password: testPassword, email: data.email }

  } catch (err: any) {
    return { error: "System Error: " + (err.message || "Unknown error") }
  }
}

export async function login(formData: FormData) {
  const supabase = await createClient()

  // .trim() removes accidental spaces at the beginning or end
  const email = (formData.get('email') as string).trim().toLowerCase()
  const password = (formData.get('password') as string).trim()

  const { error, data } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    // Log the specific error to your terminal to see if it's 
    // "Email not confirmed" or "Invalid credentials"
    console.error("Auth Error:", error.message)
    return { error: error.message }
  }

  revalidatePath('/', 'layout')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .maybeSingle()

  // Route based on user role
  if (profile?.role === 'admin') {
    redirect('/dashboard/admin')
  } else if (profile?.role === 'teacher') {
    redirect('/dashboard/overview')
  } else {
    redirect('/dashboard')
  }
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const baseUrl = await getBaseUrl()
  const { error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      emailRedirectTo: `${baseUrl}/auth/callback`,
      data: { full_name: formData.get('full_name'), role: 'student' },
    },
  })
  if (error) return { error: error.message }
  return { success: true }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/auth/login')
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(formData.get('email') as string)
  if (error) return { error: error.message }
  return { success: true }
}
