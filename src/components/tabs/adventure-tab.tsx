'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/lib/i18n'
import { createClient } from '@/lib/supabase'
import { ADVENTURES, adventureName } from '@/lib/game-data'
import { gameAPI } from '@/lib/game-api'

interface AdventureTabProps {
  character: any
  onRefresh: () => Promise<void>
}

export function AdventureTab({ character, onRefresh }: AdventureTabProps) {
  const { t, locale } = useTranslation()
  const [adventures, setAdventures] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [activeAdventure, setActiveAdventure] = useState<any>(null)
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState<string | null>(null)

  const supabase = createClient() as any

  useEffect(() => {
    loadHistory()
  }, [character.id])

  async function loadHistory() {
    const { data } = await supabase
      .from('character_adventures')
      .select('*, adventures(*)')
      .eq('character_id', character.id)
      .order('started_at', { ascending: false })
      .limit(20)
    setHistory(data || [])
  }

  function showMsg(type: 'error' | 'success', msg: string) {
    if (type === 'error') setError(msg)
    else setSuccess(msg)
    setTimeout(() => { setError(''); setSuccess('') }, 4000)
  }

  async function startAdventure(adventureId: string) {
    setLoading(adventureId)
    setError('')
    const res = await gameAPI.startAdventure(adventureId)
    if (res.ok) {
      const adv = ADVENTURES.find(a => a.id === adventureId)
      setActiveAdventure({
        id: res.data.adventureId,
        adventure: adv,
        adventureId,
      })
      showMsg('success', locale === 'zh' ? '冒险开始！' : 'Adventure started!')
    } else {
      showMsg('error', res.error || 'Failed')
    }
    setLoading(null)
  }

  async function resolveAdventure() {
    if (!activeAdventure || selectedChoice === null) return
    setLoading('resolve')
    setError('')
    const res = await gameAPI.resolveAdventure(activeAdventure.id, selectedChoice)
    if (res.ok) {
      const outcome = res.data?.outcome
      if (outcome?.success) {
        showMsg('success', locale === 'zh'
          ? `成功！获得 ${outcome.xp_reward || 0} XP`
          : `Success! +${outcome.xp_reward || 0} XP`)
      } else {
        showMsg('error', locale === 'zh' ? '冒险失败...' : 'Adventure failed...')
      }
      setActiveAdventure(null)
      setSelectedChoice(null)
      await loadHistory()
      await onRefresh()
    } else {
      showMsg('error', res.error || 'Failed')
    }
    setLoading(null)
  }

  function getAvailableAdventures() {
    return ADVENTURES.filter(a => character.level >= (a.levelRequired || 1))
  }

  function getSuccessRate(adventure: any) {
    const skillLevel = character.strength || 1
    return Math.min(95, Math.max(10, 50 + (skillLevel - adventure.levelRequired) * 5))
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">{t.adventure.title}</h2>

      {error && <div className="text-red-400 text-sm text-center">{error}</div>}
      {success && <div className="text-green-400 text-sm text-center">{success}</div>}

      {/* Active Adventure */}
      {activeAdventure && (
        <div className="panel border border-amber-500/50">
          <div className="font-bold text-amber-400 mb-2">
            {adventureName(activeAdventure.adventureId, locale)}
          </div>
          <p className="text-sm opacity-60 mb-4">
            {locale === 'zh'
              ? activeAdventure.adventure?.description_zh
              : activeAdventure.adventure?.description_en}
          </p>

          <div className="space-y-2">
            {(activeAdventure.adventure?.choices || []).map((choice: any, idx: number) => (
              <button
                key={idx}
                className={`w-full text-left p-3 rounded text-sm ${
                  selectedChoice === idx
                    ? 'bg-amber-500/20 border border-amber-500/50'
                    : 'bg-white/5 hover:bg-white/10'
                }`}
                onClick={() => setSelectedChoice(idx)}
              >
                {locale === 'zh' ? choice.text_zh : choice.text_en}
              </button>
            ))}
          </div>

          <button
            className="btn w-full mt-4"
            disabled={selectedChoice === null || loading === 'resolve'}
            onClick={resolveAdventure}
          >
            {loading === 'resolve' ? '...' : t.adventure.resolve}
          </button>
        </div>
      )}

      {/* Available Adventures */}
      {!activeAdventure && (
        <div className="panel">
          <h3 className="font-bold mb-2">{t.adventure.goAdventure} (10E)</h3>
          <div className="space-y-2">
            {getAvailableAdventures().map(adv => (
              <div key={adv.id} className="flex items-center justify-between p-3 rounded bg-white/5">
                <div className="flex-1">
                  <div className="font-bold text-sm">{adventureName(adv.id, locale)}</div>
                  <div className="text-xs opacity-60">
                    Lv{adv.levelRequired || 1}+ • {adv.skillBonus || 'str'}
                  </div>
                  <div className="text-xs opacity-60">
                    {t.adventure.successRate}: {getSuccessRate(adv)}%
                  </div>
                </div>
                <button
                  className="btn-sm ml-2"
                  disabled={character.energy < 10 || loading === adv.id}
                  onClick={() => startAdventure(adv.id)}
                >
                  {loading === adv.id ? '...' : t.adventure.start}
                </button>
              </div>
            ))}
            {getAvailableAdventures().length === 0 && (
              <p className="text-sm opacity-60 text-center">{t.adventure.noAdventures}</p>
            )}
          </div>
          <p className="text-xs opacity-60 mt-2 text-center">{t.adventure.diminishingReturns}</p>
        </div>
      )}

      {/* Adventure Log */}
      <div className="panel">
        <h3 className="font-bold mb-2">{t.adventure.adventureLog}</h3>
        {history.length === 0 ? (
          <p className="text-sm opacity-60">{t.adventure.noAdventures}</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {history.map(h => (
              <div key={h.id} className={`p-2 rounded text-sm ${
                h.status === 'success' ? 'bg-green-500/10 border border-green-500/30'
                : h.status === 'failed' ? 'bg-red-500/10 border border-red-500/30'
                : 'bg-white/5'
              }`}>
                <div className="flex justify-between">
                  <span className="font-bold">{adventureName(h.adventure_id, locale)}</span>
                  <span className={`text-xs ${
                    h.status === 'success' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {h.status === 'success' ? t.adventure.success : t.adventure.failure}
                  </span>
                </div>
                {h.outcome?.xp_reward && (
                  <div className="text-xs opacity-60">+{h.outcome.xp_reward} XP</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
