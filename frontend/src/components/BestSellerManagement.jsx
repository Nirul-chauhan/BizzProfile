import { useState, useEffect } from "react";
import {
  adminListProducts, adminToggleBestSeller, adminUpdateBestSellerOrder,
  adminListBestSellerRequests, adminReviewBestSellerRequest, getCategories,
} from "../api";
import { Package, Star, Search, ChevronUp, ChevronDown, CheckCircle2, XCircle, Eye } from "lucide-react";

export default function BestSellerManagement() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterBest, setFilterBest] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState([]);
  const [filterCat, setFilterCat] = useState("");
  const [msg, setMsg] = useState("");
  const [savingId, setSavingId] = useState(null);

  // Requests
  const [requests, setRequests] = useState([]);
  const [reqLoading, setReqLoading] = useState(false);
  const [reqFilter, setReqFilter] = useState("");
  const [reviewingId, setReviewingId] = useState(null);
  const [reviewNote, setReviewNote] = useState("");
  const [activeTab, setActiveTab] = useState("products");

  const loadProducts = async () => {
    setLoading(true);
    try {
      const params = { page, page_size: 20 };
      if (search) params.search = search;
      if (filterBest) params.is_best_seller = filterBest === "true";
      if (filterCat) params.category_id = filterCat;
      const [data, countData] = await Promise.all([
        adminListProducts(params),
        adminListProductsCount(params),
      ]);
      setProducts(Array.isArray(data) ? data : []);
      setTotal(countData?.total || 0);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const loadRequests = async () => {
    setReqLoading(true);
    try {
      const params = {};
      if (reqFilter) params.status = reqFilter;
      const data = await adminListBestSellerRequests(params);
      setRequests(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
    setReqLoading(false);
  };

  useEffect(() => { loadProducts(); }, [page, filterBest, filterCat]);
  useEffect(() => { getCategories().then(d => setCategories(d || [])).catch(() => {}); }, []);
  useEffect(() => { if (activeTab === "requests") loadRequests(); }, [activeTab, reqFilter]);

  const handleSearch = () => { setPage(1); loadProducts(); };

  const handleToggle = async (productId, current) => {
    setSavingId(productId);
    try {
      await adminToggleBestSeller(productId, !current);
      setMsg("Updated successfully");
      loadProducts();
    } catch (e) {
      setMsg(e.message || "Failed to update");
    }
    setSavingId(null);
    setTimeout(() => setMsg(""), 3000);
  };

  const handleOrderChange = async (productId, newOrder) => {
    setSavingId(productId);
    try {
      await adminUpdateBestSellerOrder(productId, parseInt(newOrder) || 0);
      setMsg("Order updated");
      loadProducts();
    } catch (e) {
      setMsg(e.message || "Failed to update order");
    }
    setSavingId(null);
    setTimeout(() => setMsg(""), 3000);
  };

  const handleReviewRequest = async (requestId, status) => {
    setReviewingId(requestId);
    try {
      await adminReviewBestSellerRequest(requestId, status, reviewNote);
      setMsg(`Request ${status.toLowerCase()}`);
      setReviewNote("");
      loadRequests();
      if (status === "APPROVED") loadProducts();
    } catch (e) {
      setMsg(e.message || "Failed to review");
    }
    setReviewingId(null);
    setTimeout(() => setMsg(""), 3000);
  };

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        <button onClick={() => setActiveTab("products")} className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors cursor-pointer border-none ${activeTab === "products" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700 bg-transparent"}`}>
          <Package className="w-4 h-4 inline mr-1.5" />Manage Best Sellers
        </button>
        <button onClick={() => setActiveTab("requests")} className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors cursor-pointer border-none ${activeTab === "requests" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700 bg-transparent"}`}>
          <Star className="w-4 h-4 inline mr-1.5" />Buyer Requests {requests.filter(r => r.status === "PENDING").length > 0 && <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-[10px] rounded-full">{requests.filter(r => r.status === "PENDING").length}</span>}
        </button>
      </div>

      {msg && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${msg.includes("success") || msg.includes("Updated") || msg.includes("updated") || msg.includes("approved") || msg.includes("rejected") ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {msg}
        </div>
      )}

      {activeTab === "products" ? (
        <div>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-5">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} placeholder="Search products..." className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
            </div>
            <select value={filterBest} onChange={(e) => { setFilterBest(e.target.value); setPage(1); }} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-orange-500 outline-none">
              <option value="">All Products</option>
              <option value="true">Best Sellers Only</option>
              <option value="false">Not Best Sellers</option>
            </select>
            <select value={filterCat} onChange={(e) => { setFilterCat(e.target.value); setPage(1); }} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-orange-500 outline-none">
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <p className="text-sm text-gray-500 mb-4">{total} products found</p>

          {/* Products Table */}
          {loading ? (
            <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
              <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No products found.</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Product</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Business</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Price</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Category</th>
                      <th className="text-center px-4 py-3 font-medium text-gray-500">Best Seller</th>
                      <th className="text-center px-4 py-3 font-medium text-gray-500">Order</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {p.primary_image ? (
                              <img src={p.primary_image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center"><Package className="w-5 h-5 text-gray-400" /></div>
                            )}
                            <div>
                              <span className="font-medium text-gray-900 block">{p.name}</span>
                              <span className="text-xs text-gray-400">ID: {p.id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-gray-600">{p.business_name || "—"}</span>
                          {p.is_verified && <span className="ml-1 text-emerald-500"><CheckCircle2 className="w-3.5 h-3.5 inline" /></span>}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{p.price != null ? `₹${p.price.toLocaleString("en-IN")}` : "—"}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{p.category_name || "—"}</td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => handleToggle(p.id, p.is_best_seller)} disabled={savingId === p.id} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer border-none ${p.is_best_seller ? "bg-orange-500" : "bg-gray-200"}`}>
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${p.is_best_seller ? "translate-x-6" : "translate-x-1"}`} />
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {p.is_best_seller ? (
                            <div className="flex items-center justify-center gap-1">
                              <input type="number" value={p.best_seller_order} onChange={(e) => handleOrderChange(p.id, e.target.value)} className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-center text-xs focus:ring-2 focus:ring-orange-500 outline-none" />
                            </div>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {total > 20 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-40 cursor-pointer border-none bg-transparent">Previous</button>
                  <span className="text-sm text-gray-500">Page {page} of {Math.ceil(total / 20)}</span>
                  <button onClick={() => setPage(p => p + 1)} disabled={page * 20 >= total} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-40 cursor-pointer border-none bg-transparent">Next</button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Requests Tab */
        <div>
          <div className="flex gap-2 mb-5">
            {["", "PENDING", "APPROVED", "REJECTED"].map(s => (
              <button key={s} onClick={() => setReqFilter(s)} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer border-none ${reqFilter === s ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                {s || "All"}
              </button>
            ))}
          </div>

          {reqLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}</div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
              <Star className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No requests found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((r) => (
                <div key={r.id} className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-start gap-4">
                    {r.product_image ? (
                      <img src={r.product_image} alt="" className="w-14 h-14 rounded-xl object-cover" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center"><Package className="w-6 h-6 text-gray-400" /></div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-900">{r.product_name}</span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${r.status === "PENDING" ? "bg-amber-100 text-amber-700" : r.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>{r.status}</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-1">Requested by: {r.buyer_name} &middot; Business: {r.business_name || "—"}</p>
                      {r.message && <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded-lg mt-1">"{r.message}"</p>}
                      {r.admin_note && <p className="text-xs text-gray-500 mt-1">Admin note: {r.admin_note}</p>}
                      <p className="text-[10px] text-gray-400 mt-1">{r.created_at ? new Date(r.created_at).toLocaleDateString() : ""}</p>
                    </div>
                    {r.status === "PENDING" && (
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => handleReviewRequest(r.id, "APPROVED")} disabled={reviewingId === r.id} className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 cursor-pointer border-none flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button onClick={() => handleReviewRequest(r.id, "REJECTED")} disabled={reviewingId === r.id} className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 cursor-pointer border-none flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
