import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { professionId, characterId } = await request.json()
    if (!professionId || !characterId) {
      return NextResponse.json({ error: 'Missing professionId or characterId' }, { status: 400 })
    }

    const { data: char } = await supabase
      .from('characters')
      .select('account_id')
      .eq('id', characterId)
      .single()

    if (!char || char.account_id !== user.id) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 })
    }

    const { data: prof } = await supabase
      .from('professions')
      .select('*')
      .eq('character_id', characterId)
      .eq('profession', professionId)
      .single()

    if (!prof) return NextResponse.json({ error: 'Profession not found' }, { status: 404 })
    if (!prof.is_active && !prof.is_queued) {
      return NextResponse.json({ error: 'No active or queued session to cancel' }, { status: 400 })
    }

    await supabase
      .from('professions')
      .update({
        is_active: false,
        is_queued: false,
        started_at: null,
        finish_at: null,
      })
      .eq('id', prof.id)

    await supabase.from('game_logs').insert({
      account_id: char.account_id,
      character_id: characterId,
      action: 'cancel_profession',
      details: { profession: professionId, was_active: prof.is_active, was_queued: prof.is_queued },
    })

    return NextResponse.json({ success: true, profession: professionId })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
