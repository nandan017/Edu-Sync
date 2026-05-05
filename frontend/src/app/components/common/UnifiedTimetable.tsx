import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  ArrowLeft, Clock, MapPin, User, Calendar, Download, Printer, Coffee, AlertTriangle, Loader2
} from 'lucide-react'
import {
  apiGetPrincipalTimetables, apiGetHODTimetables, apiGetFacultyTimetables, apiGetDepartments
} from '@/services/api'

interface UnifiedTimetableProps {
  onBack: () => void
  userRole: 'principal' | 'hod' | 'faculty' | 'student'
  department?: string
  title?: string
}

interface TimetableSlot {
  day: string
  period: number
  timeStart: string
  timeEnd: string
  subject: string
  facultyName: string
  room: string
  type: string
}

interface TimetableData {
  _id: string
  department: string
  departmentId?: { name: string; fullName: string }
  year: number
  section: string
  semester: number
  slots: TimetableSlot[]
  isPublished: boolean
}

const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const

export function UnifiedTimetable({ onBack, userRole, department = '', title }: UnifiedTimetableProps) {
  const [timetables, setTimetables] = useState<TimetableData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [departments, setDepartments] = useState<{name:string}[]>([])

  // Filters
  const [selectedDepartment, setSelectedDepartment] = useState(department || 'ALL')
  const [selectedYear, setSelectedYear] = useState('ALL')
  const [selectedSection, setSelectedSection] = useState('ALL')

  // Load departments for principal view
  useEffect(() => {
    if (userRole === 'principal') {
      apiGetDepartments()
        .then(data => setDepartments(data.departments || []))
        .catch(() => {})
    }
  }, [userRole])

  // Fetch timetables based on role
  useEffect(() => {
    const fetchTimetables = async () => {
      setIsLoading(true)
      setError('')
      try {
        let data: any
        if (userRole === 'principal') {
          const filters: any = {}
          if (selectedDepartment !== 'ALL') filters.department = selectedDepartment
          if (selectedYear !== 'ALL') filters.year = parseInt(selectedYear)
          if (selectedSection !== 'ALL') filters.section = selectedSection
          data = await apiGetPrincipalTimetables(filters)
        } else if (userRole === 'hod') {
          data = await apiGetHODTimetables()
        } else if (userRole === 'faculty') {
          data = await apiGetFacultyTimetables()
        }
        setTimetables(data?.timetables || [])
      } catch (err: any) {
        setError(err.message || 'Failed to load timetables')
      } finally {
        setIsLoading(false)
      }
    }
    fetchTimetables()
  }, [userRole, selectedDepartment, selectedYear, selectedSection])

  // Build a grid from slots for a single timetable
  const buildGrid = (tt: TimetableData) => {
    const maxPeriod = Math.max(8, ...tt.slots.map(s => s.period))
    const grid: (TimetableSlot | null)[][] = []
    for (let p = 1; p <= maxPeriod; p++) {
      const row: (TimetableSlot | null)[] = []
      for (const day of dayNames) {
        const slot = tt.slots.find(s => s.day === day && s.period === p) || null
        row.push(slot)
      }
      grid.push(row)
    }
    return grid
  }

  const getRoleColor = () => {
    switch (userRole) {
      case 'principal': return 'from-indigo-600 to-purple-600'
      case 'hod': return 'from-green-600 to-teal-600'
      case 'faculty': return 'from-purple-600 to-indigo-600'
      case 'student': return 'from-blue-600 to-purple-600'
      default: return 'from-gray-600 to-gray-700'
    }
  }

  const getRoleTitle = () => {
    if (title) return title
    switch (userRole) {
      case 'principal': return 'Principal Dashboard - Timetable'
      case 'hod': return 'HOD Dashboard - Timetable'
      case 'faculty': return 'Faculty Dashboard - Timetable'
      case 'student': return 'Student Dashboard - Timetable'
      default: return 'Timetable'
    }
  }

  const formatSlotCell = (slot: TimetableSlot | null) => {
    if (!slot) {
      return (
        <div className="h-full min-h-[70px] flex items-center justify-center text-gray-300">
          —
        </div>
      )
    }
    if (slot.type === 'free') {
      return (
        <div className="text-center py-3 bg-orange-50 text-orange-600 rounded-lg font-medium min-h-[70px] flex flex-col items-center justify-center">
          <Coffee className="w-4 h-4 mb-1" />
          <span className="text-xs">FREE</span>
        </div>
      )
    }
    return (
      <div className={`p-3 rounded-lg border min-h-[70px] transition-shadow hover:shadow-sm ${
        slot.type === 'lab' ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
      }`}>
        <div className="font-medium text-sm text-gray-900 mb-1.5 leading-tight">{slot.subject || 'N/A'}</div>
        <div className="space-y-0.5">
          {slot.room && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <MapPin className="w-3 h-3 shrink-0" /><span>{slot.room}</span>
            </div>
          )}
          {slot.facultyName && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <User className="w-3 h-3 shrink-0" /><span className="truncate">{slot.facultyName}</span>
            </div>
          )}
        </div>
        {slot.type === 'lab' && <Badge variant="outline" className="mt-1.5 text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 border-blue-300">Lab</Badge>}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-gray-900 font-semibold">{getRoleTitle()}</h1>
            <p className="text-sm text-gray-600">Academic Year {new Date().getFullYear()}-{(new Date().getFullYear() + 1).toString().slice(-2)}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" />Export</Button>
            <Button variant="outline" size="sm"><Printer className="w-4 h-4 mr-2" />Print</Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Role-specific header */}
        <Card className={`bg-gradient-to-r ${getRoleColor()} text-white`}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="text-4xl">📅</div>
              <div className="flex-1">
                <h2 className="text-white text-lg font-bold mb-1">College Timetable</h2>
                <p className="text-white/90 text-sm mb-3">Working Hours: 8:00 AM - 2:30 PM</p>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/20">
                    <Calendar className="w-3 h-3 mr-1" />
                    {timetables.length} Timetable{timetables.length !== 1 ? 's' : ''} found
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters — principal gets department filter, all get year/section */}
        <div className="flex flex-wrap gap-4 pb-2">
          {userRole === 'principal' && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Department:</label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Departments</SelectItem>
                  {departments.map(d => <SelectItem key={d.name} value={d.name}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Year:</label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="1">1st Year</SelectItem>
                <SelectItem value="2">2nd Year</SelectItem>
                <SelectItem value="3">3rd Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Section:</label>
            <Select value={selectedSection} onValueChange={setSelectedSection}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="A">A</SelectItem>
                <SelectItem value="B">B</SelectItem>
                <SelectItem value="C">C</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mr-3" />
            <span className="text-gray-500">Loading timetables...</span>
          </div>
        ) : error ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
              <h3 className="font-semibold text-red-800 mb-1">Failed to Load</h3>
              <p className="text-sm text-red-600">{error}</p>
            </CardContent>
          </Card>
        ) : timetables.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Timetables Generated Yet</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                {userRole === 'principal'
                  ? 'No timetables have been generated by the admin. Please check with the admin office.'
                  : 'No timetables are available for your department yet. Please check back later or contact administration.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          timetables.map(tt => {
            const grid = buildGrid(tt)
            return (
              <Card key={tt._id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Clock className="w-5 h-5 text-blue-500" />
                    {tt.departmentId?.name || tt.department || 'Department'} — Year {tt.year}, Section {tt.section}
                    {tt.semester && <span className="text-sm font-normal text-gray-500"> · Semester {tt.semester}</span>}
                    {!tt.isPublished && <Badge variant="outline" className="ml-2 text-amber-600 border-amber-300 bg-amber-50">Draft</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="text-left p-4 font-medium text-gray-700 w-28 sticky left-0 bg-gray-50 z-10">
                            <div className="flex items-center gap-2"><Clock className="w-4 h-4" /> Period</div>
                          </th>
                          {dayNames.map(day => (
                            <th key={day} className="text-left p-4 font-medium text-gray-700 min-w-[180px]">{day}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {grid.map((row, pIdx) => {
                          const period = pIdx + 1
                          // Find a slot in this row that has time info
                          const sampleSlot = row.find(s => s !== null)
                          const timeLabel = sampleSlot ? `${sampleSlot.timeStart || ''}–${sampleSlot.timeEnd || ''}` : `Period ${period}`
                          return (
                            <tr key={pIdx} className="border-b hover:bg-gray-50/50">
                              <td className="p-3 font-medium text-gray-900 bg-blue-50 border-r sticky left-0 z-10">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-blue-500" />
                                  <div>
                                    <div className="text-sm">P{period}</div>
                                    <div className="text-[10px] text-gray-500">{timeLabel}</div>
                                  </div>
                                </div>
                              </td>
                              {row.map((slot, dIdx) => (
                                <td key={dIdx} className="p-2">{formatSlotCell(slot)}</td>
                              ))}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}

        {/* Schedule Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-sm">Daily Schedule</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span>First Session:</span><span className="font-medium">8:00 AM - 10:00 AM</span></div>
              <div className="flex justify-between"><span>Break:</span><span className="font-medium">10:00 AM - 10:30 AM</span></div>
              <div className="flex justify-between"><span>Second Session:</span><span className="font-medium">10:30 AM - 12:30 PM</span></div>
              <div className="flex justify-between"><span>Third Session:</span><span className="font-medium">12:30 PM - 2:30 PM</span></div>
              <div className="flex justify-between border-t pt-2"><span>Total:</span><span className="font-medium">6.5 hours</span></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Class Information</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Classes per Day:</span><span className="font-medium">6 periods</span></div>
              <div className="flex justify-between"><span>Period Duration:</span><span className="font-medium">1 hour</span></div>
              <div className="flex justify-between"><span>Break Duration:</span><span className="font-medium">30 minutes</span></div>
              <div className="flex justify-between"><span>Saturday:</span><span className="font-medium">Half Day</span></div>
              <div className="flex justify-between border-t pt-2"><span>Working Days:</span><span className="font-medium">6 days/week</span></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Current Status</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Timetables Loaded:</span><span className="font-medium">{timetables.length}</span></div>
              <div className="flex justify-between"><span>Academic Year:</span><span className="font-medium">{new Date().getFullYear()}-{(new Date().getFullYear()+1).toString().slice(-2)}</span></div>
              <div className="flex justify-between"><span>Today:</span><span className="font-medium">{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</span></div>
              <div className="flex justify-between border-t pt-2"><span>User Role:</span><span className="font-medium capitalize">{userRole}</span></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}