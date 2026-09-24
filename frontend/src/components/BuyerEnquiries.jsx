import { useState, useEffect } from "react";
import {
  MessageCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  Search,
  ArrowRight,
  Loader,
  RefreshCw,
  Building2,
  Package,
  Briefcase,
} from "lucide-react";
import { buyerListEnquiries } from "../api";

const STATUS_STYLES = {
  NEW: "bg-blue-100 text-blue-700",
  READ: "bg-amber-100 text-amber-700",
  REPLIED: "bg-emerald-100 text-emerald-700",
  CLOSED: "bg-gray-100 text-gray-600",
};

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
        STATUS_STYLES[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      {status}
    </span>
  );
}

export default function BuyerEnquiries() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadEnquiries(true);
  }, []);

  const loadEnquiries = async (reset = false) => {
    setLoading(true);
    try {
      const currentPage = reset ? 1 : page;
      const data = await buyerListEnquiries(currentPage);
      const items = data.items || data || [];
      if (reset) {
        setEnquiries(items);
        setPage(1);
      } else {
        setEnquiries((prev) => [...prev, ...items]);
      }
      setHasMore(items.length >= 20);
    } catch (err) {
      console.error("Failed to load enquiries:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = enquiries.filter((e) => {
    if (filterStatus !== "ALL" && e.status !== filterStatus) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        (e.message || "").toLowerCase().includes(query) ||
        String(e.id).includes(query) ||
        String(e.profile_id).includes(query)
      );
    }
    return true;
  });

  const statusCounts = enquiries.reduce((acc, e) => {
    acc[e.status] = (acc[e.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">
            My Enquiries
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Track all your sent enquiries and responses
          </p>
        </div>
        <button
          onClick={() => loadEnquiries(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", count: enquiries.length, color: "bg-gray-50 text-gray-700" },
          { label: "New", count: statusCounts.NEW || 0, color: "bg-blue-50 text-blue-700" },
          { label: "Replied", count: statusCounts.REPLIED || 0, color: "bg-emerald-50 text-emerald-700" },
          { label: "Closed", count: statusCounts.CLOSED || 0, color: "bg-gray-50 text-gray-500" },
        ].map((s) => (
          <button
            key={s.label}
            onClick={() => setFilterStatus(s.label === "Total" ? "ALL" : s.label)}
            className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
              filterStatus === (s.label === "Total" ? "ALL" : s.label)
                ? "border-blue-500 ring-2 ring-blue-500/20"
                : "border-gray-200 hover:border-gray-300"
            } ${s.color}`}
          >
            <p className="text-2xl font-extrabold">{s.count}</p>
            <p className="text-xs font-medium">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search enquiries..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>

      {/* Enquiries List */}
      {loading && enquiries.length === 0 ? (
        <div className="flex items-center justify-center h-40">
          <Loader className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
          <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium text-gray-600">No enquiries found</p>
          <p className="text-sm text-gray-400 mt-1">
            Your sent enquiries will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((e) => (
            <div
              key={e.id}
              className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-bold text-gray-900">
                      Enquiry #{e.id}
                    </span>
                    <StatusBadge status={e.status} />
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" /> Business #{e.profile_id}
                    </span>
                    {e.product_id && (
                      <span className="flex items-center gap-1">
                        <Package className="w-3.5 h-3.5" /> Product #{e.product_id}
                      </span>
                    )}
                    {e.service_id && (
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-3.5 h-3.5" /> Service #{e.service_id}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {e.created_at
                        ? new Date(e.created_at).toLocaleDateString()
                        : "—"}
                    </span>
                  </div>

                  {e.message && (
                    <p className="text-sm text-gray-600 mt-3 bg-gray-50 rounded-lg p-3 line-clamp-2">
                      {e.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Load More */}
          {hasMore && (
            <div className="text-center pt-4">
              <button
                onClick={() => {
                  setPage((p) => p + 1);
                  loadEnquiries(false);
                }}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 text-sm font-bold text-gray-700 rounded-xl hover:bg-gray-50 cursor-pointer"
              >
                Load More <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
