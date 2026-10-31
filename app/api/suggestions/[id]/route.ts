import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  if (body.upvote) {
    const s = await prisma.suggestion.update({ where: { id }, data: { upvotes: { increment: 1 } } })
    return NextResponse.json(s)
  }
  const data: Record<string, unknown> = {}
  if (body.status) data.status = body.status
  if (body.adminNote !== undefined) data.adminNote = body.adminNote
  const s = await prisma.suggestion.update({ where: { id }, data })
  return NextResponse.json(s)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.suggestion.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
