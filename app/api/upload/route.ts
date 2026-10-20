import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]
const ALLOWED_EXTS = ["jpg", "jpeg", "png", "gif", "webp"]
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File
    const folder = (formData.get("folder") as string) || "misc"

    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 })
    if (file.size > MAX_SIZE) return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 })
    if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: "Invalid file type" }, { status: 400 })

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
    if (!ALLOWED_EXTS.includes(ext)) return NextResponse.json({ error: "Invalid file extension" }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const dir = path.join(process.cwd(), "public", "uploads", folder)

    await mkdir(dir, { recursive: true })
    await writeFile(path.join(dir, filename), buffer)

    return NextResponse.json({ url: `/uploads/${folder}/${filename}` })
  } catch { return NextResponse.json({ error: "Upload failed" }, { status: 500 }) }
}
