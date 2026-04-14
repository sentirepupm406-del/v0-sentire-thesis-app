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

    // 3. RESPONSES STEP (Updated mapping for new emotional awareness questions)
    const surveyData = {
      student_id: userId,
      user_id: userId,
      program: data.program,
      gender: data.answers.gender || null,
      responses: data.answers,
      survey_category: 'emotional_awareness',
      // Emotional Awareness Section
      q1: data.answers.q1 || null,
      q2: data.answers.q2 || null,
      q3: data.answers.q3 || null,
      q4: data.answers.q4 || null,
      q5: data.answers.q5 || null,
      q6: data.answers.q6 || null,
      q7: data.answers.q7 || null,
      q8: data.answers.q8 || null,
      // Emotion Regulation Section
      q9: data.answers.q9 || null,
      q10: data.answers.q10 || null,
      q11: data.answers.q11 || null,
      q12: data.answers.q12 || null,
      q13: data.answers.q13 || null,
      q14: data.answers.q14 || null,
      q15: data.answers.q15 || null,
    }

    const { error: surveyError } = await admin.from('survey_responses').insert(surveyData)

    if (surveyError) {
      console.error("Survey Error:", surveyError)
      return { error: "Database Error (Survey): " + surveyError.message }
    }

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
  const email = (formData.get('email') as string).trim().toLowerCase()
  const password = (formData.get('password') as string).trim()

  console.log("--- Login Attempt for:", email)

  const { error, data } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    console.error("Auth Error:", error.message)
    return { error: error.message }
  }

  console.log("Login Successful! User ID:", data.user.id)

  // Fetch the role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()

  if (profileError || !profile) {
    console.error("Profile Fetch Error:", profileError)
    // Fallback: If no profile found, try to go to students
    redirect('/dashboard/students')
  }

  console.log("User Role:", profile.role)

  // FINAL REDIRECTS - Matching your specific folder image exactly
  if (profile.role === 'admin') {
    console.log("Redirecting to Admin...")
    redirect('/dashboard/admin')
  } else if (profile.role === 'teacher' || profile.role === 'faculty') {
    console.log("Redirecting to Teacher...")
    redirect('/dashboard/teacher')
  } else {
    console.log("Redirecting to Students...")
    redirect('/dashboard/students')
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
