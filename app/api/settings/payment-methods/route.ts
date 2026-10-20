import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const settings = await prisma.appSettings.findUnique({ where: { key: "paymentMethods" } })
    if (!settings) return NextResponse.json({ cod: true, wallet: true, qrph: true, ewallet: true, bank: true, xendit: true })
    return NextResponse.json({ cod: settings.codEnabled, wallet: settings.walletEnabled, qrph: settings.qrphEnabled, ewallet: settings.ewalletEnabled, bank: settings.bankEnabled, xendit: settings.xenditEnabled })
  } catch {
    return NextResponse.json({ cod: true, wallet: true, qrph: true, ewallet: true, bank: true, xendit: true }, { status: 503 })
  }
}

export async function POST(req: Request) {
  const data = await req.json()
  const settings = await prisma.appSettings.upsert({
    where: { key: "paymentMethods" },
    update: {
      codEnabled: data.cod,
      walletEnabled: data.wallet,
      qrphEnabled: data.qrph,
      ewalletEnabled: data.ewallet,
      bankEnabled: data.bank,
      xenditEnabled: data.xendit,
    },
    create: {
      key: "paymentMethods",
      codEnabled: data.cod ?? true,
      walletEnabled: data.wallet ?? true,
      qrphEnabled: data.qrph ?? true,
      ewalletEnabled: data.ewallet ?? true,
      bankEnabled: data.bank ?? true,
      xenditEnabled: data.xendit ?? true,
    },
  })
  return NextResponse.json(settings)
}
