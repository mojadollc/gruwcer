import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const r = await prisma.foodRestaurant.findUnique({
      where: { id },
      include: { menuItems: { orderBy: [{ category: "asc" }, { name: "asc" }] } },
    })
    if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(r)
  } catch (e) { return NextResponse.json({ error: "Server error" }, { status: 500 }) }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const data = await req.json()
    // Handle menu item upsert
    if (data.menuItem) {
      const { menuItem } = data
      if (menuItem.id) {
        const item = await prisma.foodMenuItem.update({ where: { id: menuItem.id }, data: menuItem })
        return NextResponse.json(item)
      } else {
        const item = await prisma.foodMenuItem.create({ data: { ...menuItem, restaurantId: id } })
        return NextResponse.json(item)
      }
    }
    if (data.deleteMenuItemId) {
      await prisma.foodMenuItem.delete({ where: { id: data.deleteMenuItemId } })
      return NextResponse.json({ ok: true })
    }
    const r = await prisma.foodRestaurant.update({ where: { id }, data })
    return NextResponse.json(r)
  } catch (e) { console.error(e); return NextResponse.json({ error: "Server error" }, { status: 500 }) }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.foodRestaurant.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) { return NextResponse.json({ error: "Server error" }, { status: 500 }) }
}
