'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { RARITY_COLORS } from '@/lib/game-data'

type Character = any
type Profession = any
type Contract = any
type Exploration = any
type Discovery = any

export function DashboardTab({
  character,
  professions,
  onRefresh,
}: {
  character: Character
  professions: Profession[]
  onRefresh: () => void
}) {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [explorations, setExplorations] = useState<Exploration[]>([])
  const [discoveries, setDiscoveries] = useState<Discovery[]>([])

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const supabase = createClient()
    const { data: contr } = await supabase
      .from('contracts')
      .select('*')
      .eq('character_id', character.id)
      .eq('completed', false)
      .gte('expires_at', new Date().toISOString())
    setContracts(contr?.slice(0, 3) ?? [])

    const { data: exps } = await supabase
      .from('exploration')
      .select('*')
      .eq('character_id', character.id)
      .eq('completed', false)
      .order('created_at', { ascending: false })
      .limit(3)
    setExplorations(exps ?? [])

    const { data: discs } = await supabase
      .from('player_discoveries')
      .select('*, content_discoveries(*)')
      .eq('account_id', character.account_id)
      .order('discovered_at', { ascending: false })
      .limit(5)
    setDiscoveries(discs ?? [])
  }

  const xpForNext = Math.floor(100 * Math.pow(character.level, 1.5))
  const xpPct = Math.min(100, ((character.xp || 0) / xpForNext) * 100)
  const activeProf = professions.find(p => p.is_active)

  return (
    <div>
      <div className="panel-header">DASHBOARD</div>

      {/* Character Overview */}
      <div className="card" style={{ marginBottom: '10px', cursor: 'default' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ color: '#0ff', fontSize: '16px', fontWeight: 'bold' }}>{character.name}</span>
            <span style={{ color: '#888', fontSize: '11px', marginLeft: '8px' }}>Lv.{character.level}</span>
          </div>
          <div style={{ display: 'flex', gap: '12px', fontSize: '11px' }}>
            <span style={{ color: '#ff0' }}>● {character.gold.toLocaleString()}</span>
            <span style={{ color: '#f0f' }}>⚡ {character.knowledge.toLocaleString()}</span>
          </div>
        </div>
        <div style={{ marginTop: '6px' }}>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${xpPct}%` }} />
          </div>
          <div style={{ color: '#555', fontSize: '9px', marginTop: '2px' }}>
            XP: {character.xp.toLocaleString()} / {xpForNext.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Active Activities */}
      <div className="panel" style={{ marginBottom: '10px', padding: '10px' }}>
        <div style={{ color: '#0ff', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
          Current Activity
        </div>
        {activeProf ? (
          <div>
            <span style={{ color: '#888', fontSize: '11px' }}>
              {activeProf.profession.replace(/_/g, ' ')} — Lv.{activeProf.level}
            </span>
            <div className="progress-bar" style={{ marginTop: '4px' }}>
              <div className="progress-fill gold" style={{
                width: activeProf.finish_at
                  ? `${Math.min(100, ((Date.now() - new Date(activeProf.started_at!).getTime()) / (new Date(activeProf.finish_at!).getTime() - new Date(activeProf.started_at!).getTime())) * 100)}%`
                  : '0%'
              }} />
            </div>
          </div>
        ) : (
          <div style={{ color: '#555', fontSize: '11px' }}>
            No active profession. Start gathering or crafting!
          </div>
        )}
        {explorations.length > 0 && (
          <div style={{ marginTop: '6px' }}>
            {explorations.slice(0, 1).map(exp => (
              <div key={exp.id} style={{ fontSize: '10px', color: '#888' }}>
                Exploring: {exp.region.replace(/_/g, ' ')}
              </div>
            ))}
          </div>
        )}
        {!activeProf && explorations.length === 0 && (
          <div style={{ color: '#888', fontSize: '10px', marginTop: '4px' }}>
            All idle. Start an activity to progress.
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {/* Recent Discoveries */}
        <div className="panel" style={{ padding: '10px' }}>
          <div style={{ color: '#0ff', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
            Recent Discoveries
          </div>
          {discoveries.length === 0 ? (
            <div style={{ color: '#555', fontSize: '10px' }}>Go explore to find discoveries!</div>
          ) : (
            discoveries.map(d => (
              <div key={d.id} style={{ fontSize: '10px', padding: '3px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{
                  color: RARITY_COLORS[d.content_discoveries?.rarity as keyof typeof RARITY_COLORS] || '#888',
                }}>
                  {d.content_discoveries?.name || d.discovery_id}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Active Contracts */}
        <div className="panel" style={{ padding: '10px' }}>
          <div style={{ color: '#0ff', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
            Active Contracts
          </div>
          {contracts.length === 0 ? (
            <div style={{ color: '#555', fontSize: '10px' }}>Generate contracts to start working.</div>
          ) : (
            contracts.map(c => (
              <div key={c.id} style={{ fontSize: '10px', padding: '3px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: '#888' }}>{c.requirement_item.replace(/_/g, ' ')} x{c.requirement_qty}</span>
                <span style={{ color: '#ff0', marginLeft: '6px' }}>+{c.reward_gold}g</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <div className="resource">
          <span style={{ color: '#0ff', fontWeight: 'bold' }}>{professions.length}</span>
          <span style={{ color: '#555' }}>Professions</span>
        </div>
        <div className="resource">
          <span style={{ color: '#0ff', fontWeight: 'bold' }}>{character.attribute_points}</span>
          <span style={{ color: '#555' }}>AP Available</span>
        </div>
        <div className="resource">
          <span style={{ color: '#0ff', fontWeight: 'bold' }}>{character.level}</span>
          <span style={{ color: '#555' }}>Level</span>
        </div>
        <div className="resource">
          <span style={{ color: '#0ff', fontWeight: 'bold' }}>{character.region.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}</span>
          <span style={{ color: '#555' }}>Region</span>
        </div>
      </div>
    </div>
  )
}
