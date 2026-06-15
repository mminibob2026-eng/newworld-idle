import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const characterId = request.nextUrl.searchParams.get('character_id')
  if (!characterId) {
    return NextResponse.json({ error: 'Missing character_id' }, { status: 400 })
  }

  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: char } = await supabase
      .from('characters')
      .select('*')
      .eq('id', characterId)
      .single()

    if (!char || char.account_id !== user.id) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 })
    }

    const [profile, professions, explorations, contracts, discoveries, achievements, storage, characterAchievements] = await Promise.all([
      supabase.from('profiles').select('bob_coins').eq('id', user.id).single(),
      supabase.from('professions').select('*').eq('character_id', characterId),
      supabase.from('exploration').select('*').eq('character_id', characterId),
      supabase.from('contracts').select('*').eq('character_id', characterId),
      supabase.from('player_discoveries').select('*, content_discoveries(*)').eq('account_id', user.id),
      (supabase as any).from('player_achievements').select('*').eq('account_id', user.id),
      supabase.from('storage').select('*').eq('account_id', user.id),
      (supabase as any).from('achievement_counters').select('*').eq('account_id', user.id),
    ])

    const contentItems = await (supabase as any)
      .from('content_items')
      .select('id, name, category, rarity, base_value, description')

    const contentRegions = await (supabase as any)
      .from('content_regions')
      .select('id, name, required_level, exploration_base_time, rarity_weights')

    const contentContracts = await (supabase as any)
      .from('content_contracts')
      .select('*')

    const stats = {
      STR: char.strength || 0,
      DEX: char.dexterity || 0,
      INT: char.intelligence || 0,
      END: char.endurance || 0,
      LCK: char.luck || 0,
      CHA: char.charisma || 0,
      attribute_points: char.attribute_points || 0,
    }

    const charAny = char as any
    const resources = {
      gold: char.gold || 0,
      knowledge: char.knowledge || 0,
      xp: char.xp || 0,
      level: char.level || 1,
      bob_coins: profile?.data?.bob_coins || 0,
      region: char.region,
      specialization: charAny.specialization,
      specialization_level: charAny.specialization_level,
    }

    const professionsData = (professions.data || []).map((p: any) => ({
      id: p.id,
      profession: p.profession,
      category: p.category,
      level: p.level,
      xp: p.xp,
      is_active: p.is_active,
      is_queued: p.is_queued,
      started_at: p.started_at,
      finish_at: p.finish_at,
    }))

    const explorationsData = (explorations.data || []).map((e: any) => ({
      id: e.id,
      region: e.region,
      completed: e.completed,
      is_queued: e.is_queued,
      started_at: e.started_at,
      finish_at: e.finish_at,
    }))

    const contractsData = (contracts.data || []).map((c: any) => ({
      id: c.id,
      type: c.type,
      requirement_item: c.requirement_item,
      requirement_qty: c.requirement_qty,
      gold_reward: c.gold_reward,
      knowledge_reward: c.knowledge_reward,
      completed: c.completed,
      expires_at: c.expires_at,
    }))

    const discoveriesData = (discoveries.data || []).map((d: any) => ({
      id: d.id,
      discovered_at: d.discovered_at,
      name: d.content_discoveries?.name,
      rarity: d.content_discoveries?.rarity,
      region: d.content_discoveries?.region,
      lore: d.content_discoveries?.lore,
    }))

    const achievementsData = (achievements.data || []).map((a: any) => ({
      id: a.id,
      achievement_key: a.achievement_key,
      claimed: a.claimed,
      claimed_at: a.claimed_at,
    }))

    const storageData = (storage.data || []).map((s: any) => ({
      id: s.id,
      item_id: s.item_id,
      item_name: contentItems.data?.find((i: any) => i.id === s.item_id)?.name || s.item_id,
      category: contentItems.data?.find((i: any) => i.id === s.item_id)?.category || null,
      rarity: contentItems.data?.find((i: any) => i.id === s.item_id)?.rarity || null,
      quantity: s.quantity,
    }))

    const countersData = (characterAchievements.data || []).map((c: any) => ({
      key: c.key,
      value: c.value,
    }))

    return NextResponse.json({
      character: {
        id: char.id,
        name: char.name,
        created_at: char.created_at,
        last_active_at: char.last_active_at,
      },
      stats,
      resources,
      professions: professionsData,
      explorations: explorationsData,
      contracts: contractsData,
      discoveries: discoveriesData,
      achievements: achievementsData,
      storage: storageData,
      counters: countersData,
      content: {
        items: contentItems.data || [],
        regions: contentRegions.data || [],
        contracts: contentContracts.data || [],
      },
      meta: {
        exported_at: new Date().toISOString(),
        contracts_completed_today: char.contracts_completed_today,
        contracts_reset_date: char.contracts_reset_date,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}