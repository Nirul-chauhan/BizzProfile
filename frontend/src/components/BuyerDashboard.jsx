import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  LayoutDashboard,
  UserCircle,
  Search,
  FileText,
  Star,
  Heart,
  MessageSquare,
  Settings,
  LogOut,
  ChevronDown,
  Bell,
  Camera,
  Pencil,
  Eye,
  Plus,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Send,
  MapPin,
  Building2,
  Tag,
  Filter,
  ArrowRight,
  Loader,
  Store,
  Home,
  Phone,
  Hash,
  Globe,
  List,
  MessageCircle,
  StarHalf,
  Play,
  XCircle,
  TrendingUp,
  Briefcase,
  DollarSign,
} from "lucide-react";
import {
  buyerGetDashboard,
  buyerGetProfile,
  buyerUpdateProfile,
  buyerCreateRequirement,
  buyerListRequirements,
  buyerUpdateRequirement,
  buyerDeleteRequirement,
  buyerListLeads,
  buyerCreateEnquiry,
  buyerListEnquiries,
  buyerAddFavorite,
  buyerListFavorites,
  buyerRemoveFavorite,
  buyerGetConversations,
  buyerGetMessages,
  buyerSendMessage,
  buyerMarkRead,
  getSocieties,
  getCategories,
  getSubcategories,
  getTrendingVideos,
  searchProfiles,
  getPublicServices,
  buyerCreateTrendingProductRequest,
  buyerListTrendingProductRequests,
  buyerListMyVideos,
  buyerUploadVideo,
  buyerUpdateVideo,
  buyerDeleteVideo,
} from "../api";
import BestSellerRequests from "./BestSellerRequests";
import TrendingProductRequests from "./TrendingProductRequests";
import BuyerVideoManagement from "./BuyerVideoManagement";
import BuyerServiceManagement from "./BuyerServiceManagement";
import BuyerQuotations from "./BuyerQuotations";
import BuyerEnquiries from "./BuyerEnquiries";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "profile", label: "My Profile", icon: UserCircle },
  { id: "browse", label: "Browse", icon: Search },
  { id: "browse-services", label: "Browse Services", icon: Briefcase },
  { id: "requirements", label: "My Requirements", icon: FileText },
  { id: "enquiries", label: "My Enquiries", icon: MessageCircle },
  { id: "quotations", label: "My Quotations", icon: DollarSign },
  { id: "leads", label: "My Leads", icon: ArrowRight },
  { id: "reviews", label: "My Reviews", icon: Star },
  { id: "favorites", label: "Favorites", icon: Heart },
  { id: "best-seller-requests", label: "Best Seller Requests", icon: Star },
  { id: "trending-product-requests", label: "Trending Requests", icon: TrendingUp },
  { id: "my-videos", label: "My Videos", icon: Play },
  { id: "messages", label: "Messages", icon: MessageSquare },
  { id: "settings", label: "Settings", icon: Settings },
];

function StatusBadge({ status }) {
  const styles = {
    OPEN: "bg-emerald-100 text-emerald-700",
    FULFILLED: "bg-blue-100 text-blue-700",
    CLOSED: "bg-gray-100 text-gray-600",
    NEW: "bg-blue-100 text-blue-700",
    CONTACTED: "bg-amber-100 text-amber-700",
    PENDING: "bg-amber-100 text-amber-700",
    RESOLVED: "bg-emerald-100 text-emerald-700",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
        styles[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      {status}
    </span>
  );
}

function RatingStars({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-4 h-4 ${
            s <= rating ? "text-amber-400 fill-amber-400" : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );
}

export default function BuyerDashboard() {
  const navigate = useNavigate();
  const { section } = useParams();
  const [activeSection, setActiveSection] = useState(section || "dashboard");
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const [dashboard, setDashboard] = useState(null);
  const [profile, setProfile] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [leads, setLeads] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [societies, setSocieties] = useState([]);

  const [reqPage, setReqPage] = useState(1);
  const [reqHasMore, setReqHasMore] = useState(true);
  const [leadPage, setLeadPage] = useState(1);
  const [leadHasMore, setLeadHasMore] = useState(true);

  const [showReqModal, setShowReqModal] = useState(false);
  const [reqForm, setReqForm] = useState({
    title: "",
    description: "",
    category_id: "",
    subcategory_id: "",
    budget: "",
  });
  const [reqFormCat, setReqFormCat] = useState("");
  const [subcategories, setSubcategories] = useState([]);
  const [reqSaving, setReqSaving] = useState(false);
  const [reqMessage, setReqMessage] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [msgLoading, setMsgLoading] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileSociety, setProfileSociety] = useState("");
  const [profileBlock, setProfileBlock] = useState("");
  const [profileFlat, setProfileFlat] = useState("");
  const [profileCity, setProfileCity] = useState("");
  const [profileState, setProfileState] = useState("");
  const [profileCountry, setProfileCountry] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Trending videos & nearby
  const [trendingVideos, setTrendingVideos] = useState([]);
  const [nearbyBusinesses, setNearbyBusinesses] = useState([]);
  const [activeVideo, setActiveVideo] = useState(null);
  const [profileMessage, setProfileMessage] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
      } catch {
        navigate("/login");
      }
    } else {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    if (section) setActiveSection(section);
  }, [section]);

  useEffect(() => {
    if (!user) return;
    loadSectionData();
  }, [activeSection, user]);

  useEffect(() => {
    if (activeConversation) loadMessages(activeConversation.id || activeConversation.user_id);
  }, [activeConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadSectionData = async () => {
    setLoading(true);
    try {
      switch (activeSection) {
        case "dashboard":
          await loadDashboard();
          break;
        case "profile":
          await loadProfile();
          break;
        case "browse":
          await loadCategories();
          break;
        case "requirements":
          await loadRequirements(true);
          break;
        case "leads":
          await loadLeads(true);
          await loadEnquiries();
          break;
        case "reviews":
          await loadEnquiries();
          break;
        case "favorites":
          await loadFavorites();
          break;
        case "messages":
          await loadConversations();
          break;
        default:
          break;
      }
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboard = async () => {
    try {
      const data = await buyerGetDashboard();
      setDashboard(data);
    } catch (err) {
      console.error("Dashboard load failed:", err);
    }
    // Load trending videos
    getTrendingVideos()
      .then((data) => setTrendingVideos(Array.isArray(data) ? data : []))
      .catch(() => {});
    // Load nearby businesses
    searchProfiles({ page_size: 6 })
      .then((result) => setNearbyBusinesses(result.items || []))
      .catch(() => {});
  };

  const loadProfile = async () => {
    setProfileLoading(true);
    try {
      const data = await buyerGetProfile();
      setProfile(data);
      setProfileName(data.full_name || user?.full_name || "");
      setProfilePhone(data.mobile || data.phone || "");
      setProfileSociety(data.society || "");
      setProfileBlock(data.block_tower || "");
      setProfileFlat(data.flat_number || "");
      setProfileCity(data.city || "");
      setProfileState(data.state || "");
      setProfileCountry(data.country || "");
      setProfilePic(data.profile_pic || null);
    } catch (err) {
      console.error("Profile load failed:", err);
    } finally {
      setProfileLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data || []);
    } catch (err) {
      console.error("Categories load failed:", err);
    }
  };

  const loadRequirements = async (reset = false) => {
    try {
      const page = reset ? 1 : reqPage;
      const data = await buyerListRequirements(page);
      const items = data.items || data || [];
      if (reset) {
        setRequirements(items);
        setReqPage(1);
      } else {
        setRequirements((prev) => [...prev, ...items]);
      }
      setReqHasMore(items.length >= 20);
    } catch (err) {
      console.error("Requirements load failed:", err);
    }
  };

  const loadLeads = async (reset = false) => {
    try {
      const page = reset ? 1 : leadPage;
      const data = await buyerListLeads(page);
      const items = data.items || data || [];
      if (reset) {
        setLeads(items);
        setLeadPage(1);
      } else {
        setLeads((prev) => [...prev, ...items]);
      }
      setLeadHasMore(items.length >= 20);
    } catch (err) {
      console.error("Leads load failed:", err);
    }
  };

  const loadEnquiries = async () => {
    try {
      const data = await buyerListEnquiries();
      const items = data.items || data || [];
      setEnquiries(items);
      const ratingMap = {};
      items.forEach((e) => {
        if (e.review || e.rating) {
          ratingMap[e.id] = e.review || { rating: e.rating, comment: e.review_comment };
        }
      });
      setReviews(items.filter((e) => e.review || e.rating));
    } catch (err) {
      console.error("Enquiries load failed:", err);
    }
  };

  const loadFavorites = async () => {
    try {
      const data = await buyerListFavorites();
      setFavorites(data.items || data || []);
    } catch (err) {
      console.error("Favorites load failed:", err);
    }
  };

  const loadConversations = async () => {
    try {
      const data = await buyerGetConversations();
      setConversations(data.items || data || []);
    } catch (err) {
      console.error("Conversations load failed:", err);
    }
  };

  const loadMessages = async (userId) => {
    setMsgLoading(true);
    try {
      const data = await buyerGetMessages(userId);
      setMessages(data.items || data || []);
      await buyerMarkRead(userId);
    } catch (err) {
      console.error("Messages load failed:", err);
    } finally {
      setMsgLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeConversation) return;
    setSendLoading(true);
    try {
      const receiverId = activeConversation.user_id || activeConversation.id;
      await buyerSendMessage(receiverId, newMessage.trim());
      setNewMessage("");
      await loadMessages(receiverId);
    } catch (err) {
      console.error("Send message failed:", err);
    } finally {
      setSendLoading(false);
    }
  };

  const handleCreateRequirement = async () => {
    if (!reqForm.title.trim()) {
      setReqMessage("Title is required");
      return;
    }
    setReqSaving(true);
    setReqMessage("");
    try {
      const payload = {
        title: reqForm.title,
        description: reqForm.description || null,
        category_id: reqFormCat ? parseInt(reqFormCat) : null,
        subcategory_id: reqForm.subcategory_id ? parseInt(reqForm.subcategory_id) : null,
        budget: reqForm.budget ? parseFloat(reqForm.budget) : null,
      };
      await buyerCreateRequirement(payload);
      setReqMessage("Requirement posted successfully!");
      setReqForm({ title: "", description: "", category_id: "", subcategory_id: "", budget: "" });
      setReqFormCat("");
      setSubcategories([]);
      setTimeout(() => {
        setShowReqModal(false);
        setReqMessage("");
        loadRequirements(true);
      }, 1200);
    } catch (err) {
      setReqMessage(err.message || "Failed to create requirement");
    } finally {
      setReqSaving(false);
    }
  };

  const handleDeleteRequirement = async (id) => {
    try {
      await buyerDeleteRequirement(id);
      setRequirements((prev) => prev.filter((r) => r.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleUpdateRequirementStatus = async (id, status) => {
    try {
      await buyerUpdateRequirement(id, { status });
      setRequirements((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    } catch (err) {
      console.error("Update failed:", err);
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
      const result = await buyerUpdateProfile({
        full_name: profileName,
        mobile: profilePhone,
        society: profileSociety,
        block_tower: profileBlock,
        flat_number: profileFlat,
        city: profileCity,
        state: profileState,
        country: profileCountry,
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
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result);
        localStorage.setItem("buyer_avatar", reader.result);
      };
      reader.readAsDataURL(file);
      setProfileMessage("Profile picture updated!");
      setTimeout(() => setProfileMessage(""), 3000);
    } catch (err) {
      setProfileMessage(err.message || "Failed to upload picture");
    } finally {
      setUploadingPic(false);
    }
  };

  const handleToggleFavorite = async (targetType, targetId) => {
    try {
      const existing = favorites.find(
        (f) => f.target_id === targetId && f.target_type === targetType
      );
      if (existing) {
        await buyerRemoveFavorite(existing.id);
        setFavorites((prev) => prev.filter((f) => f.id !== existing.id));
      } else {
        const result = await buyerAddFavorite(targetType, targetId);
        setFavorites((prev) => [...prev, result]);
      }
    } catch (err) {
      console.error("Favorite toggle failed:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleSubcategoryLoad = async (catId) => {
    setReqFormCat(catId);
    setReqForm((prev) => ({ ...prev, category_id: catId, subcategory_id: "" }));
    if (!catId) {
      setSubcategories([]);
      return;
    }
    try {
      const data = await getSubcategories(catId);
      setSubcategories(data || []);
    } catch {
      setSubcategories([]);
    }
  };

  const filteredRequirements = requirements.filter((r) => {
    if (filterStatus !== "ALL" && r.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        (r.title || "").toLowerCase().includes(q) ||
        (r.description || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredLeads = leads.filter((l) => {
    if (filterStatus !== "ALL" && l.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        (l.business_name || "").toLowerCase().includes(q) ||
        (l.seller_name || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalRequirements = dashboard?.total_requirements ?? requirements.length;
  const activeRequirements =
    dashboard?.active_requirements ??
    requirements.filter((r) => r.status === "OPEN").length;
  const totalLeadsSent = dashboard?.total_leads ?? leads.length;
  const totalReviewsGiven = dashboard?.total_reviews ?? reviews.length;

  const metricCards = [
    {
      label: "Total Requirements",
      value: totalRequirements,
      icon: FileText,
      bg: "bg-blue-50",
      iconColor: "text-blue-500",
    },
    {
      label: "Active Requirements",
      value: activeRequirements,
      icon: Clock,
      bg: "bg-emerald-50",
      iconColor: "text-emerald-500",
    },
    {
      label: "Total Leads Sent",
      value: totalLeadsSent,
      icon: ArrowRight,
      bg: "bg-amber-50",
      iconColor: "text-amber-500",
    },
    {
      label: "Total Reviews",
      value: totalReviewsGiven,
      icon: Star,
      bg: "bg-violet-50",
      iconColor: "text-violet-500",
    },
  ];

  const sectionLabel = {
    dashboard: "Dashboard",
    profile: "My Profile",
    browse: "Browse",
    requirements: "My Requirements",
    enquiries: "My Enquiries",
    quotations: "My Quotations",
    leads: "My Leads",
    reviews: "My Reviews",
    favorites: "Favorites",
    messages: "Messages",
    settings: "Settings",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside
          className={`fixed lg:sticky top-0 left-0 z-50 w-64 bg-[#0a2540] flex flex-col shadow-xl h-screen transition-transform lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="p-5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-white font-extrabold text-lg leading-tight">
                  BizzProfile
                </h1>
                <p className="text-blue-300 text-[10px] font-medium">Buyer Portal</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    setSidebarOpen(false);
                  }}
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

          <div className="p-3 border-t border-white/10">
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
        <main className="flex-1 flex flex-col min-w-0">
          {/* Top Header */}
          <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between shadow-sm sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 cursor-pointer border-none bg-transparent"
              >
                <List className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {sectionLabel[activeSection] || "Dashboard"}
                </h2>
                <p className="text-xs text-gray-500">
                  {user?.full_name || "Buyer"}
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[9px] font-bold ml-1.5">
                    BUYER
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-xl hover:bg-gray-100 cursor-pointer border-none bg-transparent">
                <Bell className="w-5 h-5" />
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer border-none bg-transparent"
                >
                  {profilePic || localStorage.getItem("buyer_avatar") ? (
                    <img
                      src={profilePic || localStorage.getItem("buyer_avatar")}
                      alt=""
                      className="w-8 h-8 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                      {user?.full_name
                        ?.split(" ")
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase() || "BY"}
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-700 hidden sm:block">
                    {user?.full_name || "Buyer"}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
                {showProfileMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowProfileMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-bold text-gray-900">
                          {user?.full_name}
                        </p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[9px] font-bold">
                          BUYER
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setActiveSection("profile");
                          setShowProfileMenu(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-emerald-50 cursor-pointer border-none bg-transparent flex items-center gap-2"
                      >
                        <Pencil className="w-4 h-4 text-emerald-600" /> Edit Profile
                      </button>
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
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" />
              </div>
            ) : activeSection === "dashboard" ? (
              /* ========== DASHBOARD ========== */
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {metricCards.map((m) => {
                    const Icon = m.icon;
                    return (
                      <div
                        key={m.label}
                        className="bg-white border border-gray-200/60 rounded-2xl p-5 hover:shadow-lg transition-all duration-300 group"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div
                            className={`w-11 h-11 ${m.bg} rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}
                          >
                            <Icon className={`w-5 h-5 ${m.iconColor}`} />
                          </div>
                        </div>
                        <h3 className="text-2xl font-extrabold text-gray-900">
                          {m.value}
                        </h3>
                        <p className="text-xs text-gray-500 font-medium mt-1">
                          {m.label}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Recent Requirements */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-extrabold text-gray-900">
                      Recent Requirements
                    </h3>
                    <button
                      onClick={() => setActiveSection("requirements")}
                      className="text-sm font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer border-none bg-transparent"
                    >
                      View All
                    </button>
                  </div>
                  {requirements.length === 0 ? (
                    <div className="bg-white border border-gray-200/60 rounded-2xl p-12 text-center">
                      <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="font-medium text-gray-600">No requirements yet</p>
                      <p className="text-sm text-gray-400 mt-1 mb-4">
                        Post your first requirement to get started
                      </p>
                      <button
                        onClick={() => {
                          setActiveSection("requirements");
                          setTimeout(() => setShowReqModal(true), 200);
                        }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-md cursor-pointer border-none"
                      >
                        <Plus className="w-4 h-4" /> Post Requirement
                      </button>
                    </div>
                  ) : (
                    <div className="bg-white border border-gray-200/60 rounded-2xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-200/60">
                              {["Title", "Status", "Budget", "Date"].map((h) => (
                                <th
                                  key={h}
                                  className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
                                >
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200/60">
                            {requirements.slice(0, 5).map((req) => (
                              <tr
                                key={req.id}
                                className="hover:bg-gray-50/50 transition-colors"
                              >
                                <td className="px-6 py-4">
                                  <span className="text-sm font-bold text-gray-900">
                                    {req.title}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <StatusBadge status={req.status} />
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-700">
                                  {req.budget_min || req.budget_max
                                    ? `₹${req.budget_min || 0} - ₹${req.budget_max || "∞"}`
                                    : "—"}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                  {req.created_at
                                    ? new Date(req.created_at).toLocaleDateString()
                                    : "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* Recent Activity */}
                <div>
                  <h3 className="text-xl font-extrabold text-gray-900 mb-4">
                    Quick Actions
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <button
                      onClick={() => {
                        setActiveSection("requirements");
                        setTimeout(() => setShowReqModal(true), 200);
                      }}
                      className="bg-white border border-gray-200/60 rounded-2xl p-6 hover:shadow-lg transition-all cursor-pointer text-left group border-dashed"
                    >
                      <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Plus className="w-5 h-5 text-emerald-500" />
                      </div>
                      <h4 className="text-sm font-bold text-gray-900">
                        Post Requirement
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Tell sellers what you need
                      </p>
                    </button>
                    <button
                      onClick={() => setActiveSection("browse")}
                      className="bg-white border border-gray-200/60 rounded-2xl p-6 hover:shadow-lg transition-all cursor-pointer text-left group border-dashed"
                    >
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Search className="w-5 h-5 text-blue-500" />
                      </div>
                      <h4 className="text-sm font-bold text-gray-900">
                        Browse Businesses
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Discover sellers near you
                      </p>
                    </button>
                    <button
                      onClick={() => setActiveSection("messages")}
                      className="bg-white border border-gray-200/60 rounded-2xl p-6 hover:shadow-lg transition-all cursor-pointer text-left group border-dashed"
                    >
                      <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <MessageSquare className="w-5 h-5 text-violet-500" />
                      </div>
                      <h4 className="text-sm font-bold text-gray-900">Messages</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Chat with sellers
                      </p>
                    </button>
                  </div>
                </div>

                {/* Trending Videos */}
                {trendingVideos.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-xl font-extrabold text-gray-900 mb-4">Trending Videos</h3>
                    <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
                      {trendingVideos.slice(0, 6).map((video) => (
                        <div
                          key={video.id}
                          className="flex-shrink-0 w-56 bg-white border border-gray-200/60 rounded-xl overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                          onClick={() => setActiveVideo(video)}
                        >
                          <div className="relative h-32 bg-gray-900">
                            {video.platform === "YOUTUBE" && video.embed_id ? (
                              <img src={`https://img.youtube.com/vi/${video.embed_id}/mqdefault.jpg`} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                                <Play className="w-8 h-8 text-white/60" />
                              </div>
                            )}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center">
                                <Play className="w-4 h-4 text-gray-900 ml-0.5" />
                              </div>
                            </div>
                          </div>
                          <div className="p-3">
                            <h4 className="text-xs font-bold text-gray-900 truncate">{video.title || "Trending Video"}</h4>
                            <span className="text-[10px] text-gray-400 uppercase font-bold">{video.platform}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Nearby Businesses */}
                {nearbyBusinesses.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-xl font-extrabold text-gray-900 mb-4">Businesses Near You</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {nearbyBusinesses.slice(0, 6).map((biz) => (
                        <Link
                          key={biz.id}
                          to={`/enduser/business/${biz.slug}`}
                          className="bg-white border border-gray-200/60 rounded-xl p-4 hover:shadow-lg transition-all no-underline group"
                        >
                          <div className="flex items-center gap-3 mb-2">
                            {biz.logo_url ? (
                              <img src={biz.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 text-sm font-bold">
                                {(biz.business_name || "?")[0]}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-bold text-gray-900 truncate group-hover:text-emerald-600 block">{biz.business_name}</span>
                              {biz.city && <span className="text-[10px] text-gray-400 flex items-center gap-1"><MapPin className="w-2.5 h-2.5" />{biz.city}</span>}
                            </div>
                          </div>
                          {biz.description && <p className="text-xs text-gray-500 truncate">{biz.description}</p>}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Video Modal */}
                {activeVideo && (
                  <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4" onClick={() => setActiveVideo(null)}>
                    <div className="relative w-full max-w-3xl bg-black rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setActiveVideo(null)}
                        className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 cursor-pointer border-none"
                      >
                        <X className="w-5 h-5" />
                      </button>
                      <div className="aspect-video">
                        {activeVideo.platform === "YOUTUBE" && activeVideo.embed_id && (
                          <iframe
                            src={`https://www.youtube.com/embed/${activeVideo.embed_id}?autoplay=1`}
                            className="w-full h-full"
                            allow="autoplay; encrypted-media"
                            allowFullScreen
                            title={activeVideo.title}
                          />
                        )}
                        {activeVideo.platform === "INSTAGRAM" && activeVideo.embed_id && (
                          <iframe
                            src={`https://www.instagram.com/reel/${activeVideo.embed_id}/embed`}
                            className="w-full h-full"
                            allow="autoplay; encrypted-media"
                            allowFullScreen
                            title={activeVideo.title}
                          />
                        )}
                        {activeVideo.platform === "FACEBOOK" && (
                          <iframe
                            src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(activeVideo.video_url)}&autoplay=1`}
                            className="w-full h-full"
                            allow="autoplay; encrypted-media"
                            allowFullScreen
                            title={activeVideo.title}
                          />
                        )}
                        {activeVideo.platform === "UPLOAD" && (
                          <video src={activeVideo.video_url} controls autoPlay className="w-full h-full" />
                        )}
                      </div>
                      <div className="p-4 bg-gray-900">
                        <h3 className="text-white font-bold">{activeVideo.title || "Untitled"}</h3>
                        {activeVideo.company_name && <p className="text-gray-400 text-sm mt-1">{activeVideo.company_name}</p>}
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : activeSection === "profile" ? (
              <div className="max-w-2xl mx-auto">
                <div className="bg-white border border-gray-200/60 rounded-2xl overflow-hidden">
                  <div className="p-6 border-b border-gray-200/60 bg-gradient-to-r from-emerald-500 to-teal-600">
                    <h3 className="text-lg font-bold text-white">Edit Profile</h3>
                    <p className="text-sm text-emerald-100">
                      Update your personal information
                    </p>
                  </div>
                  {profileLoading ? (
                    <div className="flex items-center justify-center h-48">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
                    </div>
                  ) : (
                    <div className="p-6 space-y-5">
                      {profileMessage && (
                        <div
                          className={`p-3 rounded-xl text-sm text-center ${
                            profileMessage.includes("success") || profileMessage.includes("updated")
                              ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                              : "bg-red-50 border border-red-200 text-red-700"
                          }`}
                        >
                          {profileMessage}
                        </div>
                      )}

                      {/* Profile Picture */}
                      <div className="flex items-center gap-6 pb-5 border-b border-gray-200">
                        <div className="relative">
                          {profilePic || localStorage.getItem("buyer_avatar") ? (
                            <img
                              src={profilePic || localStorage.getItem("buyer_avatar")}
                              alt="Profile"
                              className="w-24 h-24 rounded-2xl object-cover shadow-lg"
                            />
                          ) : (
                            <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-lg">
                              {profileName
                                ? profileName
                                    .split(" ")
                                    .map((w) => w[0])
                                    .join("")
                                    .slice(0, 2)
                                    .toUpperCase()
                                : "BY"}
                            </div>
                          )}
                          {uploadingPic && (
                            <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 mb-1">
                            Profile Picture
                          </p>
                          <p className="text-xs text-gray-500 mb-1">
                            JPG, PNG or WebP. Max 5MB.
                          </p>
                          <div className="flex items-center gap-2">
                            <label className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white text-sm font-bold rounded-xl hover:bg-emerald-600 transition-colors cursor-pointer">
                              <Camera className="w-4 h-4" />
                              {uploadingPic ? "Uploading..." : "Upload"}
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleUploadPic}
                                className="hidden"
                                disabled={uploadingPic}
                              />
                            </label>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-gray-900"
                          placeholder="Enter your full name"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            Phone
                          </label>
                          <input
                            type="text"
                            value={profilePhone}
                            onChange={(e) => setProfilePhone(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-gray-900"
                            placeholder="Phone number"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            Email
                          </label>
                          <input
                            type="email"
                            value={user?.email || ""}
                            disabled
                            className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
                          />
                          <p className="text-xs text-gray-400 mt-1">
                            Email cannot be changed
                          </p>
                        </div>
                      </div>

                      {/* Address Details */}
                      <div className="pt-2">
                        <h4 className="text-sm font-bold text-gray-900 mb-3">
                          Address Details
                        </h4>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                              Society / Apartment
                            </label>
                            <input
                              type="text"
                              value={profileSociety}
                              onChange={(e) => setProfileSociety(e.target.value)}
                              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-gray-900"
                              placeholder="Enter society or apartment name"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2">
                                Block / Tower
                              </label>
                              <input
                                type="text"
                                value={profileBlock}
                                onChange={(e) => setProfileBlock(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-gray-900"
                                placeholder="Block or tower"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2">
                                Flat Number
                              </label>
                              <input
                                type="text"
                                value={profileFlat}
                                onChange={(e) => setProfileFlat(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-gray-900"
                                placeholder="Flat number"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2">
                                City
                              </label>
                              <input
                                type="text"
                                value={profileCity}
                                onChange={(e) => setProfileCity(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-gray-900"
                                placeholder="City"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2">
                                State
                              </label>
                              <input
                                type="text"
                                value={profileState}
                                onChange={(e) => setProfileState(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-gray-900"
                                placeholder="State"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2">
                                Country
                              </label>
                              <input
                                type="text"
                                value={profileCountry}
                                onChange={(e) => setProfileCountry(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-gray-900"
                                placeholder="Country"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={handleSaveProfile}
                        disabled={savingProfile}
                        className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg disabled:opacity-50 cursor-pointer border-none"
                      >
                        {savingProfile ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : activeSection === "browse" ? (
              /* ========== BROWSE ========== */
              <div>
                {/* Nearby Me Search */}
                <div className="mb-8 bg-white border border-gray-200/60 rounded-2xl p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-extrabold text-gray-900 mb-1">
                        Find Businesses Near You
                      </h3>
                      <p className="text-sm text-gray-500">
                        Search by location, society, or area
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (navigator.geolocation) {
                          navigator.geolocation.getCurrentPosition(
                            (pos) => {
                              const { latitude, longitude } = pos.coords;
                              searchProfiles({
                                lat: latitude,
                                lng: longitude,
                                radius_km: 10,
                                page_size: 12,
                              })
                                .then((result) => {
                                  setNearbyBusinesses(result.items || []);
                                })
                                .catch(() => {});
                            },
                            () => {},
                            { enableHighAccuracy: true, timeout: 10000 }
                          );
                        }
                      }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-sm rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md cursor-pointer border-none"
                    >
                      <MapPin className="w-4 h-4" /> Nearby Me
                    </button>
                  </div>
                  {nearbyBusinesses.length > 0 && (
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {nearbyBusinesses.slice(0, 6).map((biz) => (
                        <Link
                          key={biz.id}
                          to={`/enduser/business/${biz.slug || ""}`}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors no-underline"
                        >
                          {biz.logo_url ? (
                            <img
                              src={biz.logo_url}
                              alt=""
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-bold">
                              {(biz.business_name || "?")[0]}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">
                              {biz.business_name}
                            </p>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {biz.city || "Near you"}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mb-6">
                  <h3 className="text-xl font-extrabold text-gray-900 mb-2">
                    Browse Categories
                  </h3>
                  <p className="text-sm text-gray-500">
                    Explore businesses by category or browse all listings
                  </p>
                </div>
                {categories.length === 0 ? (
                  <div className="bg-white border border-gray-200/60 rounded-2xl p-12 text-center">
                    <Store className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium text-gray-600">Loading categories...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                    {categories.map((cat) => (
                      <Link
                        key={cat.id}
                        to={`/categories/${cat.id}`}
                        className="bg-white border border-gray-200/60 rounded-2xl p-5 hover:shadow-lg transition-all group text-center no-underline"
                      >
                        <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                          {cat.logo_url ? (
                            <img
                              src={cat.logo_url}
                              alt=""
                              className="w-12 h-12 rounded-xl object-cover"
                            />
                          ) : (
                            <Tag className="w-6 h-6 text-emerald-500" />
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-gray-900">{cat.name}</h4>
                        {cat.business_count !== undefined && (
                          <p className="text-xs text-gray-500 mt-1">
                            {cat.business_count} businesses
                          </p>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
                <div className="text-center">
                  <Link
                    to="/categories"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-md no-underline"
                  >
                    <Globe className="w-4 h-4" /> Browse All Categories
                  </Link>
                </div>
              </div>
            ) : activeSection === "browse-services" ? (
              <BuyerServiceManagement />
            ) : activeSection === "requirements" ? (
              /* ========== MY REQUIREMENTS ========== */
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-extrabold text-gray-900">
                    My Requirements
                  </h3>
                  <button
                    onClick={() => {
                      setReqForm({
                        title: "",
                        description: "",
                        subcategory_id: "",
                        budget_min: "",
                        budget_max: "",
                      });
                      setReqFormCat("");
                      setSubcategories([]);
                      setReqMessage("");
                      setShowReqModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-md cursor-pointer border-none"
                  >
                    <Plus className="w-4 h-4" /> New Requirement
                  </button>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
                    <Search className="w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search requirements..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="outline-none text-sm text-gray-900 bg-transparent border-none"
                    />
                  </div>
                  <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="outline-none text-sm text-gray-700 bg-transparent border-none cursor-pointer"
                    >
                      <option value="ALL">All Status</option>
                      <option value="OPEN">Open</option>
                      <option value="FULFILLED">Fulfilled</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                  </div>
                </div>

                {filteredRequirements.length === 0 ? (
                  <div className="bg-white border border-gray-200/60 rounded-2xl p-12 text-center">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium text-gray-600">
                      {requirements.length === 0
                        ? "No requirements yet"
                        : "No matching requirements"}
                    </p>
                    <p className="text-sm text-gray-400 mt-1 mb-4">
                      {requirements.length === 0
                        ? "Post your first requirement to connect with sellers"
                        : "Try adjusting your filters"}
                    </p>
                    {requirements.length === 0 && (
                      <button
                        onClick={() => setShowReqModal(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-md cursor-pointer border-none"
                      >
                        <Plus className="w-4 h-4" /> Post Requirement
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200/60 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200/60">
                            {["Title", "Description", "Status", "Budget", "Date", "Actions"].map(
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
                          {filteredRequirements.map((req) => (
                            <tr
                              key={req.id}
                              className="hover:bg-gray-50/50 transition-colors"
                            >
                              <td className="px-6 py-4">
                                <span className="text-sm font-bold text-gray-900">
                                  {req.title}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate">
                                {req.description || "—"}
                              </td>
                              <td className="px-6 py-4">
                                <StatusBadge status={req.status} />
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-700">
                                {req.budget_min || req.budget_max
                                  ? `₹${req.budget_min || 0} - ₹${req.budget_max || "∞"}`
                                  : "—"}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                {req.created_at
                                  ? new Date(req.created_at).toLocaleDateString()
                                  : "—"}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  {req.status === "OPEN" && (
                                    <select
                                      value={req.status}
                                      onChange={(e) =>
                                        handleUpdateRequirementStatus(req.id, e.target.value)
                                      }
                                      className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 cursor-pointer"
                                    >
                                      <option value="OPEN">Open</option>
                                      <option value="FULFILLED">Fulfilled</option>
                                      <option value="CLOSED">Closed</option>
                                    </select>
                                  )}
                                  {deleteConfirm === req.id ? (
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => handleDeleteRequirement(req.id)}
                                        className="text-xs text-red-600 font-bold cursor-pointer border-none bg-red-50 px-2 py-1 rounded hover:bg-red-100"
                                      >
                                        Confirm
                                      </button>
                                      <button
                                        onClick={() => setDeleteConfirm(null)}
                                        className="text-xs text-gray-500 font-bold cursor-pointer border-none bg-gray-50 px-2 py-1 rounded hover:bg-gray-100"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setDeleteConfirm(req.id)}
                                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors cursor-pointer border-none bg-transparent"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {reqHasMore && (
                      <div className="p-4 text-center border-t border-gray-200/60">
                        <button
                          onClick={() => {
                            setReqPage((p) => p + 1);
                            loadRequirements(false);
                          }}
                          className="text-sm font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer border-none bg-transparent"
                        >
                          Load More
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Create Requirement Modal */}
                {showReqModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                      className="absolute inset-0 bg-black/50"
                      onClick={() => setShowReqModal(false)}
                    />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                      <div className="flex items-center justify-between p-5 border-b border-gray-200">
                        <h3 className="text-lg font-bold text-gray-900">
                          New Requirement
                        </h3>
                        <button
                          onClick={() => setShowReqModal(false)}
                          className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 cursor-pointer border-none bg-transparent"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="p-5 space-y-4">
                        {reqMessage && (
                          <div
                            className={`p-3 rounded-xl text-sm text-center ${
                              reqMessage.includes("success")
                                ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                                : "bg-red-50 border border-red-200 text-red-700"
                            }`}
                          >
                            {reqMessage}
                          </div>
                        )}
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">
                            Title *
                          </label>
                          <input
                            type="text"
                            value={reqForm.title}
                            onChange={(e) =>
                              setReqForm({ ...reqForm, title: e.target.value })
                            }
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-gray-900"
                            placeholder="e.g. Need 50 office chairs"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">
                            Description
                          </label>
                          <textarea
                            rows="3"
                            value={reqForm.description}
                            onChange={(e) =>
                              setReqForm({ ...reqForm, description: e.target.value })
                            }
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-gray-900 resize-none"
                            placeholder="Describe what you need..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">
                            Category
                          </label>
                          <select
                            value={reqFormCat}
                            onChange={(e) => handleSubcategoryLoad(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-gray-900"
                          >
                            <option value="">Select category</option>
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        {subcategories.length > 0 && (
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">
                              Subcategory
                            </label>
                            <select
                              value={reqForm.subcategory_id}
                              onChange={(e) =>
                                setReqForm({
                                  ...reqForm,
                                  subcategory_id: e.target.value,
                                })
                              }
                              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-gray-900"
                            >
                              <option value="">Select subcategory</option>
                              {subcategories.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">
                            Budget (₹)
                          </label>
                          <input
                            type="number"
                            value={reqForm.budget}
                            onChange={(e) =>
                              setReqForm({ ...reqForm, budget: e.target.value })
                            }
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-gray-900"
                            placeholder="0"
                          />
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                          <button
                            onClick={() => setShowReqModal(false)}
                            className="px-5 py-2.5 text-sm font-bold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer border-none"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleCreateRequirement}
                            disabled={reqSaving || !reqForm.title.trim()}
                            className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg disabled:opacity-50 cursor-pointer border-none"
                          >
                            {reqSaving ? "Posting..." : "Post Requirement"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : activeSection === "leads" ? (
              /* ========== MY LEADS ========== */
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-extrabold text-gray-900">My Leads</h3>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
                    <Search className="w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search leads..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="outline-none text-sm text-gray-900 bg-transparent border-none"
                    />
                  </div>
                  <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="outline-none text-sm text-gray-700 bg-transparent border-none cursor-pointer"
                    >
                      <option value="ALL">All Status</option>
                      <option value="NEW">New</option>
                      <option value="CONTACTED">Contacted</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                  </div>
                </div>

                {filteredLeads.length === 0 ? (
                  <div className="bg-white border border-gray-200/60 rounded-2xl p-12 text-center">
                    <ArrowRight className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium text-gray-600">
                      {leads.length === 0 ? "No leads sent yet" : "No matching leads"}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      {leads.length === 0
                        ? "Browse businesses and send enquiries to get leads"
                        : "Try adjusting your filters"}
                    </p>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200/60 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200/60">
                            {["Business", "Seller", "Status", "Message", "Date"].map(
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
                          {filteredLeads.map((lead) => (
                            <tr
                              key={lead.id}
                              className="hover:bg-gray-50/50 transition-colors"
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                                    {lead.business_logo ? (
                                      <img
                                        src={lead.business_logo}
                                        alt=""
                                        className="w-10 h-10 rounded-xl object-cover"
                                      />
                                    ) : (
                                      <Store className="w-5 h-5 text-emerald-500" />
                                    )}
                                  </div>
                                  <span className="text-sm font-bold text-gray-900">
                                    {lead.business_name || lead.seller_name || "Seller"}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-700">
                                {lead.seller_name || "—"}
                              </td>
                              <td className="px-6 py-4">
                                <StatusBadge status={lead.status} />
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate">
                                {lead.message || lead.enquiry_message || "—"}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                {lead.created_at
                                  ? new Date(lead.created_at).toLocaleDateString()
                                  : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {leadHasMore && (
                      <div className="p-4 text-center border-t border-gray-200/60">
                        <button
                          onClick={() => {
                            setLeadPage((p) => p + 1);
                            loadLeads(false);
                          }}
                          className="text-sm font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer border-none bg-transparent"
                        >
                          Load More
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : activeSection === "reviews" ? (
              /* ========== MY REVIEWS ========== */
              <div>
                <h3 className="text-xl font-extrabold text-gray-900 mb-6">
                  My Reviews
                </h3>
                {reviews.length === 0 ? (
                  <div className="bg-white border border-gray-200/60 rounded-2xl p-12 text-center">
                    <Star className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium text-gray-600">No reviews yet</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Reviews will appear here after you rate businesses
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="bg-white border border-gray-200/60 rounded-2xl p-5"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                              <Star className="w-5 h-5 text-amber-500" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-gray-900">
                                {rev.business_name || rev.seller_name || "Business"}
                              </h4>
                              <p className="text-xs text-gray-500">
                                {rev.created_at
                                  ? new Date(rev.created_at).toLocaleDateString()
                                  : ""}
                              </p>
                            </div>
                          </div>
                          <RatingStars rating={rev.rating || rev.review?.rating || 0} />
                        </div>
                        {(rev.review_comment || rev.review?.comment) && (
                          <p className="mt-3 text-sm text-gray-600">
                            {rev.review_comment || rev.review?.comment}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : activeSection === "enquiries" ? (
              <BuyerEnquiries />
            ) : activeSection === "quotations" ? (
              <BuyerQuotations />
            ) : activeSection === "favorites" ? (
              /* ========== FAVORITES ========== */
              <div>
                <h3 className="text-xl font-extrabold text-gray-900 mb-6">
                  Saved Businesses
                </h3>
                {favorites.length === 0 ? (
                  <div className="bg-white border border-gray-200/60 rounded-2xl p-12 text-center">
                    <Heart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium text-gray-600">No favorites yet</p>
                    <p className="text-sm text-gray-400 mt-1 mb-4">
                      Save businesses to quickly find them later
                    </p>
                    <Link
                      to="/categories"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-md no-underline"
                    >
                      <Search className="w-4 h-4" /> Browse Businesses
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {favorites.map((fav) => (
                      <div
                        key={fav.id}
                        className="bg-white border border-gray-200/60 rounded-2xl overflow-hidden hover:shadow-lg transition-all group"
                      >
                        <div className="p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                                {fav.logo_url || fav.target_logo ? (
                                  <img
                                    src={fav.logo_url || fav.target_logo}
                                    alt=""
                                    className="w-10 h-10 rounded-xl object-cover"
                                  />
                                ) : (
                                  <Store className="w-5 h-5 text-emerald-500" />
                                )}
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-gray-900">
                                  {fav.business_name || fav.target_name || "Business"}
                                </h4>
                                <p className="text-xs text-gray-500">
                                  {fav.category || fav.target_type || ""}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() =>
                                handleToggleFavorite(
                                  fav.target_type || "BUSINESS",
                                  fav.target_id || fav.business_id
                                )
                              }
                              className="p-1.5 text-red-400 hover:text-red-500 transition-colors cursor-pointer border-none bg-transparent"
                            >
                              <Heart className="w-5 h-5 fill-red-400" />
                            </button>
                          </div>
                          {fav.city && (
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {fav.city}
                            </p>
                          )}
                          <div className="pt-3 mt-3 border-t border-gray-100">
                            <Link
                              to={`/enduser/business/${fav.slug || fav.target_slug || ""}`}
                              className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors no-underline"
                            >
                              <Eye className="w-3.5 h-3.5" /> View Business
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : activeSection === "best-seller-requests" ? (
              <BestSellerRequests />
            ) : activeSection === "trending-product-requests" ? (
              <TrendingProductRequests />
            ) : activeSection === "my-videos" ? (
              <BuyerVideoManagement />
            ) : activeSection === "messages" ? (
              /* ========== MESSAGES ========== */
              <div className="flex h-[calc(100vh-120px)] bg-white border border-gray-200/60 rounded-2xl overflow-hidden">
                {/* Conversation List */}
                <div
                  className={`w-full md:w-80 border-r border-gray-200 flex flex-col ${
                    activeConversation ? "hidden md:flex" : "flex"
                  }`}
                >
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-sm font-bold text-gray-900">Messages</h3>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {conversations.length === 0 ? (
                      <div className="p-6 text-center">
                        <MessageSquare className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm text-gray-500">No conversations yet</p>
                      </div>
                    ) : (
                      conversations.map((conv) => (
                        <button
                          key={conv.id || conv.user_id}
                          onClick={() => {
                            setActiveConversation(conv);
                            setMessages([]);
                          }}
                          className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors cursor-pointer border-none text-left ${
                            (activeConversation?.id || activeConversation?.user_id) ===
                            (conv.id || conv.user_id)
                              ? "bg-emerald-50"
                              : "bg-transparent"
                          }`}
                        >
                          <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                            {(conv.sender_name || conv.user_name || "U")
                              .split(" ")
                              .map((w) => w[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-gray-900 truncate">
                                {conv.sender_name || conv.user_name || "User"}
                              </span>
                              {conv.unread_count > 0 && (
                                <span className="w-5 h-5 bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0">
                                  {conv.unread_count}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 truncate">
                              {conv.last_message || conv.last_content || "Start conversation"}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Message View */}
                <div
                  className={`flex-1 flex flex-col ${
                    activeConversation ? "flex" : "hidden md:flex"
                  }`}
                >
                  {activeConversation ? (
                    <>
                      {/* Chat Header */}
                      <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-3">
                        <button
                          onClick={() => setActiveConversation(null)}
                          className="md:hidden p-1.5 text-gray-400 hover:text-gray-600 cursor-pointer border-none bg-transparent"
                        >
                          <ArrowRight className="w-5 h-5 rotate-180" />
                        </button>
                        <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center text-white font-bold text-xs">
                          {(activeConversation.sender_name ||
                            activeConversation.user_name ||
                            "U")
                            .split(" ")
                            .map((w) => w[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-gray-900">
                            {activeConversation.sender_name ||
                              activeConversation.user_name ||
                              "User"}
                          </h4>
                        </div>
                      </div>

                      {/* Messages */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {msgLoading ? (
                          <div className="flex items-center justify-center h-32">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
                          </div>
                        ) : messages.length === 0 ? (
                          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                            No messages yet. Say hello!
                          </div>
                        ) : (
                          messages.map((msg, idx) => {
                            const isMine =
                              msg.sender_id === user?.id ||
                              msg.is_mine;
                            return (
                              <div
                                key={msg.id || idx}
                                className={`flex ${
                                  isMine ? "justify-end" : "justify-start"
                                }`}
                              >
                                <div
                                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                                    isMine
                                      ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-br-md"
                                      : "bg-gray-100 text-gray-900 rounded-bl-md"
                                  }`}
                                >
                                  <p>{msg.content || msg.text || ""}</p>
                                  <p
                                    className={`text-[10px] mt-1 ${
                                      isMine ? "text-emerald-100" : "text-gray-400"
                                    }`}
                                  >
                                    {msg.created_at
                                      ? new Date(msg.created_at).toLocaleTimeString([], {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })
                                      : ""}
                                  </p>
                                </div>
                              </div>
                            );
                          })
                        )}
                        <div ref={messagesEndRef} />
                      </div>

                      {/* Message Input */}
                      <div className="p-4 border-t border-gray-200">
                        <div className="flex items-center gap-3">
                          <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                            placeholder="Type a message..."
                            className="flex-1 px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-gray-900"
                          />
                          <button
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim() || sendLoading}
                            className="p-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50 cursor-pointer border-none shadow-md"
                          >
                            {sendLoading ? (
                              <Loader className="w-5 h-5 animate-spin" />
                            ) : (
                              <Send className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center">
                        <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <h4 className="text-lg font-bold text-gray-900 mb-1">
                          Select a conversation
                        </h4>
                        <p className="text-sm text-gray-500">
                          Choose a conversation from the left to start chatting
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : activeSection === "settings" ? (
              /* ========== SETTINGS ========== */
              <div className="max-w-2xl mx-auto">
                <h3 className="text-xl font-extrabold text-gray-900 mb-6">Settings</h3>
                <div className="bg-white border border-gray-200/60 rounded-2xl p-6 space-y-6">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-2">Account</h4>
                    <p className="text-sm text-gray-500">
                      Manage your account settings and preferences.
                    </p>
                  </div>
                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="text-sm font-bold text-gray-900 mb-4">
                      Notification Preferences
                    </h4>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer">
                        <span className="text-sm font-medium text-gray-700">
                          Email notifications
                        </span>
                        <div className="w-10 h-6 bg-emerald-500 rounded-full relative">
                          <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 shadow-md" />
                        </div>
                      </label>
                      <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer">
                        <span className="text-sm font-medium text-gray-700">
                          SMS notifications
                        </span>
                        <div className="w-10 h-6 bg-gray-300 rounded-full relative">
                          <div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5 shadow-md" />
                        </div>
                      </label>
                    </div>
                  </div>
                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="text-sm font-bold text-gray-900 mb-2">Danger Zone</h4>
                    <button
                      onClick={handleLogout}
                      className="px-4 py-2 bg-red-50 text-red-600 font-bold text-sm rounded-xl hover:bg-red-100 transition-colors cursor-pointer border-none"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-gray-400">Page coming soon</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
