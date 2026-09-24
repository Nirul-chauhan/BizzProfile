import { useState, useEffect } from "react";
import {
  Plus, Pencil, Trash2, X, CheckCircle2, XCircle, Clock, Search, Wrench, Eye,
  ToggleLeft, ToggleRight, Star, StarOff, ChevronDown, ChevronRight,
} from "lucide-react";
import {
  adminListServiceCategories, adminCreateServiceCategory, adminUpdateServiceCategory, adminDeleteServiceCategory, adminToggleServiceCategory,
  adminCreateServiceSubcategory, adminUpdateServiceSubcategory, adminDeleteServiceSubcategory,
  adminListServiceListings, adminCreateServiceListing, adminUpdateServiceListing, adminDeleteServiceListing,
  adminToggleServiceActive, adminToggleServiceFeatured, adminReviewServiceListing, adminListServiceRequests,
} from "../api";

export default function ServiceManagement() {
  const [activeTab, setActiveTab] = useState("services");
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState({ items: [], total: 0 });
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [showModal, setShowModal] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({});
  const [subForm, setSubForm] = useState({ name: "", category_id: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => { loadCategories(); }, []);
  useEffect(() => { if (activeTab === "services") loadServices(); }, [activeTab, search, statusFilter, catFilter, page]);
  useEffect(() => { if (activeTab === "requests") loadRequests(); }, [activeTab]);

  const loadCategories = async () => {
    try { const d = await adminListServiceCategories(); setCategories(Array.isArray(d) ? d : []); } catch {}
  };
  const loadServices = async () => {
    setLoading(true);
    try {
      const d = await adminListServiceListings({ search, approval_status: statusFilter, category_id: catFilter, page, page_size: 20 });
      setServices(d);
    } catch {}
    setLoading(false);
  };
  const loadRequests = async () => {
    setLoading(true);
    try { const d = await adminListServiceRequests(); setRequests(Array.isArray(d) ? d : []); } catch {}
    setLoading(false);
  };

  const handleSaveCategory = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      if (editItem) { await adminUpdateServiceCategory(editItem.id, form); }
      else { await adminCreateServiceCategory(form); }
      setShowModal(null); setEditItem(null); setForm({}); loadCategories();
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const handleSaveSubcategory = async () => {
    if (!subForm.name || !subForm.category_id) return;
    setSaving(true);
    try {
      if (editItem) { await adminUpdateServiceSubcategory(editItem.id, subForm); }
      else { await adminCreateServiceSubcategory({ ...subForm, category_id: Number(subForm.category_id) }); }
      setShowModal(null); setEditItem(null); setSubForm({ name: "", category_id: "", description: "" }); loadCategories();
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const handleSaveService = async () => {
    if (!form.name || !form.category_id) return;
    setSaving(true);
    try {
      const data = { ...form, category_id: Number(form.category_id), subcategory_id: form.subcategory_id ? Number(form.subcategory_id) : null, price: form.price ? Number(form.price) : null, service_radius_km: form.service_radius_km ? Number(form.service_radius_km) : null };
      if (editItem) { await adminUpdateServiceListing(editItem.id, data); }
      else { await adminCreateServiceListing(data); }
      setShowModal(null); setEditItem(null); setForm({}); loadServices();
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const handleReview = async (id, status) => {
    try { await adminReviewServiceListing(id, { approval_status: status }); loadRequests(); loadServices(); } catch (e) { alert(e.message); }
  };

  const handleDelete = async (type, id) => {
    if (!confirm("Are you sure?")) return;
    try {
      if (type === "category") await adminDeleteServiceCategory(id);
      else if (type === "service") await adminDeleteServiceListing(id);
      loadCategories(); loadServices();
    } catch (e) { alert(e.message); }
  };

  const tabs = [
    { id: "services", label: "Manage Services" },
    { id: "categories", label: "Categories" },
    { id: "requests", label: `Requests (${requests.length})` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center"><Wrench className="w-5 h-5 text-indigo-600" /></div>
        <div><h2 className="text-xl font-bold text-gray-900">Our Services Management</h2><p className="text-sm text-gray-500">Manage service categories and listings</p></div>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex-1 py-2 px-4 text-sm font-bold rounded-lg transition-colors cursor-pointer border-none ${activeTab === t.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>{t.label}</button>
        ))}
      </div>

      {/* ─── Services Tab ─── */}
      {activeTab === "services" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search services..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="px-4 py-2 border border-gray-200 rounded-xl text-sm bg-white">
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <select value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1); }} className="px-4 py-2 border border-gray-200 rounded-xl text-sm bg-white">
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button onClick={() => { setForm({}); setEditItem(null); setShowModal("service"); }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 cursor-pointer border-none"><Plus className="w-4 h-4" /> Add Service</button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading...</div>
          ) : (services.items || []).length === 0 ? (
            <div className="text-center py-12 bg-white border border-gray-200 rounded-xl"><Wrench className="w-10 h-10 text-gray-300 mx-auto mb-2" /><p className="text-gray-500 text-sm">No services found</p></div>
          ) : (
            <div className="space-y-3">
              {(services.items || []).map(svc => (
                <div key={svc.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
                  <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {svc.image_url ? <img src={svc.image_url} alt="" className="w-full h-full object-cover" /> : <Wrench className="w-6 h-6 text-gray-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-gray-900 truncate">{svc.name}</h3>
                      <StatusBadge status={svc.approval_status} />
                      {svc.is_active && <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[9px] font-bold rounded">ACTIVE</span>}
                      {svc.is_featured && <Star className="w-3.5 h-3.5 text-yellow-500" />}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{svc.category_name}{svc.subcategory_name ? ` / ${svc.subcategory_name}` : ""} {svc.city ? `- ${svc.city}` : ""}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{svc.provider_name || "No provider"} {svc.price != null ? `- ₹${svc.price}` : ""}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {svc.approval_status === "PENDING" && (
                      <>
                        <button onClick={() => handleReview(svc.id, "APPROVED")} className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 cursor-pointer border-none" title="Approve"><CheckCircle2 className="w-4 h-4" /></button>
                        <button onClick={() => handleReview(svc.id, "REJECTED")} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 cursor-pointer border-none" title="Reject"><XCircle className="w-4 h-4" /></button>
                      </>
                    )}
                    <button onClick={() => adminToggleServiceActive(svc.id).then(loadServices)} className="p-1.5 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer border-none" title="Toggle Active">
                      {svc.is_active ? <ToggleRight className="w-4 h-4 text-green-600" /> : <ToggleLeft className="w-4 h-4 text-gray-400" />}
                    </button>
                    <button onClick={() => adminToggleServiceFeatured(svc.id).then(loadServices)} className="p-1.5 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer border-none" title="Toggle Featured">
                      {svc.is_featured ? <Star className="w-4 h-4 text-yellow-500" /> : <StarOff className="w-4 h-4 text-gray-400" />}
                    </button>
                    <button onClick={() => { setEditItem(svc); setForm(svc); setShowModal("service"); }} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 cursor-pointer border-none"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete("service", svc.id)} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 cursor-pointer border-none"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {services.total_pages > 1 && (
            <div className="flex justify-center gap-2">
              {Array.from({ length: services.total_pages }, (_, i) => (
                <button key={i} onClick={() => setPage(i + 1)} className={`w-8 h-8 rounded-lg text-sm font-bold cursor-pointer border-none ${page === i + 1 ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{i + 1}</button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Categories Tab ─── */}
      {activeTab === "categories" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <button onClick={() => { setForm({ name: "", description: "", icon: "", color: "", sort_order: 0 }); setEditItem(null); setShowModal("category"); }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 cursor-pointer border-none"><Plus className="w-4 h-4" /> Add Category</button>
            <button onClick={() => { setSubForm({ name: "", category_id: "", description: "" }); setEditItem(null); setShowModal("subcategory"); }} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-bold rounded-xl hover:bg-purple-700 cursor-pointer border-none"><Plus className="w-4 h-4" /> Add Subcategory</button>
          </div>
          {categories.map(cat => (
            <div key={cat.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center gap-4 p-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: cat.color || "#6366f1" }}>{cat.name[0]}</div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-gray-900">{cat.name}</h3>
                  <p className="text-xs text-gray-400">{(cat.subcategories || []).length} subcategories</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => adminToggleServiceCategory(cat.id).then(loadCategories)} className="p-1.5 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer border-none">
                    {cat.is_active ? <ToggleRight className="w-4 h-4 text-green-600" /> : <ToggleLeft className="w-4 h-4 text-gray-400" />}
                  </button>
                  <button onClick={() => { setEditItem(cat); setForm(cat); setShowModal("category"); }} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 cursor-pointer border-none"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete("category", cat.id)} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 cursor-pointer border-none"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              {(cat.subcategories || []).length > 0 && (
                <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-2">
                  <div className="flex flex-wrap gap-2">
                    {cat.subcategories.map(sub => (
                      <span key={sub.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs">
                        <span className="font-medium text-gray-700">{sub.name}</span>
                        <button onClick={() => { setEditItem(sub); setSubForm({ name: sub.name, category_id: sub.category_id, description: sub.description || "" }); setShowModal("subcategory"); }} className="text-gray-400 hover:text-blue-600 cursor-pointer border-none bg-transparent p-0"><Pencil className="w-3 h-3" /></button>
                        <button onClick={() => adminDeleteServiceSubcategory(sub.id).then(loadCategories)} className="text-gray-400 hover:text-red-600 cursor-pointer border-none bg-transparent p-0"><Trash2 className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ─── Requests Tab ─── */}
      {activeTab === "requests" && (
        <div className="space-y-3">
          {loading ? <div className="text-center py-12 text-gray-400">Loading...</div> : requests.length === 0 ? (
            <div className="text-center py-12 bg-white border border-gray-200 rounded-xl"><CheckCircle2 className="w-10 h-10 text-gray-300 mx-auto mb-2" /><p className="text-gray-500 text-sm">No pending requests</p></div>
          ) : requests.map(svc => (
            <div key={svc.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2"><h3 className="text-sm font-bold text-gray-900 truncate">{svc.name}</h3><StatusBadge status={svc.approval_status} /></div>
                <p className="text-xs text-gray-400">{svc.category_name} {svc.city ? `- ${svc.city}` : ""} | by user #{svc.added_by_user_id}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleReview(svc.id, "APPROVED")} className="px-3 py-1.5 bg-green-50 text-green-600 text-xs font-bold rounded-lg hover:bg-green-100 cursor-pointer border-none">Approve</button>
                <button onClick={() => handleReview(svc.id, "REJECTED")} className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 cursor-pointer border-none">Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Modals ─── */}
      {showModal === "category" && (
        <Modal title={editItem ? "Edit Category" : "Add Category"} onClose={() => { setShowModal(null); setEditItem(null); }}>
          <Input label="Category Name *" value={form.name || ""} onChange={v => setForm({ ...form, name: v })} />
          <Input label="Description" value={form.description || ""} onChange={v => setForm({ ...form, description: v })} />
          <Input label="Icon (emoji)" value={form.icon || ""} onChange={v => setForm({ ...form, icon: v })} />
          <Input label="Color (hex)" value={form.color || ""} onChange={v => setForm({ ...form, color: v })} placeholder="#6366f1" />
          <Input label="Sort Order" type="number" value={form.sort_order || 0} onChange={v => setForm({ ...form, sort_order: Number(v) })} />
          <button onClick={handleSaveCategory} disabled={saving || !form.name} className="w-full py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 cursor-pointer border-none">{saving ? "Saving..." : "Save"}</button>
        </Modal>
      )}
      {showModal === "subcategory" && (
        <Modal title={editItem ? "Edit Subcategory" : "Add Subcategory"} onClose={() => { setShowModal(null); setEditItem(null); }}>
          <Select label="Category *" value={subForm.category_id} onChange={v => setSubForm({ ...subForm, category_id: v })} options={categories.map(c => ({ value: c.id, label: c.name }))} />
          <Input label="Subcategory Name *" value={subForm.name} onChange={v => setSubForm({ ...subForm, name: v })} />
          <Input label="Description" value={subForm.description || ""} onChange={v => setSubForm({ ...subForm, description: v })} />
          <button onClick={handleSaveSubcategory} disabled={saving || !subForm.name || !subForm.category_id} className="w-full py-2.5 bg-purple-600 text-white text-sm font-bold rounded-lg hover:bg-purple-700 disabled:opacity-50 cursor-pointer border-none">{saving ? "Saving..." : "Save"}</button>
        </Modal>
      )}
      {showModal === "service" && (
        <Modal title={editItem ? "Edit Service" : "Add Service"} onClose={() => { setShowModal(null); setEditItem(null); }} wide>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Service Name *" value={form.name || ""} onChange={v => setForm({ ...form, name: v })} />
            <Select label="Category *" value={form.category_id || ""} onChange={v => setForm({ ...form, category_id: v })} options={categories.map(c => ({ value: c.id, label: c.name }))} />
            <Select label="Subcategory" value={form.subcategory_id || ""} onChange={v => setForm({ ...form, subcategory_id: v })} options={(categories.find(c => c.id === Number(form.category_id))?.subcategories || []).map(s => ({ value: s.id, label: s.name }))} />
            <Input label="Provider Name" value={form.provider_name || ""} onChange={v => setForm({ ...form, provider_name: v })} />
            <Input label="Contact Number" value={form.contact_number || ""} onChange={v => setForm({ ...form, contact_number: v })} />
            <Input label="Price" type="number" value={form.price || ""} onChange={v => setForm({ ...form, price: v })} />
            <Input label="Price Unit" value={form.price_unit || ""} onChange={v => setForm({ ...form, price_unit: v })} placeholder="e.g., per visit" />
            <Input label="City" value={form.city || ""} onChange={v => setForm({ ...form, city: v })} />
            <Input label="State" value={form.state || ""} onChange={v => setForm({ ...form, state: v })} />
            <Input label="Society Name" value={form.society_name || ""} onChange={v => setForm({ ...form, society_name: v })} />
            <Input label="Service Radius (km)" type="number" value={form.service_radius_km || ""} onChange={v => setForm({ ...form, service_radius_km: v })} />
            <Input label="Image URL" value={form.image_url || ""} onChange={v => setForm({ ...form, image_url: v })} />
          </div>
          <div className="mt-3"><Textarea label="Description" value={form.description || ""} onChange={v => setForm({ ...form, description: v })} /></div>
          <div className="mt-3"><Textarea label="Full Details" value={form.full_details || ""} onChange={v => setForm({ ...form, full_details: v })} rows={5} /></div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <Input label="Address" value={form.address || ""} onChange={v => setForm({ ...form, address: v })} />
            <Input label="Country" value={form.country || ""} onChange={v => setForm({ ...form, country: v })} />
          </div>
          <button onClick={handleSaveService} disabled={saving || !form.name || !form.category_id} className="w-full py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 cursor-pointer border-none mt-4">{saving ? "Saving..." : "Save"}</button>
        </Modal>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = { PENDING: "bg-yellow-100 text-yellow-700", APPROVED: "bg-green-100 text-green-700", REJECTED: "bg-red-100 text-red-700" };
  return <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${styles[status] || "bg-gray-100 text-gray-500"}`}>{status}</span>;
}

function Modal({ title, children, onClose, wide }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className={`bg-white rounded-2xl shadow-xl ${wide ? "max-w-2xl" : "max-w-md"} w-full max-h-[90vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer border-none bg-transparent"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-3">{children}</div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", placeholder = "" }) {
  return (
    <div><label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
  );
}

function Textarea({ label, value, onChange, rows = 3 }) {
  return (
    <div><label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none" /></div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div><label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none">
        <option value="">Select...</option>
        {(options || []).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select></div>
  );
}
