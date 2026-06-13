'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { RARITY_COLORS } from '@/lib/game-data'
import { playClick, playReward } from '@/lib/sound'

const CATEGORY_COLORS: Record<string, string> = {
  gathering: '#0f0',
  exploration: '#0ff',
  character: '#ff0',
  economy: '#f0f',
  social: '#f80',
  general: '#888',
}

const CATEGORY_LABELS: Record<string, string> = {
  gathering: 'GATHERING',
  exploration: 'EXPLORATION',
  character: 'CHARACTER',
  economy: 'ECONOMY',
  social: 'SOCIAL',
  general: 'GENERAL',
}

export function AchievementsTab({ accountId }: { accountId: string }) {
  const [achievements, setAchievements] = useState<any[]>([])
  const [playerAchs, setPlayerAchs] = useState<Record<string, any>>({})
  const [counters, setCounters] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [justClaimed, setJustClaimed] = useState<string | null>(null)

  useEffect(() => { loadData() }, [accountId])

  const loadData = async () => {
    const res = await fetch('/api/game/achievements')
    const data = await res.json()
    if (!res.ok) return
    setAchievements(data.achievements || [])
    setPlayerAchs(data.playerAchievements || {})
    setCounters(data.counters || {})
    setLoading(false)
  }

  const claimAchievement = async (achievementId: string) => {
    playClick()
    const res = await fetch('/api/game/claim-achievement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ achievementId }),
    })
    const data = await res.json()
    if (!res.ok) return
    playReward()
    setJustClaimed(achievementId)
    setTimeout(() => setJustClaimed(null), 2000)
    loadData()
  }

  if (loading) return <div style={{ color: '#888' }}>Loading achievements...</div>

  const categories = ['all', 'gathering', 'exploration', 'character', 'economy', 'social']
  const filtered = filter === 'all'
    ? achievements
    : achievements.filter(a => a.category === filter)

  const completedCount = Object.keys(playerAchs).filter(id => playerAchs[id].completed_at).length
  const claimedCount = Object.keys(playerAchs).filter(id => playerAchs[id].claimed_at).length
  const total = achievements.length

  return (
    <div>
      <div className="panel-header">ACHIEVEMENTS</div>

      {/* Stats */}
      <div className="panel" style={{ marginBottom: '12px', padding: '10px', textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <div>
            <div style={{ color: '#0ff', fontSize: '20px', fontWeight: 'bold' }}>{claimedCount} / {total}</div>
            <div style={{ color: '#888', fontSize: '10px' }}>Claimed</div>
          </div>
          <div>
            <div style={{ color: '#ff0', fontSize: '20px', fontWeight: 'bold' }}>{completedCount}</div>
            <div style={{ color: '#888', fontSize: '10px' }}>Completed</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '10px', flexWrap: 'wrap' }}>
        {categories.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)} style={{
            background: filter === cat ? 'var(--accent-dim)' : 'none',
            borderColor: filter === cat ? 'var(--accent)' : 'var(--border)',
            flex: '1 1 auto',
            fontSize: '9px',
          }}>
            {cat === 'all' ? 'ALL' : CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Achievement Grid */}
      <div className="feature-grid">
        {filtered.map(ach => {
          const playerAch = playerAchs[ach.id]
          const isCompleted = !!playerAch?.completed_at
          const isClaimed = !!playerAch?.claimed_at
          const progress = Math.min(ach.requirement_value, counters[ach.requirement_type] || 0)
          const pct = Math.min(100, (progress / ach.requirement_value) * 100)

          return (
            <div key={ach.id} className={`card ${isClaimed ? 'achievement-claimed' : ''} ${justClaimed === ach.id ? 'achievement-pop' : ''}`}
              style={{ opacity: isClaimed ? 1 : 0.7, border: `1px solid ${isClaimed ? 'var(--green)' : 'var(--border)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: RARITY_COLORS[ach.rarity as keyof typeof RARITY_COLORS] || '#888', fontSize: '10px', fontWeight: 'bold' }}>
                  {ach.category.toUpperCase()}
                </span>
                {isClaimed && <span style={{ color: '#0f0', fontSize: '10px' }}>✓ CLAIMED</span>}
                {isCompleted && !isClaimed && <span style={{ color: '#ff0', fontSize: '10px' }}>⚡ READY</span>}
              </div>

              <div style={{ color: '#fff', fontSize: '12px', fontWeight: 'bold', marginTop: '4px' }}>
                {ach.name}
              </div>
              <div style={{ color: '#888', fontSize: '9px', marginTop: '2px' }}>
                {ach.description}
              </div>

              {/* Progress bar */}
              <div style={{ marginTop: '6px' }}>
                <div className="progress-bar" style={{ height: '4px' }}>
                  <div className="progress-fill" style={{ width: `${pct}%`, background: isCompleted ? '#0f0' : '#0ff' }} />
                </div>
                <div style={{ color: '#888', fontSize: '8px', marginTop: '2px' }}>
                  {progress} / {ach.requirement_value}
                </div>
              </div>

              {/* Rewards */}
              <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', fontSize: '8px' }}>
                  {ach.reward_title && <span style={{ color: '#ff0' }}>🏆 {ach.reward_title}</span>}
                  {ach.reward_bob_coins > 0 && <span style={{ color: '#0ff' }}>🪙 {ach.reward_bob_coins} Bob Coins</span>}
                  {ach.reward_gold > 0 && <span style={{ color: '#ff0' }}>● {ach.reward_gold} Gold</span>}
                  {ach.reward_knowledge > 0 && <span style={{ color: '#f0f' }}>⚡ {ach.reward_knowledge} KP</span>}
                </div>
              </div>

              {/* Claim button */}
              {isCompleted && !isClaimed && (
                <button style={{ marginTop: '6px', width: '100%', fontSize: '10px' }} onClick={() => claimAchievement(ach.id)}>
                  CLAIM REWARD
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
