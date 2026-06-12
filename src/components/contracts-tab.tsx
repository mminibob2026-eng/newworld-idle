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

  useEffect(() => { loadContracts() }, [])

  const loadContracts = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('contracts')
      .select('*')
      .eq('character_id', characterId)
      .eq('completed', false)
      .gte('expires_at', new Date().toISOString())
    setContracts(data ?? [])
    setGenerated(data ? data.length > 0 : false)
    setLoading(false)
  }

  const generateContracts = async () => {
    playClick()
    const supabase = createClient()
    const { data: templates } = await supabase
      .from('content_contracts')
      .select('*')

    if (!templates || templates.length === 0) {
      notify('No contracts available')
      return
    }

    const shuffled = templates.sort(() => Math.random() - 0.5).slice(0, 3)
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    const newContracts = shuffled.map(t => {
      const qty = Math.floor(Math.random() * (t.max_qty - t.min_qty + 1)) + t.min_qty
      return {
        character_id: characterId,
        contract_type: t.contract_type,
        requirement_item: t.requirement_item,
        requirement_qty: qty,
        reward_gold: qty * t.gold_reward_per_unit,
        reward_knowledge: t.knowledge_reward,
        faction: t.faction,
        expires_at: expiresAt.toISOString(),
      }
    })

    const { error } = await (supabase as any).from('contracts').insert(newContracts)
    if (error) {
      notify(`Error: ${error.message}`)
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

  return (
    <div>
      <div className="panel-header">CONTRACTS</div>
      <p style={{ color: '#888', fontSize: '10px', marginBottom: '8px' }}>
        Complete contracts for gold and knowledge. Generate 3 new contracts per day.
      </p>

      {!generated && (
        <button onClick={generateContracts} className="btn-gold" style={{ width: '100%', marginBottom: '12px' }}>
          GENERATE CONTRACTS
        </button>
      )}

      {contracts.filter(c => !c.completed).length === 0 && generated && (
        <div style={{ color: '#555', fontSize: '11px', textAlign: 'center', padding: '20px' }}>
          All contracts completed! Come back tomorrow for new ones.
        </div>
      )}

      {!generated && contracts.length === 0 && (
        <div style={{ color: '#555', fontSize: '11px', textAlign: 'center', padding: '20px' }}>
          Generate contracts to start working.
        </div>
      )}

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
              <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                <button
                  style={{ fontSize: '10px', flex: 1 }}
                  disabled={!hasEnough}
                  onClick={() => completeContract(contract.id)}
                >
                  COMPLETE
                </button>
                <button
                  style={{ fontSize: '10px', flex: 0, padding: '4px 8px' }}
                  onClick={() => rerollContract(contract.id)}
                  title="Re-roll contract (costs gold)"
                >
                  ↻
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
