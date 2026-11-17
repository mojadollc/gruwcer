import { NextRequest, NextResponse } from "next/server"
import sharp from "sharp"
import { uploadToR2 } from "@/lib/storage/r2"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

// Allowed R2 folder paths — keeps the bucket organised
const ALLOWED_FOLDERS = new Set([
  "products",       // grocery product images
  "categories",     // category icons
  "hero",           // hero slider images
  "banners",        // app banners
  "popup",          // popup banners
  "food/logos",     // restaurant logos
  "food/covers",    // restaurant cover photos
  "food/menu",      // food menu item images
  "rentals",        // rental listing images
  "vehicles",       // vehicle listing images
  "partners",       // partner/shop logos
  "providers",      // home-service provider avatars
  "drivers",        // driver selfies / ID photos
  "users",          // customer profile photos
  "misc",           // fallback
])

function sanitizeFolder(raw: string | null): string {
  const f = (raw ?? "misc").trim().toLowerCase().replace(/[^a-z0-9/_-]/g, "")
  return ALLOWED_FOLDERS.has(f) ? f : "misc"
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file = form.get("file") as File | null
    const folder = sanitizeFolder(form.get("folder") as string | null)

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })
    if (!file.size) return NextResponse.json({ error: "Empty file" }, { status: 400 })
    if (file.size > MAX_SIZE) return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 })
    if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: "Invalid file type" }, { status: 400 })

    const raw = Buffer.from(await file.arrayBuffer())
    if (!raw.length) return NextResponse.json({ error: "Empty buffer" }, { status: 400 })

    // Convert to WebP — resize to max 1200×1200, preserve aspect ratio
    const webp = await sharp(raw)
      .rotate()                                                    // auto-orient from EXIF
      .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer()

    // Key: folder/timestamp-randomhex.webp  e.g. food/menu/1720000000000-a3f9b2.webp
    const ts = Date.now()
    const rand = Math.random().toString(36).slice(2, 8)
    const key = `${folder}/${ts}-${rand}.webp`

    const url = await uploadToR2(key, webp, "image/webp")

    console.log(`[upload] ${folder} | ${Math.round(raw.length / 1024)}KB → ${Math.round(webp.length / 1024)}KB | key=${key}`)

    return NextResponse.json({ url, key, folder })
  } catch (err: any) {
    console.error("[upload] error:", err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
