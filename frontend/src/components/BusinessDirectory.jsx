import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search,
  MapPin,
  ChevronDown,
  Filter,
  RotateCcw,
  Briefcase,
  ShieldCheck,
  Tag,
  Building2,
  Star,
  Phone,
  MessageCircle,
  Grid3X3,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { searchProfiles, getCategories } from "../api";
import { COUNTRIES, getStatesForCountry, getCitiesForState } from "./locationData";

const CATEGORY_COLORS = {
  1: "from-pink-500 to-rose-600",
  2: "from-sky-500 to-blue-600",
  3: "from-emerald-500 to-green-600",
  4: "from-red-500 to-rose-600",
  5: "from-violet-500 to-purple-600",
  6: "from-amber-500 to-orange-600",
  7: "from-slate-500 to-gray-700",
  8: "from-indigo-500 to-blue-700",
};

const CATEGORY_BG = {
  1: "bg-pink-50",
  2: "bg-sky-50",
  3: "bg-emerald-50",
  4: "bg-red-50",
  5: "bg-violet-50",
  6: "bg-amber-50",
  7: "bg-slate-50",
  8: "bg-indigo-50",
};

const CATEGORY_TEXT = {
  1: "text-pink-600",
  2: "text-sky-600",
  3: "text-emerald-600",
  4: "text-red-600",
  5: "text-violet-600",
  6: "text-amber-600",
  7: "text-slate-600",
  8: "text-indigo-600",
};

export default function BusinessDirectory() {
  const [searchParams] = useSearchParams();
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);

  // Filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  useEffect(() => {
    const urlQ = searchParams.get("q");
    if (urlQ) {
      setSearchQuery(urlQ);
      loadBusinesses({ q: urlQ });
    } else {
      loadBusinesses();
    }
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadBusinesses = async (params = {}) => {
    setLoading(true);
    try {
      const result = await searchProfiles({ page_size: 24, ...params });
      setBusinesses(result.items || []);
    } catch (err) {
      console.error("Failed to load businesses:", err);
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const result = await getCategories();
      setCategories(result || []);
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  };

  const handleApplyFilters = () => {
    const params = {};
    if (searchQuery.trim()) params.q = searchQuery;
    if (selectedCategory) params.category_id = selectedCategory;
    if (selectedCity) params.city = selectedCity;
    loadBusinesses(params);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setSelectedCountry("");
    setSelectedState("");
    setSelectedCity("");
    loadBusinesses();
  };

  const getCategoryColor = (catId) => CATEGORY_COLORS[catId] || "from-gray-500 to-gray-600";
  const getCategoryBg = (catId) => CATEGORY_BG[catId] || "bg-gray-50";
  const getCategoryText = (catId) => CATEGORY_TEXT[catId] || "text-gray-600";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Banner Section ── */}
      <div className="bg-gradient-to-br from-gray-900 via-slate-900 to-indigo-950 relative overflow-hidden">
        <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 800 200">
          <circle cx="100" cy="40" r="2" fill="#60a5fa" />
          <circle cx="250" cy="80" r="3" fill="#818cf8" />
          <circle cx="400" cy="30" r="2" fill="#a78bfa" />
          <circle cx="550" cy="90" r="3" fill="#60a5fa" />
          <circle cx="700" cy="50" r="2" fill="#818cf8" />
          <line x1="100" y1="40" x2="250" y2="80" stroke="#60a5fa" strokeWidth="0.5" />
          <line x1="250" y1="80" x2="400" y2="30" stroke="#818cf8" strokeWidth="0.5" />
          <line x1="400" y1="30" x2="550" y2="90" stroke="#a78bfa" strokeWidth="0.5" />
          <line x1="550" y1="90" x2="700" y2="50" stroke="#60a5fa" strokeWidth="0.5" />
        </svg>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center relative z-10">
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
              <Briefcase className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-white mb-4">
            Businesses
          </h1>
          <p className="text-white/60 text-lg max-w-xl mx-auto">
            Explore All Businesses on BizzProfile
          </p>
        </div>
      </div>

      {/* ── Advanced Filter Bar ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20 mb-10">
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            {/* Search Input */}
            <div className="lg:col-span-2">
              <label className="block text-xs font-bold text-gray-500 mb-1.5">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, location, services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleApplyFilters()}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Category Dropdown */}
            <div className="relative">
              <label className="block text-xs font-bold text-gray-500 mb-1.5">Business Category</label>
              <button
                onClick={() => { setShowCategoryDropdown(!showCategoryDropdown); setShowCityDropdown(false); }}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-left cursor-pointer hover:border-gray-300 transition-colors"
              >
                <span className={selectedCategory ? "text-gray-900" : "text-gray-400"}>
                  {selectedCategory
                    ? categories.find((c) => c.id === Number(selectedCategory))?.name || "All Categories"
                    : "Business Category"}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
              {showCategoryDropdown && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowCategoryDropdown(false)} />
                  <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-40 max-h-60 overflow-y-auto">
                    <button
                      onClick={() => { setSelectedCategory(""); setShowCategoryDropdown(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors cursor-pointer border-none ${
                        !selectedCategory ? "bg-blue-50 text-blue-600 font-bold" : "text-gray-700"
                      }`}
                    >
                      All Categories
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => { setSelectedCategory(cat.id); setShowCategoryDropdown(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors cursor-pointer border-none ${
                          selectedCategory === String(cat.id) ? "bg-blue-50 text-blue-600 font-bold" : "text-gray-700"
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* City Filter */}
            <div className="relative">
              <label className="block text-xs font-bold text-gray-500 mb-1.5">City</label>
              <button
                onClick={() => { setShowCityDropdown(!showCityDropdown); setShowCategoryDropdown(false); }}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-left cursor-pointer hover:border-gray-300 transition-colors"
              >
                <span className={selectedCity ? "text-gray-900" : "text-gray-400"}>
                  {selectedCity || "Choose City"}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
              {showCityDropdown && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowCityDropdown(false)} />
                  <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-40 max-h-60 overflow-y-auto">
                    <button
                      onClick={() => { setSelectedCity(""); setShowCityDropdown(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors cursor-pointer border-none ${
                        !selectedCity ? "bg-blue-50 text-blue-600 font-bold" : "text-gray-700"
                      }`}
                    >
                      All Cities
                    </button>
                    {getCitiesForState(selectedState).map((city) => (
                      <button
                        key={city}
                        onClick={() => { setSelectedCity(city); setShowCityDropdown(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors cursor-pointer border-none ${
                          selectedCity === city ? "bg-blue-50 text-blue-600 font-bold" : "text-gray-700"
                        }`}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleApplyFilters}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md shadow-blue-500/20 cursor-pointer border-none"
              >
                <Filter className="w-4 h-4" />
                Apply
              </button>
              <button
                onClick={handleResetFilters}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-600 font-bold text-sm rounded-xl hover:bg-gray-200 transition-colors cursor-pointer border-none"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Business Listing Grid ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
            <p className="text-sm text-gray-500">Loading businesses...</p>
          </div>
        ) : businesses.length === 0 ? (
          <div className="text-center py-20">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">No businesses found</h3>
            <p className="text-sm text-gray-500 mb-6">Try adjusting your filters or search query.</p>
            <button
              onClick={handleResetFilters}
              className="px-6 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 transition-colors cursor-pointer border-none"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-500">
                Showing <span className="font-bold text-gray-900">{businesses.length}</span> verified businesses
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {businesses.map((biz) => (
                <Link
                  key={biz.id}
                  to={`/enduser/business/${biz.slug}`}
                  className="group bg-white rounded-2xl overflow-hidden shadow-md shadow-gray-200/50 border border-gray-100 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 hover:-translate-y-1 no-underline"
                >
                  {/* Thumbnail Banner */}
                  <div className={`relative h-36 bg-gradient-to-br ${getCategoryColor(biz.category_id)} overflow-hidden`}>
                    <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 300 150">
                      <circle cx="40" cy="30" r="2" fill="white" />
                      <circle cx="120" cy="60" r="3" fill="white" />
                      <circle cx="200" cy="25" r="2" fill="white" />
                      <circle cx="260" cy="80" r="2" fill="white" />
                      <line x1="40" y1="30" x2="120" y2="60" stroke="white" strokeWidth="0.5" />
                      <line x1="120" y1="60" x2="200" y2="25" stroke="white" strokeWidth="0.5" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform duration-300">
                        {biz.logo_url ? (
                          <img src={biz.logo_url} alt="" className="w-10 h-10 object-contain" />
                        ) : (
                          <span className="text-white font-extrabold text-lg">
                            {biz.business_name?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "BZ"}
                          </span>
                        )}
                      </div>
                    </div>
                    {biz.is_verified && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                        <ShieldCheck className="w-3 h-3 text-white" />
                        <span className="text-[10px] font-bold text-white">Verified</span>
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-5">
                    {/* Business Name + Category Badge */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-sm font-extrabold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {biz.business_name}
                      </h3>
                    </div>
                    {biz.category_name && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 ${getCategoryBg(biz.category_id)} ${getCategoryText(biz.category_id)} rounded-full text-[10px] font-bold mb-2`}>
                        <Tag className="w-2.5 h-2.5" />
                        {biz.category_name}
                      </span>
                    )}

                    {/* Location */}
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="line-clamp-1">
                        {[biz.address, biz.city, biz.state, biz.country].filter(Boolean).join(", ") || "Location not set"}
                      </span>
                    </div>

                    {/* Keyword Tags */}
                    {biz.subcategory_name && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {biz.subcategory_name.split(",").slice(0, 3).map((tag, i) => (
                          <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-medium rounded-full">
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-1.5">
                        {biz.phone && (
                          <a
                            href={`tel:${biz.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center hover:bg-emerald-100 transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5 text-emerald-600" />
                          </a>
                        )}
                        {biz.phone && (
                          <a
                            href={`https://wa.me/${biz.phone.replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center hover:bg-green-100 transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-green-600" />
                          </a>
                        )}
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 group-hover:gap-2 transition-all">
                        View Profile <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
