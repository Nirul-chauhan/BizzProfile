import { useState, useEffect } from "react";
import {
  adminListBanners,
  adminCreateBanner,
  adminUpdateBanner,
  adminDeleteBanner,
  adminUploadBannerImage,
} from "../api";
import {
  Image,
  Plus,
  Pencil,
  Trash2,
  X,
  Eye,
  EyeOff,
  Upload,
  GripVertical,
} from "lucide-react";

export default function BannerManagement() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    cta_text: "",
    cta_url: "",
    image_url: "",
    gradient: "linear-gradient(135deg, #4f46e5, #6366f1)",
    is_active: true,
    sort_order: 0,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    setLoading(true);
    try {
      const result = await adminListBanners();
      setBanners(result.items || result || []);
    } catch (err) {
      console.error("Failed to load banners:", err);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      title: "",
      subtitle: "",
      cta_text: "",
      cta_url: "",
      image_url: "",
      gradient: "linear-gradient(135deg, #4f46e5, #6366f1)",
      is_active: true,
      sort_order: 0,
    });
    setImageFile(null);
    setImagePreview("");
    setMessage("");
    setShowModal(true);
  };

  const openEdit = (banner) => {
    setEditing(banner);
    setForm({
      title: banner.title,
      subtitle: banner.subtitle || "",
      cta_text: banner.cta_text || "",
      cta_url: banner.cta_url || "",
      image_url: banner.image_url || "",
      gradient: banner.gradient || "linear-gradient(135deg, #4f46e5, #6366f1)",
      is_active: banner.is_active,
      sort_order: banner.sort_order || 0,
    });
    setImageFile(null);
    setImagePreview(banner.image_url || "");
    setMessage("");
    setShowModal(true);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview("");
    setForm((f) => ({ ...f, image_url: "" }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    setMessage("");
    try {
      let saved;
      const payload = {
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || null,
        cta_text: form.cta_text.trim() || null,
        cta_url: form.cta_url.trim() || null,
        image_url: form.image_url.trim() || null,
        gradient: form.gradient.trim() || null,
        is_active: form.is_active,
        sort_order: form.sort_order,
      };
      if (editing) {
        saved = await adminUpdateBanner(editing.id, payload);
        setMessage("Banner updated successfully");
      } else {
        saved = await adminCreateBanner(payload);
        setMessage("Banner created successfully");
      }
      if (imageFile && saved.id) {
        try {
          await adminUploadBannerImage(saved.id, imageFile);
        } catch (uploadErr) {
          console.error("Image upload failed:", uploadErr);
        }
      }
      await loadBanners();
      setTimeout(() => setShowModal(false), 1000);
    } catch (err) {
      setMessage(err.message || "Failed to save banner");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await adminDeleteBanner(id);
      setDeleteConfirm(null);
      await loadBanners();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const activeCount = banners.filter((b) => b.is_active).length;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
              <Image className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                Banner Management
                <span className="text-xs bg-violet-100 text-violet-700 px-2.5 py-0.5 rounded-full font-bold">
                  {banners.length} Total
                </span>
              </h2>
              <p className="text-sm text-gray-500">
                {activeCount} active / {banners.length - activeCount} inactive
              </p>
            </div>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold text-sm rounded-xl hover:from-violet-600 hover:to-purple-700 transition-all shadow-md cursor-pointer border-none"
          >
            <Plus className="w-4 h-4" /> Add Banner
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200/60 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200/60">
                {["#", "Preview", "Title", "CTA Text", "Status", "Sort", "Actions"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/60">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-16 text-center text-gray-500">
                    Loading banners...
                  </td>
                </tr>
              ) : banners.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-16 text-center text-gray-500">
                    <Image className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">No banners found</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Create your first banner to get started
                    </p>
                  </td>
                </tr>
              ) : (
                banners.map((banner, idx) => (
                  <tr
                    key={banner.id}
                    className="hover:bg-gray-50/50 transition-colors group"
                  >
                    <td className="px-5 py-4">
                      <span className="text-sm font-bold text-gray-400">
                        {idx + 1}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {banner.image_url ? (
                        <img
                          src={banner.image_url}
                          alt=""
                          className="w-16 h-10 rounded-lg object-cover shadow-sm border border-gray-200"
                        />
                      ) : (
                        <div
                          className="w-16 h-10 rounded-lg flex items-center justify-center shadow-sm"
                          style={{ background: banner.gradient }}
                        >
                          <Image className="w-4 h-4 text-white/70" />
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div>
                        <span className="text-sm font-bold text-gray-900">
                          {banner.title}
                        </span>
                        {banner.subtitle && (
                          <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[220px]">
                            {banner.subtitle}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-gray-600">
                        {banner.cta_text || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          banner.is_active
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {banner.is_active ? (
                          <Eye className="w-3 h-3" />
                        ) : (
                          <EyeOff className="w-3 h-3" />
                        )}
                        {banner.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-mono text-gray-600">
                        {banner.sort_order || 0}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(banner)}
                          className="p-1.5 text-gray-400 hover:text-violet-500 transition-colors rounded-lg hover:bg-violet-50 cursor-pointer border-none bg-transparent"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(banner)}
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
                  {editing ? "Edit Banner" : "Create New Banner"}
                </h3>
                <p className="text-sm text-violet-100">
                  {editing
                    ? "Update banner details"
                    : "Add a new carousel banner"}
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

              {/* Title */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
                  placeholder="e.g. Welcome to BizzProfile"
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Subtitle
                </label>
                <input
                  type="text"
                  value={form.subtitle}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, subtitle: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
                  placeholder="Short description for the banner"
                />
              </div>

              {/* CTA Text + URL */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    CTA Text
                  </label>
                  <input
                    type="text"
                    value={form.cta_text}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, cta_text: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
                    placeholder="e.g. Explore Now"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    CTA URL
                  </label>
                  <input
                    type="text"
                    value={form.cta_url}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, cta_url: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
                    placeholder="https://..."
                  />
                </div>
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Image URL
                </label>
                <input
                  type="text"
                  value={form.image_url}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, image_url: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
                  placeholder="https://example.com/banner.jpg"
                />
                <p className="text-xs text-gray-400 mt-1">
                  External URL or upload a file below
                </p>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Image Upload
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex-1 flex items-center justify-center px-4 py-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-violet-400 transition-colors cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    <div className="text-center">
                      <Upload className="w-6 h-6 mx-auto text-gray-400 mb-1" />
                      <p className="text-xs text-gray-500">
                        Click to upload PNG/JPG/WebP
                      </p>
                    </div>
                  </label>
                  {(imagePreview || form.image_url) && (
                    <div className="relative">
                      <img
                        src={imagePreview || form.image_url}
                        alt=""
                        className="w-24 h-14 rounded-xl object-cover shadow-md border border-gray-200"
                      />
                      <button
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center cursor-pointer border-none"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Gradient */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Gradient
                </label>
                <input
                  type="text"
                  value={form.gradient}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, gradient: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none font-mono"
                  placeholder="linear-gradient(135deg, #4f46e5, #6366f1)"
                />
                <div className="mt-2 h-6 rounded-lg overflow-hidden border border-gray-200">
                  <div
                    className="w-full h-full"
                    style={{ background: form.gradient }}
                  />
                </div>
              </div>

              {/* Active + Sort Order */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        sort_order: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                    min="0"
                    placeholder="0"
                  />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={form.is_active}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            is_active: e.target.checked,
                          }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-emerald-500 transition-colors" />
                      <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
                    </div>
                    <span className="text-sm font-bold text-gray-700">
                      Active
                    </span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-800 transition-colors cursor-pointer border-none bg-transparent"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.title.trim()}
                  className="px-6 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold text-sm rounded-xl hover:from-violet-600 hover:to-purple-700 transition-all shadow-md cursor-pointer border-none disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editing
                    ? "Update Banner"
                    : "Create Banner"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Delete Banner?
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              This will permanently delete{" "}
              <strong>{deleteConfirm.title}</strong>. This action cannot be
              undone.
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
    </div>
  );
}
