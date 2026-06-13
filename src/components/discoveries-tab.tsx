'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { RARITY_COLORS } from '@/lib/game-data'
import { playDiscovery } from '@/lib/sound'

type Discovery = any

export function DiscoveriesTab({ accountId }: { accountId: string }) {
  const [allDiscoveries, setAllDiscoveries] = useState<Discovery[]>([])
  const [found, setFound] = useState<Set<string>>(new Set())
  const [foundDetails, setFoundDetails] = useState<Record<string, any>>({})
  const [timeline, setTimeline] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [regions, setRegions] = useState<Record<string, string>>({})
  const [justFound, setJustFound] = useState<string | null>(null)
  const [expandedDisc, setExpandedDisc] = useState<string | null>(null)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const supabase = createClient()

    const { data: regs } = await supabase.from('content_regions').select('id, name')
    const regionMap: Record<string, string> = {}
    for (const r of regs ?? []) regionMap[r.id] = r.name
    setRegions(regionMap)

    const { data: discs } = await supabase
      .from('content_discoveries')
      .select('*')
      .order('rarity', { ascending: false })

    const { data: playerDiscs } = await supabase
      .from('player_discoveries')
      .select('discovery_id, region_id, lore, discovered_at')
      .eq('account_id', accountId)
      .order('discovered_at', { ascending: false })

    setAllDiscoveries(discs ?? [])
    setFound(new Set((playerDiscs ?? []).map((d: any) => d.discovery_id)))

    const details: Record<string, any> = {}
    for (const pd of playerDiscs ?? []) {
      if (!details[pd.discovery_id]) {
        details[pd.discovery_id] = {
          region: (pd.region_id ? regionMap[pd.region_id] : null) || 'Unknown',
          regionId: pd.region_id,
          lore: pd.lore,
          discoveredAt: pd.discovered_at,
        }
      }
    }
    setFoundDetails(details)
    setTimeline(playerDiscs ?? [])
    setLoading(false)
  }

  useEffect(() => {
    if (justFound) {
      playDiscovery()
      const timer = setTimeout(() => setJustFound(null), 1000)
      return () => clearTimeout(timer)
    }
  }, [justFound])

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '40px 20px' }}>
      <div className="loading-spinner" />
      <span style={{ color: '#888', fontSize: '11px' }}>Loading discoveries...</span>
    </div>
  )

  const total = allDiscoveries.length
  const foundCount = found.size
  const pct = total > 0 ? Math.round((foundCount / total) * 100) : 0

  const rarityOrder = ['mythic', 'legendary', 'epic', 'rare', 'uncommon', 'common']
  const filtered = filter === 'all'
    ? allDiscoveries
    : filter === 'found'
    ? allDiscoveries.filter(d => found.has(d.id))
    : filter === 'missing'
    ? allDiscoveries.filter(d => !found.has(d.id))
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
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px', justifyContent: 'center' }}>
        {rarityOrder.map(rarity => {
          const totalOfRarity = allDiscoveries.filter(d => d.rarity === rarity).length
          const foundOfRarity = allDiscoveries.filter(d => d.rarity === rarity && found.has(d.id)).length
          return (
            <div key={rarity} style={{
              textAlign: 'center', padding: '6px 8px',
              background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
              borderRadius: '2px', minWidth: '60px',
            }}>
              <div style={{ color: RARITY_COLORS[rarity as keyof typeof RARITY_COLORS] || '#888', fontSize: '12px', fontWeight: 'bold' }}>
                {foundOfRarity}/{totalOfRarity}
              </div>
              <div style={{ color: '#555', fontSize: '8px', textTransform: 'capitalize' }}>{rarity}</div>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '10px', flexWrap: 'wrap' }}>
        {(['all', 'found', 'missing'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            background: filter === f ? 'var(--accent-dim)' : 'none',
            borderColor: filter === f ? 'var(--accent)' : 'var(--border)',
            flex: '1 1 auto',
          }}>
            {f === 'all' ? 'ALL' : f === 'found' ? 'FOUND' : 'MISSING'}
          </button>
        ))}
        {rarityOrder.map(r => (
          <button key={r} onClick={() => setFilter(r)} style={{
            background: filter === r ? 'var(--accent-dim)' : 'none',
            borderColor: filter === r ? 'var(--accent)' : 'var(--border)',
            color: RARITY_COLORS[r as keyof typeof RARITY_COLORS] || '#888',
            flex: '1 1 auto',
          }}>
            {r.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="feature-grid">
        {filtered.map(disc => {
          const isFound = found.has(disc.id)
          const details = foundDetails[disc.id]
          return (
            <div
              key={disc.id}
              className={`card ${isFound ? `rarity-${disc.rarity}` : ''} ${justFound === disc.id ? 'discovery-found' : ''}`}
              style={{
                opacity: isFound ? 1 : 0.4,
                cursor: isFound ? 'pointer' : 'default',
              }}
              onClick={() => isFound && setExpandedDisc(expandedDisc === disc.id ? null : disc.id)}
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
                  background: 'var(--bg-secondary)', padding: '2px 8px',
                  borderRadius: '2px',
                }}>
                  {disc.rarity}
                </span>
              </div>
              {isFound && disc.icon_path && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={disc.icon_path} alt={disc.name}
                  style={{ width: '64px', height: '64px', objectFit: 'contain', margin: '6px auto 0', display: 'block' }} />
              )}
              {isFound && (
                <div style={{ color: '#555', fontSize: '9px', marginTop: '4px' }}>
                  {details?.region && <span style={{ color: '#888' }}>📍 {details.region}</span>}
                </div>
              )}
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

              {/* Expanded lore */}
              {isFound && expandedDisc === disc.id && (
                <div style={{
                  marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border)',
                  animation: 'rewardIn 0.3s ease',
                }}>
                  <div style={{ color: '#888', fontSize: '9px', fontStyle: 'italic', lineHeight: '1.6' }}>
                    &ldquo;{disc.lore || disc.description}&rdquo;
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Timeline */}
      {timeline.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <div className="panel-header">DISCOVERY TIMELINE</div>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {timeline.map((t: any, i: number) => {
              const disc = allDiscoveries.find(d => d.id === t.discovery_id)
              return (
                <div key={t.id || i} style={{
                  display: 'flex', gap: '8px', padding: '6px 0',
                  borderBottom: '1px solid var(--border)',
                  fontSize: '10px', alignItems: 'center',
                  animation: i < 3 ? 'rewardIn 0.3s ease' : undefined,
                }}>
                  <span style={{
                    color: disc ? RARITY_COLORS[disc.rarity as keyof typeof RARITY_COLORS] || '#888' : '#888',
                    fontWeight: 'bold', minWidth: '80px',
                  }}>
                    {disc?.name || t.discovery_id}
                  </span>
                  <span style={{ color: '#555' }}>
                    📍 {(t.region_id ? regions[t.region_id] : null) || 'Unknown'}
                  </span>
                  <span style={{ color: '#555', marginLeft: 'auto', fontSize: '9px' }}>
                    {new Date(t.discovered_at).toLocaleDateString()}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
