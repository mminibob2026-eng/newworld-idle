'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { useTranslation } from '@/lib/i18n'
import { createClient } from '@/lib/supabase'
import { EnergyBar } from '@/components/energy-bar'
import { HomeTab } from '@/components/tabs/home-tab'
import { LearnTab } from '@/components/tabs/learn-tab'
import { WorkTab } from '@/components/tabs/work-tab'
import { TrainTab } from '@/components/tabs/train-tab'
import { LiveTab } from '@/components/tabs/live-tab'
import { AdventureTab } from '@/components/tabs/adventure-tab'
import { CombatTab } from '@/components/tabs/combat-tab'
import { DiscoverTab } from '@/components/tabs/discover-tab'
import { SettingsTab } from '@/components/tabs/settings-tab'

const TABS = ['home', 'learn', 'work', 'train', 'live', 'adventure', 'combat', 'discover', 'settings'] as const
type Tab = typeof TABS[number]

export default function WorldPage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const { t } = useTranslation()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [character, setCharacter] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const loadCharacter = useCallback(async () => {
    if (!user) return
    const supabase = createClient()
    const { data } = await (supabase as any)
      .from('new_characters')
      .select('*')
      .eq('account_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    if (data) {
      const { data: energyResult } = await (supabase as any).rpc('recover_energy', {
        p_character_id: data.id,
      })
      if (energyResult?.success) {
        data.energy = energyResult.energy
      }
      setCharacter(data)
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    loadCharacter()
    const interval = setInterval(loadCharacter, 30000)
    return () => clearInterval(interval)
  }, [loadCharacter])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    )
  }

  if (!character) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="panel">
          <p>No character found. Please create one first.</p>
          <button className="btn mt-4" onClick={() => router.push('/dashboard')}>
            {t.common.back}
          </button>
        </div>
      </div>
    )
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'home': return <HomeTab character={character} onRefresh={loadCharacter} />
      case 'learn': return <LearnTab character={character} onRefresh={loadCharacter} />
      case 'work': return <WorkTab character={character} onRefresh={loadCharacter} />
      case 'train': return <TrainTab character={character} onRefresh={loadCharacter} />
      case 'live': return <LiveTab character={character} onRefresh={loadCharacter} />
      case 'adventure': return <AdventureTab character={character} onRefresh={loadCharacter} />
      case 'combat': return <CombatTab character={character} onRefresh={loadCharacter} />
      case 'discover': return <DiscoverTab character={character} onRefresh={loadCharacter} />
      case 'settings': return <SettingsTab character={character} onRefresh={loadCharacter} />
      default: return <HomeTab character={character} onRefresh={loadCharacter} />
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Bar */}
      <div className="top-bar">
        <div className="flex items-center gap-3">
          <span className="font-bold text-lg">{character.name}</span>
          <span className="text-xs opacity-60">{t.common.levelShort}{character.level}</span>
          <span className="text-xs opacity-60">{t.home.origin}: {character.origin_id}</span>
        </div>
        <EnergyBar current={character.energy} max={character.energy_max} />
        <div className="flex items-center gap-3 text-xs">
          <span>{t.common.gold}: {character.gold}</span>
          <button className="btn-sm" onClick={signOut}>{t.signOut}</button>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="tab-bar">
        {TABS.map(tab => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {t.tabs[tab]}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content flex-1 overflow-y-auto p-4">
        {renderTab()}
      </div>
    </div>
  )
}
