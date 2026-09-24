import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, X, Wrench, Clock, CheckCircle2, XCircle } from "lucide-react";
import { buyerListMyServices, buyerCreateService, buyerUpdateService, buyerDeleteService, getServiceCategories } from "../api";

export default function BuyerServiceManagement() {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); loadCategories(); }, []);

  const load = async () => {
    setLoading(true);
    try { const d = await buyerListMyServices(); setServices(Array.isArray(d) ? d : []); } catch {}
    setLoading(false);
  };
  const loadCategories = async () => { try { const d = await getServiceCategories(); setCategories(Array.isArray(d) ? d : []); } catch {} };

  const handleSave = async () => {
    if (!form.name || !form.category_id) return;
    setSaving(true);
    try {
      const data = { ...form, category_id: Number(form.category_id), subcategory_id: form.subcategory_id ? Number(form.subcategory_id) : null, price: form.price ? Number(form.price) : null, service_radius_km: form.service_radius_km ? Number(form.service_radius_km) : null };
      if (editItem) { await buyerUpdateService(editItem.id, data); }
      else { await buyerCreateService(data); }
      setShowModal(false); setEditItem(null); setForm({}); load();
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this service?")) return;
    try { await buyerDeleteService(id); load(); } catch (e) { alert(e.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center"><Wrench className="w-5 h-5 text-indigo-600" /></div>
          <div><h2 className="text-xl font-bold text-gray-900">My Services</h2><p className="text-sm text-gray-500">Browse and submit service listings</p></div>
        </div>
        <button onClick={() => { setForm({}); setEditItem(null); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 cursor-pointer border-none"><Plus className="w-4 h-4" /> Add Service</button>
      </div>

      {loading ? <div className="text-center py-12 text-gray-400">Loading...</div> : services.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-xl"><Wrench className="w-10 h-10 text-gray-300 mx-auto mb-2" /><p className="text-gray-500 text-sm">No services yet</p></div>
      ) : (
        <div className="space-y-3">
          {services.map(svc => (
            <div key={svc.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
              <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                {svc.image_url ? <img src={svc.image_url} alt="" className="w-full h-full object-cover" /> : <Wrench className="w-6 h-6 text-gray-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-gray-900 truncate">{svc.name}</h3>
                  <StatusBadge status={svc.approval_status} />
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{svc.category_name} {svc.city ? `- ${svc.city}` : ""}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setForm(svc); setEditItem(svc); setShowModal(true); }} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 cursor-pointer border-none"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(svc.id)} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 cursor-pointer border-none"><Trash2 className="w-4 h-4" /></button>
              </div>
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
              <F label="Service Name *" value={form.name || ""} onChange={v => setForm({ ...form, name: v })} />
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Category *</label>
                <select value={form.category_id || ""} onChange={e => setForm({ ...form, category_id: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                  <option value="">Select...</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Subcategory</label>
                <select value={form.subcategory_id || ""} onChange={e => setForm({ ...form, subcategory_id: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                  <option value="">Select...</option>
                  {(categories.find(c => c.id === Number(form.category_id))?.subcategories || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select></div>
              <F label="Provider Name" value={form.provider_name || ""} onChange={v => setForm({ ...form, provider_name: v })} />
              <F label="Contact Number" value={form.contact_number || ""} onChange={v => setForm({ ...form, contact_number: v })} />
              <div className="grid grid-cols-2 gap-3">
                <F label="Price" type="number" value={form.price || ""} onChange={v => setForm({ ...form, price: v })} />
                <F label="Price Unit" value={form.price_unit || ""} onChange={v => setForm({ ...form, price_unit: v })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <F label="City" value={form.city || ""} onChange={v => setForm({ ...form, city: v })} />
                <F label="State" value={form.state || ""} onChange={v => setForm({ ...form, state: v })} />
              </div>
              <F label="Society Name" value={form.society_name || ""} onChange={v => setForm({ ...form, society_name: v })} />
              <F label="Image URL" value={form.image_url || ""} onChange={v => setForm({ ...form, image_url: v })} />
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <textarea value={form.description || ""} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none" /></div>
              <button onClick={handleSave} disabled={saving || !form.name || !form.category_id} className="w-full py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 cursor-pointer border-none">{saving ? "Saving..." : "Submit for Approval"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const s = { PENDING: "bg-yellow-100 text-yellow-700", APPROVED: "bg-green-100 text-green-700", REJECTED: "bg-red-100 text-red-700" };
  return <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${s[status] || "bg-gray-100 text-gray-500"}`}>{status}</span>;
}

function F({ label, value, onChange, type = "text", placeholder = "" }) {
  return <div><label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" /></div>;
}
