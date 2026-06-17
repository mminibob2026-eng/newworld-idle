import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { characterId } = await request.json()
    if (!characterId) {
      return NextResponse.json({ error: 'Missing characterId' }, { status: 400 })
    }

    const { data: char } = await supabase
      .from('characters')
      .select('id, account_id')
      .eq('id', characterId)
      .single()

    if (!char || char.account_id !== user.id) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 })
    }

    const { data: allChars } = await supabase
      .from('characters')
      .select('id')
      .eq('account_id', user.id)

    const isLastCharacter = (allChars?.length || 0) <= 1

    await supabase.from('game_logs').delete().eq('character_id', characterId)
    await supabase.from('research').delete().eq('character_id', characterId)
    await supabase.from('character_inventory').delete().eq('character_id', characterId)
    await supabase.from('contracts').delete().eq('character_id', characterId)
    await supabase.from('exploration').delete().eq('character_id', characterId)
    await supabase.from('professions').delete().eq('character_id', characterId)
    await supabase.from('characters').delete().eq('id', characterId)

    if (isLastCharacter) {
      await supabase.from('storage').delete().eq('account_id', user.id)
      await supabase.from('player_discoveries').delete().eq('account_id', user.id)
      await (supabase as any).from('player_achievements').delete().eq('account_id', user.id)
      await (supabase as any).from('achievement_counters').delete().eq('account_id', user.id)
    }

    return NextResponse.json({ success: true, deletedCharacterId: characterId, wasLastCharacter: isLastCharacter })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
