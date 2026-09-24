import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { updateProfile, uploadProfilePic, removeProfilePic, adminListBusinesses, adminToggleFeatured, adminCreateFeaturedBusiness, adminUpdateFeaturedBusiness, adminDeleteFeaturedBusiness, getCategories } from "../api";
import SearchableSelect from "./SearchableSelect";
import CategoryManagement from "./CategoryManagement";
import SubcategoryManagement from "./SubcategoryManagement";
import BannerManagement from "./BannerManagement";
import BestSellerManagement from "./BestSellerManagement";
import AdminEnquiries from "./AdminEnquiries";
import TrendingCategoryManagement from "./TrendingCategoryManagement";
import TrendingProductManagement from "./TrendingProductManagement";
import TrendingVideoManagement from "./TrendingVideoManagement";
import AdminServiceManagement from "./AdminServiceManagement";
import { COUNTRIES, getStatesForCountry, getCitiesForState } from "./locationData";
import ImageCropModal from "./ImageCropModal";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  UserX,
  Building2,
  FolderTree,
  FolderOpen,
  FileText,
  ShieldCheck,
  Settings,
  LogOut,
  Bell,
  ChevronDown,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  UserCircle,
  Star,
  ArrowUpDown,
  Plus,
  ExternalLink,
  X,
  Image,
  Play,
  Briefcase,
  Pencil,
  Trash2,
  MessageSquare,
} from "lucide-react";

const NAV = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { id: "users", icon: Users, label: "Users" },
  { id: "customers", icon: UserCheck, label: "Customers" },
  { id: "endusers", icon: UserX, label: "EndUsers" },
  { id: "categories", icon: FolderTree, label: "Categories" },
  { id: "subcategories", icon: FolderOpen, label: "Subcategories" },
  { id: "businesses", icon: Building2, label: "Businesses" },
  { id: "featured", icon: Star, label: "Featured" },
  { id: "banners", icon: Image, label: "Banners" },
  { id: "trending-videos", icon: Play, label: "Trending Videos" },
  { id: "services", icon: Briefcase, label: "Services" },
  { id: "best-sellers", icon: Star, label: "Best Sellers" },
  { id: "enquiries", icon: MessageSquare, label: "Enquiries" },
  { id: "trending-products", icon: TrendingUp, label: "Trending Products" },
  { id: "trending-categories", icon: TrendingUp, label: "Trending Categories" },
  { id: "documents", icon: FileText, label: "Documents" },
  { id: "verification", icon: ShieldCheck, label: "Verification" },
];

const BOTTOM_NAV = [
  { id: "settings", icon: Settings, label: "Settings" },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { section } = useParams();
  const activeNav = section || "dashboard";
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const [profileName, setProfileName] = useState("");
  const [profileCity, setProfileCity] = useState("");
  const [profileState, setProfileState] = useState("");
  const [profileCountry, setProfileCountry] = useState("India");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profilePic, setProfilePic] = useState(() => localStorage.getItem("admin_avatar") || null);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [cropImage, setCropImage] = useState(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [customersList, setCustomersList] = useState([]);
  const [endUsersList, setEndUsersList] = useState([]);

  // Verification
  const [pendingProfiles, setPendingProfiles] = useState([]);
  const [pendingDocuments, setPendingDocuments] = useState([]);
  const [verifyingProfile, setVerifyingProfile] = useState(null);
  const [verifyingDoc, setVerifyingDoc] = useState(null);

  // Documents
  const [documentsList, setDocumentsList] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsFilter, setDocumentsFilter] = useState("ALL");

  // Featured businesses
  const [featuredList, setFeaturedList] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(false);
  const [featuredSearch, setFeaturedSearch] = useState("");
  const [featuredFilter, setFeaturedFilter] = useState("all");
  const [showCreateFeatured, setShowCreateFeatured] = useState(false);
  const [categories, setCategories] = useState([]);
  const [newFeatured, setNewFeatured] = useState({
    business_name: "",
    slug: "",
    category_id: "",
    description: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    phone: "",
    email: "",
    website: "",
    profile_type: "COMPANY",
  });
  const [createFeaturedLoading, setCreateFeaturedLoading] = useState(false);
  const [createFeaturedMsg, setCreateFeaturedMsg] = useState("");
  const [editingFeatured, setEditingFeatured] = useState(null);
  const [editFeaturedMsg, setEditFeaturedMsg] = useState("");
  const [editFeaturedLoading, setEditFeaturedLoading] = useState(false);

  // Businesses section
  const [businessList, setBusinessList] = useState([]);
  const [businessLoading, setBusinessLoading] = useState(false);
  const [businessSearch, setBusinessSearch] = useState("");
  const [showCreateBusiness, setShowCreateBusiness] = useState(false);
  const [newBusiness, setNewBusiness] = useState({
    business_name: "",
    slug: "",
    category_id: "",
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
    logo_url: "",
    cover_image_url: "",
  });
  const [createBusinessLoading, setCreateBusinessLoading] = useState(false);
  const [createBusinessMsg, setCreateBusinessMsg] = useState("");

  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const availableStates = getStatesForCountry(profileCountry);
  const availableCities = getCitiesForState(profileState);

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
        setProfilePic(localStorage.getItem("admin_avatar") || null);
      } catch {
        setUser(null);
      }
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (activeNav === "featured") {
      fetchFeaturedBusinesses();
      fetchCategoriesList();
    }
    if (activeNav === "businesses") {
      fetchBusinessList();
      fetchCategoriesList();
    }
    if (activeNav === "verification") {
      fetchVerificationData();
    }
    if (activeNav === "documents") {
      fetchDocumentsList();
    }
  }, [activeNav, featuredFilter, documentsFilter]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/auth/admin");
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      const [statsRes, activityRes, usersRes, customersRes, endUsersRes, featuredRes] = await Promise.all([
        fetch("/api/admin/dashboard/stats", { headers }),
        fetch("/api/admin/dashboard/activity?limit=10", { headers }),
        fetch("/api/admin/users?role=USER", { headers }),
        fetch("/api/admin/users?role=BUYER", { headers }),
        fetch("/api/admin/users?role=SELLER", { headers }),
        fetch("/api/admin/featured-businesses?page_size=100", { headers }),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (activityRes.ok) {
        const activityData = await activityRes.json();
        setActivities(activityData.activities || []);
      }

      const notifs = [];
      const usersData = usersRes.ok ? await usersRes.json() : [];
      const customersData = customersRes.ok ? await customersRes.json() : [];
      const endUsersData = endUsersRes.ok ? await endUsersRes.json() : [];

      setUsersList(usersData);
      setCustomersList(customersData);
      setEndUsersList(endUsersData);

      usersData.slice(0, 5).forEach((u) => {
        notifs.push({ id: `user-${u.id}`, type: "user", title: "New User Registered", name: u.full_name, email: u.email, time: u.created_at || "Recently" });
      });
      customersData.slice(0, 5).forEach((u) => {
        notifs.push({ id: `cust-${u.id}`, type: "customer", title: "New Customer Joined", name: u.full_name, email: u.email, time: u.created_at || "Recently" });
      });
      endUsersData.slice(0, 5).forEach((u) => {
        notifs.push({ id: `end-${u.id}`, type: "enduser", title: "New End User Joined", name: u.full_name, email: u.email, time: u.created_at || "Recently" });
      });
      setNotifications(notifs.slice(0, 15));

      if (featuredRes.ok) {
        const featuredData = await featuredRes.json();
        setFeaturedList(featuredData.items || []);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const fetchVerificationData = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const [profilesRes, docsRes] = await Promise.all([
        fetch("/api/admin/profiles?is_verified=false&page_size=50", { headers }),
        fetch("/api/admin/documents?verification_status=PENDING&page_size=50", { headers }),
      ]);
      if (profilesRes.ok) setPendingProfiles(await profilesRes.json());
      if (docsRes.ok) setPendingDocuments(await docsRes.json());
    } catch (err) { console.error("Failed to fetch verification data:", err); }
  };

  const fetchDocumentsList = async () => {
    setDocumentsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const statusParam = documentsFilter !== "ALL" ? `?verification_status=${documentsFilter}` : "";
      const res = await fetch(`/api/admin/documents${statusParam}&page_size=100`, { headers });
      if (res.ok) {
        const data = await res.json();
        setDocumentsList(Array.isArray(data) ? data : data.items || []);
      }
    } catch (err) { console.error("Failed to fetch documents:", err); }
    finally { setDocumentsLoading(false); }
  };

  const handleVerifyProfile = async (profileId, isVerified) => {
    setVerifyingProfile(profileId);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/profiles/${profileId}/verify`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ is_verified: isVerified }),
      });
      if (res.ok) {
        setPendingProfiles((prev) => prev.filter((p) => p.id !== profileId));
        fetchDashboardData();
      }
    } catch (err) { console.error("Failed to verify profile:", err); }
    finally { setVerifyingProfile(null); }
  };

  const handleVerifyDocument = async (docId, status, reason = null) => {
    setVerifyingDoc(docId);
    try {
      const token = localStorage.getItem("token");
      const body = { status };
      if (reason) body.rejection_reason = reason;
      const res = await fetch(`/api/admin/documents/${docId}/verify`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setPendingDocuments((prev) => prev.filter((d) => d.id !== docId));
      }
    } catch (err) { console.error("Failed to verify document:", err); }
    finally { setVerifyingDoc(null); }
  };

  const handleToggleUserActive = async (userId, isActive) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/users/${userId}/active`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: isActive }),
      });
      if (res.ok) {
        fetchDashboardData();
      }
    } catch (err) { console.error("Failed to toggle user status:", err); }
  };

  const fetchFeaturedBusinesses = async () => {
    setFeaturedLoading(true);
    try {
      const filter = featuredFilter === "all" ? undefined : featuredFilter === "featured";
      const result = await adminListBusinesses({
        search: featuredSearch || undefined,
        is_featured: filter,
        page_size: 50,
      });
      setFeaturedList(result.items || []);
    } catch (err) {
      console.error("Failed to fetch featured businesses:", err);
    } finally {
      setFeaturedLoading(false);
    }
  };

  const fetchCategoriesList = async () => {
    try {
      const result = await getCategories();
      setCategories(result.items || result || []);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  const fetchBusinessList = async () => {
    setBusinessLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (businessSearch) params.set("q", businessSearch);
      params.set("page_size", "50");
      const res = await fetch(`/api/admin/profiles?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBusinessList(data || []);
      }
    } catch (err) {
      console.error("Failed to fetch businesses:", err);
    } finally {
      setBusinessLoading(false);
    }
  };

  const handleCreateBusiness = async () => {
    if (!newBusiness.business_name.trim() || !newBusiness.slug.trim() || !newBusiness.category_id) return;
    setCreateBusinessLoading(true);
    setCreateBusinessMsg("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/featured-businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...newBusiness,
          category_id: parseInt(newBusiness.category_id),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to create business");
      }
      setCreateBusinessMsg("Business profile created successfully! It will appear in Featured Businesses.");
      setNewBusiness({
        business_name: "", slug: "", category_id: "", profile_type: "COMPANY",
        description: "", phone: "", email: "", website: "", address: "",
        city: "", state: "", country: "India", pincode: "", logo_url: "", cover_image_url: "",
      });
      fetchBusinessList();
      fetchFeaturedBusinesses();
      setTimeout(() => { setShowCreateBusiness(false); setCreateBusinessMsg(""); }, 2000);
    } catch (err) {
      setCreateBusinessMsg(err.message || "Failed to create business");
    } finally {
      setCreateBusinessLoading(false);
    }
  };

  const handleToggleFeatured = async (businessId, currentFeatured) => {
    try {
      await adminToggleFeatured(businessId, !currentFeatured);
      setFeaturedList((prev) =>
        prev.map((b) =>
          b.id === businessId ? { ...b, is_featured: !b.is_featured } : b
        )
      );
    } catch (err) {
      console.error("Failed to toggle featured:", err);
    }
  };

  const handleUpdateOrder = async (businessId, newOrder) => {
    try {
      const item = featuredList.find((b) => b.id === businessId);
      if (item) {
        await adminToggleFeatured(businessId, item.is_featured, parseInt(newOrder) || 0);
        setFeaturedList((prev) =>
          prev.map((b) =>
            b.id === businessId ? { ...b, featured_order: parseInt(newOrder) || 0 } : b
          )
        );
      }
    } catch (err) {
      console.error("Failed to update order:", err);
    }
  };

  const handleCreateFeatured = async () => {
    if (!newFeatured.business_name.trim() || !newFeatured.slug.trim() || !newFeatured.category_id) return;
    setCreateFeaturedLoading(true);
    setCreateFeaturedMsg("");
    try {
      await adminCreateFeaturedBusiness({
        ...newFeatured,
        category_id: parseInt(newFeatured.category_id),
      });
      setCreateFeaturedMsg("Featured business created successfully!");
      setNewFeatured({
        business_name: "",
        slug: "",
        category_id: "",
        description: "",
        address: "",
        city: "",
        state: "",
        country: "India",
        phone: "",
        email: "",
        website: "",
        profile_type: "COMPANY",
      });
      fetchFeaturedBusinesses();
      setTimeout(() => { setShowCreateFeatured(false); setCreateFeaturedMsg(""); }, 1500);
    } catch (err) {
      setCreateFeaturedMsg(err.message || "Failed to create featured business");
    } finally {
      setCreateFeaturedLoading(false);
    }
  };

  const handleEditFeatured = async () => {
    if (!editingFeatured) return;
    setEditFeaturedLoading(true);
    setEditFeaturedMsg("");
    try {
      await adminUpdateFeaturedBusiness(editingFeatured.id, {
        business_name: editingFeatured.business_name,
        slug: editingFeatured.slug,
        category_id: parseInt(editingFeatured.category_id),
        description: editingFeatured.description || null,
        address: editingFeatured.address || null,
        city: editingFeatured.city || null,
        state: editingFeatured.state || null,
        country: editingFeatured.country || null,
        phone: editingFeatured.phone || null,
        email: editingFeatured.email || null,
        website: editingFeatured.website || null,
        logo_url: editingFeatured.logo_url || null,
        cover_image_url: editingFeatured.cover_image_url || null,
        profile_type: editingFeatured.profile_type || "COMPANY",
      });
      setEditFeaturedMsg("Business updated successfully!");
      fetchFeaturedBusinesses();
      setTimeout(() => { setEditingFeatured(null); setEditFeaturedMsg(""); }, 1200);
    } catch (err) {
      setEditFeaturedMsg(err.message || "Failed to update business");
    } finally {
      setEditFeaturedLoading(false);
    }
  };

  const handleDeleteFeatured = async (businessId) => {
    if (!confirm("Remove this business from featured?")) return;
    try {
      await adminDeleteFeaturedBusiness(businessId);
      setFeaturedList((prev) => prev.filter((b) => b.id !== businessId));
    } catch (err) {
      console.error("Failed to remove featured:", err);
    }
  };

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
      navigate("/admin/dashboard");
    } catch (err) {
      setProfileMessage(err.message || "Failed to update profile");
    } finally {
      setProfileSaving(false);
    }
  }, [profileName, profileCity, profileState, profileCountry, user, navigate]);

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
      localStorage.setItem("admin_avatar", result.profile_pic);
    } catch (err) {
      setProfileMessage(err.message || "Failed to upload picture");
    } finally {
      setUploadingPic(false);
    }
  }, [user]);

  const handleCropCancel = useCallback(() => {
    setCropModalOpen(false);
    setCropImage(null);
  }, []);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const statusBadge = (status) => {
    switch (status) {
      case "high":
        return "bg-emerald-100 text-emerald-700";
      case "medium":
        return "bg-sky-100 text-sky-700";
      case "low":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const metricCards = stats
    ? [
        { label: "Total Users", value: stats.totalUsers, icon: Users, color: "from-blue-500 to-indigo-600" },
        { label: "Customers", value: stats.totalCustomers, icon: UserCheck, color: "from-emerald-500 to-teal-600" },
        { label: "EndUsers", value: stats.totalEndUsers, icon: UserX, color: "from-violet-500 to-purple-600" },
        { label: "Businesses", value: stats.totalBusinesses, icon: Building2, color: "from-amber-500 to-orange-600" },
        { label: "Featured", value: stats.featuredBusinesses, icon: Star, color: "from-yellow-400 to-amber-500" },
        { label: "Verified", value: stats.verifiedBusinesses, icon: CheckCircle2, color: "from-green-500 to-emerald-600" },
        { label: "Pending", value: stats.pendingBusinesses, icon: Clock, color: "from-rose-500 to-pink-600" },
      ]
    : [];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col sticky top-0 h-screen" style={{ backgroundColor: "#0a192f" }}>
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h6 className="font-bold text-white text-sm">BizzProfiles</h6>
              <p className="text-xs text-sky-300">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigate(`/admin/${item.id}`)}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer border-none ${
                  isActive
                    ? "bg-sky-500 text-white shadow-lg shadow-sky-500/30"
                    : "text-gray-400 hover:bg-white/10 hover:text-white bg-transparent"
                }`}
              >
                <Icon className="w-5 h-5" /> {item.label}
              </button>
            );
          })}
        </nav>

        {/* Bottom Utility */}
        <div className="p-4 border-t border-white/10">
          {BOTTOM_NAV.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => navigate(`/admin/${item.id}`)}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:bg-white/10 hover:text-white transition-all cursor-pointer border-none bg-transparent mb-1"
              >
                <Icon className="w-5 h-5" /> {item.label}
              </button>
            );
          })}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all cursor-pointer border-none bg-transparent"
          >
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900 capitalize">{activeNav}</h1>
              <p className="text-xs text-gray-500">
                {user?.full_name || "Admin"}
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-sky-100 text-sky-700 rounded text-[9px] font-bold ml-1.5">ADMIN</span>
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2.5 hover:bg-gray-100 rounded-xl cursor-pointer border-none bg-transparent"
                >
                  <Bell className="w-5 h-5 text-gray-600" />
                  {notifications.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </button>
                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                      <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-gray-900">Notifications</p>
                          <p className="text-xs text-gray-500">{notifications.length} new</p>
                        </div>
                        <button
                          onClick={() => setNotifications([])}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer border-none bg-transparent"
                        >
                          Clear all
                        </button>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-gray-400">
                            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm font-medium">No new notifications</p>
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div
                              key={notif.id}
                              className="px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                              onClick={() => {
                                setShowNotifications(false);
                                if (notif.type === "user") navigate("/admin/users");
                                else if (notif.type === "customer") navigate("/admin/customers");
                                else if (notif.type === "enduser") navigate("/admin/endusers");
                              }}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                  notif.type === "user" ? "bg-blue-100" : notif.type === "customer" ? "bg-emerald-100" : "bg-amber-100"
                                }`}>
                                  {notif.type === "user" ? (
                                    <Users className="w-4 h-4 text-blue-600" />
                                  ) : notif.type === "customer" ? (
                                    <UserCheck className="w-4 h-4 text-emerald-600" />
                                  ) : (
                                    <UserX className="w-4 h-4 text-amber-600" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                                  <p className="text-xs text-gray-500 truncate">{notif.name} ({notif.email})</p>
                                  <p className="text-xs text-gray-400 mt-0.5">{notif.time}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="p-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
            </div>
          ) : activeNav === "profile" ? (
            /* Profile Section */
            <div className="max-w-2xl mx-auto">
              <div className="bg-white border border-gray-200/60 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-gray-200/60 bg-gradient-to-r from-sky-500 to-blue-600">
                  <h3 className="text-lg font-bold text-white">Edit Profile</h3>
                  <p className="text-sm text-sky-100">Update your personal information</p>
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
                        <img
                          src={profilePic}
                          alt="Profile"
                          className="w-24 h-24 rounded-2xl object-cover shadow-lg"
                        />
                      ) : (
                        <div className="w-24 h-24 bg-gradient-to-br from-sky-400 to-blue-500 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-lg">
                          {profileName
                            ? profileName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
                            : "U"}
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
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-100 text-sky-700 rounded-full text-[10px] font-bold mb-3">ADMIN PORTAL</span>
                      <div className="flex items-center gap-2">
                        <label className="inline-flex items-center gap-2 px-4 py-2 bg-sky-500 text-white text-sm font-bold rounded-xl hover:bg-sky-600 transition-colors cursor-pointer">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {uploadingPic ? "Uploading..." : "Upload Picture"}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleUploadPic}
                            className="hidden"
                            disabled={uploadingPic}
                          />
                        </label>
                        {profilePic && (
                          <button
                            onClick={async () => { try { await removeProfilePic(); setProfilePic(null); localStorage.removeItem("admin_avatar"); } catch(e) { console.error(e); } }}
                            className="px-3 py-2 bg-red-50 text-red-600 text-sm font-bold rounded-xl hover:bg-red-100 transition-colors cursor-pointer border-none"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all text-gray-900"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <SearchableSelect
                      label="Country"
                      value={profileCountry}
                      onChange={(val) => {
                        setProfileCountry(val);
                        setProfileState("");
                        setProfileCity("");
                      }}
                      options={COUNTRIES}
                      placeholder="Select country"
                    />
                    <SearchableSelect
                      label="State"
                      value={profileState}
                      onChange={(val) => {
                        setProfileState(val);
                        setProfileCity("");
                      }}
                      options={availableStates}
                      placeholder="Select state"
                    />
                    <SearchableSelect
                      label="City"
                      value={profileCity}
                      onChange={setProfileCity}
                      options={availableCities}
                      placeholder="Select city"
                    />
                  </div>
                  <div className="flex justify-end pt-4">
                    <button
                      onClick={handleSaveProfile}
                      disabled={!profileName.trim() || profileSaving}
                      className="px-8 py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold rounded-xl hover:from-sky-600 hover:to-blue-700 transition-all shadow-lg shadow-sky-500/25 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer border-none"
                    >
                      {profileSaving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : activeNav === "users" ? (
            /* Users Section */
            <div>
              <div className="bg-white border border-gray-200/60 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-gray-200/60 bg-gradient-to-r from-blue-500 to-indigo-600">
                  <h3 className="text-lg font-bold text-white">All Users</h3>
                  <p className="text-sm text-blue-100">{usersList.length} users registered</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200/60">
                        {["Name", "Email", "Mobile", "City", "Status", "Joined", "Actions"].map((h) => (
                          <th key={h} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200/60">
                      {usersList.length === 0 ? (
                        <tr><td colSpan="7" className="px-6 py-12 text-center text-gray-500">No users found</td></tr>
                      ) : (
                        usersList.map((u) => (
                          <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-md">
                                  {u.full_name?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                                </div>
                                <span className="text-sm font-bold text-gray-900">{u.full_name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700">{u.email}</td>
                            <td className="px-6 py-4 text-sm text-gray-700">{u.mobile || "-"}</td>
                            <td className="px-6 py-4 text-sm text-gray-700">{u.city || "-"}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${u.is_active ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                                {u.is_active ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">{new Date(u.created_at).toLocaleDateString()}</td>
                            <td className="px-6 py-4">
                              <button onClick={() => handleToggleUserActive(u.id, !u.is_active)}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer border-none ${u.is_active ? "bg-rose-50 text-rose-600 hover:bg-rose-100" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"}`}>
                                {u.is_active ? "Deactivate" : "Activate"}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeNav === "customers" ? (
            /* Customers Section */
            <div>
              <div className="bg-white border border-gray-200/60 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-gray-200/60 bg-gradient-to-r from-emerald-500 to-teal-600">
                  <h3 className="text-lg font-bold text-white">Customers</h3>
                  <p className="text-sm text-emerald-100">{customersList.length} customers registered</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200/60">
                        {["Name", "Email", "Mobile", "City", "State", "Status", "Joined", "Actions"].map((h) => (
                          <th key={h} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200/60">
                      {customersList.length === 0 ? (
                        <tr><td colSpan="8" className="px-6 py-12 text-center text-gray-500">No customers found</td></tr>
                      ) : (
                        customersList.map((u) => (
                          <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-md">
                                  {u.full_name?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                                </div>
                                <span className="text-sm font-bold text-gray-900">{u.full_name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700">{u.email}</td>
                            <td className="px-6 py-4 text-sm text-gray-700">{u.mobile || "-"}</td>
                            <td className="px-6 py-4 text-sm text-gray-700">{u.city || "-"}</td>
                            <td className="px-6 py-4 text-sm text-gray-700">{u.state || "-"}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${u.is_active ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                                {u.is_active ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">{new Date(u.created_at).toLocaleDateString()}</td>
                            <td className="px-6 py-4">
                              <button onClick={() => handleToggleUserActive(u.id, !u.is_active)}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer border-none ${u.is_active ? "bg-rose-50 text-rose-600 hover:bg-rose-100" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"}`}>
                                {u.is_active ? "Deactivate" : "Activate"}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeNav === "endusers" ? (
            /* EndUsers Section */
            <div>
              <div className="bg-white border border-gray-200/60 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-gray-200/60 bg-gradient-to-r from-violet-500 to-purple-600">
                  <h3 className="text-lg font-bold text-white">End Users</h3>
                  <p className="text-sm text-violet-100">{endUsersList.length} end users registered</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200/60">
                        {["Name", "Email", "Mobile", "City", "State", "Status", "Joined", "Actions"].map((h) => (
                          <th key={h} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200/60">
                      {endUsersList.length === 0 ? (
                        <tr><td colSpan="8" className="px-6 py-12 text-center text-gray-500">No end users found</td></tr>
                      ) : (
                        endUsersList.map((u) => (
                          <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-md">
                                  {u.full_name?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                                </div>
                                <span className="text-sm font-bold text-gray-900">{u.full_name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700">{u.email}</td>
                            <td className="px-6 py-4 text-sm text-gray-700">{u.mobile || "-"}</td>
                            <td className="px-6 py-4 text-sm text-gray-700">{u.city || "-"}</td>
                            <td className="px-6 py-4 text-sm text-gray-700">{u.state || "-"}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${u.is_active ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                                {u.is_active ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">{new Date(u.created_at).toLocaleDateString()}</td>
                            <td className="px-6 py-4">
                              <button onClick={() => handleToggleUserActive(u.id, !u.is_active)}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer border-none ${u.is_active ? "bg-rose-50 text-rose-600 hover:bg-rose-100" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"}`}>
                                {u.is_active ? "Deactivate" : "Activate"}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeNav === "businesses" ? (
            /* Businesses Section */
            <div>
              <div className="bg-white border border-gray-200/60 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-gray-200/60 bg-gradient-to-r from-blue-500 to-indigo-600">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white">Business Profiles</h3>
                      <p className="text-sm text-blue-100">Create and manage business profiles for the End-User Home</p>
                    </div>
                    <button
                      onClick={() => setShowCreateBusiness(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 font-bold text-sm rounded-xl hover:bg-blue-50 transition-colors cursor-pointer border-none"
                    >
                      <Plus className="w-4 h-4" /> Create Business
                    </button>
                  </div>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-gray-200/60 bg-gray-50 flex flex-wrap items-center gap-3">
                  <input
                    type="text"
                    placeholder="Search businesses..."
                    value={businessSearch}
                    onChange={(e) => setBusinessSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && fetchBusinessList()}
                    className="flex-1 min-w-[200px] px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  <button
                    onClick={fetchBusinessList}
                    className="px-4 py-2.5 bg-blue-500 text-white text-sm font-bold rounded-xl hover:bg-blue-600 transition-colors cursor-pointer border-none"
                  >
                    Refresh
                  </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200/60">
                        {["Business", "Category", "Type", "City", "Featured", "Actions"].map((h) => (
                          <th key={h} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200/60">
                      {businessLoading ? (
                        <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-500">Loading...</td></tr>
                      ) : businessList.length === 0 ? (
                        <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                          <Building2 className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                          <p className="font-medium">No businesses yet</p>
                          <p className="text-sm text-gray-400 mt-1">Create your first business profile to get started</p>
                        </td></tr>
                      ) : (
                        businessList.map((b) => (
                          <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {b.logo_url ? (
                                  <img src={b.logo_url} alt="" className="w-10 h-10 rounded-xl object-cover shadow-md" />
                                ) : (
                                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-md">
                                    {b.business_name?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <span className="text-sm font-bold text-gray-900">{b.business_name}</span>
                                  <p className="text-xs text-gray-500">{b.slug}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-lg font-medium">
                                {b.category?.name || "N/A"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700">{b.profile_type}</td>
                            <td className="px-6 py-4 text-sm text-gray-700">{b.city || "-"}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                b.is_featured ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"
                              }`}>
                                {b.is_featured ? "Featured" : "Normal"}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <a
                                  href={`/enduser/business/${b.slug}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Create Business Modal */}
              {showCreateBusiness && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                    <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-between sticky top-0 z-10">
                      <div>
                        <h3 className="text-lg font-bold text-white">Create Business Profile</h3>
                        <p className="text-sm text-blue-100">Add a new business that will appear in Featured Businesses on the Home page</p>
                      </div>
                      <button
                        onClick={() => { setShowCreateBusiness(false); setCreateBusinessMsg(""); }}
                        className="p-2 hover:bg-white/20 rounded-xl cursor-pointer border-none bg-transparent"
                      >
                        <X className="w-5 h-5 text-white" />
                      </button>
                    </div>
                    <div className="p-6 space-y-4">
                      {createBusinessMsg && (
                        <div className={`p-3 rounded-xl text-sm text-center ${
                          createBusinessMsg.includes("success") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                        }`}>{createBusinessMsg}</div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Business Name *</label>
                          <input
                            type="text"
                            value={newBusiness.business_name}
                            onChange={(e) => setNewBusiness({ ...newBusiness, business_name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") })}
                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. Sharma Electronics"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Slug *</label>
                          <input
                            type="text"
                            value={newBusiness.slug}
                            onChange={(e) => setNewBusiness({ ...newBusiness, slug: e.target.value })}
                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="sharma-electronics"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Category *</label>
                          <select
                            value={newBusiness.category_id}
                            onChange={(e) => setNewBusiness({ ...newBusiness, category_id: e.target.value })}
                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          >
                            <option value="">Select category</option>
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Profile Type</label>
                          <select
                            value={newBusiness.profile_type}
                            onChange={(e) => setNewBusiness({ ...newBusiness, profile_type: e.target.value })}
                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          >
                            <option value="COMPANY">Company</option>
                            <option value="INDIVIDUAL">Individual</option>
                            <option value="MSME">MSME</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                        <textarea
                          value={newBusiness.description}
                          onChange={(e) => setNewBusiness({ ...newBusiness, description: e.target.value })}
                          className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          rows={2}
                          placeholder="Brief description of the business"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Phone</label>
                          <input
                            type="text"
                            value={newBusiness.phone}
                            onChange={(e) => setNewBusiness({ ...newBusiness, phone: e.target.value })}
                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="+91 98765 43210"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                          <input
                            type="email"
                            value={newBusiness.email}
                            onChange={(e) => setNewBusiness({ ...newBusiness, email: e.target.value })}
                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="business@example.com"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Website</label>
                        <input
                          type="url"
                          value={newBusiness.website}
                          onChange={(e) => setNewBusiness({ ...newBusiness, website: e.target.value })}
                          className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="https://example.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Address</label>
                        <input
                          type="text"
                          value={newBusiness.address}
                          onChange={(e) => setNewBusiness({ ...newBusiness, address: e.target.value })}
                          className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="Full street address"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">City</label>
                          <input
                            type="text"
                            value={newBusiness.city}
                            onChange={(e) => setNewBusiness({ ...newBusiness, city: e.target.value })}
                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">State</label>
                          <input
                            type="text"
                            value={newBusiness.state}
                            onChange={(e) => setNewBusiness({ ...newBusiness, state: e.target.value })}
                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Pincode</label>
                          <input
                            type="text"
                            value={newBusiness.pincode}
                            onChange={(e) => setNewBusiness({ ...newBusiness, pincode: e.target.value })}
                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Logo URL</label>
                          <input
                            type="url"
                            value={newBusiness.logo_url}
                            onChange={(e) => setNewBusiness({ ...newBusiness, logo_url: e.target.value })}
                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="https://example.com/logo.png"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Cover Image URL</label>
                          <input
                            type="url"
                            value={newBusiness.cover_image_url}
                            onChange={(e) => setNewBusiness({ ...newBusiness, cover_image_url: e.target.value })}
                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="https://example.com/cover.jpg"
                          />
                        </div>
                      </div>

                      {(newBusiness.logo_url || newBusiness.cover_image_url) && (
                        <div className="flex gap-3">
                          {newBusiness.logo_url && (
                            <div className="text-center">
                              <p className="text-xs text-gray-500 mb-1">Logo Preview</p>
                              <img src={newBusiness.logo_url} alt="Logo" className="w-16 h-16 rounded-xl object-cover border border-gray-200" />
                            </div>
                          )}
                          {newBusiness.cover_image_url && (
                            <div className="text-center">
                              <p className="text-xs text-gray-500 mb-1">Cover Preview</p>
                              <img src={newBusiness.cover_image_url} alt="Cover" className="w-32 h-16 rounded-xl object-cover border border-gray-200" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-3 p-4 border-t border-gray-200 bg-gray-50 sticky bottom-0">
                      <button
                        onClick={() => { setShowCreateBusiness(false); setCreateBusinessMsg(""); }}
                        className="flex-1 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-colors cursor-pointer border-none"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreateBusiness}
                        disabled={!newBusiness.business_name.trim() || !newBusiness.slug.trim() || !newBusiness.category_id || createBusinessLoading}
                        className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-colors cursor-pointer border-none disabled:opacity-40"
                      >
                        {createBusinessLoading ? "Creating..." : "Create & Feature Business"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : activeNav === "categories" ? (
            <CategoryManagement />
          ) : activeNav === "subcategories" ? (
            <SubcategoryManagement />
          ) : activeNav === "featured" ? (
            /* Featured Businesses Section */
            <div>
              <div className="bg-white border border-gray-200/60 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-gray-200/60 bg-gradient-to-r from-amber-500 to-orange-600">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white">Featured Businesses</h3>
                      <p className="text-sm text-amber-100">Manage businesses shown on the End-User Home page</p>
                    </div>
                    <button
                      onClick={() => setShowCreateFeatured(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-white text-amber-600 font-bold text-sm rounded-xl hover:bg-amber-50 transition-colors cursor-pointer border-none"
                    >
                      <Plus className="w-4 h-4" /> Add Featured
                    </button>
                  </div>
                </div>

                {/* Filters */}
                <div className="p-4 border-b border-gray-200/60 bg-gray-50 flex flex-wrap items-center gap-3">
                  <input
                    type="text"
                    placeholder="Search businesses..."
                    value={featuredSearch}
                    onChange={(e) => setFeaturedSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && fetchFeaturedBusinesses()}
                    className="flex-1 min-w-[200px] px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                  />
                  <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1">
                    {["all", "featured", "not-featured"].map((f) => (
                      <button
                        key={f}
                        onClick={() => setFeaturedFilter(f)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer border-none ${
                          featuredFilter === f
                            ? "bg-amber-500 text-white"
                            : "text-gray-500 hover:bg-gray-100 bg-transparent"
                        }`}
                      >
                        {f === "all" ? "All" : f === "featured" ? "Featured" : "Not Featured"}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={fetchFeaturedBusinesses}
                    className="px-4 py-2.5 bg-amber-500 text-white text-sm font-bold rounded-xl hover:bg-amber-600 transition-colors cursor-pointer border-none"
                  >
                    Refresh
                  </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200/60">
                        {["Business", "Category", "City", "Featured", "Order", "Actions"].map((h) => (
                          <th key={h} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200/60">
                      {featuredLoading ? (
                        <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-500">Loading...</td></tr>
                      ) : featuredList.length === 0 ? (
                        <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-500">No businesses found</td></tr>
                      ) : (
                        featuredList.map((b) => (
                          <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-md">
                                  {b.business_name?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <span className="text-sm font-bold text-gray-900">{b.business_name}</span>
                                  <p className="text-xs text-gray-500">{b.profile_type}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-lg font-medium">
                                {b.category?.name || "N/A"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700">{b.city || "-"}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                b.is_featured ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"
                              }`}>
                                {b.is_featured ? "Featured" : "Not Featured"}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <input
                                type="number"
                                value={b.featured_order ?? 0}
                                onChange={(e) => handleUpdateOrder(b.id, e.target.value)}
                                onBlur={(e) => handleUpdateOrder(b.id, e.target.value)}
                                className="w-16 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-sm text-center focus:ring-2 focus:ring-amber-500 outline-none"
                                min="0"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleToggleFeatured(b.id, b.is_featured)}
                                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer border-none ${
                                    b.is_featured
                                      ? "bg-red-100 text-red-600 hover:bg-red-200"
                                      : "bg-amber-100 text-amber-600 hover:bg-amber-200"
                                  }`}
                                >
                                  {b.is_featured ? "Remove" : "Feature"}
                                </button>
                                <button
                                  onClick={() => setEditingFeatured({ ...b, category_id: b.category?.id || "" })}
                                  className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors cursor-pointer border-none bg-transparent"
                                  title="Edit"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteFeatured(b.id)}
                                  className="p-1.5 text-gray-400 hover:text-red-500 transition-colors cursor-pointer border-none bg-transparent"
                                  title="Remove from featured"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                                <a
                                  href={`/enduser/business/${b.slug}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Create Featured Modal */}
              {showCreateFeatured && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                    <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-white">Add Featured Business</h3>
                        <p className="text-sm text-amber-100">Create a new featured business entry</p>
                      </div>
                      <button
                        onClick={() => { setShowCreateFeatured(false); setCreateFeaturedMsg(""); }}
                        className="p-2 hover:bg-white/20 rounded-xl cursor-pointer border-none bg-transparent"
                      >
                        <X className="w-5 h-5 text-white" />
                      </button>
                    </div>
                    <div className="p-6 space-y-4">
                      {createFeaturedMsg && (
                        <div className={`p-3 rounded-xl text-sm text-center ${
                          createFeaturedMsg.includes("success") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                        }`}>{createFeaturedMsg}</div>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Business Name *</label>
                          <input
                            type="text"
                            value={newFeatured.business_name}
                            onChange={(e) => setNewFeatured({ ...newFeatured, business_name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") })}
                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                            placeholder="Business name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Slug *</label>
                          <input
                            type="text"
                            value={newFeatured.slug}
                            onChange={(e) => setNewFeatured({ ...newFeatured, slug: e.target.value })}
                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                            placeholder="business-slug"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Category *</label>
                        <select
                          value={newFeatured.category_id}
                          onChange={(e) => setNewFeatured({ ...newFeatured, category_id: e.target.value })}
                          className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                        >
                          <option value="">Select category</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                        <textarea
                          value={newFeatured.description}
                          onChange={(e) => setNewFeatured({ ...newFeatured, description: e.target.value })}
                          className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                          rows={2}
                          placeholder="Short description"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">City</label>
                          <input
                            type="text"
                            value={newFeatured.city}
                            onChange={(e) => setNewFeatured({ ...newFeatured, city: e.target.value })}
                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">State</label>
                          <input
                            type="text"
                            value={newFeatured.state}
                            onChange={(e) => setNewFeatured({ ...newFeatured, state: e.target.value })}
                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Phone</label>
                          <input
                            type="text"
                            value={newFeatured.phone}
                            onChange={(e) => setNewFeatured({ ...newFeatured, phone: e.target.value })}
                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                          <input
                            type="email"
                            value={newFeatured.email}
                            onChange={(e) => setNewFeatured({ ...newFeatured, email: e.target.value })}
                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 p-4 border-t border-gray-200 bg-gray-50">
                      <button
                        onClick={() => { setShowCreateFeatured(false); setCreateFeaturedMsg(""); }}
                        className="flex-1 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-colors cursor-pointer border-none"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreateFeatured}
                        disabled={!newFeatured.business_name.trim() || !newFeatured.slug.trim() || !newFeatured.category_id || createFeaturedLoading}
                        className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-xl hover:from-amber-600 hover:to-orange-700 transition-colors cursor-pointer border-none disabled:opacity-40"
                      >
                        {createFeaturedLoading ? "Creating..." : "Create Featured"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Edit Featured Modal */}
              {editingFeatured && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                    <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-white">Edit Featured Business</h3>
                        <p className="text-sm text-blue-100">Update business details and images</p>
                      </div>
                      <button onClick={() => { setEditingFeatured(null); setEditFeaturedMsg(""); }} className="p-2 hover:bg-white/20 rounded-xl cursor-pointer border-none bg-transparent">
                        <X className="w-5 h-5 text-white" />
                      </button>
                    </div>
                    <div className="p-6 space-y-4">
                      {editFeaturedMsg && (
                        <div className={`p-3 rounded-xl text-sm text-center ${editFeaturedMsg.includes("success") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{editFeaturedMsg}</div>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Business Name *</label>
                          <input type="text" value={editingFeatured.business_name} onChange={(e) => setEditingFeatured({ ...editingFeatured, business_name: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Slug *</label>
                          <input type="text" value={editingFeatured.slug} onChange={(e) => setEditingFeatured({ ...editingFeatured, slug: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Category *</label>
                        <select value={editingFeatured.category_id} onChange={(e) => setEditingFeatured({ ...editingFeatured, category_id: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                          <option value="">Select category</option>
                          {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                        <textarea value={editingFeatured.description || ""} onChange={(e) => setEditingFeatured({ ...editingFeatured, description: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" rows={2} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">City</label>
                          <input type="text" value={editingFeatured.city || ""} onChange={(e) => setEditingFeatured({ ...editingFeatured, city: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">State</label>
                          <input type="text" value={editingFeatured.state || ""} onChange={(e) => setEditingFeatured({ ...editingFeatured, state: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Phone</label>
                          <input type="text" value={editingFeatured.phone || ""} onChange={(e) => setEditingFeatured({ ...editingFeatured, phone: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                          <input type="email" value={editingFeatured.email || ""} onChange={(e) => setEditingFeatured({ ...editingFeatured, email: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Website</label>
                        <input type="url" value={editingFeatured.website || ""} onChange={(e) => setEditingFeatured({ ...editingFeatured, website: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="https://..." />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Logo URL</label>
                          <input type="url" value={editingFeatured.logo_url || ""} onChange={(e) => setEditingFeatured({ ...editingFeatured, logo_url: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="https://...logo.png" />
                          {editingFeatured.logo_url && (<img src={editingFeatured.logo_url} alt="Logo preview" className="mt-2 h-10 w-10 rounded-lg object-cover border" />)}
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Cover Image URL</label>
                          <input type="url" value={editingFeatured.cover_image_url || ""} onChange={(e) => setEditingFeatured({ ...editingFeatured, cover_image_url: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="https://...cover.jpg" />
                          {editingFeatured.cover_image_url && (<img src={editingFeatured.cover_image_url} alt="Cover preview" className="mt-2 h-10 w-20 rounded-lg object-cover border" />)}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 p-4 border-t border-gray-200 bg-gray-50">
                      <button onClick={() => { setEditingFeatured(null); setEditFeaturedMsg(""); }} className="flex-1 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-colors cursor-pointer border-none">Cancel</button>
                      <button onClick={handleEditFeatured} disabled={!editingFeatured.business_name?.trim() || !editingFeatured.slug?.trim() || !editingFeatured.category_id || editFeaturedLoading} className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-colors cursor-pointer border-none disabled:opacity-40">
                        {editFeaturedLoading ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : activeNav === "banners" ? (
            <BannerManagement />
          ) : activeNav === "trending-videos" ? (
            <TrendingVideoManagement />
          ) : activeNav === "services" ? (
            <AdminServiceManagement />
          ) : activeNav === "best-sellers" ? (
            <BestSellerManagement />
          ) : activeNav === "enquiries" ? (
            <AdminEnquiries />
          ) : activeNav === "trending-products" ? (
            <TrendingProductManagement />
          ) : activeNav === "trending-categories" ? (
            <TrendingCategoryManagement />
          ) : activeNav === "documents" ? (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Documents</h3>
                <div className="flex gap-2">
                  {["ALL", "PENDING", "APPROVED", "REJECTED"].map((f) => (
                    <button key={f} onClick={() => setDocumentsFilter(f)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer border-none ${documentsFilter === f ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-white border border-gray-200/60 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200/60">
                        {["Document", "Type", "Profile", "Status", "Uploaded", "Actions"].map((h) => (
                          <th key={h} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200/60">
                      {documentsLoading ? (
                        <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                          <p className="font-medium">Loading documents...</p>
                        </td></tr>
                      ) : documentsList.length === 0 ? (
                        <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                          <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
                          <p className="font-medium">No documents found</p>
                        </td></tr>
                      ) : documentsList.map((doc) => (
                        <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                                <FileText className="w-5 h-5 text-purple-500" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-gray-900">{doc.file_name}</p>
                                <p className="text-xs text-gray-500">{(doc.file_size / 1024).toFixed(1)} KB</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4"><span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-lg font-medium">{doc.document_type}</span></td>
                          <td className="px-6 py-4 text-sm text-gray-700">Profile #{doc.profile_id}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${doc.verification_status === "APPROVED" ? "bg-emerald-100 text-emerald-700" : doc.verification_status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                              {doc.verification_status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">{doc.created_at ? new Date(doc.created_at).toLocaleDateString() : "—"}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {doc.verification_status === "PENDING" && (
                                <>
                                  <button onClick={() => handleVerifyDocument(doc.id, "APPROVED")} disabled={verifyingDoc === doc.id}
                                    className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 transition-colors cursor-pointer border-none disabled:opacity-50">
                                    {verifyingDoc === doc.id ? "..." : "Approve"}
                                  </button>
                                  <button onClick={() => { const r = prompt("Rejection reason (optional):"); if (r !== null) handleVerifyDocument(doc.id, "REJECTED", r); }} disabled={verifyingDoc === doc.id}
                                    className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-colors cursor-pointer border-none disabled:opacity-50">
                                    Reject
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeNav === "verification" ? (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-6">Verification Pipeline</h3>
              {/* Pending Profiles */}
              <div className="mb-8">
                <h4 className="text-lg font-bold text-gray-900 mb-4">Pending Business Profiles ({pendingProfiles.length})</h4>
                <div className="bg-white border border-gray-200/60 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200/60">
                          {["Business", "Owner", "Category", "City", "Actions"].map((h) => (
                            <th key={h} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200/60">
                        {pendingProfiles.length === 0 ? (
                          <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                            <ShieldCheck className="w-10 h-10 mx-auto mb-3 opacity-50" />
                            <p className="font-medium">No pending profiles to verify</p>
                          </td></tr>
                        ) : pendingProfiles.map((profile) => (
                          <tr key={profile.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                                  {profile.logo_url ? (<img src={profile.logo_url} alt="" className="w-10 h-10 rounded-xl object-cover" />) : (<Building2 className="w-5 h-5 text-blue-500" />)}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-gray-900">{profile.business_name}</p>
                                  <p className="text-xs text-gray-500">/{profile.slug}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700">User #{profile.user_id}</td>
                            <td className="px-6 py-4"><span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-lg font-medium">{profile.profile_type}</span></td>
                            <td className="px-6 py-4 text-sm text-gray-700">{profile.city || "—"}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <button onClick={() => handleVerifyProfile(profile.id, true)} disabled={verifyingProfile === profile.id} className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 transition-colors cursor-pointer border-none disabled:opacity-50">
                                  {verifyingProfile === profile.id ? "..." : "Approve"}
                                </button>
                                <button onClick={() => handleVerifyProfile(profile.id, false)} disabled={verifyingProfile === profile.id} className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-colors cursor-pointer border-none disabled:opacity-50">
                                  Reject
                                </button>
                                <Link to={`/enduser/business/${profile.slug}`} target="_blank" className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors"><ExternalLink className="w-4 h-4" /></Link>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              {/* Pending Documents */}
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-4">Pending Documents ({pendingDocuments.length})</h4>
                <div className="bg-white border border-gray-200/60 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200/60">
                          {["Document", "Type", "Profile", "Status", "Actions"].map((h) => (
                            <th key={h} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200/60">
                        {pendingDocuments.length === 0 ? (
                          <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                            <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
                            <p className="font-medium">No pending documents to review</p>
                          </td></tr>
                        ) : pendingDocuments.map((doc) => (
                          <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center"><FileText className="w-5 h-5 text-violet-500" /></div>
                                <span className="text-sm font-bold text-gray-900">{doc.file_name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4"><span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg font-medium">{doc.document_type}</span></td>
                            <td className="px-6 py-4 text-sm text-gray-700">Profile #{doc.profile_id}</td>
                            <td className="px-6 py-4"><span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700"><Clock className="w-3 h-3" /> PENDING</span></td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <button onClick={() => handleVerifyDocument(doc.id, "APPROVED")} disabled={verifyingDoc === doc.id} className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 transition-colors cursor-pointer border-none disabled:opacity-50">
                                  {verifyingDoc === doc.id ? "..." : "Approve"}
                                </button>
                                <button onClick={() => { const reason = prompt("Rejection reason (optional):"); handleVerifyDocument(doc.id, "REJECTED", reason); }} disabled={verifyingDoc === doc.id} className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-colors cursor-pointer border-none disabled:opacity-50">
                                  Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ) : activeNav === "settings" ? (
            <div className="max-w-2xl mx-auto">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Settings</h3>
              
              {/* Account Info */}
              <div className="bg-white border border-gray-200/60 rounded-2xl overflow-hidden mb-6">
                <div className="p-5 border-b border-gray-200/60 bg-gradient-to-r from-gray-700 to-gray-800">
                  <h4 className="text-sm font-bold text-white">Account Settings</h4>
                  <p className="text-xs text-gray-300">Manage your personal information</p>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                      <input type="text" value={user?.full_name || ""} readOnly
                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                      <input type="email" value={user?.email || ""} readOnly
                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Role</label>
                      <input type="text" value="Administrator" readOnly
                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Phone</label>
                      <input type="tel" value={user?.mobile || ""} readOnly
                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 text-sm" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Platform Stats Summary */}
              <div className="bg-white border border-gray-200/60 rounded-2xl overflow-hidden mb-6">
                <div className="p-5 border-b border-gray-200/60 bg-gradient-to-r from-blue-500 to-indigo-600">
                  <h4 className="text-sm font-bold text-white">Platform Overview</h4>
                </div>
                <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <p className="text-2xl font-extrabold text-blue-600">{stats?.total_users || 0}</p>
                    <p className="text-xs text-gray-500 font-medium mt-1">Total Users</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <p className="text-2xl font-extrabold text-emerald-600">{stats?.total_profiles || 0}</p>
                    <p className="text-xs text-gray-500 font-medium mt-1">Businesses</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <p className="text-2xl font-extrabold text-purple-600">{stats?.total_products || 0}</p>
                    <p className="text-xs text-gray-500 font-medium mt-1">Products</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <p className="text-2xl font-extrabold text-amber-600">{stats?.total_services || 0}</p>
                    <p className="text-xs text-gray-500 font-medium mt-1">Services</p>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-white border border-red-200/60 rounded-2xl p-6">
                <h4 className="text-sm font-bold text-red-700 mb-2">Danger Zone</h4>
                <p className="text-sm text-gray-500 mb-4">Once you logout, you will need to log in again.</p>
                <button onClick={handleLogout}
                  className="px-4 py-2 bg-red-50 text-red-600 font-bold text-sm rounded-xl hover:bg-red-100 transition-colors cursor-pointer border-none">
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
                {metricCards.map((m) => {
                  const Icon = m.icon;
                  return (
                    <div
                      key={m.label}
                      className="bg-white border border-gray-200/60 rounded-2xl p-5 hover:shadow-lg transition-all duration-300 group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className={`w-11 h-11 bg-gradient-to-br ${m.color} rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}
                        >
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <h3 className="text-2xl font-extrabold text-gray-900">{m.value}</h3>
                      <p className="text-xs text-gray-500 font-medium mt-1">{m.label}</p>
                    </div>
                  );
                })}
              </div>

              {/* Recent Activity Table */}
              <div className="bg-white border border-gray-200/60 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-gray-200/60 bg-gradient-to-r from-sky-500 to-blue-600">
                  <h3 className="text-lg font-bold text-white">Recent Activity</h3>
                  <p className="text-sm text-sky-100">Live feed of platform activities</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200/60">
                        {["User", "Activity Type", "Entity", "Timestamp", "Status"].map(
                          (h) => (
                            <th
                              key={h}
                              className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
                            >
                              {h}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200/60">
                      {activities.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                            No recent activity
                          </td>
                        </tr>
                      ) : (
                        activities.map((activity) => (
                          <tr key={activity.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-md">
                                  {activity.user
                                    .split(" ")
                                    .map((w) => w[0])
                                    .join("")
                                    .slice(0, 2)
                                    .toUpperCase()}
                                </div>
                                <span className="text-sm font-bold text-gray-900">
                                  {activity.user}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700">
                              {activity.activityType}
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">
                                {activity.entity}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {formatTimestamp(activity.timestamp)}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg ${statusBadge(
                                  activity.status
                                )}`}
                              >
                                {activity.status === "high" && <TrendingUp className="w-3 h-3" />}
                                {activity.status === "medium" && <AlertCircle className="w-3 h-3" />}
                                {activity.status === "low" && <Clock className="w-3 h-3" />}
                                {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {cropModalOpen && cropImage && (
        <ImageCropModal
          imageSrc={cropImage}
          onCrop={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  );
}
