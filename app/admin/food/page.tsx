"use client"
import { useEffect, useState } from "react"

type AdminTab = "restaurants" | "orders" | "menu"

const STATUS_COLORS: Record<string,string> = {
  pending:"bg-yellow-100 text-yellow-700", confirmed:"bg-blue-100 text-blue-700",
  preparing:"bg-purple-100 text-purple-700", ready_for_pickup:"bg-orange-100 text-orange-700",
  out_for_delivery:"bg-indigo-100 text-indigo-700", delivered:"bg-green-100 text-green-700",
  cancelled:"bg-red-100 text-red-600", rejected:"bg-red-100 text-red-600",
}

export default function AdminFoodPage() {
  const [tab, setTab] = useState<AdminTab>("restaurants")
  const [restaurants, setRestaurants] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null)
  const [showRestaurantForm, setShowRestaurantForm] = useState(false)
  const [showMenuForm, setShowMenuForm] = useState(false)
  const [editingMenuItem, setEditingMenuItem] = useState<any>(null)
  const [drivers, setDrivers] = useState<any[]>([])
  const [expandedOrder, setExpandedOrder] = useState<string|null>(null)
  const [orderFilter, setOrderFilter] = useState("all")

  const [rForm, setRForm] = useState({
    name:"", description:"", cuisine:"Filipino", address:"",
    deliveryFee:"49", minOrder:"100", estimatedTime:"20-35 min",
    openTime:"08:00", closeTime:"22:00", commissionPct:"10",
    isOpen:true, featured:false, logoUrl:"", coverUrl:"",
    ownerName:"", ownerPhone:"",
  })
  const [mForm, setMForm] = useState({
    name:"", description:"", price:"", category:"Main",
    imageUrl:"", available:true, featured:false, spicy:false, vegetarian:false,
  })
  const [savingR, setSavingR] = useState(false)
  const [savingM, setSavingM] = useState(false)

  const load = async () => {
    setLoading(true)
    const [r, o, d] = await Promise.all([
      fetch("/api/food-restaurants?status=all").then(r=>r.ok?r.json():[]).catch(()=>[]),
      fetch("/api/food-orders").then(r=>r.ok?r.json():[]).catch(()=>[]),
      fetch("/api/users?role=driver").then(r=>r.ok?r.json():[]).catch(()=>[]),
    ])
    setRestaurants(Array.isArray(r)?r:[])
    setOrders(Array.isArray(o)?o:[])
    setDrivers(Array.isArray(d)?d.filter((x:any)=>x.status==="active"):[])
    setLoading(false)
  }

  useEffect(()=>{ load() },[])

  const stats = {
    total: restaurants.length,
    active: restaurants.filter(r=>r.status==="active").length,
    pending: restaurants.filter(r=>r.status==="pending").length,
    todayOrders: orders.filter(o=>new Date(o.createdAt).toDateString()===new Date().toDateString()).length,
  }


  const saveRestaurant = async () => {
    setSavingR(true)
    try {
      const payload = {
        ...rForm,
        deliveryFee: Number(rForm.deliveryFee),
        minOrder: Number(rForm.minOrder),
        commissionPct: Number(rForm.commissionPct),
        status: "active",
      }
      if (selectedRestaurant?.id) {
        await fetch(`/api/food-restaurants/${selectedRestaurant.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)})
      } else {
        await fetch("/api/food-restaurants",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)})
      }
      setShowRestaurantForm(false)
      setSelectedRestaurant(null)
      load()
    } finally { setSavingR(false) }
  }

  const saveMenuItem = async () => {
    if (!selectedRestaurant) return
    setSavingM(true)
    try {
      const payload = { menuItem: { ...mForm, price: Number(mForm.price), ...(editingMenuItem?.id?{id:editingMenuItem.id}:{}) } }
      await fetch(`/api/food-restaurants/${selectedRestaurant.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)})
      setShowMenuForm(false)
      setEditingMenuItem(null)
      setMForm({name:"",description:"",price:"",category:"Main",imageUrl:"",available:true,featured:false,spicy:false,vegetarian:false})
      // Refresh selected restaurant
      const updated = await fetch(`/api/food-restaurants/${selectedRestaurant.id}`).then(r=>r.json())
      setSelectedRestaurant(updated)
      load()
    } finally { setSavingM(false) }
  }

  const deleteMenuItem = async (itemId: string) => {
    if (!confirm("Delete this menu item?")) return
    await fetch(`/api/food-restaurants/${selectedRestaurant.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({deleteMenuItemId:itemId})})
    const updated = await fetch(`/api/food-restaurants/${selectedRestaurant.id}`).then(r=>r.json())
    setSelectedRestaurant(updated)
    load()
  }

  const updateOrderStatus = async (id: string, status: string, extra?: any) => {
    await fetch(`/api/food-orders/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status,...extra})})
    setOrders(os=>os.map(o=>o.id===id?{...o,status,...extra}:o))
  }

  const updateRestaurantStatus = async (id: string, status: string) => {
    await fetch(`/api/food-restaurants/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status})})
    setRestaurants(rs=>rs.map(r=>r.id===id?{...r,status}:r))
  }

  const openEditRestaurant = (r: any) => {
    setSelectedRestaurant(r)
    setRForm({
      name:r.name||"", description:r.description||"", cuisine:r.cuisine||"Filipino",
      address:r.address||"", deliveryFee:String(r.deliveryFee||49), minOrder:String(r.minOrder||100),
      estimatedTime:r.estimatedTime||"20-35 min", openTime:r.openTime||"08:00", closeTime:r.closeTime||"22:00",
      commissionPct:String(r.commissionPct||10), isOpen:r.isOpen??true, featured:r.featured??false,
      logoUrl:r.logoUrl||"", coverUrl:r.coverUrl||"", ownerName:r.ownerName||"", ownerPhone:r.ownerPhone||"",
    })
    setShowRestaurantForm(true)
  }

  const filteredOrders = orderFilter==="all"?orders:orders.filter(o=>o.status===orderFilter)


  return (
    <>
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-[#1F2937]">🍔 Food to Go</h1>
            <p className="text-[11px] text-gray-400 mt-0.5">Manage restaurants, menus, and food orders</p>
          </div>
          <button onClick={()=>{setSelectedRestaurant(null);setRForm({name:"",description:"",cuisine:"Filipino",address:"",deliveryFee:"49",minOrder:"100",estimatedTime:"20-35 min",openTime:"08:00",closeTime:"22:00",commissionPct:"10",isOpen:true,featured:false,logoUrl:"",coverUrl:"",ownerName:"",ownerPhone:""});setShowRestaurantForm(true)}} className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-orange-600 transition-colors">
            + Add Restaurant
          </button>
        </div>
      </header>

      <div className="p-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {label:"Total Restaurants",value:stats.total,color:"text-gray-700",bg:"bg-gray-50"},
            {label:"Active",value:stats.active,color:"text-green-600",bg:"bg-green-50"},
            {label:"Pending Review",value:stats.pending,color:"text-yellow-600",bg:"bg-yellow-50"},
            {label:"Today's Orders",value:stats.todayOrders,color:"text-orange-600",bg:"bg-orange-50"},
          ].map(s=>(
            <div key={s.label} className={`${s.bg} rounded-xl p-4`}>
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl max-w-fit">
          {(["restaurants","orders","menu"] as AdminTab[]).map(t=>(
            <button key={t} onClick={()=>setTab(t)} className={`px-5 py-2 rounded-lg text-sm font-bold transition-all capitalize ${tab===t?"bg-white text-[#1F2937] shadow-sm":"text-gray-500 hover:text-gray-700"}`}>{t}</button>
          ))}
        </div>


        {/* Restaurants Tab */}
        {tab==="restaurants"&&(
          <div className="space-y-3">
            {loading?[...Array(3)].map((_,i)=><div key={i} className="bg-white rounded-xl h-20 animate-pulse"/>):
            restaurants.map(r=>(
              <div key={r.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                  {r.logoUrl?<img src={r.logoUrl} className="w-full h-full object-cover"/>:<div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-sm text-gray-800">{r.name}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.status==="active"?"bg-green-100 text-green-700":r.status==="pending"?"bg-yellow-100 text-yellow-700":"bg-red-100 text-red-600"}`}>{r.status?.toUpperCase()}</span>
                    {r.featured&&<span className="text-[10px] bg-orange-100 text-orange-600 font-bold px-2 py-0.5 rounded-full">FEATURED</span>}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{r.cuisine} • ₱{r.deliveryFee} delivery • {r.estimatedTime} • Commission: {r.commissionPct}%</p>
                  <p className="text-[11px] text-gray-400">{r.menuItems?.length||0} menu items • ★{r.rating>0?r.rating.toFixed(1):"New"}</p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button onClick={()=>openEditRestaurant(r)} className="text-xs text-[#16A34A] font-bold border border-[#16A34A] px-3 py-1.5 rounded-lg hover:bg-green-50">Edit</button>
                  <button onClick={()=>{setSelectedRestaurant(r);setTab("menu")}} className="text-xs text-orange-600 font-bold border border-orange-300 px-3 py-1.5 rounded-lg hover:bg-orange-50">Menu</button>
                  {r.status==="pending"&&<button onClick={()=>updateRestaurantStatus(r.id,"active")} className="text-xs bg-green-500 text-white px-3 py-1.5 rounded-lg font-bold">Approve</button>}
                  {r.status==="active"&&<button onClick={()=>updateRestaurantStatus(r.id,"suspended")} className="text-xs bg-red-500 text-white px-3 py-1.5 rounded-lg font-bold">Suspend</button>}
                  {r.status==="suspended"&&<button onClick={()=>updateRestaurantStatus(r.id,"active")} className="text-xs bg-green-500 text-white px-3 py-1.5 rounded-lg font-bold">Reinstate</button>}
                </div>
              </div>
            ))}
            {!loading&&restaurants.length===0&&<p className="text-center text-gray-400 text-sm py-8">No restaurants yet.</p>}
          </div>
        )}

        {/* Orders Tab */}
        {tab==="orders"&&(
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              {["all","pending","confirmed","preparing","ready_for_pickup","out_for_delivery","delivered","cancelled"].map(f=>(
                <button key={f} onClick={()=>setOrderFilter(f)} className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${orderFilter===f?"bg-orange-500 border-orange-500 text-white":"bg-white border-gray-200 text-gray-600"}`}>{f.replace(/_/g," ")}</button>
              ))}
            </div>
            <div className="space-y-3">
              {filteredOrders.map(o=>(
                <div key={o.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between cursor-pointer" onClick={()=>setExpandedOrder(expandedOrder===o.id?null:o.id)}>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${STATUS_COLORS[o.status]||"bg-gray-100 text-gray-600"}`}>{o.status?.replace(/_/g," ")}</span>
                      <span className="text-xs font-mono text-gray-400">#{o.id?.slice(-8).toUpperCase()}</span>
                      <span className="text-xs text-gray-500">{o.restaurantName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-orange-500 font-bold text-sm">₱{o.total?.toFixed(2)}</span>
                      <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedOrder===o.id?"rotate-180":""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                    </div>
                  </div>
                  {o.status==="pending"&&(
                    <div className="px-4 py-3 bg-yellow-50 border-b border-yellow-100 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm">{o.customerName}</p>
                        <p className="text-xs text-gray-500">{Array.isArray(o.items)?o.items.length:0} items • {o.deliveryAddress?.slice(0,40)}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={()=>updateOrderStatus(o.id,"rejected")} className="px-3 py-1.5 text-xs font-bold border border-red-200 text-red-600 rounded-lg hover:bg-red-50">Reject</button>
                        <button onClick={()=>updateOrderStatus(o.id,"confirmed")} className="px-3 py-1.5 text-xs font-bold bg-green-500 text-white rounded-lg hover:bg-green-600">Accept</button>
                      </div>
                    </div>
                  )}
                  {expandedOrder===o.id&&(
                    <div className="p-4 space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                        <div><p className="text-[10px] text-gray-400 uppercase font-bold">Customer</p><p className="font-semibold">{o.customerName}</p></div>
                        <div><p className="text-[10px] text-gray-400 uppercase font-bold">Phone</p><p className="font-semibold">{o.customerPhone}</p></div>
                        <div><p className="text-[10px] text-gray-400 uppercase font-bold">Payment</p><p className="font-semibold uppercase">{o.paymentMethod}</p></div>
                        <div className="col-span-2 md:col-span-3"><p className="text-[10px] text-gray-400 uppercase font-bold">Address</p><p className="font-semibold">{o.deliveryAddress}</p></div>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Items</p>
                        <div className="flex flex-wrap gap-1">
                          {(Array.isArray(o.items)?o.items:[]).map((item:any,i:number)=>(
                            <span key={i} className="text-xs bg-gray-100 px-2 py-0.5 rounded">{item.name} ×{item.quantity}</span>
                          ))}
                        </div>
                      </div>
                      {o.notes&&<div className="bg-yellow-50 rounded-lg px-3 py-2 text-xs text-yellow-700">📝 {o.notes}</div>}
                      <div className="bg-gray-50 rounded-xl p-3 text-xs space-y-1">
                        <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>₱{o.subtotal?.toFixed(2)}</span></div>
                        <div className="flex justify-between text-gray-600"><span>Delivery fee</span><span>₱{o.deliveryFee?.toFixed(2)}</span></div>
                        <div className="flex justify-between text-gray-500"><span>Platform fee ({o.platformFee>0?((o.platformFee/o.subtotal)*100).toFixed(0):10}%)</span><span>₱{o.platformFee?.toFixed(2)}</span></div>
                        <div className="flex justify-between font-bold text-sm pt-1 border-t border-gray-200"><span>Total</span><span className="text-orange-500">₱{o.total?.toFixed(2)}</span></div>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                        {o.status==="confirmed"&&<button onClick={()=>updateOrderStatus(o.id,"preparing")} className="text-xs bg-purple-500 text-white px-4 py-2 rounded-lg font-bold">👨‍🍳 Start Preparing</button>}
                        {o.status==="preparing"&&<button onClick={()=>updateOrderStatus(o.id,"ready_for_pickup")} className="text-xs bg-orange-500 text-white px-4 py-2 rounded-lg font-bold">📦 Ready for Pickup</button>}
                        {o.status==="ready_for_pickup"&&(
                          <div className="flex items-center gap-2">
                            <select onChange={e=>{if(e.target.value){const d=drivers.find((x:any)=>x.id===e.target.value);if(d)updateOrderStatus(o.id,"out_for_delivery",{driverId:d.id,driverName:d.name})}}} className="text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none">
                              <option value="">Assign Rider</option>
                              {drivers.map((d:any)=><option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                          </div>
                        )}
                        {o.status==="out_for_delivery"&&<button onClick={()=>updateOrderStatus(o.id,"delivered")} className="text-xs bg-green-500 text-white px-4 py-2 rounded-lg font-bold">✓ Mark Delivered</button>}
                        {!["delivered","cancelled","rejected"].includes(o.status)&&<button onClick={()=>updateOrderStatus(o.id,"cancelled")} className="text-xs bg-red-500 text-white px-4 py-2 rounded-lg font-bold ml-auto">Cancel</button>}
                      </div>
                      {o.driverName&&<div className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2"><span>🏍️</span><span className="text-xs font-medium text-blue-700">Rider: {o.driverName}</span></div>}
                    </div>
                  )}
                </div>
              ))}
              {filteredOrders.length===0&&<p className="text-center text-gray-400 text-sm py-8">No orders found.</p>}
            </div>
          </div>
        )}


        {/* Menu Tab */}
        {tab==="menu"&&(
          <div className="space-y-4">
            {/* Restaurant selector */}
            <div className="flex items-center gap-3 flex-wrap">
              <select value={selectedRestaurant?.id||""} onChange={e=>{const r=restaurants.find(x=>x.id===e.target.value);setSelectedRestaurant(r||null)}} className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400">
                <option value="">Select Restaurant</option>
                {restaurants.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              {selectedRestaurant&&(
                <button onClick={()=>{setEditingMenuItem(null);setMForm({name:"",description:"",price:"",category:"Main",imageUrl:"",available:true,featured:false,spicy:false,vegetarian:false});setShowMenuForm(true)}} className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-orange-600">+ Add Item</button>
              )}
            </div>
            {selectedRestaurant&&(()=>{
              const cats = [...new Set((selectedRestaurant.menuItems||[]).map((m:any)=>m.category))] as string[]
              return (
                <div className="space-y-5">
                  {cats.map(cat=>(
                    <div key={cat}>
                      <h3 className="font-black text-sm text-gray-700 uppercase tracking-wide mb-2">{cat}</h3>
                      <div className="space-y-2">
                        {(selectedRestaurant.menuItems||[]).filter((m:any)=>m.category===cat).map((item:any)=>(
                          <div key={item.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                              {item.imageUrl?<img src={item.imageUrl} className="w-full h-full object-cover"/>:<div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-bold text-sm text-gray-800">{item.name}</p>
                                {item.featured&&<span className="text-[9px] bg-orange-100 text-orange-600 font-bold px-1.5 py-0.5 rounded-full">POPULAR</span>}
                                {item.spicy&&<span className="text-[10px]">🌶️</span>}
                                {item.vegetarian&&<span className="text-[10px]">🥦</span>}
                                {!item.available&&<span className="text-[9px] bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded-full">UNAVAILABLE</span>}
                              </div>
                              {item.description&&<p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{item.description}</p>}
                              <p className="font-black text-sm text-orange-500 mt-1">₱{item.price?.toFixed(2)}</p>
                            </div>
                            <div className="flex flex-col gap-1.5 shrink-0">
                              <button onClick={()=>{setEditingMenuItem(item);setMForm({name:item.name,description:item.description||"",price:String(item.price),category:item.category,imageUrl:item.imageUrl||"",available:item.available,featured:item.featured,spicy:item.spicy,vegetarian:item.vegetarian});setShowMenuForm(true)}} className="text-xs text-[#16A34A] font-bold border border-[#16A34A] px-3 py-1.5 rounded-lg hover:bg-green-50">Edit</button>
                              <button onClick={()=>deleteMenuItem(item.id)} className="text-xs text-red-500 font-bold border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50">Delete</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {cats.length===0&&<p className="text-center text-gray-400 text-sm py-8">No menu items yet. Add your first item!</p>}
                </div>
              )
            })()}
            {!selectedRestaurant&&<p className="text-center text-gray-400 text-sm py-8">Select a restaurant to manage its menu.</p>}
          </div>
        )}
      </div>

      {/* Restaurant Form Modal */}
      {showRestaurantForm&&(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={()=>setShowRestaurantForm(false)}/>
          <div className="relative bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            <div className="bg-orange-500 px-5 py-4 flex items-center justify-between shrink-0">
              <h2 className="font-bold text-white">{selectedRestaurant?"Edit Restaurant":"Add Restaurant"}</h2>
              <button onClick={()=>setShowRestaurantForm(false)} className="text-white/70 text-2xl">&times;</button>
            </div>
            <div className="overflow-y-auto flex-1 p-5 space-y-3">
              {[{label:"Restaurant Name *",key:"name",placeholder:"e.g. Jollibee Lapu-Lapu"},{label:"Description",key:"description",placeholder:"Short description"},{label:"Address *",key:"address",placeholder:"Full address"},{label:"Owner Name",key:"ownerName",placeholder:"Owner full name"},{label:"Owner Phone",key:"ownerPhone",placeholder:"09xxxxxxxxx"}].map(f=>(
                <div key={f.key}>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{f.label}</label>
                  <input value={(rForm as any)[f.key]} onChange={e=>setRForm(x=>({...x,[f.key]:e.target.value}))} placeholder={f.placeholder} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm mt-1 outline-none focus:border-orange-400"/>
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                {[{label:"Cuisine",key:"cuisine"},{label:"Estimated Time",key:"estimatedTime"},{label:"Delivery Fee (₱)",key:"deliveryFee"},{label:"Min Order (₱)",key:"minOrder"},{label:"Commission %",key:"commissionPct"},{label:"Open Time",key:"openTime"},{label:"Close Time",key:"closeTime"}].map(f=>(
                  <div key={f.key}>
                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{f.label}</label>
                    <input value={(rForm as any)[f.key]} onChange={e=>setRForm(x=>({...x,[f.key]:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm mt-1 outline-none focus:border-orange-400"/>
                  </div>
                ))}
              </div>
              {[{label:"Logo URL",key:"logoUrl"},{label:"Cover Image URL",key:"coverUrl"}].map(f=>(
                <div key={f.key}>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{f.label}</label>
                  <input value={(rForm as any)[f.key]} onChange={e=>setRForm(x=>({...x,[f.key]:e.target.value}))} placeholder="https://..." className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm mt-1 outline-none focus:border-orange-400"/>
                </div>
              ))}
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={rForm.isOpen} onChange={e=>setRForm(x=>({...x,isOpen:e.target.checked}))} className="accent-orange-500 w-4 h-4"/><span className="text-sm font-medium">Currently Open</span></label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={rForm.featured} onChange={e=>setRForm(x=>({...x,featured:e.target.checked}))} className="accent-orange-500 w-4 h-4"/><span className="text-sm font-medium">Featured</span></label>
              </div>
            </div>
            <div className="p-4 border-t shrink-0">
              <button onClick={saveRestaurant} disabled={savingR||!rForm.name||!rForm.address} className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-orange-600 disabled:opacity-40">
                {savingR?"Saving...":selectedRestaurant?"Save Changes":"Add Restaurant"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Menu Item Form Modal */}
      {showMenuForm&&(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={()=>setShowMenuForm(false)}/>
          <div className="relative bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            <div className="bg-orange-500 px-5 py-4 flex items-center justify-between shrink-0">
              <h2 className="font-bold text-white">{editingMenuItem?"Edit Menu Item":"Add Menu Item"}</h2>
              <button onClick={()=>setShowMenuForm(false)} className="text-white/70 text-2xl">&times;</button>
            </div>
            <div className="overflow-y-auto flex-1 p-5 space-y-3">
              {[{label:"Item Name *",key:"name",placeholder:"e.g. Chicken Joy"},{label:"Description",key:"description",placeholder:"What's in it?"},{label:"Category",key:"category",placeholder:"e.g. Main, Sides, Drinks"},{label:"Image URL",key:"imageUrl",placeholder:"https://..."}].map(f=>(
                <div key={f.key}>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{f.label}</label>
                  <input value={(mForm as any)[f.key]} onChange={e=>setMForm(x=>({...x,[f.key]:e.target.value}))} placeholder={f.placeholder} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm mt-1 outline-none focus:border-orange-400"/>
                </div>
              ))}
              <div>
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Price (₱) *</label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₱</span>
                  <input type="number" min={0} value={mForm.price} onChange={e=>setMForm(x=>({...x,price:e.target.value}))} className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2.5 text-sm outline-none focus:border-orange-400"/>
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                {[{label:"Available",key:"available"},{label:"Popular",key:"featured"},{label:"Spicy 🌶️",key:"spicy"},{label:"Vegetarian 🥦",key:"vegetarian"}].map(f=>(
                  <label key={f.key} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={(mForm as any)[f.key]} onChange={e=>setMForm(x=>({...x,[f.key]:e.target.checked}))} className="accent-orange-500 w-4 h-4"/>
                    <span className="text-sm font-medium">{f.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="p-4 border-t shrink-0">
              <button onClick={saveMenuItem} disabled={savingM||!mForm.name||!mForm.price} className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-orange-600 disabled:opacity-40">
                {savingM?"Saving...":editingMenuItem?"Save Changes":"Add Item"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
