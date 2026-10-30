import { NextRequest, NextResponse } from "next/server"
import sharp from "sharp"
import { uploadToR2 } from "@/lib/storage/r2"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file = form.get("file") as File | null
    const folder = (form.get("folder") as string | null)?.trim() || "misc"

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })
    if (!file.size) return NextResponse.json({ error: "Empty file" }, { status: 400 })
    if (file.size > MAX_SIZE) return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 })
    if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: "Invalid file type" }, { status: 400 })

    const raw = Buffer.from(await file.arrayBuffer())
    if (!raw.length) return NextResponse.json({ error: "Empty buffer" }, { status: 400 })

    // Convert to WebP — same settings as dashpos
    const webp = await sharp(raw)
      .rotate()
      .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer()

    const key = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`
    const url = await uploadToR2(key, webp, "image/webp")

    console.log(`[upload] ${Math.round(raw.length / 1024)}KB → ${Math.round(webp.length / 1024)}KB WebP → R2 key=${key}`)

    return NextResponse.json({ url })
  } catch (err: any) {
    console.error("[upload] error:", err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
