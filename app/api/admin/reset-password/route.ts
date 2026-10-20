import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET!

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { role } = jwt.verify(token, JWT_SECRET) as { role: string }
    if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { email, newPassword } = await req.json()
    if (!email || !newPassword) return NextResponse.json({ error: "Email and newPassword required" }, { status: 400 })
    if (newPassword.length < 6) return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })

    const user = await prisma.user.findFirst({ where: { email } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const passwordHash = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } })
    return NextResponse.json({ success: true, message: `Password updated for ${email}` })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 })
  }
}
