import { useState, useEffect } from "react";
import {
  buyerCreateTrendingProductRequest, buyerListTrendingProductRequests, sellerListProducts,
} from "../api";
import { Package, TrendingUp, Send, CheckCircle2, Clock, XCircle, Search } from "lucide-react";

export default function TrendingProductRequests() {
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [searching, setSearching] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");
  const [activeTab, setActiveTab] = useState("requests");

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await buyerListTrendingProductRequests();
      setMyRequests(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { loadRequests(); }, []);

  const handleSearch = async () => {
    setSearching(true);
    try {
      const data = await sellerListProducts(1, 50);
      const items = data.items || data || [];
      setProducts(Array.isArray(items) ? items : []);
      setActiveTab("browse");
    } catch (e) {
      console.error(e);
    }
    setSearching(false);
  };

  const handleSubmit = async () => {
    if (!selectedProduct) return;
    setSubmitting(true);
    try {
      await buyerCreateTrendingProductRequest({
        product_id: selectedProduct.id,
        message: message.trim() || undefined,
      });
      setMsg("Request submitted successfully!");
      setSelectedProduct(null);
      setMessage("");
      loadRequests();
      setActiveTab("requests");
    } catch (e) {
      setMsg(e.message || "Failed to submit request");
    }
    setSubmitting(false);
    setTimeout(() => setMsg(""), 4000);
  };

  const statusIcon = (s) => {
    if (s === "APPROVED") return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    if (s === "REJECTED") return <XCircle className="w-4 h-4 text-red-500" />;
    return <Clock className="w-4 h-4 text-amber-500" />;
  };

  return (
    <div>
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        <button onClick={() => setActiveTab("requests")} className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors cursor-pointer border-none ${activeTab === "requests" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700 bg-transparent"}`}>
          <TrendingUp className="w-4 h-4 inline mr-1.5" />My Requests
        </button>
        <button onClick={() => setActiveTab("browse")} className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors cursor-pointer border-none ${activeTab === "browse" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700 bg-transparent"}`}>
          <Search className="w-4 h-4 inline mr-1.5" />Browse Products
        </button>
      </div>

      {msg && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${msg.includes("success") ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {msg}
        </div>
      )}

      {activeTab === "requests" ? (
        <div>
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}</div>
          ) : myRequests.length === 0 ? (
            <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
              <TrendingUp className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm mb-3">No trending product requests yet.</p>
              <button onClick={() => setActiveTab("browse")} className="px-4 py-2 bg-purple-500 text-white text-sm font-bold rounded-lg hover:bg-purple-600 cursor-pointer border-none">Browse Products to Request</button>
            </div>
          ) : (
            <div className="space-y-3">
              {myRequests.map((r) => (
                <div key={r.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
                  {r.product_image ? (
                    <img src={r.product_image} alt="" className="w-12 h-12 rounded-xl object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center"><Package className="w-5 h-5 text-gray-400" /></div>
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-gray-900 text-sm block truncate">{r.product_name}</span>
                    {r.business_name && <span className="text-xs text-gray-400">{r.business_name}</span>}
                    {r.message && <p className="text-xs text-gray-500 mt-1 truncate">&ldquo;{r.message}&rdquo;</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {statusIcon(r.status)}
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${r.status === "PENDING" ? "bg-amber-100 text-amber-700" : r.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>{r.status}</span>
                  </div>
                  {r.admin_note && <p className="text-[10px] text-gray-400 ml-2">{r.admin_note}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          {selectedProduct ? (
            <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
              <div className="flex items-center gap-4 mb-4">
                {selectedProduct.primary_image ? (
                  <img src={selectedProduct.primary_image} alt="" className="w-16 h-16 rounded-xl object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center"><Package className="w-7 h-7 text-gray-400" /></div>
                )}
                <div>
                  <h4 className="font-bold text-gray-900">{selectedProduct.name}</h4>
                  <p className="text-sm text-gray-500">{selectedProduct.business_name || "Unknown seller"}</p>
                  {selectedProduct.price != null && <p className="text-sm font-semibold text-gray-700">{"\u20B9"}{selectedProduct.price.toLocaleString("en-IN")}</p>}
                </div>
                <button onClick={() => setSelectedProduct(null)} className="ml-auto text-gray-400 hover:text-gray-600 cursor-pointer border-none bg-transparent"><XCircle className="w-5 h-5" /></button>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Message (optional)</label>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder="Why should this product be featured in Trending?" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none" />
              </div>
              <button onClick={handleSubmit} disabled={submitting} className="w-full py-2.5 bg-purple-500 text-white text-sm font-bold rounded-lg hover:bg-purple-600 disabled:opacity-50 cursor-pointer border-none flex items-center justify-center gap-2">
                <Send className="w-4 h-4" /> {submitting ? "Submitting..." : "Submit Trending Request"}
              </button>
            </div>
          ) : null}

          <div className="flex gap-2 mb-4">
            <button onClick={handleSearch} disabled={searching} className="px-4 py-2.5 bg-purple-500 text-white text-sm font-bold rounded-xl hover:bg-purple-600 disabled:opacity-50 cursor-pointer border-none flex items-center gap-1">
              <Search className="w-4 h-4" /> {searching ? "Loading..." : "Browse My Products"}
            </button>
          </div>

          {products.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {products.map((p) => (
                <button key={p.id} onClick={() => setSelectedProduct(p)} className={`text-left p-4 bg-white border-2 rounded-xl hover:shadow-md transition-all cursor-pointer ${selectedProduct?.id === p.id ? "border-purple-500" : "border-gray-100"}`}>
                  <div className="flex items-center gap-3 mb-2">
                    {p.primary_image ? (
                      <img src={p.primary_image} alt="" className="w-12 h-12 rounded-lg object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center"><Package className="w-5 h-5 text-gray-400" /></div>
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-gray-900 text-sm block truncate">{p.name}</span>
                      <span className="text-xs text-gray-400 truncate block">{p.business_name || "Unknown"}</span>
                    </div>
                  </div>
                  {p.price != null ? (
                    <span className="text-sm font-semibold text-gray-700">{"\u20B9"}{p.price.toLocaleString("en-IN")}</span>
                  ) : (
                    <span className="text-xs text-gray-400">Price on Request</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
