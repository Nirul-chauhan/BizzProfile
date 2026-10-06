import { useState, useEffect } from "react";
import {
  adminListMoreValueAdds,
  adminCreateMoreValueAdds,
  adminUpdateMoreValueAdds,
  adminDeleteMoreValueAdds,
  adminUploadMoreValueAddsImage,
} from "../api";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Eye,
  EyeOff,
  GripVertical,
  Sparkles,
  Upload,
} from "lucide-react";

export default function MoreValueAddsManagement() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    icon: "",
    image_url: "",
    button_text: "Learn More →",
    button_link: "",
display_order: 0,
    is_active: true,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
const [uploadingImage, setUploadingImage] = useState(false);

  const loadItems = async () => {
    setLoading(true);
    try {
      const result = await adminListMoreValueAdds();
      setItems(result.items || result || []);
    } catch (err) {
      console.error("Failed to load:", err);
    } finally {
setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({
      title: "",
      description: "",
      icon: "",
      image_url: "",
      button_text: "Learn More →",
      button_link: "",
      display_order: items.length > 0 ? Math.max(...items.map((i) => i.display_order || 0)) + 1 : 0,
      is_active: true,
    });
setMessage("");
    setImageFile(null);
    setImagePreview("");
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      title: item.title,
      description: item.description || "",
      icon: item.icon || "",
      image_url: item.image_url || "",
      button_text: item.button_text || "Learn More →",
      button_link: item.button_link || "",
      display_order: item.display_order || 0,
      is_active: item.is_active,
    });
    setImageFile(null);
    setImagePreview(item.image_url || "");
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
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        icon: form.icon.trim() || null,
        image_url: form.image_url.trim() || null,
        button_text: form.button_text.trim() || null,
        button_link: form.button_link.trim() || null,
        display_order: Number(form.display_order) || 0,
        is_active: form.is_active,
      };
      let saved;
      if (editing) {
        saved = await adminUpdateMoreValueAdds(editing.id, payload);
        setMessage("Updated successfully");
      } else {
        saved = await adminCreateMoreValueAdds(payload);
        setMessage("Created successfully");
      }
      if (imageFile && saved?.id) {
        try {
          setUploadingImage(true);
          await adminUploadMoreValueAddsImage(saved.id, imageFile);
        } catch (uploadErr) {
          console.error("Image upload failed:", uploadErr);
        } finally {
          setUploadingImage(false);
        }
      }
      await loadItems();
      setTimeout(() => setShowModal(false), 1000);
    } catch (err) {
      setMessage(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await adminDeleteMoreValueAdds(id);
      setDeleteConfirm(null);
      await loadItems();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const activeCount = items.filter((i) => i.is_active).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-blue-600" />
            More Value Adds
          </h1>
          <p className="text-gray-600 mt-1">
            Manage value-add cards displayed on homepage
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
            {activeCount} Active / {items.length} Total
          </span>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium cursor-pointer border-none"
          >
            <Plus className="w-4 h-4" /> Add Card
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="mt-3 text-gray-600">Loading...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No value-add cards yet
          </h3>
          <p className="text-gray-600 mb-6">
            Create your first card to display on homepage
          </p>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium cursor-pointer border-none"
          >
            Add First Card
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Button
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items
                  .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
                  .map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">
                            {item.display_order || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                          {item.title}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 max-w-md truncate">
                          {item.description || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {item.button_text || "-"}
                        </div>
                        <div className="text-xs text-gray-500 truncate max-w-xs">
                          {item.button_link || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.is_active ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <Eye className="w-3 h-3" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            <EyeOff className="w-3 h-3" /> Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openEdit(item)}
                          className="text-blue-600 hover:text-blue-900 mr-3 cursor-pointer border-none bg-transparent"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(item)}
                          className="text-red-600 hover:text-red-900 cursor-pointer border-none bg-transparent"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {editing ? "Edit Value Add Card" : "Add Value Add Card"}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 cursor-pointer border-none"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder="e.g. Local Trade Shows & Events"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="Short description"
                  rows={2}
                  maxLength={500}
className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Card Image / Icon
                </label>
                {imagePreview && (
                  <div className="mb-3">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-24 h-24 object-contain rounded-xl border border-gray-200 bg-gray-50 p-2"
                    />
                    <button
                      onClick={removeImage}
                      type="button"
                      className="mt-2 block text-xs text-red-600 hover:text-red-800 cursor-pointer border-none bg-transparent"
                    >
                      Remove image
                    </button>
                  </div>
                )}
                <label className="flex items-center justify-center gap-2 px-4 py-2.5 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
                  <Upload className="w-4 h-4" />
                  {imagePreview ? "Change image" : "Upload image"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
                <input
                  type="text"
                  value={form.image_url}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, image_url: e.target.value }))
                  }
                  placeholder="Or paste image URL"
                  className="mt-3 w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Button Text
                  </label>
                  <input
                    type="text"
                    value={form.button_text}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, button_text: e.target.value }))
                    }
                    placeholder="Learn More →"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Button URL
                  </label>
                  <input
                    type="text"
                    value={form.button_link}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, button_link: e.target.value }))
                    }
                    placeholder="/trade-shows"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={form.display_order}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        display_order: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="flex items-center pt-8">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, is_active: e.target.checked }))
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Active
                    </span>
                  </label>
                </div>
              </div>

{message && (
                <div
                  className={
                    message.toLowerCase().includes("success")
                      ? "p-3 rounded-lg text-sm bg-green-50 text-green-700 border border-green-200"
                      : "p-3 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200"
                  }
                >
                  {message}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.title.trim()}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium cursor-pointer disabled:opacity-50"
                >
                  {uploadingImage
                    ? "Uploading..."
                    : saving
                    ? "Saving..."
                    : editing
                    ? "Update"
                    : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Delete Card
            </h3>
            <p className="text-gray-600 mb-6">
              Delete "{deleteConfirm.title}"? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.id)}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium cursor-pointer"
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
