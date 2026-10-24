import { useEffect, useState } from "react";
import {
  adminGetAppPromo,
  adminUpdateAppPromo,
  adminUploadAppPromoAsset,
} from "../api";
import { Apple, Image, Play, Smartphone, Upload, X } from "lucide-react";

/* Single-row editor for the Home page "App Promotional Section"
   (Featured Businesses -> App Promotional Section).               */

const EMPTY_FORM = {
  heading: "",
  description: "",
  image_url: "",
  qr_code_url: "",
  google_play_url: "",
  app_store_url: "",
  is_active: true,
};

export default function AppPromoManagement() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminGetAppPromo();
      setForm({
        heading: data?.heading || "",
        description: data?.description || "",
        image_url: data?.image_url || "",
        qr_code_url: data?.qr_code_url || "",
        google_play_url: data?.google_play_url || "",
        app_store_url: data?.app_store_url || "",
        is_active: data ? data.is_active !== false : true,
      });
    } catch (err) {
      setMessage(err.message || "Failed to load app promo settings");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (field, file) => {
    if (!file) return;
    setUploadingField(field);
    setMessage("");
    try {
      const saved = await adminUploadAppPromoAsset(field, file);
      setForm((f) => ({ ...f, [field]: saved[field] || "" }));
      setMessage(field === "image_url" ? "App image uploaded" : "QR code uploaded");
    } catch (err) {
      setMessage(err.message || "Upload failed");
    } finally {
      setUploadingField("");
    }
  };

  const handleSave = async () => {
    if (!form.heading.trim()) {
      setMessage("Heading is required");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      await adminUpdateAppPromo({
        heading: form.heading.trim(),
        description: form.description.trim() || null,
        image_url: form.image_url.trim() || null,
        qr_code_url: form.qr_code_url.trim() || null,
        google_play_url: form.google_play_url.trim() || null,
        app_store_url: form.app_store_url.trim() || null,
        is_active: form.is_active,
      });
      setMessage("Saved. The Home page section is updated.");
    } catch (err) {
      setMessage(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-16 text-gray-400">Loading...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
          <Smartphone className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-gray-900">App Promotional Section</h2>
          <p className="text-sm text-gray-500">
            Shown on the Home page right after Featured Businesses
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 bg-white border border-gray-200/60 rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Heading *</label>
            <input
              type="text"
              value={form.heading}
              onChange={(e) => setForm({ ...form, heading: e.target.value })}
              placeholder="Download Our BizzProfile App"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Short description of the BizzProfile app"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">App Image</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  placeholder="/uploads/app-promo/app.png"
                  className="flex-1 min-w-0 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <label className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 cursor-pointer border-none">
                  <Upload className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={(e) => handleUpload("image_url", e.target.files?.[0])}
                  />
                </label>
              </div>
              {uploadingField === "image_url" && (
                <p className="text-[11px] text-indigo-600 mt-1">Uploading...</p>
              )}
              {form.image_url && (
                <div className="mt-2 relative w-fit">
                  <img src={form.image_url} alt="" className="w-24 h-24 object-contain rounded-lg border border-gray-200 bg-gray-50" />
                  <button
                    onClick={() => setForm({ ...form, image_url: "" })}
                    title="Remove image"
                    className="absolute -top-2 -right-2 bg-white border border-gray-200 rounded-full p-0.5 text-gray-500 hover:text-red-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              {!form.image_url && (
                <p className="text-[11px] text-gray-400 mt-1">
                  Optional - a BizzProfile phone mock-up is shown when empty.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">QR Code</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={form.qr_code_url}
                  onChange={(e) => setForm({ ...form, qr_code_url: e.target.value })}
                  placeholder="/uploads/app-promo/qr.png"
                  className="flex-1 min-w-0 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <label className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 cursor-pointer border-none">
                  <Upload className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={(e) => handleUpload("qr_code_url", e.target.files?.[0])}
                  />
                </label>
              </div>
              {uploadingField === "qr_code_url" && (
                <p className="text-[11px] text-indigo-600 mt-1">Uploading...</p>
              )}
              {form.qr_code_url && (
                <div className="mt-2 relative w-fit">
                  <img src={form.qr_code_url} alt="" className="w-24 h-24 object-contain rounded-lg border border-gray-200 bg-white" />
                  <button
                    onClick={() => setForm({ ...form, qr_code_url: "" })}
                    title="Remove QR code"
                    className="absolute -top-2 -right-2 bg-white border border-gray-200 rounded-full p-0.5 text-gray-500 hover:text-red-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              {!form.qr_code_url && (
                <p className="text-[11px] text-gray-400 mt-1">
                  Optional - a QR code is generated from the store links below.
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Google Play URL</label>
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  type="url"
                  value={form.google_play_url}
                  onChange={(e) => setForm({ ...form, google_play_url: e.target.value })}
                  placeholder="https://play.google.com/store/apps/..."
                  className="flex-1 min-w-0 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">App Store URL</label>
              <div className="flex items-center gap-2">
                <Apple className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  type="url"
                  value={form.app_store_url}
                  onChange={(e) => setForm({ ...form, app_store_url: e.target.value })}
                  placeholder="https://apps.apple.com/..."
                  className="flex-1 min-w-0 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            Show this section on the Home page
          </label>

          {message && (
            <p className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
              {message}
            </p>
          )}

          <button
            onClick={handleSave}
            disabled={saving || !form.heading.trim()}
            className="w-full py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 cursor-pointer border-none"
          >
            {saving ? "Saving..." : "Save Section"}
          </button>
        </div>

        {/* Live preview */}
        <div className="bg-white border border-gray-200/60 rounded-2xl p-6 h-fit">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Image className="w-4 h-4" /> Preview
          </h3>
          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 space-y-3">
            {form.image_url ? (
              <img src={form.image_url} alt="" className="w-full h-32 object-contain rounded-lg" />
            ) : (
              <div className="h-32 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                <Smartphone className="w-8 h-8 text-white" />
              </div>
            )}
            <p className="text-base font-extrabold text-gray-900 leading-snug">
              {form.heading || "Download Our BizzProfile App"}
            </p>
            {form.description && (
              <p className="text-xs text-gray-600 leading-relaxed">{form.description}</p>
            )}
            <div className="flex items-center gap-3">
              <div className="bg-white p-1.5 rounded-lg border border-gray-200">
                <img
                  src={form.qr_code_url || "/api/public/app-promo/qr"}
                  alt=""
                  className="w-16 h-16 object-contain"
                />
              </div>
              <div className="space-y-1.5">
                <span className="flex items-center gap-2 rounded-lg bg-gray-900 text-white px-2.5 py-1.5 text-[10px] font-bold w-fit">
                  <Play className="w-3 h-3" /> Google Play
                </span>
                <span className="flex items-center gap-2 rounded-lg bg-gray-900 text-white px-2.5 py-1.5 text-[10px] font-bold w-fit">
                  <Apple className="w-3 h-3" /> App Store
                </span>
              </div>
            </div>
          </div>
          {!form.is_active && (
            <p className="mt-3 text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              Currently hidden on the Home page.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
