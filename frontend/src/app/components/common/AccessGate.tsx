import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Lock, Shield, Eye, EyeOff } from 'lucide-react'
import { apiVerifyGate } from '@/services/api'

interface AccessGateProps {
  role: 'faculty' | 'hod'
  onUnlock: () => void
  onBack: () => void
}

export function AccessGate({ role, onUnlock, onBack }: AccessGateProps) {
  const [accessKey, setAccessKey] = useState('')
  const [error, setError] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [showKey, setShowKey] = useState(false)

  const config = {
    faculty: {
      title: 'Faculty Portal',
      subtitle: 'Teaching Staff Access',
      gradient: 'from-emerald-600 to-teal-500',
      lightGradient: 'from-emerald-50 to-teal-50',
      accent: 'emerald',
      blurA: 'bg-emerald-100/50',
      blurB: 'bg-teal-100/40',
    },
    hod: {
      title: 'HOD Portal',
      subtitle: 'Department Head Access',
      gradient: 'from-violet-600 to-purple-500',
      lightGradient: 'from-violet-50 to-purple-50',
      accent: 'violet',
      blurA: 'bg-violet-100/50',
      blurB: 'bg-purple-100/40',
    },
  }

  const c = config[role]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accessKey.trim()) {
      setError('Access key is required')
      return
    }
    setIsVerifying(true)
    setError('')
    try {
      await apiVerifyGate(role, accessKey)
      onUnlock()
    } catch (err: any) {
      setError(err.message || 'Invalid access key')
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      <div className={`absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full ${c.blurA} blur-3xl pointer-events-none`} />
      <div className={`absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full ${c.blurB} blur-3xl pointer-events-none`} />

      <motion.div
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors"
          whileHover={{ x: -3 }}
        >
          <ArrowLeft className="w-4 h-4" /> Back to Role Selection
        </motion.button>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
          {/* Header */}
          <div className={`bg-gradient-to-r ${c.gradient} px-8 py-10 text-center relative overflow-hidden`}>
            <div className="absolute inset-0 opacity-10">
              <svg width="100%" height="100%">
                <defs>
                  <pattern id="gate-dots" width="20" height="20" patternUnits="userSpaceOnUse">
                    <circle cx="2" cy="2" r="1" fill="white" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#gate-dots)" />
              </svg>
            </div>
            <motion.div
              className="relative mx-auto w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-5 backdrop-blur-sm"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            >
              <Lock className="w-8 h-8 text-white" />
            </motion.div>
            <h2 className="text-xl font-bold text-white mb-1">{c.title}</h2>
            <p className="text-sm text-white/80">{c.subtitle}</p>
          </div>

          {/* Gate Form */}
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl mb-6">
              <Shield className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800">Institutional Access Required</p>
                <p className="text-xs text-amber-600 mt-0.5">Enter the access code provided by your administrator to proceed.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-600">Access Code</label>
                <div className="relative">
                  <Input
                    type={showKey ? 'text' : 'password'}
                    value={accessKey}
                    onChange={e => { setAccessKey(e.target.value); if (error) setError('') }}
                    placeholder="Enter institutional access code"
                    className={`h-12 pr-11 bg-slate-50 border-slate-200 rounded-xl text-base ${error ? 'border-red-400' : ''}`}
                    disabled={isVerifying}
                    autoFocus
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    onClick={() => setShowKey(!showKey)}
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <Button
                  type="submit"
                  className={`w-full h-12 bg-gradient-to-r ${c.gradient} text-white rounded-xl font-semibold shadow-lg`}
                  disabled={isVerifying}
                >
                  {isVerifying ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Verifying...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Unlock Portal
                    </div>
                  )}
                </Button>
              </motion.div>
            </form>
          </div>
        </div>
        <p className="text-center text-xs text-slate-400 mt-6">© {new Date().getFullYear()} Edu-Sync · Secure institutional access</p>
      </motion.div>
    </div>
  )
}
