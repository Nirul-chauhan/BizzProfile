import { useState, useEffect } from "react";
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  Search,
  ArrowRight,
  Loader,
  AlertCircle,
  RefreshCw,
  Columns,
  Truck,
  X,
} from "lucide-react";
import {
  buyerListQuotations,
  buyerAcceptQuotation,
  buyerRejectQuotation,
} from "../api";

const STATUS_STYLES = {
  PENDING: "bg-amber-100 text-amber-700",
  SENT: "bg-blue-100 text-blue-700",
  ACCEPTED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
  EXPIRED: "bg-gray-100 text-gray-600",
  CANCELLED: "bg-gray-100 text-gray-500",
};

const rupees = (n) =>
  n === null || n === undefined
    ? "—"
    : `₹${Number(n).toLocaleString("en-IN", {
        maximumFractionDigits: 2,
      })}`;

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

function isDecidable(q) {
  return (q.status === "PENDING" || q.status === "SENT") && !q.is_expired;
}

// A quotation rendered the way a real business document reads: what was
// quoted, at what unit price, what it totals, and on what terms.
function QuotationBreakdown({ q, compact = false }) {
  const rows = [
    {
      key: "qty",
      label: "Quantity",
      value: q.quantity_label || `${q.quantity} units`,
      hide: q.quantity === 1 && !q.unit_price,
    },
    {
      key: "unit",
      label: "Unit Price",
      value: rupees(q.unit_price),
      hide: q.unit_price === null || q.unit_price === undefined,
    },
  ].filter((r) => !r.hide);

  return (
    <div className={compact ? "space-y-1" : "space-y-2"}>
      {rows.map((r) => (
        <div key={r.key} className="flex items-center justify-between text-sm">
          <span className="text-gray-500">{r.label}</span>
          <span className="font-medium text-gray-700">{r.value}</span>
        </div>
      ))}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">Total</span>
        <span className="font-extrabold text-gray-900">{rupees(q.amount)}</span>
      </div>
    </div>
  );
}

function QuotationTerms({ q }) {
  const chips = [];
  if (q.delivery_display) {
    chips.push({ icon: Truck, label: `Delivery: ${q.delivery_display}` });
  }
  if (q.valid_days) {
    chips.push({ icon: Clock, label: `Valid for ${q.valid_days} days` });
  }
  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {chips.map((c) => {
        const Icon = c.icon;
        return (
          <span
            key={c.label}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700"
          >
            <Icon className="w-3.5 h-3.5 text-gray-400" />
            {c.label}
          </span>
        );
      })}
    </div>
  );
}

// The "For: ..." line names what was quoted so the buyer can tell two quotes
// apart at a glance.
function QuotationSubject({ q }) {
  const name = q.product_name || q.service_name;
  if (!name) return null;
  return <p className="text-xs text-gray-500 mb-3">For: {name}</p>;
}

export default function BuyerQuotations({ enquiryFilter = null, onClearEnquiryFilter }) {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState([]);

  useEffect(() => {
    loadQuotations(true);
  }, []);

  const loadQuotations = async (reset = false) => {
    setLoading(true);
    try {
      const currentPage = reset ? 1 : page;
      const data = await buyerListQuotations(currentPage);
      const items = data.items || data || [];
      if (reset) {
        setQuotations(items);
        setPage(1);
      } else {
        setQuotations((prev) => [...prev, ...items]);
      }
      setHasMore(items.length >= 20);
    } catch (err) {
      console.error("Failed to load quotations:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id) => {
    setActionLoading(id);
    try {
      await buyerAcceptQuotation(id);
      setQuotations((prev) =>
        prev.map((q) => (q.id === id ? { ...q, status: "ACCEPTED" } : q))
      );
    } catch (err) {
      console.error("Failed to accept quotation:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    setActionLoading(id);
    try {
      await buyerRejectQuotation(id);
      setQuotations((prev) =>
        prev.map((q) => (q.id === id ? { ...q, status: "REJECTED" } : q))
      );
    } catch (err) {
      console.error("Failed to reject quotation:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const toggleCompareSelect = (id) => {
    setSelectedForCompare((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const comparedQuotations = quotations.filter((q) =>
    selectedForCompare.includes(q.id)
  );

  const matchesStatusFilter = (q) => {
    // Arriving from an enquiry means "just show me what this one got quoted".
    if (enquiryFilter != null && q.enquiry_id !== enquiryFilter) return false;
    if (filterStatus === "ALL") return true;
    if (filterStatus === "SENT") return q.status === "PENDING" || q.status === "SENT";
    if (filterStatus === "CLOSED")
      return (
        q.status === "REJECTED" ||
        q.status === "EXPIRED" ||
        q.status === "CANCELLED"
      );
    return q.status === filterStatus;
  };

  // Counts must respect the enquiry filter, otherwise the summary cards claim
  // numbers the list below them does not contain.
  const scopedQuotations = quotations.filter(
    (q) => enquiryFilter == null || q.enquiry_id === enquiryFilter
  );

  const filtered = scopedQuotations.filter((q) => {
    if (!matchesStatusFilter(q)) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        (q.description || "").toLowerCase().includes(query) ||
        (q.terms || "").toLowerCase().includes(query) ||
        (q.business_name || "").toLowerCase().includes(query) ||
        String(q.amount).includes(query) ||
        String(q.quantity).includes(query) ||
        String(q.id).includes(query)
      );
    }
    return true;
  });

  const statusCounts = scopedQuotations.reduce((acc, q) => {
    acc[q.status] = (acc[q.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">
            My Quotations
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            View and manage quotations from sellers
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedForCompare.length >= 2 && (
            <button
              onClick={() => setCompareMode(!compareMode)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-bold hover:bg-blue-600 cursor-pointer border-none"
            >
              <Columns className="w-4 h-4" />
              {compareMode ? "Exit Compare" : `Compare (${selectedForCompare.length})`}
            </button>
          )}
          <button
            onClick={() => loadQuotations(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Scoped view banner — only shown when the buyer jumped here from an
          enquiry, so they can tell why the list is short. */}
      {enquiryFilter != null && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-violet-50 border border-violet-200 rounded-xl">
          <span className="text-sm font-medium text-violet-800">
            Showing quotations for Enquiry #{enquiryFilter}
          </span>
          <button
            onClick={onClearEnquiryFilter}
            className="inline-flex items-center gap-1 text-xs font-bold text-violet-700 hover:text-violet-900 cursor-pointer border-none bg-transparent"
          >
            <X className="w-3.5 h-3.5" /> Show all
          </button>
        </div>
      )}

      {/* Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", key: "ALL", count: scopedQuotations.length, color: "bg-gray-50 text-gray-700" },
          {
            label: "Awaiting",
            key: "SENT",
            count: (statusCounts.PENDING || 0) + (statusCounts.SENT || 0),
            color: "bg-blue-50 text-blue-700",
          },
          { label: "Accepted", key: "ACCEPTED", count: statusCounts.ACCEPTED || 0, color: "bg-emerald-50 text-emerald-700" },
          {
            label: "Closed",
            key: "CLOSED",
            count: (statusCounts.REJECTED || 0) + (statusCounts.EXPIRED || 0) + (statusCounts.CANCELLED || 0),
            color: "bg-gray-50 text-gray-500",
          },
        ].map((s) => (
          <button
            key={s.key}
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
          placeholder="Search quotations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>

      {/* Quotations List */}
      {loading && quotations.length === 0 ? (
        <div className="flex items-center justify-center h-40">
          <Loader className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium text-gray-600">No quotations found</p>
          <p className="text-sm text-gray-400 mt-1">
            {enquiryFilter != null
              ? `The seller has not quoted on Enquiry #${enquiryFilter} yet`
              : "Quotations from sellers will appear here"}
          </p>
        </div>
      ) : compareMode && comparedQuotations.length >= 2 ? (
        /* ========== COMPARE VIEW ========== */
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="p-4 bg-blue-50 border-b border-blue-100">
            <p className="text-sm font-bold text-blue-700">
              Comparing {comparedQuotations.length} quotations
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Field</th>
                  {comparedQuotations.map((q) => (
                    <th key={q.id} className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">
                      Quotation #{q.id}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-700">Quantity</td>
                  {comparedQuotations.map((q) => (
                    <td key={q.id} className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                      {q.quantity_label || `${q.quantity} units`}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-700">Unit Price</td>
                  {comparedQuotations.map((q) => (
                    <td key={q.id} className="px-4 py-3 text-center text-sm text-gray-700">
                      {q.unit_price ? rupees(q.unit_price) : "Lump sum"}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-700">Total</td>
                  {comparedQuotations.map((q) => (
                    <td key={q.id} className="px-4 py-3 text-center text-sm font-extrabold text-gray-900">
                      {rupees(q.amount)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-700">Delivery</td>
                  {comparedQuotations.map((q) => (
                    <td key={q.id} className="px-4 py-3 text-center text-sm text-gray-700">
                      {q.delivery_display || "—"}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-700">Status</td>
                  {comparedQuotations.map((q) => (
                    <td key={q.id} className="px-4 py-3 text-center">
                      <StatusBadge status={q.status} />
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-700">Received</td>
                  {comparedQuotations.map((q) => (
                    <td key={q.id} className="px-4 py-3 text-center text-sm text-gray-700">
                      {q.created_at ? new Date(q.created_at).toLocaleDateString() : "—"}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-700">Valid Until</td>
                  {comparedQuotations.map((q) => (
                    <td key={q.id} className="px-4 py-3 text-center text-sm text-gray-700">
                      {q.valid_until ? new Date(q.valid_until).toLocaleDateString() : "—"}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-700">Description</td>
                  {comparedQuotations.map((q) => (
                    <td key={q.id} className="px-4 py-3 text-center text-sm text-gray-600 max-w-[200px] truncate">
                      {q.description || "—"}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-700">Action</td>
                  {comparedQuotations.map((q) => (
                    <td key={q.id} className="px-4 py-3 text-center">
                      {(q.status === "PENDING" || q.status === "SENT") && (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleReject(q.id)}
                            disabled={actionLoading === q.id}
                            className="px-3 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 cursor-pointer border-none"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleAccept(q.id)}
                            disabled={actionLoading === q.id}
                            className="px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 cursor-pointer border-none"
                          >
                            Accept
                          </button>
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((q) => (
            <div
              key={q.id}
              className={`bg-white border rounded-2xl p-5 hover:shadow-md transition-all ${
                q.status === "ACCEPTED"
                  ? "border-emerald-200"
                  : q.status === "REJECTED" || q.status === "EXPIRED"
                    ? "border-gray-200 opacity-80"
                    : "border-gray-200"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <input
                      type="checkbox"
                      checked={selectedForCompare.includes(q.id)}
                      onChange={() => toggleCompareSelect(q.id)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-bold text-gray-900">
                      Quotation #{q.id}
                    </span>
                    <StatusBadge status={q.status} />
                    {q.is_expired && q.status !== "EXPIRED" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold">
                        <AlertCircle className="w-3 h-3" /> Validity passed
                      </span>
                    )}
                  </div>

                  {q.business_name && (
                    <p className="text-sm font-semibold text-gray-800 mb-3">
                      {q.business_name}
                    </p>
                  )}
                  <QuotationSubject q={q} />

                  <QuotationBreakdown q={q} />

                  <QuotationTerms q={q} />

                  {q.description && (
                    <p className="text-sm text-gray-600 mt-3 bg-gray-50 rounded-lg p-3">
                      {q.description}
                    </p>
                  )}
                  {q.terms && (
                    <p className="text-xs text-gray-500 mt-2 bg-gray-50/60 border-l-2 border-gray-200 rounded-r-lg p-2 pl-3">
                      <span className="font-bold text-gray-600">Terms: </span>
                      {q.terms}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      Received{" "}
                      {q.created_at
                        ? new Date(q.created_at).toLocaleDateString()
                        : "—"}
                    </span>
                    {q.valid_until && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        Valid until{" "}
                        {new Date(q.valid_until).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {isDecidable(q) ? (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleReject(q.id)}
                      disabled={actionLoading === q.id}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 text-sm font-bold rounded-xl hover:bg-red-100 transition-colors cursor-pointer border-none disabled:opacity-50"
                    >
                      {actionLoading === q.id ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      Reject
                    </button>
                    <button
                      onClick={() => handleAccept(q.id)}
                      disabled={actionLoading === q.id}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white text-sm font-bold rounded-xl hover:bg-emerald-600 transition-colors cursor-pointer border-none disabled:opacity-50"
                    >
                      {actionLoading === q.id ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      Accept
                    </button>
                  </div>
                ) : q.status === "EXPIRED" || q.is_expired ? (
                  <div className="flex-shrink-0">
                    <span className="px-4 py-2 bg-gray-50 border border-gray-200 text-gray-500 text-xs font-bold rounded-xl block text-center">
                      Expired
                      <span className="block font-normal text-[10px] mt-0.5">
                        Ask the seller to re-quote
                      </span>
                    </span>
                  </div>
                ) : (
                  <div className="flex-shrink-0">
                    <StatusBadge status={q.status} />
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Load More */}
          {hasMore && (
            <div className="text-center pt-4">
              <button
                onClick={() => {
                  setPage((p) => p + 1);
                  loadQuotations(false);
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
