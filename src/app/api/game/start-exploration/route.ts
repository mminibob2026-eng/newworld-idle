import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { characterId, regionId } = await request.json()
    if (!characterId || !regionId) {
      return NextResponse.json({ error: 'Missing characterId or regionId' }, { status: 400 })
    }

    const { data: char } = await supabase
      .from('characters')
      .select('account_id, endurance')
      .eq('id', characterId)
      .single()

    if (!char || char.account_id !== user.id) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 })
    }

    const { data: existing } = await supabase
      .from('exploration')
      .select('id')
      .eq('character_id', characterId)
      .eq('completed', false)
      .not('finish_at', 'is', null)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Already have an active exploration. Claim it first.' }, { status: 400 })
    }

    const { data: region } = await supabase
      .from('content_regions')
      .select('exploration_base_time')
      .eq('id', regionId)
      .single()

    if (!region) return NextResponse.json({ error: 'Region not found' }, { status: 404 })

    const dur = Math.floor(region.exploration_base_time * (1 - char.endurance * 0.01))
    const finalDur = Math.max(dur, 5)

    const now = new Date()
    const finishAt = new Date(now.getTime() + finalDur * 60 * 1000)

    const { error } = await supabase
      .from('exploration')
      .insert({
        character_id: characterId,
        region: regionId,
        started_at: now.toISOString(),
        finish_at: finishAt.toISOString(),
        completed: false,
      })

    if (error) throw error

    await supabase.from('game_logs').insert({
      account_id: char.account_id,
      character_id: characterId,
      action: 'start_exploration',
      details: { region: regionId, duration: finalDur },
    })

    return NextResponse.json({ startedAt: now.toISOString(), finishAt: finishAt.toISOString(), actualDuration: finalDur })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
