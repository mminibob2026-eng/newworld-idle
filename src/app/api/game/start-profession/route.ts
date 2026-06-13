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

    const { data: activeProfs } = await supabase
      .from('professions')
      .select('profession')
      .eq('character_id', characterId)
      .eq('is_active', true)

    if (activeProfs && activeProfs.length > 0) {
      const activeIds = activeProfs.map((p: any) => p.profession)
      const { data: cats } = await supabase
        .from('content_professions')
        .select('category')
        .in('id', activeIds)
      if (cats && cats.some((c: any) => c.category === profData.category)) {
        return NextResponse.json({ error: `Already have an active ${profData.category} activity. Claim it first.` }, { status: 400 })
      }
    }

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
