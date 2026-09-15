import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, MapPin, Star, Phone, MessageCircle, Tag, ArrowRight, Building2, Eye, CheckCircle2, ChevronLeft, ChevronRight, Pause, Play, Grid3X3 } from "lucide-react";
import { searchProfiles, getCategories, getPopularCategories, getFeaturedBusinesses } from "../api";
import { HOME_SLIDES, HOME_SIDEBAR_CHECKLIST, HOME_STATS, WHAT_IS_CARDS, WHY_FEATURES, USES_CARDS, BENEFITS_CARDS, HOW_IT_WORKS_STEPS, CAT_COLORS, CAT_BGS, CAT_TEXTS } from "./sharedViewData";

export default function HomeView() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [businesses, setBusinesses] = useState([]);
  const [businessesLoading, setBusinessesLoading] = useState(true);
  const [popularCategories, setPopularCategories] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryBusinesses, setCategoryBusinesses] = useState([]);
  const [categoryBusinessesLoading, setCategoryBusinessesLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const result = await searchProfiles({ page_size: 6, is_verified: true });
        setBusinesses(result.items || []);
      } catch {} finally { setBusinessesLoading(false); }
    };
    load();
    const loadCats = async () => { try { const r = await getCategories(); setCategoriesList(r || []); } catch {} };
    loadCats();
    const loadPopular = async () => { try { const r = await getPopularCategories(); setPopularCategories(r || []); } catch {} };
    loadPopular();
  }, []);

  useEffect(() => {
    if (isPaused || HOME_SLIDES.length <= 1) return;
    const timer = setInterval(() => setCurrentSlide((p) => (p + 1) % HOME_SLIDES.length), 5000);
    return () => clearInterval(timer);
  }, [isPaused]);

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section — Dual-Pane */}
      <section id="section-home" className="relative bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left Pane: Static Preview Card */}
            <div className="lg:col-span-4 h-[420px] flex flex-col">
              <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/60 border border-gray-100 overflow-hidden flex flex-col h-full">
                <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-5 relative overflow-hidden">
                  <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 200 120">
                    <circle cx="30" cy="25" r="2" fill="#60a5fa" /><circle cx="90" cy="15" r="1.5" fill="#818cf8" />
                    <circle cx="160" cy="35" r="2" fill="#a78bfa" /><circle cx="50" cy="90" r="1.5" fill="#60a5fa" />
                    <circle cx="140" cy="80" r="2" fill="#818cf8" />
                    <line x1="30" y1="25" x2="90" y2="15" stroke="#60a5fa" strokeWidth="0.4" />
                    <line x1="90" y1="15" x2="160" y2="35" stroke="#818cf8" strokeWidth="0.4" />
                  </svg>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
                        <Grid3X3 className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-xs font-bold text-white/80">BizzProfiles</span>
                    </div>
                    <h3 className="text-base font-extrabold text-white leading-snug">Your Business at Your Fingertips</h3>
                  </div>
                </div>
                <div className="p-5 flex-1">
                  <div className="space-y-2.5">
                    {HOME_SIDEBAR_CHECKLIST.map((item) => (
                      <div key={item} className="flex items-center gap-2.5">
                        <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                        <span className="text-xs font-medium text-gray-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="px-5 pb-5">
                  <div className="relative bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl p-4 flex items-center justify-center border border-gray-200/60">
                    <div className="relative w-28 h-48 bg-gray-900 rounded-[1.2rem] p-1.5 shadow-xl">
                      <div className="w-full h-full rounded-[1rem] bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 overflow-hidden flex flex-col items-center justify-center relative">
                        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-black rounded-full" />
                        <Grid3X3 className="w-5 h-5 text-white/90 mb-1" />
                        <span className="text-[7px] font-bold text-white/90 leading-none">BizzProfiles</span>
                        <div className="mt-2 w-14 h-1 bg-white/25 rounded-full" />
                        <div className="mt-1 w-10 h-1 bg-white/15 rounded-full" />
                        <div className="mt-3 w-16 bg-white/20 rounded-lg p-1.5">
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-white/30 rounded" />
                            <div className="flex-1 space-y-0.5">
                              <div className="w-full h-0.5 bg-white/25 rounded" />
                              <div className="w-3/4 h-0.5 bg-white/20 rounded" />
                            </div>
                          </div>
                        </div>
                        <div className="mt-1.5 w-16 bg-white/20 rounded-lg p-1.5">
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-white/30 rounded" />
                            <div className="flex-1 space-y-0.5">
                              <div className="w-full h-0.5 bg-white/25 rounded" />
                              <div className="w-3/4 h-0.5 bg-white/20 rounded" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-indigo-500/15 rounded-full blur-lg" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Pane: Automated Carousel */}
            <div
              className="relative rounded-3xl overflow-hidden shadow-2xl shadow-gray-900/15 border border-gray-100 h-[420px] lg:col-span-8 bg-gray-900"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {HOME_SLIDES.map((slide, i) => (
                <div key={i} className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${currentSlide === i ? "opacity-100 z-10" : "opacity-0 z-0"}`}>
                  <img src={slide.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  <div className={`absolute inset-0 bg-gradient-to-r ${slide.bg} opacity-80`} />
                  <div className="relative z-10 h-full flex flex-col justify-center px-10 py-12">
                    <div className="flex items-center gap-2 mb-5">
                      <div className="w-9 h-9 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
                        <Grid3X3 className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-sm font-bold text-white/90 tracking-tight">BizzProfiles</span>
                    </div>
                    <h2 className="text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-4 max-w-lg">{slide.headline}</h2>
                    <p className="text-white/75 text-sm leading-relaxed mb-6 max-w-md">{slide.subtitle}</p>
                    <button
                      onClick={() => {
                        const target = slide.headline.includes("E-Catalogue") || slide.headline.includes("Feature")
                          ? "/businesses"
                          : slide.headline.includes("Verified")
                          ? "/auth/enduser"
                          : "/auth/customer";
                        navigate(target);
                      }}
                      className="self-start inline-flex items-center gap-2 px-7 py-3 bg-white text-gray-900 font-bold text-sm rounded-xl hover:bg-gray-100 transition-colors cursor-pointer border-none shadow-lg"
                    >
                      {slide.cta} <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              <button onClick={() => setCurrentSlide((prev) => (prev - 1 + HOME_SLIDES.length) % HOME_SLIDES.length)} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/15 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/25 transition-colors cursor-pointer border border-white/20">
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <button onClick={() => setCurrentSlide((prev) => (prev + 1) % HOME_SLIDES.length)} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/15 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/25 transition-colors cursor-pointer border border-white/20">
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5">
                {HOME_SLIDES.map((_, i) => (
                  <button key={i} onClick={() => setCurrentSlide(i)} className={`rounded-full transition-all duration-300 cursor-pointer border-none ${currentSlide === i ? "w-7 h-2.5 bg-white" : "w-2.5 h-2.5 bg-white/35 hover:bg-white/55"}`} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What Is Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What is BizzProfiles?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Your trusted platform to find and connect with verified businesses</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {WHAT_IS_CARDS.map((card, i) => {
              const Icon = card.icon === "ShieldCheck" ? ShieldCheck : card.icon === "Eye" ? Eye : card.icon === "Building2" ? Building2 : Tag;
              return (
                <div key={i} className="p-6 bg-gray-50 rounded-2xl hover:shadow-lg transition-all">
                  <div className={`w-12 h-12 ${CAT_BGS[i % CAT_BGS.length]} rounded-xl flex items-center justify-center mb-4`}>
                    <Icon className={`w-6 h-6 ${CAT_COLORS[i % CAT_COLORS.length]}`} />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{card.title}</h3>
                  <p className="text-sm text-gray-600">{card.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose BizzProfiles?</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {WHY_FEATURES.map((feature, i) => (
              <div key={i} className="p-6 bg-white rounded-2xl border border-gray-200 hover:shadow-lg transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="font-bold text-gray-900">{feature.title}</h3>
                </div>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Popular Categories</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {popularCategories.map((cat, i) => (
              <button key={cat.id || i} onClick={() => handleCategoryClick(cat)} className="p-4 bg-gray-50 rounded-2xl hover:shadow-lg transition-all cursor-pointer border-none text-left">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${CAT_BGS[i % CAT_BGS.length]} rounded-xl flex items-center justify-center`}>
                    <Tag className={`w-5 h-5 ${CAT_COLORS[i % CAT_COLORS.length]}`} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{cat.name}</p>
                    <p className="text-xs text-gray-500">{cat.subcategory_count || 0} services</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Businesses */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Businesses</h2>
          </div>
          {businessesLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
                  <div className="h-3 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {businesses.map((biz) => (
                <a key={biz.id} href={`/enduser/business/${biz.slug}`} className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all no-underline">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md">
                      {biz.business_name?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "BZ"}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-gray-900">{biz.business_name}</h3>
                        {biz.is_verified && <ShieldCheck className="w-4 h-4 text-blue-500" />}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="w-3 h-3" />
                        <span>{biz.city || "Location"}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4">{biz.description || "No description available"}</p>
                  <div className="flex items-center gap-2">
                    {biz.phone && <a href={`tel:${biz.phone}`} onClick={(e) => e.stopPropagation()} className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center hover:bg-emerald-200 transition-colors"><Phone className="w-4 h-4 text-emerald-600" /></a>}
                    {biz.phone && <a href={`https://wa.me/${biz.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center hover:bg-green-200 transition-colors"><MessageCircle className="w-4 h-4 text-green-600" /></a>}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Category Detail Modal */}
      {categoryModalOpen && selectedCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50" onClick={() => setCategoryModalOpen(false)}>
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">{selectedCategory.name}</h3>
                <button onClick={() => setCategoryModalOpen(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 cursor-pointer border-none">✕</button>
              </div>
            </div>
            <div className="p-6">
              {categoryBusinessesLoading ? (
                <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
              ) : categoryBusinesses.length > 0 ? (
                <div className="space-y-3">
                  {categoryBusinesses.map((biz) => (
                    <a key={biz.id} href={`/enduser/business/${biz.slug}`} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors no-underline">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xs">{biz.business_name?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5"><span className="text-sm font-bold text-gray-900 truncate">{biz.business_name}</span>{biz.is_verified && <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />}</div>
                        <div className="flex items-center gap-1 text-xs text-gray-500"><MapPin className="w-3 h-3" /><span>{biz.city}</span></div>
                      </div>
                    </a>
                  ))}
                </div>
              ) : <p className="text-center text-gray-500 py-8">No businesses in this category yet.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
