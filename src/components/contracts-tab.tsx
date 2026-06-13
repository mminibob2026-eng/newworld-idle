'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { playClick, playReward } from '@/lib/sound'

type Contract = any
type StorageItem = any

export function ContractsTab({
  characterId,
  storage,
  notify,
  onRefresh,
}: {
  characterId: string
  storage: StorageItem[]
  notify: (msg: string) => void
  onRefresh: () => void
}) {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [generated, setGenerated] = useState(false)
  const [dailyInfo, setDailyInfo] = useState<{
    completed: number
    remaining: number
    maxDaily: number
    resetDate: string
  } | null>(null)
  const [genLoading, setGenLoading] = useState(false)
  const [itemSources, setItemSources] = useState<Record<string, string>>({})

  useEffect(() => { loadContracts() }, [])

  const loadContracts = async () => {
    const supabase = createClient()

    // Build item→profession source map
    const { data: rewardRows } = await supabase
      .from('content_profession_rewards')
      .select('item_id, content_professions!inner(name)')
    const sourceMap: Record<string, string> = {}
    for (const row of rewardRows ?? []) {
      if (!sourceMap[row.item_id]) {
        sourceMap[row.item_id] = (row as any).content_professions?.name || ''
      }
    }
    setItemSources(sourceMap)
    const { data } = await supabase
      .from('contracts')
      .select('*')
      .eq('character_id', characterId)
      .eq('completed', false)
      .gte('expires_at', new Date().toISOString())
    setContracts(data ?? [])
    setGenerated(data ? data.length > 0 : false)
    setLoading(false)

    const { data: char } = await supabase
      .from('characters')
      .select('contracts_completed_today, contracts_reset_date')
      .eq('id', characterId)
      .single()

    if (char) {
      const today = new Date().toISOString().slice(0, 10)
      const resetDate = char.contracts_reset_date
      const completed = resetDate < today ? 0 : char.contracts_completed_today
      setDailyInfo({
        completed,
        remaining: 12 - completed,
        maxDaily: 12,
        resetDate: resetDate < today ? today : resetDate,
      })
    }
  }

  const generateContracts = async () => {
    playClick()
    setGenLoading(true)
    const res = await fetch('/api/game/generate-contracts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ characterId }),
    })
    const data = await res.json()
    setGenLoading(false)
    if (!res.ok) {
      notify(`Error: ${data.error}`)
      return
    }
    notify('New contracts generated!')
    loadContracts()
    onRefresh()
  }

  const completeContract = async (contractId: string) => {
    playClick()
    const res = await fetch('/api/game/complete-contract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contractId }),
    })
    const data = await res.json()
    if (!res.ok) {
      notify(`Error: ${data.error}`)
      return
    }
    playReward()
    notify(`Completed! +${data.gold} Gold${data.knowledge > 0 ? `, +${data.knowledge} KP` : ''}`)
    loadContracts()
    onRefresh()
  }

  const rerollContract = async (contractId: string) => {
    playClick()
    const res = await fetch('/api/game/reroll-contract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contractId }),
    })
    const data = await res.json()
    if (!res.ok) {
      notify(`Error: ${data.error}`)
      return
    }
    notify(`Re-rolled! New: ${data.requirement_item} x${data.requirement_qty} for ${data.reward_gold} Gold`)
    loadContracts()
    onRefresh()
  }

  if (loading) return <div style={{ color: '#888' }}>Loading contracts...</div>

  const getItemName = (itemId: string) => {
    const item = storage.find((s: any) => s.item_id === itemId)
    return item?.content_items?.name || itemId.replace(/_/g, ' ')
  }

  const today = new Date()
  const resetDateStr = dailyInfo?.resetDate || new Date().toISOString().slice(0, 10)
  const resetDate = new Date(resetDateStr + 'T23:59:59')
  const msUntilReset = resetDate.getTime() - today.getTime()
  const hoursToReset = Math.floor(msUntilReset / 3600000)
  const minsToReset = Math.floor((msUntilReset % 3600000) / 60000)

  return (
    <div>
      <div className="panel-header">CONTRACTS</div>
      <p style={{ color: '#888', fontSize: '10px', marginBottom: '8px' }}>
        Complete contracts for gold and knowledge. Max 12 per day.
      </p>

      {/* Daily progress bar */}
      {dailyInfo && (
        <div style={{ marginBottom: '12px', padding: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '2px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '4px' }}>
            <span style={{ color: '#888' }}>Daily Contracts</span>
            <span style={{ color: dailyInfo.remaining > 0 ? '#0ff' : '#f44' }}>
              {dailyInfo.completed}/{dailyInfo.maxDaily}
            </span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill gold" style={{ width: `${(dailyInfo.completed / dailyInfo.maxDaily) * 100}%` }} />
          </div>
          {dailyInfo.remaining === 0 ? (
            <div style={{ fontSize: '10px', color: '#f44', marginTop: '4px', textAlign: 'center' }}>
              Limit reached — resets in {hoursToReset}h {minsToReset}m
            </div>
          ) : (
            <div style={{ fontSize: '9px', color: '#555', marginTop: '4px', textAlign: 'center' }}>
              {dailyInfo.remaining} remaining today
            </div>
          )}
        </div>
      )}

      {/* Generate button */}
      {!generated && dailyInfo && dailyInfo.remaining > 0 && (
        <button
          onClick={generateContracts}
          disabled={genLoading}
          className="btn-gold"
          style={{ width: '100%', marginBottom: '12px' }}
        >
          {genLoading ? 'GENERATING...' : 'GENERATE CONTRACTS'}
        </button>
      )}

      {/* All done today */}
      {dailyInfo && dailyInfo.remaining === 0 && contracts.filter(c => !c.completed).length === 0 && (
        <div style={{ color: '#f44', fontSize: '11px', textAlign: 'center', padding: '20px' }}>
          Daily limit reached ({dailyInfo.maxDaily}/{dailyInfo.maxDaily}). Come back in {hoursToReset}h {minsToReset}m!
        </div>
      )}

      {/* All contracts completed but still have daily limit remaining */}
      {contracts.filter(c => !c.completed).length === 0 && generated && dailyInfo && dailyInfo.remaining > 0 && (
        <div style={{ color: '#555', fontSize: '11px', textAlign: 'center', padding: '20px' }}>
          All contracts completed! Generate new ones to keep going ({dailyInfo.remaining} left today).
        </div>
      )}

      {/* No contracts generated yet */}
      {!generated && contracts.length === 0 && (
        <div style={{ color: '#555', fontSize: '11px', textAlign: 'center', padding: '20px' }}>
          Generate contracts to start working.
        </div>
      )}

      {/* Active contracts grid */}
      <div className="feature-grid">
        {contracts.filter(c => !c.completed).map(contract => {
          const storageItem = storage.find((s: any) => s.item_id === contract.requirement_item)
          const hasEnough = storageItem && storageItem.quantity >= contract.requirement_qty

          return (
            <div key={contract.id} className="card" style={{ borderColor: hasEnough ? 'var(--accent)' : 'var(--border)' }}>
              <div style={{ fontSize: '11px', color: '#0ff', fontWeight: 'bold' }}>
                Deliver: {getItemName(contract.requirement_item)}
              </div>
              <div style={{ fontSize: '11px', marginTop: '4px' }}>
                Qty: <span style={{ color: hasEnough ? '#0f0' : '#f44' }}>{contract.requirement_qty}</span>
                <span style={{ color: '#555' }}> (have {storageItem?.quantity || 0})</span>
              </div>
              <div style={{ fontSize: '10px', color: '#888', marginTop: '4px' }}>
                <span style={{ color: '#ff0' }}>{contract.reward_gold} Gold</span>
                {contract.reward_knowledge > 0 && <span style={{ color: '#f0f' }}> | {contract.reward_knowledge} KP</span>}
              </div>
              <div style={{ fontSize: '9px', color: '#555', marginTop: '2px' }}>
                Faction: {contract.faction.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
              </div>
              {itemSources[contract.requirement_item] && (
                <div style={{ fontSize: '9px', color: '#888', marginTop: '2px' }}>
                  Source: <span style={{ color: '#0ff' }}>{itemSources[contract.requirement_item]}</span>
                </div>
              )}
              <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                <button
                  style={{ fontSize: '10px', flex: 1 }}
                  disabled={!hasEnough}
                  onClick={() => completeContract(contract.id)}
                >
                  COMPLETE
                </button>
                <button
                  onClick={() => rerollContract(contract.id)}
                  title="Re-roll contract (costs gold)"
                  style={{ flex: '0 0 auto', fontSize: '10px', padding: '4px 8px' }}
                >
                  ↻ REROLL
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
