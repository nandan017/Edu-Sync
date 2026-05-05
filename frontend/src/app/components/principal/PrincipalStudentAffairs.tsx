import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, GraduationCap, Search, Users, Loader2, AlertTriangle } from 'lucide-react'
import { apiGetPrincipalStudents, apiGetDepartments } from '@/services/api'

interface PrincipalStudentAffairsProps {
  onBack: () => void
}

interface StudentRecord {
  _id: string
  firstName: string
  lastName: string
  registerNumber: string
  phone: string
  section: string
  semester: number
  yearOfJoining: number
  yearOfPassing: number
  departmentId?: { name: string; fullName: string }
}

export function PrincipalStudentAffairs({ onBack }: PrincipalStudentAffairsProps) {
  const [students, setStudents] = useState<StudentRecord[]>([])
  const [departments, setDepartments] = useState<{name:string, fullName:string}[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [selectedDept, setSelectedDept] = useState('ALL')

  useEffect(() => {
    apiGetDepartments()
      .then(data => setDepartments(data.departments || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const fetchStudents = async () => {
      setIsLoading(true)
      setError('')
      try {
        const params: any = {}
        if (search.trim()) params.search = search.trim()
        if (selectedDept !== 'ALL') params.department = selectedDept
        const data = await apiGetPrincipalStudents(params)
        setStudents(data?.students || [])
      } catch (err: any) {
        setError(err.message || 'Failed to load students')
      } finally {
        setIsLoading(false)
      }
    }
    const debounce = setTimeout(fetchStudents, 300)
    return () => clearTimeout(debounce)
  }, [search, selectedDept])

  const deptCounts = students.reduce<Record<string, number>>((acc, s) => {
    const dept = s.departmentId?.name || 'Other'
    acc[dept] = (acc[dept] || 0) + 1
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100">
        <div className="flex items-center justify-between p-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack} className="p-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-9 h-9 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-900">Student Affairs</h1>
              <p className="text-xs text-slate-500">View all student records across departments</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-slate-900">{students.length}</div>
              <div className="text-xs text-slate-500">Total Students</div>
            </CardContent>
          </Card>
          {Object.entries(deptCounts).slice(0, 3).map(([dept, count]) => (
            <Card key={dept}>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-slate-700">{count}</div>
                <div className="text-xs text-slate-500">{dept}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by name or register number..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-10 bg-white border-slate-200 rounded-xl"
            />
          </div>
          <Select value={selectedDept} onValueChange={setSelectedDept}>
            <SelectTrigger className="w-full sm:w-48 h-10 rounded-xl">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Departments</SelectItem>
              {departments.map(d => <SelectItem key={d.name} value={d.name}>{d.fullName || d.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Student List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mr-3" />
            <span className="text-slate-500">Loading students...</span>
          </div>
        ) : error ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
              <p className="text-sm text-red-600">{error}</p>
            </CardContent>
          </Card>
        ) : students.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">No Students Found</h3>
              <p className="text-sm text-slate-500">Try adjusting your search or filters.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b">
                      <th className="text-left p-4 text-xs font-semibold text-slate-500 uppercase">Reg. No</th>
                      <th className="text-left p-4 text-xs font-semibold text-slate-500 uppercase">Student Name</th>
                      <th className="text-left p-4 text-xs font-semibold text-slate-500 uppercase">Department</th>
                      <th className="text-left p-4 text-xs font-semibold text-slate-500 uppercase">Section</th>
                      <th className="text-left p-4 text-xs font-semibold text-slate-500 uppercase">Semester</th>
                      <th className="text-left p-4 text-xs font-semibold text-slate-500 uppercase">Phone</th>
                      <th className="text-left p-4 text-xs font-semibold text-slate-500 uppercase">Batch</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, i) => (
                      <motion.tr
                        key={s._id}
                        className="border-b hover:bg-slate-50/50 transition-colors"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.02 }}
                      >
                        <td className="p-4 text-sm font-mono text-slate-700">{s.registerNumber || '—'}</td>
                        <td className="p-4">
                          <div className="text-sm font-medium text-slate-900">{s.firstName} {s.lastName}</div>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline" className="text-xs">{s.departmentId?.name || '—'}</Badge>
                        </td>
                        <td className="p-4 text-sm text-slate-600">{s.section || '—'}</td>
                        <td className="p-4 text-sm text-slate-600">{s.semester || '—'}</td>
                        <td className="p-4 text-sm text-slate-600">{s.phone || '—'}</td>
                        <td className="p-4 text-sm text-slate-500">{s.yearOfJoining}–{s.yearOfPassing}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
