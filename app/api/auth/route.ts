import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET!

export async function POST(req: NextRequest) {
  const { action, email, password, name, phone, role, shopName, address, landmark, lat, lng, skills } = await req.json()

  if (action === "login") {
    const user = await prisma.user.findFirst({ where: { email } })
    if (!user || !user.passwordHash) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "30d" })
    return NextResponse.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status } })
  }

  if (action === "register") {
    const exists = await prisma.user.findFirst({ where: { email } })
    if (exists) return NextResponse.json({ error: "Email already registered" }, { status: 400 })
    const passwordHash = await bcrypt.hash(password, 10)
    const userRole = role || "customer"
    const user = await prisma.user.create({
      data: {
        email, passwordHash, name: name || shopName || "", phone: phone || "",
        role: userRole, status: userRole === "customer" ? "active" : "pending",
        shopName: shopName || null, address: address || null,
        landmark: landmark || null, lat: lat || null, lng: lng || null,
        skills: skills || [],
      }
    })
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "30d" })
    return NextResponse.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status } })
  }

  // Phone OTP verified by Firebase on client — this upserts the customer and returns a JWT
  if (action === "phone-login") {
    let user = await prisma.user.findFirst({ where: { phone, role: "customer" } })
    if (!user) {
      user = await prisma.user.create({
        data: { phone, name: name || "", role: "customer", status: "active" }
      })
    } else if (name && !user.name) {
      user = await prisma.user.update({ where: { id: user.id }, data: { name } })
    }
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "30d" })
    return NextResponse.json({ token, user: { id: user.id, name: user.name, phone: user.phone, role: user.role, status: user.status } })
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 })
}
