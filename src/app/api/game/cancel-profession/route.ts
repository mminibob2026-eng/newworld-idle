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
      .select('account_id, dexterity')
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

    const wasActive = prof.is_active
    const profCategory = prof.category

    await supabase
      .from('professions')
      .update({
        is_active: false,
        is_queued: false,
        started_at: null,
        finish_at: null,
      })
      .eq('id', prof.id)

    // If we canceled an active profession, auto-start the queued one in same category
    if (wasActive && profCategory) {
      const { data: queued } = await supabase
        .from('professions')
        .select('*')
        .eq('character_id', characterId)
        .eq('category', profCategory)
        .eq('is_queued', true)
        .maybeSingle()

      if (queued) {
        const now = new Date()
        const finishAt = new Date(now.getTime() + 30 * 60 * 1000)
        await supabase
          .from('professions')
          .update({
            is_queued: false,
            is_active: true,
            started_at: now.toISOString(),
            finish_at: finishAt.toISOString(),
          })
          .eq('id', queued.id)
      }
    }

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