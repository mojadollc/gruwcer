import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const cuisine = req.nextUrl.searchParams.get("cuisine")
    const featured = req.nextUrl.searchParams.get("featured")
    const status = req.nextUrl.searchParams.get("status")
    const where: any = {}
    if (cuisine) where.cuisine = cuisine
    if (featured === "true") where.featured = true
    if (status) where.status = status
    else where.status = "active"
    const restaurants = await prisma.foodRestaurant.findMany({
      where,
      include: { menuItems: { where: { available: true }, orderBy: { category: "asc" } } },
      orderBy: [{ featured: "desc" }, { rating: "desc" }],
    })
    return NextResponse.json(restaurants)
  } catch (e) { console.error(e); return NextResponse.json({ error: "Server error" }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const restaurant = await prisma.foodRestaurant.create({ data })
    await prisma.notification.create({
      data: { recipientType: "admin", title: "New Restaurant Listed 🍽️", message: `${data.name} has been submitted for review.` }
    })
    return NextResponse.json(restaurant)
  } catch (e) { console.error(e); return NextResponse.json({ error: "Server error" }, { status: 500 }) }
}
