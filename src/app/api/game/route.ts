import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import {
  spendEnergy,
  recoverEnergy,
  addSkillXP,
  dailyReset,
  dailyResetEnhanced,
  recoverOfflineEnergy,
  enrollEducation,
  progressEducation,
  startWorkShift,
  finishWorkShift,
  trainSkill,
  finishTraining,
  startAdventure,
  resolveAdventure,
  findPartner,
  advanceRelationship,
  createParents,
  visitParent,
  parentHelp,
  parentInherit,
  adoptPet,
  feedPet,
  trainPet,
  startCombat,
  revealTalent,
} from '@/lib/game-server'

async function getAuthUser() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  return profile
}

async function getCharacter(profileId: string) {
  const supabase = await createServerSupabase()
  const { data } = await (supabase as any)
    .from('new_characters')
    .select('*')
    .eq('profile_id', profileId)
    .single()
  return data
}

export async function POST(req: Request) {
  try {
    const profile = await getAuthUser()
    if (!profile) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const char = await getCharacter(profile.id)
    if (!char) return NextResponse.json({ error: 'No character' }, { status: 400 })

    const body = await req.json()
    const { action } = body

    switch (action) {
      // Energy
      case 'spend_energy':
        return NextResponse.json(await spendEnergy(char.id, body.amount))

      case 'recover_energy':
        return NextResponse.json(await recoverEnergy(char.id))

      case 'daily_reset':
        return NextResponse.json(await dailyResetEnhanced(char.id))

      case 'recover_offline':
        return NextResponse.json(await recoverOfflineEnergy(char.id))

      // Education
      case 'enroll_education':
        return NextResponse.json(await enrollEducation(char.id, body.stageId))

      case 'progress_education':
        return NextResponse.json(await progressEducation(char.id, body.amount || 20))

      // Work
      case 'start_work':
        return NextResponse.json(await startWorkShift(char.id, body.jobId))

      case 'finish_work':
        return NextResponse.json(await finishWorkShift(char.id))

      // Training
      case 'start_training':
        return NextResponse.json(await trainSkill(char.id, body.skillId))

      case 'finish_training':
        return NextResponse.json(await finishTraining(char.id))

      // Skills
      case 'add_skill_xp':
        return NextResponse.json(await addSkillXP(char.id, body.skillId, body.amount))

      // Adventures
      case 'start_adventure':
        return NextResponse.json(await startAdventure(char.id, body.adventureId))

      case 'resolve_adventure':
        return NextResponse.json(await resolveAdventure(char.id, body.recordId, body.choiceIndex))

      // Family: Partner
      case 'find_partner':
        return NextResponse.json(await findPartner(char.id))

      case 'advance_relationship':
        return NextResponse.json(await advanceRelationship(char.id, body.partnerId, body.stage))

      // Family: Pet
      case 'adopt_pet':
        return NextResponse.json(await adoptPet(char.id, body.breedId, body.petName))

      case 'feed_pet':
        return NextResponse.json(await feedPet(char.id, body.petId))

      case 'train_pet':
        return NextResponse.json(await trainPet(char.id, body.petId))

      // Combat
      case 'start_combat':
        return NextResponse.json(await startCombat(char.id, body.enemyId))

      // Talents
      case 'reveal_talent':
        return NextResponse.json(await revealTalent(char.id, body.talentId))

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}
