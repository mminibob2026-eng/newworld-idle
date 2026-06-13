import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { achievementId } = await request.json()
    if (!achievementId) {
      return NextResponse.json({ error: 'Missing achievementId' }, { status: 400 })
    }

    const { data: ach } = await (supabase as any)
      .from('content_achievements')
      .select('*')
      .eq('id', achievementId)
      .single()

    if (!ach) return NextResponse.json({ error: 'Achievement not found' }, { status: 404 })

    const { data: playerAch } = await (supabase as any)
      .from('player_achievements')
      .select('*')
      .eq('account_id', user.id)
      .eq('achievement_id', achievementId)
      .single()

    if (!playerAch || !playerAch.completed_at) {
      return NextResponse.json({ error: 'Achievement not completed' }, { status: 400 })
    }

    if (playerAch.claimed_at) {
      return NextResponse.json({ error: 'Already claimed' }, { status: 400 })
    }

    // Claim rewards
    const { data: account } = await (supabase as any)
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (account) {
      await (supabase as any)
        .from('profiles')
        .update({
          bob_coins: (account.bob_coins || 0) + ach.reward_bob_coins,
        })
        .eq('id', user.id)
    }

    // Award gold and knowledge to the user's primary character
    if (ach.reward_gold > 0 || ach.reward_knowledge > 0) {
      const { data: chars } = await supabase
        .from('characters')
        .select('id, gold, knowledge')
        .eq('account_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)

      if (chars && chars.length > 0) {
        const char = chars[0]
        const updates: any = {}
        if (ach.reward_gold > 0) updates.gold = (char.gold || 0) + ach.reward_gold
        if (ach.reward_knowledge > 0) updates.knowledge = (char.knowledge || 0) + ach.reward_knowledge
        if (Object.keys(updates).length > 0) {
          await supabase.from('characters').update(updates).eq('id', char.id)
        }
      }
    }

    // Mark as claimed
    await (supabase as any)
      .from('player_achievements')
      .update({ claimed_at: new Date().toISOString() })
      .eq('id', playerAch.id)

    return NextResponse.json({
      success: true,
      rewards: {
        title: ach.reward_title,
        bob_coins: ach.reward_bob_coins,
        gold: ach.reward_gold,
        knowledge: ach.reward_knowledge,
        bonus: ach.reward_permanent_bonus,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
