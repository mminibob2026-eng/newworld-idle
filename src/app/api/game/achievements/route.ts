import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: achievements } = await (supabase as any)
      .from('content_achievements')
      .select('*')
      .order('sort_order')

    const { data: playerAchs } = await (supabase as any)
      .from('player_achievements')
      .select('*')
      .eq('account_id', user.id)

    const { data: counters } = await (supabase as any)
      .from('achievement_counters')
      .select('*')
      .eq('account_id', user.id)

    const playerMap = Object.fromEntries((playerAchs || []).map((pa: any) => [pa.achievement_id, pa]))
    const counterMap = Object.fromEntries((counters || []).map((c: any) => [c.counter_key, c.value]))

    return NextResponse.json({
      achievements: achievements || [],
      playerAchievements: playerMap,
      counters: counterMap,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
