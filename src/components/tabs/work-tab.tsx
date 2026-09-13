'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/lib/i18n'
import { createClient } from '@/lib/supabase'
import { JOBS, jobName, EDUCATION_STAGES } from '@/lib/game-data'
import { gameAPI } from '@/lib/game-api'

interface WorkTabProps {
  character: any
  onRefresh: () => Promise<void>
}

export function WorkTab({ character, onRefresh }: WorkTabProps) {
  const { t, locale } = useTranslation()
  const [jobs, setJobs] = useState<any[]>([])
  const [working, setWorking] = useState(false)
  const [activeShift, setActiveShift] = useState<any>(null)
  const [shiftTimer, setShiftTimer] = useState(0)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const supabase = createClient() as any

  useEffect(() => {
    loadJobs()
    loadActiveShift()
  }, [character.id])

  useEffect(() => {
    if (!activeShift) return
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - new Date(activeShift.shift_start).getTime()) / 1000)
      setShiftTimer(elapsed)
    }, 1000)
    return () => clearInterval(interval)
  }, [activeShift])

  async function loadJobs() {
    const { data } = await supabase
      .from('character_jobs')
      .select('*')
      .eq('character_id', character.id)
    setJobs(data || [])
  }

  async function loadActiveShift() {
    const { data } = await supabase
      .from('character_jobs')
      .select('*')
      .eq('character_id', character.id)
      .eq('status', 'working')
      .single()
    setActiveShift(data)
  }

  function showMsg(type: 'error' | 'success', msg: string) {
    if (type === 'error') setError(msg)
    else setSuccess(msg)
    setTimeout(() => { setError(''); setSuccess('') }, 3000)
  }

  async function startShift(jobId: string) {
    setWorking(true)
    setError('')
    const res = await gameAPI.startWork(jobId)
    if (res.ok) {
      showMsg('success', locale === 'zh' ? '开始工作！' : 'Shift started!')
      await loadActiveShift()
      await loadJobs()
      await onRefresh()
    } else {
      showMsg('error', res.error || 'Failed')
    }
    setWorking(false)
  }

  async function finishShift() {
    setWorking(true)
    setError('')
    const res = await gameAPI.finishWork()
    if (res.ok) {
      const xp = res.data?.xpEarned || 0
      showMsg('success', locale === 'zh' ? `完成工作！获得 ${xp} XP` : `Shift done! +${xp} XP`)
      setActiveShift(null)
      setShiftTimer(0)
      await loadJobs()
      await onRefresh()
    } else {
      showMsg('error', res.error || 'Failed')
    }
    setWorking(false)
  }

  function formatTime(seconds: number) {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${h}h ${m}m`
    if (m > 0) return `${m}m ${s}s`
    return `${s}s`
  }

  const highestEdu = character.highest_education || 'none'
  const eduOrder = ['none', 'junior_secondary', 'senior_secondary', 'diploma', 'bachelor', 'master', 'phd']
  const eduLevel = eduOrder.indexOf(highestEdu)

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">{t.work.title}</h2>

      {error && <div className="text-red-400 text-sm text-center">{error}</div>}
      {success && <div className="text-green-400 text-sm text-center">{success}</div>}

      {/* Active Shift */}
      {activeShift && (
        <div className="panel border border-blue-500/50">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-blue-400">{t.work.working}</div>
              <div className="text-sm opacity-60">
                {formatTime(shiftTimer)} / {JOBS.find(j => j.id === activeShift.job_id)?.shiftHours || 8}h
              </div>
            </div>
            <button
              className="btn-sm"
              disabled={working}
              onClick={finishShift}
            >
              {working ? '...' : t.work.claimReward}
            </button>
          </div>
          <div className="progress-bar mt-2">
            <div
              className="progress-fill bg-blue-500"
              style={{ width: `${Math.min(100, (shiftTimer / ((JOBS.find(j => j.id === activeShift.job_id)?.shiftHours || 8) * 3600)) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Jobs */}
      <div className="panel">
        <h3 className="font-bold mb-2">{t.work.jobs}</h3>
        <div className="space-y-2">
          {JOBS.map(job => {
            const charJob = jobs.find(j => j.job_id === job.id)
            const reqIdx = eduOrder.indexOf(job.minimumRequirement || 'none')
            const meetsEducation = eduLevel >= reqIdx
            const isActiveJob = activeShift?.job_id === job.id

            return (
              <div key={job.id} className="flex items-center justify-between text-sm p-2 rounded bg-white/5">
                <div className="flex-1">
                  <div className="font-bold">{jobName(job.id, locale)}</div>
                  <div className="text-xs opacity-60">
                    {job.energyPerShift}E • {job.income_base}g • Lv{job.levelRequired || 1}+
                  </div>
                  {charJob && (
                    <div className="text-xs opacity-60">
                      {t.work.workXP}: {charJob.work_xp} • {t.work.jobLevel}: {charJob.job_level}
                    </div>
                  )}
                </div>
                <button
                  className="btn-sm ml-2"
                  disabled={!meetsEducation || character.energy < job.energyPerShift || working || isActiveJob || !!activeShift}
                  onClick={() => startShift(job.id)}
                >
                  {!meetsEducation ? t.common.locked : isActiveJob ? t.work.working : t.work.startShift}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
