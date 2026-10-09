import { initializeApp, getApps, getApp } from "firebase/app"
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore"
import { getAuth, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, onAuthStateChanged, RecaptchaVerifier, signInWithPhoneNumber, type User, type ConfirmationResult } from "firebase/auth"
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
const db = getFirestore(app)
const storage = getStorage(app)
const auth = getAuth(app)

// ═══ INTERFACES ═══

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
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready_for_pickup"
  | "rider_accepted"
  | "rider_at_store"
  | "rider_picked_up"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "rejected"

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

// ═══ PRODUCTS ═══

export async function getProducts(): Promise<Product[]> {
  const snap = await getDocs(collection(db, "products"))
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Product)
    .filter((p) => {
      if (p.showOnSite === false) return false
      if ((p as any).showOnSite === "false") return false
      return true
    })
}

export async function getAllProducts(): Promise<Product[]> {
  const snap = await getDocs(collection(db, "products"))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Product)
}

export async function createProduct(data: Omit<Product, "id">) {
  return addDoc(collection(db, "products"), data)
}

export async function updateProduct(id: string, data: Partial<Omit<Product, "id">>) {
  await updateDoc(doc(db, "products", id), data as any)
}

export async function deleteProduct(id: string) {
  await deleteDoc(doc(db, "products", id))
}

export async function toggleProductVisibility(productId: string, show: boolean) {
  const ref = doc(db, "products", productId)
  await updateDoc(ref, { showOnSite: show })
}

export async function getCategories(): Promise<string[]> {
  const products = await getProducts()
  const cats = new Set(products.map((p) => p.category).filter(Boolean))
  return Array.from(cats).sort()
}

// ═══ CATEGORIES (from pos-app-for-stores) ═══

export interface Category {
  id: string
  name: string
  imageUrl?: string
  emoji?: string
  order?: number
  unit?: string
  salePrice?: number
}

const STORE_ID = process.env.NEXT_PUBLIC_STORE_ID || "8807"

export async function getStoreCategories(): Promise<Category[]> {
  const snap = await getDocs(collection(db, `pos-app-for-stores/${STORE_ID}/categories`))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Category).sort((a, b) => (a.order || 0) - (b.order || 0))
}

export async function updateStoreCategory(id: string, data: Partial<Omit<Category, "id">>) {
  const ref = doc(db, `pos-app-for-stores/${STORE_ID}/categories`, id)
  await updateDoc(ref, data)
}

export async function createStoreCategory(data: Omit<Category, "id">) {
  return addDoc(collection(db, `pos-app-for-stores/${STORE_ID}/categories`), data)
}

export async function deleteStoreCategory(id: string) {
  const ref = doc(db, `pos-app-for-stores/${STORE_ID}/categories`, id)
  await deleteDoc(ref)
}

// ═══ HERO SLIDES ═══

export async function getHeroSlides(): Promise<HeroSlide[]> {
  const q = query(collection(db, "heroSlides"), orderBy("order"))
  const snap = await getDocs(q)
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as HeroSlide)
    .filter((s) => s.enabled)
}

export async function getAllHeroSlides(): Promise<HeroSlide[]> {
  const q = query(collection(db, "heroSlides"), orderBy("order"))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as HeroSlide)
}

export async function createHeroSlide(slide: Omit<HeroSlide, "id">) {
  return addDoc(collection(db, "heroSlides"), slide)
}

export async function updateHeroSlide(id: string, data: Partial<Omit<HeroSlide, "id">>) {
  const ref = doc(db, "heroSlides", id)
  await updateDoc(ref, data)
}

export async function deleteHeroSlide(id: string) {
  const ref = doc(db, "heroSlides", id)
  await deleteDoc(ref)
}

// ═══ SITE SETTINGS ═══

export async function getSiteSettings(): Promise<SiteSettings> {
  const snap = await getDocs(collection(db, "siteSettings"))
  if (snap.docs.length > 0) {
    return snap.docs[0].data() as SiteSettings
  }
  return { logoUrl: "", logoText: "88 Seven" }
}

export async function updateSiteSettings(data: Partial<SiteSettings>) {
  const snap = await getDocs(collection(db, "siteSettings"))
  if (snap.docs.length > 0) {
    const ref = doc(db, "siteSettings", snap.docs[0].id)
    await updateDoc(ref, data)
  } else {
    await addDoc(collection(db, "siteSettings"), { logoUrl: "", logoText: "88 Seven", ...data })
  }
}

// ═══ POPUP BANNER ═══

export async function getPopupBanner(): Promise<PopupBanner | null> {
  const snap = await getDocs(collection(db, "popupBanner"))
  const banners = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PopupBanner)
  return banners.find((b) => b.enabled) || null
}

export async function getAllPopupBanners(): Promise<PopupBanner[]> {
  const snap = await getDocs(collection(db, "popupBanner"))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PopupBanner)
}

export async function createPopupBanner(data: Omit<PopupBanner, "id">) {
  return addDoc(collection(db, "popupBanner"), data)
}

export async function updatePopupBanner(id: string, data: Partial<Omit<PopupBanner, "id">>) {
  const ref = doc(db, "popupBanner", id)
  await updateDoc(ref, data)
}

export async function deletePopupBanner(id: string) {
  const ref = doc(db, "popupBanner", id)
  await deleteDoc(ref)
}

// ═══ DELIVERY SETTINGS ═══

export async function getDeliverySettings(): Promise<DeliverySettings> {
  const snap = await getDocs(collection(db, "deliverySettings"))
  if (snap.docs.length > 0) {
    return snap.docs[0].data() as DeliverySettings
  }
  return {
    storeLat: 0, storeLng: 0, riderFeePerDelivery: 30,
    riderCommissionPercent: 20, partnerCommissionPercent: 15,
    freeDeliveryMinOrder: 1000, freeDeliveryArea: "Lapu-Lapu City, Cebu 6015",
    grocery: { baseFare: 39, baseKm: 2, perKmRate: 10, surgeMultiplier: 1.5, surgeEnabled: false },
    laundry: { baseFare: 29, baseKm: 2, perKmRate: 12, surgeMultiplier: 1.5, surgeEnabled: false },
  }
}

export async function updateDeliverySettings(data: Partial<DeliverySettings>) {
  const snap = await getDocs(collection(db, "deliverySettings"))
  if (snap.docs.length > 0) {
    const ref = doc(db, "deliverySettings", snap.docs[0].id)
    await updateDoc(ref, data as any)
  } else {
    await addDoc(collection(db, "deliverySettings"), {
      storeLat: 0, storeLng: 0, riderFeePerDelivery: 30,
      riderCommissionPercent: 20, partnerCommissionPercent: 15,
      freeDeliveryMinOrder: 1000, freeDeliveryArea: "Lapu-Lapu City, Cebu 6015",
      grocery: { baseFare: 39, baseKm: 2, perKmRate: 10, surgeMultiplier: 1.5, surgeEnabled: false },
      laundry: { baseFare: 29, baseKm: 2, perKmRate: 12, surgeMultiplier: 1.5, surgeEnabled: false },
      ...data,
    })
  }
}

export function calculateDeliveryFee(km: number, config: ServiceFeeConfig): number {
  const extraKm = Math.max(0, km - config.baseKm)
  let fee = config.baseFare + (extraKm * config.perKmRate)
  if (config.surgeEnabled) fee *= config.surgeMultiplier
  return Math.round(fee)
}

// ═══ ORDERS ═══

export async function createOrder(order: Omit<Order, "id" | "createdAt" | "updatedAt">): Promise<string> {
  // Remove undefined values - Firestore rejects them
  const cleanOrder = Object.fromEntries(
    Object.entries(order).filter(([, v]) => v !== undefined)
  )
  const docRef = await addDoc(collection(db, "orders"), {
    ...cleanOrder,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return docRef.id
}

export async function getOrder(orderId: string): Promise<Order | null> {
  const ref = doc(db, "orders", orderId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as Order
}

export async function getAllOrders(): Promise<Order[]> {
  const q = query(collection(db, "orders"), orderBy("createdAt", "desc"))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order)
}

export async function updateOrderStatus(orderId: string, status: OrderStatus, extra?: Record<string, any>) {
  const ref = doc(db, "orders", orderId)
  const update: Record<string, any> = { status, updatedAt: serverTimestamp(), ...extra }
  if (status === "confirmed") update.confirmedAt = serverTimestamp()
  if (status === "preparing") update.preparingAt = serverTimestamp()
  if (status === "ready_for_pickup") update.readyAt = serverTimestamp()
  if (status === "rider_picked_up" || status === "out_for_delivery") update.pickedUpAt = serverTimestamp()
  if (status === "delivered") update.deliveredAt = serverTimestamp()
  await updateDoc(ref, update)
}

export async function assignDriver(orderId: string, driverId: string, driverName: string) {
  const ref = doc(db, "orders", orderId)
  await updateDoc(ref, { driverId, driverName, updatedAt: serverTimestamp() })
}

export async function updateDriverLocation(orderId: string, lat: number, lng: number) {
  const ref = doc(db, "orders", orderId)
  await updateDoc(ref, { driverLat: lat, driverLng: lng, updatedAt: serverTimestamp() })
}

export function onOrderUpdate(orderId: string, callback: (order: Order) => void) {
  const ref = doc(db, "orders", orderId)
  return onSnapshot(ref, (snap) => {
    if (snap.exists()) {
      callback({ id: snap.id, ...snap.data() } as Order)
    }
  }, () => {})
}

// Real-time listener for orders collection (for admin/driver)
export function onOrdersUpdate(callback: (orders: Order[]) => void) {
  const q = query(collection(db, "orders"), orderBy("createdAt", "desc"))
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order))
  }, () => callback([]))
}

export async function getDriverOrders(driverId: string): Promise<Order[]> {
  const q = query(collection(db, "orders"), where("driverId", "==", driverId))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order)
}

export function onDriverOrdersUpdate(driverId: string, callback: (orders: Order[]) => void) {
  const q = query(collection(db, "orders"), where("driverId", "==", driverId))
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order))
  }, () => callback([]))
}

export function onAvailableOrdersForDriver(callback: (orders: Order[]) => void) {
  const q = query(collection(db, "orders"), where("status", "==", "ready_for_pickup"))
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order))
  }, () => callback([]))
}

// ═══ DRIVERS ═══

export interface Driver {
  id: string
  uid?: string
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

export async function getDrivers(): Promise<Driver[]> {
  const snap = await getDocs(collection(db, "drivers"))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Driver)
}

export async function createDriver(data: Omit<Driver, "id">) {
  return addDoc(collection(db, "drivers"), { ...data, createdAt: serverTimestamp() })
}

export async function registerRider(email: string, password: string, data: { name: string; phone: string }): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  await addDoc(collection(db, "drivers"), {
    uid: cred.user.uid,
    name: data.name,
    email,
    phone: data.phone,
    status: "pending" as any,
    isOnline: false,
    createdAt: serverTimestamp(),
  })
  return cred.user
}

export async function updateDriver(id: string, data: Partial<Omit<Driver, "id">>) {
  const ref = doc(db, "drivers", id)
  await updateDoc(ref, data as any)
}

export async function getRiderWalletBalance(driverId: string): Promise<number> {
  const ref = doc(db, "drivers", driverId)
  const snap = await getDoc(ref)
  return snap.exists() ? (snap.data().walletBalance || 0) : 0
}

export async function topUpRiderWallet(driverId: string, amount: number, transactionId: string) {
  const ref = doc(db, "drivers", driverId)
  const snap = await getDoc(ref)
  const current = snap.exists() ? (snap.data().walletBalance || 0) : 0
  await updateDoc(ref, { walletBalance: current + amount })
  await addDoc(collection(db, "walletTransactions"), {
    driverId,
    type: "topup",
    amount,
    transactionId,
    status: "completed",
    createdAt: serverTimestamp(),
  })
}

export async function deductRiderWallet(driverId: string, amount: number, orderId: string, note: string) {
  const ref = doc(db, "drivers", driverId)
  const snap = await getDoc(ref)
  const current = snap.exists() ? (snap.data().walletBalance || 0) : 0
  await updateDoc(ref, { walletBalance: current - amount })
  await addDoc(collection(db, "walletTransactions"), {
    driverId,
    type: "deduction",
    amount: -amount,
    orderId,
    note,
    status: "completed",
    createdAt: serverTimestamp(),
  })
}

export interface WalletTransaction {
  id: string
  driverId: string
  type: "topup" | "deduction"
  amount: number
  transactionId?: string
  orderId?: string
  note?: string
  status: string
  createdAt: Date | null
}

export async function getWalletTransactions(driverId?: string): Promise<WalletTransaction[]> {
  const q = driverId
    ? query(collection(db, "walletTransactions"), where("driverId", "==", driverId), orderBy("createdAt", "desc"))
    : query(collection(db, "walletTransactions"), orderBy("createdAt", "desc"))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as WalletTransaction)
}

export async function deleteDriver(id: string) {
  const ref = doc(db, "drivers", id)
  await deleteDoc(ref)
}

export async function setDriverOnline(driverId: string, isOnline: boolean) {
  const ref = doc(db, "drivers", driverId)
  await updateDoc(ref, { isOnline })
}

export async function updateDriverLiveLocation(driverId: string, lat: number, lng: number) {
  const ref = doc(db, "drivers", driverId)
  await updateDoc(ref, { lat, lng })
}

// ═══ RIDER WALLET ═══

export interface WalletEntry {
  id: string
  ownerId: string
  ownerType: "rider" | "partner"
  amount: number
  type: "earning" | "commission_deduction" | "bonus" | "deduction"
  orderId?: string
  service: "grocery" | "laundry"
  note: string
  createdAt: Date | null
}

export async function addWalletEntry(data: Omit<WalletEntry, "id" | "createdAt">) {
  await addDoc(collection(db, "wallet"), { ...data, createdAt: serverTimestamp() })
}

export async function getWalletEntries(ownerId: string, ownerType: "rider" | "partner"): Promise<WalletEntry[]> {
  const q = query(collection(db, "wallet"), where("ownerId", "==", ownerId), where("ownerType", "==", ownerType), orderBy("createdAt", "desc"))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as WalletEntry)
}

// Process commissions when order is delivered
export async function processOrderCommissions(orderId: string, service: "grocery" | "laundry", deliveryFee: number, orderTotal: number, riderId: string, partnerId?: string) {
  const settings = await getDeliverySettings()
  const riderPercent = settings.riderCommissionPercent || 20
  const partnerPercent = settings.partnerCommissionPercent || 15

  // Rider: earns delivery fee minus commission
  const riderDeduction = Math.round(deliveryFee * riderPercent / 100)
  const riderEarning = deliveryFee - riderDeduction
  await addWalletEntry({ ownerId: riderId, ownerType: "rider", amount: riderEarning, type: "earning", orderId, service, note: `Delivery fee ₱${deliveryFee} - ${riderPercent}% commission (₱${riderDeduction})` })
  await addWalletEntry({ ownerId: riderId, ownerType: "rider", amount: -riderDeduction, type: "commission_deduction", orderId, service, note: `${riderPercent}% platform commission` })

  // Partner (laundry only): earns service fee minus commission
  if (partnerId && service === "laundry") {
    const partnerDeduction = Math.round(orderTotal * partnerPercent / 100)
    const partnerEarning = orderTotal - partnerDeduction
    await addWalletEntry({ ownerId: partnerId, ownerType: "partner", amount: partnerEarning, type: "earning", orderId, service, note: `Order ₱${orderTotal} - ${partnerPercent}% commission (₱${partnerDeduction})` })
    await addWalletEntry({ ownerId: partnerId, ownerType: "partner", amount: -partnerDeduction, type: "commission_deduction", orderId, service, note: `${partnerPercent}% platform commission` })
  }
}

export async function findNearestOnlineDriver(targetLat: number, targetLng: number): Promise<Driver | null> {
  const snap = await getDocs(collection(db, "drivers"))
  const online = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Driver)
    .filter((d) => d.status === "active" && d.isOnline && d.lat && d.lng)

  if (online.length === 0) return null

  let nearest: Driver | null = null
  let minDist = Infinity
  for (const driver of online) {
    const R = 6371
    const dLat = (driver.lat! - targetLat) * Math.PI / 180
    const dLng = (driver.lng! - targetLng) * Math.PI / 180
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(targetLat * Math.PI / 180) * Math.cos(driver.lat! * Math.PI / 180) * Math.sin(dLng / 2) ** 2
    const km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    if (km < minDist) { minDist = km; nearest = driver }
  }
  return nearest
}

// ═══ PARTNER LAUNDROMAT ═══

export interface LaundryPartner {
  id: string
  uid: string
  shopName: string
  ownerName: string
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

export async function uploadPartnerLogo(partnerId: string, file: File): Promise<string> {
  const storageRef = ref(storage, `partners/${partnerId}/logo`)
  await uploadBytes(storageRef, file)
  const url = await getDownloadURL(storageRef)
  await updateDoc(doc(db, "partners", partnerId), { logoUrl: url })
  return url
}

export async function registerPartner(email: string, password: string, data: { shopName: string; ownerName: string; phone: string; address: string; landmark?: string; lat?: number; lng?: number }): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  const partnerData: any = {
    uid: cred.user.uid,
    shopName: data.shopName,
    ownerName: data.ownerName,
    email,
    phone: data.phone,
    address: data.address,
    status: "pending",
    isOnline: true,
    openTime: "08:00",
    closeTime: "20:00",
    openDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    createdAt: serverTimestamp(),
  }
  if (data.landmark) partnerData.landmark = data.landmark
  if (data.lat) partnerData.lat = data.lat
  if (data.lng) partnerData.lng = data.lng
  await addDoc(collection(db, "partners"), partnerData)
  return cred.user
}

export async function getPartnerProfile(uid: string): Promise<LaundryPartner | null> {
  const q = query(collection(db, "partners"), where("uid", "==", uid))
  const snap = await getDocs(q)
  if (snap.docs.length > 0) return { id: snap.docs[0].id, ...snap.docs[0].data() } as LaundryPartner
  return null
}

export async function getAllPartners(): Promise<LaundryPartner[]> {
  const snap = await getDocs(collection(db, "partners"))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as LaundryPartner)
}

export async function updatePartnerStatus(id: string, status: "pending" | "active" | "inactive") {
  const ref = doc(db, "partners", id)
  await updateDoc(ref, { status })
}

// ═══ PARTNER WALLET ═══

export async function getPartnerWalletBalance(partnerId: string): Promise<number> {
  const ref = doc(db, "partners", partnerId)
  const snap = await getDoc(ref)
  return snap.exists() ? (snap.data().walletBalance || 0) : 0
}

export interface PartnerWalletTransaction {
  id: string
  partnerId: string
  type: "topup" | "deduction"
  amount: number
  transactionId?: string
  orderId?: string
  note?: string
  createdAt: Date | null
}

export async function getPartnerWalletTransactions(partnerId?: string): Promise<PartnerWalletTransaction[]> {
  const q = partnerId
    ? query(collection(db, "partnerWalletTransactions"), where("partnerId", "==", partnerId), orderBy("createdAt", "desc"))
    : query(collection(db, "partnerWalletTransactions"), orderBy("createdAt", "desc"))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PartnerWalletTransaction)
}

export async function topUpPartnerWallet(partnerId: string, amount: number, transactionId: string) {
  const ref = doc(db, "partners", partnerId)
  const snap = await getDoc(ref)
  const current = snap.exists() ? (snap.data().walletBalance || 0) : 0
  await updateDoc(ref, { walletBalance: current + amount })
  await addDoc(collection(db, "partnerWalletTransactions"), {
    partnerId,
    type: "topup",
    amount,
    transactionId,
    note: "Wallet top-up",
    createdAt: serverTimestamp(),
  })
}

export async function deductPartnerWallet(partnerId: string, amount: number, orderId: string, note: string) {
  const ref = doc(db, "partners", partnerId)
  const snap = await getDoc(ref)
  const current = snap.exists() ? (snap.data().walletBalance || 0) : 0
  await updateDoc(ref, { walletBalance: current - amount })
  await addDoc(collection(db, "partnerWalletTransactions"), {
    partnerId,
    type: "deduction",
    amount: -amount,
    orderId,
    note,
    createdAt: serverTimestamp(),
  })
}

export async function adminAdjustPartnerWallet(partnerId: string, amount: number, note: string) {
  const ref = doc(db, "partners", partnerId)
  const snap = await getDoc(ref)
  const current = snap.exists() ? (snap.data().walletBalance || 0) : 0
  await updateDoc(ref, { walletBalance: current + amount })
  await addDoc(collection(db, "partnerWalletTransactions"), {
    partnerId,
    type: amount >= 0 ? "topup" : "deduction",
    amount,
    note,
    createdAt: serverTimestamp(),
  })
}

// ═══ CHAT ═══

export interface ChatMessage {
  id: string
  orderId: string
  senderId: string
  senderName: string
  senderRole: "customer" | "driver" | "admin"
  message: string
  createdAt: Date | null
}

export async function sendChatMessage(orderId: string, senderId: string, senderName: string, senderRole: "customer" | "driver" | "admin", message: string) {
  await addDoc(collection(db, "chats"), {
    orderId,
    senderId,
    senderName,
    senderRole,
    message,
    createdAt: serverTimestamp(),
  })
}

export function onChatMessages(orderId: string, callback: (messages: ChatMessage[]) => void) {
  const q = query(collection(db, "chats"), where("orderId", "==", orderId), orderBy("createdAt", "asc"))
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ChatMessage))
  }, () => callback([]))
}

// ═══ REPORTS ═══

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

export async function submitReport(data: Omit<Report, "id" | "createdAt" | "status">) {
  await addDoc(collection(db, "reports"), {
    ...data,
    status: "pending",
    createdAt: serverTimestamp(),
  })
}

export async function getAllReports(): Promise<Report[]> {
  const q = query(collection(db, "reports"), orderBy("createdAt", "desc"))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Report)
}

export async function updateReportStatus(reportId: string, status: "pending" | "reviewed" | "resolved") {
  const ref = doc(db, "reports", reportId)
  await updateDoc(ref, { status })
}

// ═══ CUSTOMER AUTH ═══

export interface SavedAddress {
  id: string
  label: string // "Home" | "Office" | "Other"
  address: string
  lat: number
  lng: number
}

export interface CustomerProfile {
  uid: string
  name: string
  phone: string
  email: string
  address?: string
  savedAddresses?: SavedAddress[]
  walletBalance?: number
  createdAt?: Date | null
}

export async function getAllCustomers(): Promise<CustomerProfile[]> {
  const snap = await getDocs(collection(db, "customers"))
  return snap.docs.map((d) => ({ ...d.data(), uid: d.data().uid || d.id }) as CustomerProfile)
}

export async function customerRegister(email: string, password: string, name: string, phone: string): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  await addDoc(collection(db, "customers"), {
    uid: cred.user.uid,
    name,
    phone,
    email,
    createdAt: serverTimestamp(),
  })
  return cred.user
}

export async function customerLogin(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password)
}

export async function customerLogout() {
  return signOut(auth)
}

// Phone OTP Auth
export function setupRecaptcha(elementId: string): RecaptchaVerifier {
  const verifier = new RecaptchaVerifier(auth, elementId, { size: "invisible" })
  return verifier
}

export async function sendOTP(phone: string, recaptchaVerifier: RecaptchaVerifier): Promise<ConfirmationResult> {
  return signInWithPhoneNumber(auth, phone, recaptchaVerifier)
}

export async function verifyOTP(confirmationResult: ConfirmationResult, code: string) {
  const result = await confirmationResult.confirm(code)
  return result.user
}

export async function ensureCustomerProfile(user: User, name?: string, email?: string) {
  const q = query(collection(db, "customers"), where("uid", "==", user.uid))
  const snap = await getDocs(q)
  if (snap.docs.length === 0) {
    await addDoc(collection(db, "customers"), {
      uid: user.uid,
      name: name || "",
      phone: user.phoneNumber || "",
      email: email || user.email || "",
      createdAt: serverTimestamp(),
    })
  } else if (name) {
    // Update name/email if provided and profile exists
    const ref = doc(db, "customers", snap.docs[0].id)
    const updates: Record<string, string> = {}
    if (name) updates.name = name
    if (email) updates.email = email
    await updateDoc(ref, updates)
  }
}

export async function getCustomerProfile(uid: string): Promise<CustomerProfile | null> {
  const q = query(collection(db, "customers"), where("uid", "==", uid))
  const snap = await getDocs(q)
  if (snap.docs.length > 0) return { ...snap.docs[0].data(), uid } as CustomerProfile
  return null
}

export async function updateCustomerProfile(uid: string, data: Partial<Omit<CustomerProfile, "uid">>) {
  const q = query(collection(db, "customers"), where("uid", "==", uid))
  const snap = await getDocs(q)
  if (snap.docs.length > 0) {
    const ref = doc(db, "customers", snap.docs[0].id)
    await updateDoc(ref, data)
  }
}

export function onCustomerAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback)
}

// ═══ RATINGS ═══

export async function rateOrder(orderId: string, data: { riderRating?: number; storeRating?: number; review?: string }) {
  const ref = doc(db, "orders", orderId)
  const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined))
  await updateDoc(ref, { ...clean, updatedAt: serverTimestamp() })
}

export async function getCustomerOrders(customerId: string): Promise<Order[]> {
  const q = query(collection(db, "orders"), where("customerId", "==", customerId), orderBy("createdAt", "desc"))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order)
}

// ═══ NOTIFICATIONS ═══

export interface AppNotification {
  id: string
  recipientType: "admin" | "driver" | "customer"
  recipientId?: string
  title: string
  message: string
  orderId?: string
  read: boolean
  createdAt: Date | null
}

export async function createNotification(notification: Omit<AppNotification, "id" | "createdAt">) {
  await addDoc(collection(db, "notifications"), {
    ...notification,
    createdAt: serverTimestamp(),
  })
}

export async function getNotifications(recipientType: string, recipientId?: string): Promise<AppNotification[]> {
  let q
  if (recipientId) {
    q = query(collection(db, "notifications"), where("recipientType", "==", recipientType), where("recipientId", "==", recipientId), orderBy("createdAt", "desc"))
  } else {
    q = query(collection(db, "notifications"), where("recipientType", "==", recipientType), orderBy("createdAt", "desc"))
  }
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }) as AppNotification)
}
export function onNotifications(recipientType: string, recipientId: string | undefined, callback: (notifications: AppNotification[]) => void) {
  let q
  if (recipientId) {
    q = query(collection(db, "notifications"), where("recipientType", "==", recipientType), where("recipientId", "==", recipientId), orderBy("createdAt", "desc"))
  } else {
    q = query(collection(db, "notifications"), where("recipientType", "==", recipientType), orderBy("createdAt", "desc"))
  }
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AppNotification))
  })
}

export async function markNotificationRead(notificationId: string) {
  const ref = doc(db, "notifications", notificationId)
  await updateDoc(ref, { read: true })
}

export async function markAllNotificationsRead(recipientType: string, recipientId?: string) {
  const notifications = await getNotifications(recipientType, recipientId)
  const unread = notifications.filter((n) => !n.read)
  await Promise.all(unread.map((n) => markNotificationRead(n.id)))
}

// Helper to send notifications on order events
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

// ═══ AUTH ═══

export async function adminLogin(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password)
}

export async function adminLogout() {
  return signOut(auth)
}

// ═══ CUSTOMER WALLET ═══

export async function getCustomerWalletBalance(uid: string): Promise<number> {
  const q = query(collection(db, "customers"), where("uid", "==", uid))
  const snap = await getDocs(q)
  if (snap.docs.length > 0) return snap.docs[0].data().walletBalance || 0
  return 0
}

export async function topUpCustomerWallet(uid: string, amount: number, transactionId: string) {
  const q = query(collection(db, "customers"), where("uid", "==", uid))
  const snap = await getDocs(q)
  if (snap.docs.length === 0) return
  const docRef = doc(db, "customers", snap.docs[0].id)
  const current = snap.docs[0].data().walletBalance || 0
  await updateDoc(docRef, { walletBalance: current + amount })
  await addDoc(collection(db, "customerWalletTransactions"), {
    customerId: uid,
    type: "topup",
    amount,
    transactionId,
    note: "Wallet top-up",
    createdAt: serverTimestamp(),
  })
}

export async function deductCustomerWallet(uid: string, amount: number, orderId: string, note: string) {
  const q = query(collection(db, "customers"), where("uid", "==", uid))
  const snap = await getDocs(q)
  if (snap.docs.length === 0) return
  const docRef = doc(db, "customers", snap.docs[0].id)
  const current = snap.docs[0].data().walletBalance || 0
  await updateDoc(docRef, { walletBalance: current - amount })
  await addDoc(collection(db, "customerWalletTransactions"), {
    customerId: uid,
    type: "deduction",
    amount: -amount,
    orderId,
    note,
    createdAt: serverTimestamp(),
  })
}

export async function adminAdjustCustomerWallet(uid: string, amount: number, note: string) {
  const q = query(collection(db, "customers"), where("uid", "==", uid))
  const snap = await getDocs(q)
  if (snap.docs.length === 0) return
  const docRef = doc(db, "customers", snap.docs[0].id)
  const current = snap.docs[0].data().walletBalance || 0
  await updateDoc(docRef, { walletBalance: current + amount })
  await addDoc(collection(db, "customerWalletTransactions"), {
    customerId: uid,
    type: amount >= 0 ? "topup" : "deduction",
    amount,
    note,
    createdAt: serverTimestamp(),
  })
}

export interface CustomerWalletTransaction {
  id: string
  customerId: string
  type: "topup" | "deduction"
  amount: number
  transactionId?: string
  orderId?: string
  note?: string
  createdAt: Date | null
}

export async function getCustomerWalletTransactions(customerId?: string): Promise<CustomerWalletTransaction[]> {
  const q = customerId
    ? query(collection(db, "customerWalletTransactions"), where("customerId", "==", customerId), orderBy("createdAt", "desc"))
    : query(collection(db, "customerWalletTransactions"), orderBy("createdAt", "desc"))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CustomerWalletTransaction)
}

// ═══ LISTING MODE ═══

export interface ListingModeConfig {
  defaultMode: "free" | "wallet_required"
  defaultMinBalance: number
}

export async function getListingModeConfig(): Promise<ListingModeConfig> {
  const ref = doc(db, "appSettings", "listingMode")
  const snap = await getDoc(ref)
  if (snap.exists()) return { defaultMode: "free", defaultMinBalance: 100, ...snap.data() } as ListingModeConfig
  return { defaultMode: "free", defaultMinBalance: 100 }
}

export async function updateListingModeConfig(config: ListingModeConfig) {
  const ref = doc(db, "appSettings", "listingMode")
  await setDoc(ref, config)
}

// Per-partner listing override (stored on partner doc)
export async function updatePartnerListingMode(partnerId: string, listingMode: "free" | "wallet_required", minimumBalance: number) {
  const ref = doc(db, "partners", partnerId)
  await updateDoc(ref, { listingMode, minimumBalance })
}

export function isPartnerVisible(partner: LaundryPartner, config: ListingModeConfig): boolean {
  const mode = partner.listingMode || config.defaultMode
  if (mode === "free") return true
  const minBal = partner.minimumBalance ?? config.defaultMinBalance
  return (partner.walletBalance || 0) >= minBal
}

// ═══ HOME SERVICE PROVIDERS ═══

export interface HomeServiceProvider {
  id: string
  uid: string
  shopName: string
  ownerName: string
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

export async function registerHomeServiceProvider(email: string, password: string, data: { shopName: string; ownerName: string; phone: string; address: string; skills?: string[]; landmark?: string; lat?: number; lng?: number }): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  const providerData: any = {
    uid: cred.user.uid,
    shopName: data.shopName,
    ownerName: data.ownerName,
    email,
    phone: data.phone,
    address: data.address,
    skills: data.skills || [],
    status: "pending",
    isOnline: true,
    openTime: "08:00",
    closeTime: "18:00",
    openDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    walletBalance: 0,
    createdAt: serverTimestamp(),
  }
  if (data.landmark) providerData.landmark = data.landmark
  if (data.lat) providerData.lat = data.lat
  if (data.lng) providerData.lng = data.lng
  await addDoc(collection(db, "homeServiceProviders"), providerData)
  return cred.user
}

export async function getHomeServiceProviderProfile(uid: string): Promise<HomeServiceProvider | null> {
  const q = query(collection(db, "homeServiceProviders"), where("uid", "==", uid))
  const snap = await getDocs(q)
  if (snap.docs.length > 0) return { id: snap.docs[0].id, ...snap.docs[0].data() } as HomeServiceProvider
  return null
}

export async function getAllHomeServiceProviders(): Promise<HomeServiceProvider[]> {
  const snap = await getDocs(collection(db, "homeServiceProviders"))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as HomeServiceProvider)
}

export async function updateHomeServiceProvider(id: string, data: Partial<Omit<HomeServiceProvider, "id">>) {
  const ref = doc(db, "homeServiceProviders", id)
  await updateDoc(ref, data as any)
}

export async function updateHomeServiceProviderListingMode(providerId: string, listingMode: "free" | "wallet_required", minimumBalance: number) {
  const ref = doc(db, "homeServiceProviders", providerId)
  await updateDoc(ref, { listingMode, minimumBalance })
}

export async function uploadHomeServiceProviderLogo(providerId: string, file: File): Promise<string> {
  const storageRef = ref(storage, `homeServiceProviders/${providerId}/logo`)
  await uploadBytes(storageRef, file)
  const url = await getDownloadURL(storageRef)
  await updateDoc(doc(db, "homeServiceProviders", providerId), { logoUrl: url })
  return url
}

export async function getHomeServiceProviderWalletBalance(providerId: string): Promise<number> {
  const ref = doc(db, "homeServiceProviders", providerId)
  const snap = await getDoc(ref)
  return snap.exists() ? (snap.data().walletBalance || 0) : 0
}

export interface ProviderWalletTransaction {
  id: string
  providerId: string
  type: "topup" | "earning" | "commission" | "deduction"
  amount: number
  transactionId?: string
  jobId?: string
  note?: string
  createdAt: Date | null
}

export async function getProviderWalletTransactions(providerId: string): Promise<ProviderWalletTransaction[]> {
  const q = query(collection(db, "providerWalletTransactions"), where("providerId", "==", providerId), orderBy("createdAt", "desc"))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ProviderWalletTransaction)
}

export async function topUpProviderWallet(providerId: string, amount: number, transactionId: string) {
  const ref = doc(db, "homeServiceProviders", providerId)
  const snap = await getDoc(ref)
  const current = snap.exists() ? (snap.data().walletBalance || 0) : 0
  await updateDoc(ref, { walletBalance: current + amount })
  await addDoc(collection(db, "providerWalletTransactions"), {
    providerId, type: "topup", amount, transactionId, note: "Wallet top-up", createdAt: serverTimestamp(),
  })
}

export async function addProviderEarning(providerId: string, amount: number, commission: number, jobId: string, note: string) {
  const ref = doc(db, "homeServiceProviders", providerId)
  const snap = await getDoc(ref)
  const current = snap.exists() ? (snap.data().walletBalance || 0) : 0
  const net = amount - commission
  await updateDoc(ref, { walletBalance: current + net })
  await addDoc(collection(db, "providerWalletTransactions"), {
    providerId, type: "earning", amount: net, jobId, note, createdAt: serverTimestamp(),
  })
  await addDoc(collection(db, "providerWalletTransactions"), {
    providerId, type: "commission", amount: -commission, jobId, note: `Platform commission`, createdAt: serverTimestamp(),
  })
}

// ═══ AUTO COMMISSION DEDUCTION ON DELIVERY ═══

export async function deductRiderCommissionOnDelivery(driverId: string, orderId: string, deliveryFee: number) {
  const settings = await getDeliverySettings()
  const percent = settings.riderCommissionPercent || 20
  const commission = Math.round(deliveryFee * percent / 100)
  if (commission <= 0) return
  await deductRiderWallet(driverId, commission, orderId, `${percent}% commission on ₱${deliveryFee} delivery fee`)
}

export async function deductPartnerCommissionOnDelivery(partnerId: string, orderId: string, serviceTotal: number) {
  const settings = await getDeliverySettings()
  const percent = settings.partnerCommissionPercent || 15
  const commission = Math.round(serviceTotal * percent / 100)
  if (commission <= 0) return
  await deductPartnerWallet(partnerId, commission, orderId, `${percent}% commission on ₱${serviceTotal} service`)
}

export async function deductProviderCommissionOnCompletion(providerId: string, jobId: string, jobTotal: number) {
  const settings = await getDeliverySettings()
  const percent = settings.partnerCommissionPercent || 15
  const commission = Math.round(jobTotal * percent / 100)
  if (commission <= 0) return
  const ref = doc(db, "homeServiceProviders", providerId)
  const snap = await getDoc(ref)
  const current = snap.exists() ? (snap.data().walletBalance || 0) : 0
  await updateDoc(ref, { walletBalance: current - commission })
  await addDoc(collection(db, "providerWalletTransactions"), {
    providerId, type: "commission", amount: -commission, jobId, note: `${percent}% platform commission on ₱${jobTotal}`, createdAt: serverTimestamp(),
  })
}

export function isHomeServiceProviderVisible(provider: HomeServiceProvider, config: ListingModeConfig): boolean {
  const mode = provider.listingMode || config.defaultMode
  if (mode === "free") return true
  const minBal = provider.minimumBalance ?? config.defaultMinBalance
  return (provider.walletBalance || 0) >= minBal
}

// ═══ PAYMENT METHODS CONFIG ═══

export type PaymentMethodsConfig = {
  cod: boolean
  wallet: boolean
  qrph: boolean
  ewallet: boolean
  bank: boolean
  xendit: boolean
}

export async function getPaymentMethodsConfig(): Promise<PaymentMethodsConfig> {
  const ref = doc(db, "appSettings", "paymentMethods")
  const snap = await getDoc(ref)
  if (snap.exists()) return { cod: true, wallet: true, qrph: true, ewallet: true, bank: true, xendit: true, ...snap.data() } as PaymentMethodsConfig
  return { cod: true, wallet: true, qrph: true, ewallet: true, bank: true, xendit: true }
}

// ═══ HOME SERVICE JOBS ═══

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

export async function createServiceJob(job: Omit<ServiceJob, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const docRef = await addDoc(collection(db, "serviceJobs"), {
    ...job,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return docRef.id
}

export async function getServiceJob(jobId: string): Promise<ServiceJob | null> {
  const ref = doc(db, "serviceJobs", jobId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as ServiceJob
}

export async function getProviderPendingJobs(providerId: string): Promise<ServiceJob[]> {
  const q = query(collection(db, "serviceJobs"), where("status", "==", "pending"), orderBy("createdAt", "desc"))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ServiceJob)
}

export async function getProviderJobs(providerId: string): Promise<ServiceJob[]> {
  const q = query(collection(db, "serviceJobs"), where("providerId", "==", providerId), orderBy("createdAt", "desc"))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ServiceJob)
}

export function onProviderJobsUpdate(providerId: string, callback: (jobs: ServiceJob[]) => void) {
  const q = query(collection(db, "serviceJobs"), where("providerId", "==", providerId), orderBy("createdAt", "desc"))
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ServiceJob))
  }, () => callback([]))
}

export async function updateServiceJobStatus(jobId: string, status: string, providerId?: string) {
  const ref = doc(db, "serviceJobs", jobId)
  const update: any = { status, updatedAt: serverTimestamp() }
  if (providerId) update.providerId = providerId
  await updateDoc(ref, update)
}

export { db, auth }


