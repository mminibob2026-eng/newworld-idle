'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/lib/i18n'
import { createClient } from '@/lib/supabase'
import { SKILLS, skillName, xpForSkillLevel } from '@/lib/game-data'
import { gameAPI } from '@/lib/game-api'

interface TrainTabProps {
  character: any
  onRefresh: () => Promise<void>
}

const TRAINING_TYPES = [
  { id: 'fitness', skillId: 'fitness', energy: 15, nameKey: 'fitness' },
  { id: 'striking', skillId: 'striking', energy: 15, nameKey: 'striking' },
  { id: 'grappling', skillId: 'grappling', energy: 15, nameKey: 'grappling' },
]

export function TrainTab({ character, onRefresh }: TrainTabProps) {
  const { t, locale } = useTranslation()
  const [skills, setSkills] = useState<any[]>([])
  const [training, setTraining] = useState<any>(null)
  const [trainTimer, setTrainTimer] = useState(0)
  const [trainingType, setTrainingType] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const supabase = createClient() as any

  useEffect(() => {
    loadData()
    loadActiveTraining()
  }, [character.id])

  useEffect(() => {
    if (!training) return
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - new Date(training.started_at).getTime()) / 1000)
      setTrainTimer(elapsed)
    }, 1000)
    return () => clearInterval(interval)
  }, [training])

  async function loadData() {
    const { data } = await supabase
      .from('character_skills')
      .select('*')
      .eq('character_id', character.id)
    setSkills(data || [])
  }

  async function loadActiveTraining() {
    const { data } = await supabase
      .from('character_training')
      .select('*')
      .eq('character_id', character.id)
      .eq('status', 'training')
      .single()
    setTraining(data)
  }

  function showMsg(type: 'error' | 'success', msg: string) {
    if (type === 'error') setError(msg)
    else setSuccess(msg)
    setTimeout(() => { setError(''); setSuccess('') }, 3000)
  }

  async function startTraining(skillId: string) {
    setTrainingType(skillId)
    setError('')
    const res = await gameAPI.startTraining(skillId)
    if (res.ok) {
      showMsg('success', locale === 'zh' ? '开始训练！' : 'Training started!')
      await loadActiveTraining()
      await onRefresh()
    } else {
      showMsg('error', res.error || 'Failed')
    }
    setTrainingType(null)
  }

  async function finishTraining() {
    setTrainingType('finish')
    setError('')
    const res = await gameAPI.finishTraining()
    if (res.ok) {
      const xp = res.data?.xpEarned || 0
      showMsg('success', locale === 'zh' ? `训练完成！获得 ${xp} XP` : `Training done! +${xp} XP`)
      setTraining(null)
      setTrainTimer(0)
      await loadData()
      await onRefresh()
    } else {
      showMsg('error', res.error || 'Failed')
    }
    setTrainingType(null)
  }

  const stats = [
    { key: 'strength', label: t.combat.stats.str, value: character.strength },
    { key: 'dexterity', label: t.combat.stats.dex, value: character.dexterity },
    { key: 'intelligence', label: t.combat.stats.int, value: character.intelligence },
    { key: 'endurance', label: t.combat.stats.end, value: character.endurance },
    { key: 'luck', label: t.combat.stats.lck, value: character.luck },
    { key: 'charisma', label: t.combat.stats.cha, value: character.charisma },
  ]

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}m ${s}s`
  }

  const TRAIN_DURATION = 30 * 60 // 30 minutes in seconds

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">{t.train.title}</h2>

      {error && <div className="text-red-400 text-sm text-center">{error}</div>}
      {success && <div className="text-green-400 text-sm text-center">{success}</div>}

      {/* Active Training */}
      {training && (
        <div className="panel border border-purple-500/50">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-purple-400">{t.train.training}</div>
              <div className="text-sm opacity-60">
                {SKILLS.find(s => s.id === training.skill_id)?.name_en || training.skill_id} • {formatTime(trainTimer)} / 30m
              </div>
            </div>
            <button
              className="btn-sm"
              disabled={!!trainingType}
              onClick={finishTraining}
            >
              {trainingType === 'finish' ? '...' : t.train.finishTraining}
            </button>
          </div>
          <div className="progress-bar mt-2">
            <div
              className="progress-fill bg-purple-500"
              style={{ width: `${Math.min(100, (trainTimer / TRAIN_DURATION) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Training Types */}
      <div className="panel">
        <h3 className="font-bold mb-2">{t.train.fitness} / {t.train.striking} / {t.train.grappling}</h3>
        <div className="grid grid-cols-3 gap-2">
          {TRAINING_TYPES.map(type => {
            const skill = skills.find(s => s.skill_id === type.skillId)
            const level = skill?.level || 0
            return (
              <div key={type.id} className="p-3 rounded bg-white/5 text-center">
                <div className="font-bold text-sm">{t.train[type.nameKey as keyof typeof t.train]}</div>
                <div className="text-xs opacity-60">{t.common.levelShort} {level}</div>
                <button
                  className="btn-sm mt-2 w-full"
                  disabled={character.energy < type.energy || !!training || trainingType === type.skillId}
                  onClick={() => startTraining(type.skillId)}
                >
                  {trainingType === type.skillId ? '...' : `${type.energy}E ${t.train.train}`}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Personal Stats */}
      <div className="panel">
        <h3 className="font-bold mb-2">{t.train.personalStats}</h3>
        <div className="space-y-2">
          {stats.map(stat => (
            <div key={stat.key} className="flex items-center justify-between p-2 rounded bg-white/5">
              <span className="text-sm">{stat.label}</span>
              <span className="font-bold">{stat.value}</span>
            </div>
          ))}
        </div>
        {character.stat_points > 0 && (
          <div className="mt-2 text-xs text-amber-400">
            {t.common.statPoints}: {character.stat_points}
          </div>
        )}
      </div>

      {/* Rest/Recover */}
      <div className="panel">
        <h3 className="font-bold mb-2">{t.train.rest} / {t.train.recover}</h3>
        <div className="grid grid-cols-2 gap-2">
          <button className="btn" disabled={character.stress <= 0}>
            {t.train.stressRelief}
          </button>
          <button className="btn" disabled={character.fatigue <= 0}>
            {t.train.recover}
          </button>
        </div>
      </div>
    </div>
  )
}
