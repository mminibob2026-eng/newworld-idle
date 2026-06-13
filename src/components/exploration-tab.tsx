'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { playClick, playReward } from '@/lib/sound'

type Region = any
type Exploration = any

export function ExplorationTab({
  characterId,
  notify,
  showReward,
}: {
  characterId: string
  notify: (msg: string) => void
  showReward?: (data: any, regionName: string) => void
}) {
  const [regions, setRegions] = useState<Region[]>([])
  const [explorations, setExplorations] = useState<Exploration[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const supabase = createClient()
    const { data: regs } = await supabase.from('content_regions').select('*').order('required_level')
    setRegions(regs ?? [])

    const { data: exps } = await supabase
      .from('exploration')
      .select('*')
      .eq('character_id', characterId)
      .order('created_at', { ascending: false })
    setExplorations(exps ?? [])
    setLoading(false)
  }

  const startExploration = async (regionId: string) => {
    playClick()
    const region = regions.find(r => r.id === regionId)
    if (!region) return

    const res = await fetch('/api/game/start-exploration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ characterId, regionId }),
    })
    const data = await res.json()
    if (!res.ok) {
      notify(`Error: ${data.error}`)
      return
    }
    notify(`Exploring ${region.name}! ETA: ${data.actualDuration} min`)
    loadData()
  }

  const claimExploration = async (explorationId: string) => {
    playClick()
    const res = await fetch('/api/game/claim-exploration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ explorationId }),
    })
    const data = await res.json()
    if (!res.ok) {
      notify(`Error: ${data.error}`)
      return
    }
    const exp = explorations.find(e => e.id === explorationId)
    const regionName = regions.find(r => r.id === exp?.region)?.name || exp?.region || 'Unknown'
    if (showReward) {
      showReward(data, regionName)
    } else {
      if (data.discoveries && data.discoveries.length > 0) {
        const names = data.discoveries.map((d: any) => d.name).join(', ')
        notify(`Discovered: ${names}${data.gold > 0 ? ` (+${data.gold} Gold)` : ''}`)
        if (data.discoveries.some((d: any) => d.rarity === 'rare' || d.rarity === 'epic' || d.rarity === 'legendary' || d.rarity === 'mythic')) {
          playReward()
        }
      } else {
        notify('Nothing special found this time.')
      }
    }
    loadData()
  }

  if (loading) return <div style={{ color: '#888' }}>Loading regions...</div>

  const activeExps = explorations.filter(e => !e.completed)

  return (
    <div>
      <div className="panel-header">EXPLORATION</div>

      {activeExps.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ color: '#888', fontSize: '10px', marginBottom: '6px' }}>
            Active explorations ({activeExps.length}):
          </div>
          {activeExps.slice(0, 3).map(exp => {
            const region = regions.find(r => r.id === exp.region)
            const elapsed = Date.now() - new Date(exp.started_at).getTime()
            const total = new Date(exp.finish_at).getTime() - new Date(exp.started_at).getTime()
            const pct = Math.min(100, (elapsed / total) * 100)
            return (
              <div key={exp.id} className="card active" style={{ marginBottom: '6px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {region?.icon_path && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={region.icon_path} alt={region.name}
                      style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '2px' }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <span style={{ color: '#0ff', fontSize: '11px' }}>
                      {region?.name || exp.region}
                    </span>
                    <span className="exploring-badge" style={{ marginLeft: '6px' }}>IN PROGRESS</span>
                  </div>
                </div>
                <div className="progress-bar" style={{ marginTop: '6px' }}>
                  <div className="progress-fill gold" style={{ width: `${pct}%` }} />
                </div>
                <button
                  style={{ fontSize: '10px', marginTop: '6px', width: '100%' }}
                  onClick={() => claimExploration(exp.id)}
                >
                  CLAIM
                </button>
              </div>
            )
          })}
          {activeExps.length > 3 && (
            <div style={{ color: '#555', fontSize: '10px' }}>
              +{activeExps.length - 3} more in queue
            </div>
          )}
        </div>
      )}

      <div className="feature-grid">
        {regions.map(region => {
          return (
            <div key={region.id} className="card">
              {region.icon_path && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={region.icon_path} alt={region.name}
                  style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '2px', marginBottom: '6px' }} />
              )}
              <div style={{ color: '#0ff', fontSize: '12px', fontWeight: 'bold' }}>{region.name}</div>
              <div style={{ color: '#555', fontSize: '9px', marginTop: '2px' }}>{region.description}</div>
              <div style={{ fontSize: '10px', marginTop: '6px', color: '#888' }}>
                Requires Lv.{region.required_level} | {region.exploration_base_time} min
              </div>
              {region.unlock_cost_gold > 0 && (
                <div style={{ color: '#ff0', fontSize: '10px' }}>
                  Cost: {region.unlock_cost_gold.toLocaleString()} Gold
                </div>
              )}
              <button style={{ fontSize: '10px', marginTop: '8px', width: '100%' }} onClick={() => startExploration(region.id)}>
                EXPLORE
              </button>
            </div>
          )
        })}
      </div>

      {explorations.filter(e => e.completed).length > 0 && (
        <div style={{ marginTop: '12px' }}>
          <div className="panel-header" style={{ fontSize: '10px' }}>HISTORY</div>
          {explorations.filter(e => e.completed).slice(0, 5).map(exp => (
            <div key={exp.id} style={{ fontSize: '10px', color: '#555', padding: '2px 0' }}>
              {regions.find(r => r.id === exp.region)?.name || exp.region}
              {exp.discoveries && Array.isArray(exp.discoveries) && exp.discoveries.length > 0 && (
                <span style={{ color: '#0ff' }}> — found {exp.discoveries.map((d: any) => d.name).join(', ')}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
