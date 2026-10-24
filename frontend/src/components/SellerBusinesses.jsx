import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  Building2,
  Image as ImageIcon,
  ShieldCheck,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Send,
  Globe,
  MapPin,
  Camera,
  Settings,
  Save,
} from "lucide-react";
import {
  getMyProfiles,
  getCategories,
  getCategoryTree,
  createProfile,
  updateProfileById,
  deleteProfile,
  uploadBusinessLogo,
  uploadBusinessCover,
  getBusinessSocialLinks,
  addBusinessSocialLink,
  deleteSocialLink,
  getBusinessHours,
  saveBusinessHours,
  submitBusinessVerification,
} from "../api";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const SOCIAL_PLATFORMS = ["INSTAGRAM", "FACEBOOK", "LINKEDIN", "YOUTUBE", "X", "WEBSITE"];

function Message({ type, text }) {
  if (!text) return null;
  const styles =
    type === "success"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : "bg-red-50 text-red-700 border-red-200";
  const Icon = type === "success" ? CheckCircle2 : AlertCircle;
  return (
    <div className={`flex items-start gap-2 p-3 rounded-xl border ${styles}`}>
      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <span className="text-sm font-medium">{text}</span>
    </div>
  );
}

const VERIFY_META = {
  UNVERIFIED: { label: "Unverified", cls: "bg-gray-100 text-gray-600", icon: AlertCircle },
  PENDING: { label: "Pending review", cls: "bg-amber-100 text-amber-700", icon: Clock },
  VERIFIED: { label: "Verified", cls: "bg-emerald-100 text-emerald-700", icon: ShieldCheck },
  REJECTED: { label: "Rejected", cls: "bg-red-100 text-red-700", icon: XCircle },
};

function VerifyBadge({ status }) {
  const meta = VERIFY_META[(status || "UNVERIFIED").toUpperCase()] || VERIFY_META.UNVERIFIED;
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${meta.cls}`}>
      <Icon className="w-3.5 h-3.5" /> {meta.label}
    </span>
  );
}

function slugify(text) {
  return (text || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const EMPTY_FORM = {
  business_name: "",
  profile_type: "INDIVIDUAL",
  category_id: "",
  subcategory_id: "",
  description: "",
  phone: "",
  email: "",
  website: "",
  address: "",
  city: "",
  state: "",
  country: "India",
  pincode: "",
  latitude: "",
  longitude: "",
  is_public: true,
};

const EMPTY_DETAIL = {
  COMPANY: { company_registration_number: "", legal_name: "", company_type: "" },
  INDIVIDUAL: { professional_name: "", profession: "", experience_years: "", services: "" },
  MSME: { msme_number: "", business_type: "", industry: "" },
};

export default function SellerBusinesses({ onManage }) {
  const [profiles, setProfiles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryTree, setCategoryTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const [view, setView] = useState("list"); // list | form
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [detail, setDetail] = useState(EMPTY_DETAIL.INDIVIDUAL);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const logoInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const [socialLinks, setSocialLinks] = useState([]);
  const [newSocial, setNewSocial] = useState({ platform: "INSTAGRAM", url: "" });
  const [businessHours, setBusinessHours] = useState([]);
  const [hoursForm, setHoursForm] = useState({ open_time: "09:00", close_time: "18:00", is_closed: false });
  const [savingExtras, setSavingExtras] = useState(false);

  const categoryOptions = useMemo(
    () => (categoryTree.length ? categoryTree : categories),
    [categoryTree, categories]
  );

  const subcategoryOptions = useMemo(() => {
    if (!form.category_id) return [];
    const cat = categoryTree.find((c) => c.id === parseInt(form.category_id));
    return cat?.subcategories || [];
  }, [categoryTree, form.category_id]);

  const editingProfile = useMemo(
    () => profiles.find((p) => p.id === editingId) || null,
    [profiles, editingId]
  );

  const flash = (type, text, timeout = 3000) => {
    setMsg({ type, text });
    if (type === "success") setTimeout(() => setMsg({ type: "", text: "" }), timeout);
  };

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyProfiles();
      setProfiles(Array.isArray(data) ? data : []);
    } catch (err) {
      setMsg({ type: "error", text: err.message || "Failed to load your businesses." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfiles();
    getCategories().then((d) => setCategories(Array.isArray(d) ? d : d?.items || [])).catch(() => {});
    getCategoryTree().then((d) => setCategoryTree(Array.isArray(d) ? d : [])).catch(() => {});
  }, [loadProfiles]);

  const loadExtras = useCallback(async (profileId) => {
    try {
      const [links, hours] = await Promise.all([
        getBusinessSocialLinks(profileId),
        getBusinessHours(profileId),
      ]);
      setSocialLinks(Array.isArray(links) ? links : []);
      setBusinessHours(Array.isArray(hours) ? hours : []);
    } catch {
      setSocialLinks([]);
      setBusinessHours([]);
    }
  }, []);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setDetail(EMPTY_DETAIL.INDIVIDUAL);
    setSocialLinks([]);
    setBusinessHours([]);
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setMsg({ type: "", text: "" });
    setView("form");
  };

  const openEdit = (profile) => {
    setEditingId(profile.id);
    setForm({
      business_name: profile.business_name || "",
      profile_type: profile.profile_type || "INDIVIDUAL",
      category_id: profile.category_id ? String(profile.category_id) : "",
      subcategory_id: profile.subcategory_id ? String(profile.subcategory_id) : "",
      description: profile.description || "",
      phone: profile.phone || "",
      email: profile.email || "",
      website: profile.website || "",
      address: profile.address || "",
      city: profile.city || "",
      state: profile.state || "",
      country: profile.country || "India",
      pincode: profile.pincode || "",
      latitude: profile.latitude ?? "",
      longitude: profile.longitude ?? "",
      is_public: profile.is_public ?? true,
    });
    const type = profile.profile_type || "INDIVIDUAL";
    const existingDetail =
      type === "COMPANY" ? profile.company_detail : type === "MSME" ? profile.msme_detail : profile.individual_detail;
    setDetail({ ...EMPTY_DETAIL[type], ...(existingDetail || {}) });
    setMsg({ type: "", text: "" });
    setView("form");
    loadExtras(profile.id);
  };

  const buildDetailPayload = () => {
    const clean = {};
    Object.entries(detail).forEach(([k, v]) => {
      if (v !== "" && v !== null && v !== undefined) clean[k] = v;
    });
    return clean;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = form.business_name.trim();
    if (!name) return flash("error", "Business name is required.");
    if (!form.category_id) return flash("error", "Please choose a category.");

    const type = form.profile_type;
    const payload = {
      business_name: name,
      profile_type: type,
      category_id: parseInt(form.category_id),
      subcategory_id: form.subcategory_id ? parseInt(form.subcategory_id) : null,
      description: form.description.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      website: form.website.trim() || null,
      address: form.address.trim() || null,
      city: form.city.trim() || null,
      state: form.state.trim() || null,
      country: form.country.trim() || null,
      pincode: form.pincode.trim() || null,
      latitude: form.latitude === "" ? null : parseFloat(form.latitude),
      longitude: form.longitude === "" ? null : parseFloat(form.longitude),
      is_public: form.is_public,
      [`${type.toLowerCase()}_detail`]: buildDetailPayload(),
    };
    if (Number.isNaN(payload.latitude)) payload.latitude = null;
    if (Number.isNaN(payload.longitude)) payload.longitude = null;

    setSaving(true);
    setMsg({ type: "", text: "" });
    try {
      if (editingId) {
        const { profile_type: _profile_type, ...updatePayload } = payload;
        const updated = await updateProfileById(editingId, updatePayload);
        setProfiles((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        flash("success", "Business updated.");
      } else {
        payload.slug = slugify(name) || `business-${Date.now()}`;
        const created = await createProfile(payload);
        setProfiles((prev) => [created, ...prev]);
        // Move straight into edit mode so logo, cover, links and hours can be added.
        openEdit(created);
        flash("success", "Business created. Add logo, links and hours below.");
      }
    } catch (err) {
      flash("error", err.message || "Could not save business.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (profile) => {
    if (!window.confirm(`Delete "${profile.business_name}"? This cannot be undone.`)) return;
    try {
      await deleteProfile(profile.id);
      setProfiles((prev) => prev.filter((p) => p.id !== profile.id));
      flash("success", "Business deleted.");
    } catch (err) {
      flash("error", err.message || "Could not delete business.");
    }
  };

  const applyImageResult = (updated) => {
    setProfiles((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleLogo = async (file) => {
    if (!file || !editingId) return;
    setUploadingLogo(true);
    try {
      const updated = await uploadBusinessLogo(editingId, file);
      applyImageResult(updated);
      flash("success", "Logo updated.");
    } catch (err) {
      flash("error", err.message || "Logo upload failed.");
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  const handleCover = async (file) => {
    if (!file || !editingId) return;
    setUploadingCover(true);
    try {
      const updated = await uploadBusinessCover(editingId, file);
      applyImageResult(updated);
      flash("success", "Cover image updated.");
    } catch (err) {
      flash("error", err.message || "Cover upload failed.");
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  };

  const handleAddSocial = async () => {
    if (!editingId) return;
    if (!newSocial.url.trim()) return flash("error", "Enter a social link URL.");
    setSavingExtras(true);
    try {
      const link = await addBusinessSocialLink(editingId, newSocial.platform, newSocial.url.trim());
      setSocialLinks((prev) => [...prev, link]);
      setNewSocial({ platform: newSocial.platform, url: "" });
    } catch (err) {
      flash("error", err.message || "Could not add link.");
    } finally {
      setSavingExtras(false);
    }
  };

  const handleDeleteSocial = async (id) => {
    try {
      await deleteSocialLink(id);
      setSocialLinks((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      flash("error", err.message || "Could not remove link.");
    }
  };

  const openHours = (dayIndex) => {
    const existing = businessHours.find((h) => h.day_of_week === dayIndex);
    setHoursForm({
      open_time: (existing?.open_time || "09:00").slice(0, 5),
      close_time: (existing?.close_time || "18:00").slice(0, 5),
      is_closed: existing?.is_closed ?? false,
      day_of_week: dayIndex,
    });
  };

  const handleSaveHours = async (dayIndex) => {
    if (!editingId) return;
    setSavingExtras(true);
    try {
      const saved = await saveBusinessHours(editingId, dayIndex, {
        open_time: hoursForm.is_closed ? null : hoursForm.open_time,
        close_time: hoursForm.is_closed ? null : hoursForm.close_time,
        is_closed: hoursForm.is_closed,
      });
      setBusinessHours((prev) => {
        const others = prev.filter((h) => h.day_of_week !== dayIndex);
        return [...others, saved].sort((a, b) => a.day_of_week - b.day_of_week);
      });
      flash("success", "Business hours saved.");
    } catch (err) {
      flash("error", err.message || "Could not save hours.");
    } finally {
      setSavingExtras(false);
    }
  };

  const handleSubmitVerification = async () => {
    if (!editingId) return;
    try {
      const updated = await submitBusinessVerification(editingId);
      applyImageResult(updated);
      flash("success", "Submitted for verification.");
    } catch (err) {
      flash("error", err.message || "Could not submit for verification.");
    }
  };

  const inputClass =
    "w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-gray-900";

  // ─── LIST VIEW ─────────────────────────────────────────────────────────────
  if (view === "list") {
    return (
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-xl font-extrabold text-gray-900">My Businesses</h3>
            <p className="text-sm text-gray-500">Companies, shops and services you manage.</p>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-bold rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg cursor-pointer border-none"
          >
            <Plus className="w-4 h-4" /> Add Business
          </button>
        </div>

        <div className="mb-4">
          <Message type={msg.type} text={msg.text} />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <span className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : profiles.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-emerald-500" />
            </div>
            <p className="text-lg font-bold text-gray-900">You haven't added a business yet.</p>
            <p className="text-sm text-gray-500 mt-1 mb-5">
              Create your first business profile to list products and services.
            </p>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg cursor-pointer border-none"
            >
              <Plus className="w-4 h-4" /> Add Business
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {profiles.map((p) => (
              <div key={p.id} className="bg-white border border-gray-200/60 rounded-2xl overflow-hidden hover:shadow-lg transition-all">
                <div className="flex gap-4 p-5">
                  <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    {p.logo_url ? (
                      <img src={p.logo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="w-7 h-7 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 truncate">{p.business_name}</h4>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" />
                      {[p.city, p.state].filter(Boolean).join(", ") || "No location"}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <VerifyBadge status={p.verification_status} />
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${p.is_public ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                        {p.is_public ? "Public" : "Private"}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 uppercase">
                        {p.profile_type}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex border-t border-gray-100 divide-x divide-gray-100">
                  <button
                    onClick={() => openEdit(p)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer border-none bg-transparent"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <a
                    href={`/enduser/business/${p.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold text-gray-600 hover:bg-gray-50 no-underline"
                  >
                    <Eye className="w-3.5 h-3.5" /> View
                  </a>
                  <button
                    onClick={() => onManage && onManage(p.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold text-emerald-600 hover:bg-emerald-50 cursor-pointer border-none bg-transparent"
                  >
                    <Settings className="w-3.5 h-3.5" /> Manage
                  </button>
                  <button
                    onClick={() => handleDelete(p)}
                    className="flex items-center justify-center gap-1.5 px-4 py-3 text-xs font-bold text-red-500 hover:bg-red-50 cursor-pointer border-none bg-transparent"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─── FORM VIEW ─────────────────────────────────────────────────────────────
  const showExtras = Boolean(editingId);
  const typeKey = form.profile_type;
  const detailFields = detail || {};

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => {
          setView("list");
          resetForm();
          setMsg({ type: "", text: "" });
        }}
        className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-800 mb-4 cursor-pointer border-none bg-transparent"
      >
        <ArrowLeft className="w-4 h-4" /> Back to My Businesses
      </button>

      <div className="bg-white border border-gray-200/60 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-200/60 bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">
              {editingId ? "Edit Business" : "Add Business"}
            </h3>
            <p className="text-sm text-emerald-100">
              {editingId ? editingProfile?.business_name : "Create a new business profile"}
            </p>
          </div>
          {editingId && <VerifyBadge status={editingProfile?.verification_status} />}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <Message type={msg.type} text={msg.text} />

          {showExtras && editingProfile && (
            <div className="flex flex-wrap items-center gap-4 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
                  {editingProfile.logo_url ? (
                    <img src={editingProfile.logo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <label className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg hover:bg-emerald-100 cursor-pointer">
                  <Camera className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                  {uploadingLogo ? "Uploading..." : "Business logo"}
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    disabled={uploadingLogo}
                    onChange={(e) => handleLogo(e.target.files?.[0])}
                  />
                </label>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-24 h-16 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
                  {editingProfile.cover_image_url ? (
                    <img src={editingProfile.cover_image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <label className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg hover:bg-emerald-100 cursor-pointer">
                  <Camera className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                  {uploadingCover ? "Uploading..." : "Cover image"}
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    disabled={uploadingCover}
                    onChange={(e) => handleCover(e.target.files?.[0])}
                  />
                </label>
              </div>
              <button
                type="button"
                onClick={handleSubmitVerification}
                disabled={
                  editingProfile.is_verified ||
                  ["PENDING", "VERIFIED"].includes((editingProfile.verification_status || "").toUpperCase())
                }
                className="ml-auto inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg hover:bg-blue-100 disabled:opacity-50 cursor-pointer border-none"
              >
                <Send className="w-3.5 h-3.5" /> Submit for verification
              </button>
            </div>
          )}

          {/* Basic information */}
          <p className="text-xs font-extrabold uppercase tracking-wide text-gray-400">Basic information</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">Business Name *</label>
              <input
                type="text"
                value={form.business_name}
                onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                className={inputClass}
                placeholder="e.g. Sunrise Traders"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Business Type *</label>
              <select
                value={form.profile_type}
                onChange={(e) => {
                  const t = e.target.value;
                  setForm({ ...form, profile_type: t });
                  setDetail({ ...EMPTY_DETAIL[t] });
                }}
                className={inputClass}
                disabled={Boolean(editingId)}
              >
                <option value="INDIVIDUAL">Individual / Professional</option>
                <option value="COMPANY">Company</option>
                <option value="MSME">MSME</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Category *</label>
              <select
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value, subcategory_id: "" })}
                className={inputClass}
              >
                <option value="">Select category</option>
                {categoryOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Subcategory</label>
              <select
                value={form.subcategory_id}
                onChange={(e) => setForm({ ...form, subcategory_id: e.target.value })}
                className={inputClass}
                disabled={!form.category_id}
              >
                <option value="">Select subcategory</option>
                {subcategoryOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className={inputClass}
                placeholder="Describe your business"
              />
            </div>
          </div>

          {/* Type-specific detail */}
          {typeKey === "COMPANY" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Registration Number</label>
                <input
                  type="text"
                  value={detailFields.company_registration_number || ""}
                  onChange={(e) => setDetail({ ...detailFields, company_registration_number: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Legal Name</label>
                <input
                  type="text"
                  value={detailFields.legal_name || ""}
                  onChange={(e) => setDetail({ ...detailFields, legal_name: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Company Type</label>
                <input
                  type="text"
                  value={detailFields.company_type || ""}
                  onChange={(e) => setDetail({ ...detailFields, company_type: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>
          )}
          {typeKey === "INDIVIDUAL" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Professional Name</label>
                <input
                  type="text"
                  value={detailFields.professional_name || ""}
                  onChange={(e) => setDetail({ ...detailFields, professional_name: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Profession</label>
                <input
                  type="text"
                  value={detailFields.profession || ""}
                  onChange={(e) => setDetail({ ...detailFields, profession: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Experience (years)</label>
                <input
                  type="number"
                  min="0"
                  value={detailFields.experience_years ?? ""}
                  onChange={(e) =>
                    setDetail({
                      ...detailFields,
                      experience_years: e.target.value === "" ? "" : parseInt(e.target.value),
                    })
                  }
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">Services</label>
                <textarea
                  value={detailFields.services || ""}
                  onChange={(e) => setDetail({ ...detailFields, services: e.target.value })}
                  rows={2}
                  className={inputClass}
                />
              </div>
            </div>
          )}
          {typeKey === "MSME" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">MSME Number</label>
                <input
                  type="text"
                  value={detailFields.msme_number || ""}
                  onChange={(e) => setDetail({ ...detailFields, msme_number: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Business Type</label>
                <input
                  type="text"
                  value={detailFields.business_type || ""}
                  onChange={(e) => setDetail({ ...detailFields, business_type: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Industry</label>
                <input
                  type="text"
                  value={detailFields.industry || ""}
                  onChange={(e) => setDetail({ ...detailFields, industry: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {/* Contact information */}
          <p className="text-xs font-extrabold uppercase tracking-wide text-gray-400 pt-2">Contact information</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Business Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Business Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">Website</label>
              <input
                type="url"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                className={inputClass}
                placeholder="https://example.com"
              />
            </div>
          </div>

          {/* Location information */}
          <p className="text-xs font-extrabold uppercase tracking-wide text-gray-400 pt-2">Location information</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">Business Address</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">City</label>
              <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">State</label>
              <input type="text" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Country</label>
              <input type="text" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Pincode</label>
              <input type="text" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Latitude</label>
              <input
                type="number"
                step="any"
                value={form.latitude}
                onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Longitude</label>
              <input
                type="number"
                step="any"
                value={form.longitude}
                onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          {/* Additional */}
          <p className="text-xs font-extrabold uppercase tracking-wide text-gray-400 pt-2">Additional information</p>
          <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_public}
              onChange={(e) => setForm({ ...form, is_public: e.target.checked })}
              className="w-4 h-4 accent-emerald-600"
            />
            <span className="text-sm text-gray-700 font-medium">
              Publish this business to the public marketplace
            </span>
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg disabled:opacity-50 cursor-pointer border-none"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : editingId ? "Save Changes" : "Create Business"}
            </button>
            {editingId && (
              <a
                href={`/enduser/business/${editingProfile?.slug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 no-underline"
              >
                <Eye className="w-4 h-4" /> View Public Profile
              </a>
            )}
          </div>
        </form>
      </div>

      {/* Social links + business hours (edit mode only) */}
      {showExtras && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
          <div className="bg-white border border-gray-200/60 rounded-2xl p-6">
            <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-500" /> Social Links
            </h4>
            <div className="space-y-2 mb-3">
              {socialLinks.length === 0 ? (
                <p className="text-sm text-gray-400">No social links yet.</p>
              ) : (
                socialLinks.map((l) => (
                  <div key={l.id} className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl">
                    <span className="text-xs font-bold text-gray-500 w-20 flex-shrink-0">{l.platform}</span>
                    <a href={l.url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 truncate flex-1">
                      {l.url}
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDeleteSocial(l.id)}
                      className="text-red-500 hover:text-red-700 cursor-pointer border-none bg-transparent"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <select
                value={newSocial.platform}
                onChange={(e) => setNewSocial({ ...newSocial, platform: e.target.value })}
                className="px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm text-gray-900"
              >
                {SOCIAL_PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <input
                type="url"
                value={newSocial.url}
                onChange={(e) => setNewSocial({ ...newSocial, url: e.target.value })}
                placeholder="https://..."
                className="flex-1 px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm text-gray-900 outline-none"
              />
              <button
                type="button"
                onClick={handleAddSocial}
                disabled={savingExtras}
                className="px-3 py-2 bg-blue-500 text-white text-sm font-bold rounded-xl hover:bg-blue-600 disabled:opacity-50 cursor-pointer border-none"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-200/60 rounded-2xl p-6">
            <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-violet-500" /> Business Hours
            </h4>
            <div className="space-y-2">
              {DAYS.map((day, i) => {
                const h = businessHours.find((x) => x.day_of_week === i);
                const isEditing = hoursForm.day_of_week === i;
                return (
                  <div key={day} className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl">
                    <span className="text-xs font-bold text-gray-600 w-20 flex-shrink-0">{day}</span>
                    {isEditing ? (
                      <>
                        <input
                          type="time"
                          value={hoursForm.open_time}
                          disabled={hoursForm.is_closed}
                          onChange={(e) => setHoursForm({ ...hoursForm, open_time: e.target.value })}
                          className="px-2 py-1 border border-gray-200 rounded-lg text-xs"
                        />
                        <span className="text-xs text-gray-400">to</span>
                        <input
                          type="time"
                          value={hoursForm.close_time}
                          disabled={hoursForm.is_closed}
                          onChange={(e) => setHoursForm({ ...hoursForm, close_time: e.target.value })}
                          className="px-2 py-1 border border-gray-200 rounded-lg text-xs"
                        />
                        <label className="flex items-center gap-1 text-xs text-gray-500 ml-auto">
                          <input
                            type="checkbox"
                            checked={hoursForm.is_closed}
                            onChange={(e) => setHoursForm({ ...hoursForm, is_closed: e.target.checked })}
                            className="accent-emerald-600"
                          />
                          Closed
                        </label>
                        <button
                          type="button"
                          onClick={() => handleSaveHours(i)}
                          disabled={savingExtras}
                          className="px-2 py-1 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 disabled:opacity-50 cursor-pointer border-none"
                        >
                          Save
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-xs text-gray-600">
                          {h ? (h.is_closed ? "Closed" : `${(h.open_time || "").slice(0, 5)} - ${(h.close_time || "").slice(0, 5)}`) : "Not set"}
                        </span>
                        <button
                          type="button"
                          onClick={() => openHours(i)}
                          className="ml-auto text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer border-none bg-transparent"
                        >
                          Edit
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
