"use client"
import { useEffect, useState, useRef } from "react"
import { getUser } from "@/lib/auth"

type Restaurant = {
  id: string; name: string; description?: string; logoUrl?: string; coverUrl?: string
  cuisine: string; address: string; deliveryFee: number; minOrder: number
  estimatedTime: string; rating: number; ratingCount: number; isOpen: boolean
  featured: boolean; menuItems: MenuItem[]
}
type MenuItem = {
  id: string; name: string; description?: string; price: number; imageUrl?: string
  category: string; available: boolean; featured: boolean; spicy: boolean; vegetarian: boolean
}
type CartItem = { item: MenuItem; quantity: number; restaurantId: string; restaurantName: string }

const CUISINES = ["All","Filipino","BBQ","Fastfood","Chinese","Japanese","Desserts","Drinks"]


export default function FoodPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [cuisine, setCuisine] = useState("All")
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Restaurant | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [activeCategory, setActiveCategory] = useState("")
  const [user, setUser] = useState<any>(null)
  const [checkoutForm, setCheckoutForm] = useState({ name:"", phone:"", address:"", notes:"", paymentMethod:"cod" })
  const [submitting, setSubmitting] = useState(false)
  const [orderId, setOrderId] = useState<string|null>(null)
  const [addedAnim, setAddedAnim] = useState<string|null>(null)
  const categoryRefs = useRef<Record<string,HTMLDivElement|null>>({})

  useEffect(() => {
    const u = getUser(); if (u) { setUser(u); setCheckoutForm(f=>({...f,name:u.name||"",phone:u.phone||""})) }
  }, [])

  useEffect(() => {
    setLoading(true)
    const q = cuisine !== "All" ? `?cuisine=${cuisine}` : ""
    fetch(`/api/food-restaurants${q}`).then(r=>r.ok?r.json():[]).then(setRestaurants).finally(()=>setLoading(false))
  }, [cuisine])

  const filtered = restaurants.filter(r => r.name.toLowerCase().includes(search.toLowerCase()))

  const cartTotal = cart.reduce((s,c)=>s+c.item.price*c.quantity,0)
  const cartCount = cart.reduce((s,c)=>s+c.quantity,0)
  const cartRestaurant = cart[0]?.restaurantId || null

  const addToCart = (item: MenuItem, restaurant: Restaurant) => {
    if (cartRestaurant && cartRestaurant !== restaurant.id) {
      if (!confirm("Your cart has items from another restaurant. Clear and start new?")) return
      setCart([])
    }
    setCart(prev => {
      const ex = prev.find(c=>c.item.id===item.id)
      if (ex) return prev.map(c=>c.item.id===item.id?{...c,quantity:c.quantity+1}:c)
      return [...prev,{item,quantity:1,restaurantId:restaurant.id,restaurantName:restaurant.name}]
    })
    setAddedAnim(item.id)
    setTimeout(()=>setAddedAnim(null),600)
  }

  const updateQty = (itemId: string, delta: number) => {
    setCart(prev=>prev.map(c=>c.item.id===itemId?{...c,quantity:Math.max(0,c.quantity+delta)}:c).filter(c=>c.quantity>0))
  }

  const categories = selected ? [...new Set(selected.menuItems.map(m=>m.category))] : []

  const scrollToCategory = (cat: string) => {
    setActiveCategory(cat)
    categoryRefs.current[cat]?.scrollIntoView({behavior:"smooth",block:"start"})
  }


  const handleOrder = async () => {
    if (!checkoutForm.name||!checkoutForm.phone||!checkoutForm.address) return
    setSubmitting(true)
    try {
      const restaurant = restaurants.find(r=>r.id===cartRestaurant)
      const res = await fetch("/api/food-orders",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          restaurantId: cartRestaurant,
          customerId: user?.id||null,
          customerName: checkoutForm.name,
          customerPhone: checkoutForm.phone,
          deliveryAddress: checkoutForm.address,
          items: cart.map(c=>({id:c.item.id,name:c.item.name,price:c.item.price,quantity:c.quantity,imageUrl:c.item.imageUrl})),
          notes: checkoutForm.notes,
          paymentMethod: checkoutForm.paymentMethod,
        })
      })
      if (!res.ok) { alert("Order failed"); return }
      const order = await res.json()
      setOrderId(order.id)
      setCart([])
      setShowCheckout(false)
      setShowCart(false)
    } finally { setSubmitting(false) }
  }

  if (orderId) return (
    <main className="min-h-screen bg-[#F4F5F7] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-sm">
        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">🎉</div>
        <h2 className="font-black text-xl text-gray-800">Order Placed!</h2>
        <p className="text-sm text-gray-500 mt-2">Your food is being prepared. Estimated delivery: {selected?.estimatedTime || "20-35 min"}</p>
        <p className="text-xs text-gray-400 mt-1 font-mono">#{orderId.slice(-8).toUpperCase()}</p>
        <div className="flex gap-2 mt-6">
          <button onClick={()=>{setOrderId(null);setSelected(null)}} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-bold">Order More</button>
          <a href="/" className="flex-1 bg-orange-500 text-white py-3 rounded-xl text-sm font-bold text-center">Go Home</a>
        </div>
      </div>
    </main>
  )


  return (
    <main className="min-h-screen bg-[#F4F5F7]">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <a href="/" className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          </a>
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input type="text" placeholder="Search restaurants or dishes..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full bg-gray-100 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-orange-400 transition-all"/>
          </div>
          {cartCount > 0 && (
            <button onClick={()=>setShowCart(true)} className="relative bg-orange-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-orange-600 transition-colors shadow-md">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"/></svg>
              <span className="hidden sm:inline">Cart</span>
              <span className="bg-white text-orange-500 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">{cartCount}</span>
            </button>
          )}
        </div>
        {/* Cuisine pills */}
        <div className="max-w-5xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {CUISINES.map(c=>(
            <button key={c} onClick={()=>setCuisine(c)} className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${cuisine===c?"bg-orange-500 border-orange-500 text-white":"bg-white border-gray-200 text-gray-600 hover:border-orange-300"}`}>{c}</button>
          ))}
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-4">
        {/* Hero banner */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-5 md:p-8 mb-5 text-white relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full"/>
          <div className="absolute -right-4 bottom-0 w-24 h-24 bg-white/5 rounded-full"/>
          <p className="text-xs font-bold uppercase tracking-widest opacity-80">🍔 Food to Go</p>
          <h1 className="text-2xl md:text-3xl font-black mt-1">Hungry? <span className="text-yellow-300">Order Now</span></h1>
          <p className="text-sm opacity-80 mt-1">Fast delivery from your favorite local restaurants</p>
        </div>

        {/* Restaurant grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_,i)=><div key={i} className="bg-white rounded-2xl h-52 animate-pulse"/>)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center">
            <p className="text-5xl mb-3">🍽️</p>
            <p className="font-bold text-gray-600">No restaurants found</p>
            <p className="text-xs text-gray-400 mt-1">Try a different cuisine or search term</p>
          </div>
        ) : (
          <>
            {filtered.some(r=>r.featured) && (
              <div className="mb-5">
                <h2 className="font-black text-base text-gray-800 mb-3">⭐ Featured</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filtered.filter(r=>r.featured).map(r=><RestaurantCard key={r.id} restaurant={r} onSelect={setSelected}/>)}
                </div>
              </div>
            )}
            <h2 className="font-black text-base text-gray-800 mb-3">🏪 All Restaurants</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.filter(r=>!r.featured).map(r=><RestaurantCard key={r.id} restaurant={r} onSelect={setSelected}/>)}
            </div>
          </>
        )}
      </div>


      {/* Restaurant Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-[#F4F5F7]" style={{animation:"slideUp 0.2s ease-out"}}>
          {/* Restaurant Header */}
          <div className="relative shrink-0">
            <div className="h-44 md:h-56 bg-gray-200 relative overflow-hidden">
              {selected.coverUrl
                ? <img src={selected.coverUrl} className="w-full h-full object-cover"/>
                : <div className="w-full h-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-6xl">🍽️</div>
              }
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"/>
              <button onClick={()=>setSelected(null)} className="absolute top-4 left-4 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow-md">
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
              </button>
              {cartCount > 0 && (
                <button onClick={()=>setShowCart(true)} className="absolute top-4 right-4 bg-orange-500 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-md">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"/></svg>
                  {cartCount} • ₱{cartTotal.toFixed(0)}
                </button>
              )}
            </div>
            {/* Info bar */}
            <div className="bg-white px-4 py-4 shadow-sm">
              <div className="flex items-start gap-3">
                {selected.logoUrl && <img src={selected.logoUrl} className="w-14 h-14 rounded-xl object-cover border border-gray-100 shadow-sm shrink-0"/>}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-black text-lg text-gray-900">{selected.name}</h2>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${selected.isOpen?"bg-green-100 text-green-700":"bg-red-100 text-red-600"}`}>{selected.isOpen?"OPEN":"CLOSED"}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{selected.cuisine} • {selected.address}</p>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="flex items-center gap-1 text-xs text-gray-600"><span className="text-yellow-400">★</span>{selected.rating>0?selected.rating.toFixed(1):"New"}{selected.ratingCount>0&&<span className="text-gray-400">({selected.ratingCount})</span>}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-600">🕐 {selected.estimatedTime}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-600">🛵 ₱{selected.deliveryFee} delivery</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-600">Min ₱{selected.minOrder}</span>
                  </div>
                </div>
              </div>
              {/* Category tabs */}
              {categories.length > 1 && (
                <div className="flex gap-2 overflow-x-auto scrollbar-hide mt-3 -mx-1 px-1">
                  {categories.map(cat=>(
                    <button key={cat} onClick={()=>scrollToCategory(cat)} className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${activeCategory===cat?"bg-orange-500 border-orange-500 text-white":"bg-white border-gray-200 text-gray-600"}`}>{cat}</button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Menu */}
          <div className="flex-1 overflow-y-auto pb-32">
            <div className="max-w-2xl mx-auto px-4 py-4 space-y-6">
              {categories.map(cat=>{
                const items = selected.menuItems.filter(m=>m.category===cat&&m.available)
                if (!items.length) return null
                return (
                  <div key={cat} ref={el=>{categoryRefs.current[cat]=el}}>
                    <h3 className="font-black text-base text-gray-800 mb-3 sticky top-0 bg-[#F4F5F7] py-1">{cat}</h3>
                    <div className="space-y-3">
                      {items.map(item=>{
                        const qty = cart.find(c=>c.item.id===item.id)?.quantity||0
                        return (
                          <div key={item.id} className={`bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex transition-all ${addedAnim===item.id?"scale-[1.02] shadow-md":""}`}>
                            <div className="flex-1 p-4">
                              <div className="flex items-start gap-2 mb-1">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <p className="font-bold text-sm text-gray-800">{item.name}</p>
                                    {item.featured&&<span className="text-[9px] bg-orange-100 text-orange-600 font-bold px-1.5 py-0.5 rounded-full">POPULAR</span>}
                                    {item.spicy&&<span className="text-[9px]">🌶️</span>}
                                    {item.vegetarian&&<span className="text-[9px]">🥦</span>}
                                  </div>
                                  {item.description&&<p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2">{item.description}</p>}
                                </div>
                              </div>
                              <div className="flex items-center justify-between mt-2">
                                <span className="font-black text-base text-orange-500">₱{item.price.toFixed(2)}</span>
                                {qty===0?(
                                  <button onClick={()=>addToCart(item,selected)} className="bg-orange-500 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors shadow-sm text-lg font-bold">+</button>
                                ):(
                                  <div className="flex items-center gap-2">
                                    <button onClick={()=>updateQty(item.id,-1)} className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 font-bold flex items-center justify-center hover:bg-gray-200">−</button>
                                    <span className="font-black text-sm w-5 text-center">{qty}</span>
                                    <button onClick={()=>addToCart(item,selected)} className="w-8 h-8 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center hover:bg-orange-600">+</button>
                                  </div>
                                )}
                              </div>
                            </div>
                            {item.imageUrl&&(
                              <div className="w-28 h-28 shrink-0 relative">
                                <img src={item.imageUrl} className="w-full h-full object-cover"/>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Sticky cart bar */}
          {cartCount>0&&cartRestaurant===selected.id&&(
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-2xl z-10">
              <div className="max-w-2xl mx-auto">
                <button onClick={()=>setShowCart(true)} className="w-full bg-orange-500 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-between px-5 hover:bg-orange-600 transition-colors shadow-lg">
                  <span className="bg-orange-600 text-white text-xs font-black w-6 h-6 rounded-full flex items-center justify-center">{cartCount}</span>
                  <span>View Cart</span>
                  <span>₱{cartTotal.toFixed(2)}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}


      {/* Cart Drawer */}
      {showCart&&(
        <div className="fixed inset-0 z-[200] flex justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={()=>setShowCart(false)}/>
          <div className="relative w-full max-w-sm bg-white h-full flex flex-col shadow-2xl">
            <div className="bg-orange-500 px-5 py-4 flex items-center justify-between shrink-0">
              <div>
                <h2 className="font-black text-lg text-white">Your Order</h2>
                <p className="text-white/70 text-xs">{cart[0]?.restaurantName}</p>
              </div>
              <button onClick={()=>setShowCart(false)} className="text-white/70 hover:text-white text-2xl">&times;</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.map(c=>(
                <div key={c.item.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                  {c.item.imageUrl&&<img src={c.item.imageUrl} className="w-12 h-12 rounded-lg object-cover shrink-0"/>}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{c.item.name}</p>
                    <p className="text-orange-500 font-black text-sm">₱{(c.item.price*c.quantity).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={()=>updateQty(c.item.id,-1)} className="w-7 h-7 rounded-full bg-gray-200 text-gray-700 font-bold text-sm flex items-center justify-center">−</button>
                    <span className="text-sm font-bold w-5 text-center">{c.quantity}</span>
                    <button onClick={()=>updateQty(c.item.id,1)} className="w-7 h-7 rounded-full bg-orange-500 text-white font-bold text-sm flex items-center justify-center">+</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 p-4 bg-white shrink-0 space-y-3">
              {(() => {
                const r = restaurants.find(r=>r.id===cartRestaurant)
                return (
                  <>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>₱{cartTotal.toFixed(2)}</span></div>
                      <div className="flex justify-between text-gray-600"><span>Delivery fee</span><span>₱{r?.deliveryFee.toFixed(2)||"0.00"}</span></div>
                      <div className="flex justify-between font-black text-base pt-1 border-t border-gray-100"><span>Total</span><span className="text-orange-500">₱{(cartTotal+(r?.deliveryFee||0)).toFixed(2)}</span></div>
                    </div>
                    {cartTotal < (r?.minOrder||0) && <p className="text-xs text-red-500 font-medium">Minimum order is ₱{r?.minOrder}. Add ₱{((r?.minOrder||0)-cartTotal).toFixed(2)} more.</p>}
                    <button onClick={()=>{setShowCart(false);setShowCheckout(true)}} disabled={cartTotal<(r?.minOrder||0)} className="w-full bg-orange-500 text-white py-3.5 rounded-xl font-black text-sm hover:bg-orange-600 transition-colors disabled:opacity-40">
                      Proceed to Checkout →
                    </button>
                  </>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout&&(
        <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={()=>setShowCheckout(false)}/>
          <div className="relative bg-white rounded-t-3xl md:rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl" style={{animation:"slideUp 0.25s ease-out"}}>
            <div className="bg-orange-500 px-6 py-4 flex items-center justify-between">
              <div><h2 className="font-black text-lg text-white">Checkout</h2><p className="text-white/70 text-xs">Complete your delivery details</p></div>
              <button onClick={()=>setShowCheckout(false)} className="text-white/70 text-2xl">&times;</button>
            </div>
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-3">
                <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Contact</p>
                <input placeholder="Full Name" value={checkoutForm.name} onChange={e=>setCheckoutForm(f=>({...f,name:e.target.value}))} className="w-full border-2 border-gray-100 focus:border-orange-400 rounded-xl px-4 py-3 text-sm outline-none"/>
                <input type="tel" placeholder="Phone Number" value={checkoutForm.phone} onChange={e=>setCheckoutForm(f=>({...f,phone:e.target.value}))} className="w-full border-2 border-gray-100 focus:border-orange-400 rounded-xl px-4 py-3 text-sm outline-none"/>
              </div>
              <div className="space-y-3">
                <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Delivery Address</p>
                <textarea placeholder="Street, barangay, city..." value={checkoutForm.address} onChange={e=>setCheckoutForm(f=>({...f,address:e.target.value}))} className="w-full border-2 border-gray-100 focus:border-orange-400 rounded-xl px-4 py-3 text-sm outline-none resize-none" rows={2}/>
                <input placeholder="Special instructions (optional)" value={checkoutForm.notes} onChange={e=>setCheckoutForm(f=>({...f,notes:e.target.value}))} className="w-full border-2 border-gray-100 focus:border-orange-400 rounded-xl px-4 py-3 text-sm outline-none"/>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Payment</p>
                {[{v:"cod",label:"Cash on Delivery",icon:"💵"},{v:"wallet",label:"Wallet",icon:"👛"}].map(pm=>(
                  <label key={pm.v} className={`flex items-center gap-3 border-2 rounded-xl px-4 py-3 cursor-pointer ${checkoutForm.paymentMethod===pm.v?"border-orange-400 bg-orange-50":"border-gray-100"}`}>
                    <input type="radio" name="pm" value={pm.v} checked={checkoutForm.paymentMethod===pm.v} onChange={()=>setCheckoutForm(f=>({...f,paymentMethod:pm.v}))} className="accent-orange-500"/>
                    <span className="text-xl">{pm.icon}</span>
                    <span className="text-sm font-bold">{pm.label}</span>
                  </label>
                ))}
              </div>
              {(()=>{
                const r = restaurants.find(r=>r.id===cartRestaurant)
                return (
                  <div className="bg-gray-50 rounded-xl p-4 space-y-1.5 text-sm">
                    <div className="flex justify-between text-gray-600"><span>Subtotal ({cartCount} items)</span><span>₱{cartTotal.toFixed(2)}</span></div>
                    <div className="flex justify-between text-gray-600"><span>Delivery fee</span><span>₱{r?.deliveryFee.toFixed(2)||"0.00"}</span></div>
                    <div className="flex justify-between font-black text-base pt-2 border-t border-gray-200"><span>Total</span><span className="text-orange-500">₱{(cartTotal+(r?.deliveryFee||0)).toFixed(2)}</span></div>
                  </div>
                )
              })()}
            </div>
            <div className="px-5 py-4 border-t bg-gray-50 shrink-0">
              <button onClick={handleOrder} disabled={submitting||!checkoutForm.name||!checkoutForm.phone||!checkoutForm.address} className="w-full bg-orange-500 text-white py-4 rounded-xl font-black text-sm hover:bg-orange-600 transition-colors disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg">
                {submitting?<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Placing Order...</>:<>🍔 Place Order • ₱{(cartTotal+(restaurants.find(r=>r.id===cartRestaurant)?.deliveryFee||0)).toFixed(2)}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideUp { from { transform:translateY(100%); opacity:0; } to { transform:translateY(0); opacity:1; } }
      `}</style>
    </main>
  )
}


function RestaurantCard({ restaurant, onSelect }: { restaurant: Restaurant; onSelect: (r: Restaurant) => void }) {
  return (
    <button onClick={()=>onSelect(restaurant)} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all text-left border border-gray-100 hover:-translate-y-0.5 w-full">
      <div className="relative h-36 bg-gray-100 overflow-hidden">
        {restaurant.coverUrl
          ? <img src={restaurant.coverUrl} className="w-full h-full object-cover"/>
          : <div className="w-full h-full bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center text-5xl">🍽️</div>
        }
        {restaurant.featured&&<span className="absolute top-3 left-3 bg-orange-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow">⭐ Featured</span>}
        {!restaurant.isOpen&&<div className="absolute inset-0 bg-black/50 flex items-center justify-center"><span className="bg-black/70 text-white text-xs font-bold px-3 py-1.5 rounded-full">CLOSED</span></div>}
        <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-bold px-2.5 py-1 rounded-full shadow">🕐 {restaurant.estimatedTime}</div>
      </div>
      <div className="p-4">
        <div className="flex items-start gap-3">
          {restaurant.logoUrl&&<img src={restaurant.logoUrl} className="w-10 h-10 rounded-xl object-cover border border-gray-100 shrink-0"/>}
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-sm text-gray-900 truncate">{restaurant.name}</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">{restaurant.cuisine}</p>
          </div>
          {restaurant.rating>0&&(
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-yellow-400 text-sm">★</span>
              <span className="text-xs font-bold text-gray-700">{restaurant.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
        {restaurant.description&&<p className="text-[11px] text-gray-500 mt-2 line-clamp-1">{restaurant.description}</p>}
        <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-50">
          <span className="text-[11px] text-gray-500">🛵 ₱{restaurant.deliveryFee} delivery</span>
          <span className="text-gray-300">•</span>
          <span className="text-[11px] text-gray-500">Min ₱{restaurant.minOrder}</span>
          <span className="text-gray-300">•</span>
          <span className="text-[11px] text-gray-500 capitalize">{restaurant.cuisine}</span>
        </div>
      </div>
    </button>
  )
}
