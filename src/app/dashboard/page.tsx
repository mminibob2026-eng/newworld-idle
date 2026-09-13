'use client'

import { useAuth } from '@/components/auth-provider'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useTranslation } from '@/lib/i18n'
import { ORIGINS } from '@/lib/game-data'
import { IntroStory } from '@/components/intro-story'

type Character = any

export default function Dashboard() {
  const { user, loading, signOut } = useAuth()
  const { t, locale } = useTranslation()
  const router = useRouter()
  const [characters, setCharacters] = useState<Character[]>([])
  const [loadingChars, setLoadingChars] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [selectedOrigin, setSelectedOrigin] = useState<string>('middle')
  const [error, setError] = useState('')
  const [fatalError, setFatalError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deleteConfirmName, setDeleteConfirmName] = useState<string>('')
  const [showIntro, setShowIntro] = useState(false)
  const [introCharName, setIntroCharName] = useState('')
  const [introOriginName, setIntroOriginName] = useState('')

  useEffect(() => {
    if (!user && !loading) router.push('/')
    if (user) {
      loadCharacters().catch(e => {
        setFatalError(e?.message || String(e))
        setLoadingChars(false)
      })
    }
  }, [user, loading, router])

  const loadCharacters = async () => {
    const supabase = createClient()
    const { data, error } = await (supabase as any)
      .from('new_characters')
      .select('*')
      .eq('account_id', user!.id)
      .order('created_at', { ascending: true })
    if (error) throw error
    setCharacters(data ?? [])
    setLoadingChars(false)
  }

  const createCharacter = async () => {
    setError('')
    if (!newName.trim()) return
    const supabase = createClient()

    const { data: existingChars } = await (supabase as any)
      .from('new_characters')
      .select('id')
      .eq('account_id', user!.id)

    if (existingChars && existingChars.length >= 4) {
      setError('Maximum 4 characters per account')
      return
    }

    const { error: err } = await (supabase as any)
      .from('new_characters')
      .insert({
        account_id: user!.id,
        name: newName.trim(),
        origin_id: selectedOrigin,
        energy: 100,
        energy_max: 100,
        level: 1,
        gold: 100,
        strength: 10,
        dexterity: 10,
        intelligence: 10,
        endurance: 10,
        luck: 10,
        charisma: 10,
        stress: 0,
        fatigue: 0,
      })

    if (err) {
      setError(err.message)
      return
    }

    // Create parents for non-orphan origins
    if (selectedOrigin !== 'orphan') {
      const { generateNPCName, PARENT_OCCUPATIONS, PARENT_PERSONALITIES } = await import('@/lib/game-data')

      // Get the newly created character
      const { data: newChar } = await (supabase as any)
        .from('new_characters')
        .select('id')
        .eq('account_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (newChar) {
        const wealthTier = selectedOrigin === 'wealthy' ? 'high' : selectedOrigin === 'humble' ? 'low' : 'medium'
        const availableOccupations = PARENT_OCCUPATIONS.filter(o =>
          wealthTier === 'high' ? true :
          wealthTier === 'medium' ? o.wealth !== 'high' :
          o.wealth === 'low'
        )

        const fatherOcc = availableOccupations[Math.floor(Math.random() * availableOccupations.length)]
        const fatherPersonality = PARENT_PERSONALITIES[Math.floor(Math.random() * PARENT_PERSONALITIES.length)]
        const fatherName = generateNPCName('zh')
        const fatherAge = 25 + Math.floor(Math.random() * 15)

        const motherOcc = availableOccupations[Math.floor(Math.random() * availableOccupations.length)]
        const motherPersonality = PARENT_PERSONALITIES[Math.floor(Math.random() * PARENT_PERSONALITIES.length)]
        const motherName = generateNPCName('zh')
        const motherAge = 22 + Math.floor(Math.random() * 12)

        await (supabase as any).from('character_parents').insert([
          {
            character_id: newChar.id,
            npc_name: fatherName,
            relationship: 'father',
            occupation: fatherOcc.id,
            personality: fatherPersonality.id,
            age_at_birth: fatherAge,
            current_age: fatherAge,
            loyalty: 60 + Math.floor(Math.random() * 30),
            alive: true,
          },
          {
            character_id: newChar.id,
            npc_name: motherName,
            relationship: 'mother',
            occupation: motherOcc.id,
            personality: motherPersonality.id,
            age_at_birth: motherAge,
            current_age: motherAge,
            loyalty: 70 + Math.floor(Math.random() * 25),
            alive: true,
          },
        ])
      }
    }

    setNewName('')
    setSelectedOrigin('middle')
    setShowCreate(false)

    // Show intro story for new character
    const origin = ORIGINS.find(o => o.id === selectedOrigin)
    setIntroCharName(newName.trim())
    setIntroOriginName(locale === 'zh' ? origin?.name_zh || '' : origin?.name_en || '')
    setShowIntro(true)

    loadCharacters()
  }

  const deleteCharacter = async (id: string) => {
    const supabase = createClient()
    const { error } = await (supabase as any)
      .from('new_characters')
      .delete()
      .eq('id', id)

    if (error) {
      alert(`Error: ${error.message}`)
      return
    }

    setDeleteConfirm(null)
    setDeleteConfirmName('')
    loadCharacters()
  }

  if (loading || loadingChars) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: '16px' }}>
        <div className="loading-spinner large" />
        <span style={{ color: '#0ff', fontSize: '11px' }}>{t.common.loading}</span>
      </div>
    )
  }

  if (fatalError) {
    return (
      <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px' }}>
        <div className="panel">
          <div className="panel-header" style={{ color: '#f44' }}>{t.common.error}</div>
          <pre style={{ color: '#f44', fontSize: '11px', whiteSpace: 'pre-wrap' }}>{fatalError}</pre>
          <button onClick={() => router.push('/')} style={{ marginTop: '12px' }}>{t.common.back}</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h1 style={{ color: '#0ff', fontSize: '16px', letterSpacing: '2px', margin: 0 }}>
          {t.appName}
        </h1>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ color: '#888', fontSize: '11px' }}>{user?.email}</span>
          <button onClick={signOut} className="btn-danger">
            {t.signOut}
          </button>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: '16px' }}>
        <div className="panel-header">SELECT CHARACTER</div>
        <p style={{ color: '#888', fontSize: '11px', marginBottom: '12px' }}>
          {characters.length}/4 slots used.
        </p>

        <div className="feature-grid">
          {characters.map(char => (
            <div
              key={char.id}
              className="card"
              onClick={() => router.push('/world')}
            >
              <div style={{ color: '#0ff', fontWeight: 'bold', fontSize: '13px' }}>{char.name}</div>
              <div style={{ color: '#888', fontSize: '10px', marginTop: '4px' }}>
                Lv.{char.level} | {ORIGINS.find(o => o.id === char.origin_id)?.[`name_${locale}` as keyof typeof ORIGINS[0]] || char.origin_id}
              </div>
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px', fontSize: '10px' }}>
                <span style={{ color: '#888' }}>STR {char.strength}</span>
                <span style={{ color: '#888' }}>DEX {char.dexterity}</span>
                <span style={{ color: '#888' }}>INT {char.intelligence}</span>
              </div>
              <div style={{ fontSize: '10px', color: '#888', marginTop: '4px' }}>
                Day {char.days_lived} | {char.highest_education || 'No education'}
              </div>
              <button
                className="btn-danger"
                style={{ marginTop: '8px' }}
                onClick={e => {
                  e.stopPropagation()
                  setDeleteConfirm(char.id)
                  setDeleteConfirmName(char.name)
                }}
              >
                DELETE
              </button>
            </div>
          ))}

          {characters.length < 4 && !showCreate && (
            <div
              className="card"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80px', cursor: 'pointer', borderStyle: 'dashed' }}
              onClick={() => setShowCreate(true)}
            >
              <span style={{ color: '#555', fontSize: '24px' }}>+</span>
            </div>
          )}
        </div>

        {showCreate && (
          <div style={{ marginTop: '12px' }}>
            <input
              placeholder="Character name..."
              value={newName}
              onChange={e => setNewName(e.target.value)}
              maxLength={20}
              style={{ width: '100%', marginBottom: '8px' }}
              onKeyDown={e => e.key === 'Enter' && createCharacter()}
            />

            <div style={{ marginBottom: '8px' }}>
              <div style={{ color: '#888', fontSize: '11px', marginBottom: '4px' }}>{t.settings.chooseOrigin}:</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {ORIGINS.map(origin => (
                  <div
                    key={origin.id}
                    className={`card ${selectedOrigin === origin.id ? 'active' : ''}`}
                    onClick={() => setSelectedOrigin(origin.id)}
                    style={{ cursor: 'pointer', padding: '8px' }}
                  >
                    <div style={{ fontWeight: 'bold', fontSize: '12px' }}>
                      {locale === 'zh' ? origin.name_zh : origin.name_en}
                    </div>
                    <div style={{ fontSize: '10px', color: '#888', marginTop: '2px' }}>
                      {locale === 'zh' ? origin.advantage_zh : origin.advantage_en}
                    </div>
                    <div style={{ fontSize: '9px', color: '#f44', marginTop: '2px' }}>
                      {locale === 'zh' ? origin.struggle_zh : origin.struggle_en}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={createCharacter} className="btn-green" style={{ flex: 1 }}>CREATE</button>
              <button onClick={() => { setShowCreate(false); setNewName(''); setSelectedOrigin('middle') }} className="btn-danger" style={{ flex: 1 }}>CANCEL</button>
            </div>
          </div>
        )}

        {error && <p style={{ color: '#f44', fontSize: '11px', marginTop: '8px' }}>{error}</p>}
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'var(--bg-tertiary)', border: '2px solid var(--red)',
            padding: '24px', maxWidth: '360px', width: '90%',
          }}>
            <div style={{ color: '#f44', fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', textAlign: 'center' }}>
              DELETE CHARACTER
            </div>
            <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold', textAlign: 'center', marginBottom: '12px' }}>
              {deleteConfirmName}
            </div>
            <div style={{ color: '#888', fontSize: '12px', marginBottom: '16px', textAlign: 'center' }}>
              {t.settings.deleteWarning}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-danger" style={{ flex: 1 }} onClick={() => deleteCharacter(deleteConfirm)}>
                YES, DELETE
              </button>
              <button style={{ flex: 1 }} onClick={() => { setDeleteConfirm(null); setDeleteConfirmName('') }}>
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Intro Story */}
      {showIntro && (
        <IntroStory
          characterName={introCharName}
          originName={introOriginName}
          onComplete={() => setShowIntro(false)}
        />
      )}
    </div>
  )
}
