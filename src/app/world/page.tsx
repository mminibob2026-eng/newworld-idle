'use client'

import { Suspense } from 'react'
import { useAuth } from '@/components/auth-provider'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { RARITY_COLORS } from '@/lib/game-data'
import { ProfessionTab } from '@/components/profession-tab'
import { ExplorationTab } from '@/components/exploration-tab'
import { ContractsTab } from '@/components/contracts-tab'
import { StorageView } from '@/components/storage-view'

type Character = any
type Profession = any

type Tab = 'gathering' | 'production' | 'exploration' | 'contracts' | 'storage' | 'character'

export default function WorldPageWrapper() {
  return (
    <Suspense fallback={<div style={{ padding: '20px', color: '#0ff' }}>LOADING WORLD...</div>}>
      <WorldPage />
    </Suspense>
  )
}

function WorldPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const charId = searchParams.get('char')

  const [character, setCharacter] = useState<Character | null>(null)
  const [storage, setStorage] = useState<any[]>([])
  const [professions, setProfessions] = useState<Profession[]>([])
  const [loadingChar, setLoadingChar] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('gathering')
  const [notification, setNotification] = useState('')

  useEffect(() => {
    if (!user && !loading) router.push('/')
    if (!charId && !loading) router.push('/dashboard')
    if (user && charId) loadCharacter(charId)
  }, [user, charId, loading, router])

  const loadCharacter = async (id: string) => {
    const supabase = createClient()
    const { data: char } = await (supabase as any)
      .from('characters')
      .select('*')
      .eq('id', id)
      .single()
    setCharacter(char)

    if (char) {
      const { data: stor } = await (supabase as any)
        .from('storage')
        .select('*, content_items(*)')
        .eq('account_id', char.account_id)
        .eq('item_type', 'item')
      setStorage(stor ?? [])

      const { data: profs } = await (supabase as any)
        .from('professions')
        .select('*')
        .eq('character_id', char.id)
      setProfessions(profs ?? [])
    }
    setLoadingChar(false)
  }

  const notify = useCallback((msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(''), 3000)
  }, [])

  if (loading || loadingChar || !character) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <span style={{ color: '#0ff' }}>LOADING...</span>
      </div>
    )
  }

  const goldIcon = '●'
  const kpIcon = '⚡'

  const tabs: { id: Tab; label: string }[] = [
    { id: 'gathering', label: 'GATHER' },
    { id: 'production', label: 'CRAFT' },
    { id: 'exploration', label: 'EXPLORE' },
    { id: 'contracts', label: 'CONTRACTS' },
    { id: 'storage', label: 'STORAGE' },
    { id: 'character', label: 'CHAR' },
  ]

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '10px' }}>
      {notification && (
        <div style={{
          position: 'fixed', top: '10px', right: '10px', zIndex: 999,
          background: 'var(--bg-tertiary)', border: '1px solid #0ff',
          color: '#0ff', padding: '8px 14px', fontSize: '12px',
          animation: 'toastIn 0.3s ease',
        }}>
          {notification}
        </div>
      )}

      {/* Top Bar */}
      <div className="panel" style={{ marginBottom: '8px', padding: '8px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#0ff', fontWeight: 'bold', fontSize: '14px', letterSpacing: '1px' }}>{character.name}</span>
            <span style={{ color: '#888', fontSize: '11px' }}>Lv.{character.level}</span>
            <span style={{ color: '#555', fontSize: '10px' }}>{character.region.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => router.push('/dashboard')}
              style={{ fontSize: '10px', padding: '2px 8px', borderColor: '#555', color: '#888', background: 'none' }}
            >
              BACK
            </button>
            <button onClick={signOut} className="btn-danger" style={{ fontSize: '10px', padding: '2px 8px' }}>
              QUIT
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '8px', flexWrap: 'wrap', fontSize: '11px' }}>
          <span className="resource">
            <span style={{ color: '#ff0' }}>{goldIcon}</span>
            <span style={{ color: '#ff0' }}>{character.gold.toLocaleString()}</span>
            <span style={{ color: '#888' }}>Gold</span>
          </span>
          <span className="resource">
            <span style={{ color: '#f0f' }}>{kpIcon}</span>
            <span style={{ color: '#f0f' }}>{character.knowledge.toLocaleString()}</span>
            <span style={{ color: '#888' }}>KP</span>
          </span>
          <span className="resource">
            <span style={{ color: '#0ff' }}>■</span>
            <span style={{ color: '#888' }}>XP {(character.xp || 0).toLocaleString()}</span>
          </span>
          <span className="resource">
            <span style={{ color: '#888' }}>AP {character.attribute_points}</span>
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '8px', flexWrap: 'wrap' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              fontSize: '10px',
              padding: '4px 10px',
              background: activeTab === tab.id ? 'var(--accent-dim)' : 'none',
              borderColor: activeTab === tab.id ? 'var(--accent)' : 'var(--border)',
              color: activeTab === tab.id ? '#0ff' : '#555',
            }}
          >
            [ {tab.label} ]
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="panel" style={{ minHeight: '300px' }}>
        {activeTab === 'gathering' && (
          <ProfessionTab
            category="gathering"
            characterId={character.id}
            accountId={character.account_id}
            professions={professions}
            onRefresh={() => loadCharacter(character.id)}
            notify={notify}
          />
        )}
        {activeTab === 'production' && (
          <ProfessionTab
            category="production"
            characterId={character.id}
            accountId={character.account_id}
            professions={professions}
            onRefresh={() => loadCharacter(character.id)}
            notify={notify}
          />
        )}
        {activeTab === 'exploration' && (
          <ExplorationTab
            characterId={character.id}
            notify={notify}
          />
        )}
        {activeTab === 'contracts' && (
          <ContractsTab
            characterId={character.id}
            storage={storage}
            notify={notify}
            onRefresh={() => loadCharacter(character.id)}
          />
        )}
        {activeTab === 'storage' && (
          <StorageView
            storage={storage}
            onRefresh={() => loadCharacter(character.id)}
          />
        )}
        {activeTab === 'character' && (
          <CharacterTab character={character} onRefresh={() => loadCharacter(character.id)} />
        )}
      </div>
    </div>
  )
}

function CharacterTab({ character, onRefresh }: { character: Character; onRefresh: () => void }) {
  const attrs = [
    { key: 'strength', label: 'STR', desc: 'Gathering power & carrying capacity' },
    { key: 'dexterity', label: 'DEX', desc: 'Crafting speed & precision' },
    { key: 'intelligence', label: 'INT', desc: 'Knowledge gain & discovery rate' },
    { key: 'endurance', label: 'END', desc: 'Max energy & activity duration' },
    { key: 'luck', label: 'LCK', desc: 'Rare finds & discovery quality' },
    { key: 'charisma', label: 'CHA', desc: 'Contract rewards & trading' },
  ] as const

  const assignPoint = async (attr: string) => {
    if (!character.attribute_points) return
    const supabase = createClient()
    await (supabase as any)
      .from('characters')
      .update({
        [attr]: (character as any)[attr] + 1,
        attribute_points: character.attribute_points - 1,
      })
      .eq('id', character.id)
    onRefresh()
  }

  return (
    <div>
      <div className="panel-header">CHARACTER</div>
      <div style={{ marginBottom: '12px' }}>
        <div style={{ color: '#0ff', fontSize: '16px', fontWeight: 'bold' }}>{character.name}</div>
        <div style={{ color: '#888', fontSize: '11px' }}>Level {character.level} {character.region.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}</div>
        <div style={{ marginTop: '4px', fontSize: '11px', color: '#555' }}>
          XP: {character.xp.toLocaleString()} / {Math.floor(100 * Math.pow(character.level, 1.5)).toLocaleString()}
        </div>
        <div className="progress-bar" style={{ marginTop: '4px' }}>
          <div
            className="progress-fill"
            style={{ width: `${Math.min(100, (character.xp || 0) / Math.floor(100 * Math.pow(character.level, 1.5)) * 100)}%` }}
          />
        </div>
      </div>

      <div className="panel-header" style={{ marginTop: '12px' }}>ATTRIBUTES</div>
      <div style={{ color: '#888', fontSize: '10px', marginBottom: '8px' }}>
        Points available: <span style={{ color: '#0ff' }}>{character.attribute_points}</span>
      </div>
      <div className="feature-grid">
        {attrs.map(attr => (
          <div key={attr.key} className="card" style={{ cursor: character.attribute_points > 0 ? 'pointer' : 'default' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#0ff', fontSize: '12px', fontWeight: 'bold' }}>
                {attr.label}
              </span>
              <span style={{ color: '#fff', fontSize: '14px' }}>
                {(character as any)[attr.key]}
              </span>
            </div>
            <div style={{ color: '#555', fontSize: '9px', marginTop: '4px' }}>{attr.desc}</div>
            {character.attribute_points > 0 && (
              <button
                style={{ fontSize: '9px', padding: '1px 6px', marginTop: '6px', width: '100%' }}
                onClick={() => assignPoint(attr.key)}
              >
                +1
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
