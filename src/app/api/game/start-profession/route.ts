import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { characterId, professionId, durationMinutes } = await request.json()
    if (!characterId || !professionId) {
      return NextResponse.json({ error: 'Missing characterId or professionId' }, { status: 400 })
    }

    const { data: char } = await supabase
      .from('characters')
      .select('account_id')
      .eq('id', characterId)
      .single()

    if (!char || char.account_id !== user.id) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 })
    }

    const { data: profData } = await supabase
      .from('content_professions')
      .select('category, name')
      .eq('id', professionId)
      .single()

    if (!profData) return NextResponse.json({ error: 'Profession not found' }, { status: 404 })

    // Check if there's already an active profession in this category
    const { data: activeInCategory } = await supabase
      .from('professions')
      .select('id')
      .eq('character_id', characterId)
      .eq('category', profData.category)
      .eq('is_active', true)
      .maybeSingle()

    if (activeInCategory) {
      // Check if there's already a queued profession in this category
      const { data: queuedInCategory } = await supabase
        .from('professions')
        .select('id')
        .eq('character_id', characterId)
        .eq('category', profData.category)
        .eq('is_queued', true)
        .maybeSingle()

      if (queuedInCategory) {
        return NextResponse.json({
          error: `Already have 1 active + 1 queued in ${profData.category} category. Claim the active one first.`,
        }, { status: 409 })
      }

      // Queue this profession
      const { error: queueError } = await supabase
        .from('professions')
        .update({
          is_queued: true,
          is_active: false,
          started_at: null,
          finish_at: null,
        })
        .eq('character_id', characterId)
        .eq('profession', professionId)

      if (queueError) throw queueError

      const { data: queuedProf } = await supabase
        .from('professions')
        .select('profession')
        .eq('character_id', characterId)
        .eq('profession', professionId)
        .single()

      await supabase.from('game_logs').insert({
        account_id: char.account_id,
        character_id: characterId,
        action: 'queue_profession',
        details: { profession: professionId, category: profData.category },
      })

      return NextResponse.json({
        queued: true,
        profession: professionId,
        category: profData.category,
        message: `${profData.name} is queued. It will auto-start when the current ${profData.category} activity completes.`,
      })
    }

    // No active in category → start normally
    const dur = Math.floor(durationMinutes || 30)
    const maxDur = 480
    const finalDur = Math.min(dur, maxDur)

    const now = new Date()
    const finishAt = new Date(now.getTime() + finalDur * 60 * 1000)

    const { error } = await supabase
      .from('professions')
      .update({
        is_active: true,
        is_queued: false,
        category: profData.category,
        started_at: now.toISOString(),
        finish_at: finishAt.toISOString(),
      })
      .eq('character_id', characterId)
      .eq('profession', professionId)

    if (error) throw error

    await supabase.from('game_logs').insert({
      account_id: char.account_id,
      character_id: characterId,
      action: 'start_profession',
      details: { profession: professionId, category: profData.category, duration: finalDur },
    })

    return NextResponse.json({ startedAt: now.toISOString(), finishAt: finishAt.toISOString(), actualDuration: finalDur })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
