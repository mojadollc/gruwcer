import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const ENV_PATH = path.resolve(process.cwd(), ".env")

function parseEnv(content: string): Record<string, string> {
  const result: Record<string, string> = {}
  for (const line of content.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const idx = trimmed.indexOf("=")
    if (idx === -1) continue
    const key = trimmed.slice(0, idx).trim()
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "")
    result[key] = val
  }
  return result
}

function serializeEnv(current: string, updates: Record<string, string>): string {
  const lines = current.split("\n")
  const updated = new Set<string>()

  const result = lines.map((line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) return line
    const idx = trimmed.indexOf("=")
    if (idx === -1) return line
    const key = trimmed.slice(0, idx).trim()
    if (key in updates) {
      updated.add(key)
      const val = updates[key]
      const needsQuotes = val.includes(" ") || val.includes("#")
      return `${key}=${needsQuotes ? `"${val}"` : val}`
    }
    return line
  })

  // Append any new keys not already in the file
  for (const [key, val] of Object.entries(updates)) {
    if (!updated.has(key)) {
      const needsQuotes = val.includes(" ") || val.includes("#")
      result.push(`${key}=${needsQuotes ? `"${val}"` : val}`)
    }
  }

  return result.join("\n")
}

export async function GET() {
  try {
    const content = fs.readFileSync(ENV_PATH, "utf-8")
    return NextResponse.json(parseEnv(content))
  } catch {
    return NextResponse.json({}, { status: 200 })
  }
}

export async function POST(req: Request) {
  try {
    const updates: Record<string, string> = await req.json()
    const current = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, "utf-8") : ""
    const newContent = serializeEnv(current, updates)
    fs.writeFileSync(ENV_PATH, newContent, "utf-8")
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
