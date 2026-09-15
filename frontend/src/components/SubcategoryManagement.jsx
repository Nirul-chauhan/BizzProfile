import { useState, useEffect, useMemo } from "react";
import {
  adminListSubcategories,
  adminListCategories,
  adminCreateSubcategory,
  adminUpdateSubcategory,
  adminDeleteSubcategory,
} from "../api";
import {
  FolderOpen,
  FolderTree,
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Tag,
  ArrowUpDown,
  GripVertical,
  Star,
  ExternalLink,
  ChevronDown,
  RefreshCw,
} from "lucide-react";

const CATEGORY_COLORS = [
  "bg-violet-100 text-violet-700",
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
  "bg-orange-100 text-orange-700",
  "bg-pink-100 text-pink-700",
  "bg-teal-100 text-teal-700",
  "bg-indigo-100 text-indigo-700",
  "bg-green-100 text-green-700",
  "bg-red-100 text-red-700",
];

function getCategoryColor(catId) {
  return CATEGORY_COLORS[(catId || 0) % CATEGORY_COLORS.length];
}

export default function SubcategoryManagement() {
  const [subcategories, setSubcategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [parentFilter, setParentFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [keywordInput, setKeywordInput] = useState("");
  const [reassignModal, setReassignModal] = useState(null);
  const [reassignCatId, setReassignCatId] = useState("");

  const [form, setForm] = useState({
    name: "",
    slug: "",
    category_id: "",
    description: "",
    is_active: true,
    is_trending: false,
    sort_order: 0,
    keywords: [],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [subs, cats] = await Promise.all([
        adminListSubcategories(),
        adminListCategories(),
      ]);
      setSubcategories(subs || []);
      setCategories(cats.items || cats || []);
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    let list = [...subcategories];
    if (parentFilter) {
      list = list.filter((s) => String(s.category_id) === String(parentFilter));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.slug.toLowerCase().includes(q) ||
          (s.keywords && s.keywords.toLowerCase().includes(q))
      );
    }
    list.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    return list;
  }, [subcategories, searchQuery, parentFilter]);

  const totalSubcategories = subcategories.length;
  const activeSubcategories = subcategories.filter((s) => s.is_active).length;
  const trendingSubcategories = subcategories.filter((s) => s.is_trending).length;

  const getCategoryName = (catId) => {
    const cat = categories.find((c) => c.id === catId);
    return cat ? cat.name : "Unknown";
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: "",
      slug: "",
      category_id: parentFilter || (categories.length > 0 ? categories[0].id : ""),
      description: "",
      is_active: true,
      is_trending: false,
      sort_order: 0,
      keywords: [],
    });
    setKeywordInput("");
    setMessage("");
    setShowModal(true);
  };

  const openEdit = (sub) => {
    setEditing(sub);
    const kw = sub.keywords
      ? sub.keywords.split(",").map((k) => k.trim()).filter(Boolean)
      : [];
    setForm({
      name: sub.name,
      slug: sub.slug,
      category_id: sub.category_id,
      description: sub.description || "",
      is_active: sub.is_active,
      is_trending: sub.is_trending,
      sort_order: sub.sort_order || 0,
      keywords: kw,
    });
    setKeywordInput("");
    setMessage("");
    setShowModal(true);
  };

  const handleNameChange = (val) => {
    const slug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    setForm((f) => ({ ...f, name: val, slug: editing ? f.slug : slug }));
  };

  const addKeyword = () => {
    const kw = keywordInput.trim();
    if (kw && !form.keywords.includes(kw)) {
      setForm((f) => ({ ...f, keywords: [...f.keywords, kw] }));
      setKeywordInput("");
    }
  };

  const removeKeyword = (kw) => {
    setForm((f) => ({ ...f, keywords: f.keywords.filter((k) => k !== kw) }));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.slug.trim() || !form.category_id) return;
    setSaving(true);
    setMessage("");
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim() || null,
        is_active: form.is_active,
        is_trending: form.is_trending,
        sort_order: form.sort_order,
        keywords: form.keywords.length > 0 ? form.keywords.join(", ") : null,
      };
      if (editing) {
        await adminUpdateSubcategory(editing.id, payload);
        setMessage("Subcategory updated successfully");
      } else {
        await adminCreateSubcategory(form.category_id, payload);
        setMessage("Subcategory created successfully");
      }
      await loadData();
      setTimeout(() => setShowModal(false), 1200);
    } catch (err) {
      setMessage(err.message || "Failed to save subcategory");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await adminDeleteSubcategory(id);
      setDeleteConfirm(null);
      await loadData();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleReassign = async () => {
    if (!reassignModal || !reassignCatId) return;
    try {
      await adminUpdateSubcategory(reassignModal.id, {
        category_id: parseInt(reassignCatId),
      });
      setReassignModal(null);
      await loadData();
    } catch (err) {
      console.error("Reassign failed:", err);
    }
  };

  const toggleTrending = async (sub) => {
    try {
      await adminUpdateSubcategory(sub.id, { is_trending: !sub.is_trending });
      await loadData();
    } catch (err) {
      console.error("Toggle trending failed:", err);
    }
  };

  const toggleActive = async (sub) => {
    try {
      await adminUpdateSubcategory(sub.id, { is_active: !sub.is_active });
      await loadData();
    } catch (err) {
      console.error("Toggle active failed:", err);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md">
              <FolderOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                Subcategory Management
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full font-bold">
                  {totalSubcategories} Subcategories
                </span>
              </h2>
              <p className="text-sm text-gray-500">
                {activeSubcategories} active &middot; {trendingSubcategories} trending
              </p>
            </div>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-md cursor-pointer border-none"
          >
            <Plus className="w-4 h-4" /> Add Subcategory
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200/60 rounded-2xl p-4 mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, slug, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          />
        </div>
        <select
          value={parentFilter}
          onChange={(e) => setParentFilter(e.target.value)}
          className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer min-w-[180px]"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white text-sm font-bold rounded-xl hover:bg-emerald-600 transition-colors cursor-pointer border-none"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200/60 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200/60">
                {["#", "Subcategory", "Parent", "Keywords", "Sort", "Trending", "Status", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/60">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-16 text-center text-gray-500">
                    Loading subcategories...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-16 text-center text-gray-500">
                    <FolderOpen className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">No subcategories found</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {searchQuery || parentFilter ? "Try a different filter" : "Create your first subcategory"}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((sub, idx) => (
                  <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-5 py-4">
                      <span className="text-sm font-bold text-gray-400">{idx + 1}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div>
                        <span className="text-sm font-bold text-gray-900">{sub.name}</span>
                        <p className="text-xs text-gray-400 mt-0.5">
                          /category/{getCategoryName(sub.category_id)?.toLowerCase().replace(/\s+/g, "-")}/{sub.slug}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${getCategoryColor(sub.category_id)}`}>
                        {getCategoryName(sub.category_id)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {sub.keywords
                          ? sub.keywords.split(",").slice(0, 3).map((kw, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[11px] font-medium"
                              >
                                {kw.trim()}
                              </span>
                            ))
                          : <span className="text-xs text-gray-400">—</span>}
                        {sub.keywords && sub.keywords.split(",").length > 3 && (
                          <span className="text-[11px] text-gray-400">
                            +{sub.keywords.split(",").length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-mono text-gray-600">{sub.sort_order || 0}</span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => toggleTrending(sub)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer border-none ${
                          sub.is_trending
                            ? "bg-amber-100 text-amber-600 hover:bg-amber-200"
                            : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                        }`}
                        title={sub.is_trending ? "Trending - click to remove" : "Click to make trending"}
                      >
                        <Star className={`w-4 h-4 ${sub.is_trending ? "fill-amber-400" : ""}`} />
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => toggleActive(sub)}
                        className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer border-none ${
                          sub.is_active ? "bg-emerald-500" : "bg-gray-300"
                        }`}
                        title={sub.is_active ? "Active - click to deactivate" : "Inactive - click to activate"}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                            sub.is_active ? "translate-x-5" : ""
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(sub)}
                          className="p-1.5 text-gray-400 hover:text-emerald-500 transition-colors rounded-lg hover:bg-emerald-50 cursor-pointer border-none bg-transparent"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setReassignModal(sub); setReassignCatId(sub.category_id); }}
                          className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors rounded-lg hover:bg-blue-50 cursor-pointer border-none bg-transparent"
                          title="Re-assign Parent"
                        >
                          <ArrowUpDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(sub)}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 cursor-pointer border-none bg-transparent"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-between sticky top-0 z-10">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {editing ? "Edit Subcategory" : "Create New Subcategory"}
                </h3>
                <p className="text-sm text-emerald-100">
                  {editing ? "Update subcategory details" : "Add a subcategory under a parent category"}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-white/20 rounded-xl cursor-pointer border-none bg-transparent"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {message && (
                <div
                  className={`p-3 rounded-xl text-sm text-center ${
                    message.includes("success")
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {message}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Subcategory Name *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="e.g. Dentist"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Parent Category *
                  </label>
                  <select
                    value={form.category_id}
                    onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">URL Slug *</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400 whitespace-nowrap">/category/</span>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                    className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="dentist"
                  />
                </div>
              </div>

              {/* Keywords Tag Input */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Search Keywords
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); addKeyword(); }
                    }}
                    className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="Type keyword and press Enter"
                  />
                  <button
                    onClick={addKeyword}
                    className="px-4 py-2.5 bg-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-300 transition-colors cursor-pointer border-none"
                  >
                    Add
                  </button>
                </div>
                {form.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold"
                      >
                        {kw}
                        <button
                          onClick={() => removeKeyword(kw)}
                          className="hover:text-red-500 cursor-pointer border-none bg-transparent p-0"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  rows={3}
                  placeholder="Brief description for SEO and metadata..."
                />
                <p className="text-xs text-gray-400 mt-1">{form.description.length}/500</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm((f) => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    min="0"
                  />
                </div>
                <div className="flex items-end gap-6 pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_trending}
                      onChange={(e) => setForm((f) => ({ ...f, is_trending: e.target.checked }))}
                      className="w-4 h-4 text-emerald-500 rounded border-gray-300 focus:ring-emerald-500"
                    />
                    <span className="text-sm font-bold text-gray-700">Trending</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                      className="w-4 h-4 text-emerald-500 rounded border-gray-300 focus:ring-emerald-500"
                    />
                    <span className="text-sm font-bold text-gray-700">Active</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-800 transition-colors cursor-pointer border-none bg-transparent"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.name.trim() || !form.slug.trim() || !form.category_id}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-md cursor-pointer border-none disabled:opacity-50"
                >
                  {saving ? "Saving..." : editing ? "Update Subcategory" : "Create Subcategory"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Subcategory?</h3>
            <p className="text-sm text-gray-500 mb-6">
              This will permanently delete <strong>{deleteConfirm.name}</strong>. This action cannot be undone.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer border-none"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.id)}
                className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors cursor-pointer border-none"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Re-assign Parent Modal */}
      {reassignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Re-assign Parent Category</h3>
              <button
                onClick={() => setReassignModal(null)}
                className="p-1 hover:bg-gray-100 rounded-lg cursor-pointer border-none bg-transparent"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Move <strong>{reassignModal.name}</strong> to a different parent category:
            </p>
            <select
              value={reassignCatId}
              onChange={(e) => setReassignCatId(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none mb-4"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setReassignModal(null)}
                className="flex-1 px-4 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer border-none"
              >
                Cancel
              </button>
              <button
                onClick={handleReassign}
                className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-emerald-500 rounded-xl hover:bg-emerald-600 transition-colors cursor-pointer border-none"
              >
                Re-assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
