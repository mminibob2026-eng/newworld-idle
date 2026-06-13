import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { characterId } = await request.json()
    if (!characterId) {
      return NextResponse.json({ error: 'Missing characterId' }, { status: 400 })
    }

    const { data: char } = await supabase
      .from('characters')
      .select('account_id, level, gold')
      .eq('id', characterId)
      .single()

    if (!char || char.account_id !== user.id) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 })
    }

    const GENERATE_COST = 25
    if (char.gold < GENERATE_COST) {
      return NextResponse.json({ error: `Need ${GENERATE_COST} gold to generate contracts` }, { status: 400 })
    }

    // Check if already has 3 active non-completed contracts
    const { data: activeContracts } = await supabase
      .from('contracts')
      .select('id')
      .eq('character_id', characterId)
      .eq('completed', false)
      .gte('expires_at', new Date().toISOString())

    if (activeContracts && activeContracts.length >= 3) {
      return NextResponse.json({
        error: 'Already have 3 active contracts. Complete or wait for them to expire first.',
      }, { status: 409 })
    }

    const { data: templates } = await supabase
      .from('content_contracts')
      .select('*')
      .lte('min_level', char.level)

    if (!templates || templates.length === 0) {
      return NextResponse.json({ error: 'No contracts available for your level' }, { status: 400 })
    }

    const shuffled = templates.sort(() => Math.random() - 0.5).slice(0, 3)
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    const levelScale = 1 + char.level * 0.1

    const newContracts = shuffled.map(t => {
      const scaledMin = Math.floor(t.min_qty * levelScale)
      const scaledMax = Math.ceil(t.max_qty * levelScale)
      const qty = Math.floor(Math.random() * (scaledMax - scaledMin + 1)) + scaledMin
      return {
        character_id: characterId,
        contract_type: t.contract_type,
        requirement_item: t.requirement_item,
        requirement_qty: qty,
        reward_gold: Math.floor(qty * t.gold_reward_per_unit * levelScale),
        reward_knowledge: Math.floor(t.knowledge_reward * levelScale),
        faction: t.faction,
        expires_at: expiresAt.toISOString(),
      }
    })

    // Deduct gold
    await supabase
      .from('characters')
      .update({ gold: char.gold - GENERATE_COST })
      .eq('id', characterId)

    const { data, error } = await supabase.from('contracts').insert(newContracts).select()

    if (error) throw error

    await supabase.from('game_logs').insert({
      account_id: char.account_id,
      character_id: characterId,
      action: 'generate_contracts',
      details: { count: newContracts.length, level: char.level },
    })

    return NextResponse.json({ contracts: data ?? [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
