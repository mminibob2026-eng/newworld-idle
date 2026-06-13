'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { playClick } from '@/lib/sound'

const PATH_COLORS: Record<string, string> = {
  path_strength: '#f44',
  path_dexterity: '#0ff',
  path_intelligence: '#f0f',
  path_endurance: '#0f0',
  path_luck: '#ff0',
  path_charisma: '#f80',
}

const PATH_ICONS: Record<string, string> = {
  path_strength: '💪',
  path_dexterity: '⚡',
  path_intelligence: '📖',
  path_endurance: '🏔️',
  path_luck: '🍀',
  path_charisma: '👑',
}

const ATTRIBUTE_LABELS: Record<string, string> = {
  strength: 'STR',
  dexterity: 'DEX',
  intelligence: 'INT',
  endurance: 'END',
  luck: 'LCK',
  charisma: 'CHA',
}

export function SpecializationTab({ character, onRefresh }: { character: any; onRefresh: () => void }) {
  const [specializations, setSpecializations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showConfirm, setShowConfirm] = useState<string | null>(null)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const res = await fetch('/api/game/specializations')
    const data = await res.json()
    if (res.ok) setSpecializations(data.specializations || [])
    setLoading(false)
  }

  const chooseSpecialization = async (specId: string) => {
    playClick()
    const res = await fetch('/api/game/specializations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ characterId: character.id, specializationId: specId }),
    })
    const data = await res.json()
    if (!res.ok) {
      alert(data.error)
      return
    }
    setShowConfirm(null)
    onRefresh()
  }

  if (loading) return <div style={{ color: '#888' }}>Loading paths...</div>

  const currentSpec = character?.specialization
  const currentSpecLevel = character?.specialization_level || 1
  const isLocked = character?.level < 10

  // If already has specialization, show the path
  if (currentSpec) {
    const spec = specializations.find(s => s.id === currentSpec)
    if (!spec) return <div style={{ color: '#888' }}>Path not found</div>

    const tiers = [
      { level: 1, bonus: spec.tier_1_bonus, label: 'Novice' },
      { level: 2, bonus: spec.tier_2_bonus, label: 'Adept' },
      { level: 3, bonus: spec.tier_3_bonus, label: 'Expert' },
      { level: 4, bonus: spec.tier_4_bonus, label: 'Master' },
      { level: 5, bonus: spec.tier_5_bonus, label: 'Grandmaster' },
    ]

    return (
      <div>
        <div className="panel-header">YOUR PATH</div>

        <div className="card" style={{ marginBottom: '12px', border: `2px solid ${PATH_COLORS[spec.id] || '#0ff'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ fontSize: '32px' }}>{PATH_ICONS[spec.id] || '✨'}</span>
            <div>
              <div style={{ color: PATH_COLORS[spec.id] || '#0ff', fontSize: '14px', fontWeight: 'bold' }}>
                {spec.name}
              </div>
              <div style={{ color: '#888', fontSize: '10px' }}>
                {spec.description}
              </div>
            </div>
          </div>
          <div style={{ color: '#888', fontSize: '10px' }}>
            Primary Attribute: <span style={{ color: '#0ff' }}>{ATTRIBUTE_LABELS[spec.primary_attribute]}</span>
          </div>
        </div>

        <div className="panel-header">TIER PROGRESS</div>
        <div style={{ marginBottom: '12px' }}>
          {tiers.map((tier, i) => {
            const isUnlocked = currentSpecLevel >= tier.level
            const bonus = tier.bonus ? JSON.parse(tier.bonus) : null
            return (
              <div key={tier.level} className="card" style={{
                marginBottom: '6px',
                opacity: isUnlocked ? 1 : 0.4,
                border: `1px solid ${isUnlocked ? (PATH_COLORS[spec.id] || '#0ff') : 'var(--border)'}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: isUnlocked ? '#fff' : '#555', fontSize: '12px', fontWeight: 'bold' }}>
                    Tier {tier.level}: {tier.label}
                  </span>
                  {isUnlocked ? (
                    <span style={{ color: '#0f0', fontSize: '10px' }}>✓ UNLOCKED</span>
                  ) : (
                    <span style={{ color: '#555', fontSize: '10px' }}>🔒 Level {tier.level * 5} required</span>
                  )}
                </div>
                {bonus && (
                  <div style={{ color: PATH_COLORS[spec.id] || '#0ff', fontSize: '10px', marginTop: '4px' }}>
                    {bonus.label}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="panel" style={{ padding: '10px', textAlign: 'center' }}>
          <div style={{ color: '#888', fontSize: '10px' }}>
            Specialization Points (SP) earned every 5 levels starting at level 10.
            <br />
            Current SP: <span style={{ color: '#0ff', fontWeight: 'bold' }}>{Math.max(0, Math.floor((character.level - 10) / 5) + 1)}</span>
          </div>
        </div>
      </div>
    )
  }

  // If locked, show message
  if (isLocked) {
    return (
      <div>
        <div className="panel-header">SPECIALIZATION</div>
        <div className="panel" style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>🔒</div>
          <div style={{ color: '#888', fontSize: '12px' }}>
            Reach <span style={{ color: '#ff0' }}>Level 10</span> to unlock your Path.
          </div>
          <div style={{ color: '#555', fontSize: '10px', marginTop: '8px' }}>
            Current level: {character.level}
          </div>
        </div>
      </div>
    )
  }

  // Show selection
  return (
    <div>
      <div className="panel-header">CHOOSE YOUR PATH</div>
      <div style={{ color: '#888', fontSize: '10px', marginBottom: '12px', textAlign: 'center' }}>
        Choose wisely. This decision is permanent.
      </div>

      <div className="feature-grid">
        {specializations.map(spec => {
          const isConfirming = showConfirm === spec.id
          return (
            <div key={spec.id} className="card" style={{ border: `2px solid ${PATH_COLORS[spec.id] || '#0ff'}` }}>
              <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '32px' }}>{PATH_ICONS[spec.id] || '✨'}</span>
              </div>
              <div style={{ color: PATH_COLORS[spec.id] || '#0ff', fontSize: '12px', fontWeight: 'bold', textAlign: 'center' }}>
                {spec.name}
              </div>
              <div style={{ color: '#888', fontSize: '9px', textAlign: 'center', marginTop: '4px' }}>
                {spec.description}
              </div>
              <div style={{ color: '#555', fontSize: '9px', textAlign: 'center', marginTop: '4px' }}>
                Primary: {ATTRIBUTE_LABELS[spec.primary_attribute]}
              </div>

              {!isConfirming ? (
                <button style={{ marginTop: '8px', width: '100%', fontSize: '10px' }} onClick={() => setShowConfirm(spec.id)}>
                  SELECT PATH
                </button>
              ) : (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ color: '#f44', fontSize: '9px', marginBottom: '4px', textAlign: 'center' }}>
                    ⚠️ Permanent choice!
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button className="btn-danger" style={{ flex: 1, fontSize: '9px' }} onClick={() => chooseSpecialization(spec.id)}>
                      CONFIRM
                    </button>
                    <button style={{ flex: 1, fontSize: '9px' }} onClick={() => setShowConfirm(null)}>
                      CANCEL
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
