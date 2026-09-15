import { useState, useEffect, useMemo } from "react";
import {
  adminListCategories,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
  adminCreateSubcategory,
  adminUpdateSubcategory,
  adminDeleteSubcategory,
  adminUploadCategoryLogo,
} from "../api";
import {
  FolderTree,
  FolderOpen,
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  ChevronDown,
  GripVertical,
  Eye,
  ArrowUpDown,
  Sprout,
  Palette,
  Sparkles,
  Car,
  ShoppingBag,
  Cake,
  Heart,
  BookOpen,
  Briefcase,
  Utensils,
  Wrench,
  Shirt,
  Laptop,
  HardHat,
  Activity,
  Compass,
  Truck,
  Stethoscope,
  Pill,
  ShoppingCart,
  GraduationCap,
  Tv,
  Film,
  Tag,
  ExternalLink,
} from "lucide-react";

const ICON_MAP = {
  Sprout, Palette, Sparkles, Car, ShoppingBag, Cake, Heart, BookOpen,
  Briefcase, Utensils, Wrench, Shirt, Laptop, HardHat, Activity, Compass,
  Truck, Stethoscope, Pill, ShoppingCart, GraduationCap, Tv, Film,
};

const ICON_OPTIONS = Object.keys(ICON_MAP);

const ICON_PICKER_COLORS = [
  "from-green-500 to-emerald-600",
  "from-purple-500 to-violet-600",
  "from-amber-500 to-yellow-600",
  "from-slate-500 to-gray-700",
  "from-pink-500 to-rose-600",
  "from-orange-400 to-amber-500",
  "from-rose-500 to-pink-600",
  "from-indigo-400 to-blue-500",
  "from-gray-500 to-slate-600",
  "from-emerald-500 to-teal-600",
  "from-blue-500 to-cyan-600",
  "from-violet-500 to-purple-600",
  "from-cyan-500 to-blue-600",
  "from-yellow-500 to-orange-600",
  "from-red-400 to-rose-500",
  "from-teal-500 to-emerald-600",
  "from-orange-500 to-red-600",
  "from-blue-400 to-indigo-500",
  "from-green-400 to-emerald-500",
  "from-indigo-500 to-blue-600",
  "from-sky-500 to-blue-600",
  "from-gray-400 to-slate-500",
  "from-fuchsia-500 to-pink-600",
];

function IconPreview({ iconName, className = "w-5 h-5" }) {
  const Icon = ICON_MAP[iconName];
  return Icon ? <Icon className={className} /> : <Tag className={className} />;
}

export default function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [popularityFilter, setPopularityFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [modalTab, setModalTab] = useState("basic");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [subcatModal, setSubcatModal] = useState(null);
  const [newSubcat, setNewSubcat] = useState({ name: "", slug: "" });
  const [savingSubcat, setSavingSubcat] = useState(false);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    is_active: true,
    icon: "Sprout",
    logo_url: "",
    is_popular: false,
    sort_order: 0,
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const result = await adminListCategories();
      setCategories(result.items || result || []);
    } catch (err) {
      console.error("Failed to load categories:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    let list = [...categories];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.slug.toLowerCase().includes(q)
      );
    }
    if (statusFilter === "active") list = list.filter((c) => c.is_active);
    if (statusFilter === "inactive") list = list.filter((c) => !c.is_active);
    return list;
  }, [categories, searchQuery, statusFilter, popularityFilter]);

  const openCreate = () => {
    setEditingCategory(null);
    setForm({ name: "", slug: "", description: "", is_active: true, icon: "Sprout", logo_url: "", is_popular: false, sort_order: 0 });
    setLogoFile(null);
    setLogoPreview("");
    setModalTab("basic");
    setMessage("");
    setShowModal(true);
  };

  const openEdit = (cat) => {
    setEditingCategory(cat);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || "",
      is_active: cat.is_active,
      icon: cat.icon || "Sprout",
      logo_url: cat.logo_url || "",
      is_popular: cat.is_popular || false,
      sort_order: cat.sort_order || 0,
    });
    setLogoFile(null);
    setLogoPreview(cat.logo_url || "");
    setModalTab("basic");
    setMessage("");
    setShowModal(true);
  };

  const handleNameChange = (val) => {
    const slug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    setForm((f) => ({ ...f, name: val, slug: editingCategory ? f.slug : slug }));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.slug.trim()) return;
    setSaving(true);
    setMessage("");
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim() || null,
        is_active: form.is_active,
        icon: form.icon,
        logo_url: form.logo_url || null,
        is_popular: form.is_popular,
        sort_order: form.sort_order,
      };
      let saved;
      if (editingCategory) {
        saved = await adminUpdateCategory(editingCategory.id, payload);
        setMessage("Category updated successfully");
      } else {
        saved = await adminCreateCategory(payload);
        setMessage("Category created successfully");
      }
      if (logoFile && saved.id) {
        try {
          await adminUploadCategoryLogo(saved.id, logoFile);
        } catch (uploadErr) {
          console.error("Logo upload failed:", uploadErr);
        }
      }
      await loadCategories();
      setTimeout(() => setShowModal(false), 1200);
    } catch (err) {
      setMessage(err.message || "Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await adminDeleteCategory(id);
      setDeleteConfirm(null);
      await loadCategories();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleAddSubcat = async () => {
    if (!newSubcat.name.trim() || !subcatModal) return;
    setSavingSubcat(true);
    try {
      const slug = newSubcat.slug.trim() || newSubcat.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      await adminCreateSubcategory(subcatModal.id, {
        name: newSubcat.name.trim(),
        slug,
        is_active: true,
      });
      setNewSubcat({ name: "", slug: "" });
      await loadCategories();
    } catch (err) {
      console.error("Failed to add subcategory:", err);
    } finally {
      setSavingSubcat(false);
    }
  };

  const handleDeleteSubcat = async (subcatId) => {
    try {
      await adminDeleteSubcategory(subcatId);
      await loadCategories();
    } catch (err) {
      console.error("Failed to delete subcategory:", err);
    }
  };

  const categoryCount = categories.length;
  const activeCount = categories.filter((c) => c.is_active).length;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
              <FolderTree className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                Category Management
                <span className="text-xs bg-violet-100 text-violet-700 px-2.5 py-0.5 rounded-full font-bold">
                  {categoryCount} Total
                </span>
              </h2>
              <p className="text-sm text-gray-500">
                {activeCount} active / {categoryCount - activeCount} inactive
              </p>
            </div>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold text-sm rounded-xl hover:from-violet-600 hover:to-purple-700 transition-all shadow-md cursor-pointer border-none"
          >
            <Plus className="w-4 h-4" /> Add New Category
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200/60 rounded-2xl p-4 mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-violet-500 outline-none cursor-pointer"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button
          onClick={loadCategories}
          className="px-4 py-2.5 bg-violet-500 text-white text-sm font-bold rounded-xl hover:bg-violet-600 transition-colors cursor-pointer border-none"
        >
          Refresh
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200/60 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200/60">
                {["#", "Icon", "Category", "Description", "Home Grid", "Sort", "Subcategories", "Status", "Actions"].map((h) => (
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
                  <td colSpan="9" className="px-6 py-16 text-center text-gray-500">
                    Loading categories...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-16 text-center text-gray-500">
                    <FolderTree className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">No categories found</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {searchQuery ? "Try a different search term" : "Create your first category to get started"}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((cat, idx) => (
                  <tr key={cat.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-5 py-4">
                      <span className="text-sm font-bold text-gray-400">{idx + 1}</span>
                    </td>
                    <td className="px-5 py-4">
                      {cat.logo_url ? (
                        <img src={cat.logo_url} alt="" className="w-9 h-9 rounded-xl object-cover shadow-sm" />
                      ) : (
                        <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                          <IconPreview iconName={cat.icon || "Sprout"} className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div>
                        <span className="text-sm font-bold text-gray-900">{cat.name}</span>
                        <p className="text-xs text-gray-400 mt-0.5">/category/{cat.slug}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 max-w-[200px]">
                      <p className="text-sm text-gray-600 truncate">{cat.description || "—"}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        cat.is_popular ? "bg-violet-100 text-violet-700" : "bg-gray-100 text-gray-500"
                      }`}>
                        {cat.is_popular ? "Popular" : "Hidden"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-mono text-gray-600">{cat.sort_order || 0}</span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => { setSubcatModal(cat); setNewSubcat({ name: "", slug: "" }); }}
                        className="flex items-center gap-1.5 text-xs bg-violet-50 text-violet-700 px-2.5 py-1 rounded-lg font-bold hover:bg-violet-100 transition-colors cursor-pointer border-none"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        {cat.subcategories?.length || 0} subcats
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          cat.is_active
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {cat.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(cat)}
                          className="p-1.5 text-gray-400 hover:text-violet-500 transition-colors rounded-lg hover:bg-violet-50 cursor-pointer border-none bg-transparent"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(cat)}
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
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-violet-500 to-purple-600 flex items-center justify-between sticky top-0 z-10">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {editingCategory ? "Edit Category" : "Create New Category"}
                </h3>
                <p className="text-sm text-violet-100">
                  {editingCategory ? "Update category details" : "Add a new category to the platform"}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-white/20 rounded-xl cursor-pointer border-none bg-transparent"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 bg-gray-50">
              {[
                { id: "basic", label: "Basic Info" },
                { id: "icon", label: "Icon" },
                { id: "seo", label: "Description & SEO" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setModalTab(tab.id)}
                  className={`flex-1 px-4 py-3 text-sm font-bold transition-colors cursor-pointer border-none ${
                    modalTab === tab.id
                      ? "text-violet-600 border-b-2 border-violet-600 bg-white"
                      : "text-gray-500 hover:text-gray-700 bg-transparent"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
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

              {modalTab === "basic" && (
                <>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      Category Name *
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                      placeholder="e.g. Agriculture"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      URL Slug *
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400 whitespace-nowrap">/category/</span>
                      <input
                        type="text"
                        value={form.slug}
                        onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                        className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                        placeholder="agriculture"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">
                        Grid Slot / Sort Order
                      </label>
                      <input
                        type="number"
                        value={form.sort_order}
                        onChange={(e) => setForm((f) => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                        min="0"
                        max="24"
                        placeholder="0"
                      />
                      <p className="text-xs text-gray-400 mt-1">1-24 for home grid position</p>
                    </div>
                    <div className="flex items-end gap-6 pb-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.is_popular}
                          onChange={(e) => setForm((f) => ({ ...f, is_popular: e.target.checked }))}
                          className="w-4 h-4 text-violet-500 rounded border-gray-300 focus:ring-violet-500"
                        />
                        <span className="text-sm font-bold text-gray-700">Show on Home</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.is_active}
                          onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                          className="w-4 h-4 text-violet-500 rounded border-gray-300 focus:ring-violet-500"
                        />
                        <span className="text-sm font-bold text-gray-700">Active</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Custom Logo Upload
                    </label>
                    <div className="flex items-center gap-4">
                      <label className="flex-1 flex items-center justify-center px-4 py-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-violet-400 transition-colors cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              setLogoFile(file);
                              setLogoPreview(URL.createObjectURL(file));
                            }
                          }}
                        />
                        <div className="text-center">
                          <Plus className="w-6 h-6 mx-auto text-gray-400 mb-1" />
                          <p className="text-xs text-gray-500">Click to upload PNG/SVG/JPG</p>
                        </div>
                      </label>
                      {logoPreview && (
                        <div className="relative">
                          <img src={logoPreview} alt="" className="w-16 h-16 rounded-xl object-cover shadow-md" />
                          <button
                            onClick={() => { setLogoFile(null); setLogoPreview(""); setForm((f) => ({ ...f, logo_url: "" })); }}
                            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center cursor-pointer border-none"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {modalTab === "icon" && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    Line-Art Icon Picker
                  </label>
                  <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                    {ICON_OPTIONS.map((name) => (
                      <button
                        key={name}
                        onClick={() => setForm((f) => ({ ...f, icon: name }))}
                        className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all cursor-pointer ${
                          form.icon === name
                            ? "border-violet-500 bg-violet-50 shadow-md"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                      >
                        <IconPreview iconName={name} className="w-5 h-5 text-gray-700" />
                        <span className="text-[10px] text-gray-500 leading-tight text-center truncate w-full">
                          {name}
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-gray-50 rounded-xl flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                      <IconPreview iconName={form.icon} className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-700">Selected: {form.icon}</p>
                      <p className="text-xs text-gray-400">This icon will appear on the home page grid</p>
                    </div>
                  </div>
                </div>
              )}

              {modalTab === "seo" && (
                <>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      Category Description
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                      rows={3}
                      placeholder="Brief description of this category for SEO and display purposes..."
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {form.description.length}/500 characters
                    </p>
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-800 transition-colors cursor-pointer border-none bg-transparent"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.name.trim() || !form.slug.trim()}
                  className="px-6 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold text-sm rounded-xl hover:from-violet-600 hover:to-purple-700 transition-all shadow-md cursor-pointer border-none disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingCategory ? "Update Category" : "Create Category"}
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
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Category?</h3>
            <p className="text-sm text-gray-500 mb-6">
              This will permanently delete <strong>{deleteConfirm.name}</strong> and all its subcategories. This action cannot be undone.
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

      {/* Subcategories Modal */}
      {subcatModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-violet-500 to-purple-600 flex items-center justify-between sticky top-0 z-10">
              <div>
                <h3 className="text-lg font-bold text-white">Subcategories</h3>
                <p className="text-sm text-violet-100">Manage subcategories for {subcatModal.name}</p>
              </div>
              <button
                onClick={() => setSubcatModal(null)}
                className="p-2 hover:bg-white/20 rounded-xl cursor-pointer border-none bg-transparent"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Existing subcategories */}
              <div className="space-y-2">
                {subcatModal.subcategories?.length > 0 ? (
                  subcatModal.subcategories.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                    >
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-violet-500" />
                        <div>
                          <span className="text-sm font-bold text-gray-800">{sub.name}</span>
                          <p className="text-xs text-gray-400">/{sub.slug}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                            sub.is_active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {sub.is_active ? "Active" : "Off"}
                        </span>
                        <button
                          onClick={() => handleDeleteSubcat(sub.id)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors cursor-pointer border-none bg-transparent"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">No subcategories yet</p>
                )}
              </div>

              {/* Add new subcategory */}
              <div className="border-t border-gray-200 pt-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">Add Subcategory</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSubcat.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setNewSubcat({
                        name,
                        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
                      });
                    }}
                    className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                    placeholder="Subcategory name"
                    onKeyDown={(e) => e.key === "Enter" && handleAddSubcat()}
                  />
                  <button
                    onClick={handleAddSubcat}
                    disabled={savingSubcat || !newSubcat.name.trim()}
                    className="px-4 py-2.5 bg-violet-500 text-white text-sm font-bold rounded-xl hover:bg-violet-600 transition-colors cursor-pointer border-none disabled:opacity-50"
                  >
                    {savingSubcat ? "..." : "Add"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
