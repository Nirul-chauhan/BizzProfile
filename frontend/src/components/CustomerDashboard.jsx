import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getMyProfiles, getProfileDocuments, createProfile, getNearbyProfiles, getCategories, getSubcategories, searchProfiles, updateProfile, uploadProfilePic, removeProfilePic } from "../api";
import {
  LayoutDashboard,
  UserCircle,
  Building2,
  Plus,
  Search,
  MapPin,
  FileText,
  Settings,
  LogOut,
  ChevronDown,
  Users,
  UserCheck,
  CalendarClock,
  Pencil,
  Eye,
  ShieldCheck,
  Camera,
  Trash2,
  Clock,
  Store,
  Coffee,
  Code,
  ShoppingBag,
  Stethoscope,
  GraduationCap,
  Car,
  Wrench,
  Palette,
  Sprout,
  Heart,
  Briefcase,
  Tv,
  Film,
  Truck,
  Pill,
  ShoppingCart,
  Cake,
  Compass,
  Shirt,
  Laptop,
  HardHat,
  Activity,
  Tag,
  Bell,
  X,
  AlertCircle,
  CheckCircle2,
  Navigation,
  Loader,
} from "lucide-react";

const NAV = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { id: "account", icon: UserCircle, label: "My Account" },
  { id: "profiles", icon: Building2, label: "My Profiles" },
  { id: "create", icon: Plus, label: "Create Profile" },
  { id: "search", icon: Search, label: "Search" },
  { id: "nearme", icon: MapPin, label: "Near Me" },
  { id: "documents", icon: FileText, label: "Documents" },
];

const BOTTOM_NAV = [
  { id: "settings", icon: Settings, label: "Settings" },
];

function getCategoryIcon(profile) {
  const catName = (typeof profile.category === "string" ? profile.category : profile.category?.name) || "";
  const lower = catName.toLowerCase();
  if (lower.includes("software") || lower.includes("computer") || lower.includes("technology")) return Code;
  if (lower.includes("retail") || lower.includes("shop") || lower.includes("ecommerce")) return Store;
  if (lower.includes("cafe") || lower.includes("restaurant") || lower.includes("food")) return Coffee;
  if (lower.includes("health") || lower.includes("doctor") || lower.includes("wellness")) return Stethoscope;
  if (lower.includes("education") || lower.includes("coach") || lower.includes("training")) return GraduationCap;
  if (lower.includes("auto") || lower.includes("car")) return Car;
  if (lower.includes("beauty") || lower.includes("salon") || lower.includes("fashion")) return Heart;
  if (lower.includes("cloth") || lower.includes("shirt")) return Shirt;
  if (lower.includes("electronic")) return Tv;
  if (lower.includes("agri") || lower.includes("farm")) return Sprout;
  if (lower.includes("construct") || lower.includes("build") || lower.includes("material")) return HardHat;
  if (lower.includes("transport") || lower.includes("logistic")) return Truck;
  if (lower.includes("pharma") || lower.includes("medicine")) return Pill;
  if (lower.includes("design") || lower.includes("creative")) return Palette;
  if (lower.includes("entertain") || lower.includes("event")) return Film;
  if (lower.includes("repair") || lower.includes("wrench")) return Wrench;
  if (lower.includes("bake") || lower.includes("cake")) return Cake;
  if (lower.includes("grocery") || lower.includes("store")) return ShoppingCart;
  if (lower.includes("professional") || lower.includes("consult") || lower.includes("service")) return Briefcase;
  if (lower.includes("fitness") || lower.includes("yoga")) return Activity;
  if (lower.includes("real") || lower.includes("estate")) return Compass;
  if (lower.includes("laptop") || lower.includes("tech")) return Laptop;
  if (lower.includes("accessor") || lower.includes("bag")) return ShoppingBag;
  return Store;
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialNav = searchParams.get("nav") || "dashboard";
  const [activeNav, setActiveNav] = useState(initialNav);
  const [user, setUser] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyResults, setNearbyResults] = useState([]);
  const [nearbyError, setNearbyError] = useState("");
  const [nearbyRadius, setNearbyRadius] = useState(10);

  const [createForm, setCreateForm] = useState({
    business_name: "",
    category_id: "",
    subcategory_id: "",
    profile_type: "COMPANY",
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
    company_detail: { company_registration_number: "", legal_name: "", company_type: "" },
    individual_detail: { professional_name: "", profession: "", experience_years: "", services: "" },
    msme_detail: { msme_number: "", business_type: "", industry: "" },
  });

  // Profile edit states
  const [profileName, setProfileName] = useState("");
  const [profileMobile, setProfileMobile] = useState("");
  const [profileCity, setProfileCity] = useState("");
  const [profileState, setProfileState] = useState("");
  const [profileCountry, setProfileCountry] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");

  const [createSaving, setCreateSaving] = useState(false);
  const [createMessage, setCreateMessage] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        setProfileName(parsed.full_name || "");
        setProfileMobile(parsed.mobile || "");
        setProfileCity(parsed.city || "");
        setProfileState(parsed.state || "");
        setProfileCountry(parsed.country || "");
        setProfilePic(localStorage.getItem("customer_avatar") || null);
      } catch {
        navigate("/auth/customer");
      }
    } else {
      navigate("/auth/customer");
    }
  }, [navigate]);

  useEffect(() => {
    loadData();
    loadCategories();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const profilesData = await getMyProfiles();
      setProfiles(profilesData || []);
      const allDocs = [];
      for (const profile of profilesData || []) {
        try {
          const docs = await getProfileDocuments(profile.id);
          allDocs.push(...docs);
        } catch {}
      }
      setDocuments(allDocs);
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data || []);
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  };

  const loadSubcategories = async (categoryId) => {
    try {
      const data = await getSubcategories(categoryId);
      setSubcategories(data || []);
    } catch {
      setSubcategories([]);
    }
  };

  const handleUploadPic = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setProfileMessage("File size must be less than 5MB");
      return;
    }
    setUploadingPic(true);
    setProfileMessage("");
    try {
      const result = await uploadProfilePic(file);
      const picUrl = result.profile_pic || result.url || result.image_url;
      if (picUrl) {
        localStorage.setItem("customer_avatar", picUrl);
        setProfilePic(picUrl);
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          setProfilePic(reader.result);
          localStorage.setItem("customer_avatar", reader.result);
        };
        reader.readAsDataURL(file);
      }
      setProfileMessage("Profile picture updated successfully!");
      setTimeout(() => setProfileMessage(""), 3000);
    } catch (err) {
      setProfileMessage(err.message || "Failed to upload picture");
    } finally {
      setUploadingPic(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profileName.trim()) {
      setProfileMessage("Full name is required");
      return;
    }
    setSavingProfile(true);
    setProfileMessage("");
    try {
      const result = await updateProfile({
        full_name: profileName,
        city: profileCity || null,
        state: profileState || null,
        country: profileCountry || null,
      });
      const updatedUser = { ...user, ...result };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setProfileMessage("Profile updated successfully!");
      setTimeout(() => setProfileMessage(""), 3000);
    } catch (err) {
      setProfileMessage(err.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const totalProfiles = profiles.length;
  const verifiedProfiles = profiles.filter((p) => p.is_verified).length;
  const pendingProfiles = profiles.filter((p) => !p.is_verified).length;
  const totalDocs = documents.length;

  const metricCards = [
    { label: "Total Profiles", value: totalProfiles, icon: Users, bg: "bg-blue-50", iconColor: "text-blue-500" },
    { label: "Verified Profiles", value: verifiedProfiles, icon: UserCheck, bg: "bg-emerald-50", iconColor: "text-emerald-500" },
    { label: "Pending Profiles", value: pendingProfiles, icon: CalendarClock, bg: "bg-amber-50", iconColor: "text-amber-500" },
    { label: "Documents", value: totalDocs, icon: FileText, bg: "bg-violet-50", iconColor: "text-violet-500" },
  ];

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const result = await searchProfiles({ q: searchQuery, page_size: 20 });
      setSearchResults(result.items || []);
    } catch (err) {
      console.error("Search failed:", err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleNearMe = useCallback(() => {
    if (!navigator.geolocation) {
      setNearbyError("Geolocation is not supported by your browser.");
      return;
    }
    setNearbyLoading(true);
    setNearbyError("");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const result = await getNearbyProfiles(latitude, longitude, nearbyRadius);
          setNearbyResults(result.results || []);
          if ((result.results || []).length === 0) {
            setNearbyError("No businesses found nearby. Try increasing the search radius.");
          }
        } catch (err) {
          console.error("Nearby search failed:", err);
          setNearbyError("Failed to fetch nearby businesses. Please try again.");
          setNearbyResults([]);
        } finally {
          setNearbyLoading(false);
        }
      },
      (error) => {
        setNearbyLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setNearbyError("Location permission denied. Please enable location access in your browser settings.");
            break;
          case error.POSITION_UNAVAILABLE:
            setNearbyError("Location information unavailable. Please try again.");
            break;
          case error.TIMEOUT:
            setNearbyError("Location request timed out. Please try again.");
            break;
          default:
            setNearbyError("An unknown error occurred while getting your location.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, [nearbyRadius]);

  const handleCreateProfile = async () => {
    if (!createForm.business_name.trim() || !createForm.category_id) {
      setCreateMessage("Business name and category are required.");
      return;
    }
    setCreateSaving(true);
    setCreateMessage("");
    try {
      const payload = {
        business_name: createForm.business_name,
        slug: slugify(createForm.business_name),
        category_id: parseInt(createForm.category_id),
        subcategory_id: createForm.subcategory_id ? parseInt(createForm.subcategory_id) : null,
        profile_type: createForm.profile_type,
        description: createForm.description || null,
        phone: createForm.phone || null,
        email: createForm.email || null,
        website: createForm.website || null,
        address: createForm.address || null,
        city: createForm.city || null,
        state: createForm.state || null,
        country: createForm.country || null,
        pincode: createForm.pincode || null,
        latitude: createForm.latitude ? parseFloat(createForm.latitude) : null,
        longitude: createForm.longitude ? parseFloat(createForm.longitude) : null,
        is_public: true,
      };

      if (createForm.profile_type === "COMPANY") {
        payload.company_detail = {
          company_registration_number: createForm.company_detail.company_registration_number || null,
          legal_name: createForm.company_detail.legal_name || null,
          company_type: createForm.company_detail.company_type || null,
        };
      } else if (createForm.profile_type === "INDIVIDUAL") {
        payload.individual_detail = {
          professional_name: createForm.individual_detail.professional_name || null,
          profession: createForm.individual_detail.profession || null,
          experience_years: createForm.individual_detail.experience_years ? parseInt(createForm.individual_detail.experience_years) : null,
          services: createForm.individual_detail.services || null,
        };
      } else if (createForm.profile_type === "MSME") {
        payload.msme_detail = {
          msme_number: createForm.msme_detail.msme_number || null,
          business_type: createForm.msme_detail.business_type || null,
          industry: createForm.msme_detail.industry || null,
        };
      }

      await createProfile(payload);
      setCreateMessage("Profile created successfully! It is now pending admin verification.");
      setCreateForm({
        business_name: "", category_id: "", subcategory_id: "", profile_type: "COMPANY",
        description: "", phone: "", email: "", website: "", address: "", city: "", state: "",
        country: "India", pincode: "", latitude: "", longitude: "",
        company_detail: { company_registration_number: "", legal_name: "", company_type: "" },
        individual_detail: { professional_name: "", profession: "", experience_years: "", services: "" },
        msme_detail: { msme_number: "", business_type: "", industry: "" },
      });
      loadData();
    } catch (err) {
      setCreateMessage(err.message || "Failed to create profile.");
    } finally {
      setCreateSaving(false);
    }
  };

  return (
    <div className="flex bg-gray-50" style={{ minHeight: "100vh" }}>
      {/* Sidebar */}
      <aside className="w-64 bg-[#0a2540] flex flex-col shadow-xl">
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-extrabold text-lg leading-tight">BizzProfile</h1>
              <p className="text-blue-300 text-[10px] font-medium">Customer Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {NAV.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer border-none ${
                  isActive
                    ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                    : "text-blue-200 hover:bg-white/10 hover:text-white bg-transparent"
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/10 space-y-1">
          {BOTTOM_NAV.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveNav("settings")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer border-none ${
                  activeNav === "settings"
                    ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                    : "text-blue-200 hover:bg-white/10 hover:text-white bg-transparent"
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-all cursor-pointer border-none bg-transparent"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-gray-900 capitalize">
              {activeNav === "nearme" ? "Near Me" : activeNav === "create" ? "Create Profile" : activeNav}
            </h2>
            <p className="text-xs text-gray-500">
              {user?.full_name || "Customer"}
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[9px] font-bold ml-1.5">CUSTOMER</span>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-xl hover:bg-gray-100 cursor-pointer border-none bg-transparent">
              <Bell className="w-5 h-5" />
              {pendingProfiles > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {pendingProfiles}
                </span>
              )}
            </button>
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer border-none bg-transparent"
              >
                {localStorage.getItem("customer_avatar") ? (
                  <img src={localStorage.getItem("customer_avatar")} alt="" className="w-8 h-8 rounded-lg object-cover" />
                ) : (
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                    {user?.full_name?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "CU"}
                  </div>
                )}
                <span className="text-sm font-medium text-gray-700 hidden sm:block">{user?.full_name || "Customer"}</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
              {showProfileMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-bold text-gray-900">{user?.full_name}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[9px] font-bold">CUSTOMER</span>
                    </div>
                    <button
                      onClick={() => { setActiveNav("account"); setShowProfileMenu(false); }}
                      className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-blue-50 cursor-pointer border-none bg-transparent flex items-center gap-2"
                    >
                      <Pencil className="w-4 h-4 text-blue-600" /> Edit Profile
                    </button>
                    <label className="w-full px-4 py-2.5 text-left text-sm text-blue-600 hover:bg-blue-50 cursor-pointer flex items-center gap-2">
                      <Camera className="w-4 h-4" /> Change Photo
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => { localStorage.setItem("customer_avatar", reader.result); window.location.reload(); };
                          reader.readAsDataURL(file);
                        }
                      }} />
                    </label>
                    {localStorage.getItem("customer_avatar") && (
                      <button onClick={async () => { try { await removeProfilePic(); localStorage.removeItem("customer_avatar"); window.location.reload(); } catch(e) { console.error(e); } }} className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 cursor-pointer border-none bg-transparent flex items-center gap-2">
                        <Trash2 className="w-4 h-4" /> Remove Photo
                      </button>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 cursor-pointer border-none bg-transparent flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
            </div>
          ) : activeNav === "dashboard" ? (
            /* ========== DASHBOARD ========== */
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {metricCards.map((m) => {
                  const Icon = m.icon;
                  return (
                    <div key={m.label} className="bg-white border border-gray-200/60 rounded-2xl p-5 hover:shadow-lg transition-all duration-300 group">
                      <div className="flex items-center justify-between mb-3">
                        <div className={`w-11 h-11 ${m.bg} rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                          <Icon className={`w-5 h-5 ${m.iconColor}`} />
                        </div>
                      </div>
                      <h3 className="text-2xl font-extrabold text-gray-900">{m.value}</h3>
                      <p className="text-xs text-gray-500 font-medium mt-1">{m.label}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-extrabold text-gray-900 mb-4">My Business Profiles</h3>
                {profiles.length === 0 ? (
                  <div className="bg-white border border-gray-200/60 rounded-2xl p-12 text-center">
                    <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium text-gray-600">No profiles yet</p>
                    <p className="text-sm text-gray-400 mt-1 mb-4">Create your first business profile to get started</p>
                    <button
                      onClick={() => setActiveNav("create")}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-sm rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md cursor-pointer border-none"
                    >
                      <Plus className="w-4 h-4" /> Create Profile
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {profiles.map((profile) => {
                      const CatIcon = getCategoryIcon(profile);
                      return (
                        <div key={profile.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 group">
                          <div className="p-5">
                            <div className="flex items-start gap-4 mb-4">
                              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                                {profile.logo_url ? (
                                  <img src={profile.logo_url} alt="" className="w-12 h-12 rounded-xl object-cover" />
                                ) : (
                                  <CatIcon className="w-6 h-6 text-blue-500" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-bold text-gray-900 truncate">{profile.business_name}</h4>
                                <p className="text-xs text-gray-500 mt-0.5">{typeof profile.category === "string" ? profile.category : profile.category?.name || "Business"}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mb-4">
                              {profile.is_verified ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                                  <ShieldCheck className="w-3 h-3" /> Verified
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                                  <Clock className="w-3 h-3" /> Pending
                                </span>
                              )}
                              {profile.city && (
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" /> {profile.city}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                              <Link to={`/customer/form?edit=${profile.id}`} className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-blue-500 transition-colors">
                                <Pencil className="w-3.5 h-3.5" /> Edit
                              </Link>
                              <Link to={`/enduser/business/${profile.slug}`} target="_blank" className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-emerald-500 transition-colors">
                                <Eye className="w-3.5 h-3.5" /> View
                              </Link>
                              <button className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-violet-500 transition-colors cursor-pointer border-none bg-transparent">
                                <Settings className="w-3.5 h-3.5" /> Manage
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : activeNav === "account" ? (
            /* ========== MY ACCOUNT ========== */
            <div className="max-w-2xl mx-auto">
              <div className="bg-white border border-gray-200/60 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-gray-200/60 bg-gradient-to-r from-blue-500 to-indigo-600">
                  <h3 className="text-lg font-bold text-white">Edit Profile</h3>
                  <p className="text-sm text-blue-100">Update your personal information</p>
                </div>
                <div className="p-6 space-y-5">
                  {profileMessage && (
                    <div className={`p-3 rounded-xl text-sm text-center ${
                      profileMessage.includes("success")
                        ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                        : "bg-red-50 border border-red-200 text-red-700"
                    }`}>
                      {profileMessage}
                    </div>
                  )}

                  {/* Profile Picture Upload */}
                  <div className="flex items-center gap-6 pb-5 border-b border-gray-200">
                    <div className="relative">
                      {profilePic ? (
                        <img src={profilePic} alt="Profile" className="w-24 h-24 rounded-2xl object-cover shadow-lg" />
                      ) : (
                        <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-lg">
                          {profileName ? profileName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() : "CU"}
                        </div>
                      )}
                      {uploadingPic && (
                        <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 mb-1">Profile Picture</p>
                      <p className="text-xs text-gray-500 mb-1">JPG, PNG or WebP. Max 5MB.</p>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold mb-3">CUSTOMER PORTAL</span>
                      <div className="flex items-center gap-2">
                        <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm font-bold rounded-xl hover:bg-blue-600 transition-colors cursor-pointer">
                          <Camera className="w-4 h-4" />
                          {uploadingPic ? "Uploading..." : "Upload Picture"}
                          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleUploadPic} className="hidden" disabled={uploadingPic} />
                        </label>
                        {profilePic && (
                          <button onClick={async () => { try { await removeProfilePic(); setProfilePic(null); localStorage.removeItem("customer_avatar"); } catch(e) { console.error(e); } }} className="px-3 py-2 bg-red-50 text-red-600 text-sm font-bold rounded-xl hover:bg-red-100 transition-colors cursor-pointer border-none">
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                    <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900" placeholder="Enter your full name" />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                    <input type="email" value={user?.email || ""} disabled className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-200 rounded-xl text-gray-500 cursor-not-allowed" />
                    <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Mobile</label>
                      <input type="text" value={profileMobile} onChange={(e) => setProfileMobile(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900" placeholder="Enter mobile number" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">City</label>
                      <input type="text" value={profileCity} onChange={(e) => setProfileCity(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900" placeholder="Enter city" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">State</label>
                      <input type="text" value={profileState} onChange={(e) => setProfileState(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900" placeholder="Enter state" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Country</label>
                      <input type="text" value={profileCountry} onChange={(e) => setProfileCountry(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900" placeholder="Enter country" />
                    </div>
                  </div>

                  <button onClick={handleSaveProfile} disabled={savingProfile} className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg disabled:opacity-50 cursor-pointer border-none">
                    {savingProfile ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          ) : activeNav === "profiles" ? (
            /* ========== MY PROFILES ========== */
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-extrabold text-gray-900">My Profiles</h3>
                <button onClick={() => setActiveNav("create")} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-sm rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md cursor-pointer border-none">
                  <Plus className="w-4 h-4" /> New Profile
                </button>
              </div>
              <div className="bg-white border border-gray-200/60 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200/60">
                        {["Profile", "Category", "Status", "City", "Actions"].map((h) => (
                          <th key={h} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200/60">
                      {profiles.length === 0 ? (
                        <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500">No profiles yet</td></tr>
                      ) : profiles.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {p.logo_url ? (
                                <img src={p.logo_url} alt="" className="w-10 h-10 rounded-xl object-cover shadow-md" />
                              ) : (
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-md">
                                  {p.business_name?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <span className="text-sm font-bold text-gray-900">{p.business_name}</span>
                                <p className="text-xs text-gray-500">/{p.slug}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-lg font-medium">{typeof p.category === "string" ? p.category : p.category?.name || "N/A"}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${p.is_verified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                              {p.is_verified ? <ShieldCheck className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                              {p.is_verified ? "Verified" : "Pending"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">{p.city || "—"}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Link to={`/customer/form?edit=${p.id}`} className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors"><Pencil className="w-4 h-4" /></Link>
                              <Link to={`/enduser/business/${p.slug}`} target="_blank" className="p-1.5 text-gray-400 hover:text-emerald-500 transition-colors"><Eye className="w-4 h-4" /></Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeNav === "create" ? (
            /* ========== CREATE PROFILE ========== */
            <div className="max-w-3xl mx-auto">
              <div className="bg-white border border-gray-200/60 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-gray-200/60 bg-gradient-to-r from-blue-500 to-indigo-600">
                  <h3 className="text-lg font-bold text-white">Create New Business Profile</h3>
                  <p className="text-sm text-blue-100">Fill in the details below to create your business profile</p>
                </div>
                <div className="p-6 space-y-6">
                  {createMessage && (
                    <div className={`p-4 rounded-xl text-sm flex items-center gap-2 ${
                      createMessage.includes("success")
                        ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                        : "bg-red-50 border border-red-200 text-red-700"
                    }`}>
                      {createMessage.includes("success") ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                      {createMessage}
                    </div>
                  )}

                  {/* Basic Info */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-3">Basic Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-xs font-bold text-gray-700 mb-1">Business Name *</label>
                        <input type="text" value={createForm.business_name} onChange={(e) => setCreateForm({ ...createForm, business_name: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900" placeholder="Enter business name" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Profile Type *</label>
                        <select value={createForm.profile_type} onChange={(e) => setCreateForm({ ...createForm, profile_type: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900">
                          <option value="COMPANY">Company</option>
                          <option value="INDIVIDUAL">Individual</option>
                          <option value="MSME">MSME</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Category *</label>
                        <select value={createForm.category_id} onChange={(e) => { setCreateForm({ ...createForm, category_id: e.target.value, subcategory_id: "" }); loadSubcategories(e.target.value); }} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900">
                          <option value="">Select category</option>
                          {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                        </select>
                      </div>
                      {subcategories.length > 0 && (
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">Subcategory</label>
                          <select value={createForm.subcategory_id} onChange={(e) => setCreateForm({ ...createForm, subcategory_id: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900">
                            <option value="">Select subcategory</option>
                            {subcategories.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
                          </select>
                        </div>
                      )}
                      <div className="col-span-2">
                        <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
                        <textarea rows="3" value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 resize-none" placeholder="Describe your business" />
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-3">Contact Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Phone</label>
                        <input type="text" value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900" placeholder="Phone number" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Email</label>
                        <input type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900" placeholder="Business email" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-bold text-gray-700 mb-1">Website</label>
                        <input type="url" value={createForm.website} onChange={(e) => setCreateForm({ ...createForm, website: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900" placeholder="https://..." />
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-3">Location</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-xs font-bold text-gray-700 mb-1">Address</label>
                        <input type="text" value={createForm.address} onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900" placeholder="Street address" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">City</label>
                        <input type="text" value={createForm.city} onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900" placeholder="City" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">State</label>
                        <input type="text" value={createForm.state} onChange={(e) => setCreateForm({ ...createForm, state: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900" placeholder="State" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Country</label>
                        <input type="text" value={createForm.country} onChange={(e) => setCreateForm({ ...createForm, country: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900" placeholder="Country" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Pincode</label>
                        <input type="text" value={createForm.pincode} onChange={(e) => setCreateForm({ ...createForm, pincode: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900" placeholder="Pincode" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Latitude</label>
                        <input type="number" step="any" value={createForm.latitude} onChange={(e) => setCreateForm({ ...createForm, latitude: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900" placeholder="Latitude" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Longitude</label>
                        <input type="number" step="any" value={createForm.longitude} onChange={(e) => setCreateForm({ ...createForm, longitude: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900" placeholder="Longitude" />
                      </div>
                    </div>
                  </div>

                  {/* Type-specific Details */}
                  {createForm.profile_type === "COMPANY" && (
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 mb-3">Company Details</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">Registration Number</label>
                          <input type="text" value={createForm.company_detail.company_registration_number} onChange={(e) => setCreateForm({ ...createForm, company_detail: { ...createForm.company_detail, company_registration_number: e.target.value } })} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900" placeholder="Registration number" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">Legal Name</label>
                          <input type="text" value={createForm.company_detail.legal_name} onChange={(e) => setCreateForm({ ...createForm, company_detail: { ...createForm.company_detail, legal_name: e.target.value } })} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900" placeholder="Legal name" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">Company Type</label>
                          <input type="text" value={createForm.company_detail.company_type} onChange={(e) => setCreateForm({ ...createForm, company_detail: { ...createForm.company_detail, company_type: e.target.value } })} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900" placeholder="e.g. Pvt Ltd" />
                        </div>
                      </div>
                    </div>
                  )}

                  {createForm.profile_type === "INDIVIDUAL" && (
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 mb-3">Individual Details</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">Professional Name</label>
                          <input type="text" value={createForm.individual_detail.professional_name} onChange={(e) => setCreateForm({ ...createForm, individual_detail: { ...createForm.individual_detail, professional_name: e.target.value } })} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900" placeholder="Professional name" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">Profession</label>
                          <input type="text" value={createForm.individual_detail.profession} onChange={(e) => setCreateForm({ ...createForm, individual_detail: { ...createForm.individual_detail, profession: e.target.value } })} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900" placeholder="Profession" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">Experience (years)</label>
                          <input type="number" value={createForm.individual_detail.experience_years} onChange={(e) => setCreateForm({ ...createForm, individual_detail: { ...createForm.individual_detail, experience_years: e.target.value } })} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900" placeholder="Years" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">Services</label>
                          <input type="text" value={createForm.individual_detail.services} onChange={(e) => setCreateForm({ ...createForm, individual_detail: { ...createForm.individual_detail, services: e.target.value } })} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900" placeholder="Services offered" />
                        </div>
                      </div>
                    </div>
                  )}

                  {createForm.profile_type === "MSME" && (
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 mb-3">MSME Details</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">MSME Number</label>
                          <input type="text" value={createForm.msme_detail.msme_number} onChange={(e) => setCreateForm({ ...createForm, msme_detail: { ...createForm.msme_detail, msme_number: e.target.value } })} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900" placeholder="MSME number" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">Business Type</label>
                          <input type="text" value={createForm.msme_detail.business_type} onChange={(e) => setCreateForm({ ...createForm, msme_detail: { ...createForm.msme_detail, business_type: e.target.value } })} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900" placeholder="Business type" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">Industry</label>
                          <input type="text" value={createForm.msme_detail.industry} onChange={(e) => setCreateForm({ ...createForm, msme_detail: { ...createForm.msme_detail, industry: e.target.value } })} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900" placeholder="Industry" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-4">
                    <button
                      onClick={handleCreateProfile}
                      disabled={!createForm.business_name.trim() || !createForm.category_id || createSaving}
                      className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer border-none"
                    >
                      {createSaving ? "Creating..." : "Create Profile"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : activeNav === "search" ? (
            /* ========== SEARCH ========== */
            <div>
              <div className="max-w-3xl mx-auto mb-8">
                <div className="bg-white rounded-2xl shadow-xl shadow-black/5 border border-gray-100 p-2">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input type="text" placeholder="Search businesses by name, category, or location..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900" />
                    </div>
                    <button onClick={handleSearch} disabled={searchLoading} className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25 cursor-pointer border-none">
                      {searchLoading ? "Searching..." : "Search"}
                    </button>
                  </div>
                </div>
              </div>

              {searchResults.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchResults.map((biz) => (
                    <Link key={biz.id} to={`/enduser/business/${biz.slug}`} target="_blank" className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-lg transition-all duration-300 no-underline">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                          {biz.logo_url ? <img src={biz.logo_url} alt="" className="w-10 h-10 rounded-xl object-cover" /> : <Store className="w-5 h-5 text-blue-500" />}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-gray-900">{biz.business_name}</h4>
                          <p className="text-xs text-gray-500">{biz.category?.name || "Business"}</p>
                        </div>
                      </div>
                      {biz.city && <p className="text-xs text-gray-400 flex items-center gap-1"><MapPin className="w-3 h-3" /> {biz.city}</p>}
                    </Link>
                  ))}
                </div>
              )}
              {searchQuery && !searchLoading && searchResults.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Search className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No results found</p>
                </div>
              )}
            </div>
          ) : activeNav === "nearme" ? (
            /* ========== NEAR ME ========== */
            <div>
              <div className="max-w-3xl mx-auto mb-8">
                <div className="bg-white rounded-2xl shadow-xl shadow-black/5 border border-gray-100 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <Navigation className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">Find Businesses Near You</h3>
                      <p className="text-xs text-gray-500">Uses your browser's geolocation to find nearby businesses</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-gray-700 mb-1">Search Radius (km)</label>
                      <select value={nearbyRadius} onChange={(e) => setNearbyRadius(Number(e.target.value))} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900">
                        <option value={5}>5 km</option>
                        <option value={10}>10 km</option>
                        <option value={25}>25 km</option>
                        <option value={50}>50 km</option>
                        <option value={100}>100 km</option>
                      </select>
                    </div>
                    <button onClick={handleNearMe} disabled={nearbyLoading} className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25 cursor-pointer border-none flex items-center gap-2 mt-5">
                      {nearbyLoading ? <Loader className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                      {nearbyLoading ? "Searching..." : "Find Near Me"}
                    </button>
                  </div>
                </div>
              </div>

              {nearbyError && (
                <div className="max-w-3xl mx-auto mb-6">
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    {nearbyError}
                  </div>
                </div>
              )}

              {nearbyResults.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Nearby Businesses ({nearbyResults.length})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {nearbyResults.map((biz) => (
                      <Link key={biz.id} to={`/enduser/business/${biz.slug}`} target="_blank" className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-lg transition-all duration-300 no-underline">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                            {biz.logo_url ? <img src={biz.logo_url} alt="" className="w-10 h-10 rounded-xl object-cover" /> : <Store className="w-5 h-5 text-blue-500" />}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-bold text-gray-900">{biz.business_name}</h4>
                            <p className="text-xs text-gray-500">{biz.category?.name || "Business"}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400 flex items-center gap-1"><MapPin className="w-3 h-3" /> {biz.city || "—"}</span>
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{biz.distance_km?.toFixed(1)} km</span>
                        </div>
                        {biz.is_verified && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold mt-2">
                            <ShieldCheck className="w-3 h-3" /> Verified
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : activeNav === "documents" ? (
            /* ========== DOCUMENTS ========== */
            <div>
              <h3 className="text-xl font-extrabold text-gray-900 mb-6">Documents</h3>
              <div className="bg-white border border-gray-200/60 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200/60">
                        {["Document", "Type", "Profile", "Status", "Uploaded"].map((h) => (
                          <th key={h} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200/60">
                      {documents.length === 0 ? (
                        <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                          <FileText className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                          <p className="font-medium">No documents uploaded</p>
                        </td></tr>
                      ) : documents.map((doc) => (
                        <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center"><FileText className="w-5 h-5 text-violet-500" /></div>
                              <span className="text-sm font-bold text-gray-900">{doc.file_name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4"><span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg font-medium">{doc.document_type}</span></td>
                          <td className="px-6 py-4 text-sm text-gray-700">Profile #{doc.profile_id}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${doc.verification_status === "APPROVED" ? "bg-emerald-100 text-emerald-700" : doc.verification_status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                              {doc.verification_status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">{new Date(doc.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeNav === "settings" ? (
            /* ========== SETTINGS ========== */
            <div className="max-w-2xl mx-auto">
              <h3 className="text-xl font-extrabold text-gray-900 mb-6">Settings</h3>
              <div className="bg-white border border-gray-200/60 rounded-2xl p-6 space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-2">Account</h4>
                  <p className="text-sm text-gray-500">Manage your account settings and preferences.</p>
                </div>
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-sm font-bold text-gray-900 mb-2">Danger Zone</h4>
                  <button onClick={handleLogout} className="px-4 py-2 bg-red-50 text-red-600 font-bold text-sm rounded-xl hover:bg-red-100 transition-colors cursor-pointer border-none">
                    Logout
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64"><p className="text-gray-400">Page coming soon</p></div>
          )}
        </div>
      </main>
    </div>
  );
}
