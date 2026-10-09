import { prisma } from "./prisma"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"


const JWT_SECRET = process.env.JWT_SECRET || "88seven_jwt_secret"

// ═══ TYPES ═══

export interface Product {
  id: string
  name: string
  price: number
  cost: number
  stock: number
  category: string
  imageUrl?: string
  description?: string
  unit?: string
  onSale?: boolean
  salePrice?: number
  showOnSite?: boolean
  bottleDeposit?: number
}

export interface HeroSlide {
  id: string
  badge: string
  title: string
  highlight: string
  description: string
  imageUrl: string
  bgColor: string
  link?: string
  order: number
  enabled: boolean
}

export interface SiteSettings {
  logoUrl: string
  logoText: string
}

export interface PopupBanner {
  id: string
  imageUrl: string
  linkUrl?: string
  enabled: boolean
}

export interface ServiceFeeConfig {
  baseFare: number
  baseKm: number
  perKmRate: number
  surgeMultiplier: number
  surgeEnabled: boolean
}

export interface DeliverySettings {
  storeLat: number
  storeLng: number
  riderFeePerDelivery: number
  riderCommissionPercent: number
  partnerCommissionPercent: number
  freeDeliveryMinOrder: number
  freeDeliveryArea: string
  grocery: ServiceFeeConfig
  laundry: ServiceFeeConfig
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface OrderItem {
  productId: string
  name: string
  price: number
  quantity: number
  imageUrl?: string
  outOfStock?: boolean
}

export type OrderStatus =
  | "pending" | "confirmed" | "preparing" | "ready_for_pickup"
  | "rider_accepted" | "rider_at_store" | "rider_picked_up"
  | "out_for_delivery" | "delivered" | "cancelled" | "rejected"

export interface Order {
  id: string
  items: OrderItem[]
  total: number
  customerId?: string
  customerName: string
  customerPhone: string
  deliveryAddress: string
  deliveryLat?: number
  deliveryLng?: number
  status: OrderStatus
  paymentMethod?: string
  driverId?: string
  driverName?: string
  driverLat?: number
  driverLng?: number
  createdAt: Date | null
  updatedAt: Date | null
  confirmedAt?: Date | null
  preparingAt?: Date | null
  readyAt?: Date | null
  pickedUpAt?: Date | null
  deliveredAt?: Date | null
  estimatedDeliveryMinutes?: number
  notes?: string
  riderRating?: number
  storeRating?: number
  review?: string
}

export interface Driver {
  id: string
  name: string
  email: string
  phone: string
  status: "active" | "inactive" | "pending"
  isOnline?: boolean
  lat?: number
  lng?: number
  profileComplete?: boolean
  selfieUrl?: string
  nbiUrl?: string
  vehicleUrl?: string
  vehicleType?: string
  plateNumber?: string
  walletBalance?: number
  createdAt?: Date | null
}

export interface LaundryPartner {
  id: string
  uid?: string
  shopName: string
  name: string
  ownerName?: string // alias for name
  email: string
  phone: string
  address: string
  landmark?: string
  lat?: number
  lng?: number
  logoUrl?: string
  isOnline?: boolean
  openTime?: string
  closeTime?: string
  openDays?: string[]
  status: "pending" | "active" | "inactive"
  services?: { id: string; name: string; price: number; unit: string }[]
  walletBalance?: number
  listingMode?: "free" | "wallet_required"
  minimumBalance?: number
  createdAt?: Date | null
}

export interface HomeServiceProvider {
  id: string
  uid?: string
  shopName: string
  name: string
  ownerName?: string // alias for name
  email: string
  phone: string
  address: string
  landmark?: string
  lat?: number
  lng?: number
  logoUrl?: string
  isOnline?: boolean
  openTime?: string
  closeTime?: string
  openDays?: string[]
  status: "pending" | "active" | "inactive"
  skills?: string[]
  services?: { id: string; name: string; price: number; unit: string }[]
  walletBalance?: number
  listingMode?: "free" | "wallet_required"
  minimumBalance?: number
  rating?: number
  completedJobs?: number
  createdAt?: Date | null
}

export interface CustomerProfile {
  id: string
  uid?: string // alias for id, for backward compat
  name: string
  phone: string
  email: string
  address?: string
  savedAddresses?: SavedAddress[]
  walletBalance?: number
  createdAt?: Date | null
}

export interface SavedAddress {
  id: string
  label: string
  address: string
  lat: number
  lng: number
}

export interface AppNotification {
  id: string
  recipientType: "admin" | "driver" | "customer" | "partner" | "provider"
  recipientId?: string
  title: string
  message: string
  orderId?: string
  read: boolean
  createdAt: Date | null
}

export interface ChatMessage {
  id: string
  orderId: string
  senderId: string
  senderName: string
  senderRole: "customer" | "driver" | "admin"
  message: string
  createdAt: Date | null
}

export interface Report {
  id: string
  orderId?: string
  customerId: string
  customerName: string
  customerEmail: string
  type: "rider" | "order" | "product" | "other"
  subject: string
  description: string
  status: "pending" | "reviewed" | "resolved"
  createdAt: Date | null
}

export interface WalletTransaction {
  id: string
  ownerId: string
  ownerType: "rider" | "partner" | "customer" | "provider"
  type: "topup" | "deduction" | "earning" | "commission" | "commission_deduction" | "bonus"
  amount: number
  transactionId?: string
  orderId?: string
  jobId?: string
  note?: string
  status: string
  createdAt: Date | null
  // legacy aliases
  driverId?: string
  customerId?: string
  partnerId?: string
}

export interface ListingModeConfig {
  defaultMode: "free" | "wallet_required"
  defaultMinBalance: number
}

export type PaymentMethodsConfig = {
  cod: boolean
  wallet: boolean
  qrph: boolean
  ewallet: boolean
  bank: boolean
  xendit: boolean
}

export interface ServiceJob {
  id: string
  customerId: string
  customerName: string
  customerPhone: string
  providerId?: string
  providerName?: string
  serviceName: string
  description: string
  address: string
  lat?: number
  lng?: number
  scheduledDate: string
  scheduledTime: string
  estimatedDuration: string
  budget?: number
  status: "pending" | "accepted" | "in_progress" | "completed" | "cancelled"
  rating?: number
  review?: string
  createdAt?: Date | null
  updatedAt?: Date | null
}

export interface Category {
  id: string
  name: string
  imageUrl?: string
  emoji?: string
  order?: number
  unit?: string
  salePrice?: number
}

// ═══ AUTH HELPERS ═══

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

export function signToken(payload: { id: string; role: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" })
}

export function verifyToken(token: string): { id: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; role: string }
  } catch {
    return null
  }
}

// ═══ PRODUCTS ═══

export async function getProducts(): Promise<Product[]> {
  const rows = await prisma.product.findMany({ where: { showOnSite: true } })
  return rows as Product[]
}

export async function getAllProducts(): Promise<Product[]> {
  return prisma.product.findMany() as Promise<Product[]>
}

export async function toggleProductVisibility(productId: string, show: boolean) {
  await prisma.product.update({ where: { id: productId }, data: { showOnSite: show } })
}

export async function getCategories(): Promise<string[]> {
  const rows = await prisma.product.findMany({ where: { showOnSite: true }, select: { category: true } })
  const cats = new Set(rows.map((r) => r.category).filter(Boolean) as string[])
  return Array.from(cats).sort()
}

export async function createProduct(data: Omit<Product, "id">) {
  return prisma.product.create({ data })
}

export async function updateProduct(id: string, data: Partial<Omit<Product, "id">>) {
  return prisma.product.update({ where: { id }, data })
}

export async function deleteProduct(id: string) {
  return prisma.product.delete({ where: { id } })
}

// ═══ HERO SLIDES ═══

export async function getHeroSlides(): Promise<HeroSlide[]> {
  return prisma.heroSlide.findMany({ where: { enabled: true }, orderBy: { order: "asc" } }) as Promise<HeroSlide[]>
}

export async function getAllHeroSlides(): Promise<HeroSlide[]> {
  return prisma.heroSlide.findMany({ orderBy: { order: "asc" } }) as Promise<HeroSlide[]>
}

export async function createHeroSlide(data: Omit<HeroSlide, "id">) {
  return prisma.heroSlide.create({ data })
}

export async function updateHeroSlide(id: string, data: Partial<Omit<HeroSlide, "id">>) {
  return prisma.heroSlide.update({ where: { id }, data })
}

export async function deleteHeroSlide(id: string) {
  return prisma.heroSlide.delete({ where: { id } })
}

// ═══ SITE SETTINGS ═══

export async function getSiteSettings(): Promise<SiteSettings> {
  const row = await prisma.appSettings.findUnique({ where: { key: "site" } })
  return { logoUrl: row?.logoUrl || "", logoText: row?.logoText || "88 Seven" }
}

export async function updateSiteSettings(data: Partial<SiteSettings>) {
  await prisma.appSettings.upsert({
    where: { key: "site" },
    update: data,
    create: { key: "site", logoUrl: data.logoUrl || "", logoText: data.logoText || "88 Seven" },
  })
}

// ═══ POPUP BANNER ═══

export async function getPopupBanner(): Promise<PopupBanner | null> {
  return prisma.popupBanner.findFirst({ where: { enabled: true } }) as Promise<PopupBanner | null>
}

export async function getAllPopupBanners(): Promise<PopupBanner[]> {
  return prisma.popupBanner.findMany() as Promise<PopupBanner[]>
}

export async function createPopupBanner(data: Omit<PopupBanner, "id">) {
  return prisma.popupBanner.create({ data })
}

export async function updatePopupBanner(id: string, data: Partial<Omit<PopupBanner, "id">>) {
  return prisma.popupBanner.update({ where: { id }, data })
}

export async function deletePopupBanner(id: string) {
  return prisma.popupBanner.delete({ where: { id } })
}

// ═══ DELIVERY SETTINGS ═══

function rowToDeliverySettings(row: any): DeliverySettings {
  return {
    storeLat: row.storeLat,
    storeLng: row.storeLng,
    riderFeePerDelivery: row.riderFeePerDelivery,
    riderCommissionPercent: row.riderCommissionPercent,
    partnerCommissionPercent: row.partnerCommissionPercent,
    freeDeliveryMinOrder: row.freeDeliveryMinOrder,
    freeDeliveryArea: row.freeDeliveryArea,
    grocery: { baseFare: row.groceryBaseFare, baseKm: row.groceryBaseKm, perKmRate: row.groceryPerKmRate, surgeMultiplier: row.grocerySurgeMultiplier, surgeEnabled: row.grocerySurgeEnabled },
    laundry: { baseFare: row.laundryBaseFare, baseKm: row.laundryBaseKm, perKmRate: row.laundryPerKmRate, surgeMultiplier: row.laundrySurgeMultiplier, surgeEnabled: row.laundrySurgeEnabled },
  }
}

const DEFAULT_DELIVERY: DeliverySettings = {
  storeLat: 0, storeLng: 0, riderFeePerDelivery: 30,
  riderCommissionPercent: 20, partnerCommissionPercent: 15,
  freeDeliveryMinOrder: 1000, freeDeliveryArea: "Lapu-Lapu City, Cebu 6015",
  grocery: { baseFare: 39, baseKm: 2, perKmRate: 10, surgeMultiplier: 1.5, surgeEnabled: false },
  laundry: { baseFare: 29, baseKm: 2, perKmRate: 12, surgeMultiplier: 1.5, surgeEnabled: false },
}

export async function getDeliverySettings(): Promise<DeliverySettings> {
  const row = await prisma.deliverySettings.findFirst()
  return row ? rowToDeliverySettings(row) : DEFAULT_DELIVERY
}

export async function updateDeliverySettings(data: Partial<DeliverySettings>) {
  const flat: any = {}
  if (data.storeLat !== undefined) flat.storeLat = data.storeLat
  if (data.storeLng !== undefined) flat.storeLng = data.storeLng
  if (data.riderFeePerDelivery !== undefined) flat.riderFeePerDelivery = data.riderFeePerDelivery
  if (data.riderCommissionPercent !== undefined) flat.riderCommissionPercent = data.riderCommissionPercent
  if (data.partnerCommissionPercent !== undefined) flat.partnerCommissionPercent = data.partnerCommissionPercent
  if (data.freeDeliveryMinOrder !== undefined) flat.freeDeliveryMinOrder = data.freeDeliveryMinOrder
  if (data.freeDeliveryArea !== undefined) flat.freeDeliveryArea = data.freeDeliveryArea
  if (data.grocery) {
    flat.groceryBaseFare = data.grocery.baseFare
    flat.groceryBaseKm = data.grocery.baseKm
    flat.groceryPerKmRate = data.grocery.perKmRate
    flat.grocerySurgeMultiplier = data.grocery.surgeMultiplier
    flat.grocerySurgeEnabled = data.grocery.surgeEnabled
  }
  if (data.laundry) {
    flat.laundryBaseFare = data.laundry.baseFare
    flat.laundryBaseKm = data.laundry.baseKm
    flat.laundryPerKmRate = data.laundry.perKmRate
    flat.laundrySurgeMultiplier = data.laundry.surgeMultiplier
    flat.laundrySurgeEnabled = data.laundry.surgeEnabled
  }
  const existing = await prisma.deliverySettings.findFirst()
  if (existing) {
    await prisma.deliverySettings.update({ where: { id: existing.id }, data: flat })
  } else {
    await prisma.deliverySettings.create({ data: flat })
  }
}

export function calculateDeliveryFee(km: number, config: ServiceFeeConfig): number {
  const extraKm = Math.max(0, km - config.baseKm)
  let fee = config.baseFare + extraKm * config.perKmRate
  if (config.surgeEnabled) fee *= config.surgeMultiplier
  return Math.round(fee)
}

// ═══ ORDERS ═══

function rowToOrder(row: any): Order {
  return {
    ...row,
    items: (row.items || []).map((i: any) => ({
      productId: i.productId,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      imageUrl: i.imageUrl,
      outOfStock: i.outOfStock,
    })),
    status: row.status as OrderStatus,
  }
}

export async function createOrder(order: Omit<Order, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const { items, ...rest } = order
  const created = await prisma.order.create({
    data: {
      ...rest,
      status: rest.status as any,
      items: { create: items.map((i) => ({ ...i, productId: i.productId || null })) },
    },
  })
  return created.id
}

export async function getOrder(orderId: string): Promise<Order | null> {
  const row = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } })
  return row ? rowToOrder(row) : null
}

export async function getAllOrders(): Promise<Order[]> {
  const rows = await prisma.order.findMany({ orderBy: { createdAt: "desc" }, include: { items: true } })
  return rows.map(rowToOrder)
}

export async function getCustomerOrders(customerId: string): Promise<Order[]> {
  const rows = await prisma.order.findMany({ where: { customerId }, orderBy: { createdAt: "desc" }, include: { items: true } })
  return rows.map(rowToOrder)
}

export async function getDriverOrders(driverId: string): Promise<Order[]> {
  const rows = await prisma.order.findMany({ where: { driverId }, orderBy: { createdAt: "desc" }, include: { items: true } })
  return rows.map(rowToOrder)
}

export async function updateOrderStatus(orderId: string, status: OrderStatus, extra?: Record<string, any>) {
  const data: any = { status, ...extra }
  if (status === "confirmed") data.confirmedAt = new Date()
  if (status === "preparing") data.preparingAt = new Date()
  if (status === "ready_for_pickup") data.readyAt = new Date()
  if (status === "rider_picked_up" || status === "out_for_delivery") data.pickedUpAt = new Date()
  if (status === "delivered") data.deliveredAt = new Date()
  await prisma.order.update({ where: { id: orderId }, data })
}

export async function assignDriver(orderId: string, driverId: string, driverName: string) {
  await prisma.order.update({ where: { id: orderId }, data: { driverId, driverName } })
}

export async function updateDriverLocation(orderId: string, lat: number, lng: number) {
  await prisma.order.update({ where: { id: orderId }, data: { driverLat: lat, driverLng: lng } })
}

export async function rateOrder(orderId: string, data: { riderRating?: number; storeRating?: number; review?: string }) {
  await prisma.order.update({ where: { id: orderId }, data })
}

// Polling-based real-time replacements (replaces onSnapshot)
export function onOrderUpdate(orderId: string, callback: (order: Order) => void): () => void {
  const interval = setInterval(async () => {
    const order = await getOrder(orderId)
    if (order) callback(order)
  }, 3000)
  return () => clearInterval(interval)
}

export function onOrdersUpdate(callback: (orders: Order[]) => void): () => void {
  const interval = setInterval(async () => {
    const orders = await getAllOrders()
    callback(orders)
  }, 3000)
  return () => clearInterval(interval)
}

export function onDriverOrdersUpdate(driverId: string, callback: (orders: Order[]) => void): () => void {
  const interval = setInterval(async () => {
    const orders = await getDriverOrders(driverId)
    callback(orders)
  }, 3000)
  return () => clearInterval(interval)
}

export function onAvailableOrdersForDriver(callback: (orders: Order[]) => void): () => void {
  const interval = setInterval(async () => {
    const rows = await prisma.order.findMany({ where: { status: "ready_for_pickup" }, include: { items: true } })
    callback(rows.map(rowToOrder))
  }, 3000)
  return () => clearInterval(interval)
}

// ═══ DRIVERS ═══

function rowToDriver(row: any): Driver {
  return {
    id: row.id,
    name: row.name,
    email: row.email || "",
    phone: row.phone || "",
    status: row.status as "active" | "inactive" | "pending",
    isOnline: row.isOnline,
    lat: row.lat ?? undefined,
    lng: row.lng ?? undefined,
    profileComplete: row.profileComplete,
    selfieUrl: row.selfieUrl ?? undefined,
    nbiUrl: row.nbiUrl ?? undefined,
    vehicleUrl: row.vehicleUrl ?? undefined,
    vehicleType: row.vehicleType ?? undefined,
    plateNumber: row.plateNumber ?? undefined,
    walletBalance: row.walletBalance,
    createdAt: row.createdAt,
  }
}

export async function getDrivers(): Promise<Driver[]> {
  const rows = await prisma.user.findMany({ where: { role: "driver" } })
  return rows.map(rowToDriver)
}

export async function createDriver(data: Omit<Driver, "id">) {
  return prisma.user.create({
    data: {
      role: "driver",
      name: data.name,
      email: data.email,
      phone: data.phone,
      status: (data.status || "pending") as any,
      isOnline: data.isOnline || false,
      lat: data.lat,
      lng: data.lng,
      vehicleType: data.vehicleType,
      plateNumber: data.plateNumber,
      walletBalance: data.walletBalance || 0,
    },
  })
}

export async function registerRider(email: string, password: string, data: { name: string; phone: string }) {
  const passwordHash = await hashPassword(password)
  const user = await prisma.user.create({
    data: { role: "driver", name: data.name, email, phone: data.phone, passwordHash, status: "pending", isOnline: false },
  })
  return { id: user.id, email: user.email }
}

export async function updateDriver(id: string, data: Partial<Omit<Driver, "id">>) {
  await prisma.user.update({ where: { id }, data: data as any })
}

export async function deleteDriver(id: string) {
  await prisma.user.delete({ where: { id } })
}

export async function setDriverOnline(driverId: string, isOnline: boolean) {
  await prisma.user.update({ where: { id: driverId }, data: { isOnline } })
}

export async function updateDriverLiveLocation(driverId: string, lat: number, lng: number) {
  await prisma.user.update({ where: { id: driverId }, data: { lat, lng } })
}

export async function getRiderWalletBalance(driverId: string): Promise<number> {
  const row = await prisma.user.findUnique({ where: { id: driverId }, select: { walletBalance: true } })
  return row?.walletBalance || 0
}

export async function findNearestOnlineDriver(targetLat: number, targetLng: number): Promise<Driver | null> {
  const rows = await prisma.user.findMany({ where: { role: "driver", status: "active", isOnline: true } })
  const online = rows.filter((d) => d.lat && d.lng)
  if (!online.length) return null
  let nearest: any = null
  let minDist = Infinity
  for (const d of online) {
    const R = 6371
    const dLat = (d.lat! - targetLat) * Math.PI / 180
    const dLng = (d.lng! - targetLng) * Math.PI / 180
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(targetLat * Math.PI / 180) * Math.cos(d.lat! * Math.PI / 180) * Math.sin(dLng / 2) ** 2
    const km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    if (km < minDist) { minDist = km; nearest = d }
  }
  return nearest ? rowToDriver(nearest) : null
}

// ═══ WALLET TRANSACTIONS ═══

async function adjustWallet(userId: string, delta: number) {
  await prisma.user.update({ where: { id: userId }, data: { walletBalance: { increment: delta } } })
}

export async function topUpRiderWallet(driverId: string, amount: number, transactionId: string) {
  await adjustWallet(driverId, amount)
  await prisma.walletTransaction.create({ data: { ownerId: driverId, ownerType: "rider", type: "topup", amount, transactionId, status: "completed" } })
}

export async function deductRiderWallet(driverId: string, amount: number, orderId: string, note: string) {
  await adjustWallet(driverId, -amount)
  await prisma.walletTransaction.create({ data: { ownerId: driverId, ownerType: "rider", type: "deduction", amount: -amount, orderId, note, status: "completed" } })
}

export async function getWalletTransactions(ownerId?: string): Promise<WalletTransaction[]> {
  const rows = await prisma.walletTransaction.findMany({
    where: ownerId ? { ownerId } : undefined,
    orderBy: { createdAt: "desc" },
  })
  return rows as WalletTransaction[]
}

export async function addWalletEntry(data: { ownerId: string; ownerType: "rider" | "partner"; amount: number; type: string; orderId?: string; note: string }) {
  await prisma.walletTransaction.create({
    data: { ownerId: data.ownerId, ownerType: data.ownerType as any, type: data.type as any, amount: data.amount, orderId: data.orderId, note: data.note, status: "completed" },
  })
}

export async function getWalletEntries(ownerId: string, ownerType: "rider" | "partner"): Promise<WalletTransaction[]> {
  const rows = await prisma.walletTransaction.findMany({ where: { ownerId, ownerType: ownerType as any }, orderBy: { createdAt: "desc" } })
  return rows as WalletTransaction[]
}

export async function processOrderCommissions(orderId: string, service: string, deliveryFee: number, orderTotal: number, riderId: string, partnerId?: string) {
  const settings = await getDeliverySettings()
  const riderPercent = settings.riderCommissionPercent || 20
  const partnerPercent = settings.partnerCommissionPercent || 15
  const riderDeduction = Math.round(deliveryFee * riderPercent / 100)
  const riderEarning = deliveryFee - riderDeduction
  await addWalletEntry({ ownerId: riderId, ownerType: "rider", amount: riderEarning, type: "earning", orderId, note: `Delivery fee ₱${deliveryFee} - ${riderPercent}% commission (₱${riderDeduction})` })
  await addWalletEntry({ ownerId: riderId, ownerType: "rider", amount: -riderDeduction, type: "commission_deduction", orderId, note: `${riderPercent}% platform commission` })
  if (partnerId && service === "laundry") {
    const partnerDeduction = Math.round(orderTotal * partnerPercent / 100)
    const partnerEarning = orderTotal - partnerDeduction
    await addWalletEntry({ ownerId: partnerId, ownerType: "partner", amount: partnerEarning, type: "earning", orderId, note: `Order ₱${orderTotal} - ${partnerPercent}% commission (₱${partnerDeduction})` })
    await addWalletEntry({ ownerId: partnerId, ownerType: "partner", amount: -partnerDeduction, type: "commission_deduction", orderId, note: `${partnerPercent}% platform commission` })
  }
}

export async function deductRiderCommissionOnDelivery(driverId: string, orderId: string, deliveryFee: number) {
  const settings = await getDeliverySettings()
  const commission = Math.round(deliveryFee * settings.riderCommissionPercent / 100)
  if (commission <= 0) return
  await deductRiderWallet(driverId, commission, orderId, `${settings.riderCommissionPercent}% commission on ₱${deliveryFee} delivery fee`)
}

// ═══ PARTNER LAUNDROMAT ═══

function rowToPartner(row: any): LaundryPartner {
  return {
    id: row.id,
    uid: row.id,
    shopName: row.shopName || "",
    name: row.name,
    ownerName: row.name,
    email: row.email || "",
    phone: row.phone || "",
    address: row.address || "",
    landmark: row.landmark ?? undefined,
    lat: row.lat ?? undefined,
    lng: row.lng ?? undefined,
    logoUrl: row.logoUrl ?? undefined,
    isOnline: row.isOnline,
    openTime: row.openTime ?? undefined,
    closeTime: row.closeTime ?? undefined,
    openDays: row.openDays,
    status: row.status as "pending" | "active" | "inactive",
    services: row.services as any,
    walletBalance: row.walletBalance,
    listingMode: row.listingMode as "free" | "wallet_required",
    minimumBalance: row.minimumBalance,
    createdAt: row.createdAt,
  }
}

export async function registerPartner(email: string, password: string, data: { shopName: string; ownerName: string; phone: string; address: string; landmark?: string; lat?: number; lng?: number }) {
  const passwordHash = await hashPassword(password)
  const user = await prisma.user.create({
    data: {
      role: "partner",
      name: data.ownerName,
      shopName: data.shopName,
      email,
      phone: data.phone,
      address: data.address,
      landmark: data.landmark,
      lat: data.lat,
      lng: data.lng,
      passwordHash,
      status: "pending",
      isOnline: true,
      openTime: "08:00",
      closeTime: "20:00",
      openDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    },
  })
  return { id: user.id, email: user.email }
}

export async function getPartnerProfile(id: string): Promise<LaundryPartner | null> {
  const row = await prisma.user.findFirst({ where: { id, role: "partner" } })
  return row ? rowToPartner(row) : null
}

export async function getAllPartners(): Promise<LaundryPartner[]> {
  const rows = await prisma.user.findMany({ where: { role: "partner" } })
  return rows.map(rowToPartner)
}

export async function updatePartnerStatus(id: string, status: "pending" | "active" | "inactive") {
  await prisma.user.update({ where: { id }, data: { status: status as any } })
}

export async function getPartnerWalletBalance(partnerId: string): Promise<number> {
  const row = await prisma.user.findUnique({ where: { id: partnerId }, select: { walletBalance: true } })
  return row?.walletBalance || 0
}

export async function getPartnerWalletTransactions(partnerId?: string): Promise<WalletTransaction[]> {
  const rows = await prisma.walletTransaction.findMany({
    where: { ownerType: "partner", ...(partnerId ? { ownerId: partnerId } : {}) },
    orderBy: { createdAt: "desc" },
  })
  return rows as WalletTransaction[]
}

export async function topUpPartnerWallet(partnerId: string, amount: number, transactionId: string) {
  await adjustWallet(partnerId, amount)
  await prisma.walletTransaction.create({ data: { ownerId: partnerId, ownerType: "partner", type: "topup", amount, transactionId, note: "Wallet top-up", status: "completed" } })
}

export async function deductPartnerWallet(partnerId: string, amount: number, orderId: string, note: string) {
  await adjustWallet(partnerId, -amount)
  await prisma.walletTransaction.create({ data: { ownerId: partnerId, ownerType: "partner", type: "deduction", amount: -amount, orderId, note, status: "completed" } })
}

export async function adminAdjustPartnerWallet(partnerId: string, amount: number, note: string) {
  await adjustWallet(partnerId, amount)
  await prisma.walletTransaction.create({ data: { ownerId: partnerId, ownerType: "partner", type: amount >= 0 ? "topup" : "deduction", amount, note, status: "completed" } })
}

export async function deductPartnerCommissionOnDelivery(partnerId: string, orderId: string, serviceTotal: number) {
  const settings = await getDeliverySettings()
  const commission = Math.round(serviceTotal * settings.partnerCommissionPercent / 100)
  if (commission <= 0) return
  await deductPartnerWallet(partnerId, commission, orderId, `${settings.partnerCommissionPercent}% commission on ₱${serviceTotal} service`)
}

export async function updatePartnerListingMode(partnerId: string, listingMode: "free" | "wallet_required", minimumBalance: number) {
  await prisma.user.update({ where: { id: partnerId }, data: { listingMode: listingMode as any, minimumBalance } })
}

export function isPartnerVisible(partner: LaundryPartner, config: ListingModeConfig): boolean {
  const mode = partner.listingMode || config.defaultMode
  if (mode === "free") return true
  return (partner.walletBalance || 0) >= (partner.minimumBalance ?? config.defaultMinBalance)
}

// ═══ HOME SERVICE PROVIDERS ═══

function rowToProvider(row: any): HomeServiceProvider {
  return {
    id: row.id,
    uid: row.id,
    shopName: row.shopName || "",
    name: row.name,
    ownerName: row.name,
    email: row.email || "",
    phone: row.phone || "",
    address: row.address || "",
    landmark: row.landmark ?? undefined,
    lat: row.lat ?? undefined,
    lng: row.lng ?? undefined,
    logoUrl: row.logoUrl ?? undefined,
    isOnline: row.isOnline,
    openTime: row.openTime ?? undefined,
    closeTime: row.closeTime ?? undefined,
    openDays: row.openDays,
    status: row.status as "pending" | "active" | "inactive",
    skills: row.skills,
    services: row.services as any,
    walletBalance: row.walletBalance,
    listingMode: row.listingMode as "free" | "wallet_required",
    minimumBalance: row.minimumBalance,
    rating: row.rating ?? undefined,
    completedJobs: row.completedJobs,
    createdAt: row.createdAt,
  }
}

export async function registerHomeServiceProvider(email: string, password: string, data: { shopName: string; ownerName: string; phone: string; address: string; skills?: string[]; landmark?: string; lat?: number; lng?: number }) {
  const passwordHash = await hashPassword(password)
  const user = await prisma.user.create({
    data: {
      role: "provider",
      name: data.ownerName,
      shopName: data.shopName,
      email,
      phone: data.phone,
      address: data.address,
      landmark: data.landmark,
      lat: data.lat,
      lng: data.lng,
      skills: data.skills || [],
      passwordHash,
      status: "pending",
      isOnline: true,
      openTime: "08:00",
      closeTime: "18:00",
      openDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      walletBalance: 0,
    },
  })
  return { id: user.id, email: user.email }
}

export async function getHomeServiceProviderProfile(id: string): Promise<HomeServiceProvider | null> {
  const row = await prisma.user.findFirst({ where: { id, role: "provider" } })
  return row ? rowToProvider(row) : null
}

export async function getAllHomeServiceProviders(): Promise<HomeServiceProvider[]> {
  const rows = await prisma.user.findMany({ where: { role: "provider" } })
  return rows.map(rowToProvider)
}

export async function updateHomeServiceProvider(id: string, data: Partial<Omit<HomeServiceProvider, "id">>) {
  await prisma.user.update({ where: { id }, data: data as any })
}

export async function updateHomeServiceProviderListingMode(providerId: string, listingMode: "free" | "wallet_required", minimumBalance: number) {
  await prisma.user.update({ where: { id: providerId }, data: { listingMode: listingMode as any, minimumBalance } })
}

export async function getHomeServiceProviderWalletBalance(providerId: string): Promise<number> {
  const row = await prisma.user.findUnique({ where: { id: providerId }, select: { walletBalance: true } })
  return row?.walletBalance || 0
}

export async function getProviderWalletTransactions(providerId: string): Promise<WalletTransaction[]> {
  const rows = await prisma.walletTransaction.findMany({ where: { ownerId: providerId, ownerType: "provider" }, orderBy: { createdAt: "desc" } })
  return rows as WalletTransaction[]
}

export async function topUpProviderWallet(providerId: string, amount: number, transactionId: string) {
  await adjustWallet(providerId, amount)
  await prisma.walletTransaction.create({ data: { ownerId: providerId, ownerType: "provider", type: "topup", amount, transactionId, note: "Wallet top-up", status: "completed" } })
}

export async function addProviderEarning(providerId: string, amount: number, commission: number, jobId: string, note: string) {
  const net = amount - commission
  await adjustWallet(providerId, net)
  await prisma.walletTransaction.create({ data: { ownerId: providerId, ownerType: "provider", type: "earning", amount: net, jobId, note, status: "completed" } })
  await prisma.walletTransaction.create({ data: { ownerId: providerId, ownerType: "provider", type: "commission", amount: -commission, jobId, note: "Platform commission", status: "completed" } })
}

export async function deductProviderCommissionOnCompletion(providerId: string, jobId: string, jobTotal: number) {
  const settings = await getDeliverySettings()
  const commission = Math.round(jobTotal * settings.partnerCommissionPercent / 100)
  if (commission <= 0) return
  await adjustWallet(providerId, -commission)
  await prisma.walletTransaction.create({ data: { ownerId: providerId, ownerType: "provider", type: "commission", amount: -commission, jobId, note: `${settings.partnerCommissionPercent}% platform commission on ₱${jobTotal}`, status: "completed" } })
}

export function isHomeServiceProviderVisible(provider: HomeServiceProvider, config: ListingModeConfig): boolean {
  const mode = provider.listingMode || config.defaultMode
  if (mode === "free") return true
  return (provider.walletBalance || 0) >= (provider.minimumBalance ?? config.defaultMinBalance)
}

// ═══ CUSTOMER AUTH ═══

function rowToCustomer(row: any): CustomerProfile {
  return {
    id: row.id,
    uid: row.id,
    name: row.name,
    phone: row.phone || "",
    email: row.email || "",
    address: row.address ?? undefined,
    savedAddresses: row.savedAddresses as SavedAddress[] | undefined,
    walletBalance: row.walletBalance,
    createdAt: row.createdAt,
  }
}

export async function getAllCustomers(): Promise<CustomerProfile[]> {
  const rows = await prisma.user.findMany({ where: { role: "customer" } })
  return rows.map(rowToCustomer)
}

export async function customerRegister(email: string, password: string, name: string, phone: string) {
  const passwordHash = await hashPassword(password)
  const user = await prisma.user.create({ data: { role: "customer", name, email, phone, passwordHash, status: "active" } })
  return { id: user.id, email: user.email }
}

export async function customerLogin(email: string, password: string) {
  const user = await prisma.user.findFirst({ where: { email, role: "customer" } })
  if (!user || !user.passwordHash) throw new Error("Invalid credentials")
  const valid = await verifyPassword(password, user.passwordHash)
  if (!valid) throw new Error("Invalid credentials")
  const token = signToken({ id: user.id, role: user.role })
  return { user: rowToCustomer(user), token }
}

export async function adminLogin(email: string, password: string) {
  const user = await prisma.user.findFirst({ where: { email, role: "admin" } })
  if (!user || !user.passwordHash) throw new Error("Invalid credentials")
  const valid = await verifyPassword(password, user.passwordHash)
  if (!valid) throw new Error("Invalid credentials")
  const token = signToken({ id: user.id, role: user.role })
  return { user, token }
}

export async function getCustomerProfile(id: string): Promise<CustomerProfile | null> {
  const row = await prisma.user.findFirst({ where: { id, role: "customer" } })
  return row ? rowToCustomer(row) : null
}

export async function updateCustomerProfile(id: string, data: Partial<Omit<CustomerProfile, "id">>) {
  await prisma.user.update({ where: { id }, data: data as any })
}

export async function ensureCustomerProfile(id: string, name?: string, email?: string) {
  const existing = await prisma.user.findUnique({ where: { id } })
  if (!existing) {
    await prisma.user.create({ data: { id, role: "customer", name: name || "", email: email || "", status: "active" } })
  } else if (name || email) {
    await prisma.user.update({ where: { id }, data: { ...(name ? { name } : {}), ...(email ? { email } : {}) } })
  }
}

export async function getCustomerWalletBalance(customerId: string): Promise<number> {
  const row = await prisma.user.findUnique({ where: { id: customerId }, select: { walletBalance: true } })
  return row?.walletBalance || 0
}

export async function topUpCustomerWallet(customerId: string, amount: number, transactionId: string) {
  await adjustWallet(customerId, amount)
  await prisma.walletTransaction.create({ data: { ownerId: customerId, ownerType: "customer", type: "topup", amount, transactionId, note: "Wallet top-up", status: "completed" } })
}

export async function deductCustomerWallet(customerId: string, amount: number, orderId: string, note: string) {
  await adjustWallet(customerId, -amount)
  await prisma.walletTransaction.create({ data: { ownerId: customerId, ownerType: "customer", type: "deduction", amount: -amount, orderId, note, status: "completed" } })
}

export async function adminAdjustCustomerWallet(customerId: string, amount: number, note: string) {
  await adjustWallet(customerId, amount)
  await prisma.walletTransaction.create({ data: { ownerId: customerId, ownerType: "customer", type: amount >= 0 ? "topup" : "deduction", amount, note, status: "completed" } })
}

export async function getCustomerWalletTransactions(customerId?: string): Promise<WalletTransaction[]> {
  const rows = await prisma.walletTransaction.findMany({
    where: { ownerType: "customer", ...(customerId ? { ownerId: customerId } : {}) },
    orderBy: { createdAt: "desc" },
  })
  return rows as WalletTransaction[]
}

// ═══ LISTING MODE ═══

export async function getListingModeConfig(): Promise<ListingModeConfig> {
  const row = await prisma.appSettings.findUnique({ where: { key: "listingMode" } })
  return { defaultMode: (row?.defaultListingMode as "free" | "wallet_required") || "free", defaultMinBalance: row?.defaultMinBalance || 100 }
}

export async function updateListingModeConfig(config: ListingModeConfig) {
  await prisma.appSettings.upsert({
    where: { key: "listingMode" },
    update: { defaultListingMode: config.defaultMode as any, defaultMinBalance: config.defaultMinBalance },
    create: { key: "listingMode", defaultListingMode: config.defaultMode as any, defaultMinBalance: config.defaultMinBalance },
  })
}

// ═══ PAYMENT METHODS CONFIG ═══

export async function getPaymentMethodsConfig(): Promise<PaymentMethodsConfig> {
  const row = await prisma.appSettings.findUnique({ where: { key: "paymentMethods" } })
  return {
    cod: row?.codEnabled ?? true,
    wallet: row?.walletEnabled ?? true,
    qrph: row?.qrphEnabled ?? true,
    ewallet: row?.ewalletEnabled ?? true,
    bank: row?.bankEnabled ?? true,
    xendit: row?.xenditEnabled ?? true,
  }
}

// ═══ NOTIFICATIONS ═══

export async function createNotification(data: Omit<AppNotification, "id" | "createdAt">) {
  await prisma.notification.create({
    data: { recipientType: data.recipientType as any, recipientId: data.recipientId, title: data.title, message: data.message, orderId: data.orderId, read: data.read },
  })
}

export async function getNotifications(recipientType: string, recipientId?: string): Promise<AppNotification[]> {
  const rows = await prisma.notification.findMany({
    where: { recipientType: recipientType as any, ...(recipientId ? { recipientId } : {}) },
    orderBy: { createdAt: "desc" },
  })
  return rows as AppNotification[]
}

export async function markNotificationRead(notificationId: string) {
  await prisma.notification.update({ where: { id: notificationId }, data: { read: true } })
}

export async function markAllNotificationsRead(recipientType: string, recipientId?: string) {
  await prisma.notification.updateMany({
    where: { recipientType: recipientType as any, ...(recipientId ? { recipientId } : {}), read: false },
    data: { read: true },
  })
}

export function onNotifications(recipientType: string, recipientId: string | undefined, callback: (notifications: AppNotification[]) => void): () => void {
  const interval = setInterval(async () => {
    const rows = await getNotifications(recipientType, recipientId)
    callback(rows)
  }, 5000)
  return () => clearInterval(interval)
}

export async function notifyOrderPlaced(orderId: string, customerName: string) {
  await createNotification({ recipientType: "admin", title: "New Order!", message: `${customerName} placed a new order`, orderId, read: false })
}

export async function notifyOrderConfirmed(orderId: string, customerId: string) {
  await createNotification({ recipientType: "customer", recipientId: customerId, title: "Order Confirmed", message: "Your order has been confirmed and is being prepared", orderId, read: false })
}

export async function notifyOrderPreparing(orderId: string, customerId: string) {
  await createNotification({ recipientType: "customer", recipientId: customerId, title: "Preparing Your Order", message: "Your order is now being prepared", orderId, read: false })
}

export async function notifyOrderOutForDelivery(orderId: string, customerId: string, driverId: string) {
  await createNotification({ recipientType: "customer", recipientId: customerId, title: "On the Way!", message: "Your order is out for delivery", orderId, read: false })
  await createNotification({ recipientType: "driver", recipientId: driverId, title: "New Delivery", message: "You have a new delivery assignment", orderId, read: false })
}

export async function notifyOrderDelivered(orderId: string, customerId: string) {
  await createNotification({ recipientType: "customer", recipientId: customerId, title: "Delivered!", message: "Your order has been delivered. Enjoy!", orderId, read: false })
  await createNotification({ recipientType: "admin", title: "Order Delivered", message: `Order #${orderId.slice(0, 8)} has been delivered`, orderId, read: false })
}

// ═══ CHAT ═══

export async function sendChatMessage(orderId: string, senderId: string, senderName: string, senderRole: "customer" | "driver" | "admin", message: string) {
  await prisma.chatMessage.create({ data: { orderId, senderId, senderName, senderRole, message } })
}

export async function getChatMessages(orderId: string): Promise<ChatMessage[]> {
  const rows = await prisma.chatMessage.findMany({ where: { orderId }, orderBy: { createdAt: "asc" } })
  return rows as ChatMessage[]
}

export function onChatMessages(orderId: string, callback: (messages: ChatMessage[]) => void): () => void {
  const interval = setInterval(async () => {
    const rows = await getChatMessages(orderId)
    callback(rows)
  }, 3000)
  return () => clearInterval(interval)
}

// ═══ REPORTS ═══

export async function submitReport(data: Omit<Report, "id" | "createdAt" | "status">) {
  await prisma.report.create({ data: { ...data, type: data.type as any, status: "pending" } })
}

export async function getAllReports(): Promise<Report[]> {
  const rows = await prisma.report.findMany({ orderBy: { createdAt: "desc" } })
  return rows as Report[]
}

export async function updateReportStatus(reportId: string, status: "pending" | "reviewed" | "resolved") {
  await prisma.report.update({ where: { id: reportId }, data: { status: status as any } })
}

// ═══ SERVICE JOBS ═══

export async function createServiceJob(job: Omit<ServiceJob, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const created = await prisma.serviceJob.create({ data: { ...job, status: job.status as any } })
  return created.id
}

export async function getServiceJob(jobId: string): Promise<ServiceJob | null> {
  const row = await prisma.serviceJob.findUnique({ where: { id: jobId } })
  return row as ServiceJob | null
}

export async function getProviderPendingJobs(_providerId: string): Promise<ServiceJob[]> {
  const rows = await prisma.serviceJob.findMany({ where: { status: "pending" }, orderBy: { createdAt: "desc" } })
  return rows as ServiceJob[]
}

export async function getProviderJobs(providerId: string): Promise<ServiceJob[]> {
  const rows = await prisma.serviceJob.findMany({ where: { providerId }, orderBy: { createdAt: "desc" } })
  return rows as ServiceJob[]
}

export async function updateServiceJobStatus(jobId: string, status: string, providerId?: string) {
  await prisma.serviceJob.update({ where: { id: jobId }, data: { status: status as any, ...(providerId ? { providerId } : {}) } })
}

export function onProviderJobsUpdate(providerId: string, callback: (jobs: ServiceJob[]) => void): () => void {
  const interval = setInterval(async () => {
    const jobs = await getProviderJobs(providerId)
    callback(jobs)
  }, 3000)
  return () => clearInterval(interval)
}

// ═══ STORE CATEGORIES (kept as product categories from DB) ═══

export async function getStoreCategories(): Promise<Category[]> {
  const rows = await prisma.product.findMany({ select: { category: true }, distinct: ["category"] })
  return rows
    .filter((r) => r.category)
    .map((r, i) => ({ id: String(i), name: r.category! }))
}

// ═══ MISSING EXPORTS (compatibility shims) ═══

// CustomerProfile uses `id` not `uid` — alias for pages still using .uid
export type { CustomerProfile as CustomerProfileType }

// Type aliases pages import by old names
export type CustomerWalletTransaction = WalletTransaction
export type PartnerWalletTransaction = WalletTransaction
export type ProviderWalletTransaction = WalletTransaction

// Unified user type for pages that typed state as Firebase User
export type AppUser = CustomerProfile

// WalletTransaction with legacy field aliases for admin/wallet page
export interface WalletTransactionLegacy extends WalletTransaction {
  driverId?: string
  customerId?: string
  partnerId?: string
}

// Auth state change — polling replacement for onAuthStateChanged
export function onCustomerAuthChange(callback: (user: CustomerProfile | null) => void): () => void {
  // Pages call this with a token stored in localStorage; they should use verifyToken directly.
  // This shim does nothing on server — pages must handle auth via token check.
  return () => {}
}

export async function customerLogout() {
  // Token removal is handled client-side via localStorage
  if (typeof window !== "undefined") localStorage.removeItem("customer_token")
}

export async function adminLogout() {
  if (typeof window !== "undefined") localStorage.removeItem("admin_token")
}

// OTP / Recaptcha — no-op shims (phone auth not supported without Firebase)
export function setupRecaptcha(_elementId: string) { return null }
export async function sendOTP(_phone: string, _verifier: any) { return null }
export async function verifyOTP(_result: any, _code: string) { return null }

// uploadPartnerLogo — file upload via storage (keep Firebase Storage or use S3)
// For now returns empty string; replace with actual upload logic
export async function uploadPartnerLogo(_partnerId: string, _file: File): Promise<string> { return "" }
export async function uploadHomeServiceProviderLogo(_providerId: string, _file: File): Promise<string> { return "" }

// Category extra fields used by admin/page.tsx — re-exported (no duplicate)
// Store category CRUD — now backed by a separate Category table concept
// For now these are no-ops since categories are derived from products
export async function updateStoreCategory(_id: string, _data: Partial<Omit<Category, "id">>) {}
export async function createStoreCategory(_data: Omit<Category, "id">) {}
export async function deleteStoreCategory(_id: string) {}
