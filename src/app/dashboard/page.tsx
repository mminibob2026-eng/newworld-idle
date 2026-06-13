'use client'

import { useAuth } from '@/components/auth-provider'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

type Character = any

export default function Dashboard() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [characters, setCharacters] = useState<Character[]>([])
  const [loadingChars, setLoadingChars] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [error, setError] = useState('')
  const [fatalError, setFatalError] = useState('')
  const [bobCoins, setBobCoins] = useState(0)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    if (!user && !loading) router.push('/')
    if (user) {
      loadCharacters().catch(e => {
        setFatalError(e?.message || String(e))
        setLoadingChars(false)
      })
      loadProfile()
    }
  }, [user, loading, router])

  const loadProfile = async () => {
    const supabase = createClient()
    const { data } = await (supabase as any)
      .from('profiles')
      .select('bob_coins')
      .eq('id', user!.id)
      .single()
    if (data) setBobCoins(data.bob_coins || 0)
  }

  const loadCharacters = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('characters')
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
    
    // Use a server-side transaction or check to prevent race conditions
    const { data: existingChars } = await supabase
      .from('characters')
      .select('id')
      .eq('account_id', user!.id)

    if (existingChars && existingChars.length >= 4) {
      setError('Maximum 4 characters per account')
      return
    }

    const { error: err } = await supabase
      .from('characters')
      .insert({ account_id: user!.id, name: newName.trim() } as any)

    if (err) {
      setError(err.message)
      return
    }

    setNewName('')
    setShowCreate(false)
    loadCharacters()
  }

  const deleteCharacter = async (id: string) => {
    const supabase = createClient()

    // Check if this is the last character
    const isLastCharacter = characters.length <= 1

    // Delete character-level data
    await (supabase as any).from('professions').delete().eq('character_id', id)
    await (supabase as any).from('exploration').delete().eq('character_id', id)
    await (supabase as any).from('contracts').delete().eq('character_id', id)
    await (supabase as any).from('character_inventory').delete().eq('character_id', id)
    await (supabase as any).from('research').delete().eq('character_id', id)
    await (supabase as any).from('game_logs').delete().eq('character_id', id)
    await (supabase as any).from('characters').delete().eq('id', id)

    // If last character, also clear account-level data
    if (isLastCharacter) {
      await (supabase as any).from('storage').delete().eq('account_id', user!.id)
      await (supabase as any).from('player_discoveries').delete().eq('account_id', user!.id)
      await (supabase as any).from('player_achievements').delete().eq('account_id', user!.id)
      await (supabase as any).from('achievement_counters').delete().eq('account_id', user!.id)
    }

    setDeleteConfirm(null)
    loadCharacters()
  }

  if (loading || loadingChars) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: '16px' }}>
        <div className="loading-spinner large" />
        <span style={{ color: '#0ff', fontSize: '11px' }}>LOADING...</span>
      </div>
    )
  }

  if (fatalError) {
    return (
      <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px' }}>
        <div className="panel">
          <div className="panel-header" style={{ color: '#f44' }}>ERROR</div>
          <pre style={{ color: '#f44', fontSize: '11px', whiteSpace: 'pre-wrap' }}>{fatalError}</pre>
          <button onClick={() => router.push('/')} style={{ marginTop: '12px' }}>← BACK TO LOGIN</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h1 style={{ color: '#0ff', fontSize: '16px', letterSpacing: '2px', margin: 0 }}>
          NEW WORLD IDLE
        </h1>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ color: '#888', fontSize: '11px' }}>{user?.email}</span>
          <button onClick={signOut} className="btn-danger">
            LOGOUT
          </button>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: '16px' }}>
        <div className="panel-header">SELECT CHARACTER</div>
        <p style={{ color: '#888', fontSize: '11px', marginBottom: '12px' }}>
          Choose a character to enter the world. {characters.length}/4 slots used.
        </p>

        <div className="feature-grid">
          {characters.map(char => (
            <div
              key={char.id}
              className="card"
              onClick={() => router.push(`/world?char=${char.id}`)}
            >
              <div style={{ color: '#0ff', fontWeight: 'bold', fontSize: '13px' }}>{char.name}</div>
              <div style={{ color: '#888', fontSize: '10px', marginTop: '4px' }}>
                Lv.{char.level} | {char.region.replace('_', ' ')}
              </div>
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px', fontSize: '10px' }}>
                <span style={{ color: '#888' }}>STR {char.strength}</span>
                <span style={{ color: '#888' }}>DEX {char.dexterity}</span>
                <span style={{ color: '#888' }}>INT {char.intelligence}</span>
              </div>
              <button
                className="btn-danger"
                style={{ marginTop: '8px' }}
                onClick={e => { e.stopPropagation(); setDeleteConfirm(char.id) }}
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
          <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
            <input
              placeholder="Character name..."
              value={newName}
              onChange={e => setNewName(e.target.value)}
              maxLength={20}
              style={{ flex: 1 }}
              onKeyDown={e => e.key === 'Enter' && createCharacter()}
            />
            <button onClick={createCharacter} className="btn-green">CREATE</button>
            <button onClick={() => setShowCreate(false)} className="btn-danger">CANCEL</button>
          </div>
        )}

        {error && <p style={{ color: '#f44', fontSize: '11px', marginTop: '8px' }}>{error}</p>}
      </div>

      <div className="panel" style={{ marginBottom: '16px' }}>
        <div className="panel-header">ACCOUNT</div>
        <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#888' }}>
          <span>Bob Coins: <span style={{ color: '#ff0' }}>{bobCoins}</span></span>
          <span>Bob Pass: <span style={{ color: '#888' }}>Free</span></span>
        </div>
      </div>

      {/* Delete Character Confirmation Dialog */}
      {deleteConfirm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'var(--bg-tertiary)', border: '1px solid var(--red)',
            padding: '20px', maxWidth: '320px', width: '90%',
            boxShadow: '0 0 30px rgba(255,0,0,0.2)',
          }}>
            <div style={{ color: '#f44', fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>
              ⚠️ Delete Character?
            </div>
            <div style={{ color: '#ccc', fontSize: '11px', marginBottom: '16px' }}>
              This will permanently delete this character and all associated progress.
              {deleteConfirm && characters.length <= 1 && (
                <><br /><br /><span style={{ color: '#f44' }}>This is your last character — all account data (storage, discoveries, achievements) will also be erased.</span></>
              )}
              {deleteConfirm && characters.length > 1 && (
                <><br /><br /><span style={{ color: '#ff0' }}>Shared storage and account-level achievements will be preserved.</span></>
              )}
              <br /><span style={{ color: '#f44' }}>This cannot be undone.</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-danger" style={{ flex: 1 }} onClick={() => deleteCharacter(deleteConfirm)}>
                YES, DELETE
              </button>
              <button style={{ flex: 1 }} onClick={() => setDeleteConfirm(null)}>
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
