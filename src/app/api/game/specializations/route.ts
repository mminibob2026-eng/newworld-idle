import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: specs } = await (supabase as any)
      .from('content_specializations')
      .select('*')
      .order('primary_attribute')

    return NextResponse.json({ specializations: specs || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { characterId, specializationId } = await request.json()
    if (!characterId || !specializationId) {
      return NextResponse.json({ error: 'Missing characterId or specializationId' }, { status: 400 })
    }

    const { data: char } = await supabase
      .from('characters')
      .select('*')
      .eq('id', characterId)
      .single()

    if (!char || char.account_id !== user.id) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 })
    }

    if (char.level < 10) {
      return NextResponse.json({ error: 'Reach level 10 to unlock specializations' }, { status: 400 })
    }

    if ((char as any).specialization) {
      return NextResponse.json({ error: 'Character already has a specialization' }, { status: 400 })
    }

    await (supabase as any)
      .from('characters')
      .update({
        specialization: specializationId,
        specialization_level: 1,
      })
      .eq('id', characterId)

    await supabase.from('game_logs').insert({
      account_id: user.id,
      character_id: characterId,
      action: 'choose_specialization',
      details: { specialization: specializationId },
    })

    return NextResponse.json({ success: true, specialization: specializationId })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
