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
import { DashboardTab } from '@/components/dashboard-tab'
import { DiscoveriesTab } from '@/components/discoveries-tab'
import { RewardFeed, useRewardFeed } from '@/components/reward-feedback'
import { playReward, playLevelUp, playRare } from '@/lib/sound'

type Character = any
type Profession = any

type Tab = 'dashboard' | 'gathering' | 'production' | 'exploration' | 'contracts' | 'storage' | 'discoveries' | 'character'

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
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [notification, setNotification] = useState('')
  const [notificationType, setNotificationType] = useState<'info' | 'success' | 'error'>('info')
  const { rewards, addReward } = useRewardFeed()

  useEffect(() => {
    if (!user && !loading) router.push('/')
    if (!charId && !loading) router.push('/dashboard')
    if (user && charId) {
      loadCharacter(charId)
      processOffline(charId)
    }
  }, [user, charId, loading, router])

  const processOffline = async (id: string) => {
    try {
      const res = await fetch(`/api/game/process-offline?character_id=${id}`)
      const data = await res.json()
      if (data.professions?.length > 0 || data.explorations?.length > 0) {
        const profCount = data.professions?.length || 0
        const expCount = data.explorations?.length || 0

        const allItems: { name: string; qty: number; rarity: string }[] = []
        const allLevelUps: { profession: string; from: number; to: number }[] = []
        const allDiscoveries: { name: string; rarity: string; region?: string; lore?: string }[] = []
        let totalXp = 0
        let totalGold = 0
        let hasRare = false
        let hasLevelUp = false

        for (const p of data.professions || []) {
          const items = Object.entries(p.items || {}).map(([id, info]: any) => {
            const rarity = info.rarity || 'common'
            if (['rare', 'epic', 'legendary', 'mythic'].includes(rarity)) hasRare = true
            return { name: info.name || id, qty: info.qty || info, rarity }
          })
          allItems.push(...items)
          totalXp += p.xpGained || 0
          if (p.levelUps > 0) {
            allLevelUps.push({
              profession: p.name || 'Unknown',
              from: Math.max(1, (p.level || 1) - p.levelUps),
              to: p.level || 1,
            })
          }
        }

        for (const e of data.explorations || []) {
          const discoveries = (e.discoveries || []).map((d: any) => {
            if (['rare', 'epic', 'legendary', 'mythic'].includes(d.rarity)) hasRare = true
            return { name: d.name, rarity: d.rarity || 'common', region: e.region || e.name, lore: d.lore }
          })
          allDiscoveries.push(...discoveries)
          totalGold += e.gold || 0
        }

        if (hasRare) playRare()
        else if (totalXp > 0) playReward()

        const totalMin = Math.floor((data._elapsedSeconds || 0) / 60)

        addReward({
          title: `OFFLINE PROGRESS (${profCount + expCount} activities)`,
          timeAway: totalMin || undefined,
          items: allItems.length > 0 ? allItems : undefined,
          xp: totalXp || undefined,
          gold: totalGold || undefined,
          levelUps: allLevelUps.length > 0 ? allLevelUps : undefined,
          discoveries: allDiscoveries.length > 0 ? allDiscoveries : undefined,
        })

        if (hasLevelUp) playLevelUp()
        loadCharacter(id)
      }
    } catch {
      // silent
    }
  }

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
        .select('*')
        .eq('account_id', char.account_id)
        .eq('item_type', 'item')
      let storageRows = stor ?? []
      if (storageRows.length > 0) {
        const itemIds = [...new Set(storageRows.map((s: any) => s.item_id))]
        const { data: items } = await (supabase as any)
          .from('content_items')
          .select('*')
          .in('id', itemIds)
        const itemMap = Object.fromEntries((items ?? []).map((i: any) => [i.id, i]))
        storageRows = storageRows.map((s: any) => ({ ...s, content_items: itemMap[s.item_id] || null }))
      }
      setStorage(storageRows)

      const { data: profs } = await (supabase as any)
        .from('professions')
        .select('*')
        .eq('character_id', char.id)
      setProfessions(profs ?? [])
    }
    setLoadingChar(false)
  }

  const showExplorationReward = (data: any, regionName: string) => {
    const discoveries = (data.discoveries || []).map((d: any) => ({
      name: d.name, rarity: d.rarity || 'common', region: regionName, lore: d.lore,
    }))
    const hasRare = discoveries.some((d: any) => ['rare', 'epic', 'legendary', 'mythic'].includes(d.rarity))
    if (hasRare) playRare()
    else if (discoveries.length > 0) playReward()

    addReward({
      title: `EXPLORATION: ${regionName.toUpperCase()}`,
      gold: data.gold || 0,
      discoveries: discoveries.length > 0 ? discoveries : undefined,
    })
    notify(discoveries.length > 0 ? `Discovered ${discoveries.map((d: any) => d.name).join(', ')}` : 'Nothing special found.')
  }

  const showProfessionReward = (data: any, professionName: string) => {
    const items = Object.values(data.items || {}).map((i: any) => ({
      name: i.name, qty: i.qty, rarity: i.rarity || 'common',
    }))
    const hasRare = items.some((i: any) => ['rare', 'epic', 'legendary', 'mythic'].includes(i.rarity))
    const levelUps: { profession: string; from: number; to: number }[] = []
    if (data.levelUps > 0) {
      levelUps.push({ profession: professionName, from: Math.max(1, (data.levelUps || 1) - 1), to: data.levelUps || 1 })
    }

    if (hasRare) playRare()
    else playReward()
    if (data.charLeveledUp) playLevelUp()

    addReward({
      title: `CLAIMED: ${professionName.toUpperCase()}`,
      items: items.length > 0 ? items : undefined,
      xp: data.xpGained || 0,
      levelUps: levelUps.length > 0 ? levelUps : undefined,
      charLevelUp: data.charLeveledUp ? { from: data.newCharLevel - 1, to: data.newCharLevel } : undefined,
    })
    notify(`[${professionName}] +${data.xpGained} XP`)
    loadCharacter(character.id)
  }

  const notify = useCallback((msg: string, type: 'info' | 'success' | 'error' = 'info') => {
    setNotification(msg)
    setNotificationType(type)
    setTimeout(() => setNotification(''), 4000)
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
    { id: 'dashboard', label: 'HOME' },
    { id: 'gathering', label: 'GATHER' },
    { id: 'production', label: 'CRAFT' },
    { id: 'exploration', label: 'EXPLORE' },
    { id: 'contracts', label: 'CONTRACTS' },
    { id: 'storage', label: 'STORAGE' },
    { id: 'discoveries', label: 'DISCOVER' },
    { id: 'character', label: 'CHAR' },
  ]

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '10px' }}>
      <RewardFeed rewards={rewards} />

      {notification && (
        <div style={{
          position: 'fixed', top: '10px', right: '10px', zIndex: 999,
          background: 'var(--bg-tertiary)', border: `1px solid ${notificationType === 'error' ? 'var(--red)' : notificationType === 'success' ? 'var(--green)' : 'var(--accent)'}`,
          color: notificationType === 'error' ? 'var(--red)' : notificationType === 'success' ? 'var(--green)' : 'var(--accent)',
          padding: '8px 14px', fontSize: '12px',
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
              style={{ borderColor: '#555', color: '#888', background: 'none' }}
            >
              ← BACK
            </button>
            <button onClick={signOut} className="btn-danger">
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
      <div className="bottom-nav" style={{ display: 'flex', gap: '4px', marginBottom: '8px', flexWrap: 'wrap' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              fontSize: '10px',
              padding: '4px 10px',
              minHeight: '44px',
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
        {activeTab === 'dashboard' && (
          <DashboardTab
            character={character}
            professions={professions}
            onRefresh={() => loadCharacter(character.id)}
          />
        )}
        {activeTab === 'gathering' && (
          <ProfessionTab
            category="gathering"
            characterId={character.id}
            accountId={character.account_id}
            professions={professions}
            onRefresh={() => loadCharacter(character.id)}
            notify={notify}
            showReward={(data, name) => showProfessionReward(data, name)}
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
            showReward={(data, name) => showProfessionReward(data, name)}
          />
        )}
        {activeTab === 'exploration' && (
          <ExplorationTab
            characterId={character.id}
            notify={notify}
            showReward={(data, name) => showExplorationReward(data, name)}
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
        {activeTab === 'discoveries' && (
          <DiscoveriesTab
            accountId={character.account_id}
          />
        )}
        {activeTab === 'character' && (
          <CharacterTab character={character} onRefresh={() => loadCharacter(character.id)} notify={notify} />
        )}
      </div>
    </div>
  )
}

function CharacterTab({ character, onRefresh, notify }: { character: Character; onRefresh: () => void; notify: (msg: string, type?: 'info' | 'success' | 'error') => void }) {
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
    const res = await fetch('/api/game/assign-attribute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ characterId: character.id, attribute: attr }),
    })
    const data = await res.json()
    if (!res.ok) {
      notify(`Error: ${data.error}`)
      return
    }
    notify(`+1 ${attr.toUpperCase()}`, 'success')
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
                style={{ marginTop: '6px', width: '100%' }}
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
