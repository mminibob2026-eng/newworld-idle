import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { completeContract } from '@/lib/game-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { contractId } = await request.json()
    if (!contractId) {
      return NextResponse.json({ error: 'Missing contractId' }, { status: 400 })
    }

    const { data: contract } = await supabase
      .from('contracts')
      .select('*, characters!inner(account_id)')
      .eq('id', contractId)
      .single()

    if (!contract) return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    if (contract.characters.account_id !== user.id) {
      return NextResponse.json({ error: 'Not your contract' }, { status: 403 })
    }

    const result = await completeContract(contractId)
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
