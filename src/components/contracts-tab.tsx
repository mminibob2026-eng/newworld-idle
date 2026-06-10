'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

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

    const { error } = await supabase.from('contracts').insert(newContracts)
    if (error) {
      notify(`Error: ${error.message}`)
      return
    }
    notify('New contracts generated!')
    loadContracts()
    onRefresh()
  }

  const completeContract = async (contractId: string) => {
    const supabase = createClient()
    const contract = contracts.find(c => c.id === contractId)
    if (!contract) return

    const storageItem = storage.find(s => s.item_id === contract.requirement_item)
    if (!storageItem || storageItem.quantity < contract.requirement_qty) {
      notify(`Need ${contract.requirement_qty}x ${contract.requirement_item}. Have ${storageItem?.quantity || 0}`)
      return
    }

    await supabase
      .from('storage')
      .update({ quantity: storageItem.quantity - contract.requirement_qty })
      .eq('id', storageItem.id)

    const { data: char } = await supabase
      .from('characters')
      .select('gold, knowledge')
      .eq('id', characterId)
      .single()

    if (char) {
      await supabase
        .from('characters')
        .update({
          gold: char.gold + contract.reward_gold,
          knowledge: (char.knowledge || 0) + contract.reward_knowledge,
        })
        .eq('id', characterId)
    }

    await supabase
      .from('contracts')
      .update({ completed: true })
      .eq('id', contractId)

    notify(`Completed! +${contract.reward_gold} Gold${contract.reward_knowledge > 0 ? `, +${contract.reward_knowledge} KP` : ''}`)
    loadContracts()
    onRefresh()
  }

  if (loading) return <div style={{ color: '#888' }}>Loading contracts...</div>

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

      <div className="feature-grid">
        {contracts.filter(c => !c.completed).map(contract => {
          const storageItem = storage.find(s => s.item_id === contract.requirement_item)
          const hasEnough = storageItem && storageItem.quantity >= contract.requirement_qty
          const factionName = contract.faction.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())

          return (
            <div key={contract.id} className="card" style={{ borderColor: hasEnough ? 'var(--accent)' : 'var(--border)' }}>
              <div style={{ fontSize: '11px', color: '#0ff', fontWeight: 'bold' }}>
                Deliver: {contract.requirement_item.replace(/_/g, ' ')}
              </div>
              <div style={{ fontSize: '11px', marginTop: '4px' }}>
                Qty: <span style={{ color: hasEnough ? '#0f0' : '#f44' }}>{contract.requirement_qty}</span>
                <span style={{ color: '#555' }}> (have {storageItem?.quantity || 0})</span>
              </div>
              <div style={{ fontSize: '10px', color: '#888', marginTop: '4px' }}>
                <span style={{ color: '#ff0' }}>{contract.reward_gold} Gold</span>
                {contract.reward_knowledge > 0 && <span style={{ color: '#f0f' }}> | {contract.reward_knowledge} KP</span>}
              </div>
              <div style={{ fontSize: '9px', color: '#555', marginTop: '2px' }}>{factionName}</div>
              <button
                style={{ fontSize: '10px', marginTop: '8px', width: '100%' }}
                disabled={!hasEnough}
                onClick={() => completeContract(contract.id)}
              >
                COMPLETE
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
