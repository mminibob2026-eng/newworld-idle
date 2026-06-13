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
      .select('account_id, endurance')
      .eq('id', characterId)
      .single()

    if (!char || char.account_id !== user.id) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 })
    }

    const { data: profData } = await supabase
      .from('content_professions')
      .select('category')
      .eq('id', professionId)
      .single()

    if (!profData) return NextResponse.json({ error: 'Profession not found' }, { status: 404 })

    const endBonus = 1 + char.endurance * 0.05
    const dur = Math.floor((durationMinutes || 30) * endBonus)
    const maxDur = Math.floor(480 * endBonus)
    const finalDur = Math.min(dur, maxDur)

    const now = new Date()
    const finishAt = new Date(now.getTime() + finalDur * 60 * 1000)

    const { error } = await supabase
      .from('professions')
      .update({
        is_active: true,
        category: profData.category,
        started_at: now.toISOString(),
        finish_at: finishAt.toISOString(),
      })
      .eq('character_id', characterId)
      .eq('profession', professionId)

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({
          error: `Already have an active ${profData.category} activity. Claim it first.`,
        }, { status: 409 })
      }
      throw error
    }

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
