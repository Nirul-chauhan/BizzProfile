import React, { useEffect, useRef, useState } from "react";
import {
  Camera,
  Mail,
  Phone,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  UserCircle,
} from "lucide-react";
import { updateProfile, uploadProfilePic, removeProfilePic } from "../api";
import { useAuth } from "../context/AuthContext";

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

const STATUS_META = {
  UNVERIFIED: {
    icon: AlertCircle,
    wrap: "border-gray-200 bg-gray-50",
    title: "text-gray-700",
    sub: "text-gray-500",
    label: "Unverified",
    hint: "Your personal account has not been submitted for verification yet.",
  },
  PENDING: {
    icon: Clock,
    wrap: "border-amber-200 bg-amber-50/60",
    title: "text-amber-800",
    sub: "text-amber-600",
    label: "Pending review",
    hint: "Your personal verification is awaiting an admin decision.",
  },
  VERIFIED: {
    icon: ShieldCheck,
    wrap: "border-emerald-200 bg-emerald-50/60",
    title: "text-emerald-800",
    sub: "text-emerald-600",
    label: "Verified",
    hint: "Your personal account has been verified by our team.",
  },
  REJECTED: {
    icon: XCircle,
    wrap: "border-red-200 bg-red-50/60",
    title: "text-red-800",
    sub: "text-red-600",
    label: "Rejected",
    hint: "Your verification was rejected. Please review your details and contact support.",
  },
};

export default function SellerPersonalProfile({ user, onUserUpdate }) {
  const { refreshUser } = useAuth();
  const [form, setForm] = useState({
    full_name: "",
    mobile: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [saving, setSaving] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const picInputRef = useRef(null);

  useEffect(() => {
    setForm({
      full_name: user?.full_name || "",
      mobile: user?.mobile || "",
      address: user?.address || "",
      city: user?.city || "",
      state: user?.state || "",
      pincode: user?.pincode || "",
    });
  }, [user]);

  const persist = (fresh) => {
    if (onUserUpdate) onUserUpdate(fresh);
    refreshUser().catch(() => {});
  };

  const handleSave = async (e) => {
    e?.preventDefault?.();
    const fullName = form.full_name.trim();
    if (!fullName) {
      setMsg({ type: "error", text: "Full name is required." });
      return;
    }
    if (form.mobile.trim() && !/^\+?[0-9][0-9 -]{6,18}[0-9]$/.test(form.mobile.trim())) {
      setMsg({ type: "error", text: "Enter a valid mobile number." });
      return;
    }
    setSaving(true);
    setMsg({ type: "", text: "" });
    try {
      const fresh = await updateProfile({
        full_name: fullName,
        mobile: form.mobile.trim() || null,
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
      });
      persist(fresh);
      setMsg({ type: "success", text: "Personal profile updated!" });
      setTimeout(() => setMsg({ type: "", text: "" }), 3000);
    } catch (err) {
      setMsg({ type: "error", text: err.message || "Failed to update personal profile." });
    } finally {
      setSaving(false);
    }
  };

  const handleUploadPic = async (file) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setMsg({ type: "error", text: "Use a JPEG, PNG or WebP image." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMsg({ type: "error", text: "Image must be 5 MB or smaller." });
      return;
    }
    setUploadingPic(true);
    setMsg({ type: "", text: "" });
    try {
      const fresh = await uploadProfilePic(file);
      persist(fresh);
      setMsg({ type: "success", text: "Profile photo updated!" });
      setTimeout(() => setMsg({ type: "", text: "" }), 3000);
    } catch (err) {
      setMsg({ type: "error", text: err.message || "Upload failed." });
    } finally {
      setUploadingPic(false);
      if (picInputRef.current) picInputRef.current.value = "";
    }
  };

  const handleRemovePic = async () => {
    setUploadingPic(true);
    setMsg({ type: "", text: "" });
    try {
      const fresh = await removeProfilePic();
      persist(fresh);
      setMsg({ type: "success", text: "Profile photo removed." });
      setTimeout(() => setMsg({ type: "", text: "" }), 3000);
    } catch (err) {
      setMsg({ type: "error", text: err.message || "Could not remove photo." });
    } finally {
      setUploadingPic(false);
    }
  };

  const status = (user?.verification_status || "UNVERIFIED").toUpperCase();
  const meta = STATUS_META[status] || STATUS_META.UNVERIFIED;
  const StatusIcon = meta.icon;
  const inputClass =
    "w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900";

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white border border-gray-200/60 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-200/60 bg-gradient-to-r from-blue-500 to-indigo-600">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <UserCircle className="w-5 h-5" /> Personal Profile
          </h3>
          <p className="text-sm text-blue-100">Your account details as a seller</p>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">
          <Message type={msg.type} text={msg.text} />

          <div className="flex flex-wrap items-start gap-4">
            <div className="relative flex-shrink-0">
              {user?.profile_pic ? (
                <img
                  src={user.profile_pic}
                  alt=""
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-gray-200"
                />
              ) : (
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-extrabold text-lg">
                  {(user?.full_name || "SE")
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
              )}
              {uploadingPic && (
                <span className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2 min-w-0">
              <div className="flex flex-wrap gap-2">
                <label className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg hover:bg-blue-100 transition-colors cursor-pointer">
                  <Camera className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                  {uploadingPic ? "Uploading..." : user?.profile_pic ? "Change photo" : "Add photo"}
                  <input
                    ref={picInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    disabled={uploadingPic}
                    onChange={(e) => handleUploadPic(e.target.files?.[0])}
                  />
                </label>
                {user?.profile_pic && (
                  <button
                    type="button"
                    onClick={handleRemovePic}
                    disabled={uploadingPic}
                    className="px-3 py-1.5 bg-gray-50 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-100 transition-colors cursor-pointer border-none disabled:opacity-50"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                    user?.is_active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                  }`}
                >
                  {user?.is_active ? "Active account" : "Inactive account"}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                    user?.is_email_verified
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  <Mail className="w-3 h-3" />
                  {user?.is_email_verified ? "Email verified" : "Email unverified"}
                </span>
                {user?.mobile && (
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                      user?.is_mobile_verified
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    <Phone className="w-3 h-3" />
                    {user?.is_mobile_verified ? "Mobile verified" : "Mobile unverified"}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Personal verification status — separate from business verification */}
          <div className={`flex items-start gap-2.5 rounded-xl border-2 p-4 ${meta.wrap}`}>
            <StatusIcon className={`w-5 h-5 flex-shrink-0 ${meta.sub}`} />
            <div className="min-w-0">
              <p className={`text-sm font-bold ${meta.title}`}>Personal verification: {meta.label}</p>
              <p className={`text-xs ${meta.sub}`}>{meta.hint}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Full Name *</label>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className={inputClass}
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Mobile Number</label>
              <input
                type="tel"
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                className={inputClass}
                placeholder="e.g. 9876543210"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={user?.email || ""}
                readOnly
                className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-200 rounded-xl text-gray-600 text-sm cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Joined On</label>
              <input
                type="text"
                value={
                  user?.created_at
                    ? new Date(user.created_at).toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"
                }
                readOnly
                className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-200 rounded-xl text-gray-600 text-sm cursor-not-allowed"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">Address</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className={inputClass}
                placeholder="Street address"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">City</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className={inputClass}
                placeholder="City"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">State</label>
              <input
                type="text"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className={inputClass}
                placeholder="State"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Pincode</label>
              <input
                type="text"
                value={form.pincode}
                onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                className={inputClass}
                placeholder="Pincode"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg disabled:opacity-50 cursor-pointer border-none"
          >
            {saving ? "Saving..." : "Save Personal Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}
