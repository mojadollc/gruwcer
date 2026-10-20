import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const data = await req.json()
    const job = await prisma.serviceJob.update({ where: { id }, data })
    return NextResponse.json(job)
  } catch { return NextResponse.json({ error: "Server error" }, { status: 500 }) }
}
