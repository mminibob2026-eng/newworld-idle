import { createServerSupabase } from './supabase-server'

export type GameResult = {
  ok: boolean
  error?: string
  data?: any
}

// ---- ENERGY ----

export async function spendEnergy(characterId: string, amount: number): Promise<GameResult> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('spend_energy' as any, {
    p_character_id: characterId,
    p_amount: amount,
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true, data }
}

export async function recoverEnergy(characterId: string): Promise<GameResult> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('recover_energy' as any, {
    p_character_id: characterId,
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true, data }
}

// ---- SKILLS ----

export async function addSkillXP(characterId: string, skillId: string, amount: number): Promise<GameResult> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('add_skill_xp' as any, {
    p_character_id: characterId,
    p_skill_id: skillId,
    p_amount: amount,
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true, data }
}

// ---- DAILY RESET ----

export async function dailyReset(characterId: string): Promise<GameResult> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('daily_reset' as any, {
    p_character_id: characterId,
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true, data }
}

// ---- EDUCATION ----

export async function enrollEducation(characterId: string, stageId: string): Promise<GameResult> {
  const supabase = await createServerSupabase()

  // Check if already enrolled or completed
  const { data: existing } = await (supabase as any)
    .from('character_education')
    .select('*')
    .eq('character_id', characterId)
    .eq('stage_id', stageId)
    .single()

  if (existing) return { ok: false, error: 'Already enrolled or completed' }

  // Get stage data
  const { data: stage } = await (supabase as any)
    .from('education_stages')
    .select('*')
    .eq('id', stageId)
    .single()

  if (!stage) return { ok: false, error: 'Education stage not found' }

  // Check requirements
  const { data: charSkills } = await (supabase as any)
    .from('character_skills')
    .select('skill_id, level')
    .eq('character_id', characterId)

  if (stage.requires_level > 0) {
    const charLevel = charSkills?.find((s: any) => s.skill_id === 'charisma')?.level || 1
    if (charLevel < stage.requires_level) {
      return { ok: false, error: `Requires Charisma Lv${stage.requires_level}` }
    }
  }

  // Enroll
  const { error } = await (supabase as any).from('character_education').insert({
    character_id: characterId,
    stage_id: stageId,
    started_at: new Date().toISOString(),
    progress: 0,
  })

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function progressEducation(characterId: string, amount: number): Promise<GameResult> {
  const supabase = await createServerSupabase()

  // Get active enrollment
  const { data: enrollment } = await (supabase as any)
    .from('character_education')
    .select('*, education_stages(*)')
    .eq('character_id', characterId)
    .eq('status', 'active')
    .single()

  if (!enrollment) return { ok: false, error: 'No active enrollment' }

  const newProgress = Math.min(enrollment.progress + amount, 100)

  if (newProgress >= 100) {
    // Complete the education
    const { error } = await (supabase as any)
      .from('character_education')
      .update({ status: 'completed', progress: 100 })
      .eq('id', enrollment.id)

    if (error) return { ok: false, error: error.message }

    // Add the skill reward
    if (enrollment.education_stages?.skill_reward) {
      await addSkillXP(characterId, enrollment.education_stages.skill_reward, 500)
    }

    return { ok: true, data: { completed: true } }
  }

  const { error } = await (supabase as any)
    .from('character_education')
    .update({ progress: newProgress })
    .eq('id', enrollment.id)

  if (error) return { ok: false, error: error.message }
  return { ok: true, data: { completed: false, progress: newProgress } }
}

// ---- WORK ----

export async function startWorkShift(characterId: string, jobId: string): Promise<GameResult> {
  const supabase = await createServerSupabase()

  // Check if already working
  const { data: activeShift } = await (supabase as any)
    .from('character_jobs')
    .select('*')
    .eq('character_id', characterId)
    .eq('status', 'working')
    .single()

  if (activeShift) return { ok: false, error: 'Already working a shift' }

  // Check if job is unlocked
  const { data: job } = await (supabase as any)
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .single()

  if (!job) return { ok: false, error: 'Job not found' }

  const { data: charJobs } = await (supabase as any)
    .from('character_jobs')
    .select('*')
    .eq('character_id', characterId)
    .eq('job_id', jobId)

  if (charJobs && charJobs.length > 0) {
    // Already have this job, start a shift
    const { error } = await (supabase as any).from('character_jobs').update({
      status: 'working',
      shift_start: new Date().toISOString(),
    }).eq('id', charJobs[0].id)

    if (error) return { ok: false, error: error.message }
  } else {
    // New job - start first shift
    const { error } = await (supabase as any).from('character_jobs').insert({
      character_id: characterId,
      job_id: jobId,
      status: 'working',
      shift_start: new Date().toISOString(),
      days_worked: 0,
    })

    if (error) return { ok: false, error: error.message }
  }

  return { ok: true }
}

export async function finishWorkShift(characterId: string): Promise<GameResult> {
  const supabase = await createServerSupabase()

  const { data: shift } = await (supabase as any)
    .from('character_jobs')
    .select('*, jobs(*)')
    .eq('character_id', characterId)
    .eq('status', 'working')
    .single()

  if (!shift) return { ok: false, error: 'No active shift' }

  // Calculate XP based on job and shift time
  const shiftDuration = Date.now() - new Date(shift.shift_start).getTime()
  const shiftHours = shiftDuration / (1000 * 60 * 60)
  const baseXP = shift.jobs?.base_xp || 10
  const xpEarned = Math.floor(baseXP * Math.min(shiftHours, 8) / 8)

  // Update shift
  const { error } = await (supabase as any).from('character_jobs').update({
    status: 'idle',
    days_worked: shift.days_worked + 1,
    last_worked: new Date().toISOString(),
  }).eq('id', shift.id)

  if (error) return { ok: false, error: error.message }

  // Add XP to the job's skill
  if (shift.jobs?.skill_id) {
    await addSkillXP(characterId, shift.jobs.skill_id, xpEarned)
  }

  return { ok: true, data: { xpEarned, jobId: shift.job_id } }
}

// ---- TRAINING ----

export async function trainSkill(characterId: string, skillId: string): Promise<GameResult> {
  const supabase = await createServerSupabase()

  // Check if already training
  const { data: activeTraining } = await (supabase as any)
    .from('character_training')
    .select('*')
    .eq('character_id', characterId)
    .eq('status', 'training')
    .single()

  if (activeTraining) return { ok: false, error: 'Already training' }

  // Get skill data to determine XP
  const { data: skill } = await (supabase as any)
    .from('skills')
    .select('*')
    .eq('id', skillId)
    .single()

  if (!skill) return { ok: false, error: 'Skill not found' }

  // Start training
  const { error } = await (supabase as any).from('character_training').insert({
    character_id: characterId,
    skill_id: skillId,
    status: 'training',
    started_at: new Date().toISOString(),
  })

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function finishTraining(characterId: string): Promise<GameResult> {
  const supabase = await createServerSupabase()

  const { data: training } = await (supabase as any)
    .from('character_training')
    .select('*')
    .eq('character_id', characterId)
    .eq('status', 'training')
    .single()

  if (!training) return { ok: false, error: 'No active training' }

  // Calculate XP
  const duration = Date.now() - new Date(training.started_at).getTime()
  const minutes = duration / (1000 * 60)
  const xpEarned = Math.floor(minutes * 2) // 2 XP per minute

  // End training
  const { error } = await (supabase as any).from('character_training').update({
    status: 'completed',
    xp_earned: xpEarned,
  }).eq('id', training.id)

  if (error) return { ok: false, error: error.message }

  // Add XP
  await addSkillXP(characterId, training.skill_id, xpEarned)

  return { ok: true, data: { xpEarned, skillId: training.skill_id } }
}

// ---- ADVENTURES ----

export async function startAdventure(characterId: string, adventureId: string): Promise<GameResult> {
  const supabase = await createServerSupabase()

  // Check energy
  const { data: char } = await (supabase as any)
    .from('new_characters')
    .select('energy')
    .eq('id', characterId)
    .single()

  if (!char || char.energy < 10) {
    return { ok: false, error: 'Not enough energy (need 10)' }
  }

  // Spend energy
  const energyResult = await spendEnergy(characterId, 10)
  if (!energyResult.ok) return energyResult

  // Get adventure data
  const { data: adventure } = await (supabase as any)
    .from('adventures')
    .select('*')
    .eq('id', adventureId)
    .single()

  if (!adventure) return { ok: false, error: 'Adventure not found' }

  // Create adventure record
  const { data: adventureRecord, error } = await (supabase as any).from('character_adventures').insert({
    character_id: characterId,
    adventure_id: adventureId,
    status: 'in_progress',
    started_at: new Date().toISOString(),
  }).select().single()

  if (error) return { ok: false, error: error.message }

  return { ok: true, data: { adventureId: adventureRecord.id } }
}

export async function resolveAdventure(characterId: string, recordId: string, choiceIndex: number): Promise<GameResult> {
  const supabase = await createServerSupabase()

  const { data: record } = await (supabase as any)
    .from('character_adventures')
    .select('*, adventures(*)')
    .eq('id', recordId)
    .single()

  if (!record) return { ok: false, error: 'Adventure record not found' }

  const adventure = record.adventures
  if (!adventure) return { ok: false, error: 'Adventure data not found' }

  // Get character origin for event modifiers
  const { data: char } = await (supabase as any)
    .from('new_characters')
    .select('origin_id')
    .eq('id', characterId)
    .single()

  const origin = char?.origin_id || 'middle'

  // Determine outcome based on choices
  const choice = adventure.choices?.[choiceIndex] || adventure.choices?.[0]
  const successChance = choice?.successChance || 50
  const roll = Math.random() * 100
  const success = roll < successChance

  const xpReward = success ? (choice?.xp_reward || 50) : Math.floor((choice?.xp_reward || 50) * 0.3)

  // Origin-based event modifiers
  let bonusGold = 0
  let bonusEvent = null

  if (origin === 'wealthy') {
    // Wealthy families: 30% chance of money from parents during adventure
    if (Math.random() < 0.3) {
      bonusGold = 100 + Math.floor(Math.random() * 200)
      bonusEvent = {
        type: 'family_support',
        description_zh: '你的家人在冒险途中给了你一些钱',
        description_en: 'Your family gave you some money during the adventure',
        gold: bonusGold,
      }
    }
  } else if (origin === 'humble') {
    // Humble families: 15% chance of small help
    if (Math.random() < 0.15) {
      bonusGold = 20 + Math.floor(Math.random() * 30)
      bonusEvent = {
        type: 'family_help',
        description_zh: '你的家人省吃俭用给了你一点钱',
        description_en: 'Your family saved up to give you a little money',
        gold: bonusGold,
      }
    }
  }

  // Apply XP reward
  if (xpReward > 0) {
    await addSkillXP(characterId, adventure.skill_id || 'perception', xpReward)
  }

  // Apply bonus gold
  if (bonusGold > 0) {
    await (supabase as any).from('new_characters').update({
      gold: (char.gold || 0) + bonusGold,
    }).eq('id', characterId)
  }

  // Create outcome
  const outcome = {
    success,
    xp_reward: xpReward,
    bonus_event: bonusEvent,
  }

  // Update record
  const { error } = await (supabase as any).from('character_adventures').update({
    status: success ? 'success' : 'failed',
    outcome: outcome,
    completed_at: new Date().toISOString(),
  }).eq('id', recordId)

  if (error) return { ok: false, error: error.message }

  return { ok: true, data: { outcome, bonusEvent } }
}

// ---- FAMILY: PARTNER ----

export async function findPartner(characterId: string): Promise<GameResult> {
  const supabase = await createServerSupabase()

  // Check if already has partner
  const { data: existing } = await (supabase as any)
    .from('character_partners')
    .select('*')
    .eq('character_id', characterId)
    .eq('status', 'married')
    .single()

  if (existing) return { ok: false, error: 'Already married' }

  // Check energy
  const { data: char } = await (supabase as any)
    .from('new_characters')
    .select('energy, charisma')
    .eq('id', characterId)
    .single()

  if (!char || char.energy < 20) return { ok: false, error: 'Need 20 energy' }

  // Spend energy
  await spendEnergy(characterId, 20)

  // Generate NPC partner
  const { generateNPCName } = await import('./game-data')
  const locale = 'zh'
  const name = generateNPCName(locale)
  const loyalty = 50 + Math.floor(Math.random() * 30)
  const happiness = 60 + Math.floor(Math.random() * 20)

  // Create partner
  const { data: partner, error } = await (supabase as any).from('character_partners').insert({
    character_id: characterId,
    npc_name: name,
    status: 'dating',
    loyalty,
    happiness,
    met_at: new Date().toISOString(),
  }).select().single()

  if (error) return { ok: false, error: error.message }

  return { ok: true, data: { partner } }
}

export async function advanceRelationship(characterId: string, partnerId: string, stage: string): Promise<GameResult> {
  const supabase = await createServerSupabase()

  const { error } = await (supabase as any).from('character_partners').update({
    status: stage,
  }).eq('id', partnerId).eq('character_id', characterId)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

// ---- FAMILY: PARENTS ----

export async function createParents(characterId: string, originId: string): Promise<GameResult> {
  const supabase = await createServerSupabase()

  // Orphans don't have parents
  if (originId === 'orphan') return { ok: true }

  // Check if parents already exist
  const { data: existing } = await (supabase as any)
    .from('character_parents')
    .select('*')
    .eq('character_id', characterId)
    .limit(2)

  if (existing && existing.length > 0) return { ok: true }

  const { generateNPCName, PARENT_OCCUPATIONS, PARENT_PERSONALITIES } = await import('./game-data')

  // Determine wealth tier based on origin
  const wealthTier = originId === 'wealthy' ? 'high' : originId === 'humble' ? 'low' : 'medium'

  // Filter occupations by wealth
  const availableOccupations = PARENT_OCCUPATIONS.filter(o =>
    wealthTier === 'high' ? true :
    wealthTier === 'medium' ? o.wealth !== 'high' :
    o.wealth === 'low'
  )

  // Generate father
  const fatherOcc = availableOccupations[Math.floor(Math.random() * availableOccupations.length)]
  const fatherPersonality = PARENT_PERSONALITIES[Math.floor(Math.random() * PARENT_PERSONALITIES.length)]
  const fatherName = generateNPCName('zh')
  const fatherAge = 25 + Math.floor(Math.random() * 15)

  // Generate mother
  const motherOcc = availableOccupations[Math.floor(Math.random() * availableOccupations.length)]
  const motherPersonality = PARENT_PERSONALITIES[Math.floor(Math.random() * PARENT_PERSONALITIES.length)]
  const motherName = generateNPCName('zh')
  const motherAge = 22 + Math.floor(Math.random() * 12)

  // Create parents
  const { error } = await (supabase as any).from('character_parents').insert([
    {
      character_id: characterId,
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
      character_id: characterId,
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

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function visitParent(characterId: string, parentId: string): Promise<GameResult> {
  const supabase = await createServerSupabase()

  const { data: char } = await (supabase as any)
    .from('new_characters')
    .select('energy')
    .eq('id', characterId)
    .single()

  if (!char || char.energy < 10) return { ok: false, error: 'Need 10 energy' }

  await spendEnergy(characterId, 10)

  const { PARENT_PERSONALITIES } = await import('./game-data')

  const { data: parent } = await (supabase as any)
    .from('character_parents')
    .select('*')
    .eq('id', parentId)
    .single()

  if (!parent) return { ok: false, error: 'Parent not found' }

  const personality = PARENT_PERSONALITIES.find(p => p.id === parent.personality)
  const loyaltyGain = Math.floor(5 + (personality?.helpChance || 0) * 10)
  const happinessGain = Math.floor(3 + Math.random() * 5)

  const { error } = await (supabase as any).from('character_parents').update({
    loyalty: Math.min(100, parent.loyalty + loyaltyGain),
  }).eq('id', parentId)

  if (error) return { ok: false, error: error.message }

  // Random event
  const eventRoll = Math.random()
  let event = null
  if (eventRoll < 0.3) {
    // Parent gives money
    const goldAmount = 50 + Math.floor(Math.random() * 100)
    await (supabase as any).from('new_characters').update({
      gold: (char.gold || 0) + goldAmount,
    }).eq('id', characterId)
    event = { type: 'gift', gold: goldAmount }
  } else if (eventRoll < 0.5) {
    // Parent helps study
    event = { type: 'help', skill: 'intelligence' }
  } else {
    // Just chatting
    event = { type: 'chat' }
  }

  return { ok: true, data: { loyaltyGain, happinessGain, event } }
}

export async function parentHelp(characterId: string, parentId: string): Promise<GameResult> {
  const supabase = await createServerSupabase()

  const { data: char } = await (supabase as any)
    .from('new_characters')
    .select('energy')
    .eq('id', characterId)
    .single()

  if (!char || char.energy < 15) return { ok: false, error: 'Need 15 energy' }

  await spendEnergy(characterId, 15)

  const { PARENT_PERSONALITIES } = await import('./game-data')

  const { data: parent } = await (supabase as any)
    .from('character_parents')
    .select('*')
    .eq('id', parentId)
    .single()

  if (!parent) return { ok: false, error: 'Parent not found' }

  const personality = PARENT_PERSONALITIES.find(p => p.id === parent.personality)
  const helpChance = personality?.helpChance || 0.5

  if (Math.random() < helpChance) {
    // Help succeeded - boost a random skill
    const skills = ['intelligence', 'charisma', 'engineering', 'cooking', 'fitness']
    const randomSkill = skills[Math.floor(Math.random() * skills.length)]
    await addSkillXP(characterId, randomSkill, 300)

    return { ok: true, data: { helped: true, skill: randomSkill } }
  }

  return { ok: true, data: { helped: false } }
}

export async function parentInherit(characterId: string, parentId: string): Promise<GameResult> {
  const supabase = await createServerSupabase()

  const { data: parent } = await (supabase as any)
    .from('character_parents')
    .select('*')
    .eq('id', parentId)
    .single()

  if (!parent) return { ok: false, error: 'Parent not found' }
  if (!parent.alive) return { ok: false, error: 'Parent already passed away' }

  const { PARENT_PERSONALITIES, PARENT_OCCUPATIONS } = await import('./game-data')
  const personality = PARENT_PERSONALITIES.find(p => p.id === parent.personality)
  const occupation = PARENT_OCCUPATIONS.find(o => o.id === parent.occupation)

  const baseInheritance = occupation?.wealth === 'high' ? 500 : occupation?.wealth === 'medium' ? 200 : 50
  const goldAmount = Math.floor(baseInheritance * (personality?.inheritance || 1.0))

  // Mark parent as passed
  const { error } = await (supabase as any).from('character_parents').update({
    alive: false,
  }).eq('id', parentId)

  if (error) return { ok: false, error: error.message }

  // Give inheritance
  const { error: goldErr } = await (supabase as any).from('new_characters').update({
    gold: (parent.gold || 0) + goldAmount,
  }).eq('id', characterId)

  if (goldErr) return { ok: false, error: goldErr.message }

  return { ok: true, data: { gold: goldAmount } }
}

// ---- FAMILY: PET ----

export async function adoptPet(characterId: string, breedId: string, petName: string): Promise<GameResult> {
  const supabase = await createServerSupabase()

  // Check if already has pet
  const { data: existing } = await (supabase as any)
    .from('character_pets')
    .select('*')
    .eq('character_id', characterId)
    .in('status', ['alive', 'young', 'adult'])
    .single()

  if (existing) return { ok: false, error: 'Already have a pet' }

  // Check energy
  const { data: char } = await (supabase as any)
    .from('new_characters')
    .select('energy')
    .eq('id', characterId)
    .single()

  if (!char || char.energy < 15) return { ok: false, error: 'Need 15 energy' }

  await spendEnergy(characterId, 15)

  const { PET_BREEDS } = await import('./game-data')
  const breed = PET_BREEDS.find(b => b.id === breedId)
  if (!breed) return { ok: false, error: 'Invalid breed' }

  const { data: pet, error } = await (supabase as any).from('character_pets').insert({
    character_id: characterId,
    breed_id: breedId,
    name: petName,
    status: 'young',
    happiness: breed.baseStats.happiness,
    loyalty: breed.baseStats.loyalty,
    energy: breed.baseStats.energy,
    adopted_at: new Date().toISOString(),
  }).select().single()

  if (error) return { ok: false, error: error.message }
  return { ok: true, data: { pet } }
}

export async function feedPet(characterId: string, petId: string): Promise<GameResult> {
  const supabase = await createServerSupabase()

  const { data: char } = await (supabase as any)
    .from('new_characters')
    .select('energy')
    .eq('id', characterId)
    .single()

  if (!char || char.energy < 5) return { ok: false, error: 'Need 5 energy' }

  await spendEnergy(characterId, 5)

  const { error } = await (supabase as any).from('character_pets').update({
    happiness: Math.min(100, undefined as any + 15),
    energy: Math.min(100, undefined as any + 10),
  }).eq('id', petId).eq('character_id', characterId)

  if (error) {
    // Fallback: just update
    await (supabase as any).from('character_pets').update({
      happiness: 100,
    }).eq('id', petId)
  }

  return { ok: true }
}

export async function trainPet(characterId: string, petId: string): Promise<GameResult> {
  const supabase = await createServerSupabase()

  const { data: char } = await (supabase as any)
    .from('new_characters')
    .select('energy')
    .eq('id', characterId)
    .single()

  if (!char || char.energy < 10) return { ok: false, error: 'Need 10 energy' }

  await spendEnergy(characterId, 10)

  const { error } = await (supabase as any).from('character_pets').update({
    loyalty: Math.min(100, 50 + 10),
  }).eq('id', petId).eq('character_id', characterId)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

// ---- COMBAT ----

export async function startCombat(characterId: string, enemyId: string): Promise<GameResult> {
  const supabase = await createServerSupabase()

  // Check energy
  const { data: char } = await (supabase as any)
    .from('new_characters')
    .select('energy, strength, dexterity, endurance')
    .eq('id', characterId)
    .single()

  if (!char || char.energy < 15) return { ok: false, error: 'Need 15 energy' }

  await spendEnergy(characterId, 15)

  const { ENEMIES } = await import('./game-data')
  const enemy = ENEMIES.find(e => e.id === enemyId)
  if (!enemy) return { ok: false, error: 'Invalid enemy' }

  // Simple combat calculation
  const playerDamage = Math.max(1, (char.strength || 1) * 2 + Math.floor(Math.random() * 10))
  const enemyDamage = Math.max(1, enemy.attack - (char.endurance || 1))
  const playerWins = playerDamage > enemyDamage || Math.random() > 0.5

  const xpReward = playerWins ? enemy.xpReward : Math.floor(enemy.xpReward * 0.3)
  const goldReward = playerWins ? enemy.goldReward : 0

  // Create combat record
  const { data: record, error } = await (supabase as any).from('character_combat').insert({
    character_id: characterId,
    enemy_id: enemyId,
    player_damage: playerDamage,
    enemy_damage: enemyDamage,
    result: playerWins ? 'victory' : 'defeat',
    xp_earned: xpReward,
    gold_earned: goldReward,
    fought_at: new Date().toISOString(),
  }).select().single()

  if (error) return { ok: false, error: error.message }

  // Add XP if won
  if (playerWins && xpReward > 0) {
    await addSkillXP(characterId, 'striking', xpReward)
  }

  return { ok: true, data: { record, playerDamage, enemyDamage, playerWins, xpReward, goldReward } }
}

// ---- TALENTS ----

export async function revealTalent(characterId: string, talentId: string): Promise<GameResult> {
  const supabase = await createServerSupabase()

  // Check if already revealed
  const { data: existing } = await (supabase as any)
    .from('character_talents')
    .select('*')
    .eq('character_id', characterId)
    .eq('talent_id', talentId)
    .single()

  if (existing) return { ok: false, error: 'Talent already revealed' }

  const { error } = await (supabase as any).from('character_talents').insert({
    character_id: characterId,
    talent_id: talentId,
    revealed_at: new Date().toISOString(),
    active: true,
  })

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

// ---- DAILY RESET (enhanced) ----

export async function dailyResetEnhanced(characterId: string): Promise<GameResult> {
  const supabase = await createServerSupabase()

  // Reset energy to 100
  const { error: energyErr } = await (supabase as any)
    .from('new_characters')
    .update({ energy: 100 })
    .eq('id', characterId)

  if (energyErr) return { ok: false, error: energyErr.message }

  // Reset daily states
  await (supabase as any)
    .from('character_jobs')
    .update({ status: 'idle' })
    .eq('character_id', characterId)
    .eq('status', 'working')

  await (supabase as any)
    .from('character_training')
    .update({ status: 'completed' })
    .eq('character_id', characterId)
    .eq('status', 'training')

  return { ok: true }
}

// ---- OFFLINE ENERGY RECOVERY ----

export async function recoverOfflineEnergy(characterId: string): Promise<GameResult> {
  const supabase = await createServerSupabase()

  const { data: char } = await (supabase as any)
    .from('new_characters')
    .select('energy, last_recovery_at')
    .eq('id', characterId)
    .single()

  if (!char) return { ok: false, error: 'Character not found' }

  const { energyRecoveredSince } = await import('./game-data')
  const recovered = energyRecoveredSince(char.last_recovery_at || new Date().toISOString(), char.energy || 0)

  if (recovered > 0) {
    const newEnergy = Math.min(100, (char.energy || 0) + recovered)
    const { error } = await (supabase as any)
      .from('new_characters')
      .update({ energy: newEnergy, last_recovery_at: new Date().toISOString() })
      .eq('id', characterId)

    if (error) return { ok: false, error: error.message }
    return { ok: true, data: { recovered, newEnergy } }
  }

  return { ok: true, data: { recovered: 0, newEnergy: char.energy } }
}
