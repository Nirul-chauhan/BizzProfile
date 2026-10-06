import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, X, Wrench, Send, Loader2, AlertTriangle } from "lucide-react";
import {
  sellerListMyServices,
  sellerCreateService,
  sellerUpdateService,
  sellerDeleteService,
  sellerSubmitService,
  getServiceCategories,
} from "../api";

const EMPTY_FORM = {
  name: "",
  category_id: "",
  subcategory_id: "",
  description: "",
  price: "",
  price_unit: "",
  is_available: true,
};

export default function SellerServiceManagement() {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [submittingId, setSubmittingId] = useState(null);

  useEffect(() => { load(); loadCategories(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const d = await sellerListMyServices();
      setServices(Array.isArray(d) ? d : (d?.items ?? []));
    } catch (e) { alert(e.message); }
    setLoading(false);
  };

  const loadCategories = async () => {
    try { const d = await getServiceCategories(); setCategories(Array.isArray(d) ? d : []); } catch {}
  };

  const handleSave = async () => {
    if (!form.name || !form.category_id) return;
    setSaving(true);
    const data = {
      name: form.name,
      category_id: Number(form.category_id),
      subcategory_id: form.subcategory_id ? Number(form.subcategory_id) : null,
      description: form.description || null,
      price: form.price ? Number(form.price) : null,
      price_min: form.price ? Number(form.price) : null,
      price_max: form.price_max ? Number(form.price_max) : null,
      price_unit: form.price_unit || null,
      is_available: form.is_available !== false,
    };
    try {
      if (editItem) { await sellerUpdateService(editItem.id, data); }
      else { await sellerCreateService(data); }
      setShowModal(false); setEditItem(null); setForm(EMPTY_FORM); load();
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const handleSubmit = async (svc) => {
    setSubmittingId(svc.id);
    try {
      await sellerSubmitService(svc.id);
      load();
    } catch (e) { alert(e.message); }
    setSubmittingId(null);
  };

  const handleDelete = async (svc) => {
    const warn = svc.approval_status === "APPROVED"
      ? "This service is live on the marketplace. Deleting it will remove it immediately. Continue?"
      : "Delete this service?";
    if (!confirm(warn)) return;
    try { await sellerDeleteService(svc.id); load(); } catch (e) { alert(e.message); }
  };

  const openCreate = () => { setForm(EMPTY_FORM); setEditItem(null); setShowModal(true); };

  const openEdit = (svc) => {
    if (svc.approval_status === "APPROVED") {
      alert("Approved services are locked. Contact admin to make changes.");
      return;
    }
    setForm({
      name: svc.name || "",
      category_id: svc.category_id || "",
      subcategory_id: svc.subcategory_id || "",
      description: svc.description || "",
      price: svc.price_min ?? "",
      price_max: svc.price_max ?? "",
      price_unit: svc.price_unit || "",
      is_available: svc.is_available !== false,
    });
    setEditItem(svc);
    setShowModal(true);
  };

  const pendingCount = services.filter(s => s.approval_status === "PENDING").length;
  const approvedCount = services.filter(s => s.approval_status === "APPROVED").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center"><Wrench className="w-5 h-5 text-indigo-600" /></div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">My Services</h2>
            <p className="text-sm text-gray-500">
              {services.length} service{services.length === 1 ? "" : "s"} · {pendingCount} awaiting review · {approvedCount} live
            </p>
          </div>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 cursor-pointer border-none">
          <Plus className="w-4 h-4" /> Add Service
        </button>
      </div>

      {loading ? <div className="text-center py-12 text-gray-400">Loading...</div> : services.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
          <Wrench className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm mb-3">No services yet</p>
          <button onClick={openCreate} className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 cursor-pointer border-none">Create Your First Service</button>
        </div>
      ) : (
        <div className="space-y-3">
          {services.map(svc => (
            <div key={svc.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {svc.image_url ? <img src={svc.image_url} alt="" className="w-full h-full object-cover" /> : <Wrench className="w-6 h-6 text-gray-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-gray-900 truncate">{svc.name}</h3>
                    <StatusBadge status={svc.approval_status} />
                    {svc.approval_status === "APPROVED"
                      ? <span className="text-[10px] font-bold text-green-600">LIVE</span>
                      : null}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatPrice(svc)}
                    {svc.price_unit ? ` / ${svc.price_unit}` : ""}
                    {svc.city ? ` · ${svc.city}` : ""}
                  </p>
                  {svc.submitted_at ? (
                    <p className="text-[11px] text-gray-400 mt-0.5">Submitted {formatDate(svc.submitted_at)}</p>
                  ) : (
                    <p className="text-[11px] text-gray-400 mt-0.5">Not submitted for review yet</p>
                  )}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {svc.approval_status !== "APPROVED" ? (
                    <button
                      onClick={() => handleSubmit(svc)}
                      disabled={submittingId === svc.id}
                      title="Send for approval"
                      className="p-1.5 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 disabled:opacity-50 cursor-pointer border-none"
                    >
                      {submittingId === svc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  ) : null}
                  <button
                    onClick={() => openEdit(svc)}
                    title={svc.approval_status === "APPROVED" ? "Approved services are locked" : "Edit"}
                    className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 cursor-pointer border-none"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(svc)} title="Delete" className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 cursor-pointer border-none">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {svc.rejection_reason ? (
                <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-700"><span className="font-bold">Rejected:</span> {svc.rejection_reason}</p>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">{editItem ? "Edit Service" : "Create Service"}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer border-none bg-transparent"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-3">
              <Field label="Service Name *" value={form.name || ""} onChange={v => setForm({ ...form, name: v })} />
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Category *</label>
                <select value={form.category_id || ""} onChange={e => setForm({ ...form, category_id: e.target.value, subcategory_id: "" })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                  <option value="">Select...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Subcategory</label>
                <select value={form.subcategory_id || ""} onChange={e => setForm({ ...form, subcategory_id: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                  <option value="">Select...</option>
                  {(categories.find(c => c.id === Number(form.category_id))?.subcategories || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Price" type="number" value={form.price ?? ""} onChange={v => setForm({ ...form, price: v })} />
                <Field label="Max Price" type="number" value={form.price_max ?? ""} onChange={v => setForm({ ...form, price_max: v })} />
                <Field label="Price Unit" value={form.price_unit || ""} onChange={v => setForm({ ...form, price_unit: v })} placeholder="per visit" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <textarea value={form.description || ""} onChange={e => setForm({ ...form, description: e.target.value })} rows={4} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none" />
              </div>
              <label className="flex items-center gap-2 text-xs text-gray-600">
                <input type="checkbox" checked={form.is_available !== false} onChange={e => setForm({ ...form, is_available: e.target.checked })} />
                Available for booking
              </label>
              <p className="text-[11px] text-gray-400">
                Services are reviewed by an admin before they appear on the public marketplace.
              </p>
              <button onClick={handleSave} disabled={saving || !form.name || !form.category_id} className="w-full py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 cursor-pointer border-none">
                {saving ? "Saving..." : editItem ? "Save Changes" : "Create Service"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatPrice(svc) {
  if (svc.price_min != null && svc.price_max != null) return `₹${svc.price_min} - ₹${svc.price_max}`;
  if (svc.price_min != null) return `₹${svc.price_min}`;
  return "Price on request";
}

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString();
}

function StatusBadge({ status }) {
  const s = { PENDING: "bg-yellow-100 text-yellow-700", APPROVED: "bg-green-100 text-green-700", REJECTED: "bg-red-100 text-red-700" };
  return <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${s[status] || "bg-gray-100 text-gray-500"}`}>{status}</span>;
}

function Field({ label, value, onChange, type = "text", placeholder = "" }) {
  return <div><label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" /></div>;
}
