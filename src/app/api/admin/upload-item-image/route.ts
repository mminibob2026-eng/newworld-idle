import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

const DEV_EMAILS = ['dadaleow@gmail.com', 'mminibob2026@gmail.com']

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
    const itemId = formData.get('itemId') as string

    if (!file || !itemId) {
      return NextResponse.json({ error: 'Missing file or itemId' }, { status: 400 })
    }

    const ext = file.name.split('.').pop() || 'png'
    const fileName = `${itemId}.${ext}`

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const dirPath = path.join(process.cwd(), 'public', 'assets', 'items')
    await mkdir(dirPath, { recursive: true })
    const filePath = path.join(dirPath, fileName)
    await writeFile(filePath, buffer)

    const iconPath = `/assets/items/${fileName}`

    const { error } = await supabase
      .from('content_items')
      .update({ icon_path: iconPath })
      .eq('id', itemId)

    if (error) throw error

    return NextResponse.json({ success: true, itemId, iconPath })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
