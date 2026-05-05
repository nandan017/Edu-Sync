import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, UserPlus, CheckCircle } from 'lucide-react'
import { apiRegisterStaff, apiGetDepartments } from '@/services/api'

interface HODRegistrationPageProps {
  onBack: () => void
  onRegistrationSuccess: () => void
}

export function HODRegistrationPage({ onBack, onRegistrationSuccess }: HODRegistrationPageProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    designation: '',
    qualification: '',
    phone: '',
    gender: '',
    address: '',
    department: '',
  })
  const [departments, setDepartments] = useState<{name:string, fullName:string}[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{[k:string]:string}>({})
  const [success, setSuccess] = useState(false)
  const [createdUser, setCreatedUser] = useState<any>(null)

  useEffect(() => {
    apiGetDepartments()
      .then(data => setDepartments(data.departments || []))
      .catch(() => setDepartments([
        { name: 'BCA', fullName: 'BCA' },
        { name: 'BCOM', fullName: 'BCOM' },
        { name: 'BBA', fullName: 'BBA' },
      ]))
  }, [])

  const validate = () => {
    const e: {[k:string]:string} = {}
    if (!formData.firstName.trim()) e.firstName = 'Required'
    if (!formData.lastName.trim()) e.lastName = 'Required'
    if (!formData.email.trim()) e.email = 'Required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = 'Invalid email'
    if (!formData.password) e.password = 'Required'
    else if (formData.password.length < 6) e.password = 'Min 6 characters'
    if (formData.password !== formData.confirmPassword) e.confirmPassword = 'Passwords do not match'
    if (!formData.phone.trim()) e.phone = 'Required'
    if (!formData.department) e.department = 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!validate()) return
    setIsLoading(true)
    setErrors({})
    try {
      const data = await apiRegisterStaff({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        department: formData.department,
        designation: formData.designation || 'Associate Professor',
        qualification: formData.qualification,
        gender: formData.gender,
        address: formData.address,
        role: 'hod',
      })
      setCreatedUser(data)
      setSuccess(true)
    } catch (err: any) {
      setErrors({ general: err.message || 'Registration failed' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(p => ({ ...p, [field]: value }))
    if (errors[field]) setErrors(p => ({ ...p, [field]: '' }))
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Registration Successful!</h2>
          <p className="text-sm text-slate-600 mb-4">Your HOD account has been created.</p>
          {createdUser?.user && (
            <div className="bg-slate-50 rounded-xl p-4 text-left mb-4 space-y-1">
              <p className="text-sm"><span className="font-medium text-slate-700">Username:</span> {createdUser.user.username}</p>
              <p className="text-sm"><span className="font-medium text-slate-700">Employee ID:</span> {createdUser.faculty?.employeeId}</p>
            </div>
          )}
          <Button onClick={onRegistrationSuccess} className="w-full bg-gradient-to-r from-violet-600 to-purple-500 text-white rounded-xl">
            Go to Login
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 p-4">
      <div className="max-w-2xl mx-auto mb-6 pt-4">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4">
          <ArrowLeft className="w-5 h-5" /><span>Back to Login</span>
        </button>
      </div>
      <Card className="max-w-2xl mx-auto shadow-xl">
        <CardHeader className="bg-gradient-to-r from-violet-600 to-purple-500 p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-white text-xl font-bold mb-2">HOD Registration</h1>
            <p className="text-white/80 text-sm">Create your Head of Department account</p>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.general && <div className="p-3 bg-red-50 border border-red-200 rounded-xl"><p className="text-sm text-red-600">{errors.general}</p></div>}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">First Name *</label>
                <Input type="text" value={formData.firstName} onChange={e => handleChange('firstName', e.target.value)} placeholder="Enter first name" className={errors.firstName ? 'border-red-400' : ''} required />
                {errors.firstName && <p className="text-xs text-red-500">{errors.firstName}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Last Name *</label>
                <Input type="text" value={formData.lastName} onChange={e => handleChange('lastName', e.target.value)} placeholder="Enter last name" className={errors.lastName ? 'border-red-400' : ''} required />
                {errors.lastName && <p className="text-xs text-red-500">{errors.lastName}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Email *</label>
                <Input type="email" value={formData.email} onChange={e => handleChange('email', e.target.value)} placeholder="Enter email" className={errors.email ? 'border-red-400' : ''} required />
                {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Phone *</label>
                <Input type="tel" value={formData.phone} onChange={e => handleChange('phone', e.target.value)} placeholder="Enter phone" className={errors.phone ? 'border-red-400' : ''} required />
                {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Password *</label>
                <Input type="password" value={formData.password} onChange={e => handleChange('password', e.target.value)} placeholder="Min 6 characters" className={errors.password ? 'border-red-400' : ''} required />
                {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Confirm Password *</label>
                <Input type="password" value={formData.confirmPassword} onChange={e => handleChange('confirmPassword', e.target.value)} placeholder="Repeat password" className={errors.confirmPassword ? 'border-red-400' : ''} required />
                {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Designation</label>
              <Select value={formData.designation} onValueChange={v => handleChange('designation', v)}>
                <SelectTrigger><SelectValue placeholder="Select designation" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Professor">Professor</SelectItem>
                  <SelectItem value="Associate Professor">Associate Professor</SelectItem>
                  <SelectItem value="Assistant Professor">Assistant Professor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Department *</label>
              <Select value={formData.department} onValueChange={v => handleChange('department', v)}>
                <SelectTrigger className={errors.department ? 'border-red-400' : ''}><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>
                  {departments.map(d => <SelectItem key={d.name} value={d.name}>{d.fullName || d.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.department && <p className="text-xs text-red-500">{errors.department}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Qualification</label>
                <Input type="text" value={formData.qualification} onChange={e => handleChange('qualification', e.target.value)} placeholder="e.g., Ph.D., M.Tech" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Gender</label>
                <Select value={formData.gender} onValueChange={v => handleChange('gender', v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Address</label>
              <Textarea value={formData.address} onChange={e => handleChange('address', e.target.value)} placeholder="Enter full address" rows={3} />
            </div>
            <Button type="submit" className="w-full h-12 bg-gradient-to-r from-violet-600 to-purple-500 text-white font-medium rounded-xl" disabled={isLoading}>
              {isLoading ? <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Registering...</div> : 'Register as HOD'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
