import { createServerSupabase } from './supabase-server'

const XP_FOR_LEVEL = (level: number) => Math.floor(100 * Math.pow(level, 1.5))

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

const WEIGHT_THRESHOLD_GREEN = 0.4
const WEIGHT_THRESHOLD_ORANGE = 0.65
const WEIGHT_THRESHOLD_RED = 0.85

function weightedRoll(weights: { item: string; weight: number }[]): string | null {
  const total = weights.reduce((s, w) => s + w.weight, 0)
  if (total === 0) return null
  let roll = Math.random() * total
  for (const w of weights) {
    roll -= w.weight
    if (roll <= 0) return w.item
  }
  return null
}

function rarityQuality(attrs: { luck: number; intelligence: number }): number {
  return (attrs.luck * 0.01 + attrs.intelligence * 0.005) / 3
}

async function incrementCounter(supabase: any, accountId: string, key: string, amount: number = 1) {
  // Use atomic increment function to avoid race conditions
  try {
    await (supabase as any)
      .rpc('increment_counter', {
        p_account_id: accountId,
        p_key: key,
        p_amount: amount,
      })
  } catch {
    // Fallback to simple insert if function doesn't exist yet
    await supabase
      .from('achievement_counters')
      .insert({ account_id: accountId, counter_key: key, value: amount })
      .catch(() => {
        // If insert fails (duplicate), try to update
        supabase
          .from('achievement_counters')
          .select('id, value')
          .eq('account_id', accountId)
          .eq('counter_key', key)
          .single()
          .then(({ data }: any) => {
            if (data) {
              supabase
                .from('achievement_counters')
                .update({ value: data.value + amount })
                .eq('id', data.id)
            }
          })
      })
  }
}

async function checkAchievements(supabase: any, accountId: string) {
  const { data: counters } = await supabase
    .from('achievement_counters')
    .select('*')
    .eq('account_id', accountId)

  const { data: achievements } = await supabase
    .from('content_achievements')
    .select('*')

  const { data: playerAchs } = await supabase
    .from('player_achievements')
    .select('*')
    .eq('account_id', accountId)

  const counterMap = Object.fromEntries((counters || []).map((c: any) => [c.counter_key, c.value]))
  const playerMap = Object.fromEntries((playerAchs || []).map((pa: any) => [pa.achievement_id, pa]))

  const newAchievements: any[] = []

  for (const ach of achievements || []) {
    if (playerMap[ach.id]) continue

    const current = counterMap[ach.requirement_type] || 0
    if (current >= ach.requirement_value) {
      const { data: newAch } = await supabase
        .from('player_achievements')
        .insert({
          account_id: accountId,
          achievement_id: ach.id,
          progress: current,
          completed_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (newAch) newAchievements.push({ ...newAch, achievement: ach })
    }
  }

  return newAchievements
}

export async function processOfflineProgress(characterId: string) {
  const supabase = await createServerSupabase()

  const { data: char } = await supabase
    .from('characters')
    .select('*')
    .eq('id', characterId)
    .single()

  if (!char) return { professions: [], explorations: [], error: 'Character not found' }

  const results: any[] = []

  const offlineMult = 1 + char.endurance * 0.02
  const strYield = 1 + char.strength * 0.02
  const dexSpeed = Math.max(0.1, 1 - char.dexterity * 0.01)

  const { data: activeProfessions } = await supabase
    .from('professions')
    .select('*')
    .eq('character_id', characterId)
    .eq('is_active', true)
    .not('finish_at', 'is', null)
    .lt('finish_at', new Date().toISOString())

  for (const prof of activeProfessions || []) {
    const { data: profData } = await supabase
      .from('content_professions')
      .select('*')
      .eq('id', prof.profession)
      .single()

    if (!profData) continue

    const elapsedSeconds = Math.floor(
      (Date.now() - new Date(prof.started_at!).getTime()) / 1000
    )
    const adjustedTime = Math.floor(profData.base_time_seconds * dexSpeed)
    let actions = Math.floor(elapsedSeconds / adjustedTime)

    const maxActions = Math.floor((24 * 3600) / adjustedTime)
    if (actions > maxActions) actions = maxActions
    if (actions <= 0) continue

    const xpGained = Math.floor(actions * profData.base_xp_per_action * offlineMult)

    const { data: rewards } = await supabase
      .from('content_profession_rewards')
      .select('*, content_items(*)')
      .eq('profession_id', prof.profession)
      .lte('min_level', prof.level)

    const items: Record<string, number> = {}
    const quality = rarityQuality(char)

    for (let i = 0; i < actions; i++) {
      if (!rewards || rewards.length === 0) continue

      const weights = rewards.map((r: any) => ({
        item: r.item_id,
        weight: Math.max(1, Math.floor(r.weight * (1 + quality))),
      }))

      const rolled = weightedRoll(weights)
      if (!rolled) continue

      const rewardDef = rewards.find((r: any) => r.item_id === rolled)
      if (!rewardDef) continue

      const baseQty = Math.floor(Math.random() * (rewardDef.max_qty - rewardDef.min_qty + 1)) + rewardDef.min_qty
      const finalQty = Math.max(1, Math.floor(baseQty * strYield * offlineMult))
      items[rolled] = (items[rolled] || 0) + finalQty
    }

    for (const [itemId, qty] of Object.entries(items)) {
      const { data: existing } = await supabase
        .from('storage')
        .select('*')
        .eq('account_id', char.account_id)
        .eq('item_type', 'item')
        .eq('item_id', itemId)
        .single()

      if (existing) {
        await supabase
          .from('storage')
          .update({ quantity: existing.quantity + qty })
          .eq('id', existing.id)
      } else {
        await supabase
          .from('storage')
          .insert({ account_id: char.account_id, item_type: 'item', item_id: itemId, quantity: qty })
      }
    }

    const profXpNeeded = XP_FOR_LEVEL(prof.level)
    const newProfXp = prof.xp + xpGained
    const profLevelUps = Math.floor(newProfXp / profXpNeeded)

    await supabase
      .from('professions')
      .update({
        level: prof.level + profLevelUps,
        xp: newProfXp % profXpNeeded,
        is_active: false,
        started_at: null,
        finish_at: null,
      })
      .eq('id', prof.id)

    const charResult = await addCharacterXp(supabase, char, xpGained)
    if (charResult.leveledUp) {
      // Refresh char object for next iteration
      const { data: updatedChar } = await supabase
        .from('characters')
        .select('*')
        .eq('id', characterId)
        .single()
      if (updatedChar) {
        char.level = updatedChar.level
        char.xp = updatedChar.xp
        char.attribute_points = updatedChar.attribute_points
        char.gold = updatedChar.gold
      }
    }

    // Auto-start queued profession in same category if exists
    const { data: queuedProf } = await supabase
      .from('professions')
      .select('*')
      .eq('character_id', characterId)
      .eq('category', profData.category)
      .eq('is_queued', true)
      .maybeSingle()

    if (queuedProf) {
      const queueDur = Math.floor(30 * dexSpeed)
      const maxQueueDur = Math.floor(480 * dexSpeed)
      const finalQueueDur = Math.min(queueDur, maxQueueDur)
      const queueNow = new Date()
      const queueFinishAt = new Date(queueNow.getTime() + finalQueueDur * 60 * 1000)

      await supabase
        .from('professions')
        .update({
          is_queued: false,
          is_active: true,
          started_at: queueNow.toISOString(),
          finish_at: queueFinishAt.toISOString(),
        })
        .eq('id', queuedProf.id)
    }

    // Track counters for achievements
    for (const [itemId, qty] of Object.entries(items)) {
      const itemName = itemId.toLowerCase()
      if (itemName.includes('stone')) {
        await incrementCounter(supabase, char.account_id, 'mine_stone', qty as number)
      } else if (itemName.includes('wood')) {
        await incrementCounter(supabase, char.account_id, 'chop_wood', qty as number)
      } else if (itemName.includes('fish')) {
        await incrementCounter(supabase, char.account_id, 'catch_fish', qty as number)
      } else if (itemName.includes('crop') || itemName.includes('wheat') || itemName.includes('corn')) {
        await incrementCounter(supabase, char.account_id, 'farm_crops', qty as number)
      }
    }

    results.push({
      type: 'profession',
      name: profData.name,
      actions,
      xpGained,
      levelUps: profLevelUps,
      fromLevel: prof.level,
      items,
    })
  }

  const { data: activeExplorations } = await supabase
    .from('exploration')
    .select('*')
    .eq('character_id', characterId)
    .eq('completed', false)
    .not('finish_at', 'is', null)
    .lt('finish_at', new Date().toISOString())

  for (const exp of activeExplorations || []) {
    const { data: region } = await supabase
      .from('content_regions')
      .select('*')
      .eq('id', exp.region)
      .single()

    if (!region) continue

    const intBonus = 1 + char.intelligence * 0.02
    const lckMult = 1 + char.luck * 0.01

    const rollCount = Math.floor(3 * intBonus)

    const { data: discoveries } = await supabase
      .from('content_region_discoveries')
      .select('*, content_discoveries(*)')
      .eq('region_id', exp.region)

    const found: any[] = []
    if (discoveries) {
      const totalWeight = discoveries.reduce((sum, d: any) => sum + d.weight, 0)
      if (totalWeight > 0) {
        for (let i = 0; i < rollCount; i++) {
          const hitChance = clamp(0.4 * lckMult, 0.1, 0.9)
          if (Math.random() > hitChance) continue

          let roll = Math.floor(Math.random() * totalWeight)
          for (const disc of discoveries) {
            roll -= (disc as any).weight
            if (roll < 0) {
              found.push((disc as any).content_discoveries)
              break
            }
          }
        }
      }
    }

    const value = found.reduce((sum: number, d: any) => sum + (d.base_value || 0), 0) * offlineMult

    await supabase
      .from('exploration')
      .update({ completed: true, discoveries: found })
      .eq('id', exp.id)

    // Deduplicate discoveries before inserting
    const seen = new Set<string>()
    const uniqueFound = found.filter((d: any) => {
      if (seen.has(d.id)) return false
      seen.add(d.id)
      return true
    })

    for (const d of uniqueFound) {
      await supabase
        .from('player_discoveries')
        .insert({
          account_id: char.account_id,
          discovery_id: d.id,
          region_id: exp.region,
          lore: d.lore || '',
        })
        .select()
        .maybeSingle()
    }

    // Track exploration counters
    await incrementCounter(supabase, char.account_id, 'complete_exploration', 1)
    const rareDiscs = found.filter((d: any) => ['rare', 'epic', 'legendary', 'mythic'].includes(d.rarity))
    if (rareDiscs.length > 0) {
      await incrementCounter(supabase, char.account_id, 'discover_rare', rareDiscs.length)
    }
    const mythicDiscs = found.filter((d: any) => d.rarity === 'mythic')
    if (mythicDiscs.length > 0) {
      await incrementCounter(supabase, char.account_id, 'find_mythic', mythicDiscs.length)
    }

    if (value > 0) {
      await supabase
        .from('characters')
        .update({ gold: char.gold + value })
        .eq('id', characterId)

      await supabase
        .from('game_logs')
        .insert({
          account_id: char.account_id,
          character_id: characterId,
          action: 'offline_exploration_claim',
          details: { region: exp.region, discoveries: found, gold: value },
        })
    }

    // Auto-start queued exploration if exists
    const { data: queuedExp } = await supabase
      .from('exploration')
      .select('*')
      .eq('character_id', characterId)
      .eq('is_queued', true)
      .maybeSingle()

    if (queuedExp) {
      const dexSpeed = Math.max(0.5, 1 - char.dexterity * 0.005)
      const { data: queuedRegion } = await supabase
        .from('content_regions')
        .select('exploration_base_time')
        .eq('id', queuedExp.region)
        .single()

      if (queuedRegion) {
        const dur = Math.floor(queuedRegion.exploration_base_time * dexSpeed)
        const finalDur = Math.max(dur, 5)
        const now = new Date()
        const finishAt = new Date(now.getTime() + finalDur * 60 * 1000)

        await supabase
          .from('exploration')
          .update({
            is_queued: false,
            started_at: now.toISOString(),
            finish_at: finishAt.toISOString(),
          })
          .eq('id', queuedExp.id)
      }
    }

    results.push({
      type: 'exploration',
      name: region.name,
      discoveries: found,
      gold: value,
    })
  }

  const newAchievements = await checkAchievements(supabase, char.account_id)

  return {
    professions: results.filter(r => r.type === 'profession'),
    explorations: results.filter(r => r.type === 'exploration'),
    newAchievements,
  }
}

async function addCharacterXp(supabase: any, char: any, amount: number) {
  const newXp = char.xp + amount
  let newLevel = char.level
  let remainingXp = newXp

  while (remainingXp >= XP_FOR_LEVEL(newLevel)) {
    remainingXp -= XP_FOR_LEVEL(newLevel)
    newLevel++
  }

  await supabase
    .from('characters')
    .update({
      level: newLevel,
      xp: remainingXp,
      attribute_points: char.attribute_points + (newLevel - char.level),
    })
    .eq('id', char.id)

  return { leveledUp: newLevel > char.level, newLevel }
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

  const { data: char } = await supabase
    .from('characters')
    .select('*')
    .eq('id', characterId)
    .single()

  if (!char) throw new Error('Character not found')

  const { data: profData } = await supabase
    .from('content_professions')
    .select('*')
    .eq('id', professionId)
    .single()

  if (!profData) throw new Error('Profession data not found')

  const elapsedSeconds = Math.floor((now.getTime() - new Date(prof.started_at!).getTime()) / 1000)

  const dexSpeed = Math.max(0.1, 1 - char.dexterity * 0.01)
  const adjustedTime = Math.floor(profData.base_time_seconds * dexSpeed)

  let actions = Math.floor(elapsedSeconds / adjustedTime)
  const maxActions = Math.floor((24 * 3600) / adjustedTime)
  if (actions > maxActions) actions = maxActions
  if (actions <= 0) throw new Error('No time elapsed')

  const strYield = 1 + char.strength * 0.02
  const xpGained = Math.floor(actions * profData.base_xp_per_action)

  const profXpNeeded = XP_FOR_LEVEL(prof.level)
  const newProfXp = prof.xp + xpGained
  const profLevelUps = Math.floor(newProfXp / profXpNeeded)
  const profRemainingXp = newProfXp % profXpNeeded

  const { data: rewards } = await supabase
    .from('content_profession_rewards')
    .select('*, content_items(*)')
    .eq('profession_id', professionId)
    .lte('min_level', prof.level)

  const items: Record<string, { name: string; qty: number; rarity: string }> = {}
  const quality = rarityQuality(char)

  for (let i = 0; i < actions; i++) {
    if (!rewards || rewards.length === 0) continue

    const weights = rewards.map((r: any) => ({
      item: r.item_id,
      weight: Math.max(1, Math.floor(r.weight * (1 + quality))),
    }))

    const rolled = weightedRoll(weights)
    if (!rolled) continue

    const rewardDef = rewards.find((r: any) => r.item_id === rolled)
    if (!rewardDef) continue

    const baseQty = Math.floor(Math.random() * (rewardDef.max_qty - rewardDef.min_qty + 1)) + rewardDef.min_qty
    const finalQty = Math.max(1, Math.floor(baseQty * strYield))
    if (items[rolled]) {
      items[rolled].qty += finalQty
    } else {
      items[rolled] = {
        name: rewardDef.content_items?.name || rolled,
        qty: finalQty,
        rarity: rewardDef.content_items?.rarity || 'common',
      }
    }
  }

  for (const [itemId, info] of Object.entries(items)) {
    const { data: existing } = await supabase
      .from('storage')
      .select('*')
      .eq('account_id', char.account_id)
      .eq('item_type', 'item')
      .eq('item_id', itemId)
      .single()

    if (existing) {
      await supabase
        .from('storage')
        .update({ quantity: existing.quantity + info.qty })
        .eq('id', existing.id)
    } else {
      await supabase
        .from('storage')
        .insert({ account_id: char.account_id, item_type: 'item', item_id: itemId, quantity: info.qty })
    }
  }

  await supabase
    .from('professions')
    .update({
      level: prof.level + profLevelUps,
      xp: profRemainingXp,
      is_active: false,
      started_at: null,
      finish_at: null,
    })
    .eq('id', prof.id)

  // Check for queued profession in same category and auto-start it
  const queuedCategory = profData?.category
  if (queuedCategory) {
    const { data: queued } = await supabase
      .from('professions')
      .select('*')
      .eq('character_id', characterId)
      .eq('category', queuedCategory)
      .eq('is_queued', true)
      .maybeSingle()

    if (queued) {
      const queueDur = Math.floor(30 * dexSpeed)
      const maxQueueDur = Math.floor(480 * dexSpeed)
      const finalQueueDur = Math.min(queueDur, maxQueueDur)
      const queueNow = new Date()
      const queueFinishAt = new Date(queueNow.getTime() + finalQueueDur * 60 * 1000)

      await supabase
        .from('professions')
        .update({
          is_queued: false,
          is_active: true,
          started_at: queueNow.toISOString(),
          finish_at: queueFinishAt.toISOString(),
        })
        .eq('id', queued.id)

      await supabase.from('game_logs').insert({
        account_id: char.account_id,
        character_id: characterId,
        action: 'auto_start_queued',
        details: { profession: queued.profession, category: queuedCategory },
      })
    }
  }

  // Track counters
  for (const [itemId, info] of Object.entries(items)) {
    const itemName = itemId.toLowerCase()
    if (itemName.includes('stone')) {
      await incrementCounter(supabase, char.account_id, 'mine_stone', (info as any).qty)
    } else if (itemName.includes('wood')) {
      await incrementCounter(supabase, char.account_id, 'chop_wood', (info as any).qty)
    } else if (itemName.includes('fish')) {
      await incrementCounter(supabase, char.account_id, 'catch_fish', (info as any).qty)
    } else if (itemName.includes('crop') || itemName.includes('wheat') || itemName.includes('corn')) {
      await incrementCounter(supabase, char.account_id, 'farm_crops', (info as any).qty)
    }
  }

  const charResult = await addCharacterXp(supabase, char, xpGained)

  await supabase
    .from('game_logs')
    .insert({
      account_id: char.account_id,
      character_id: characterId,
      action: 'claim_profession',
      details: { profession: professionId, actions, xp_gained: xpGained, items_gained: items },
    })

  const newAchievements = await checkAchievements(supabase, char.account_id)

  return { actions, xpGained, levelUps: profLevelUps, items, charLeveledUp: charResult.leveledUp, newCharLevel: charResult.newLevel, newAchievements }
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

  const { data: char } = await supabase
    .from('characters')
    .select('*')
    .eq('id', contract.character_id)
    .single()

  if (!char) throw new Error('Character not found')

  // Daily limit check - read fresh data to avoid race conditions
  const { data: freshChar } = await supabase
    .from('characters')
    .select('contracts_completed_today, contracts_reset_date')
    .eq('id', contract.character_id)
    .single()
  
  const today = new Date().toISOString().slice(0, 10)
  let completedToday = freshChar?.contracts_completed_today ?? char.contracts_completed_today
  let resetDate = freshChar?.contracts_reset_date ?? char.contracts_reset_date

  // Reset counter if a new day
  if (resetDate < today) {
    completedToday = 0
    resetDate = today
  }

  if (completedToday >= 12) {
    throw new Error('Daily contract limit reached (12/12). Come back tomorrow.')
  }

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

  // Level scaling: higher-level characters get better rewards
  const levelScale = 1 + char.level * 0.05
  const chaBonus = 1 + char.charisma * 0.02
  const goldReward = Math.floor(contract.reward_gold * chaBonus * levelScale)
  const kpReward = contract.reward_knowledge > 0
    ? Math.floor(contract.reward_knowledge * (1 + char.intelligence * 0.02) * levelScale)
    : 0

  await supabase
    .from('storage')
    .update({ quantity: storageItem.quantity - contract.requirement_qty })
    .eq('id', storageItem.id)

  await supabase
    .from('characters')
    .update({
      gold: char.gold + goldReward,
      knowledge: char.knowledge + kpReward,
      contracts_completed_today: completedToday + 1,
      contracts_reset_date: resetDate,
    })
    .eq('id', contract.character_id)

  await supabase
    .from('contracts')
    .update({ completed: true })
    .eq('id', contractId)

  await supabase
    .from('game_logs')
    .insert({
      account_id: char.account_id,
      character_id: contract.character_id,
      action: 'complete_contract',
      details: { contract_id: contractId, item: contract.requirement_item, qty: contract.requirement_qty, gold: goldReward, kp: kpReward },
    })

  // Track counters
  await incrementCounter(supabase, char.account_id, 'complete_contract', 1)
  await incrementCounter(supabase, char.account_id, 'earn_gold', goldReward)
  await incrementCounter(supabase, char.account_id, 'spend_gold', contract.requirement_qty * 2) // approximate item value

  const newAchievements = await checkAchievements(supabase, char.account_id)

  const remaining = 12 - (completedToday + 1)

  return {
    gold: goldReward,
    knowledge: kpReward,
    contractsCompletedToday: completedToday + 1,
    contractsRemainingToday: remaining,
    contractsMaxDaily: 12,
    contractsResetDate: resetDate,
    newAchievements,
  }
}
