import { useState, useEffect } from "react";
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  Calendar,
  Search,
  ArrowRight,
  Loader,
  AlertCircle,
  RefreshCw,
  Send,
  Edit,
} from "lucide-react";
import {
  sellerListQuotations,
  sellerGetQuotation,
  sellerUpdateQuotation,
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
    : `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

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

function QuotationBreakdown({ q }) {
  return (
    <div className="space-y-1.5 mt-2">
      {(q.quantity > 1 || q.unit_price) && (
        <>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Quantity</span>
            <span className="font-medium text-gray-700">
              {q.quantity_label || `${q.quantity} units`}
            </span>
          </div>
          {q.unit_price !== null && q.unit_price !== undefined && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Unit Price</span>
              <span className="font-medium text-gray-700">
                {rupees(q.unit_price)}
              </span>
            </div>
          )}
        </>
      )}
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
    <div className="flex flex-wrap gap-2 mt-2">
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

export default function SellerQuotations() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState({
    quantity: "",
    unit_price: "",
    description: "",
    terms: "",
    delivery_days: "",
    valid_days: "",
  });

  useEffect(() => {
    loadQuotations(true);
  }, []);

  const loadQuotations = async (reset = false) => {
    setLoading(true);
    try {
      const currentPage = reset ? 1 : page;
      // "SENT"/"CLOSED" are client-side groupings, not real server statuses,
      // so only push a concrete status through to the API.
      const serverStatus = ["SENT", "CLOSED"].includes(filterStatus)
        ? undefined
        : filterStatus !== "ALL"
          ? filterStatus
          : undefined;
      const data = await sellerListQuotations(currentPage, 20, serverStatus);
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

  const handleUpdateQuotation = async () => {
    if (!editModal) return;
    setActionLoading(editModal.id);
    try {
      const qty = parseInt(editForm.quantity, 10);
      const price = parseFloat(editForm.unit_price);
      const payload = {
        quantity: Number.isFinite(qty) ? qty : undefined,
        unit_price: Number.isFinite(price) ? price : undefined,
        description: editForm.description || undefined,
        terms: editForm.terms || undefined,
        delivery_days:
          editForm.delivery_days === ""
            ? undefined
            : parseInt(editForm.delivery_days, 10),
        valid_days:
          editForm.valid_days === ""
            ? undefined
            : parseInt(editForm.valid_days, 10),
      };
      await sellerUpdateQuotation(editModal.id, payload);
      setEditModal(null);
      setEditForm({
        quantity: "",
        unit_price: "",
        description: "",
        terms: "",
        delivery_days: "",
        valid_days: "",
      });
      await loadQuotations(true);
    } catch (err) {
      console.error("Failed to update quotation:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const openEditModal = (q) => {
    setEditModal(q);
    setEditForm({
      quantity: q.quantity ?? "",
      unit_price: q.unit_price ?? "",
      description: q.description || "",
      terms: q.terms || "",
      delivery_days: q.delivery_days ?? "",
      valid_days: q.valid_days ?? "",
    });
  };

  const matchesStatusFilter = (q) => {
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

  const filtered = quotations.filter((q) => {
    if (!matchesStatusFilter(q)) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        (q.description || "").toLowerCase().includes(query) ||
        (q.terms || "").toLowerCase().includes(query) ||
        (q.buyer_name || "").toLowerCase().includes(query) ||
        String(q.amount).includes(query) ||
        String(q.quantity).includes(query) ||
        String(q.id).includes(query) ||
        String(q.buyer_id).includes(query)
      );
    }
    return true;
  });

  const statusCounts = quotations.reduce((acc, q) => {
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
            Manage quotations you've sent to buyers
          </p>
        </div>
        <button
          onClick={() => loadQuotations(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", key: "ALL", count: quotations.length, color: "bg-gray-50 text-gray-700" },
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
            Send quotations from the Enquiries section
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((q) => (
            <div
              key={q.id}
              className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-1">
                    <span className="text-sm font-bold text-gray-900">
                      Quotation #{q.id}
                    </span>
                    <StatusBadge status={q.status} />
                    {q.is_expired && q.status === "EXPIRED" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold">
                        <AlertCircle className="w-3 h-3" /> Validity passed
                      </span>
                    )}
                  </div>

                  {q.buyer_name && (
                    <p className="text-xs text-gray-500 mb-1">
                      To: {q.buyer_name}
                    </p>
                  )}
                  {(q.product_name || q.service_name) && (
                    <p className="text-xs text-gray-500 mb-2">
                      For: {q.product_name || q.service_name}
                    </p>
                  )}

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

                  <p className="text-xs text-gray-400 mt-3 inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Sent{" "}
                    {q.created_at
                      ? new Date(q.created_at).toLocaleDateString()
                      : "—"}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {(q.status === "PENDING" || q.status === "SENT") && (
                    <button
                      onClick={() => openEditModal(q)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-600 text-sm font-bold rounded-xl hover:bg-blue-100 transition-colors cursor-pointer border-none"
                    >
                      <Edit className="w-4 h-4" /> Edit
                    </button>
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

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setEditModal(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Edit Quotation #{editModal.id}</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editForm.quantity}
                    onChange={(e) =>
                      setEditForm({ ...editForm, quantity: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Unit Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editForm.unit_price}
                    onChange={(e) =>
                      setEditForm({ ...editForm, unit_price: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="120.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Delivery (days)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="365"
                    value={editForm.delivery_days}
                    onChange={(e) =>
                      setEditForm({ ...editForm, delivery_days: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Valid For (days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={editForm.valid_days}
                    onChange={(e) =>
                      setEditForm({ ...editForm, valid_days: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="7"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  rows="2"
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                  placeholder="Enter description"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Terms
                </label>
                <textarea
                  rows="2"
                  value={editForm.terms}
                  onChange={(e) =>
                    setEditForm({ ...editForm, terms: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                  placeholder="Payment on delivery, 1 year warranty"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setEditModal(null)}
                className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-gray-900 cursor-pointer border-none bg-transparent"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateQuotation}
                disabled={actionLoading === editModal.id}
                className="inline-flex items-center gap-2 px-5 py-2 bg-blue-500 text-white text-sm font-bold rounded-xl hover:bg-blue-600 cursor-pointer border-none disabled:opacity-50"
              >
                {actionLoading === editModal.id ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
