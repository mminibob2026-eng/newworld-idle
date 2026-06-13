'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { RARITY_COLORS } from '@/lib/game-data'
import { playClick } from '@/lib/sound'

type Character = any
type Profession = any
type Contract = any
type Exploration = any
type Discovery = any

const TIPS = [
  'You can have 1 active + 1 queued activity per category',
  'Complete contracts for gold and knowledge points',
  'Exploration can discover rare and valuable items',
  'Higher Luck increases your chance of discoveries',
  'Start both a profession and exploration at the same time',
  'Check your discoveries in the Collection tab',
  'Attributes affect your gameplay — spend them wisely',
  'Come back later — offline progress is calculated automatically',
  'Contracts refresh daily with up to 12 completions',
  'STR boosts item yield, DEX speeds up all activities',
]

const PROF_EMOJIS: Record<string, string> = {
  woodcutting: '🪵', mining: '⛏️', fishing: '🎣', farming: '🌱',
  crafting: '🔧', cooking: '🍳', alchemy: '⚗️',
}

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

export function DashboardTab({
  character, professions, explorations, discoveries, onRefresh, notify,
}: {
  character: Character
  professions: Profession[]
  explorations: Exploration[]
  discoveries: Discovery[]
  onRefresh: () => void
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void
}) {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [now, setNow] = useState(Date.now())
  const [tipIndex, setTipIndex] = useState(0)

  useEffect(() => { loadData() }, [])
  useEffect(() => { const h = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(h) }, [])
  useEffect(() => { const h = setInterval(() => setTipIndex(i => (i + 1) % TIPS.length), 12000); return () => clearInterval(h) }, [])

  const loadData = async () => {
    const supabase = createClient()
    const { data: contr } = await supabase
      .from('contracts')
      .select('*')
      .eq('character_id', character.id)
      .eq('completed', false)
      .gte('expires_at', new Date().toISOString())
    setContracts(contr?.slice(0, 3) ?? [])
  }

  const xpForNext = Math.floor(100 * Math.pow(character.level, 1.5))
  const xpPct = Math.min(100, ((character.xp || 0) / xpForNext) * 100)
  const activeProfs = professions.filter((p: Profession) => p.is_active)
  const queuedProfs = professions.filter((p: Profession) => p.is_queued)
  const activeExp = explorations.find((e: Exploration) => !e.completed && !e.is_queued && e.finish_at)

  const assignPoint = async (attr: string) => {
    if (!character.attribute_points) return
    playClick()
    const res = await fetch('/api/game/assign-attribute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ characterId: character.id, attribute: attr }),
    })
    const data = await res.json()
    if (!res.ok) { notify(`Error: ${data.error}`, 'error'); return }
    notify(`+1 ${attr.toUpperCase()}`, 'success')
    onRefresh()
  }

  const [cancelConfirm, setCancelConfirm] = useState<{ type: 'profession' | 'exploration'; id: string; name: string } | null>(null)

  const cancelActivity = async () => {
    if (!cancelConfirm) return
    playClick()
    const endpoint = cancelConfirm.type === 'profession'
      ? '/api/game/cancel-profession'
      : '/api/game/cancel-exploration'
    const body = cancelConfirm.type === 'profession'
      ? { professionId: cancelConfirm.id, characterId: character.id }
      : { explorationId: cancelConfirm.id, characterId: character.id }
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) { notify(`Error: ${data.error}`, 'error'); return }
    notify(`${cancelConfirm.type === 'profession' ? 'Profession' : 'Exploration'} cancelled`, 'info')
    setCancelConfirm(null)
    onRefresh()
  }

  const attrDefs = [
    { key: 'strength', label: 'STR', desc: '+2% Gathering Yield/point', effect: '+2% item quantity per action' },
    { key: 'dexterity', label: 'DEX', desc: '+1% Action Speed/point', effect: '-1% action time, +1% exploration speed' },
    { key: 'intelligence', label: 'INT', desc: '+2% Knowledge Point Gain/point', effect: '+2% KP gain, more discovery rolls' },
    { key: 'endurance', label: 'END', desc: '+2% Offline Reward Efficiency/point', effect: '+2% rewards when offline' },
    { key: 'luck', label: 'LCK', desc: '+1% Discovery Chance/point', effect: '+1% discovery hit rate' },
    { key: 'charisma', label: 'CHA', desc: '+2% Contract Reward Value/point', effect: '+2% gold from contracts' },
  ] as const

  return (
    <div>
      {/* Tips Banner */}
      <div style={{
        background: 'rgba(0,255,255,0.06)', border: '1px solid rgba(0,255,255,0.15)',
        padding: '8px 10px', marginBottom: '10px', fontSize: '10px', color: '#0ff',
        borderRadius: '2px', display: 'flex', alignItems: 'center', gap: '6px',
      }}>
        <span style={{ fontSize: '14px', flexShrink: 0 }}>💡</span>
        <span style={{ flex: 1, minWidth: 0 }}>{TIPS[tipIndex]}</span>
      </div>

      <div className="panel-header">HOME</div>

      {/* Character Overview */}
      <div className="card" style={{ marginBottom: '10px', cursor: 'default' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ color: '#0ff', fontSize: '16px', fontWeight: 'bold' }}>{character.name}</span>
            <span style={{ color: '#888', fontSize: '11px', marginLeft: '8px' }}>Lv.{character.level}</span>
            <span style={{ color: '#555', fontSize: '10px', marginLeft: '6px' }}>{character.region.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}</span>
          </div>
          <div style={{ display: 'flex', gap: '10px', fontSize: '11px', flexShrink: 0 }}>
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

      {/* Current Activities */}
      <div className="panel" style={{ marginBottom: '10px', padding: '10px' }}>
        <div style={{ color: '#0ff', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
          CURRENT ACTIVITIES
        </div>

        {activeProfs.map(prof => (
          <div key={prof.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: '18px' }}>{PROF_EMOJIS[prof.profession] || '⏳'}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}>
                  {prof.profession.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                </span>
                <span style={{ color: '#888', fontSize: '10px' }}>Lv.{prof.level}</span>
              </div>
              <div style={{ color: '#ff0', fontSize: '12px', marginTop: '2px', fontFamily: 'monospace', fontWeight: 'bold' }}>
                {prof.finish_at ? formatRemaining(new Date(prof.finish_at).getTime() - now) : ''}
              </div>
              <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                <button className="btn-danger" style={{ fontSize: '9px', padding: '4px 8px', flex: 1 }}
                  onClick={() => setCancelConfirm({ type: 'profession', id: prof.profession, name: prof.profession })}>
                  STOP
                </button>
              </div>
            </div>
          </div>
        ))}

        {activeExp && (activeProfs.length > 0 ? <div style={{ borderTop: '1px solid var(--border)', marginTop: '4px' }} /> : null)}
        {activeExp ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0' }}>
            <span style={{ fontSize: '18px' }}>🧭</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}>
                  Exploring {activeExp.region.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                </span>
              </div>
              <div style={{ color: '#0ff', fontSize: '12px', marginTop: '2px', fontFamily: 'monospace', fontWeight: 'bold' }}>
                {activeExp.finish_at ? formatRemaining(new Date(activeExp.finish_at).getTime() - now) : ''}
              </div>
              <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                <button className="btn-danger" style={{ fontSize: '9px', padding: '4px 8px', flex: 1 }}
                  onClick={() => setCancelConfirm({ type: 'exploration', id: activeExp.id, name: activeExp.region })}>
                  STOP
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {queuedProfs.map(qp => (
          <div key={qp.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', color: '#ff0', borderTop: '1px solid var(--border)', marginTop: '4px' }}>
            <span style={{ fontSize: '16px' }}>⏳</span>
            <span style={{ fontSize: '11px' }}>
              Queued: {qp.profession.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
              <span style={{ color: '#888', marginLeft: '6px' }}>(will auto-start)</span>
            </span>
          </div>
        ))}

        {activeProfs.length === 0 && !activeExp && queuedProfs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '12px 0', color: '#555' }}>
            <div style={{ fontSize: '24px', marginBottom: '6px' }}>💤</div>
            <div style={{ fontSize: '11px' }}>All idle. Start an activity to progress!</div>
          </div>
        )}
      </div>

      {/* Cancel Confirmation Dialog */}
      {cancelConfirm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'var(--bg-tertiary)', border: '1px solid var(--red)',
            padding: '20px', maxWidth: '320px', width: '90%',
            boxShadow: '0 0 30px rgba(255,0,0,0.2)',
          }}>
            <div style={{ color: '#f44', fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>
              ⚠️ Stop Activity?
            </div>
            <div style={{ color: '#ccc', fontSize: '11px', marginBottom: '16px' }}>
              You will lose all progress on this {cancelConfirm.type}. 
              <span style={{ color: '#f44' }}>This cannot be undone.</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-danger" style={{ flex: 1 }} onClick={cancelActivity}>
                YES, STOP
              </button>
              <button style={{ flex: 1 }} onClick={() => setCancelConfirm(null)}>
                KEEP GOING
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recent Discoveries + Active Contracts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div className="panel" style={{ padding: '10px' }}>
          <div style={{ color: '#0ff', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
            Recent Discoveries
          </div>
          {discoveries.length === 0 ? (
            <div style={{ color: '#555', fontSize: '10px' }}>Go explore to find discoveries!</div>
          ) : (
            discoveries.map((d: any) => (
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

        <div className="panel" style={{ padding: '10px' }}>
          <div style={{ color: '#0ff', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
            Active Contracts
          </div>
          {contracts.length === 0 ? (
            <div style={{ color: '#555', fontSize: '10px' }}>Generate contracts to start working.</div>
          ) : (
            contracts.map((c: any) => (
              <div key={c.id} style={{ fontSize: '10px', padding: '3px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: '#888' }}>{c.requirement_item.replace(/_/g, ' ')} x{c.requirement_qty}</span>
                <span style={{ color: '#ff0', marginLeft: '6px' }}>+{c.reward_gold}g</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Attributes */}
      <div style={{ marginTop: '10px' }}>
        <div className="panel-header">ATTRIBUTES</div>
        <div style={{ color: '#888', fontSize: '10px', marginBottom: '8px' }}>
          Points available: <span style={{ color: '#0ff', fontWeight: 'bold' }}>{character.attribute_points}</span>
        </div>
        <div className="feature-grid">
          {attrDefs.map(attr => (
            <div key={attr.key} className="card" style={{ cursor: character.attribute_points > 0 ? 'pointer' : 'default' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#0ff', fontSize: '12px', fontWeight: 'bold' }}>{attr.label}</span>
                <span style={{ color: '#fff', fontSize: '14px' }}>{(character as any)[attr.key]}</span>
              </div>
              <div style={{ color: '#555', fontSize: '9px', marginTop: '2px' }}>{attr.desc}</div>
              <div style={{ color: '#666', fontSize: '8px', marginTop: '1px' }}>{attr.effect}</div>
              {character.attribute_points > 0 && (
                <button style={{ marginTop: '6px', width: '100%' }} onClick={() => assignPoint(attr.key)}>+1</button>
              )}
            </div>
          ))}
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
          <span style={{ color: '#555' }}>AP</span>
        </div>
        <div className="resource">
          <span style={{ color: '#0ff', fontWeight: 'bold' }}>{character.level}</span>
          <span style={{ color: '#555' }}>Level</span>
        </div>
        <div className="resource">
          <span style={{ color: '#0ff', fontWeight: 'bold' }}>{explorations.filter((e: any) => !e.completed).length}</span>
          <span style={{ color: '#555' }}>Active Exp.</span>
        </div>
      </div>
    </div>
  )
}
