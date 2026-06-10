'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

type Region = any
type Exploration = any

export function ExplorationTab({
  characterId,
  notify,
}: {
  characterId: string
  notify: (msg: string) => void
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
    const supabase = createClient()
    const region = regions.find(r => r.id === regionId)
    if (!region) return

    const now = new Date()
    const finishAt = new Date(now.getTime() + region.exploration_base_time * 60 * 1000)

    const { error } = await supabase
      .from('exploration')
      .insert({
        character_id: characterId,
        region: regionId,
        started_at: now.toISOString(),
        finish_at: finishAt.toISOString(),
        completed: false,
      })

    if (error) {
      notify(`Error: ${error.message}`)
      return
    }
    notify(`Exploring ${region.name}! ETA: ${region.exploration_base_time} min`)
    loadData()
  }

  const claimExploration = async (explorationId: string) => {
    const supabase = createClient()
    const { data: exp } = await supabase
      .from('exploration')
      .select('*')
      .eq('id', explorationId)
      .single()

    if (!exp) return

    const now = new Date()
    if (new Date(exp.finish_at) > now) {
      notify('Still exploring!')
      return
    }

    const { data: discoveries } = await supabase
      .from('content_region_discoveries')
      .select('*, content_discoveries(*)')
      .eq('region_id', exp.region)

    const found: any[] = []
    if (discoveries) {
      const totalWeight = discoveries.reduce((sum, d) => sum + d.weight, 0)
      for (let i = 0; i < 3; i++) {
        if (Math.random() > 0.4) continue
        let roll = Math.floor(Math.random() * totalWeight)
        for (const disc of discoveries) {
          roll -= disc.weight
          if (roll < 0) {
            found.push(disc.content_discoveries)
            break
          }
        }
      }
    }

    const value = found.reduce((sum, d) => sum + (d.base_value || 0), 0)

    await supabase
      .from('exploration')
      .update({ completed: true, discoveries: found })
      .eq('id', explorationId)

    if (value > 0) {
      const { data: char } = await supabase
        .from('characters')
        .select('gold')
        .eq('id', characterId)
        .single()

      if (char) {
        await supabase
          .from('characters')
          .update({ gold: char.gold + value })
          .eq('id', characterId)
      }
    }

    if (found.length > 0) {
      const names = found.map((d: any) => d.name).join(', ')
      notify(`Discovered: ${names}${value > 0 ? ` (+${value} Gold)` : ''}`)
    } else {
      notify('Nothing special found this time.')
    }
    loadData()
  }

  if (loading) return <div style={{ color: '#888' }}>Loading regions...</div>

  const activeExp = explorations.find(e => !e.completed)

  return (
    <div>
      <div className="panel-header">EXPLORATION</div>

      {activeExp && (
        <div className="card active" style={{ marginBottom: '12px' }}>
          <div style={{ color: '#0ff', fontSize: '12px' }}>
            Exploring: {regions.find(r => r.id === activeExp.region)?.name || activeExp.region}
          </div>
          <div className="progress-bar" style={{ marginTop: '6px' }}>
            <div className="progress-fill gold" style={{
              width: `${Math.min(100, ((Date.now() - new Date(activeExp.started_at).getTime()) / (new Date(activeExp.finish_at).getTime() - new Date(activeExp.started_at).getTime())) * 100)}%`
            }} />
          </div>
          <button
            style={{ fontSize: '10px', marginTop: '8px', width: '100%' }}
            onClick={() => claimExploration(activeExp.id)}
          >
            CLAIM
          </button>
        </div>
      )}

      <div className="feature-grid">
        {regions.map(region => {
          const isExploring = activeExp?.region === region.id
          return (
            <div
              key={region.id}
              className="card"
              style={{ opacity: isExploring ? 0.5 : 1 }}
            >
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
              {!isExploring && !activeExp && (
                <button style={{ fontSize: '10px', marginTop: '8px', width: '100%' }} onClick={() => startExploration(region.id)}>
                  EXPLORE
                </button>
              )}
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
