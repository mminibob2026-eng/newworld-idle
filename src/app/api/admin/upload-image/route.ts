import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

const DEV_EMAILS = ['dadaleow@gmail.com', 'mminibob2026@gmail.com']

const TABLE_MAP: Record<string, string> = {
  item: 'content_items',
  region: 'content_regions',
  discovery: 'content_discoveries',
  profession: 'content_professions',
}

const BUCKET = 'game-assets'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!DEV_EMAILS.includes(user.email || '')) {
      return NextResponse.json({ error: 'Not authorized. Dev accounts only.' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const contentType = formData.get('contentType') as string
    const id = formData.get('id') as string

    if (!file || !contentType || !id) {
      return NextResponse.json({ error: 'Missing file, contentType, or id' }, { status: 400 })
    }

    const table = TABLE_MAP[contentType]
    if (!table) {
      return NextResponse.json({ error: `Invalid contentType: ${contentType}` }, { status: 400 })
    }

    const ext = file.name.split('.').pop() || 'png'
    const filePath = `${contentType}s/${id}.${ext}`

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, buffer, {
        contentType: file.type || 'image/png',
        upsert: true,
      })

    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(filePath)

    const iconPath = urlData?.publicUrl || ''

    const { error } = await (supabase as any)
      .from(table)
      .update({ icon_path: iconPath })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true, id, contentType, iconPath })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
