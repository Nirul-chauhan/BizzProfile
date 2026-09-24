import { useState, useEffect, useMemo } from "react";
import { Search, MessageSquare, RefreshCw, ChevronLeft, ChevronRight, Mail, Phone, Package, Briefcase, Building2 } from "lucide-react";
import { adminListEnquiries, adminUpdateEnquiryStatus } from "../api";

const STATUS_COLORS = {
  NEW: "bg-amber-100 text-amber-700",
  READ: "bg-blue-100 text-blue-700",
  REPLIED: "bg-emerald-100 text-emerald-700",
  CLOSED: "bg-gray-100 text-gray-600",
};

const STATUS_OPTIONS = ["ALL", "NEW", "READ", "REPLIED", "CLOSED"];

export default function AdminEnquiries() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const load = useMemo(
    () => async () => {
      setLoading(true);
      try {
        const params = { page, page_size: pageSize };
        if (statusFilter) params.status = statusFilter;
        if (search.trim()) params.search = search.trim();
        const res = await adminListEnquiries(params);
        const data = Array.isArray(res) ? res : res?.items || [];
        setItems(data);
        setTotalPages(res?.total_pages || 1);
        setTotal(res?.total || data.length);
      } catch (e) {
        console.error("Failed to load admin enquiries", e);
      } finally {
        setLoading(false);
      }
    },
    [page, pageSize, statusFilter, search]
  );

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const handleStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      await adminUpdateEnquiryStatus(id, status);
      setStatusFilter((prev) => {
        if (prev && prev !== status) {
          setPage(1);
          return prev;
        }
        return prev;
      });
      setMsg(`Enquiry #${id} marked as ${status}`);
      setTimeout(load, 150);
    } catch (e) {
      console.error("Failed to update enquiry status", e);
      setMsg("Failed to update enquiry status");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Enquiries</h2>
          <p className="text-sm text-gray-500 mt-0.5">{total} enquiry records from buyers across all businesses</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search buyer, business, product..."
              className="pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-56"
            />
          </div>
          <button
            onClick={load}
            className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer border-solid"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {msg && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-50 text-emerald-700 text-sm border border-emerald-200">
          {msg}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s === "ALL" ? "" : s); setPage(1); }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer border-none ${
              (s === "ALL" && !statusFilter) || statusFilter === s
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-200/60 rounded-2xl overflow-hidden">
        {loading && items.length === 0 ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No enquiries found</p>
            <p className="text-sm text-gray-400 mt-1">Adjust filters or try a different search</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Business</th>
                  <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Buyer</th>
                  <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Product / Service</th>
                  <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Message</th>
                  <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Received</th>
                </tr>
              </thead>
              <tbody>
                {items.map((e) => (
                  <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-sm font-semibold text-gray-800">{e.business_name || "-"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm font-semibold text-gray-800">{e.buyer_name || "Buyer #" + e.buyer_id}</div>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Mail className="w-3 h-3" />
                        <span>{e.buyer_email || "-"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {e.product_name ? (
                        <div className="flex items-start gap-1.5">
                          <Package className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="text-sm text-gray-700">{e.product_name}</div>
                            {e.product_image && (
                              <img src={e.product_image} alt="" className="w-10 h-10 rounded-lg object-cover mt-1" />
                            )}
                          </div>
                        </div>
                      ) : e.service_name ? (
                        <div className="flex items-start gap-1.5">
                          <Briefcase className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="text-sm text-gray-700">{e.service_name}</div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">General enquiry</span>
                      )}
                    </td>
                    <td className="px-5 py-4 max-w-xs">
                      <p className="text-sm text-gray-600 line-clamp-2">{e.message}</p>
                    </td>
                    <td className="px-5 py-4">
                      <select
                        value={e.status}
                        onChange={(ev) => handleStatus(e.id, ev.target.value)}
                        disabled={updatingId === e.id}
                        className={`text-xs font-bold rounded-lg px-2 py-1.5 cursor-pointer border-none ${STATUS_COLORS[e.status] || "bg-gray-100 text-gray-600"} disabled:opacity-50`}
                      >
                        {STATUS_OPTIONS.filter((o) => o !== "ALL").map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs text-gray-400">{e.created_at ? new Date(e.created_at).toLocaleDateString() : "-"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer border-solid disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer border-solid disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
