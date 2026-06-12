import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { contractId } = await request.json()
    if (!contractId) return NextResponse.json({ error: 'Missing contractId' }, { status: 400 })

    const { data: contract } = await (supabase as any)
      .from('contracts')
      .select('*, characters!inner(account_id, gold)')
      .eq('id', contractId)
      .single()

    if (!contract) return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    if (contract.characters.account_id !== user.id) return NextResponse.json({ error: 'Not your contract' }, { status: 403 })

    const rerollCost = 50 + (contract.reroll_count || 0) * 25
    if (contract.characters.gold < rerollCost) {
      return NextResponse.json({ error: `Need ${rerollCost} gold to re-roll` }, { status: 400 })
    }

    await supabase
      .from('characters')
      .update({ gold: contract.characters.gold - rerollCost })
      .eq('id', contract.character_id)

    const { data: templates } = await supabase
      .from('content_contracts')
      .select('*')

    if (!templates || templates.length === 0) {
      return NextResponse.json({ error: 'No contract templates' }, { status: 500 })
    }

    const template = templates[Math.floor(Math.random() * templates.length)]

    const qty = template.min_qty + Math.floor(Math.random() * (template.max_qty - template.min_qty + 1))
    const goldReward = qty * template.gold_reward_per_unit
    const kpReward = template.knowledge_reward > 0
      ? template.knowledge_reward + Math.floor(Math.random() * template.knowledge_reward)
      : 0

    const now = new Date()
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    await (supabase as any)
      .from('contracts')
      .update({
        contract_type: template.contract_type,
        requirement_item: template.requirement_item,
        requirement_qty: qty,
        reward_gold: goldReward,
        reward_knowledge: kpReward,
        faction: template.faction,
        expires_at: expiresAt.toISOString(),
        reroll_count: (contract.reroll_count || 0) + 1,
      })
      .eq('id', contractId)

    await (supabase as any).from('game_logs').insert({
      account_id: user.id,
      character_id: contract.character_id,
      action: 'reroll_contract',
      details: { contract_id: contractId, cost: rerollCost },
    })

    return NextResponse.json({
      requirement_item: template.requirement_item,
      requirement_qty: qty,
      reward_gold: goldReward,
      reward_knowledge: kpReward,
      reroll_count: (contract.reroll_count || 0) + 1,
      expires_at: expiresAt.toISOString(),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
