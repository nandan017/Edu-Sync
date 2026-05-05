import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, ArrowLeft, Clock, MapPin, User, Coffee, Loader2, AlertTriangle } from 'lucide-react'
import { apiGetStudentAcademicTimetable, apiGetStudentExamTimetable } from '@/services/api'

interface StudentTimetablePageProps {
  onBack: () => void
  type: 'academic' | 'exam'
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

export function StudentTimetablePage({ onBack, type }: StudentTimetablePageProps) {
  const [timetables, setTimetables] = useState<TimetableData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true)
      setError('')
      try {
        const data = type === 'academic'
          ? await apiGetStudentAcademicTimetable()
          : await apiGetStudentExamTimetable()
        setTimetables(data?.timetables || [])
      } catch (err: any) {
        setError(err.message || 'Failed to load timetable')
      } finally {
        setIsLoading(false)
      }
    }
    fetch()
  }, [type])

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

  const formatSlotCell = (slot: TimetableSlot | null) => {
    if (!slot) {
      return <div className="h-full min-h-[60px] flex items-center justify-center text-gray-300">—</div>
    }
    if (slot.type === 'free') {
      return (
        <div className="text-center py-3 bg-orange-50 text-orange-600 rounded-lg min-h-[60px] flex flex-col items-center justify-center">
          <Coffee className="w-4 h-4 mb-1" /><span className="text-xs">Free</span>
        </div>
      )
    }
    const colorMap: Record<string, string> = {
      theory: 'bg-blue-50 border-blue-200',
      lab: 'bg-green-50 border-green-200',
    }
    return (
      <div className={`${colorMap[slot.type] || 'bg-white border-gray-200'} border rounded-lg p-3 h-full min-h-[60px]`}>
        <div className="font-semibold text-gray-900 text-sm mb-1">{slot.subject || 'N/A'}</div>
        {slot.facultyName && <div className="text-xs text-gray-600">{slot.facultyName}</div>}
        {slot.room && <div className="text-xs text-gray-500 mt-0.5">{slot.room}</div>}
        {slot.type === 'lab' && <Badge variant="outline" className="mt-1 text-[10px] px-1.5 py-0 bg-green-100 text-green-700">Lab</Badge>}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onBack} className="p-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 ${type === 'academic' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-purple-500 to-pink-600'} rounded-xl flex items-center justify-center`}>
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {type === 'academic' ? 'Academic Time-table' : 'Exam Time-table'}
                </h2>
                <p className="text-sm text-gray-600">
                  {type === 'academic' ? 'Your class schedule' : 'End Semester Examination Schedule'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Loading */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mr-3" />
            <span className="text-gray-500">Loading timetable...</span>
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
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Timetable Available</h3>
              <p className="text-sm text-gray-500">
                {type === 'academic'
                  ? 'Your academic timetable has not been generated yet. Please check with administration.'
                  : 'No exam timetable has been published for your class.'}
              </p>
            </CardContent>
          </Card>
        ) : type === 'academic' ? (
          // Academic timetable — grid view
          timetables.map(tt => {
            const grid = buildGrid(tt)
            return (
              <Card key={tt._id} className="shadow-lg">
                <div className="p-4 border-b bg-gray-50">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Clock className="w-4 h-4 text-blue-500" />
                    {tt.departmentId?.name || tt.department} — Year {tt.year}, Section {tt.section}
                    {tt.semester && <span className="text-gray-400">· Sem {tt.semester}</span>}
                  </div>
                </div>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="p-4 text-left font-semibold text-gray-700 bg-gray-50 border-r">Time</th>
                          {dayNames.map(day => (
                            <th key={day} className="p-4 text-left font-semibold text-gray-700 bg-gray-50 border-r last:border-r-0 min-w-[150px]">{day}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {grid.map((row, pIdx) => {
                          const sample = row.find(s => s !== null)
                          const timeLabel = sample ? `${sample.timeStart || ''}–${sample.timeEnd || ''}` : `P${pIdx + 1}`
                          return (
                            <tr key={pIdx} className="border-b last:border-b-0">
                              <td className="p-3 font-medium text-gray-900 bg-gray-50 border-r whitespace-nowrap text-sm">{timeLabel}</td>
                              {row.map((slot, dIdx) => (
                                <td key={dIdx} className="p-2 border-r last:border-r-0 align-top">{formatSlotCell(slot)}</td>
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
        ) : (
          // Exam timetable — card list view
          <div className="space-y-4">
            {timetables.map(tt => (
              tt.slots.map((slot, idx) => (
                <Card key={`${tt._id}-${idx}`} className="shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-500">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Day</p>
                        <p className="font-semibold text-gray-900">{slot.day}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Time</p>
                        <p className="font-semibold text-gray-900">{slot.timeStart || ''} - {slot.timeEnd || ''}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-xs text-gray-600 mb-1">Subject</p>
                        <p className="font-semibold text-gray-900">{slot.subject}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Venue</p>
                        <p className="font-semibold text-gray-900">{slot.room || 'TBA'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
