'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { playClick, playReward } from '@/lib/sound'

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

type Region = any
type Exploration = any

export function ExplorationTab({
  characterId,
  notify,
  showReward,
  onRefresh,
}: {
  characterId: string
  notify: (msg: string) => void
  showReward?: (data: any, regionName: string) => void
  onRefresh?: () => void
}) {
  const [regions, setRegions] = useState<Region[]>([])
  const [explorations, setExplorations] = useState<Exploration[]>([])
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(Date.now())

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    const h = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(h)
  }, [])

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
    if (data.queued) {
      notify(data.message || `Exploration queue: will auto-start when current finishes.`)
    } else {
      notify(`Exploring ${region.name}! ETA: ${data.actualDuration} min`)
    }
    loadData()
    onRefresh?.()
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
        let msg = `Discovered: ${names}${data.gold > 0 ? ` (+${data.gold} Gold)` : ''}`
        notify(msg)
        if (data.discoveries.some((d: any) => d.rarity === 'rare' || d.rarity === 'epic' || d.rarity === 'legendary' || d.rarity === 'mythic')) {
          playReward()
        }
      } else {
        notify('Nothing special found this time.')
      }
    }
    if (data.autoStarted) {
      notify(`Next exploration auto-started!`)
    }
    loadData()
    onRefresh?.()
  }

  const cancelExploration = async (explorationId: string) => {
    playClick()
    const res = await fetch('/api/game/cancel-exploration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ explorationId, characterId }),
    })
    const data = await res.json()
    if (!res.ok) {
      notify(`Error: ${data.error}`)
      return
    }
    notify('Exploration cancelled')
    loadData()
    onRefresh?.()
  }

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '40px 20px' }}>
      <div className="loading-spinner" />
      <span style={{ color: '#888', fontSize: '11px' }}>Loading regions...</span>
    </div>
  )

  const activeExps = explorations.filter(e => !e.completed && !e.is_queued)
  const queuedExps = explorations.filter(e => e.is_queued)

  return (
    <div>
      <div className="panel-header">EXPLORATION</div>

      {activeExps.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ color: '#888', fontSize: '10px', marginBottom: '6px' }}>
            Active exploration:
          </div>
          {activeExps.map(exp => {
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
              <div style={{ color: '#0ff', fontSize: '11px', marginTop: '4px', fontFamily: 'monospace', fontWeight: 'bold' }}>
                {exp.finish_at ? formatRemaining(new Date(exp.finish_at).getTime() - now) : ''}
              </div>
              <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                <button
                  style={{ fontSize: '10px', flex: 1 }}
                  disabled={new Date(exp.finish_at!) > new Date()}
                  onClick={() => claimExploration(exp.id)}
                >
                  {new Date(exp.finish_at!) > new Date() ? 'IN PROGRESS...' : 'CLAIM'}
                </button>
                <button
                  className="btn-danger"
                  style={{ fontSize: '10px', flex: '0 0 auto', padding: '4px 8px' }}
                  onClick={() => cancelExploration(exp.id)}
                >
                  STOP
                </button>
              </div>
              </div>
            )
          })}
        </div>
      )}

      {queuedExps.length > 0 && (
        <div style={{ marginBottom: '12px', padding: '8px', border: '1px solid #333', borderRadius: '2px', background: 'var(--bg-secondary)' }}>
          {queuedExps.map(qe => (
            <div key={qe.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <div>
                <div style={{ color: '#ff0', fontSize: '10px' }}>
                  ⏳ Queued: {regions.find(r => r.id === qe.region)?.name || qe.region}
                </div>
                <div style={{ color: '#555', fontSize: '9px', marginTop: '2px' }}>
                  Will auto-start when active exploration completes.
                </div>
              </div>
              <button
                className="btn-danger"
                style={{ fontSize: '9px', padding: '4px 8px', flex: '0 0 auto' }}
                onClick={() => cancelExploration(qe.id)}
              >
                CANCEL
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="feature-grid">
        {regions.map(region => {
          return (
            <div key={region.id} className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                {region.icon_path ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={region.icon_path} alt={region.name}
                    style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '2px', border: '1px solid var(--border)' }} />
                ) : (
                  <div style={{ width: '36px', height: '36px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: '14px' }}>
                    ?
                  </div>
                )}
                <div style={{ color: '#0ff', fontSize: '12px', fontWeight: 'bold' }}>{region.name}</div>
              </div>
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
