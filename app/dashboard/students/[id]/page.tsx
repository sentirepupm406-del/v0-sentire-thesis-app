import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StudentInsightCard } from '@/components/student-insight-card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function StudentDetailPage({ params, }: { params: { id: string } }) {
    const supabase = await createClient()
    const { data: student, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', params.id)
        .single()

    if (error || !student) {
        redirect('/dashboard/students')
    }

    const { data: wellnessLogs } = await supabase
        .from('wellness_logs')
        .select('*')
        .eq('user_id', params.id)
        .order('logged_at', { ascending: false })

    const { data: academicRecords } = await supabase
        .from('academics')
        .select('*')
        .eq('user_id', params.id)

    const latestWellness = wellnessLogs?.[0]

    return (
        <div className="p-6 bg-slate-50 min-h-screen">
            <div className="mb-6">
                <Link href="/dashboard/students">
                    <Button variant="outline" className="gap-2 mb-4">
                        <ArrowLeft size={16} /> Back to Students
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold text-slate-900">{student.full_name}</h1>
                <p className="text-slate-600 text-sm mt-1">{student.course} | Year {student.year_level}</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                        <h3 className="font-semibold text-slate-900 mb-3">Student Information</h3>
                        <div className="space-y-2 text-sm">
                            <div>
                                <p className="text-slate-600">Student ID</p>
                                <p className="font-medium text-slate-900">{student.student_id}</p>
                            </div>
                            <div>
                                <p className="text-slate-600">Course</p>
                                <p className="font-medium text-slate-900">{student.course}</p>
                            </div>
                            <div>
                                <p className="text-slate-600">Year Level</p>
                                <p className="font-medium text-slate-900">{student.year_level}</p>
                            </div>
                        </div>
                    </div>
                    {latestWellness && (
                        <div className="bg-white rounded-xl border border-slate-200 p-4">
                            <h3 className="font-semibold text-slate-900 mb-3">Latest Wellness</h3>
                            <div className="space-y-2 text-sm">
                                <div>
                                    <p className="text-slate-600">Mood</p>
                                    <p className="font-medium text-slate-900">{latestWellness.mood}/5</p>
                                </div>
                                <div>
                                    <p className="text-slate-600">Stress Level</p>
                                    <p className="font-medium text-slate-900">{latestWellness.stress}/5</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="lg:col-span-2 flex justify-center">
                    <StudentInsightCard student={{
                        id: student.id,
                        name: student.full_name,
                        mood: latestWellness?.mood ?? 3,
                        stress: latestWellness?.stress ?? 3,
                        sleepHours: latestWellness?.sleep_hours,
                        notes: latestWellness?.notes,
                        gwa: student.gwa,
                    }} />
                </div>
            </div>
        </div>
    )
}