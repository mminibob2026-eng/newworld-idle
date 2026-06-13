import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { processOfflineProgress, claimProfessionRewards, completeContract } from '@/lib/game-server'

export async function GET(request: NextRequest) {
  const characterId = request.nextUrl.searchParams.get('character_id')
  if (!characterId) {
    return NextResponse.json({ error: 'Missing character_id' }, { status: 400 })
  }

  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: char } = await supabase
      .from('characters')
      .select('account_id, last_active_at')
      .eq('id', characterId)
      .single()

    if (!char || char.account_id !== user.id) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 })
    }

    const result = await processOfflineProgress(characterId)
    return NextResponse.json({
      ...result,
      _elapsedSeconds: Math.floor((Date.now() - new Date(char.last_active_at || Date.now()).getTime()) / 1000),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
