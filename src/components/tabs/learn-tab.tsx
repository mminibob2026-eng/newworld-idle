'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/lib/i18n'
import { createClient } from '@/lib/supabase'
import { SKILLS, skillName, skillTierForLevel, EDUCATION_STAGES, xpForSkillLevel } from '@/lib/game-data'
import { gameAPI } from '@/lib/game-api'

interface LearnTabProps {
  character: any
  onRefresh: () => Promise<void>
}

export function LearnTab({ character, onRefresh }: LearnTabProps) {
  const { t, locale } = useTranslation()
  const [skills, setSkills] = useState<any[]>([])
  const [education, setEducation] = useState<any[]>([])
  const [studying, setStudying] = useState<string | null>(null)
  const [enrolling, setEnrolling] = useState<string | null>(null)
  const [progressing, setProgressing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const supabase = createClient() as any

  useEffect(() => {
    loadData()
  }, [character.id])

  async function loadData() {
    const { data: skillsData } = await supabase
      .from('character_skills')
      .select('*')
      .eq('character_id', character.id)
    setSkills(skillsData || [])

    const { data: eduData } = await supabase
      .from('character_education')
      .select('*')
      .eq('character_id', character.id)
    setEducation(eduData || [])
  }

  function showMsg(type: 'error' | 'success', msg: string) {
    if (type === 'error') setError(msg)
    else setSuccess(msg)
    setTimeout(() => { setError(''); setSuccess('') }, 3000)
  }

  async function studySkill(skillId: string) {
    setStudying(skillId)
    setError('')
    const res = await gameAPI.addSkillXP(skillId, 500)
    if (res.ok) {
      showMsg('success', locale === 'zh' ? '学习成功！' : 'Study complete!')
      await loadData()
      await onRefresh()
    } else {
      showMsg('error', res.error || 'Failed')
    }
    setStudying(null)
  }

  async function enrollStage(stageId: string) {
    setEnrolling(stageId)
    setError('')
    const res = await gameAPI.enrollEducation(stageId)
    if (res.ok) {
      showMsg('success', locale === 'zh' ? '已报名！' : 'Enrolled!')
      await loadData()
    } else {
      showMsg('error', res.error || 'Failed')
    }
    setEnrolling(null)
  }

  async function progressStage() {
    setProgressing(true)
    setError('')
    const res = await gameAPI.progressEducation(20)
    if (res.ok) {
      if (res.data?.completed) {
        showMsg('success', locale === 'zh' ? '毕业了！' : 'Graduated!')
      } else {
        showMsg('success', locale === 'zh' ? '进度+20%' : 'Progress +20%')
      }
      await loadData()
      await onRefresh()
    } else {
      showMsg('error', res.error || 'Failed')
    }
    setProgressing(false)
  }

  const activeEdu = education.find(e => e.status === 'active')

  const currentEduStages = EDUCATION_STAGES.map(stage => ({
    ...stage,
    enrolled: education.find(e => e.stage_id === stage.id && e.status === 'active'),
    completed: education.find(e => e.stage_id === stage.id && e.status === 'completed'),
  }))

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">{t.education.title} / {t.skills.title}</h2>

      {error && <div className="text-red-400 text-sm text-center">{error}</div>}
      {success && <div className="text-green-400 text-sm text-center">{success}</div>}

      {/* Education */}
      <div className="panel">
        <h3 className="font-bold mb-2">{t.education.title}</h3>
        <div className="space-y-2">
          {currentEduStages.map(stage => (
            <div key={stage.id} className="flex items-center justify-between text-sm p-2 rounded bg-white/5">
              <div className="flex-1">
                <div className="font-bold">{locale === 'zh' ? stage.name_zh : stage.name_en}</div>
                <div className="text-xs opacity-60">
                  {stage.mode} • {t.education.requires} {stage.prerequisite || '—'}
                </div>
                {stage.enrolled && (
                  <div className="progress-bar mt-1">
                    <div className="progress-fill" style={{ width: `${stage.enrolled.progress || 0}%` }} />
                  </div>
                )}
              </div>
              <div className="ml-2">
                {stage.completed ? (
                  <span className="text-green-400 text-xs">{t.education.complete}</span>
                ) : stage.enrolled ? (
                  <button
                    className="btn-sm"
                    disabled={progressing || character.energy < 5}
                    onClick={progressStage}
                  >
                    {progressing ? '...' : t.skills.study}
                  </button>
                ) : (
                  <button
                    className="btn-sm"
                    disabled={!!activeEdu || !!enrolling || character.energy < 10}
                    onClick={() => enrollStage(stage.id)}
                  >
                    {enrolling === stage.id ? '...' : t.education.startStudy}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Skills */}
      <div className="panel">
        <h3 className="font-bold mb-2">{t.skills.title}</h3>
        <div className="space-y-2">
          {SKILLS.map(skill => {
            const charSkill = skills.find(s => s.skill_id === skill.id)
            const level = charSkill?.level || 0
            const xp = charSkill?.xp || 0
            const tier = skillTierForLevel(level)
            const nextLevelXP = xpForSkillLevel(level)
            const isStudying = studying === skill.id

            return (
              <div key={skill.id} className="flex items-center justify-between text-sm p-2 rounded bg-white/5">
                <div className="flex-1">
                  <div className="font-bold">{skillName(skill.id, locale)}</div>
                  <div className="text-xs opacity-60">
                    {t.skills.levels[tier === 'mastery_candidate' ? 'masteryCandidate' : tier]} • {t.common.levelShort} {level}
                  </div>
                  <div className="progress-bar mt-1">
                    <div
                      className="progress-fill"
                      style={{ width: `${Math.min(100, (xp / nextLevelXP) * 100)}%` }}
                    />
                  </div>
                  <div className="text-xs opacity-60">{xp}/{nextLevelXP} XP</div>
                </div>
                <button
                  className="btn-sm ml-2"
                  disabled={character.energy < 10 || isStudying}
                  onClick={() => studySkill(skill.id)}
                >
                  {isStudying ? '...' : t.skills.study}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
