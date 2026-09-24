import { useState, useEffect } from "react";
import {
  getCategories, adminListTrendingProducts, adminToggleTrendingProduct,
  adminUpdateTrendingProductOrder, adminListTrendingProductRequests,
  adminReviewTrendingProductRequest,
} from "../api";
import { TrendingUp, Search, Package, Star, X, CheckCircle2 } from "lucide-react";

export default function TrendingProductManagement() {
  const [activeTab, setActiveTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [trendingIds, setTrendingIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [trendingFilter, setTrendingFilter] = useState("all");
  const [msg, setMsg] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [categories, setCategories] = useState([]);

  // Requests
  const [requests, setRequests] = useState([]);
  const [requestStatusFilter, setRequestStatusFilter] = useState("");
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [reviewingId, setReviewingId] = useState(null);
  const [reviewNote, setReviewNote] = useState("");
  const [showNoteModal, setShowNoteModal] = useState(null);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const [allProducts, cats] = await Promise.all([
        adminListTrendingProducts({
          search: search || undefined,
          category_id: categoryFilter || undefined,
          is_trending: trendingFilter === "trending" ? true : trendingFilter === "not-trending" ? false : undefined,
          page_size: 100,
        }),
        getCategories(),
      ]);
      setProducts(Array.isArray(allProducts) ? allProducts : []);
      setTrendingIds(new Set((Array.isArray(allProducts) ? allProducts : []).filter(p => p.is_trending).map(p => p.id)));
      setCategories(Array.isArray(cats) ? cats : cats.items || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const loadRequests = async () => {
    setRequestsLoading(true);
    try {
      const data = await adminListTrendingProductRequests({
        status: requestStatusFilter || undefined,
        page_size: 50,
      });
      setRequests(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
    setRequestsLoading(false);
  };

  useEffect(() => { loadProducts(); }, [search, categoryFilter, trendingFilter]);
  useEffect(() => { if (activeTab === "requests") loadRequests(); }, [activeTab, requestStatusFilter]);

  const handleToggle = async (productId) => {
    setSavingId(productId);
    const isCurrentlyTrending = trendingIds.has(productId);
    try {
      await adminToggleTrendingProduct(productId, !isCurrentlyTrending);
      setMsg(isCurrentlyTrending ? "Removed from trending" : "Added to trending");
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
      await adminUpdateTrendingProductOrder(productId, parseInt(newOrder) || 0);
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
      await adminReviewTrendingProductRequest(requestId, status, reviewNote || null);
      setMsg(status === "APPROVED" ? "Request approved - product added to trending" : "Request rejected");
      setShowNoteModal(null);
      setReviewNote("");
      loadRequests();
      loadProducts();
    } catch (e) {
      setMsg(e.message || "Failed to review request");
    }
    setReviewingId(null);
    setTimeout(() => setMsg(""), 3000);
  };

  const trending = products.filter(p => p.is_trending);
  const notTrending = products.filter(p => !p.is_trending);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            Trending Products
          </h3>
          <p className="text-sm text-gray-500 mt-1">Manage which products appear in the Trending Categories section on the homepage</p>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-bold rounded-lg">
            {trendingIds.size} trending
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab("products")}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer border-none ${
            activeTab === "products" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700 bg-transparent"
          }`}
        >
          Manage Products
        </button>
        <button
          onClick={() => setActiveTab("requests")}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer border-none relative ${
            activeTab === "requests" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700 bg-transparent"
          }`}
        >
          Buyer Requests
          {requests.filter(r => r.status === "PENDING").length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 bg-red-500 text-white text-[10px] rounded-full">
              {requests.filter(r => r.status === "PENDING").length}
            </span>
          )}
        </button>
      </div>

      {msg && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${msg.includes("Removed") || msg.includes("Failed") || msg.includes("rejected") ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
          {msg}
        </div>
      )}

      {activeTab === "products" ? (
        <>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white"
            >
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1">
              {["all", "trending", "not-trending"].map(f => (
                <button
                  key={f}
                  onClick={() => setTrendingFilter(f)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer border-none ${
                    trendingFilter === f ? "bg-purple-500 text-white" : "text-gray-500 hover:bg-gray-100 bg-transparent"
                  }`}
                >
                  {f === "all" ? "All" : f === "trending" ? "Trending" : "Not Trending"}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}</div>
          ) : (
            <>
              {/* Trending Products */}
              {trendingFilter !== "not-trending" && trending.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-bold text-purple-700 uppercase tracking-wider mb-3">Trending ({trending.length})</h4>
                  <div className="bg-white border border-purple-200 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-purple-100 bg-purple-50">
                          <th className="text-left px-4 py-3 font-medium text-purple-700">Product</th>
                          <th className="text-left px-4 py-3 font-medium text-purple-700">Category</th>
                          <th className="text-left px-4 py-3 font-medium text-purple-700">Business</th>
                          <th className="text-center px-4 py-3 font-medium text-purple-700">Price</th>
                          <th className="text-center px-4 py-3 font-medium text-purple-700">Trending</th>
                          <th className="text-center px-4 py-3 font-medium text-purple-700">Order</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trending.map((p) => (
                          <tr key={p.id} className="border-b border-purple-50 hover:bg-purple-50/30">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                {p.primary_image ? (
                                  <img src={p.primary_image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                    <Package className="w-5 h-5 text-purple-400" />
                                  </div>
                                )}
                                <div>
                                  <span className="font-medium text-gray-900 block">{p.name}</span>
                                  <span className="text-xs text-gray-400">{p.slug}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-lg font-medium">
                                {p.category_name || "N/A"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">{p.business_name || "-"}</td>
                            <td className="px-4 py-3 text-center">
                              {p.price != null ? (
                                <span className="text-sm font-bold text-gray-900">{"\u20B9"}{p.price.toLocaleString("en-IN")}</span>
                              ) : (
                                <span className="text-xs text-gray-400">N/A</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => handleToggle(p.id)}
                                disabled={savingId === p.id}
                                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer border-none bg-purple-500"
                              >
                                <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                              </button>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <input
                                type="number"
                                value={p.trending_order}
                                onChange={(e) => handleOrderChange(p.id, e.target.value)}
                                className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-center text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Available Products */}
              {trendingFilter !== "trending" && (
                <div>
                  <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
                    {trendingFilter === "all" ? `Available Products (${notTrending.length})` : `All Products (${products.length})`}
                  </h4>
                  {products.length === 0 ? (
                    <div className="text-center py-8 bg-white border border-gray-200 rounded-xl">
                      <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">No products found</p>
                    </div>
                  ) : (
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100 bg-gray-50">
                            <th className="text-left px-4 py-3 font-medium text-gray-500">Product</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-500">Category</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-500">Business</th>
                            <th className="text-center px-4 py-3 font-medium text-gray-500">Price</th>
                            <th className="text-center px-4 py-3 font-medium text-gray-500">Trending</th>
                            <th className="text-center px-4 py-3 font-medium text-gray-500">Order</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(trendingFilter === "all" ? notTrending : products).map((p) => (
                            <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  {p.primary_image ? (
                                    <img src={p.primary_image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                                  ) : (
                                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                      <Package className="w-5 h-5 text-gray-400" />
                                    </div>
                                  )}
                                  <div>
                                    <span className="font-medium text-gray-900 block">{p.name}</span>
                                    <span className="text-xs text-gray-400">{p.slug}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-lg font-medium">
                                  {p.category_name || "N/A"}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700">{p.business_name || "-"}</td>
                              <td className="px-4 py-3 text-center">
                                {p.price != null ? (
                                  <span className="text-sm font-bold text-gray-900">{"\u20B9"}{p.price.toLocaleString("en-IN")}</span>
                                ) : (
                                  <span className="text-xs text-gray-400">N/A</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  onClick={() => handleToggle(p.id)}
                                  disabled={savingId === p.id}
                                  className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer border-none bg-gray-200"
                                >
                                  <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1" />
                                </button>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="text-gray-300 text-xs">&mdash;</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </>
      ) : (
        /* Requests Tab */
        <>
          <div className="flex items-center gap-3 mb-5">
            <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1">
              {["", "PENDING", "APPROVED", "REJECTED"].map(s => (
                <button
                  key={s}
                  onClick={() => setRequestStatusFilter(s)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer border-none ${
                    requestStatusFilter === s ? "bg-purple-500 text-white" : "text-gray-500 hover:bg-gray-100 bg-transparent"
                  }`}
                >
                  {s || "All"}
                </button>
              ))}
            </div>
          </div>

          {requestsLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}</div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
              <Star className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No buyer requests found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((r) => (
                <div key={r.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition-all">
                  {r.product_image ? (
                    <img src={r.product_image} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Package className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-gray-900 truncate">{r.product_name}</h4>
                    <p className="text-xs text-gray-500">{r.business_name} &middot; Requested by {r.buyer_name}</p>
                    {r.message && <p className="text-xs text-gray-400 mt-1 truncate">&ldquo;{r.message}&rdquo;</p>}
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        r.status === "PENDING" ? "bg-amber-100 text-amber-700" :
                        r.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {r.status}
                      </span>
                      <span className="text-[10px] text-gray-400">{r.created_at ? new Date(r.created_at).toLocaleDateString() : ""}</span>
                    </div>
                  </div>
                  {r.status === "PENDING" && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleReviewRequest(r.id, "APPROVED")}
                        disabled={reviewingId === r.id}
                        className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 transition-colors cursor-pointer border-none disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => { setShowNoteModal(r.id); setReviewNote(""); }}
                        disabled={reviewingId === r.id}
                        className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors cursor-pointer border-none"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Reject Note Modal */}
          {showNoteModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowNoteModal(null)}>
              <div className="bg-white rounded-xl max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-base font-bold text-gray-900">Reject Request</h3>
                  <button onClick={() => setShowNoteModal(null)} className="text-gray-400 hover:text-gray-600 border-none bg-transparent cursor-pointer"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Admin Note (optional)</label>
                    <textarea
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                      rows={3}
                      placeholder="Reason for rejection..."
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setShowNoteModal(null)} className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 border-none cursor-pointer">Cancel</button>
                    <button onClick={() => handleReviewRequest(showNoteModal, "REJECTED")} className="flex-1 py-2.5 text-sm font-bold text-white bg-red-500 rounded-lg hover:bg-red-600 border-none cursor-pointer">Reject</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
