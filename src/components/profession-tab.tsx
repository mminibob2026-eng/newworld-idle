'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { RARITY_COLORS } from '@/lib/game-data'
import { playClick, playReward, playLevelUp } from '@/lib/sound'

function formatRemaining(ms: number): string {
  if (ms <= 0) return 'Ready!'
  const totalSec = Math.floor(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  if (m >= 60) {
    const h = Math.floor(m / 60)
    const rm = m % 60
    return `${h}h ${rm}m remaining`
  }
  return `${m}m ${s}s remaining`
}

type Profession = any
type ContentProfession = any
type ContentReward = any

export function ProfessionTab({
  category,
  characterId,
  accountId,
  professions,
  onRefresh,
  notify,
  showReward,
}: {
  category: string
  characterId: string
  accountId: string
  professions: Profession[]
  onRefresh: () => void
  notify: (msg: string) => void
  showReward?: (data: any, professionName: string) => void
}) {
  const [available, setAvailable] = useState<ContentProfession[]>([])
  const [rewards, setRewards] = useState<Record<string, ContentReward[]>>({})
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    loadProfessions()
  }, [])

  useEffect(() => {
    const h = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(h)
  }, [])

  const loadProfessions = async () => {
    const supabase = createClient()
    const { data: profs } = await supabase
      .from('content_professions')
      .select('*')
      .eq('category', category)
    setAvailable(profs ?? [])

    const rewardMap: Record<string, ContentReward[]> = {}
    for (const p of profs ?? []) {
      const { data: r } = await supabase
        .from('content_profession_rewards')
        .select('*, content_items(*)')
        .eq('profession_id', p.id)
      rewardMap[p.id] = r ?? []
    }
    setRewards(rewardMap)
    setLoading(false)
  }

  const learnProfession = async (professionId: string) => {
    playClick()
    const prof = available.find(p => p.id === professionId)
    if (!prof) return
    const supabase = createClient()
    const { error } = await supabase
      .from('professions')
      .insert({ character_id: characterId, profession: professionId, category: prof.category })
    if (error) {
      notify(`Error: ${error.message}`)
      return
    }
    notify(`Learned ${prof.name}!`)
    onRefresh()
  }

  const startProfession = async (professionId: string) => {
    playClick()
    const res = await fetch('/api/game/start-profession', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ characterId, professionId, durationMinutes: 30 }),
    })
    const data = await res.json()
    if (!res.ok) {
      notify(`Error: ${data.error}`)
      return
    }
    if (data.queued) {
      notify(data.message || `Queued! Will auto-start when current slot frees.`)
    } else {
      notify(`Started ${available.find(p => p.id === professionId)?.name}! ETA: ${Math.floor(data.actualDuration)} min`)
    }
    onRefresh()
  }

  const claimProfession = async (professionId: string) => {
    playClick()
    const res = await fetch('/api/game/claim-profession', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ characterId, professionId }),
    })
    const data = await res.json()
    if (!res.ok) {
      notify(`Error: ${data.error}`)
      return
    }
    const profName = available.find(p => p.id === professionId)?.name || professionId
    if (showReward) {
      showReward(data, profName)
    } else {
      const itemSummary = Object.values(data.items).map((i: any) => `${i.name}x${i.qty}`).join(', ')
      const hasRare = Object.values(data.items).some((i: any) =>
        ['rare', 'epic', 'legendary', 'mythic'].includes(i.rarity)
      )
      if (hasRare) playReward()
      if (data.charLeveledUp) playLevelUp()
      notify(`[${professionId}] +${data.xpGained} XP | Got: ${itemSummary || 'nothing'}`)
    }
    onRefresh()
  }

  const cancelProfession = async (professionId: string) => {
    playClick()
    const res = await fetch('/api/game/cancel-profession', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ professionId, characterId }),
    })
    const data = await res.json()
    if (!res.ok) {
      notify(`Error: ${data.error}`)
      return
    }
    notify('Profession cancelled')
    onRefresh()
  }

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '40px 20px' }}>
      <div className="loading-spinner" />
      <span style={{ color: '#888', fontSize: '11px' }}>Loading professions...</span>
    </div>
  )

  const activeCount = professions.filter(p => p.is_active).length
  const queuedCount = professions.filter(p => p.is_queued).length

  return (
    <div>
      <div className="panel-header">{category.toUpperCase()}</div>
      {activeCount > 0 && (
        <div style={{ color: '#888', fontSize: '10px', marginBottom: '6px' }}>
          {activeCount} active session{activeCount > 1 ? 's' : ''}
          {queuedCount > 0 && ` | ${queuedCount} queued`}
        </div>
      )}
      {available.length === 0 && <div style={{ color: '#555', fontSize: '11px' }}>No professions available.</div>}

      <div className="feature-grid">
        {available.map(prof => {
          const learned = professions.find(p => p.profession === prof.id)
          const profRewards = rewards[prof.id] || []

          return (
            <div key={prof.id} className={`card ${learned?.is_active ? 'active pulsing' : ''} ${learned?.is_queued ? 'queued' : ''}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                {prof.icon_path ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={prof.icon_path} alt={prof.name}
                    style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '2px', border: '1px solid var(--border)' }} />
                ) : (
                  <div style={{ width: '32px', height: '32px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: '12px' }}>
                    ?
                  </div>
                )}
                <div>
                  <div style={{ color: '#0ff', fontSize: '12px', fontWeight: 'bold' }}>{prof.name}</div>
                  <div style={{ color: '#555', fontSize: '9px', marginTop: '2px' }}>{prof.description}</div>
                </div>
              </div>

              {learned?.is_queued && (
                <div style={{ fontSize: '10px', marginTop: '4px', color: '#ff0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>⏳ IN QUEUE — will auto-start when current finishes</span>
                  <button
                    className="btn-danger"
                    style={{ fontSize: '9px', padding: '4px 8px', marginLeft: '8px' }}
                    onClick={() => cancelProfession(prof.id)}
                  >
                    CANCEL
                  </button>
                </div>
              )}

              {learned ? (
                <>
                  <div style={{ fontSize: '10px', marginTop: '6px', color: '#888' }}>
                    Lv.{learned.level} | XP: {learned.xp}
                  </div>

                  {learned.is_active ? (
                    <div style={{ marginTop: '8px' }}>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{
                          width: learned.finish_at
                            ? `${Math.min(100, ((now - new Date(learned.started_at!).getTime()) / (new Date(learned.finish_at!).getTime() - new Date(learned.started_at!).getTime())) * 100)}%`
                            : '0%'
                        }} />
                      </div>
                      <div style={{ color: '#ff0', fontSize: '11px', marginTop: '4px', fontFamily: 'monospace', fontWeight: 'bold' }}>
                        {learned.finish_at ? formatRemaining(new Date(learned.finish_at).getTime() - now) : ''}
                      </div>
                      <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                        <button
                          style={{ fontSize: '10px', flex: 1 }}
                          disabled={new Date(learned.finish_at!) > new Date()}
                          onClick={() => claimProfession(prof.id)}
                        >
                          {new Date(learned.finish_at!) > new Date() ? 'IN PROGRESS...' : 'CLAIM'}
                        </button>
                        <button
                          className="btn-danger"
                          style={{ fontSize: '10px', flex: '0 0 auto', padding: '4px 8px' }}
                          onClick={() => cancelProfession(prof.id)}
                        >
                          STOP
                        </button>
                      </div>
                    </div>
                  ) : !learned.is_queued && (
                    <button style={{ fontSize: '10px', marginTop: '8px', width: '100%' }} onClick={() => startProfession(prof.id)}>
                      START (30min)
                    </button>
                  )}

                  {profRewards.length > 0 && (
                    <div style={{ marginTop: '6px', fontSize: '9px', color: '#555' }}>
                      <div>Rewards:</div>
                      {profRewards.map((r, i) => (
                        <div key={i} style={{ color: RARITY_COLORS[r.content_items?.rarity as keyof typeof RARITY_COLORS] || '#888' }}>
                          {r.content_items?.name || r.item_id} (Lv.{r.min_level})
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <button
                  className="btn-green"
                  style={{ fontSize: '10px', marginTop: '8px', width: '100%' }}
                  onClick={() => learnProfession(prof.id)}
                >
                  LEARN
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
