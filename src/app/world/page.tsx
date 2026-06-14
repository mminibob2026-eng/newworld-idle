'use client'

import { Suspense } from 'react'
import { useAuth } from '@/components/auth-provider'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { RARITY_COLORS } from '@/lib/game-data'
import { ProfessionTab } from '@/components/profession-tab'
import { ExplorationTab } from '@/components/exploration-tab'
import { ContractsTab } from '@/components/contracts-tab'
import { StorageView } from '@/components/storage-view'
import { DashboardTab } from '@/components/dashboard-tab'
import { DiscoveriesTab } from '@/components/discoveries-tab'
import { ProfessionsView } from '@/components/professions-view'
import { CollectionView } from '@/components/collection-view'
import { RewardFeed, useRewardFeed } from '@/components/reward-feedback'
import { TutorialOverlay } from '@/components/tutorial-overlay'
import { AchievementsTab } from '@/components/achievements-tab'
import { SpecializationTab } from '@/components/specialization-tab'
import { playReward, playLevelUp, playRare, initAudio } from '@/lib/sound'

type Character = any
type Profession = any

type Tab = 'home' | 'professions' | 'exploration' | 'contracts' | 'collection' | 'achievements' | 'specialization'

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
  const [explorations, setExplorations] = useState<any[]>([])
  const [discoveries, setDiscoveries] = useState<any[]>([])
  const [loadingChar, setLoadingChar] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [notification, setNotification] = useState('')
  const [notificationType, setNotificationType] = useState<'info' | 'success' | 'error'>('info')
  const [bobCoins, setBobCoins] = useState(0)
  const { rewards, addReward } = useRewardFeed()

  useEffect(() => {
    if (!user && !loading) router.push('/')
    if (!charId && !loading) router.push('/dashboard')
    if (user && charId) {
      initAudio()
      loadCharacter(charId)
      processOffline(charId)
    }
  }, [user, charId, loading, router])

  // Periodic refresh every 30 seconds to keep activities up to date
  useEffect(() => {
    if (!character) return
    const interval = setInterval(() => {
      loadCharacter(character.id)
    }, 30000)
    return () => clearInterval(interval)
  }, [character?.id])

  // Refresh data when switching tabs to ensure activities are up to date
  useEffect(() => {
    if (character) {
      loadCharacter(character.id)
    }
  }, [activeTab])

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
              from: p.fromLevel || 1,
              to: (p.fromLevel || 1) + p.levelUps,
            })
            hasLevelUp = true
          }
        }

        for (const e of data.explorations || []) {
          const discoveries = (e.discoveries || []).map((d: any) => {
            if (['rare', 'epic', 'legendary', 'mythic'].includes(d.rarity)) hasRare = true
            return { name: d.name, rarity: d.rarity || 'common', region: e.region || e.name, lore: d.lore, icon_path: d.icon_path }
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
    const [charRes, storRes, profsRes, profileRes] = await Promise.all([
      (supabase as any).from('characters').select('*').eq('id', id).single(),
      (supabase as any).from('storage').select('*').eq('item_type', 'item'),
      (supabase as any).from('professions').select('*').eq('character_id', id),
      (supabase as any).from('profiles').select('bob_coins').eq('id', user?.id).single(),
    ])
    const char = charRes.data
    setCharacter(char)
    if (profileRes.data) {
      setBobCoins(profileRes.data.bob_coins || 0)
    }

    if (char) {
      let storageRows = (storRes.data ?? []) as any[]
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
      setProfessions(profsRes.data ?? [])

      const [expRes, discRes] = await Promise.all([
        (supabase as any).from('exploration').select('*').eq('character_id', id).eq('completed', false).order('created_at', { ascending: false }).limit(20),
        (supabase as any).from('player_discoveries').select('*, content_discoveries(*)').eq('account_id', char.account_id).order('discovered_at', { ascending: false }).limit(5),
      ])
      setExplorations(expRes.data ?? [])
      setDiscoveries(discRes.data ?? [])
    }
    setLoadingChar(false)
  }

  const showExplorationReward = (data: any, regionName: string) => {
    const discoveries = (data.discoveries || []).map((d: any) => ({
      name: d.name, rarity: d.rarity || 'common', region: regionName, lore: d.lore, icon_path: d.icon_path,
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
    loadCharacter(character.id)
  }

  const showProfessionReward = (data: any, professionName: string) => {
    const items = Object.values(data.items || {}).map((i: any) => ({
      name: i.name, qty: i.qty, rarity: i.rarity || 'common',
    }))
    const hasRare = items.some((i: any) => ['rare', 'epic', 'legendary', 'mythic'].includes(i.rarity))
    const levelUps: { profession: string; from: number; to: number }[] = []
    if (data.levelUps > 0) {
      levelUps.push({ profession: professionName, from: data.fromLevel || 1, to: (data.fromLevel || 1) + data.levelUps })
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

  const notificationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const notify = useCallback((msg: string, type: 'info' | 'success' | 'error' = 'info') => {
    if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current)
    setNotification(msg)
    setNotificationType(type)
    notificationTimerRef.current = setTimeout(() => setNotification(''), 4000)
  }, [])

  const refresh = useCallback(() => {
    if (character) loadCharacter(character.id)
  }, [character?.id])

  const tabContent = useMemo(() => {
    if (!character) return null
    switch (activeTab) {
      case 'home': return <DashboardTab key="home" character={character} professions={professions} explorations={explorations} discoveries={discoveries} onRefresh={refresh} notify={notify} />
      case 'professions': return <ProfessionsView key="profs" characterId={character.id} accountId={character.account_id} professions={professions} onRefresh={refresh} notify={notify} showProfessionReward={(d, n) => showProfessionReward(d, n)} />
      case 'exploration': return <ExplorationTab key="explore" characterId={character.id} notify={notify} showReward={(d, n) => showExplorationReward(d, n)} onRefresh={refresh} />
      case 'contracts': return <ContractsTab key="contracts" characterId={character.id} storage={storage} notify={notify} onRefresh={refresh} />
      case 'collection': return <CollectionView key="collect" accountId={character.account_id} storage={storage} onRefresh={refresh} />
      case 'achievements': return <AchievementsTab key="achievements" accountId={character.account_id} />
      case 'specialization': return <SpecializationTab key="specialization" character={character} onRefresh={refresh} />
      default: return null
    }
  }, [activeTab, character, professions, explorations, discoveries, storage, refresh, notify])

  if (loading || loadingChar || !character) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: '16px' }}>
        <div className="loading-spinner large" />
        <span style={{ color: '#0ff', fontSize: '11px' }}>LOADING WORLD...</span>
      </div>
    )
  }

  const goldIcon = '●'
  const kpIcon = '⚡'

  const tabs: { id: Tab; label: string }[] = [
    { id: 'home', label: 'HOME' },
    { id: 'professions', label: 'PROFESSIONS' },
    { id: 'exploration', label: 'EXPLORE' },
    { id: 'contracts', label: 'CONTRACTS' },
    { id: 'collection', label: 'COLLECTION' },
    { id: 'achievements', label: 'ACHIEVE' },
    { id: 'specialization', label: 'PATH' },
  ]

  return (
    <div className="world-container" style={{ maxWidth: '700px', margin: '0 auto', padding: '8px' }}>
      <RewardFeed rewards={rewards} />
      {user && character && <TutorialOverlay onComplete={() => {}} userId={user.id} characterId={character.id} />}

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
      <div className="panel" style={{ marginBottom: '8px', padding: '8px 10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
            <span style={{ color: '#0ff', fontWeight: 'bold', fontSize: '13px', letterSpacing: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{character.name}</span>
            <span style={{ color: '#888', fontSize: '11px', flexShrink: 0 }}>Lv.{character.level}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            <button onClick={() => router.push('/dashboard')} style={{ borderColor: '#555', color: '#888', background: 'none', padding: '6px 10px', fontSize: '10px' }}>
              ←
            </button>
            <button onClick={signOut} className="btn-danger" style={{ padding: '6px 10px', fontSize: '10px' }}>
              ✕
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap', fontSize: '10px' }}>
          <span className="resource">
            <span style={{ color: '#ff0' }}>{goldIcon}</span>
            <span style={{ color: '#ff0' }}>{character.gold.toLocaleString()}</span>
          </span>
          <span className="resource">
            <span style={{ color: '#f0f' }}>{kpIcon}</span>
            <span style={{ color: '#f0f' }}>{character.knowledge.toLocaleString()}</span>
          </span>
          <span className="resource">
            <span style={{ color: '#ff8c00' }}>🪙</span>
            <span style={{ color: '#ff8c00' }}>{bobCoins}</span>
          </span>
          <span className="resource">
            <span style={{ color: '#888' }}>XP {character.xp.toLocaleString()}</span>
          </span>
          {character.attribute_points > 0 && (
            <span className="resource" style={{ color: '#0ff' }}>
              AP {character.attribute_points}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: activeTab === tab.id ? 'var(--accent-dim)' : 'none',
              borderColor: activeTab === tab.id ? 'var(--accent)' : 'var(--border)',
              color: activeTab === tab.id ? '#0ff' : '#555',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="panel" style={{ minHeight: '300px' }}>
        {tabContent}
      </div>
    </div>
  )
}

  // 
