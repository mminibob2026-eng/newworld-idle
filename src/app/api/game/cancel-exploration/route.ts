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
    if (!exp.is_queued && !exp.finish_at) {
      return NextResponse.json({ error: 'No active or queued exploration to cancel' }, { status: 400 })
    }

    await supabase
      .from('exploration')
      .update({
        completed: true,
        is_queued: false,
        started_at: undefined as any,
        finish_at: undefined as any,
      })
      .eq('id', exp.id)

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
