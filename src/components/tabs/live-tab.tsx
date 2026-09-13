'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/lib/i18n'
import { createClient } from '@/lib/supabase'
import { PET_BREEDS, petBreedName, PARENT_OCCUPATIONS, PARENT_PERSONALITIES } from '@/lib/game-data'
import { gameAPI } from '@/lib/game-api'

interface LiveTabProps {
  character: any
  onRefresh: () => Promise<void>
}

export function LiveTab({ character, onRefresh }: LiveTabProps) {
  const { t, locale } = useTranslation()
  const [parents, setParents] = useState<any[]>([])
  const [partner, setPartner] = useState<any>(null)
  const [pets, setPets] = useState<any[]>([])
  const [children, setChildren] = useState<any[]>([])
  const [friends, setFriends] = useState<any[]>([])
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showAdoptPet, setShowAdoptPet] = useState(false)
  const [newPetName, setNewPetName] = useState('')
  const [selectedBreed, setSelectedBreed] = useState('labrador')
  const [parentsCreated, setParentsCreated] = useState(false)

  const supabase = createClient() as any
  const isOrphan = character.origin_id === 'orphan'

  useEffect(() => {
    loadData()
  }, [character.id])

  async function loadData() {
    // Load parents (skip for orphans)
    if (!isOrphan) {
      const { data: pData } = await supabase
        .from('character_parents')
        .select('*')
        .eq('character_id', character.id)
      setParents(pData || [])
      setParentsCreated(pData && pData.length > 0)
    }

    const { data: partnerData } = await supabase
      .from('character_partners')
      .select('*')
      .eq('character_id', character.id)
      .in('status', ['dating', 'serious', 'engaged', 'married'])
      .limit(1)
    setPartner(partnerData?.[0] || null)

    const { data: petData } = await supabase
      .from('character_pets')
      .select('*')
      .eq('character_id', character.id)
      .in('status', ['young', 'adult', 'alive'])
    setPets(petData || [])

    const { data: childData } = await supabase
      .from('character_children')
      .select('*')
      .eq('character_id', character.id)
    setChildren(childData || [])

    const { data: friendData } = await supabase
      .from('character_friends')
      .select('*')
      .eq('character_id', character.id)
    setFriends(friendData || [])
  }

  function showMsg(type: 'error' | 'success', msg: string) {
    if (type === 'error') setError(msg)
    else setSuccess(msg)
    setTimeout(() => { setError(''); setSuccess('') }, 4000)
  }

  async function createParentsAction() {
    setLoading('parents')
    setError('')
    const res = await gameAPI.createParents()
    if (res.ok) {
      showMsg('success', locale === 'zh' ? '找到了你的父母！' : 'Found your parents!')
      await loadData()
    } else {
      showMsg('error', res.error || 'Failed')
    }
    setLoading(null)
  }

  async function visitParent(parentId: string) {
    setLoading(`parent-${parentId}`)
    setError('')
    const res = await gameAPI.visitParent(parentId)
    if (res.ok) {
      const event = res.data?.event
      if (event?.type === 'gift') {
        showMsg('success', locale === 'zh' ? `父母给了你 ${event.gold} 金币！` : `Parents gave you ${event.gold} gold!`)
      } else {
        showMsg('success', locale === 'zh' ? '探望成功！' : 'Visit successful!')
      }
      await loadData()
      await onRefresh()
    } else {
      showMsg('error', res.error || 'Failed')
    }
    setLoading(null)
  }

  async function parentHelpAction(parentId: string) {
    setLoading(`parent-help-${parentId}`)
    setError('')
    const res = await gameAPI.parentHelp(parentId)
    if (res.ok) {
      if (res.data?.helped) {
        showMsg('success', locale === 'zh' ? '父母帮助了你学习！' : 'Parents helped you study!')
      } else {
        showMsg('success', locale === 'zh' ? '父母没能帮上忙...' : 'Parents could not help this time...')
      }
      await loadData()
      await onRefresh()
    } else {
      showMsg('error', res.error || 'Failed')
    }
    setLoading(null)
  }

  async function findPartner() {
    setLoading('partner')
    setError('')
    const res = await gameAPI.findPartner()
    if (res.ok) {
      showMsg('success', locale === 'zh' ? '遇到了心仪的对象！' : 'Met someone special!')
      await loadData()
      await onRefresh()
    } else {
      showMsg('error', res.error || 'Failed')
    }
    setLoading(null)
  }

  async function advancePartner(stage: string) {
    if (!partner) return
    setLoading('partner')
    setError('')
    const res = await gameAPI.advanceRelationship(partner.id, stage)
    if (res.ok) {
      showMsg('success', locale === 'zh' ? '关系更进一步！' : 'Relationship advanced!')
      await loadData()
    } else {
      showMsg('error', res.error || 'Failed')
    }
    setLoading(null)
  }

  async function adoptPet() {
    if (!newPetName.trim()) return
    setLoading('pet')
    setError('')
    const res = await gameAPI.adoptPet(selectedBreed, newPetName.trim())
    if (res.ok) {
      showMsg('success', locale === 'zh' ? `领养了${newPetName}！` : `Adopted ${newPetName}!`)
      setShowAdoptPet(false)
      setNewPetName('')
      await loadData()
      await onRefresh()
    } else {
      showMsg('error', res.error || 'Failed')
    }
    setLoading(null)
  }

  async function feedPet(petId: string) {
    setLoading(`pet-${petId}`)
    setError('')
    const res = await gameAPI.feedPet(petId)
    if (res.ok) {
      showMsg('success', locale === 'zh' ? '喂食成功！' : 'Pet fed!')
      await loadData()
      await onRefresh()
    } else {
      showMsg('error', res.error || 'Failed')
    }
    setLoading(null)
  }

  async function trainPetAction(petId: string) {
    setLoading(`pet-train-${petId}`)
    setError('')
    const res = await gameAPI.trainPet(petId)
    if (res.ok) {
      showMsg('success', locale === 'zh' ? '训练宠物成功！' : 'Pet trained!')
      await loadData()
      await onRefresh()
    } else {
      showMsg('error', res.error || 'Failed')
    }
    setLoading(null)
  }

  const statusLabels: Record<string, { zh: string; en: string }> = {
    dating: { zh: '约会中', en: 'Dating' },
    serious: { zh: '认真交往', en: 'Serious' },
    engaged: { zh: '已订婚', en: 'Engaged' },
    married: { zh: '已结婚', en: 'Married' },
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">{t.live.title}</h2>

      {error && <div className="text-red-400 text-sm text-center">{error}</div>}
      {success && <div className="text-green-400 text-sm text-center">{success}</div>}

      {/* Parents */}
      <div className="panel">
        <h3 className="font-bold mb-2">{t.live.parents}</h3>
        {isOrphan ? (
          <div className="text-center py-4">
            <p className="text-sm opacity-60">{locale === 'zh' ? '你是孤儿，没有父母' : 'You are an orphan, no parents'}</p>
            <p className="text-xs opacity-40 mt-1">{locale === 'zh' ? '但你可以找到自己的家庭' : 'But you can find your own family'}</p>
          </div>
        ) : parents.length > 0 ? (
          <div className="space-y-3">
            {parents.map(parent => {
              const occ = PARENT_OCCUPATIONS.find(o => o.id === parent.occupation)
              const pers = PARENT_PERSONALITIES.find(p => p.id === parent.personality)

              return (
                <div key={parent.id} className={`p-3 rounded bg-white/5 ${!parent.alive ? 'opacity-50' : ''}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold">
                        {parent.npc_name}
                        {!parent.alive && <span className="text-red-400 text-xs ml-2">(RIP)</span>}
                      </div>
                      <div className="text-xs opacity-60">
                        {parent.relationship === 'father'
                          ? (locale === 'zh' ? '父亲' : 'Father')
                          : (locale === 'zh' ? '母亲' : 'Mother')}
                        {occ && ` • ${locale === 'zh' ? occ.name_zh : occ.name_en}`}
                        {pers && ` • ${locale === 'zh' ? pers.name_zh : pers.name_en}`}
                      </div>
                      <div className="text-xs opacity-60">
                        {locale === 'zh' ? `忠诚度: ${parent.loyalty}` : `Loyalty: ${parent.loyalty}`}
                      </div>
                    </div>
                  </div>
                  {parent.alive && (
                    <div className="flex gap-2 mt-3">
                      <button
                        className="btn-sm flex-1"
                        disabled={character.energy < 10 || loading === `parent-${parent.id}`}
                        onClick={() => visitParent(parent.id)}
                      >
                        {loading === `parent-${parent.id}` ? '...' : `${locale === 'zh' ? '探望' : 'Visit'} (10E)`}
                      </button>
                      <button
                        className="btn-sm flex-1"
                        disabled={character.energy < 15 || loading === `parent-help-${parent.id}`}
                        onClick={() => parentHelpAction(parent.id)}
                      >
                        {loading === `parent-help-${parent.id}` ? '...' : `${locale === 'zh' ? '请求帮助' : 'Ask Help'} (15E)`}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm opacity-60 mb-3">{locale === 'zh' ? '还没找到父母' : 'Parents not found yet'}</p>
            <button className="btn" disabled={loading === 'parents'} onClick={createParentsAction}>
              {loading === 'parents' ? '...' : (locale === 'zh' ? '寻找父母' : 'Find Parents')}
            </button>
          </div>
        )}
      </div>

      {/* Partner */}
      <div className="panel">
        <h3 className="font-bold mb-2">{t.live.partner}</h3>
        {partner ? (
          <div className="p-3 rounded bg-white/5">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-bold">{partner.npc_name}</div>
                <div className="text-xs opacity-60">
                  {statusLabels[partner.status]?.[locale] || partner.status}
                </div>
              </div>
              <div className="text-right text-xs">
                <div>{t.live.loyalty}: {partner.loyalty}</div>
                <div>{t.live.happiness}: {partner.happiness}</div>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              {partner.status === 'dating' && (
                <button className="btn-sm flex-1" disabled={loading === 'partner'} onClick={() => advancePartner('serious')}>
                  {t.live.goOnDate}
                </button>
              )}
              {partner.status === 'serious' && (
                <button className="btn-sm flex-1" disabled={loading === 'partner'} onClick={() => advancePartner('engaged')}>
                  {t.live.propose}
                </button>
              )}
              {partner.status === 'engaged' && (
                <button className="btn-sm flex-1" disabled={loading === 'partner'} onClick={() => advancePartner('married')}>
                  {t.live.getMarried}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm opacity-60 mb-3">{t.live.noPartner}</p>
            <button className="btn" disabled={loading === 'partner' || character.energy < 20} onClick={findPartner}>
              {loading === 'partner' ? '...' : t.live.lookForPartner}
            </button>
          </div>
        )}
      </div>

      {/* Pet */}
      <div className="panel">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold">{t.live.pet}</h3>
          {pets.length === 0 && (
            <button className="btn-sm" onClick={() => setShowAdoptPet(true)}>
              {t.live.adoptPet}
            </button>
          )}
        </div>
        {pets.length > 0 ? (
          <div className="space-y-2">
            {pets.map(pet => (
              <div key={pet.id} className="p-3 rounded bg-white/5">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-bold">{pet.name}</div>
                    <div className="text-xs opacity-60">
                      {petBreedName(pet.breed_id, locale)} • {pet.status}
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <div>{t.live.happiness}: {pet.happiness}</div>
                    <div>{t.live.loyalty}: {pet.loyalty}</div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    className="btn-sm flex-1"
                    disabled={character.energy < 5 || loading === `pet-${pet.id}`}
                    onClick={() => feedPet(pet.id)}
                  >
                    {loading === `pet-${pet.id}` ? '...' : `${t.live.feedPet} (5E)`}
                  </button>
                  <button
                    className="btn-sm flex-1"
                    disabled={character.energy < 10 || loading === `pet-train-${pet.id}`}
                    onClick={() => trainPetAction(pet.id)}
                  >
                    {loading === `pet-train-${pet.id}` ? '...' : `${t.live.trainPet} (10E)`}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm opacity-60 text-center">{t.live.noPet}</p>
        )}
      </div>

      {/* Children */}
      <div className="panel">
        <h3 className="font-bold mb-2">{t.live.children}</h3>
        {children.length > 0 ? (
          <div className="space-y-2">
            {children.map(child => (
              <div key={child.id} className="p-2 rounded bg-white/5 text-sm">
                <div className="font-bold">{child.name}</div>
                <div className="text-xs opacity-60">
                  {locale === 'zh' ? `年龄: ${child.age}` : `Age: ${child.age}`} •
                  {locale === 'zh' ? ` 健康: ${child.health}` : ` Health: ${child.health}`}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm opacity-60 text-center">{t.live.noChildren}</p>
        )}
      </div>

      {/* Close Friends */}
      <div className="panel">
        <h3 className="font-bold mb-2">{t.live.friends}</h3>
        {friends.length > 0 ? (
          <div className="space-y-2">
            {friends.map(friend => (
              <div key={friend.id} className="flex justify-between p-2 rounded bg-white/5 text-sm">
                <span className="font-bold">{friend.npc_name}</span>
                <span className="text-xs opacity-60">
                  {t.live.loyalty}: {friend.loyalty}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm opacity-60 text-center">{t.live.noFriends}</p>
        )}
      </div>

      {/* Adopt Pet Modal */}
      {showAdoptPet && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="panel w-full max-w-md">
            <h3 className="font-bold mb-4">{t.live.adoptPet}</h3>

            <div className="space-y-3">
              <div>
                <label className="text-sm opacity-60">{t.live.petName}</label>
                <input
                  className="w-full mt-1"
                  value={newPetName}
                  onChange={e => setNewPetName(e.target.value)}
                  placeholder={locale === 'zh' ? '给宠物起个名字' : 'Name your pet'}
                />
              </div>

              <div>
                <label className="text-sm opacity-60">{locale === 'zh' ? '选择品种' : 'Choose breed'}</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {PET_BREEDS.map(breed => (
                    <button
                      key={breed.id}
                      className={`p-2 rounded text-sm text-left ${
                        selectedBreed === breed.id
                          ? 'bg-blue-500/20 border border-blue-500/50'
                          : 'bg-white/5'
                      }`}
                      onClick={() => setSelectedBreed(breed.id)}
                    >
                      <div className="font-bold">{petBreedName(breed.id, locale)}</div>
                      <div className="text-xs opacity-60">{breed.species}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  className="btn flex-1"
                  disabled={!newPetName.trim() || loading === 'pet'}
                  onClick={adoptPet}
                >
                  {loading === 'pet' ? '...' : t.live.confirmAdopt}
                </button>
                <button className="btn flex-1" onClick={() => setShowAdoptPet(false)}>
                  {t.common.cancel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
