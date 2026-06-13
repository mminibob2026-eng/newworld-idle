import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

const DEV_EMAILS = ['dadaleow@gmail.com', 'mminibob2026@gmail.com']

const TABLE_MAP: Record<string, string> = {
  item: 'content_items',
  region: 'content_regions',
  discovery: 'content_discoveries',
}

const DIR_MAP: Record<string, string> = {
  item: 'items',
  region: 'regions',
  discovery: 'discoveries',
}

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
    const dirName = DIR_MAP[contentType]

    if (!table || !dirName) {
      return NextResponse.json({ error: `Invalid contentType: ${contentType}` }, { status: 400 })
    }

    const ext = file.name.split('.').pop() || 'png'
    const fileName = `${id}.${ext}`

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const dirPath = path.join(process.cwd(), 'public', 'assets', dirName)
    await mkdir(dirPath, { recursive: true })
    const filePath = path.join(dirPath, fileName)
    await writeFile(filePath, buffer)

    const iconPath = `/assets/${dirName}/${fileName}`

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
