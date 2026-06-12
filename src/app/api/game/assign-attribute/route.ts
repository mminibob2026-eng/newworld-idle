import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { characterId, attribute } = await request.json()
    const validAttrs = ['strength', 'dexterity', 'intelligence', 'endurance', 'luck', 'charisma']
    if (!characterId || !attribute || !validAttrs.includes(attribute)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const { data: char } = await supabase
      .from('characters')
      .select('account_id, attribute_points, strength, dexterity, intelligence, endurance, luck, charisma')
      .eq('id', characterId)
      .single()

    if (!char || char.account_id !== user.id) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 })
    }

    if (char.attribute_points <= 0) {
      return NextResponse.json({ error: 'No attribute points available' }, { status: 400 })
    }

    const { error } = await (supabase as any)
      .from('characters')
      .update({
        [attribute]: (char as any)[attribute] + 1,
        attribute_points: char.attribute_points - 1,
      })
      .eq('id', characterId)

    if (error) throw error

    return NextResponse.json({ success: true, attribute })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
