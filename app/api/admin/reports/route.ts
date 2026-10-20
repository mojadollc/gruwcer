import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET!

function requireAdmin(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "")
  if (!token) return false
  try { const { role } = jwt.verify(token, JWT_SECRET) as { role: string }; return role === "admin" }
  catch { return false }
}

export async function GET(req: NextRequest) {
  try {
    if (!requireAdmin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    const reports = await prisma.report.findMany({ orderBy: { createdAt: "desc" } })
    return NextResponse.json(reports)
  } catch { return NextResponse.json({ error: "Server error" }, { status: 500 }) }
}

export async function PATCH(req: NextRequest) {
  try {
    if (!requireAdmin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    const { id, status } = await req.json()
    const report = await prisma.report.update({ where: { id }, data: { status } })
    return NextResponse.json(report)
  } catch { return NextResponse.json({ error: "Server error" }, { status: 500 }) }
}
