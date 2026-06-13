import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { explorationId } = await request.json()
    if (!explorationId) {
      return NextResponse.json({ error: 'Missing explorationId' }, { status: 400 })
    }

    const { data: exp } = await supabase
      .from('exploration')
      .select('*, characters!inner(account_id, *), content_regions(*)')
      .eq('id', explorationId)
      .single()

    if (!exp) return NextResponse.json({ error: 'Exploration not found' }, { status: 404 })
    if (exp.characters.account_id !== user.id) return NextResponse.json({ error: 'Not your exploration' }, { status: 403 })
    if (exp.completed) return NextResponse.json({ error: 'Already completed' }, { status: 400 })
    if (new Date(exp.finish_at) > new Date()) return NextResponse.json({ error: 'Still exploring' }, { status: 400 })

    const char = exp.characters
    const intBonus = 1 + char.intelligence * 0.02
    const lckMult = 1 + char.luck * 0.01
    const rollCount = Math.floor(3 * intBonus)

    const { data: discoveries } = await supabase
      .from('content_region_discoveries')
      .select('*, content_discoveries(*)')
      .eq('region_id', exp.region)

    const found: any[] = []
    if (discoveries) {
      const totalWeight = discoveries.reduce((sum, d: any) => sum + d.weight, 0)
      if (totalWeight > 0) {
        for (let i = 0; i < rollCount; i++) {
          const hitChance = clamp(0.4 * lckMult, 0.1, 0.9)
          if (Math.random() > hitChance) continue

          let roll = Math.floor(Math.random() * totalWeight)
          for (const disc of discoveries) {
            roll -= (disc as any).weight
            if (roll < 0) {
              found.push((disc as any).content_discoveries)
              break
            }
          }
        }
      }
    }

    const value = found.reduce((sum: number, d: any) => sum + (d.base_value || 0), 0)

    await supabase
      .from('exploration')
      .update({ completed: true, discoveries: found })
      .eq('id', explorationId)

    // Check for queued exploration and auto-start it
    const { data: queuedExp } = await supabase
      .from('exploration')
      .select('*')
      .eq('character_id', exp.character_id)
      .eq('is_queued', true)
      .maybeSingle()

    let autoStarted: any = null
    if (queuedExp) {
      const dexSpeed = Math.max(0.5, 1 - char.dexterity * 0.005)
      const { data: queuedRegion } = await supabase
        .from('content_regions')
        .select('exploration_base_time')
        .eq('id', queuedExp.region)
        .single()

      if (queuedRegion) {
        const dur = Math.floor(queuedRegion.exploration_base_time * dexSpeed)
        const finalDur = Math.max(dur, 5)
        const now = new Date()
        const finishAt = new Date(now.getTime() + finalDur * 60 * 1000)

        await supabase
          .from('exploration')
          .update({
            is_queued: false,
            started_at: now.toISOString(),
            finish_at: finishAt.toISOString(),
          })
          .eq('id', queuedExp.id)

        autoStarted = { region: queuedExp.region, finishAt: finishAt.toISOString() }
      }
    }

    if (value > 0) {
      await supabase
        .from('characters')
        .update({ gold: char.gold + value })
        .eq('id', exp.character_id)
    }

    for (const d of found) {
      await supabase
        .from('player_discoveries')
        .insert({
          account_id: char.account_id,
          discovery_id: d.id,
          region_id: exp.region,
          lore: d.lore || '',
        })
        .select()
        .maybeSingle()
    }

    await supabase.from('game_logs').insert({
      account_id: char.account_id,
      character_id: exp.character_id,
      action: 'claim_exploration',
      details: { region: exp.region, discoveries: found, gold: value },
    })

    return NextResponse.json({ discoveries: found, gold: value, autoStarted })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
