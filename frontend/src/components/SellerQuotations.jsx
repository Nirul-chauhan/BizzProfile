import { useState, useEffect } from "react";
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  DollarSign,
  Calendar,
  Search,
  ArrowRight,
  Loader,
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

export default function SellerQuotations() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState({ amount: "", description: "", valid_until: "" });

  useEffect(() => {
    loadQuotations(true);
  }, []);

  const loadQuotations = async (reset = false) => {
    setLoading(true);
    try {
      const currentPage = reset ? 1 : page;
      const statusFilter = filterStatus !== "ALL" ? filterStatus : undefined;
      const data = await sellerListQuotations(currentPage, 20, statusFilter);
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
      const payload = {
        amount: editForm.amount ? parseFloat(editForm.amount) : undefined,
        description: editForm.description || undefined,
        valid_until: editForm.valid_until || undefined,
      };
      await sellerUpdateQuotation(editModal.id, payload);
      setEditModal(null);
      setEditForm({ amount: "", description: "", valid_until: "" });
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
      amount: q.amount || "",
      description: q.description || "",
      valid_until: q.valid_until ? q.valid_until.split("T")[0] : "",
    });
  };

  const filtered = quotations.filter((q) => {
    if (filterStatus !== "ALL" && q.status !== filterStatus) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        (q.description || "").toLowerCase().includes(query) ||
        String(q.amount).includes(query) ||
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
          { label: "Total", count: quotations.length, color: "bg-gray-50 text-gray-700" },
          { label: "Pending", count: statusCounts.PENDING || 0, color: "bg-amber-50 text-amber-700" },
          { label: "Accepted", count: statusCounts.ACCEPTED || 0, color: "bg-emerald-50 text-emerald-700" },
          { label: "Rejected", count: statusCounts.REJECTED || 0, color: "bg-red-50 text-red-700" },
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
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-bold text-gray-900">
                      Quotation #{q.id}
                    </span>
                    <StatusBadge status={q.status} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-500" />
                      <div>
                        <p className="text-xs text-gray-500">Amount</p>
                        <p className="text-sm font-bold text-gray-900">
                          ₹{q.amount?.toLocaleString() || "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      <div>
                        <p className="text-xs text-gray-500">Sent</p>
                        <p className="text-sm font-medium text-gray-700">
                          {q.created_at
                            ? new Date(q.created_at).toLocaleDateString()
                            : "—"}
                        </p>
                      </div>
                    </div>
                    {q.valid_until && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-500" />
                        <div>
                          <p className="text-xs text-gray-500">Valid Until</p>
                          <p className="text-sm font-medium text-gray-700">
                            {new Date(q.valid_until).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {q.description && (
                    <p className="text-sm text-gray-600 mt-3 bg-gray-50 rounded-lg p-3">
                      {q.description}
                    </p>
                  )}
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
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Amount (₹)</label>
                <input
                  type="number"
                  value={editForm.amount}
                  onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Enter amount"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                <textarea
                  rows="3"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                  placeholder="Enter description"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Valid Until</label>
                <input
                  type="date"
                  value={editForm.valid_until}
                  onChange={(e) => setEditForm({ ...editForm, valid_until: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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
