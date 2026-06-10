'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { RARITY_COLORS } from '@/lib/game-data'

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
}: {
  category: string
  characterId: string
  accountId: string
  professions: Profession[]
  onRefresh: () => void
  notify: (msg: string) => void
}) {
  const [available, setAvailable] = useState<ContentProfession[]>([])
  const [rewards, setRewards] = useState<Record<string, ContentReward[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProfessions()
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
    const supabase = createClient()
    const { error } = await supabase
      .from('professions')
      .insert({ character_id: characterId, profession: professionId })
    if (error) {
      notify(`Error: ${error.message}`)
      return
    }
    notify(`Learned ${available.find(p => p.id === professionId)?.name}!`)
    onRefresh()
  }

  const startProfession = async (professionId: string) => {
    const supabase = createClient()
    const now = new Date()
    const finishAt = new Date(now.getTime() + 30 * 60 * 1000)

    const { error } = await supabase
      .from('professions')
      .update({
        is_active: true,
        started_at: now.toISOString(),
        finish_at: finishAt.toISOString(),
      })
      .eq('character_id', characterId)
      .eq('profession', professionId)

    if (error) {
      notify(`Error: ${error.message}`)
      return
    }
    notify(`Started ${available.find(p => p.id === professionId)?.name}! Come back in 30 min.`)
    onRefresh()
  }

  const claimProfession = async (professionId: string) => {
    const supabase = createClient()
    const prof = professions.find(p => p.profession === professionId)
    if (!prof || !prof.is_active) return

    const now = new Date()
    if (new Date(prof.finish_at!) > now) {
      notify('Still in progress!')
      return
    }

    const elapsedSeconds = Math.floor((now.getTime() - new Date(prof.started_at!).getTime()) / 1000)
    const { data: profData } = await supabase
      .from('content_professions')
      .select('base_time_seconds, base_xp_per_action')
      .eq('id', professionId)
      .single()

    if (!profData) return

    const actions = Math.min(
      Math.floor(elapsedSeconds / profData.base_time_seconds),
      Math.floor((24 * 3600) / profData.base_time_seconds)
    )

    if (actions <= 0) {
      notify('No time has passed yet.')
      return
    }

    const xpGained = actions * profData.base_xp_per_action
    const profRewards = rewards[professionId] || []
    const items: Record<string, { name: string; qty: number; rarity: string }> = {}

    for (let i = 0; i < actions; i++) {
      if (profRewards.length === 0) continue
      const totalWeight = profRewards.reduce((sum, r) => sum + r.weight, 0)
      let roll = Math.floor(Math.random() * totalWeight)
      for (const reward of profRewards) {
        roll -= reward.weight
        if (roll < 0) {
          const qty = Math.floor(Math.random() * (reward.max_qty - reward.min_qty + 1)) + reward.min_qty
          const itemName = reward.content_items?.name || reward.item_id
          if (items[reward.item_id]) {
            items[reward.item_id].qty += qty
          } else {
            items[reward.item_id] = { name: itemName, qty, rarity: reward.content_items?.rarity || 'common' }
          }
          break
        }
      }
    }

    for (const [itemId, info] of Object.entries(items)) {
      const { data: existing } = await supabase
        .from('storage')
        .select('*')
        .eq('account_id', accountId)
        .eq('item_type', 'item')
        .eq('item_id', itemId)
        .single()

      if (existing) {
        await supabase
          .from('storage')
          .update({ quantity: existing.quantity + info.qty })
          .eq('id', existing.id)
      } else {
        await supabase
          .from('storage')
          .insert({ account_id: accountId, item_type: 'item', item_id: itemId, quantity: info.qty })
      }
    }

    const xpNeeded = Math.floor(100 * Math.pow(prof.level, 1.5))
    const newXp = prof.xp + xpGained
    const levelUps = Math.floor(newXp / xpNeeded)

    await supabase
      .from('professions')
      .update({
        level: prof.level + levelUps,
        xp: newXp % xpNeeded,
        is_active: false,
        started_at: null,
        finish_at: null,
      })
      .eq('id', prof.id)

    const itemSummary = Object.values(items).map(i => `${i.name}x${i.qty}`).join(', ')
    notify(`[${prof.profession}] +${xpGained} XP | Got: ${itemSummary || 'nothing'}`)
    onRefresh()
  }

  if (loading) return <div style={{ color: '#888' }}>Loading professions...</div>

  return (
    <div>
      <div className="panel-header">{category.toUpperCase()}</div>
      {available.length === 0 && <div style={{ color: '#555', fontSize: '11px' }}>No professions available.</div>}

      <div className="feature-grid">
        {available.map(prof => {
          const learned = professions.find(p => p.profession === prof.id)
          const profRewards = rewards[prof.id] || []

          return (
            <div key={prof.id} className={`card ${learned?.is_active ? 'active' : ''}`}>
              <div style={{ color: '#0ff', fontSize: '12px', fontWeight: 'bold' }}>{prof.name}</div>
              <div style={{ color: '#555', fontSize: '9px', marginTop: '2px' }}>{prof.description}</div>

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
                            ? `${Math.min(100, ((Date.now() - new Date(learned.started_at!).getTime()) / (new Date(learned.finish_at!).getTime() - new Date(learned.started_at!).getTime())) * 100)}%`
                            : '0%'
                        }} />
                      </div>
                      <button style={{ fontSize: '10px', marginTop: '6px', width: '100%' }} onClick={() => claimProfession(prof.id)}>
                        CLAIM
                      </button>
                    </div>
                  ) : (
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
