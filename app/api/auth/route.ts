import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET!

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, email, password, name, phone, role, shopName, address, landmark, lat, lng, skills, partnerType } = body

    if (action === "reset-password") {
      const { phone: resetPhone, newPassword } = body
      if (!resetPhone || !newPassword) return NextResponse.json({ error: "Phone and new password required" }, { status: 400 })
      if (newPassword.length < 6) return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
      const user = await prisma.user.findFirst({ where: { phone: resetPhone } })
      if (!user) return NextResponse.json({ error: "No account found with this phone number" }, { status: 404 })
      const passwordHash = await bcrypt.hash(newPassword, 10)
      await prisma.user.update({ where: { id: user.id }, data: { passwordHash } })
      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "30d" })
      return NextResponse.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status } })
    }

    if (action === "login") {
      if (!email || !password) return NextResponse.json({ error: "Email and password required" }, { status: 400 })
      const user = await prisma.user.findFirst({ where: { email } })
      if (!user || !user.passwordHash) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
      const valid = await bcrypt.compare(password, user.passwordHash)
      if (!valid) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "30d" })
      return NextResponse.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status } })
    }

    if (action === "register") {
      if (!email || !password) return NextResponse.json({ error: "Email and password required" }, { status: 400 })
      if (password.length < 6) return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
      const exists = await prisma.user.findFirst({ where: { email } })
      if (exists) return NextResponse.json({ error: "Email already registered" }, { status: 400 })
      const passwordHash = await bcrypt.hash(password, 10)
      const userRole = role || "customer"

      // Generate unique referral code
      const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase()

      // Resolve referrer if referralCode provided
      const { referralCode: usedCode } = body
      let referrer = null
      if (usedCode) {
        referrer = await prisma.user.findFirst({ where: { referralCode: usedCode.toUpperCase() } })
      }

      const user = await prisma.user.create({
        data: {
          email, passwordHash, name: name || shopName || "", phone: phone || "",
          role: userRole, status: userRole === "customer" ? "active" : "pending",
          shopName: shopName || null, address: address || null,
          landmark: landmark || null, lat: lat || null, lng: lng || null,
          skills: skills || [],
          services: partnerType ? { partnerType } : undefined,
          referralCode,
          referredById: referrer?.id || null,
        }
      })

      // Create pending referral record if referred
      if (referrer && (userRole === "partner" || userRole === "provider")) {
        await prisma.referral.create({
          data: {
            referrerId: referrer.id,
            referrerName: referrer.name,
            referredId: user.id,
            referredName: user.name,
            referredEmail: user.email || "",
            referredPhone: user.phone || "",
            partnerType: partnerType || userRole,
            status: "pending",
          }
        })
      }

      // Notify admin of new partner registration
      if (userRole === "partner" || userRole === "provider") {
        const typeLabel: Record<string, string> = { laundry: "Laundry Shop", food: "Food Restaurant", home_services: "Home Services", rentals: "Tool Rental", vehicles: "Vehicle Rental" }
        await prisma.notification.create({
          data: { recipientType: "admin", title: "New Partner Registration", message: `${name || shopName} registered as ${typeLabel[partnerType] || userRole}${referrer ? ` (referred by ${referrer.name})` : ""}` }
        })
      }
      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "30d" })
      return NextResponse.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status } })
    }

    if (action === "phone-login") {
      if (!phone) return NextResponse.json({ error: "Phone required" }, { status: 400 })
      let user = await prisma.user.findFirst({ where: { phone, role: "customer" } })
      if (!user) {
        user = await prisma.user.create({ data: { phone, name: name || "", role: "customer", status: "active" } })
      } else if (name && !user.name) {
        user = await prisma.user.update({ where: { id: user.id }, data: { name } })
      }
      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "30d" })
      return NextResponse.json({ token, user: { id: user.id, name: user.name, phone: user.phone, role: user.role, status: user.status } })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 })
  }
}
