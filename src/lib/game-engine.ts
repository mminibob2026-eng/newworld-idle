import { createServerSupabase } from './supabase-server'
import { XP_FOR_LEVEL } from './game-data'

// ---- CHARACTER ----

export async function getCharacters(accountId: string) {
  const supabase = await createServerSupabase()
  const { data } = await supabase
    .from('characters')
    .select('*')
    .eq('account_id', accountId)
    .order('created_at', { ascending: true })
  return data ?? []
}

export async function createCharacter(accountId: string, name: string) {
  const supabase = await createServerSupabase()

  const { count } = await supabase
    .from('characters')
    .select('*', { count: 'exact', head: true })
    .eq('account_id', accountId)

  if (count && count >= 4) {
    throw new Error('Maximum 4 characters per account')
  }

  const { data, error } = await supabase
    .from('characters')
    .insert({ account_id: accountId, name })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function addXp(characterId: string, amount: number) {
  const supabase = await createServerSupabase()
  const { data: char } = await supabase
    .from('characters')
    .select('*')
    .eq('id', characterId)
    .single()

  if (!char) throw new Error('Character not found')

  const newXp = char.xp + amount
  const xpNeeded = XP_FOR_LEVEL(char.level)
  let newLevel = char.level
  let remainingXp = newXp

  while (remainingXp >= XP_FOR_LEVEL(newLevel)) {
    remainingXp -= XP_FOR_LEVEL(newLevel)
    newLevel++
  }

  const { error } = await supabase
    .from('characters')
    .update({
      level: newLevel,
      xp: remainingXp,
      attribute_points: char.attribute_points + (newLevel - char.level),
      last_active_at: new Date().toISOString(),
    })
    .eq('id', characterId)

  if (error) throw error
  return { leveledUp: newLevel > char.level, newLevel }
}

// ---- PROFESSIONS ----

export async function startProfession(characterId: string, professionId: string, durationMinutes: number = 30) {
  const supabase = await createServerSupabase()

  const { data: prof } = await supabase
    .from('professions')
    .select('*')
    .eq('character_id', characterId)
    .eq('profession', professionId)
    .single()

  if (!prof) throw new Error(`Profession ${professionId} not learned`)

  const now = new Date()
  const finishAt = new Date(now.getTime() + durationMinutes * 60 * 1000)

  const { data: char } = await supabase
    .from('characters')
    .select('account_id')
    .eq('id', characterId)
    .single()

  if (!char) throw new Error('Character not found')

  const { error } = await supabase
    .from('professions')
    .update({
      is_active: true,
      started_at: now.toISOString(),
      finish_at: finishAt.toISOString(),
    })
    .eq('id', prof.id)

  if (error) throw error

  await logAction(char.account_id, characterId, 'start_profession', {
    profession: professionId,
    duration: durationMinutes,
  })

  return { startedAt: now.toISOString(), finishAt: finishAt.toISOString() }
}

export async function claimProfessionRewards(characterId: string, professionId: string) {
  const supabase = await createServerSupabase()

  const { data: prof } = await supabase
    .from('professions')
    .select('*')
    .eq('character_id', characterId)
    .eq('profession', professionId)
    .single()

  if (!prof || !prof.is_active) throw new Error('No active profession session')

  const now = new Date()
  if (new Date(prof.finish_at!) > now) throw new Error('Session still in progress')

  const elapsedSeconds = Math.floor((now.getTime() - new Date(prof.started_at!).getTime()) / 1000)

  const { data: profData } = await supabase
    .from('content_professions')
    .select('base_time_seconds, base_xp_per_action')
    .eq('id', professionId)
    .single()

  if (!profData) throw new Error('Profession data not found')

  const baseTime = profData.base_time_seconds
  let actions = Math.floor(elapsedSeconds / baseTime)

  const maxActions = Math.floor((24 * 3600) / baseTime)
  if (actions > maxActions) actions = maxActions

  if (actions <= 0) throw new Error('No time elapsed')

  const xpGained = actions * profData.base_xp_per_action
  const xpNeeded = XP_FOR_LEVEL(prof.level)
  const newXp = prof.xp + xpGained
  const levelUps = Math.floor(newXp / xpNeeded)
  const remainingXp = newXp % xpNeeded

  const { data: rewards } = await supabase
    .from('content_profession_rewards')
    .select('*')
    .eq('profession_id', professionId)
    .lte('min_level', prof.level)

  const items: Record<string, number> = {}
  for (let i = 0; i < actions; i++) {
    if (rewards && rewards.length > 0) {
      const totalWeight = rewards.reduce((sum, r) => sum + r.weight, 0)
      let roll = Math.floor(Math.random() * totalWeight)
      for (const reward of rewards) {
        roll -= reward.weight
        if (roll < 0) {
          const qty = Math.floor(Math.random() * (reward.max_qty - reward.min_qty + 1)) + reward.min_qty
          items[reward.item_id] = (items[reward.item_id] || 0) + qty
          break
        }
      }
    }
  }

  const supabaseServer = supabase
  const { data: char } = await supabaseServer
    .from('characters')
    .select('account_id')
    .eq('id', characterId)
    .single()

  for (const [itemId, qty] of Object.entries(items)) {
    await upsertStorage(char!.account_id, itemId, qty)
  }

  await supabaseServer
    .from('professions')
    .update({
      level: prof.level + levelUps,
      xp: remainingXp,
      is_active: false,
      started_at: null,
      finish_at: null,
    })
    .eq('id', prof.id)

  await addXp(characterId, xpGained)
  await logAction(char!.account_id, characterId, 'claim_profession', {
    profession: professionId,
    actions,
    xp_gained: xpGained,
    items_gained: items,
  })

  return { actions, xpGained, levelUps, items, newLevel: prof.level + levelUps }
}

async function upsertStorage(accountId: string, itemId: string, quantity: number) {
  const supabase = await createServerSupabase()
  const { data: existing } = await supabase
    .from('storage')
    .select('*')
    .eq('account_id', accountId)
    .eq('item_type', 'item')
    .eq('item_id', itemId)
    .single()

  if (existing) {
    await supabase
      .from('storage')
      .update({ quantity: existing.quantity + quantity, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
  } else {
    await supabase
      .from('storage')
      .insert({ account_id: accountId, item_type: 'item', item_id: itemId, quantity })
  }
}

// ---- EXPLORATION ----

export async function startExploration(characterId: string, region: string) {
  const supabase = await createServerSupabase()

  const { data: regionData } = await supabase
    .from('content_regions')
    .select('exploration_base_time')
    .eq('id', region)
    .single()

  if (!regionData) throw new Error('Region not found')

  const durationMinutes = regionData.exploration_base_time
  const now = new Date()
  const finishAt = new Date(now.getTime() + durationMinutes * 60 * 1000)

  const { error } = await supabase
    .from('exploration')
    .insert({
      character_id: characterId,
      region,
      started_at: now.toISOString(),
      finish_at: finishAt.toISOString(),
      completed: false,
    })

  if (error) throw error
  return { startedAt: now.toISOString(), finishAt: finishAt.toISOString() }
}

export async function claimExploration(explorationId: string) {
  const supabase = await createServerSupabase()

  const { data: exp } = await supabase
    .from('exploration')
    .select('*')
    .eq('id', explorationId)
    .single()

  if (!exp || exp.completed) throw new Error('No active exploration')
  if (new Date(exp.finish_at) > new Date()) throw new Error('Exploration still in progress')

  const { data: possibleDiscoveries } = await supabase
    .from('content_region_discoveries')
    .select('*, content_discoveries(*)')
    .eq('region_id', exp.region)

  const discoveries: any[] = []
  if (possibleDiscoveries) {
    const totalWeight = possibleDiscoveries.reduce((sum, d) => sum + d.weight, 0)

    for (let i = 0; i < 3; i++) {
      if (Math.random() > 0.4) continue
      let roll = Math.floor(Math.random() * totalWeight)
      for (const disc of possibleDiscoveries) {
        roll -= disc.weight
        if (roll < 0) {
          discoveries.push(disc.content_discoveries)
          break
        }
      }
    }
  }

  const discoveryValue = discoveries.reduce((sum, d) => sum + (d.base_value || 0), 0)

  await supabase
    .from('exploration')
    .update({ completed: true, discoveries })
    .eq('id', explorationId)

  if (discoveryValue > 0) {
    const { data: char } = await supabase
      .from('characters')
      .select('account_id')
      .eq('id', exp.character_id)
      .single()

    if (char) {
      await supabase.rpc('add_gold', { p_character_id: exp.character_id, p_amount: discoveryValue })
    }
  }

  return { discoveries }
}

// ---- CONTRACTS ----

export async function generateContracts(characterId: string) {
  const supabase = await createServerSupabase()

  const { data: char } = await supabase
    .from('characters')
    .select('level')
    .eq('id', characterId)
    .single()

  if (!char) throw new Error('Character not found')

  const { data: templates } = await supabase
    .from('content_contracts')
    .select('*')
    .lte('min_level', char.level)

  if (!templates) return []

  const existingCount = 3
  const shuffled = templates.sort(() => Math.random() - 0.5).slice(0, existingCount)

  const now = new Date()
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  const contracts = shuffled.map(t => {
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

  const { data } = await supabase.from('contracts').insert(contracts).select()
  return data ?? []
}

export async function completeContract(contractId: string) {
  const supabase = await createServerSupabase()

  const { data: contract } = await supabase
    .from('contracts')
    .select('*')
    .eq('id', contractId)
    .single()

  if (!contract || contract.completed) throw new Error('Contract not found or already completed')
  if (new Date(contract.expires_at) < new Date()) throw new Error('Contract expired')

  const char = await (supabase as any)
    .from('characters')
    .select('*')
    .eq('id', contract.character_id)
    .single()
    .then((r: any) => r.data)

  if (!char) throw new Error('Character not found')

  const { data: storageItem } = await supabase
    .from('storage')
    .select('*')
    .eq('account_id', char.account_id)
    .eq('item_type', 'item')
    .eq('item_id', contract.requirement_item)
    .single()

  if (!storageItem || storageItem.quantity < contract.requirement_qty) {
    throw new Error('Not enough resources')
  }

  await supabase
    .from('storage')
    .update({ quantity: storageItem.quantity - contract.requirement_qty })
    .eq('id', storageItem.id)

  await supabase
    .from('characters')
    .update({ gold: char.gold + contract.reward_gold })
    .eq('id', contract.character_id)

  if (contract.reward_knowledge > 0) {
    await supabase
      .from('characters')
      .update({ knowledge: char.knowledge + contract.reward_knowledge })
      .eq('id', contract.character_id)
  }

  await supabase
    .from('contracts')
    .update({ completed: true })
    .eq('id', contractId)

  await logAction(char.account_id, contract.character_id, 'complete_contract', {
    contract_id: contractId,
    item: contract.requirement_item,
    qty: contract.requirement_qty,
    gold: contract.reward_gold,
  })

  return { gold: contract.reward_gold, knowledge: contract.reward_knowledge }
}

// ---- STORAGE ----

export async function getStorage(accountId: string) {
  const supabase = await createServerSupabase()
  const { data } = await supabase
    .from('storage')
    .select('*, content_items(*)')
    .eq('account_id', accountId)
    .eq('item_type', 'item')

  return data ?? []
}

// ---- LOGGING (Rule 17) ----

async function logAction(accountId: string, characterId: string | null, action: string, details: any) {
  const supabase = await createServerSupabase()
  await supabase.from('game_logs').insert({
    account_id: accountId,
    character_id: characterId,
    action,
    details,
  })
}

// ---- PROFESSIONS SETUP ----

export async function learnProfession(characterId: string, professionId: string) {
  const supabase = await createServerSupabase()

  const { data: existing } = await supabase
    .from('professions')
    .select('*')
    .eq('character_id', characterId)
    .eq('profession', professionId)
    .single()

  if (existing) return existing

  const { data: profData } = await supabase
    .from('content_professions')
    .select('category')
    .eq('id', professionId)
    .single()

  const { data, error } = await supabase
    .from('professions')
    .insert({
      character_id: characterId,
      profession: professionId,
      category: profData?.category || 'gathering',
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getLearnedProfessions(characterId: string) {
  const supabase = await createServerSupabase()
  const { data } = await supabase
    .from('professions')
    .select('*')
    .eq('character_id', characterId)
  return data ?? []
}
