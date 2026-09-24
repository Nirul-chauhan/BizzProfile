import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Search, MapPin, ChevronRight, ChevronLeft, ArrowRight, Star, Phone,
  MessageCircle, ShieldCheck, Building2, ShoppingCart, Truck, Grid3X3,
  Send, Clock, Tag, Eye, X, CheckCircle2,
} from "lucide-react";
import { getCategoryTree, searchProfiles, getBanners, getNearbyProfilesPublic } from "../api";
import { useAuth } from "../context/AuthContext";
import { buyerCreateRequirement, getCategories } from "../api";
import { BestSellersSection, TrendingCategoriesSection, TrendingVideosSection } from "./HomeSections";
import OurServicesSection from "./OurServicesSection";

const CATEGORY_ICONS = {
  heart: "❤️", zap: "⚡", droplets: "💧", hammer: "🔨", settings: "⚙️",
  sparkles: "✨", home: "🏠", shirt: "👕", wrench: "🔧", leaf: "🌿",
  gift: "🎁", box: "📦", gem: "💎", cross: "🏥", flask: "🧪",
  building: "🏗️",
};

const FALLBACK_SLIDES = [
  { headline: "Find Products & Services Near You", subtitle: "Discover verified businesses, products, and services in your area.", cta: "Explore Now", ctaUrl: "/businesses", bg: "bg-gray-900" },
  { headline: "Discover Local Businesses", subtitle: "Connect with trusted sellers and service providers in your neighborhood.", cta: "Browse Businesses", ctaUrl: "/businesses", bg: "bg-gray-800" },
  { headline: "Connect with Buyers and Sellers", subtitle: "Post requirements, compare quotes, and grow your business.", cta: "Start Now", ctaUrl: "/login", bg: "bg-gray-900" },
];

function CategoriesSidebar() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState(null);
  const hideTimer = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    getCategoryTree().then((d) => setCategories(d || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  const handleEnter = (id) => {
    clearTimeout(hideTimer.current);
    setHovered(id);
  };

  const handleLeave = () => {
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setHovered(null), 200);
  };

  if (loading) {
    return (
      <div className="w-full lg:w-60 flex-shrink-0">
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-9 bg-gray-100 rounded-lg animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full lg:w-60 flex-shrink-0">
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900">Categories</h3>
        </div>
        <nav className="max-h-[480px] overflow-y-auto">
          {categories.map((cat) => {
            const hasDropdown =
              (cat.children && cat.children.length > 0) ||
              (cat.subcategories && cat.subcategories.length > 0);
            return (
              <div key={cat.id} className="relative" onMouseEnter={() => setHovered(cat.id)} onMouseLeave={() => setHovered(null)}>
                <button onClick={() => navigate(`/categories/${cat.slug}`)} className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors border-none bg-transparent cursor-pointer">
                  <span className="text-base flex-shrink-0">{CATEGORY_ICONS[cat.icon] || "📁"}</span>
                  <span className="text-sm text-gray-700 flex-1 truncate">{cat.name}</span>
                  {hasDropdown && <ChevronRight className="w-3.5 h-3.5 text-gray-300" />}
                </button>
                {hovered === cat.id && hasDropdown && (
                  <div className="absolute left-full top-0 ml-1 w-60 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-2 hidden lg:block">
                    {cat.children && cat.children.length > 0 && (
                      <div>
                        <p className="px-4 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Categories</p>
                        {cat.children.slice(0, 6).map((child) => (
                          <button key={child.id} onClick={() => navigate(`/categories/${child.slug}`)} className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors border-none bg-transparent cursor-pointer">{child.name}</button>
                        ))}
                      </div>
                    )}
                    {cat.subcategories && cat.subcategories.length > 0 && (
                      <div>
                        <p className="px-4 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Services</p>
                        {cat.subcategories.slice(0, 8).map((sub) => (
                          <button key={sub.id} onClick={() => navigate(`/categories/${cat.slug}/${sub.slug}`)} className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors border-none bg-transparent cursor-pointer">{sub.name}</button>
                        ))}
                      </div>
                    )}
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button onClick={() => navigate(`/categories/${cat.slug}`)} className="w-full text-left px-4 py-2 text-xs font-medium text-gray-400 hover:text-gray-700 border-none bg-transparent cursor-pointer">View all in {cat.name}</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        <div className="border-t border-gray-100 px-4 py-2.5">
          <Link to="/categories" className="text-xs font-medium text-gray-500 hover:text-gray-900 no-underline">View All Categories</Link>
        </div>
      </div>
    </div>
  );
}

function ImageCarousel() {
  const [slides, setSlides] = useState(FALLBACK_SLIDES);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getBanners().then((data) => {
      if (data && data.length > 0) {
        setSlides(data.map((b) => ({ headline: b.title, subtitle: b.subtitle || "", cta: b.cta_text || "Learn More", ctaUrl: b.cta_url || "/businesses", bg: "bg-gray-900", image: b.image_url })));
      }
    }).catch(() => {});
  }, []);

  const next = useCallback(() => setCurrent((p) => (p + 1) % slides.length), [slides.length]);
  const prev = useCallback(() => setCurrent((p) => (p - 1 + slides.length) % slides.length), [slides.length]);

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const t = setInterval(next, 4000);
    return () => clearInterval(t);
  }, [paused, next, slides.length]);

  return (
    <div className="relative rounded-xl overflow-hidden bg-gray-900 border border-gray-200" style={{ height: "clamp(240px, 28vw, 340px)" }} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {slides.map((slide, i) => (
        <div key={i} className={`absolute inset-0 transition-opacity duration-500 ${current === i ? "opacity-100 z-10" : "opacity-0 z-0"}`}>
          {slide.image && <img src={slide.image} alt="" className="absolute inset-0 w-full h-full object-cover" />}
          <div className={`absolute inset-0 ${slide.bg || "bg-gray-900"}`} style={{ opacity: slide.image ? 0.75 : 1 }} />
          <div className="relative z-10 h-full flex flex-col justify-center px-6 md:px-8">
            <h2 className="text-xl md:text-2xl font-extrabold text-white mb-2 max-w-md leading-tight">{slide.headline}</h2>
            <p className="text-sm text-gray-300 mb-4 max-w-sm leading-relaxed">{slide.subtitle}</p>
            <button onClick={() => navigate(slide.ctaUrl || "/businesses")} className="self-start inline-flex items-center gap-2 px-5 py-2.5 bg-white text-gray-900 text-sm font-bold rounded-lg hover:bg-gray-100 transition-colors">
              {slide.cta} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
      <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 border-none cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
      <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 border-none cursor-pointer"><ChevronLeft className="w-4 h-4 rotate-180" /></button>
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
        {slides.map((_, i) => <button key={i} onClick={() => setCurrent(i)} className={`h-1.5 rounded-full transition-all ${current === i ? "w-5 bg-white" : "w-1.5 bg-white/40"}`} />)}
      </div>
    </div>
  );
}

function BuyerSellerBanners() {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useAuth();
  const [showReq, setShowReq] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", city: "", category_id: "" });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [cats, setCats] = useState([]);

  useEffect(() => { getCategories().then((d) => setCats(d || [])).catch(() => {}); }, []);

  const handlePost = () => {
    if (!isAuthenticated) return navigate("/login");
    if (isAdmin) return navigate("/admin/dashboard");
    setShowReq(true);
  };

  const submit = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await buyerCreateRequirement({ title: form.title, description: form.description || undefined, city: form.city || undefined, category_id: form.category_id ? parseInt(form.category_id) : undefined });
      setSuccess(true);
      setForm({ title: "", description: "", city: "", category_id: "" });
      setTimeout(() => { setShowReq(false); setSuccess(false); }, 2000);
    } catch {}
    setSaving(false);
  };

  return (
    <>
      <div className="flex flex-col gap-4 h-full">
        {/* Buyer Card - Colorful */}
        <div className="flex-1 rounded-xl overflow-hidden relative cursor-pointer group" onClick={handlePost}>
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500" />
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-2 right-2 w-16 h-16 rounded-full bg-white/20" />
            <div className="absolute bottom-3 left-3 w-10 h-10 rounded-full bg-white/15" />
            <div className="absolute top-1/2 right-6 w-6 h-6 rounded bg-white/10 rotate-45" />
          </div>
          <div className="relative z-10 p-5 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3">
              <img src="https://img.icons8.com/doodle/48/shopping-cart--v1.png" alt="" className="w-10 h-10 drop-shadow-md" onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
              <div className="hidden items-center justify-center"><ShoppingCart className="w-7 h-7 text-white" /></div>
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Looking for Products?</h3>
            <p className="text-[11px] text-white/70 leading-relaxed mb-3">Find verified sellers & best deals near you</p>
            <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-indigo-700 text-xs font-bold rounded-lg group-hover:bg-white/90 transition-colors">
              Post Requirement <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Seller Card - Colorful */}
        <div className="flex-1 rounded-xl overflow-hidden relative cursor-pointer group" onClick={() => navigate("/auth/enduser")}>
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500" />
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-3 left-3 w-14 h-14 rounded-full bg-white/20" />
            <div className="absolute bottom-2 right-4 w-8 h-8 rounded bg-white/15 rotate-12" />
            <div className="absolute top-1/3 right-2 w-5 h-5 rounded-full bg-white/10" />
          </div>
          <div className="relative z-10 p-5 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3">
              <img src="https://img.icons8.com/doodle/48/sell--v1.png" alt="" className="w-10 h-10 drop-shadow-md" onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
              <div className="hidden items-center justify-center"><Truck className="w-7 h-7 text-white" /></div>
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Sell on BizzProfile</h3>
            <p className="text-[11px] text-white/70 leading-relaxed mb-3">List products & reach thousands of buyers</p>
            <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-emerald-700 text-xs font-bold rounded-lg group-hover:bg-white/90 transition-colors">
              Join as Seller <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>
      {showReq && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => !saving && setShowReq(false)}>
          <div className="bg-white rounded-xl max-w-lg w-full shadow-xl border border-gray-200" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">Post Your Requirement</h3>
              <button onClick={() => setShowReq(false)} className="text-gray-400 hover:text-gray-600 border-none bg-transparent cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            {success ? (
              <div className="p-8 text-center"><CheckCircle2 className="w-10 h-10 text-gray-900 mx-auto mb-3" /><h4 className="text-base font-bold text-gray-900">Requirement Posted!</h4></div>
            ) : (
              <div className="p-6 space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Title *</label><input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Looking for 50 office chairs" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">City</label><input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Category</label><select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"><option value="">Select</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                </div>
                <div className="flex gap-3 pt-3 border-t border-gray-100">
                  <button onClick={() => setShowReq(false)} className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 border-none cursor-pointer">Cancel</button>
                  <button onClick={submit} disabled={saving || !form.title.trim()} className="flex-1 py-2.5 text-sm font-bold text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50 border-none cursor-pointer">{saving ? "Posting..." : "Post"}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function BusinessesNearYouSection() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usedGeo, setUsedGeo] = useState(false);

  useEffect(() => {
    const fallback = () => searchProfiles({ page_size: 8 }).then((r) => setBusinesses(r.items || [])).catch(() => {}).finally(() => setLoading(false));
    if (!navigator.geolocation) return fallback();
    navigator.geolocation.getCurrentPosition(
      (pos) => { setUsedGeo(true); getNearbyProfilesPublic(pos.coords.latitude, pos.coords.longitude, 25, 1, 8).then((r) => setBusinesses(r.items || [])).catch(() => {}).finally(() => setLoading(false)); },
      () => fallback(),
      { enableHighAccuracy: false, timeout: 5000 }
    );
  }, []);

  return (
    <section className="py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-5">
          <div><h2 className="text-lg font-extrabold text-gray-900">{usedGeo ? "Services Near You" : "Featured Businesses"}</h2><p className="text-sm text-gray-500 mt-0.5">{usedGeo ? "Verified businesses in your area" : "Verified businesses ready to serve you"}</p></div>
          <Link to="/businesses" className="text-sm font-medium text-gray-500 hover:text-gray-900 flex items-center gap-1 no-underline">View All <ArrowRight className="w-4 h-4" /></Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{[1,2,3,4].map(i => <div key={i} className="bg-white border border-gray-200 rounded-xl h-44 animate-pulse" />)}</div>
        ) : businesses.length === 0 ? (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-xl"><Building2 className="w-8 h-8 text-gray-300 mx-auto mb-2" /><p className="text-gray-500 text-sm">No businesses found yet.</p></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {businesses.map((biz) => (
              <Link key={biz.id} to={`/enduser/business/${biz.slug}`} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-all no-underline group">
                {biz.cover_image_url ? <img src={biz.cover_image_url} alt="" className="w-full h-24 object-cover" /> : <div className="w-full h-24 bg-gray-100 flex items-center justify-center"><Building2 className="w-6 h-6 text-gray-300" /></div>}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {biz.logo_url ? <img src={biz.logo_url} alt="" className="w-8 h-8 rounded-lg object-cover" /> : <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 text-sm font-bold">{(biz.business_name || "?")[0]}</div>}
                    <div className="flex-1 min-w-0"><div className="flex items-center gap-1"><span className="text-sm font-bold text-gray-900 truncate group-hover:text-indigo-600">{biz.business_name}</span>{biz.is_verified && <ShieldCheck className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />}</div></div>
                  </div>
                  {biz.description && <p className="text-xs text-gray-500 truncate mb-2">{biz.description}</p>}
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    {biz.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{biz.city}</span>}
                    {biz.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{biz.phone}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function PostRequirementCTA() {
  return (
    <section className="py-10 bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3">Can't find what you're looking for?</h2>
        <p className="text-sm text-gray-400 mb-6 max-w-lg mx-auto">Post your requirement and let verified sellers come to you with the best quotes.</p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/login" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 text-sm font-bold rounded-lg hover:bg-gray-100 transition-colors"><Send className="w-4 h-4" /> Post Requirement</Link>
          <Link to="/businesses" className="inline-flex items-center gap-2 px-6 py-3 border border-gray-600 text-white text-sm font-bold rounded-lg hover:bg-white/10 transition-colors">Browse Businesses</Link>
        </div>
      </div>
    </section>
  );
}

function ValueAddsSection() {
  const features = [
    { icon: ShieldCheck, title: "Verified Profiles", desc: "Every business profile is verified for authenticity and trust." },
    { icon: MapPin, title: "Local Discovery", desc: "Find businesses and services in your neighborhood." },
    { icon: MessageCircle, title: "Direct Communication", desc: "Connect directly with businesses through the platform." },
    { icon: Star, title: "Ratings & Reviews", desc: "Make informed decisions based on real customer feedback." },
    { icon: Tag, title: "Competitive Quotes", desc: "Compare quotes from multiple sellers for the best deal." },
    { icon: Eye, title: "Transparent Listings", desc: "See complete business details, products, and services." },
  ];
  return (
    <section className="py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8"><h2 className="text-lg font-extrabold text-gray-900">Why BizzProfiles?</h2><p className="text-sm text-gray-500 mt-1">Everything you need to find the right business partner</p></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mb-3"><f.icon className="w-5 h-5 text-gray-600" /></div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">{f.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div><div className="flex items-center gap-2 mb-3"><Grid3X3 className="w-5 h-5 text-gray-400" /><span className="text-sm font-bold text-white">BizzProfiles</span></div><p className="text-xs leading-relaxed">Your trusted B2B marketplace for finding verified businesses, products, and services.</p></div>
          <div><h4 className="text-xs font-bold text-white mb-3 uppercase tracking-wider">Platform</h4><div className="space-y-2"><Link to="/businesses" className="block text-xs hover:text-white transition-colors">Browse Businesses</Link><Link to="/categories" className="block text-xs hover:text-white transition-colors">Categories</Link><Link to="/login" className="block text-xs hover:text-white transition-colors">Post Requirement</Link></div></div>
          <div><h4 className="text-xs font-bold text-white mb-3 uppercase tracking-wider">Company</h4><div className="space-y-2"><Link to="/about" className="block text-xs hover:text-white transition-colors">About Us</Link><Link to="/contact" className="block text-xs hover:text-white transition-colors">Contact</Link><Link to="/privacy" className="block text-xs hover:text-white transition-colors">Privacy Policy</Link><Link to="/terms" className="block text-xs hover:text-white transition-colors">Terms</Link></div></div>
          <div><h4 className="text-xs font-bold text-white mb-3 uppercase tracking-wider">For Business</h4><div className="space-y-2"><Link to="/auth/enduser" className="block text-xs hover:text-white transition-colors">Sell on BizzProfile</Link><Link to="/auth/customer" className="block text-xs hover:text-white transition-colors">Join as Buyer</Link></div></div>
        </div>
        <hr className="my-6 border-gray-800" />
        <p className="text-xs text-center text-gray-500">&copy; {new Date().getFullYear()} BizzProfiles. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default function PublicView() {
  return (
    <div className="min-h-screen bg-gray-50">
      <section className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-4">
          <div className="hidden lg:block"><CategoriesSidebar /></div>
          <div className="flex-1 min-w-0"><ImageCarousel /></div>
          <div className="hidden lg:block w-64 flex-shrink-0"><BuyerSellerBanners /></div>
        </div>
      </section>
      <BestSellersSection />
      <TrendingCategoriesSection />
      <TrendingVideosSection />
      <OurServicesSection />
      <BusinessesNearYouSection />
      <PostRequirementCTA />
      <ValueAddsSection />
      <Footer />
    </div>
  );
}
