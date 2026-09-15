import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Upload,
  Plus,
  Trash2,
  CheckCircle2,
  Building2,
  MapPin,
  Phone,
  Globe,
  Share2,
  FileText,
  Image,
  LogOut,
} from "lucide-react";
import SearchableSelect from "./SearchableSelect";
import { COUNTRIES, getCitiesForState, getStatesForCountry } from "./locationData";
import { updateProfile, uploadProfilePic } from "../api";
import ImageCropModal from "./ImageCropModal";

const PROFILE_TYPES = ["Retail", "Technology", "Healthcare", "Education", "Food & Beverage", "Finance", "Real Estate", "Other"];

export default function CustomerForm() {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [user, setUser] = useState(null);
  const [profilePic, setProfilePic] = useState(null);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [cropImage, setCropImage] = useState(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileCity, setProfileCity] = useState("");
  const [profileState, setProfileState] = useState("");
  const [profileCountry, setProfileCountry] = useState("India");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");

  const availableProfileStates = getStatesForCountry(profileCountry);
  const availableProfileCities = getCitiesForState(profileState);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        setProfileName(parsed.full_name || "");
        setProfileCity(parsed.city || "");
        setProfileState(parsed.state || "");
        setProfileCountry(parsed.country || "India");
        setProfilePic(parsed.profile_pic || null);
      } catch {
        setUser(null);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleUploadPic = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCropImage(reader.result);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, []);

  const handleCropComplete = useCallback(async (croppedFile) => {
    setCropModalOpen(false);
    setCropImage(null);
    setUploadingPic(true);
    try {
      const result = await uploadProfilePic(croppedFile);
      setProfilePic(result.profile_pic);
      const updatedUser = { ...user, profile_pic: result.profile_pic };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingPic(false);
    }
  }, [user]);

  const handleCropCancel = useCallback(() => {
    setCropModalOpen(false);
    setCropImage(null);
  }, []);

  const handleSaveProfile = useCallback(async () => {
    if (!profileName.trim()) return;
    setProfileSaving(true);
    setProfileMessage("");
    try {
      const result = await updateProfile({
        full_name: profileName,
        city: profileCity || null,
        state: profileState || null,
        country: profileCountry || null,
      });
      const updatedUser = { ...user, ...result };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setProfileMessage("Profile updated successfully!");
      setTimeout(() => setEditingProfile(false), 1500);
    } catch (err) {
      setProfileMessage(err.message || "Failed to update profile");
    } finally {
      setProfileSaving(false);
    }
  }, [profileName, profileCity, profileState, profileCountry, user]);

  const [form, setForm] = useState({
    profileType: "Retail",
    businessName: "",
    tagline: "",
    description: "",
    phone: "",
    email: "",
    website: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    companyName: "",
    registrationNo: "",
    foundedYear: "",
    employeeCount: "",
    facebook: "",
    twitter: "",
    instagram: "",
    linkedin: "",
    logoUrl: "",
    coverUrl: "",
    visibility: true,
    documents: [],
  });

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const availableStates = getStatesForCountry(form.country);
  const availableCities = getCitiesForState(form.state);

  const handleCountryChange = (val) => {
    setForm((prev) => ({ ...prev, country: val, state: "", city: "" }));
  };

  const handleStateChange = (val) => {
    setForm((prev) => ({ ...prev, state: val, city: "" }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200/60 px-6 py-4 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium text-sm cursor-pointer border-none bg-transparent transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </button>
          <h1 className="text-lg font-bold text-gray-900">Create Business Profile</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-600 hover:text-red-600 font-medium text-sm cursor-pointer border-none bg-transparent transition-colors"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* User Profile Card */}
        <div className="bg-white border border-gray-200/60 rounded-3xl p-6 mb-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              {profilePic ? (
                <img src={profilePic} alt="Profile" className="w-20 h-20 rounded-2xl object-cover shadow-lg" />
              ) : (
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                  {profileName ? profileName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() : "CU"}
                </div>
              )}
              {uploadingPic && (
                <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                </div>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-900">{user?.full_name || "Customer"}</h2>
              <p className="text-sm text-gray-500">{user?.email || ""}</p>
              <label className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 transition-colors cursor-pointer">
                <Upload className="w-3 h-3" /> Upload Picture
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleUploadPic} className="hidden" disabled={uploadingPic} />
              </label>
            </div>
            <button
              onClick={() => setEditingProfile(!editingProfile)}
              className="px-4 py-2 bg-gray-100 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-200 transition-colors cursor-pointer border-none"
            >
              {editingProfile ? "Cancel" : "Edit Profile"}
            </button>
          </div>

          {editingProfile && (
            <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
              {profileMessage && (
                <div className={`p-3 rounded-xl text-sm text-center ${
                  profileMessage.includes("success") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                }`}>{profileMessage}</div>
              )}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-gray-900" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <SearchableSelect label="Country" value={profileCountry} onChange={(val) => { setProfileCountry(val); setProfileState(""); setProfileCity(""); }} options={COUNTRIES} placeholder="Select country" />
                <SearchableSelect label="State" value={profileState} onChange={(val) => { setProfileState(val); setProfileCity(""); }} options={availableProfileStates} placeholder="Select state" />
                <SearchableSelect label="City" value={profileCity} onChange={setProfileCity} options={availableProfileCities} placeholder="Select city" />
              </div>
              <div className="flex justify-end">
                <button onClick={handleSaveProfile} disabled={!profileName.trim() || profileSaving}
                  className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all cursor-pointer border-none disabled:opacity-40">
                  {profileSaving ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </div>
          )}
        </div>

        {saved && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-6 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <p className="text-emerald-700 font-medium text-sm">
              Profile saved successfully!
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Type */}
          <Section icon={Building2} title="Profile Type" color="from-blue-500 to-indigo-600">
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Business Category</label>
                <select
                  value={form.profileType}
                  onChange={(e) => update("profileType", e.target.value)}
                  className="w-full px-5 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 cursor-pointer"
                >
                  {PROFILE_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Business Name *</label>
                <input
                  type="text"
                  value={form.businessName}
                  onChange={(e) => update("businessName", e.target.value)}
                  placeholder="e.g. Sunrise Bakery"
                  required
                  className="w-full px-5 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 placeholder:text-gray-400"
                />
              </div>
            </div>
            <div className="mt-5">
              <label className="block text-sm font-bold text-gray-700 mb-2">Tagline</label>
              <input
                type="text"
                value={form.tagline}
                onChange={(e) => update("tagline", e.target.value)}
                placeholder="A short tagline for your business"
                className="w-full px-5 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 placeholder:text-gray-400"
              />
            </div>
            <div className="mt-5">
              <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
              <textarea
                rows="3"
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Tell us about your business..."
                className="w-full px-5 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 placeholder:text-gray-400 resize-none"
              />
            </div>
          </Section>

          {/* Contact & Website */}
          <Section icon={Phone} title="Contact & Website" color="from-emerald-500 to-teal-600">
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="+91 123 456 7890"
                  className="w-full px-5 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="contact@business.com"
                  className="w-full px-5 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 placeholder:text-gray-400"
                />
              </div>
            </div>
            <div className="mt-5">
              <label className="block text-sm font-bold text-gray-700 mb-2">Website</label>
              <input
                type="url"
                value={form.website}
                onChange={(e) => update("website", e.target.value)}
                placeholder="https://www.example.com"
                className="w-full px-5 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 placeholder:text-gray-400"
              />
            </div>
          </Section>

          {/* Location */}
          <Section icon={MapPin} title="Location" color="from-amber-500 to-orange-600">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Street Address</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
                placeholder="123 Business Street"
                className="w-full px-5 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 placeholder:text-gray-400"
              />
            </div>
            <div className="grid sm:grid-cols-3 gap-5 mt-5">
              <SearchableSelect
                label="Country"
                value={form.country}
                onChange={handleCountryChange}
                options={COUNTRIES}
                placeholder="Select country"
              />
              <SearchableSelect
                label="State"
                value={form.state}
                onChange={handleStateChange}
                options={availableStates}
                placeholder="Select state"
              />
              <SearchableSelect
                label="City"
                value={form.city}
                onChange={(val) => update("city", val)}
                options={availableCities}
                placeholder="Select city"
              />
            </div>
          </Section>

          {/* Company Details */}
          <Section icon={FileText} title="Company Details" color="from-violet-500 to-purple-600">
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Company Name</label>
                <input
                  type="text"
                  value={form.companyName}
                  onChange={(e) => update("companyName", e.target.value)}
                  placeholder="Legal company name"
                  className="w-full px-5 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Registration No.</label>
                <input
                  type="text"
                  value={form.registrationNo}
                  onChange={(e) => update("registrationNo", e.target.value)}
                  placeholder="CIN / GST Number"
                  className="w-full px-5 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 placeholder:text-gray-400"
                />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-5 mt-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Founded Year</label>
                <input
                  type="text"
                  value={form.foundedYear}
                  onChange={(e) => update("foundedYear", e.target.value)}
                  placeholder="e.g. 2020"
                  className="w-full px-5 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Employee Count</label>
                <input
                  type="text"
                  value={form.employeeCount}
                  onChange={(e) => update("employeeCount", e.target.value)}
                  placeholder="e.g. 10-50"
                  className="w-full px-5 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 placeholder:text-gray-400"
                />
              </div>
            </div>
          </Section>

          {/* Social Links */}
          <Section icon={Share2} title="Social Links" color="from-cyan-500 to-blue-600">
            <div className="grid sm:grid-cols-2 gap-5">
              {[
                { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/..." },
                { key: "twitter", label: "Twitter / X", placeholder: "https://twitter.com/..." },
                { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/..." },
                { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/..." },
              ].map((s) => (
                <div key={s.key}>
                  <label className="block text-sm font-bold text-gray-700 mb-2">{s.label}</label>
                  <input
                    type="url"
                    value={form[s.key]}
                    onChange={(e) => update(s.key, e.target.value)}
                    placeholder={s.placeholder}
                    className="w-full px-5 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 placeholder:text-gray-400"
                  />
                </div>
              ))}
            </div>
          </Section>

          {/* Documents */}
          <Section icon={Upload} title="Documents" color="from-rose-500 to-pink-600">
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer">
              <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-500 mb-1">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-400">PDF, JPG, PNG up to 5MB each</p>
            </div>
          </Section>

          {/* Logo & Cover */}
          <Section icon={Image} title="Logo & Cover Image" color="from-indigo-500 to-blue-600">
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Logo URL</label>
                <input
                  type="url"
                  value={form.logoUrl}
                  onChange={(e) => update("logoUrl", e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-5 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Cover Image URL</label>
                <input
                  type="url"
                  value={form.coverUrl}
                  onChange={(e) => update("coverUrl", e.target.value)}
                  placeholder="https://example.com/cover.jpg"
                  className="w-full px-5 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 placeholder:text-gray-400"
                />
              </div>
            </div>
          </Section>

          {/* Visibility Toggle */}
          <div className="bg-white border border-gray-200/60 rounded-3xl p-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Public Visibility</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Make your profile visible in the public directory
                </p>
              </div>
              <button
                type="button"
                onClick={() => update("visibility", !form.visibility)}
                className={`relative w-14 h-8 rounded-full transition-colors cursor-pointer border-none ${
                  form.visibility
                    ? "bg-gradient-to-r from-blue-500 to-indigo-600"
                    : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                    form.visibility ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white font-semibold rounded-2xl hover:from-blue-700 hover:via-indigo-700 hover:to-violet-700 transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl hover:-translate-y-0.5 cursor-pointer border-none"
            >
              <Save className="w-4 h-4" /> Save Profile
            </button>
          </div>
        </form>
      </div>

      {cropModalOpen && cropImage && (
        <ImageCropModal imageSrc={cropImage} onCrop={handleCropComplete} onCancel={handleCropCancel} />
      )}
    </div>
  );
}

function Section({ icon: Icon, title, color, children }) {
  return (
    <div className="bg-white border border-gray-200/60 rounded-3xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <div
          className={`w-10 h-10 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center shadow-lg`}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  );
}
