'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { RARITY_COLORS } from '@/lib/game-data'

type Discovery = any

export function DiscoveriesTab({ accountId }: { accountId: string }) {
  const [allDiscoveries, setAllDiscoveries] = useState<Discovery[]>([])
  const [found, setFound] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const supabase = createClient()
    const { data: discs } = await supabase
      .from('content_discoveries')
      .select('*')
      .order('rarity', { ascending: false })

    const { data: playerDiscs } = await supabase
      .from('player_discoveries')
      .select('discovery_id')
      .eq('account_id', accountId)

    setAllDiscoveries(discs ?? [])
    setFound(new Set((playerDiscs ?? []).map((d: any) => d.discovery_id)))
    setLoading(false)
  }

  if (loading) return <div style={{ color: '#888' }}>Loading discoveries...</div>

  const total = allDiscoveries.length
  const foundCount = found.size
  const pct = total > 0 ? Math.round((foundCount / total) * 100) : 0

  const rarityOrder = ['mythic', 'legendary', 'epic', 'rare', 'uncommon', 'common']
  const filtered = filter === 'all'
    ? allDiscoveries
    : filter === 'found'
    ? allDiscoveries.filter(d => found.has(d.id))
    : allDiscoveries.filter(d => !found.has(d.id) && d.rarity === filter)

  return (
    <div>
      <div className="panel-header">DISCOVERIES</div>
      <p style={{ color: '#888', fontSize: '10px', marginBottom: '8px' }}>
        Collect rare discoveries through exploration. Each discovery is permanently recorded.
      </p>

      {/* Stats */}
      <div className="panel" style={{ marginBottom: '12px', padding: '10px', textAlign: 'center' }}>
        <div style={{ color: '#0ff', fontSize: '24px', fontWeight: 'bold' }}>{foundCount} / {total}</div>
        <div style={{ color: '#888', fontSize: '11px' }}>Discoveries Collected</div>
        <div className="progress-bar" style={{ marginTop: '6px', maxWidth: '300px', margin: '6px auto 0' }}>
          <div className="progress-fill gold" style={{ width: `${pct}%` }} />
        </div>
        <div style={{ color: '#555', fontSize: '10px', marginTop: '4px' }}>{pct}% complete</div>
      </div>

      {/* Rarity Stats */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px', justifyContent: 'center' }}>
        {rarityOrder.map(rarity => {
          const totalOfRarity = allDiscoveries.filter(d => d.rarity === rarity).length
          const foundOfRarity = allDiscoveries.filter(d => d.rarity === rarity && found.has(d.id)).length
          return (
            <div key={rarity} style={{
              textAlign: 'center', padding: '6px 10px',
              background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
              borderRadius: '2px', minWidth: '70px',
            }}>
              <div style={{ color: RARITY_COLORS[rarity as keyof typeof RARITY_COLORS] || '#888', fontSize: '12px', fontWeight: 'bold' }}>
                {foundOfRarity}/{totalOfRarity}
              </div>
              <div style={{ color: '#555', fontSize: '9px', textTransform: 'capitalize' }}>{rarity}</div>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '10px', flexWrap: 'wrap' }}>
        <button onClick={() => setFilter('all')} style={{
          fontSize: '9px', padding: '2px 8px',
          background: filter === 'all' ? 'var(--accent-dim)' : 'none',
          borderColor: filter === 'all' ? 'var(--accent)' : 'var(--border)',
        }}>ALL</button>
        <button onClick={() => setFilter('found')} style={{
          fontSize: '9px', padding: '2px 8px',
          background: filter === 'found' ? 'var(--accent-dim)' : 'none',
          borderColor: filter === 'found' ? 'var(--accent)' : 'var(--border)',
        }}>FOUND</button>
        <button onClick={() => setFilter('missing')} style={{
          fontSize: '9px', padding: '2px 8px',
          background: filter === 'missing' ? 'var(--accent-dim)' : 'none',
          borderColor: filter === 'missing' ? 'var(--accent)' : 'var(--border)',
        }}>MISSING</button>
        {rarityOrder.map(r => (
          <button key={r} onClick={() => setFilter(r)} style={{
            fontSize: '9px', padding: '2px 8px',
            background: filter === r ? 'var(--accent-dim)' : 'none',
            borderColor: filter === r ? 'var(--accent)' : 'var(--border)',
            color: RARITY_COLORS[r as keyof typeof RARITY_COLORS] || '#888',
          }}>
            {r.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="feature-grid">
        {filtered.map(disc => {
          const isFound = found.has(disc.id)
          return (
            <div
              key={disc.id}
              className="card"
              style={{
                opacity: isFound ? 1 : 0.4,
                borderColor: isFound ? RARITY_COLORS[disc.rarity as keyof typeof RARITY_COLORS] || 'var(--border)' : 'var(--border)',
                cursor: 'default',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  fontSize: '14px',
                  color: RARITY_COLORS[disc.rarity as keyof typeof RARITY_COLORS] || '#888',
                  fontWeight: 'bold',
                }}>
                  {isFound ? disc.name : '???'}
                </span>
                <span style={{
                  fontSize: '10px', color: '#555',
                  background: 'var(--bg-secondary)', padding: '1px 6px',
                  borderRadius: '2px',
                }}>
                  {disc.rarity}
                </span>
              </div>
              {isFound && disc.description && (
                <div style={{ color: '#555', fontSize: '9px', marginTop: '4px' }}>
                  {disc.description}
                </div>
              )}
              {isFound && (
                <div style={{ color: '#888', fontSize: '9px', marginTop: '4px' }}>
                  Value: {disc.base_value} Gold
                </div>
              )}
              {!isFound && (
                <div style={{ color: '#555', fontSize: '9px', fontStyle: 'italic', marginTop: '4px' }}>
                  Not yet discovered
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
