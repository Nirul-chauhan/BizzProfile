import { useState, useEffect } from "react";
import {
  getCategories, adminListTrendingCategories, adminToggleTrending, adminUpdateTrendingOrder,
} from "../api";
import { TrendingUp, Search, ChevronUp, ChevronDown } from "lucide-react";

export default function TrendingCategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [trendingIds, setTrendingIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState("");
  const [savingId, setSavingId] = useState(null);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const [allCats, trendingCats] = await Promise.all([
        getCategories(),
        adminListTrendingCategories(),
      ]);
      setCategories(Array.isArray(allCats) ? allCats : []);
      setTrendingIds(new Set((Array.isArray(trendingCats) ? trendingCats : []).map(c => c.id)));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { loadCategories(); }, []);

  const handleToggle = async (categoryId) => {
    setSavingId(categoryId);
    const isCurrentlyTrending = trendingIds.has(categoryId);
    try {
      await adminToggleTrending(categoryId, !isCurrentlyTrending);
      setMsg(isCurrentlyTrending ? "Removed from trending" : "Added to trending");
      loadCategories();
    } catch (e) {
      setMsg(e.message || "Failed to update");
    }
    setSavingId(null);
    setTimeout(() => setMsg(""), 3000);
  };

  const handleOrderChange = async (categoryId, newOrder) => {
    setSavingId(categoryId);
    try {
      await adminUpdateTrendingOrder(categoryId, parseInt(newOrder) || 0);
      setMsg("Order updated");
      loadCategories();
    } catch (e) {
      setMsg(e.message || "Failed to update order");
    }
    setSavingId(null);
    setTimeout(() => setMsg(""), 3000);
  };

  const filtered = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const trending = filtered.filter(c => trendingIds.has(c.id));
  const notTrending = filtered.filter(c => !trendingIds.has(c.id));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            Trending Categories
          </h3>
          <p className="text-sm text-gray-500 mt-1">Manage which categories appear in the Trending Categories section on the homepage</p>
        </div>
        <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-bold rounded-lg">
          {trendingIds.size} trending
        </span>
      </div>

      {msg && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${msg.includes("Removed") || msg.includes("Failed") ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
          {msg}
        </div>
      )}

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search categories..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none"
        />
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : (
        <>
          {/* Trending Categories */}
          {trending.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-bold text-purple-700 uppercase tracking-wider mb-3">Trending ({trending.length})</h4>
              <div className="bg-white border border-purple-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-purple-100 bg-purple-50">
                      <th className="text-left px-4 py-3 font-medium text-purple-700">Category</th>
                      <th className="text-center px-4 py-3 font-medium text-purple-700">Trending</th>
                      <th className="text-center px-4 py-3 font-medium text-purple-700">Order</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trending.map((c) => (
                      <tr key={c.id} className="border-b border-purple-50 hover:bg-purple-50/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {c.logo_url ? (
                              <img src={c.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-purple-400" />
                              </div>
                            )}
                            <div>
                              <span className="font-medium text-gray-900 block">{c.name}</span>
                              <span className="text-xs text-gray-400">{c.slug}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleToggle(c.id)}
                            disabled={savingId === c.id}
                            className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer border-none bg-purple-500"
                          >
                            <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              value={c.trending_order}
                              onChange={(e) => handleOrderChange(c.id, e.target.value)}
                              className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-center text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Available Categories */}
          <div>
            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Available Categories ({notTrending.length})</h4>
            {notTrending.length === 0 ? (
              <div className="text-center py-8 bg-white border border-gray-200 rounded-xl">
                <TrendingUp className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">All categories are trending</p>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Category</th>
                      <th className="text-center px-4 py-3 font-medium text-gray-500">Trending</th>
                      <th className="text-center px-4 py-3 font-medium text-gray-500">Order</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notTrending.map((c) => (
                      <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {c.logo_url ? (
                              <img src={c.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <span className="font-medium text-gray-900 block">{c.name}</span>
                              <span className="text-xs text-gray-400">{c.slug}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleToggle(c.id)}
                            disabled={savingId === c.id}
                            className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer border-none bg-gray-200"
                          >
                            <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1" />
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-gray-300 text-xs">—</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
