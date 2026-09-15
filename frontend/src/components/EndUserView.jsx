import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ChevronDown, Menu, X, LogOut, Camera, Trash2, ShieldCheck, Info,
  PenSquare, Phone, Home, Briefcase, User, Grid3X3, MapPin, Star,
  PhoneCall, MessageCircle, Tag, ArrowRight, Building2, Eye, Smartphone,
  Globe, Zap, ShoppingBag, BookOpen, Tag as TagIcon, Mail, Clock,
  CheckCircle2, Navigation, Loader,
} from "lucide-react";
import { searchProfiles, getCategories, getPopularCategories, updateProfile, uploadProfilePic, removeProfilePic, getNearbyProfiles } from "../api";
import SearchableSelect from "./SearchableSelect";
import { COUNTRIES, getStatesForCountry, getCitiesForState } from "./locationData";
import {
  HomeSection, AboutSection, BusinessSection, BlogsSection,
  ContactSection, GlobalCTASection, BlogModal,
} from "./sharedSections";
import { BLOGS } from "./sharedViewData";

const ICON_MAP = {
  Smartphone, Globe, Zap, ShieldCheck, MapPin, Star, Tag, BookOpen,
  Phone, Mail, Clock, Eye, CheckCircle2, User, ShoppingBag, Briefcase,
  Home, PenSquare, Info, PhoneCall, MessageCircle, Building2, ArrowRight,
};

const NAV_LINKS = [
  { id: "home", label: "Home", icon: Home },
  { id: "about", label: "About", icon: Info },
  { id: "business", label: "Business", icon: Briefcase },
  { id: "nearme", label: "Near Me", icon: MapPin },
  { id: "blogs", label: "Blogs", icon: PenSquare },
  { id: "contact", label: "Contact Us", icon: Phone },
];

export default function EndUserView() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("home");
  const [user, setUser] = useState(null);
  const [showAuthMenu, setShowAuthMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryBusinesses, setCategoryBusinesses] = useState([]);
  const [categoryBusinessesLoading, setCategoryBusinessesLoading] = useState(false);
  const [categoriesList, setCategoriesList] = useState([]);
  const [popularCategories, setPopularCategories] = useState([]);
  const [showAllCategories, setShowAllCategories] = useState(false);

  // Near Me states
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyResults, setNearbyResults] = useState([]);
  const [nearbyError, setNearbyError] = useState("");
  const [nearbyRadius, setNearbyRadius] = useState(10);

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

  const roleName = user ? (typeof user.role === "string" ? user.role : user.role?.name) : null;
  const displayRole = roleName === "ENDUSER" ? "USER" : roleName === "ADMIN" ? "ADMIN" : roleName === "CUSTOMER" ? "CUSTOMER" : "";

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
        setProfilePic(localStorage.getItem("enduser_avatar") || null);
      } catch { setUser(null); }
    }
  }, []);

  useEffect(() => {
    const loadCategories = async () => {
      try { const result = await getCategories(); setCategoriesList(result || []); } catch {}
    };
    loadCategories();
    const loadPopularCategories = async () => {
      try { const result = await getPopularCategories(); setPopularCategories(result || []); } catch {}
    };
    loadPopularCategories();
  }, []);

  useEffect(() => {
    const hash = window.location.hash.replace("#section-", "");
    if (hash) {
      setTimeout(() => {
        const el = document.getElementById(`section-${hash}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, []);

  const handleCategoryClick = async (cat) => {
    setSelectedCategory(cat);
    setCategoryModalOpen(true);
    setCategoryBusinessesLoading(true);
    try {
      const catObj = categoriesList.find((c) => c.name === cat.name);
      if (catObj) {
        const result = await searchProfiles({ category_id: catObj.id, page_size: 4 });
        setCategoryBusinesses(result.items || []);
      } else { setCategoryBusinesses([]); }
    } catch { setCategoryBusinesses([]); } finally { setCategoryBusinessesLoading(false); }
  };

  const handleUploadPic = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setProfileMessage("File size must be less than 5MB"); return; }
    setUploadingPic(true);
    setProfileMessage("");
    try {
      const result = await uploadProfilePic(file);
      const picUrl = result.profile_pic || result.url || result.image_url;
      if (picUrl) { localStorage.setItem("enduser_avatar", picUrl); setProfilePic(picUrl); }
      else {
        const reader = new FileReader();
        reader.onloadend = () => { setProfilePic(reader.result); localStorage.setItem("enduser_avatar", reader.result); };
        reader.readAsDataURL(file);
      }
      setProfileMessage("Profile picture updated successfully!");
      setTimeout(() => setProfileMessage(""), 3000);
    } catch (err) { setProfileMessage(err.message || "Failed to upload picture"); } finally { setUploadingPic(false); }
  };

  const handleSaveProfile = async () => {
    if (!profileName.trim()) { setProfileMessage("Full name is required"); return; }
    setSavingProfile(true);
    setProfileMessage("");
    try {
      const result = await updateProfile({ full_name: profileName, city: profileCity || null, state: profileState || null, country: profileCountry || null });
      const updatedUser = { ...user, ...result };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setActiveSection("home");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) { setProfileMessage(err.message || "Failed to update profile"); } finally { setSavingProfile(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setShowProfileMenu(false);
    navigate("/");
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

  const scrollToSection = (id) => {
    setActiveSection(id);
    setShowMobileMenu(false);
    const el = document.getElementById(`section-${id}`);
    if (el) { el.scrollIntoView({ behavior: "smooth", block: "start" }); }
    else { window.scrollTo({ top: 0, behavior: "smooth" }); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar */}
      <div className="bg-white border-b border-gray-200/60 px-4 sm:px-6 py-3 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 no-underline">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Grid3X3 className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent tracking-tight hidden sm:inline">BizzProfiles</span>
            <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded hidden sm:inline">END USER</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 bg-gray-100/60 rounded-2xl p-1.5">
            {NAV_LINKS.map((link) => {
              const Icon = link.icon;
              const active = activeSection === link.id;
              return (
                <button key={link.id} onClick={() => scrollToSection(link.id)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer border-none whitespace-nowrap ${active ? "bg-white text-blue-600 shadow-md shadow-blue-500/10" : "text-gray-500 hover:text-gray-900 hover:bg-white/50"}`}>
                  <Icon className="w-4 h-4" />
                  <span className="hidden lg:inline">{link.label}</span>
                </button>
              );
            })}
          </nav>

          <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="md:hidden flex items-center justify-center w-10 h-10 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer border-none">
            {showMobileMenu ? <X className="w-5 h-5 text-gray-700" /> : <Menu className="w-5 h-5 text-gray-700" />}
          </button>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all cursor-pointer border-none">
                  {localStorage.getItem("enduser_avatar") ? (
                    <img src={localStorage.getItem("enduser_avatar")} alt="" className="w-8 h-8 rounded-lg object-cover" />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                      {user.full_name ? user.full_name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() : "U"}
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-700 hidden sm:inline">{user.full_name}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showProfileMenu ? "rotate-180" : ""}`} />
                </button>
                {showProfileMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                      <div className="p-3 border-b border-gray-100">
                        <p className="text-sm font-bold text-gray-900">{user.full_name}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">{displayRole || "USER"}<span className="inline-flex items-center px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[9px] font-bold">END USER</span></p>
                      </div>
                      <div className="p-2">
                        <button onClick={() => { setActiveSection("profile"); setShowProfileMenu(false); }} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-amber-50 transition-colors cursor-pointer border-none bg-transparent text-left"><User className="w-4 h-4 text-amber-600" /><span className="text-sm font-medium text-gray-700">Edit Profile</span></button>
                        <label className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-blue-50 transition-colors cursor-pointer text-left"><Camera className="w-4 h-4 text-blue-500" /><span className="text-sm font-medium text-blue-600">Change Photo</span><input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => { localStorage.setItem("enduser_avatar", reader.result); window.location.reload(); }; reader.readAsDataURL(file); } }} /></label>
                        {localStorage.getItem("enduser_avatar") && <button onClick={async () => { try { await removeProfilePic(); localStorage.removeItem("enduser_avatar"); setProfilePic(null); } catch(e) { console.error(e); } }} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-red-50 transition-colors cursor-pointer border-none bg-transparent text-left"><Trash2 className="w-4 h-4 text-red-500" /><span className="text-sm font-medium text-red-600">Remove Photo</span></button>}
                        <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-red-50 transition-colors cursor-pointer border-none bg-transparent text-left"><LogOut className="w-4 h-4 text-red-500" /><span className="text-sm font-medium text-red-600">Logout</span></button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="relative">
                <button onClick={() => setShowAuthMenu(!showAuthMenu)} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white font-bold text-sm rounded-xl hover:from-blue-700 hover:via-indigo-700 hover:to-violet-700 transition-all shadow-lg shadow-blue-500/25 cursor-pointer border-none">
                  Login / Register<ChevronDown className={`w-4 h-4 transition-transform ${showAuthMenu ? "rotate-180" : ""}`} />
                </button>
                {showAuthMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowAuthMenu(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                      <div className="p-3 border-b border-gray-100"><p className="text-sm font-bold text-gray-900">Choose your role</p></div>
                      <div className="p-2">
                        <Link to="/auth/admin" onClick={() => setShowAuthMenu(false)} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors no-underline"><div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md"><ShieldCheck className="w-5 h-5 text-white" /></div><span className="text-sm font-bold text-gray-900">Join as Admin</span></Link>
                        <Link to="/auth/customer" onClick={() => setShowAuthMenu(false)} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors no-underline"><div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md"><User className="w-5 h-5 text-white" /></div><span className="text-sm font-bold text-gray-900">Join as Customer</span></Link>
                        <Link to="/auth/enduser" onClick={() => setShowAuthMenu(false)} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors no-underline"><div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md"><Info className="w-5 h-5 text-white" /></div><span className="text-sm font-bold text-gray-900">Join as End User</span></Link>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {showMobileMenu && (
          <div className="md:hidden mt-3 pb-2 border-t border-gray-100 pt-3">
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => {
                const Icon = link.icon;
                const active = activeSection === link.id;
                return <button key={link.id} onClick={() => scrollToSection(link.id)} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer border-none text-left ${active ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}><Icon className="w-5 h-5" />{link.label}</button>;
              })}
            </nav>
            <div className="mt-3 pt-3 border-t border-gray-100">
              {user ? <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 cursor-pointer border-none bg-transparent text-left"><LogOut className="w-5 h-5" /> Logout</button> : <Link to="/auth/enduser" onClick={() => setShowMobileMenu(false)} className="px-4 py-3 bg-blue-600 text-white text-center font-bold rounded-xl no-underline block">Login / Register</Link>}
            </div>
          </div>
        )}
      </div>

      {/* Profile Section */}
      {user && activeSection === "profile" && (
        <div id="section-profile" className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-white border border-gray-200/60 rounded-3xl overflow-hidden shadow-lg">
            <div className="p-6 border-b border-gray-200/60 bg-gradient-to-r from-amber-500 to-orange-600">
              <div className="flex items-center justify-between">
                <div><h3 className="text-lg font-bold text-white">Edit Profile</h3><p className="text-sm text-amber-100">Update your personal information</p></div>
                <button onClick={() => { setActiveSection("home"); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-xl transition-colors cursor-pointer border-none">← Back</button>
              </div>
            </div>
            <div className="p-6 space-y-5">
              {profileMessage && <div className={`p-3 rounded-xl text-sm text-center ${profileMessage.includes("success") ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-red-50 border border-red-200 text-red-700"}`}>{profileMessage}</div>}
              <div className="flex items-center gap-6 pb-5 border-b border-gray-200">
                <div className="relative">
                  {profilePic ? <img src={profilePic} alt="Profile" className="w-24 h-24 rounded-2xl object-cover shadow-lg" /> : <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-lg">{profileName ? profileName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() : "U"}</div>}
                  {uploadingPic && <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 mb-1">Profile Picture</p>
                  <p className="text-xs text-gray-500 mb-1">JPG, PNG or WebP. Max 5MB.</p>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold mb-3">END USER PORTAL</span>
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white text-sm font-bold rounded-xl hover:bg-amber-600 transition-colors cursor-pointer"><Camera className="w-4 h-4" />{uploadingPic ? "Uploading..." : "Upload Picture"}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleUploadPic} className="hidden" disabled={uploadingPic} /></label>
                    {profilePic && <button onClick={async () => { try { await removeProfilePic(); setProfilePic(null); localStorage.removeItem("enduser_avatar"); } catch(e) { console.error(e); } }} className="px-3 py-2 bg-red-50 text-red-600 text-sm font-bold rounded-xl hover:bg-red-100 transition-colors cursor-pointer border-none">Remove</button>}
                  </div>
                </div>
              </div>
              <div><label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label><input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-gray-900" placeholder="Enter your full name" /></div>
              <div className="grid grid-cols-3 gap-4">
                <SearchableSelect label="Country" value={profileCountry} onChange={(val) => { setProfileCountry(val); setProfileState(""); setProfileCity(""); }} options={COUNTRIES} placeholder="Select country" />
                <SearchableSelect label="State" value={profileState} onChange={(val) => { setProfileState(val); setProfileCity(""); }} options={getStatesForCountry(profileCountry)} placeholder="Select state" />
                <SearchableSelect label="City" value={profileCity} onChange={setProfileCity} options={getCitiesForState(profileState)} placeholder="Select city" />
              </div>
              <div className="flex justify-end pt-4"><button onClick={handleSaveProfile} disabled={!profileName.trim() || savingProfile} className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-xl hover:from-amber-600 hover:to-orange-700 transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer border-none">{savingProfile ? "Saving..." : "Save Changes"}</button></div>
            </div>
          </div>
        </div>
      )}

      {/* Shared Sections */}
      <HomeSection />
      <AboutSection />

      {/* Near Me Section */}
      {activeSection === "nearme" && (
        <div id="section-nearme" className="py-16 px-4 bg-gradient-to-br from-gray-50 via-white to-emerald-50/30">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <span className="inline-block bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full mb-4">Location Based</span>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Businesses Near You</h2>
              <p className="text-gray-500 text-lg">Find verified businesses in your area using your live location</p>
            </div>

            <div className="bg-white border border-gray-200/60 rounded-3xl p-6 shadow-lg mb-8">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
                    <Navigation className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Search Radius</p>
                    <p className="text-xs text-gray-500">Adjust how far to search from your location</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={nearbyRadius}
                    onChange={(e) => setNearbyRadius(Number(e.target.value))}
                    className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value={5}>5 km</option>
                    <option value={10}>10 km</option>
                    <option value={25}>25 km</option>
                    <option value={50}>50 km</option>
                    <option value={100}>100 km</option>
                  </select>
                  <button
                    onClick={handleNearMe}
                    disabled={nearbyLoading}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25 cursor-pointer border-none disabled:opacity-50 flex items-center gap-2"
                  >
                    {nearbyLoading ? (
                      <><Loader className="w-4 h-4 animate-spin" /> Searching...</>
                    ) : (
                      <><MapPin className="w-4 h-4" /> Find Nearby</>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {nearbyError && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-center">
                <p className="text-amber-700 text-sm font-medium">{nearbyError}</p>
              </div>
            )}

            {nearbyResults.length > 0 && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {nearbyResults.map((biz) => (
                  <Link
                    key={biz.id}
                    to={`/enduser/business/${biz.slug}`}
                    className="bg-white border border-gray-200/60 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 no-underline group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-lg group-hover:scale-110 transition-transform">
                        {biz.business_name?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "BZ"}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {biz.is_verified && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold">
                            <ShieldCheck className="w-3 h-3" /> Verified
                          </span>
                        )}
                        {biz.distance_km !== undefined && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold">
                            <MapPin className="w-3 h-3" /> {biz.distance_km.toFixed(1)} km
                          </span>
                        )}
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">{biz.business_name}</h3>
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">{biz.description || "No description available"}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      {biz.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{biz.city}</span>}
                      {biz.category?.name && <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{biz.category.name}</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                      {biz.phone && (
                        <a href={`tel:${biz.phone}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 text-xs font-medium rounded-lg hover:bg-emerald-100 transition-colors no-underline">
                          <Phone className="w-3 h-3" /> Call
                        </a>
                      )}
                      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-medium rounded-lg">
                        <Eye className="w-3 h-3" /> View Details
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {!nearbyLoading && !nearbyError && nearbyResults.length === 0 && (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <MapPin className="w-10 h-10 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Find Businesses Near You</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">Click "Find Nearby" to discover verified businesses in your area using your live location.</p>
                <button onClick={handleNearMe} className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25 cursor-pointer border-none">
                  Enable Location & Search
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <BusinessSection />
      <BlogsSection selectedBlog={selectedBlog} setSelectedBlog={setSelectedBlog} />
      <ContactSection />
      <GlobalCTASection />

      {/* Category Detail Modal */}
      {categoryModalOpen && selectedCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50" onClick={() => setCategoryModalOpen(false)}>
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl shadow-2xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="relative bg-gradient-to-r from-violet-500 to-purple-600 p-6">
              <button onClick={() => setCategoryModalOpen(false)} className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer border-none"><X className="w-4 h-4 text-white" /></button>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                  {selectedCategory.logo_url ? <img src={selectedCategory.logo_url} alt="" className="w-7 h-7 object-contain" /> : (() => { const Icon = ICON_MAP[selectedCategory.icon] || Tag; return <Icon className="w-7 h-7 text-white" />; })()}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedCategory.name}</h3>
                  <span className="inline-flex items-center gap-1 text-sm text-white/80"><ShieldCheck className="w-3.5 h-3.5" />{categoryBusinesses.length > 0 ? `${categoryBusinesses.length}+ Verified Profiles` : "Verified Profiles"}</span>
                </div>
              </div>
            </div>
            <div className="p-6 border-b border-gray-100"><p className="text-gray-600 leading-relaxed">{selectedCategory.description || "Browse businesses in this category."}</p></div>
            {selectedCategory.subServices && selectedCategory.subServices.length > 0 && (
              <div className="p-6 border-b border-gray-100">
                <h4 className="text-sm font-bold text-gray-900 mb-3">Popular Sub-Services</h4>
                <div className="flex flex-wrap gap-2">{selectedCategory.subServices.map((svc) => <span key={svc} className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-full hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer">{svc}</span>)}</div>
              </div>
            )}
            <div className="p-6 border-b border-gray-100">
              <h4 className="text-sm font-bold text-gray-900 mb-4">Top Listed Businesses</h4>
              {categoryBusinessesLoading ? (
                <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl animate-pulse"><div className="w-10 h-10 bg-gray-200 rounded-xl" /><div className="flex-1"><div className="h-3 bg-gray-200 rounded w-1/2 mb-1" /><div className="h-2 bg-gray-200 rounded w-1/3" /></div></div>)}</div>
              ) : categoryBusinesses.length > 0 ? (
                <div className="space-y-3">{categoryBusinesses.map((biz) => (
                  <Link key={biz.id} to={`/enduser/business/${biz.slug}`} onClick={() => setCategoryModalOpen(false)} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors no-underline">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-md flex-shrink-0">{biz.business_name?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "BZ"}</div>
                    <div className="flex-1 min-w-0"><div className="flex items-center gap-1.5"><span className="text-sm font-bold text-gray-900 truncate">{biz.business_name}</span>{biz.is_verified && <ShieldCheck className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />}</div><div className="flex items-center gap-1 text-xs text-gray-500"><MapPin className="w-3 h-3" /><span className="truncate">{biz.city || "Location"}</span></div></div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {biz.phone && <a href={`tel:${biz.phone}`} onClick={(e) => e.stopPropagation()} className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center hover:bg-emerald-200 transition-colors"><PhoneCall className="w-3.5 h-3.5 text-emerald-600" /></a>}
                      {biz.phone && <a href={`https://wa.me/${biz.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center hover:bg-green-200 transition-colors"><MessageCircle className="w-3.5 h-3.5 text-green-600" /></a>}
                    </div>
                  </Link>
                ))}</div>
              ) : <div className="text-center py-6 text-gray-400"><Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" /><p className="text-sm">No businesses listed yet in this category</p></div>}
            </div>
            <div className="p-6">
              <button onClick={() => { setCategoryModalOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="w-full py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold rounded-xl hover:opacity-90 transition-all cursor-pointer border-none flex items-center justify-center gap-2">Explore All {selectedCategory.name} Businesses <ArrowRight className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      )}

      <BlogModal selectedBlog={selectedBlog} setSelectedBlog={setSelectedBlog} />
    </div>
  );
}
