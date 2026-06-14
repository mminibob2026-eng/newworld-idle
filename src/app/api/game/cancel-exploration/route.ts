import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { explorationId, characterId } = await request.json()
    if (!explorationId || !characterId) {
      return NextResponse.json({ error: 'Missing explorationId or characterId' }, { status: 400 })
    }

    const { data: char } = await supabase
      .from('characters')
      .select('account_id')
      .eq('id', characterId)
      .single()

    if (!char || char.account_id !== user.id) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 })
    }

    const { data: exp } = await supabase
      .from('exploration')
      .select('*')
      .eq('id', explorationId)
      .single()

    if (!exp) return NextResponse.json({ error: 'Exploration not found' }, { status: 404 })
    if (exp.completed) {
      return NextResponse.json({ error: 'Already completed' }, { status: 400 })
    }
    if (exp.is_queued === false && !exp.finish_at) {
      return NextResponse.json({ error: 'No active or queued exploration to cancel' }, { status: 400 })
    }

    const wasActive = !exp.is_queued && exp.finish_at

    // Delete the exploration row
    await supabase
      .from('exploration')
      .delete()
      .eq('id', exp.id)

    // Auto-start queued exploration when cancelling active one
    if (wasActive) {
      const { data: queued } = await supabase
        .from('exploration')
        .select('*')
        .eq('character_id', characterId)
        .eq('is_queued', true)
        .maybeSingle()

      if (!queued) {
        return NextResponse.json({ error: 'No queued exploration found' }, { status: 404 })
      }

      const { data: queuedRegion } = await supabase
        .from('content_regions')
        .select('exploration_base_time')
        .eq('id', queued.region)
        .single()

      if (!queuedRegion) {
        return NextResponse.json({ error: 'Region not found for queued exploration' }, { status: 404 })
      }

      const { data: charData } = await supabase
        .from('characters')
        .select('dexterity')
        .eq('id', characterId)
        .single()

      const dexSpeed = Math.max(0.5, 1 - (charData?.dexterity || 0) * 0.005)
      const dur = Math.floor(queuedRegion.exploration_base_time * dexSpeed)
      const finalDur = Math.max(dur, 5)
      const now = new Date()
      const finishAt = new Date(now.getTime() + finalDur * 60 * 1000)

      const { error: updateError } = await supabase
        .from('exploration')
        .update({
          is_queued: false,
          started_at: now.toISOString(),
          finish_at: finishAt.toISOString(),
        })
        .eq('id', queued.id)

      if (updateError) {
        return NextResponse.json({ error: 'Failed to start queued exploration: ' + updateError.message }, { status: 500 })
      }
    }

    await supabase.from('game_logs').insert({
      account_id: char.account_id,
      character_id: characterId,
      action: 'cancel_exploration',
      details: { region: exp.region, was_queued: exp.is_queued },
    })

    return NextResponse.json({ success: true, exploration: explorationId })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
