import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  LayoutDashboard,
  UserCircle,
  Package,
  Briefcase,
  Inbox,
  ClipboardList,
  MessageSquare,
  Star,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Camera,
  ShieldCheck,
  Clock,
  ChevronDown,
  ChevronRight,
  Bell,
  Send,
  Search,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Image as ImageIcon,
  ToggleLeft,
  ToggleRight,
  Calendar,
  Mail,
  Phone,
  Globe,
  MapPin,
  Loader,
  FileText,
  Tag,
  MessageCircle,
  ShoppingBag,
  ArrowUpRight,
  BarChart,
  Users,
  TrendingUp,
  Eye as EyeIcon,
  UserCheck,
  Star as StarIcon,
  Filter,
  RefreshCw,
  Play,
} from "lucide-react";
import {
  sellerGetDashboard,
  sellerGetProfile,
  sellerCreateProfile,
  sellerUpdateProfile,
  sellerListProducts,
  sellerGetProduct,
  sellerCreateProduct,
  sellerUpdateProduct,
  sellerDeleteProduct,
  sellerGetProductImages,
  sellerAddProductImage,
  sellerDeleteProductImage,
  sellerListEnquiries,
  sellerGetEnquiry,
  sellerUpdateEnquiryStatus,
  sellerCreateQuotation,
  sellerListQuotations,
  sellerListRequirements,
  sellerGetRequirement,
  sellerGetConversations,
  sellerGetMessages,
  sellerSendMessage,
  sellerMarkRead,
  sellerGetSocialLinks,
  sellerCreateSocialLink,
  sellerDeleteSocialLink,
  sellerGetDocuments,
  sellerGetBusinessHours,
  sellerUpsertBusinessHours,
  sellerGetReviews,
  getCategories,
  getCategoryTree,
} from "../api";
import SellerVideoManagement from "./SellerVideoManagement";
import SellerServiceManagement from "./SellerServiceManagement";
import SellerQuotations from "./SellerQuotations";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "profile", label: "My Profile", icon: UserCircle },
  { id: "products", label: "My Products", icon: Package },
  { id: "my-services", label: "My Services", icon: Briefcase },
  { id: "my-videos", label: "My Videos", icon: Play },
  { id: "enquiries", label: "Enquiries", icon: Inbox },
  { id: "quotations", label: "My Quotations", icon: FileText },
  { id: "requirements", label: "Requirements", icon: ClipboardList },
  { id: "messages", label: "Messages", icon: MessageSquare },
  { id: "reviews", label: "Reviews", icon: Star },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_INDEX = { monday: 0, tuesday: 1, wednesday: 2, thursday: 3, friday: 4, saturday: 5, sunday: 6 };

const EMPTY_PRODUCT = {
  name: "",
  description: "",
  price: "",
  category_id: "",
  subcategory_id: "",
  is_best_seller: false,
  is_active: true,
  stock_quantity: "",
  unit: "",
  min_order_quantity: "",
};

function Spinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <div className="bg-white border border-gray-200/60 rounded-2xl p-12 text-center">
      <Icon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
      <p className="font-medium text-gray-600">{title}</p>
      {description && <p className="text-sm text-gray-400 mt-1 mb-4">{description}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-md cursor-pointer border-none"
        >
          <Plus className="w-4 h-4" /> {actionLabel}
        </button>
      )}
    </div>
  );
}

function Message({ type, text }) {
  if (!text) return null;
  return (
    <div
      className={`p-3 rounded-xl text-sm text-center flex items-center gap-2 justify-center ${
        type === "success"
          ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
          : "bg-red-50 border border-red-200 text-red-700"
      }`}
    >
      {type === "success" ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
      {text}
    </div>
  );
}

export default function SellerDashboard() {
  const navigate = useNavigate();
  const { section } = useParams();
  const [activeSection, setActiveSection] = useState(section || "dashboard");
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Dashboard
  const [dashboardData, setDashboardData] = useState(null);

  // Profile
  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({
    business_name: "",
    description: "",
    phone: "",
    email: "",
    website: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    category_id: "",
    subcategory_id: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: "", text: "" });
  const [socialLinks, setSocialLinks] = useState([]);
  const [newSocialPlatform, setNewSocialPlatform] = useState("");
  const [newSocialUrl, setNewSocialUrl] = useState("");

  // Products
  const [products, setProducts] = useState([]);
  const [productPage, setProductPage] = useState(1);
  const [productTotal, setProductTotal] = useState(0);
  const [productForm, setProductForm] = useState({ ...EMPTY_PRODUCT });
  const [editingProduct, setEditingProduct] = useState(null);
  const [productMsg, setProductMsg] = useState({ type: "", text: "" });
  const [savingProduct, setSavingProduct] = useState(false);
  const [productImages, setProductImages] = useState({});
  const [showProductForm, setShowProductForm] = useState(false);
  const [imageUploadProduct, setImageUploadProduct] = useState(null);
  const [newImageUrl, setNewImageUrl] = useState("");

  // Enquiries
  const [enquiries, setEnquiries] = useState([]);
  const [enquiryPage, setEnquiryPage] = useState(1);
  const [enquiryTotal, setEnquiryTotal] = useState(0);
  const [enquiryFilter, setEnquiryFilter] = useState("");
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [quotationForm, setQuotationForm] = useState({ amount: "", description: "", valid_until: "" });
  const [sendingQuotation, setSendingQuotation] = useState(false);
  const [enquiryMsg, setEnquiryMsg] = useState({ type: "", text: "" });

  // Requirements
  const [requirements, setRequirements] = useState([]);
  const [reqPage, setReqPage] = useState(1);
  const [reqTotal, setReqTotal] = useState(0);
  const [selectedRequirement, setSelectedRequirement] = useState(null);

  // Messages
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  // Reviews (from dashboard)
  const [reviews, setReviews] = useState([]);

  // Settings
  const [businessHours, setBusinessHours] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [editingHours, setEditingHours] = useState(null);
  const [hoursForm, setHoursForm] = useState({ open_time: "09:00", close_time: "18:00", is_closed: false });
  const [savingHours, setSavingHours] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState({ type: "", text: "" });

  // Categories
  const [categories, setCategories] = useState([]);
  const [categoryTree, setCategoryTree] = useState([]);

  // Auth
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        navigate("/login");
      }
    } else {
      navigate("/login");
    }
  }, [navigate]);

  // Sync section param
  useEffect(() => {
    if (section && NAV_ITEMS.find((n) => n.id === section)) {
      setActiveSection(section);
    }
  }, [section]);

  // Load categories
  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
    getCategoryTree().then(setCategoryTree).catch(() => {});
  }, []);

  // Load section data
  useEffect(() => {
    if (!user) return;
    loadSectionData();
  }, [activeSection, user]);

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
        case "products":
          await loadProducts();
          break;
        case "enquiries":
          await loadEnquiries();
          break;
        case "requirements":
          await loadRequirements();
          break;
        case "messages":
          await loadConversations();
          break;
        case "reviews":
          await loadDashboard();
          break;
        case "analytics":
          await loadDashboard();
          break;
        case "settings":
          await loadBusinessHours();
          await loadDocuments();
          break;
        default:
          break;
      }
    } catch (err) {
      console.error("Failed to load section:", err);
    } finally {
      setLoading(false);
    }
  };

  // ─── DASHBOARD ────────────────────────────────────────────────────────────
  const loadDashboard = async () => {
    try {
      const data = await sellerGetDashboard();
      setDashboardData(data);
    } catch {
      setDashboardData({});
    }
    // Load reviews separately
    try {
      const reviewsData = await sellerGetReviews();
      setReviews(reviewsData.items || []);
      if (reviewsData.average_rating) {
        setDashboardData((prev) => ({ ...prev, average_rating: reviewsData.average_rating }));
      }
    } catch {
      // Reviews load failed silently
    }
  };

  // ─── PROFILE ──────────────────────────────────────────────────────────────
  const loadProfile = async () => {
    try {
      const [profileData, linksData] = await Promise.all([
        sellerGetProfile(),
        sellerGetSocialLinks(),
      ]);
      setProfile(profileData);
      setProfileForm({
        business_name: profileData?.business_name || "",
        description: profileData?.description || "",
        phone: profileData?.phone || "",
        email: profileData?.email || "",
        website: profileData?.website || "",
        address: profileData?.address || "",
        city: profileData?.city || "",
        state: profileData?.state || "",
        country: profileData?.country || "India",
        category_id: profileData?.category_id ?? "",
        subcategory_id: profileData?.subcategory_id ?? "",
      });
      setSocialLinks(linksData || []);
    } catch {
      setProfile(null);
    }
  };

  const handleSaveProfile = async () => {
    if (!profileForm.business_name.trim()) {
      setProfileMsg({ type: "error", text: "Business name is required" });
      return;
    }
    if (!profileForm.category_id) {
      setProfileMsg({ type: "error", text: "Please select a category" });
      return;
    }
    setSavingProfile(true);
    setProfileMsg({ type: "", text: "" });
    try {
      const payload = {
        ...profileForm,
        category_id: profileForm.category_id ? parseInt(profileForm.category_id) : null,
        subcategory_id: profileForm.subcategory_id ? parseInt(profileForm.subcategory_id) : null,
      };
      if (profile) {
        await sellerUpdateProfile(payload);
      } else {
        await sellerCreateProfile(payload);
      }
      setProfileMsg({ type: "success", text: "Profile saved successfully!" });
      await loadProfile();
      setTimeout(() => setProfileMsg({ type: "", text: "" }), 3000);
    } catch (err) {
      setProfileMsg({ type: "error", text: err.message || "Failed to save profile" });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddSocialLink = async () => {
    if (!newSocialPlatform.trim() || !newSocialUrl.trim()) return;
    try {
      await sellerCreateSocialLink(newSocialPlatform, newSocialUrl);
      setNewSocialPlatform("");
      setNewSocialUrl("");
      const links = await sellerGetSocialLinks();
      setSocialLinks(links || []);
    } catch (err) {
      setProfileMsg({ type: "error", text: err.message || "Failed to add link" });
    }
  };

  const handleDeleteSocialLink = async (id) => {
    try {
      await sellerDeleteSocialLink(id);
      setSocialLinks((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      setProfileMsg({ type: "error", text: err.message || "Failed to delete link" });
    }
  };

  // ─── PRODUCTS ─────────────────────────────────────────────────────────────
  const loadProducts = async (page = 1) => {
    try {
      const data = await sellerListProducts(page);
      setProducts(data?.items || data || []);
      setProductTotal(data?.total || 0);
      setProductPage(page);
      for (const p of data?.items || data || []) {
        try {
          const imgs = await sellerGetProductImages(p.id);
          setProductImages((prev) => ({ ...prev, [p.id]: imgs || [] }));
        } catch {
          setProductImages((prev) => ({ ...prev, [p.id]: [] }));
        }
      }
    } catch {
      setProducts([]);
    }
  };

  const handleSaveProduct = async () => {
    if (!productForm.name.trim()) {
      setProductMsg({ type: "error", text: "Product name is required" });
      return;
    }
    if (!productForm.category_id) {
      setProductMsg({ type: "error", text: "Please select a category" });
      return;
    }
    if (!productForm.price) {
      setProductMsg({ type: "error", text: "Price is required" });
      return;
    }
    setSavingProduct(true);
    setProductMsg({ type: "", text: "" });
    try {
      const payload = {
        ...productForm,
        price: productForm.price ? parseFloat(productForm.price) : null,
        category_id: productForm.category_id ? parseInt(productForm.category_id) : null,
        subcategory_id: productForm.subcategory_id ? parseInt(productForm.subcategory_id) : null,
        price_unit: productForm.unit || null,
        stock_quantity: productForm.stock_quantity ? parseInt(productForm.stock_quantity) : null,
        min_order_quantity: productForm.min_order_quantity ? parseInt(productForm.min_order_quantity) : null,
      };
      if (editingProduct) {
        await sellerUpdateProduct(editingProduct.id, payload);
      } else {
        await sellerCreateProduct(payload);
      }
      setProductMsg({ type: "success", text: editingProduct ? "Product updated!" : "Product created!" });
      setProductForm({ ...EMPTY_PRODUCT });
      setEditingProduct(null);
      setShowProductForm(false);
      await loadProducts(productPage);
      setTimeout(() => setProductMsg({ type: "", text: "" }), 3000);
    } catch (err) {
      setProductMsg({ type: "error", text: err.message || "Failed to save product" });
    } finally {
      setSavingProduct(false);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    const parentCat = (categoryTree.length ? categoryTree : categories).find((c) =>
      c.subcategories?.some((s) => s.id === product.subcategory_id)
    );
    setProductForm({
      name: product.name || "",
      description: product.description || "",
      price: product.price || "",
      category_id: parentCat?.id || product.category_id || "",
      subcategory_id: product.subcategory_id || "",
      is_best_seller: product.is_best_seller || false,
      is_active: product.is_active !== false,
      stock_quantity: product.stock_quantity || "",
      unit: product.price_unit || product.unit || "",
      min_order_quantity: product.min_order_quantity || "",
    });
    setShowProductForm(true);
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await sellerDeleteProduct(id);
      await loadProducts(productPage);
    } catch (err) {
      setProductMsg({ type: "error", text: err.message || "Failed to delete product" });
    }
  };

  const handleAddProductImage = async (productId, imageUrl) => {
    try {
      await sellerAddProductImage(productId, imageUrl);
      const imgs = await sellerGetProductImages(productId);
      setProductImages((prev) => ({ ...prev, [productId]: imgs || [] }));
    } catch (err) {
      setProductMsg({ type: "error", text: err.message || "Failed to add image" });
    }
  };

  const handleDeleteProductImage = async (imageId, productId) => {
    try {
      await sellerDeleteProductImage(imageId);
      const imgs = await sellerGetProductImages(productId);
      setProductImages((prev) => ({ ...prev, [productId]: imgs || [] }));
    } catch (err) {
      setProductMsg({ type: "error", text: err.message || "Failed to delete image" });
    }
  };

  // ─── ENQUIRIES ────────────────────────────────────────────────────────────
  const loadEnquiries = async (page = 1) => {
    try {
      const data = await sellerListEnquiries(page, 20, enquiryFilter || null);
      setEnquiries(data?.items || data || []);
      setEnquiryTotal(data?.total || 0);
      setEnquiryPage(page);
    } catch {
      setEnquiries([]);
    }
  };

  const handleUpdateEnquiryStatus = async (id, status) => {
    try {
      await sellerUpdateEnquiryStatus(id, status);
      await loadEnquiries(enquiryPage);
      if (selectedEnquiry?.id === id) {
        setSelectedEnquiry({ ...selectedEnquiry, status });
      }
    } catch (err) {
      setEnquiryMsg({ type: "error", text: err.message || "Failed to update status" });
    }
  };

  const handleSendQuotation = async () => {
    if (!selectedEnquiry) return;
    if (!quotationForm.amount || !quotationForm.description) {
      setEnquiryMsg({ type: "error", text: "Amount and message are required" });
      return;
    }
    setSendingQuotation(true);
    setEnquiryMsg({ type: "", text: "" });
    try {
      await sellerCreateQuotation({
        enquiry_id: selectedEnquiry.id,
        amount: parseFloat(quotationForm.amount),
        description: quotationForm.description,
        valid_until: quotationForm.valid_until || null,
      });
      setEnquiryMsg({ type: "success", text: "Quotation sent!" });
      setQuotationForm({ amount: "", description: "", valid_until: "" });
      await handleUpdateEnquiryStatus(selectedEnquiry.id, "REPLIED");
      setTimeout(() => setEnquiryMsg({ type: "", text: "" }), 3000);
    } catch (err) {
      setEnquiryMsg({ type: "error", text: err.message || "Failed to send quotation" });
    } finally {
      setSendingQuotation(false);
    }
  };

  // ─── REQUIREMENTS ─────────────────────────────────────────────────────────
  const loadRequirements = async (page = 1) => {
    try {
      const data = await sellerListRequirements(page);
      setRequirements(data?.items || data || []);
      setReqTotal(data?.total || 0);
      setReqPage(page);
    } catch {
      setRequirements([]);
    }
  };

  const handleViewRequirement = async (id) => {
    try {
      const data = await sellerGetRequirement(id);
      setSelectedRequirement(data);
    } catch {}
  };

  // ─── MESSAGES ─────────────────────────────────────────────────────────────
  const loadConversations = async () => {
    try {
      const data = await sellerGetConversations();
      setConversations(data || []);
    } catch {
      setConversations([]);
    }
  };

  const loadMessages = async (userId) => {
    try {
      const data = await sellerGetMessages(userId);
      setMessages(data || []);
      setActiveConversation(userId);
      await sellerMarkRead(userId);
    } catch {
      setMessages([]);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeConversation) return;
    setSendingMessage(true);
    try {
      await sellerSendMessage(activeConversation, newMessage);
      setNewMessage("");
      await loadMessages(activeConversation);
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSendingMessage(false);
    }
  };

  // ─── BUSINESS HOURS ───────────────────────────────────────────────────────
  const loadBusinessHours = async () => {
    try {
      const data = await sellerGetBusinessHours();
      setBusinessHours(data || []);
    } catch {
      setBusinessHours([]);
    }
  };

  const loadDocuments = async () => {
    try {
      const data = await sellerGetDocuments();
      setDocuments(Array.isArray(data) ? data : data.items || []);
    } catch {
      setDocuments([]);
    }
  };

  const handleSaveHours = async (day) => {
    setSavingHours(true);
    setSettingsMsg({ type: "", text: "" });
    try {
      await sellerUpsertBusinessHours(DAY_INDEX[day], hoursForm);
      setSettingsMsg({ type: "success", text: `${day.charAt(0).toUpperCase() + day.slice(1)} hours saved!` });
      setEditingHours(null);
      await loadBusinessHours();
      setTimeout(() => setSettingsMsg({ type: "", text: "" }), 3000);
    } catch (err) {
      setSettingsMsg({ type: "error", text: err.message || "Failed to save hours" });
    } finally {
      setSavingHours(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  // ─── SUB-CATEGORY HELPER ──────────────────────────────────────────────────
  const getSubcategoriesForCategory = useCallback(
    (categoryId) => {
      if (!categoryId) return [];
      const cat = categoryTree.find((c) => c.id === parseInt(categoryId));
      return cat?.subcategories || [];
    },
    [categoryTree]
  );

  const navigateToSection = (id) => {
    setActiveSection(id);
    setSidebarOpen(false);
    navigate(`/seller/dashboard/${id}`, { replace: true });
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#0a2540] flex flex-col shadow-xl transform transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-xl flex items-center justify-center shadow-lg">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-extrabold text-lg leading-tight">BizzProfile</h1>
              <p className="text-emerald-300 text-[10px] font-medium">Seller Portal</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/60 hover:text-white cursor-pointer border-none bg-transparent">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigateToSection(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer border-none ${
                  isActive
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                    : "text-emerald-200 hover:bg-white/10 hover:text-white bg-transparent"
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
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between shadow-sm sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl cursor-pointer border-none bg-transparent">
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-gray-900 capitalize">{activeSection}</h2>
              <p className="text-xs text-gray-500">
                {user?.full_name || "Seller"}
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[9px] font-bold ml-1.5">SELLER</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer border-none bg-transparent"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                  {user?.full_name?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "SE"}
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:block">{user?.full_name || "Seller"}</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
              {showProfileMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-bold text-gray-900">{user?.full_name}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[9px] font-bold">SELLER</span>
                    </div>
                    <button
                      onClick={() => { navigateToSection("profile"); setShowProfileMenu(false); }}
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <Spinner />
          ) : (
            <>
              {/* ═══════════════════ DASHBOARD ═══════════════════ */}
              {activeSection === "dashboard" && (
                <div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                    {[
                      { label: "Total Products", value: dashboardData?.total_products ?? 0, icon: Package, bg: "bg-blue-50", iconColor: "text-blue-500" },
                      { label: "Active Products", value: dashboardData?.active_products ?? 0, icon: Package, bg: "bg-blue-50", iconColor: "text-blue-600" },
                      { label: "Total Services", value: dashboardData?.total_services ?? 0, icon: Briefcase, bg: "bg-emerald-50", iconColor: "text-emerald-500" },
                      { label: "New Enquiries", value: dashboardData?.new_enquiries ?? 0, icon: Inbox, bg: "bg-amber-50", iconColor: "text-amber-500" },
                      { label: "Pending Quotations", value: dashboardData?.pending_quotations ?? 0, icon: FileText, bg: "bg-violet-50", iconColor: "text-violet-500" },
                    ].map((m) => {
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

                  {/* Quick Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white border border-gray-200/60 rounded-2xl p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-lg font-extrabold text-gray-900">{dashboardData?.accepted_quotations ?? 0}</p>
                          <p className="text-xs text-gray-500">Accepted Quotations</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white border border-gray-200/60 rounded-2xl p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                          <Briefcase className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-lg font-extrabold text-gray-900">{dashboardData?.active_services ?? 0}</p>
                          <p className="text-xs text-gray-500">Active Services</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white border border-gray-200/60 rounded-2xl p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                          <ShieldCheck className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                          <p className="text-lg font-extrabold text-gray-900">{dashboardData?.profile_completion ?? 0}%</p>
                          <p className="text-xs text-gray-500">Profile Complete</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-white border border-gray-200/60 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>
                    {dashboardData?.recent_activity?.length > 0 ? (
                      <div className="space-y-3">
                        {dashboardData.recent_activity.map((activity, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                            <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                              {activity.type === "enquiry" ? <Inbox className="w-4 h-4 text-emerald-500" /> :
                               activity.type === "product" ? <Package className="w-4 h-4 text-blue-500" /> :
                               activity.type === "service" ? <Briefcase className="w-4 h-4 text-violet-500" /> :
                               <MessageSquare className="w-4 h-4 text-amber-500" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-700">{activity.message || activity.description || "Activity recorded"}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{activity.created_at ? new Date(activity.created_at).toLocaleDateString() : ""}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm font-medium">No recent activity</p>
                        <p className="text-xs mt-1">Activity from your products and services will appear here</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ═══════════════════ PROFILE ═══════════════════ */}
              {activeSection === "profile" && (
                <div className="max-w-2xl mx-auto">
                  <div className="bg-white border border-gray-200/60 rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-gray-200/60 bg-gradient-to-r from-emerald-500 to-teal-600">
                      <h3 className="text-lg font-bold text-white">Business Profile</h3>
                      <p className="text-sm text-emerald-100">Manage your seller profile and social links</p>
                    </div>
                    <div className="p-6 space-y-5">
                      <Message type={profileMsg.type} text={profileMsg.text} />

                      {/* Verification Badge */}
                      {profile && (
                        <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                          {profile.is_verified ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold bg-emerald-100 text-emerald-700">
                              <ShieldCheck className="w-4 h-4" /> Verified Seller
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold bg-amber-100 text-amber-700">
                              <Clock className="w-4 h-4" /> Pending Verification
                            </span>
                          )}
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Business Name *</label>
                        <input
                          type="text"
                          value={profileForm.business_name}
                          onChange={(e) => setProfileForm({ ...profileForm, business_name: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-gray-900"
                          placeholder="Enter your business name"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">Category *</label>
                          <select
                            value={profileForm.category_id}
                            onChange={(e) => {
                              setProfileForm({ ...profileForm, category_id: e.target.value, subcategory_id: "" });
                            }}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-gray-900"
                          >
                            <option value="">Select category</option>
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">Subcategory</label>
                          <select
                            value={profileForm.subcategory_id}
                            onChange={(e) => setProfileForm({ ...profileForm, subcategory_id: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-gray-900"
                          >
                            <option value="">Select subcategory</option>
                            {getSubcategoriesForCategory(profileForm.category_id).map((s) => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                        <textarea
                          rows="3"
                          value={profileForm.description}
                          onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-gray-900 resize-none"
                          placeholder="Describe your business..."
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">Phone</label>
                          <input
                            type="text"
                            value={profileForm.phone}
                            onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-gray-900"
                            placeholder="Phone number"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                          <input
                            type="email"
                            value={profileForm.email}
                            onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-gray-900"
                            placeholder="Business email"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">Website</label>
                          <input
                            type="url"
                            value={profileForm.website}
                            onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-gray-900"
                            placeholder="https://..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">City</label>
                          <input
                            type="text"
                            value={profileForm.city}
                            onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-gray-900"
                            placeholder="City"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">State</label>
                          <input
                            type="text"
                            value={profileForm.state}
                            onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-gray-900"
                            placeholder="State"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">Country</label>
                          <input
                            type="text"
                            value={profileForm.country}
                            onChange={(e) => setProfileForm({ ...profileForm, country: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-gray-900"
                            placeholder="Country"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Address</label>
                        <input
                          type="text"
                          value={profileForm.address}
                          onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-gray-900"
                          placeholder="Full address"
                        />
                      </div>

                      <button
                        onClick={handleSaveProfile}
                        disabled={savingProfile}
                        className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg disabled:opacity-50 cursor-pointer border-none"
                      >
                        {savingProfile ? "Saving..." : profile ? "Update Profile" : "Create Profile"}
                      </button>
                    </div>
                  </div>

                  {/* Social Links */}
                  <div className="bg-white border border-gray-200/60 rounded-2xl p-6 mt-6">
                    <h4 className="text-sm font-bold text-gray-900 mb-4">Social Links</h4>
                    <div className="space-y-2 mb-4">
                      {socialLinks.length === 0 && (
                        <p className="text-sm text-gray-400">No social links added yet.</p>
                      )}
                      {socialLinks.map((link) => (
                        <div key={link.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-700">{link.platform}</span>
                            <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline flex items-center gap-1">
                              {link.url} <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                          <button
                            onClick={() => handleDeleteSocialLink(link.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors cursor-pointer border-none bg-transparent"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newSocialPlatform}
                        onChange={(e) => setNewSocialPlatform(e.target.value)}
                        className="w-32 px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
                        placeholder="Platform"
                      />
                      <input
                        type="url"
                        value={newSocialUrl}
                        onChange={(e) => setNewSocialUrl(e.target.value)}
                        className="flex-1 px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
                        placeholder="https://..."
                      />
                      <button
                        onClick={handleAddSocialLink}
                        className="px-4 py-2 bg-emerald-500 text-white font-bold text-sm rounded-xl hover:bg-emerald-600 transition-colors cursor-pointer border-none"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══════════════════ PRODUCTS ═══════════════════ */}
              {activeSection === "products" && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-extrabold text-gray-900">My Products</h3>
                    <button
                      onClick={() => { setShowProductForm(true); setEditingProduct(null); setProductForm({ ...EMPTY_PRODUCT }); }}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-md cursor-pointer border-none"
                    >
                      <Plus className="w-4 h-4" /> Add Product
                    </button>
                  </div>

                  <Message type={productMsg.type} text={productMsg.text} />

                  {/* Product Form Modal */}
                  {showProductForm && (
                    <div className="bg-white border border-gray-200/60 rounded-2xl p-6 mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-bold text-gray-900">{editingProduct ? "Edit Product" : "New Product"}</h4>
                        <button onClick={() => { setShowProductForm(false); setEditingProduct(null); }} className="p-1.5 text-gray-400 hover:text-gray-600 cursor-pointer border-none bg-transparent">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="block text-xs font-bold text-gray-700 mb-1">Product Name *</label>
                          <input
                            type="text"
                            value={productForm.name}
                            onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-gray-900"
                            placeholder="Product name"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
                          <textarea
                            rows="2"
                            value={productForm.description}
                            onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-gray-900 resize-none"
                            placeholder="Product description"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">Price</label>
                          <input
                            type="number"
                            value={productForm.price}
                            onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-gray-900"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">Unit</label>
                          <input
                            type="text"
                            value={productForm.unit}
                            onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-gray-900"
                            placeholder="e.g. pcs, kg, litre"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-bold text-gray-700 mb-1">Category *</label>
                          <select
                            value={productForm.category_id}
                            onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value, subcategory_id: "" })}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-gray-900"
                          >
                            <option value="">Select category</option>
                            {(categoryTree.length ? categoryTree : categories).map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">Sub-category</label>
                          <select
                            value={productForm.subcategory_id}
                            onChange={(e) => setProductForm({ ...productForm, subcategory_id: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-gray-900"
                          >
                            <option value="">Select sub-category</option>
                            {getSubcategoriesForCategory(productForm.category_id).map((s) => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">Stock Quantity</label>
                          <input
                            type="number"
                            value={productForm.stock_quantity}
                            onChange={(e) => setProductForm({ ...productForm, stock_quantity: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-gray-900"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">Min Order Qty</label>
                          <input
                            type="number"
                            value={productForm.min_order_quantity}
                            onChange={(e) => setProductForm({ ...productForm, min_order_quantity: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-gray-900"
                            placeholder="1"
                          />
                        </div>
                        <div className="flex items-center gap-4 col-span-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={productForm.is_best_seller}
                              onChange={(e) => setProductForm({ ...productForm, is_best_seller: e.target.checked })}
                              className="w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                            />
                            <span className="text-sm font-medium text-gray-700">Best Seller</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={productForm.is_active}
                              onChange={(e) => setProductForm({ ...productForm, is_active: e.target.checked })}
                              className="w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                            />
                            <span className="text-sm font-medium text-gray-700">Active</span>
                          </label>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 mt-4">
                        <button
                          onClick={() => { setShowProductForm(false); setEditingProduct(null); }}
                          className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer border-none bg-transparent"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveProduct}
                          disabled={savingProduct}
                          className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-md disabled:opacity-50 cursor-pointer border-none"
                        >
                          {savingProduct ? "Saving..." : editingProduct ? "Update" : "Create"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Products Table */}
                  {products.length === 0 && !showProductForm ? (
                    <EmptyState
                      icon={Package}
                      title="No products yet"
                      description="Add your first product to start selling"
                      actionLabel="Add Product"
                      onAction={() => { setShowProductForm(true); setEditingProduct(null); setProductForm({ ...EMPTY_PRODUCT }); }}
                    />
                  ) : (
                    <div className="bg-white border border-gray-200/60 rounded-2xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-200/60">
                              {["Product", "Price", "Stock", "Best Seller", "Status", "Actions"].map((h) => (
                                <th key={h} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200/60">
                            {products.map((p) => (
                              <React.Fragment key={p.id}>
                              <tr className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                      {productImages[p.id]?.[0]?.image_url ? (
                                        <img src={productImages[p.id][0].image_url} alt="" className="w-10 h-10 rounded-xl object-cover" />
                                      ) : (
                                        <Package className="w-5 h-5 text-emerald-500" />
                                      )}
                                    </div>
                                    <div>
                                      <span className="text-sm font-bold text-gray-900">{p.name}</span>
                                      <p className="text-xs text-gray-500 truncate max-w-[200px]">{p.description || "No description"}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-sm font-bold text-gray-900">{p.price ? `₹${p.price}` : "—"}</td>
                                <td className="px-6 py-4 text-sm text-gray-700">{p.stock_quantity ?? "—"}</td>
                                <td className="px-6 py-4">
                                  {p.is_best_seller ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
                                      <Star className="w-3 h-3" /> Best Seller
                                    </span>
                                  ) : (
                                    <span className="text-xs text-gray-400">—</span>
                                  )}
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${p.is_active !== false ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                                    {p.is_active !== false ? "Active" : "Inactive"}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-1">
                                    <button onClick={() => handleEditProduct(p)} className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors cursor-pointer border-none bg-transparent">
                                      <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => { setImageUploadProduct(imageUploadProduct === p.id ? null : p.id); setNewImageUrl(""); }}
                                      className="p-1.5 text-gray-400 hover:text-teal-500 transition-colors cursor-pointer border-none bg-transparent"
                                      title="Add image"
                                    >
                                      <ImageIcon className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDeleteProduct(p.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors cursor-pointer border-none bg-transparent">
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                              {imageUploadProduct === p.id && (
                                <tr key={`img-${p.id}`} className="bg-teal-50/40">
                                  <td className="px-6 py-4" colSpan={6}>
                                    <div className="flex flex-wrap items-center gap-2">
                                      {(productImages[p.id] || []).map((img) => (
                                        <div key={img.id} className="relative group w-14 h-14">
                                          <img src={img.image_url} alt="" className="w-14 h-14 rounded-lg object-cover border border-gray-200" />
                                          <button
                                            onClick={() => handleDeleteProductImage(img.id, p.id)}
                                            className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 cursor-pointer border-none"
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        </div>
                                      ))}
                                      <input
                                        type="text"
                                        value={newImageUrl}
                                        onChange={(e) => setNewImageUrl(e.target.value)}
                                        placeholder="Paste image URL..."
                                        className="flex-1 min-w-[220px] px-3 py-2 bg-white border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                      />
                                      <button
                                        onClick={async () => {
                                          if (!newImageUrl.trim()) return;
                                          await handleAddProductImage(p.id, newImageUrl.trim());
                                          setNewImageUrl("");
                                        }}
                                        className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-md cursor-pointer border-none"
                                      >
                                        Add
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              )}
                              </React.Fragment>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ═══════════════════ ENQUIRIES ═══════════════════ */}
              {activeSection === "enquiries" && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-extrabold text-gray-900">Enquiries Inbox</h3>
                    <div className="flex items-center gap-2">
                      <select
                        value={enquiryFilter}
                        onChange={(e) => { setEnquiryFilter(e.target.value); loadEnquiries(1); }}
                        className="px-3 py-2 bg-white border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                      >
                        <option value="">All</option>
                        <option value="NEW">New</option>
                        <option value="READ">Read</option>
                        <option value="REPLIED">Replied</option>
                        <option value="CLOSED">Closed</option>
                      </select>
                    </div>
                  </div>

                  <Message type={enquiryMsg.type} text={enquiryMsg.text} />

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Enquiry List */}
                    <div className={`${selectedEnquiry ? "hidden lg:block" : ""} lg:col-span-1`}>
                      <div className="bg-white border border-gray-200/60 rounded-2xl overflow-hidden">
                        {enquiries.length === 0 ? (
                          <div className="p-8 text-center text-gray-400">
                            <Inbox className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm font-medium">No enquiries yet</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-200/60 max-h-[600px] overflow-y-auto">
                            {enquiries.map((e) => (
                              <button
                                key={e.id}
                                onClick={() => setSelectedEnquiry(e)}
                                className={`w-full p-4 text-left hover:bg-gray-50 transition-colors cursor-pointer border-none bg-transparent ${
                                  selectedEnquiry?.id === e.id ? "bg-emerald-50 border-l-4 border-l-emerald-500" : ""
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-bold text-gray-900">{e.buyer_name || e.buyer?.full_name || "Buyer"}</span>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    e.status === "NEW" ? "bg-blue-100 text-blue-700" :
                                    e.status === "CONTACTED" ? "bg-amber-100 text-amber-700" :
                                    "bg-gray-100 text-gray-500"
                                  }`}>
                                    {e.status}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 truncate">{e.subject || e.message || "No subject"}</p>
                                <p className="text-[10px] text-gray-400 mt-1">{e.created_at ? new Date(e.created_at).toLocaleDateString() : ""}</p>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Enquiry Detail */}
                    <div className={`${selectedEnquiry ? "" : "hidden lg:block"} lg:col-span-2`}>
                      {selectedEnquiry ? (
                        <div className="bg-white border border-gray-200/60 rounded-2xl p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h4 className="text-lg font-bold text-gray-900">{selectedEnquiry.buyer_name || selectedEnquiry.buyer?.full_name || "Buyer"}</h4>
                              <p className="text-xs text-gray-500">{selectedEnquiry.buyer?.email || ""}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <select
                                value={selectedEnquiry.status}
                                onChange={(e) => handleUpdateEnquiryStatus(selectedEnquiry.id, e.target.value)}
                                className="px-3 py-1.5 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                              >
                                <option value="NEW">New</option>
                                <option value="CONTACTED">Contacted</option>
                                <option value="CLOSED">Closed</option>
                              </select>
                              <button onClick={() => setSelectedEnquiry(null)} className="p-1.5 text-gray-400 hover:text-gray-600 lg:hidden cursor-pointer border-none bg-transparent">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="bg-gray-50 rounded-xl p-4 mb-4">
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedEnquiry.message || "No message"}</p>
                          </div>

                          {selectedEnquiry.product_name && (
                            <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
                              <Package className="w-4 h-4" />
                              Product: <span className="font-medium text-gray-700">{selectedEnquiry.product_name}</span>
                            </div>
                          )}

                          {/* Send Quotation */}
                          <div className="border-t border-gray-200 pt-4 mt-4">
                            <h5 className="text-sm font-bold text-gray-900 mb-3">Send Quotation</h5>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                              <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Amount (₹)</label>
                                <input
                                  type="number"
                                  value={quotationForm.amount}
                                  onChange={(e) => setQuotationForm({ ...quotationForm, amount: e.target.value })}
                                  className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                  placeholder="0.00"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Valid Until</label>
                                <input
                                  type="date"
                                  value={quotationForm.valid_until}
                                  onChange={(e) => setQuotationForm({ ...quotationForm, valid_until: e.target.value })}
                                  className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                />
                              </div>
                            </div>
                            <textarea
                              rows="3"
                              value={quotationForm.description}
                              onChange={(e) => setQuotationForm({ ...quotationForm, description: e.target.value })}
                              className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none mb-3"
                              placeholder="Write your quotation message..."
                            />
                            <button
                              onClick={handleSendQuotation}
                              disabled={sendingQuotation}
                              className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-md disabled:opacity-50 cursor-pointer border-none"
                            >
                              {sendingQuotation ? "Sending..." : "Send Quotation"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white border border-gray-200/60 rounded-2xl p-12 text-center text-gray-400 hidden lg:block">
                          <Inbox className="w-10 h-10 mx-auto mb-3 opacity-50" />
                          <p className="font-medium">Select an enquiry to view details</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ═══════════════════ REQUIREMENTS ═══════════════════ */}
              {activeSection === "requirements" && (
                <div>
                  <h3 className="text-xl font-extrabold text-gray-900 mb-6">Requirements Board</h3>

                  {requirements.length === 0 ? (
                    <EmptyState
                      icon={ClipboardList}
                      title="No requirements available"
                      description="Check back later for buyer requirements"
                    />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {requirements.map((r) => (
                        <div key={r.id} className="bg-white border border-gray-200/60 rounded-2xl p-5 hover:shadow-lg transition-all duration-300">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold text-gray-900 truncate">{r.title || r.subject || "Requirement"}</h4>
                              <p className="text-xs text-gray-500 mt-0.5">{r.buyer_name || r.buyer?.full_name || "Buyer"}</p>
                            </div>
                            {r.category && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold ml-2 flex-shrink-0">
                                {typeof r.category === "string" ? r.category : r.category?.name}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mb-3 line-clamp-3">{r.description || "No description"}</p>
                          {r.budget && (
                            <p className="text-sm font-bold text-emerald-600 mb-2">Budget: ₹{r.budget}</p>
                          )}
                          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                            <span className="text-[10px] text-gray-400">{r.created_at ? new Date(r.created_at).toLocaleDateString() : ""}</span>
                            <button
                              onClick={() => handleViewRequirement(r.id)}
                              className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer border-none bg-transparent"
                            >
                              View Details <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Requirement Detail Modal */}
                  {selectedRequirement && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedRequirement(null)}>
                      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-bold text-gray-900">{selectedRequirement.title || selectedRequirement.subject || "Requirement"}</h4>
                          <button onClick={() => setSelectedRequirement(null)} className="p-1.5 text-gray-400 hover:text-gray-600 cursor-pointer border-none bg-transparent">
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="space-y-3 text-sm">
                          <div>
                            <span className="font-bold text-gray-700">Buyer: </span>
                            <span className="text-gray-600">{selectedRequirement.buyer_name || selectedRequirement.buyer?.full_name || "—"}</span>
                          </div>
                          {selectedRequirement.category && (
                            <div>
                              <span className="font-bold text-gray-700">Category: </span>
                              <span className="text-gray-600">{typeof selectedRequirement.category === "string" ? selectedRequirement.category : selectedRequirement.category?.name}</span>
                            </div>
                          )}
                          {selectedRequirement.budget && (
                            <div>
                              <span className="font-bold text-gray-700">Budget: </span>
                              <span className="text-emerald-600 font-bold">₹{selectedRequirement.budget}</span>
                            </div>
                          )}
                          {selectedRequirement.quantity && (
                            <div>
                              <span className="font-bold text-gray-700">Quantity: </span>
                              <span className="text-gray-600">{selectedRequirement.quantity}</span>
                            </div>
                          )}
                          <div className="pt-3 border-t border-gray-200">
                            <p className="text-gray-700 whitespace-pre-wrap">{selectedRequirement.description || "No description provided."}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ═══════════════════ MESSAGES ═══════════════════ */}
              {activeSection === "messages" && (
                <div>
                  <h3 className="text-xl font-extrabold text-gray-900 mb-6">Messages</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ minHeight: "500px" }}>
                    {/* Conversation List */}
                    <div className={`${activeConversation ? "hidden lg:block" : ""} lg:col-span-1`}>
                      <div className="bg-white border border-gray-200/60 rounded-2xl overflow-hidden">
                        {conversations.length === 0 ? (
                          <div className="p-8 text-center text-gray-400">
                            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm font-medium">No conversations</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-200/60 max-h-[600px] overflow-y-auto">
                            {conversations.map((c) => (
                              <button
                                key={c.user_id || c.id}
                                onClick={() => loadMessages(c.user_id || c.id)}
                                className={`w-full p-4 text-left hover:bg-gray-50 transition-colors cursor-pointer border-none bg-transparent ${
                                  activeConversation === (c.user_id || c.id) ? "bg-emerald-50" : ""
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                                    {c.name?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "??"}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <span className="text-sm font-bold text-gray-900 block truncate">{c.name || "User"}</span>
                                    <p className="text-xs text-gray-500 truncate">{c.last_message || "Start conversation"}</p>
                                  </div>
                                  {c.unread_count > 0 && (
                                    <span className="w-5 h-5 bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0">
                                      {c.unread_count}
                                    </span>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Message View */}
                    <div className={`${activeConversation ? "" : "hidden lg:block"} lg:col-span-2 flex flex-col`}>
                      {activeConversation ? (
                        <div className="bg-white border border-gray-200/60 rounded-2xl flex flex-col flex-1">
                          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                            <h4 className="text-sm font-bold text-gray-900">Conversation</h4>
                            <button onClick={() => setActiveConversation(null)} className="p-1.5 text-gray-400 hover:text-gray-600 lg:hidden cursor-pointer border-none bg-transparent">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[400px]">
                            {messages.length === 0 && (
                              <div className="text-center text-gray-400 py-8">
                                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No messages yet. Say hello!</p>
                              </div>
                            )}
                            {messages.map((m, i) => (
                              <div key={m.id || i} className={`flex ${m.sender_id === user?.id ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                                  m.sender_id === user?.id
                                    ? "bg-emerald-500 text-white rounded-br-md"
                                    : "bg-gray-100 text-gray-900 rounded-bl-md"
                                }`}>
                                  <p>{m.content}</p>
                                  <p className={`text-[10px] mt-1 ${m.sender_id === user?.id ? "text-emerald-100" : "text-gray-400"}`}>
                                    {m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="p-4 border-t border-gray-200">
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                                className="flex-1 px-4 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
                                placeholder="Type a message..."
                                disabled={sendingMessage}
                              />
                              <button
                                onClick={handleSendMessage}
                                disabled={!newMessage.trim() || sendingMessage}
                                className="px-4 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50 cursor-pointer border-none"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white border border-gray-200/60 rounded-2xl p-12 text-center text-gray-400 hidden lg:block">
                          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-50" />
                          <p className="font-medium">Select a conversation</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ═══════════════════ QUOTATIONS ═══════════════════ */}
              {activeSection === "quotations" && <SellerQuotations />}

              {/* ═══════════════════ REVIEWS ═══════════════════ */}
              {activeSection === "reviews" && (
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <h3 className="text-xl font-extrabold text-gray-900">Reviews</h3>
                    {dashboardData?.average_rating && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 rounded-full">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <span className="text-sm font-bold text-amber-700">{dashboardData.average_rating}</span>
                        <span className="text-xs text-amber-500">average</span>
                      </div>
                    )}
                  </div>

                  {reviews.length === 0 ? (
                    <EmptyState
                      icon={Star}
                      title="No reviews yet"
                      description="Reviews from buyers will appear here"
                    />
                  ) : (
                    <div className="space-y-4">
                      {reviews.map((r, i) => (
                        <div key={r.id || i} className="bg-white border border-gray-200/60 rounded-2xl p-5">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                              {r.buyer_name?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "??"}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-bold text-gray-900">{r.buyer_name || r.reviewer_name || "Buyer"}</span>
                                <div className="flex items-center gap-0.5">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <Star
                                      key={s}
                                      className={`w-3.5 h-3.5 ${s <= (r.rating || 0) ? "text-amber-500 fill-amber-500" : "text-gray-200"}`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{r.comment || r.review_text || ""}</p>
                              <p className="text-[10px] text-gray-400 mt-2">{r.created_at ? new Date(r.created_at).toLocaleDateString() : ""}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ═══════════════════ ANALYTICS ═══════════════════ */}
              {activeSection === "analytics" && (
                <div>
                  <h3 className="text-xl font-extrabold text-gray-900 mb-6">Analytics</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[
                      { label: "Total Products", value: dashboardData?.total_products ?? 0, icon: Package, bg: "bg-blue-50", iconColor: "text-blue-500" },
                      { label: "Active Products", value: dashboardData?.active_products ?? 0, icon: Package, bg: "bg-emerald-50", iconColor: "text-emerald-500" },
                      { label: "New Enquiries", value: dashboardData?.new_enquiries ?? 0, icon: Inbox, bg: "bg-violet-50", iconColor: "text-violet-500" },
                      { label: "Accepted Quotations", value: dashboardData?.accepted_quotations ?? 0, icon: CheckCircle2, bg: "bg-amber-50", iconColor: "text-amber-500" },
                    ].map((m) => {
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

                  {/* Business Performance */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    <div className="bg-white border border-gray-200/60 rounded-2xl p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                          <Briefcase className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-lg font-extrabold text-gray-900">{dashboardData?.total_services ?? 0}</p>
                          <p className="text-xs text-gray-500">Total Services</p>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${dashboardData?.total_services ? Math.min((dashboardData.active_services / dashboardData.total_services) * 100, 100) : 0}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-2">{dashboardData?.active_services ?? 0} active</p>
                    </div>
                    <div className="bg-white border border-gray-200/60 rounded-2xl p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                          <ShieldCheck className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                          <p className="text-lg font-extrabold text-gray-900">{dashboardData?.profile_completion ?? 0}%</p>
                          <p className="text-xs text-gray-500">Profile Complete</p>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-amber-500 h-2 rounded-full"
                          style={{ width: `${dashboardData?.profile_completion ?? 0}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        {dashboardData?.verification_status === "verified" ? "Verified seller" : "Pending verification"}
                      </p>
                    </div>
                  </div>

                  {/* Quotation Stats */}
                  <div className="bg-white border border-gray-200/60 rounded-2xl overflow-hidden">
                    <div className="p-5 border-b border-gray-200/60">
                      <h4 className="text-sm font-bold text-gray-900">Quotation Performance</h4>
                    </div>
                    <div className="p-5">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-extrabold text-amber-600">{dashboardData?.pending_quotations ?? 0}</p>
                          <p className="text-xs text-gray-500">Pending</p>
                        </div>
                        <div>
                          <p className="text-2xl font-extrabold text-emerald-600">{dashboardData?.accepted_quotations ?? 0}</p>
                          <p className="text-xs text-gray-500">Accepted</p>
                        </div>
                        <div>
                          <p className="text-2xl font-extrabold text-gray-600">
                            {dashboardData?.accepted_quotations && dashboardData?.pending_quotations
                              ? Math.round((dashboardData.accepted_quotations / (dashboardData.accepted_quotations + dashboardData.pending_quotations)) * 100)
                              : 0}%
                          </p>
                          <p className="text-xs text-gray-500">Acceptance Rate</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══════════════════ MY VIDEOS ═══════════════════ */}
              {activeSection === "my-videos" && (
                <SellerVideoManagement />
              )}

              {/* ═══════════════════ MY SERVICES ═══════════════════ */}
              {activeSection === "my-services" && (
                <SellerServiceManagement />
              )}

              {/* ═══════════════════ SETTINGS ═══════════════════ */}
              {activeSection === "settings" && (
                <div className="max-w-2xl mx-auto">
                  <h3 className="text-xl font-extrabold text-gray-900 mb-6">Settings</h3>

                  <Message type={settingsMsg.type} text={settingsMsg.text} />

                  {/* Business Hours */}
                  <div className="bg-white border border-gray-200/60 rounded-2xl overflow-hidden mb-6">
                    <div className="p-5 border-b border-gray-200/60 bg-gradient-to-r from-emerald-500 to-teal-600">
                      <h4 className="text-sm font-bold text-white">Business Hours</h4>
                      <p className="text-xs text-emerald-100">Set your availability for each day</p>
                    </div>
                    <div className="divide-y divide-gray-200/60">
                      {DAYS.map((day) => {
                        const hours = businessHours.find((h) => h.day_of_week === day);
                        const isEditing = editingHours === day;
                        return (
                          <div key={day} className="px-5 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-bold text-gray-900 capitalize w-24">{day}</span>
                              {hours && !isEditing ? (
                                <span className="text-sm text-gray-600">
                                  {hours.is_closed ? (
                                    <span className="text-red-500 font-medium">Closed</span>
                                  ) : (
                                    `${hours.open_time || "09:00"} — ${hours.close_time || "18:00"}`
                                  )}
                                </span>
                              ) : !hours && !isEditing ? (
                                <span className="text-xs text-gray-400">Not set</span>
                              ) : null}
                            </div>
                            {isEditing ? (
                              <div className="flex items-center gap-2">
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={hoursForm.is_closed}
                                    onChange={(e) => setHoursForm({ ...hoursForm, is_closed: e.target.checked })}
                                    className="w-3.5 h-3.5 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                                  />
                                  <span className="text-xs text-gray-600">Closed</span>
                                </label>
                                {!hoursForm.is_closed && (
                                  <>
                                    <input
                                      type="time"
                                      value={hoursForm.open_time}
                                      onChange={(e) => setHoursForm({ ...hoursForm, open_time: e.target.value })}
                                      className="px-2 py-1 bg-gray-50 border-2 border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                    />
                                    <span className="text-xs text-gray-400">to</span>
                                    <input
                                      type="time"
                                      value={hoursForm.close_time}
                                      onChange={(e) => setHoursForm({ ...hoursForm, close_time: e.target.value })}
                                      className="px-2 py-1 bg-gray-50 border-2 border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                    />
                                  </>
                                )}
                                <button
                                  onClick={() => handleSaveHours(day)}
                                  disabled={savingHours}
                                  className="px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 cursor-pointer border-none"
                                >
                                  {savingHours ? "..." : "Save"}
                                </button>
                                <button
                                  onClick={() => setEditingHours(null)}
                                  className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer border-none bg-transparent"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingHours(day);
                                  setHoursForm({
                                    open_time: hours?.open_time || "09:00",
                                    close_time: hours?.close_time || "18:00",
                                    is_closed: hours?.is_closed || false,
                                  });
                                }}
                                className="px-3 py-1 text-xs font-bold text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer border-none bg-transparent"
                              >
                                {hours ? "Edit" : "Set Hours"}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Documents/Verification */}
                  <div className="bg-white border border-gray-200/60 rounded-2xl overflow-hidden mb-6">
                    <div className="p-5 border-b border-gray-200/60 bg-gradient-to-r from-blue-500 to-indigo-600">
                      <h4 className="text-sm font-bold text-white">Verification Documents</h4>
                      <p className="text-xs text-blue-100">Upload documents to verify your business</p>
                    </div>
                    <div className="p-5">
                      {documents.length === 0 ? (
                        <div className="text-center py-6 text-gray-400">
                          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm font-medium">No documents uploaded</p>
                          <p className="text-xs mt-1">Upload your business registration, GST, or other documents</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {documents.map((doc) => (
                            <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                              <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-blue-500" />
                                <div>
                                  <p className="text-sm font-bold text-gray-900">{doc.file_name}</p>
                                  <p className="text-xs text-gray-500">{doc.document_type} • {(doc.file_size / 1024).toFixed(1)} KB</p>
                                </div>
                              </div>
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                doc.verification_status === "APPROVED" ? "bg-emerald-100 text-emerald-700" :
                                doc.verification_status === "REJECTED" ? "bg-red-100 text-red-700" :
                                "bg-amber-100 text-amber-700"
                              }`}>
                                {doc.verification_status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Account */}
                  <div className="bg-white border border-gray-200/60 rounded-2xl overflow-hidden mb-6">
                    <div className="p-5 border-b border-gray-200/60 bg-gradient-to-r from-gray-700 to-gray-800">
                      <h4 className="text-sm font-bold text-white">Account Settings</h4>
                      <p className="text-xs text-gray-300">Manage your personal information</p>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                          <input
                            type="text"
                            value={user?.full_name || ""}
                            readOnly
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                          <input
                            type="email"
                            value={user?.email || ""}
                            readOnly
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">Role</label>
                          <input
                            type="text"
                            value="Seller"
                            readOnly
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">Phone</label>
                          <input
                            type="tel"
                            value={profileForm.phone || ""}
                            onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
                            placeholder="Phone number"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-400">To change your name or email, please contact support.</p>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="bg-white border border-red-200/60 rounded-2xl p-6">
                    <h4 className="text-sm font-bold text-red-700 mb-2">Danger Zone</h4>
                    <p className="text-sm text-gray-500 mb-4">Once you logout, you will need to log in again.</p>
                    <button
                      onClick={handleLogout}
                      className="px-4 py-2 bg-red-50 text-red-600 font-bold text-sm rounded-xl hover:bg-red-100 transition-colors cursor-pointer border-none"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
