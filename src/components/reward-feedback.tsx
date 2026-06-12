'use client'

import { useEffect, useState } from 'react'
import { RARITY_COLORS } from '@/lib/game-data'

interface RewardEvent {
  id: string
  items: { name: string; qty: number; rarity: string }[]
  xp?: number
  gold?: number
  type: 'profession' | 'exploration' | 'contract' | 'levelup'
}

export function useRewardFeed() {
  const [rewards, setRewards] = useState<RewardEvent[]>([])

  const addReward = (reward: Omit<RewardEvent, 'id'>) => {
    const id = Math.random().toString(36).slice(2)
    setRewards(prev => [...prev, { ...reward, id }])
    setTimeout(() => {
      setRewards(prev => prev.filter(r => r.id !== id))
    }, 3000)
  }

  return { rewards, addReward }
}

export function RewardFeed({ rewards }: { rewards: RewardEvent[] }) {
  return (
    <div style={{
      position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
      zIndex: 9999, pointerEvents: 'none', display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: '8px',
    }}>
      {rewards.map(r => (
        <div
          key={r.id}
          className="reward-burst"
          style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--accent)',
            padding: '10px 16px',
            textAlign: 'center',
            boxShadow: '0 0 20px var(--accent-glow)',
            animation: 'rewardIn 0.4s ease',
          }}
        >
          <div style={{ color: '#0ff', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
            {r.type.toUpperCase()}
          </div>
          {r.items.map((item, i) => (
            <div
              key={i}
              className="reward-item"
              style={{
                color: RARITY_COLORS[item.rarity as keyof typeof RARITY_COLORS] || '#fff',
                fontSize: '13px', fontWeight: 'bold', marginTop: '2px',
              }}
            >
              {item.name} x{item.qty}
            </div>
          ))}
          {r.xp && <div style={{ color: '#0ff', fontSize: '11px', marginTop: '4px' }}>+{r.xp} XP</div>}
          {r.gold && <div style={{ color: '#ff0', fontSize: '11px' }}>+{r.gold} Gold</div>}
          {r.type === 'levelup' && (
            <div style={{ color: '#0ff', fontSize: '16px', fontWeight: 'bold', marginTop: '4px', animation: 'levelPulse 0.5s ease infinite alternate' }}>
              LEVEL UP!
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
