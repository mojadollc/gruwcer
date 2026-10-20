import { NextResponse } from "next/server"

const POS_BASE = "https://pos.payroo.xyz"
const STORE_ID = "8807"

function fixImageUrl(url: string | null | undefined): string {
  if (!url) return ""
  if (url.startsWith("data:") || url.startsWith("http")) return url
  return `${POS_BASE}${url}`
}

export async function GET() {
  try {
    const res = await fetch(`${POS_BASE}/api/products?storeId=${STORE_ID}`, {
      next: { revalidate: 300 },
    })
    if (!res.ok) throw new Error(`POS API error: ${res.status}`)
    const json = await res.json()
    const products = (json.data || []).map((p: any) => ({
      ...p,
      imageUrl: fixImageUrl(p.imageUrl),
      category: p.category === "School Supply" ? "Office & School Supply" : p.category === "Office Supply" ? "Office & School Supply" : p.category,
    }))
    return NextResponse.json(products)
  } catch (e: any) {
    return NextResponse.json([], { status: 503 })
  }
}
