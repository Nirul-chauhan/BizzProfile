import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  MessageCircle,
  Clock,
  Search,
  ArrowRight,
  Loader,
  RefreshCw,
  Building2,
  Package,
  Briefcase,
  FileText,
  Boxes,
} from "lucide-react";
import { buyerListEnquiries } from "../api";

const STATUS_STYLES = {
  PENDING: "bg-amber-100 text-amber-700",
  RESPONDED: "bg-violet-100 text-violet-700",
  NEW: "bg-blue-100 text-blue-700",
  CONTACTED: "bg-amber-100 text-amber-700",
  QUOTED: "bg-violet-100 text-violet-700",
  ACCEPTED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
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

export default function BuyerEnquiries({ onViewQuotations }) {
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
      (e.requirement || "").toLowerCase().includes(query) ||
      (e.location || "").toLowerCase().includes(query) ||
        (e.business_name || "").toLowerCase().includes(query) ||
        (e.product_name || "").toLowerCase().includes(query) ||
        (e.service_name || "").toLowerCase().includes(query) ||
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
          { label: "Total", key: "ALL", count: enquiries.length, color: "bg-gray-50 text-gray-700" },
          { label: "Pending", key: "PENDING", count: statusCounts.PENDING || 0, color: "bg-amber-50 text-amber-700" },
          { label: "Responded", key: "RESPONDED", count: statusCounts.RESPONDED || 0, color: "bg-violet-50 text-violet-700" },
          { label: "Accepted", key: "ACCEPTED", count: statusCounts.ACCEPTED || 0, color: "bg-emerald-50 text-emerald-700" },
        ].map((s) => (
          <button
            key={s.label}
            onClick={() => setFilterStatus(s.key)}
            className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
              filterStatus === s.key
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
          {filtered.map((e) => {
            const itemName = e.product_name || e.service_name;
            const ItemIcon = e.product_id ? Package : Briefcase;
            return (
              <div
                key={e.id}
                className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <span className="text-sm font-bold text-gray-900">
                        {e.reference || `ENQ-${String(e.id).padStart(5, "0")}`}
                      </span>
                      <StatusBadge status={e.status} />
                    </div>

                    {e.business_name && (
                      <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-gray-400" />
                        {e.business_name}
                        {e.seller_name && (
                          <span className="text-xs font-normal text-gray-500">· {e.seller_name}</span>
                        )}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-2">
                      {itemName && (
                        e.product_id ? (
                          <Link
                            to={`/products/${e.product_id}`}
                            className="flex items-center gap-1 font-medium text-gray-600 hover:text-gray-900 no-underline"
                          >
                            <ItemIcon className="w-3.5 h-3.5" /> {itemName}
                          </Link>
                        ) : e.service_id ? (
                          <Link
                            to={`/biz-services/${e.service_id}`}
                            className="flex items-center gap-1 font-medium text-gray-600 hover:text-gray-900 no-underline"
                          >
                            <ItemIcon className="w-3.5 h-3.5" /> {itemName}
                          </Link>
                        ) : (
                          <span className="flex items-center gap-1">
                            <ItemIcon className="w-3.5 h-3.5" /> {itemName}
                          </span>
                        )
                      )}
                      {e.quantity > 1 && (
                        <span className="flex items-center gap-1">
                          <Boxes className="w-3.5 h-3.5" /> {e.quantity} units
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

                    {(e.requirement || e.location) && (
                      <div className="mt-2 space-y-1">
                        {e.requirement && (
                          <p className="text-xs text-gray-600">
                            <span className="font-semibold text-gray-800">Requirement:</span>{" "}
                            {e.requirement}
                          </p>
                        )}
                        {e.location && (
                          <p className="text-xs text-gray-600">
                            <span className="font-semibold text-gray-800">Location:</span>{" "}
                            {e.location}
                          </p>
                        )}
                      </div>
                    )}

                    {e.latest_response ? (
                      <div className="mt-3 rounded-xl border border-violet-100 bg-violet-50/60 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs font-extrabold uppercase tracking-wide text-violet-700">
                            Seller response
                          </p>
                          {e.latest_response.created_at && (
                            <span className="text-[11px] text-violet-500">
                              {new Date(e.latest_response.created_at).toLocaleString()}
                            </span>
                          )}
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-700">
                          <p>
                            <span className="font-semibold">Item:</span>{" "}
                            {e.latest_response.item_name || itemName || "—"}
                          </p>
                          <p>
                            <span className="font-semibold">Price:</span>{" "}
                            ₹{Number(e.latest_response.amount || 0).toLocaleString()}
                          </p>
                          {e.latest_response.availability && (
                            <p className="col-span-2">
                              <span className="font-semibold">Availability:</span>{" "}
                              {e.latest_response.availability}
                            </p>
                          )}
                          {e.latest_response.delivery_display && (
                            <p className="col-span-2">
                              <span className="font-semibold">Delivery:</span>{" "}
                              {e.latest_response.delivery_display}
                            </p>
                          )}
                          {e.latest_response.description && (
                            <p className="col-span-2">
                              <span className="font-semibold">Details:</span>{" "}
                              {e.latest_response.description}
                            </p>
                          )}
                          {e.latest_response.message && (
                            <p className="col-span-2">
                              <span className="font-semibold">Message:</span>{" "}
                              {e.latest_response.message}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : e.status === "REJECTED" ? (
                      <div className="mt-3 rounded-xl border border-red-100 bg-red-50 p-3 text-xs text-red-700">
                        <span className="font-semibold">This enquiry was rejected.</span>{" "}
                        {e.rejection_reason || "No reason was provided."}
                      </div>
                    ) : e.status === "PENDING" || e.status === "NEW" ? (
                      <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-700">
                        <Clock className="w-3.5 h-3.5" /> Waiting for seller response
                      </div>
                    ) : null}
                  </div>

                  {/* Once a seller has quoted, this is the only path to the
                      price they offered — surface it right on the enquiry,
                      and keep it reachable after the buyer has decided. */}
                  {onViewQuotations &&
                    (e.latest_response ||
                      ["QUOTED", "RESPONDED", "ACCEPTED", "REJECTED"].includes(e.status)) && (
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => onViewQuotations(e.id)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-violet-50 text-violet-700 text-sm font-bold rounded-xl hover:bg-violet-100 transition-colors cursor-pointer border-none"
                        >
                          <FileText className="w-4 h-4" /> View Quotation
                        </button>
                      </div>
                    )}
                </div>
              </div>
            );
          })}

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
