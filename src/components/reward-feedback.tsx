'use client'

import { useEffect, useState } from 'react'
import { RARITY_COLORS } from '@/lib/game-data'

interface RewardItem {
  name: string
  qty: number
  rarity: string
}

interface RewardEvent {
  id: string
  title: string
  timeAway?: number
  items?: RewardItem[]
  discoveries?: { name: string; rarity: string; region?: string; lore?: string; icon_path?: string }[]
  xp?: number
  gold?: number
  levelUps?: { profession: string; from: number; to: number }[]
  charLevelUp?: { from: number; to: number }
}

export function useRewardFeed() {
  const [rewards, setRewards] = useState<RewardEvent[]>([])

  const addReward = (reward: Omit<RewardEvent, 'id'>) => {
    const id = Math.random().toString(36).slice(2)
    setRewards(prev => [...prev, { ...reward, id }])
    setTimeout(() => {
      setRewards(prev => prev.filter(r => r.id !== id))
    }, 5000)
  }

  return { rewards, addReward }
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function RewardFeed({ rewards }: { rewards: RewardEvent[] }) {
  return (
    <div style={{
      position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
      zIndex: 9999, pointerEvents: 'none', display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: '8px', width: '90%', maxWidth: '380px',
    }}>
      {rewards.map(r => (
        <div
          key={r.id}
          className="reward-burst"
          style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--accent)',
            padding: '14px 18px',
            textAlign: 'center',
            width: '100%',
            boxShadow: '0 0 30px var(--accent-glow)',
            animation: 'rewardIn 0.4s ease',
            maxHeight: '80vh',
            overflowY: 'auto',
            pointerEvents: 'auto',
          }}
        >
          {/* Title */}
          <div style={{ color: '#0ff', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>
            {r.title}
          </div>

          {/* Time away */}
          {r.timeAway !== undefined && (
            <div style={{ color: '#888', fontSize: '10px', marginBottom: '8px' }}>
              You were away for {formatDuration(r.timeAway)}
            </div>
          )}

          {/* Items */}
          {r.items && r.items.length > 0 && (
            <div style={{ marginBottom: '8px' }}>
              {r.items.map((item, i) => (
                <div
                  key={i}
                  className="reward-item"
                  style={{
                    color: RARITY_COLORS[item.rarity as keyof typeof RARITY_COLORS] || '#fff',
                    fontSize: '13px', fontWeight: 'bold', marginTop: '2px',
                  }}
                >
                  +{item.name} x{item.qty}
                </div>
              ))}
            </div>
          )}

          {/* XP */}
          {r.xp !== undefined && r.xp > 0 && (
            <div style={{ color: '#0ff', fontSize: '11px', marginBottom: '4px' }}>
              +{r.xp} XP
            </div>
          )}

          {/* Gold */}
          {r.gold !== undefined && r.gold > 0 && (
            <div style={{ color: '#ff0', fontSize: '11px', marginBottom: '4px' }}>
              +{r.gold} Gold
            </div>
          )}

          {/* Profession Level Ups */}
          {r.levelUps && r.levelUps.length > 0 && (
            <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid var(--border)' }}>
              {r.levelUps.map((lu, i) => (
                <div key={i} style={{ color: '#0ff', fontSize: '11px', fontWeight: 'bold', animation: 'levelPulse 0.5s ease infinite alternate' }}>
                  {lu.profession} Level {lu.from} &rarr; {lu.to}
                </div>
              ))}
            </div>
          )}

          {/* Character Level Up */}
          {r.charLevelUp && (
            <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid var(--border)' }}>
              <div style={{ color: '#ff0', fontSize: '14px', fontWeight: 'bold', animation: 'levelPulse 0.5s ease infinite alternate' }}>
                LEVEL UP! {r.charLevelUp.from} &rarr; {r.charLevelUp.to}
              </div>
            </div>
          )}

          {/* NEW DISCOVERY section */}
          {r.discoveries && r.discoveries.length > 0 && (
            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '2px solid var(--accent)' }}>
              <div style={{
                color: '#0ff', fontSize: '10px', textTransform: 'uppercase',
                letterSpacing: '2px', marginBottom: '6px',
                animation: 'rarityFlash 1s ease',
              }}>
                ✦ NEW DISCOVERY ✦
              </div>
              {r.discoveries.map((d, i) => (
                <div key={i} style={{ marginBottom: '6px' }}>
                  {d.icon_path && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={d.icon_path} alt={d.name}
                      style={{ width: '48px', height: '48px', objectFit: 'contain', margin: '0 auto 4px', display: 'block' }} />
                  )}
                  <div style={{
                    color: RARITY_COLORS[d.rarity as keyof typeof RARITY_COLORS] || '#fff',
                    fontSize: '14px', fontWeight: 'bold',
                  }}>
                    {d.name}
                  </div>
                  {d.region && (
                    <div style={{ color: '#888', fontSize: '9px' }}>
                      Found in: {d.region}
                    </div>
                  )}
                  {d.lore && (
                    <div style={{ color: '#555', fontSize: '9px', fontStyle: 'italic', marginTop: '2px', maxWidth: '300px', margin: '2px auto 0' }}>
                      &ldquo;{d.lore}&rdquo;
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
