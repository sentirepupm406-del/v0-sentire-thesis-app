'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Users } from 'lucide-react'

interface TeacherPortalClientProps {
    students: any[]
    wellnessLogs: any[]
    academicRecords: any[]
}

export function TeacherPortalClient({ students, wellnessLogs, academicRecords }: TeacherPortalClientProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const router = useRouter()

    const filteredStudents = students.filter(s =>
        s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.student_id?.includes(searchTerm)
    )

    const handleStudentClick = (studentId: string) => {
        router.push(`/dashboard/students/${studentId}`)
    }

    return (
        <div className="p-8 bg-slate-50 min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Management</h1>
                    <p className="text-slate-500 text-sm">Monitor academic and emotional status of your students.</p>
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                    <Users className="text-[#800000]" size={20} />
                    <span className="font-bold text-slate-700">{students.length} Students</span>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/30">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search students..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#800000]/20 outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Name</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Student ID</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Course</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Year</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredStudents.map((student) => (
                                <tr
                                    key={student.id}
                                    onClick={() => handleStudentClick(student.id)}
                                    className="hover:bg-slate-100 transition-colors cursor-pointer"
                                >
                                    <td className="px-6 py-4 font-medium text-slate-900">{student.full_name}</td>
                                    <td className="px-6 py-4 text-slate-600 text-sm">{student.student_id}</td>
                                    <td className="px-6 py-4 text-slate-600 text-sm">{student.course}</td>
                                    <td className="px-6 py-4 text-slate-600 text-sm">{student.year_level}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-md text-xs font-bold uppercase">
                                            Active
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {filteredStudents.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-slate-400 italic">
                                        No students found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}