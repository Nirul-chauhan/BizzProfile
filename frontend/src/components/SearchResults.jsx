import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search,
  MapPin,
  Briefcase,
  ShieldCheck,
  Package,
  Grid3X3,
  ArrowRight,
  Loader2,
  Building2,
  Tag,
  GitBranch,
  Flame,
} from "lucide-react";
import { searchAll } from "../api";

function BusinessCard({ biz }) {
  return (
    <Link
      to={`/enduser/business/${biz.slug}`}
      className="group bg-white rounded-2xl overflow-hidden shadow-md shadow-gray-200/50 border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 no-underline"
    >
      <div className="relative h-32 bg-gradient-to-br from-gray-900 via-slate-800 to-indigo-900 overflow-hidden">
        <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 300 150">
          <circle cx="40" cy="30" r="2" fill="white" />
          <circle cx="120" cy="60" r="3" fill="white" />
          <circle cx="200" cy="25" r="2" fill="white" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {biz.logo_url ? (
            <img src={biz.logo_url} alt="" className="w-16 h-16 object-contain bg-white/20 rounded-2xl p-2" />
          ) : (
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
              <Building2 className="w-7 h-7 text-white" />
            </div>
          )}
        </div>
        {biz.is_verified && (
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
            <ShieldCheck className="w-3 h-3 text-white" />
            <span className="text-[10px] font-bold text-white">Verified</span>
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className="text-sm font-extrabold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
          {biz.business_name}
        </h3>
        {biz.category_name && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold mb-2">
            <Tag className="w-2.5 h-2.5" /> {biz.category_name}
          </span>
        )}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
          <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <span className="line-clamp-1">
            {[biz.address, biz.city, biz.state, biz.country].filter(Boolean).join(", ") || "Location not set"}
          </span>
        </div>
        {biz.distance_km != null && (
          <p className="text-[11px] font-bold text-emerald-600 mt-1">{biz.distance_km} km away</p>
        )}
        <div className="flex items-center justify-between pt-3 mt-2 border-t border-gray-100">
          <span className="text-xs font-bold text-gray-400">Business</span>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600">
            View <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function ProductCard({ product }) {
  return (
    <Link
      to={`/products/${product.id}`}
      className="group bg-white rounded-2xl overflow-hidden shadow-md shadow-gray-200/50 border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 no-underline"
    >
      <div className="h-36 bg-gray-50 flex items-center justify-center overflow-hidden">
        {product.primary_image ? (
          <img src={product.primary_image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <Package className="w-10 h-10 text-gray-300" />
        )}
      </div>
      <div className="p-5">
        <h3 className="text-sm font-extrabold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
          {product.name}
        </h3>
        {product.category_name && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold mt-1">
            {product.category_name}
          </span>
        )}
        <p className="text-xs text-gray-500 line-clamp-2 mt-2">{product.description || "No description"}</p>
        <div className="flex items-center justify-between pt-3 mt-2 border-t border-gray-100">
          <div>
            {product.price != null ? (
              <span className="text-sm font-extrabold text-gray-900">₹{product.price}{product.price_unit ? ` / ${product.price_unit}` : ""}</span>
            ) : (
              <span className="text-sm font-bold text-gray-400">Price on request</span>
            )}
            {product.business_name && (
              <p className="text-[10px] text-gray-400 line-clamp-1">{product.business_name}</p>
            )}
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600">
            View <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </div>
    </Link>
  );
}

const GROUP_META = {
  products: { label: "Products", icon: Package, card: (i) => <ProductCard key={i.id} product={i} /> },
  services: { label: "Services", icon: Briefcase, card: (i) => <ServiceCard key={i.id} service={i} /> },
  businesses: { label: "Businesses", icon: Building2, card: (i) => <BusinessCard key={i.id} biz={i} /> },
  categories: { label: "Categories", icon: Grid3X3, card: (i) => <CategoryCard key={i.id} category={i} /> },
  subcategories: { label: "Subcategories", icon: GitBranch, card: (i) => <SubcategoryCard key={i.id} sub={i} /> },
  best_sellers: { label: "Best Sellers", icon: Flame, card: (i) => <ProductCard key={i.id} product={i} /> },
  nearby: { label: "Nearby Results", icon: MapPin, card: (i) => <BusinessCard key={i.id} biz={i} /> },
};

const GROUP_ORDER = [
  "products",
  "services",
  "businesses",
  "categories",
  "subcategories",
  "best_sellers",
  "nearby",
];

function SubcategoryCard({ sub }) {
  return (
    <Link
      to={`/categories/${sub.category_slug}/${sub.slug}`}
      className="group bg-white rounded-2xl shadow-md shadow-gray-200/50 border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 no-underline p-5 flex items-center gap-4"
    >
      <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
        <GitBranch className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-extrabold text-gray-900 group-hover:text-amber-600 transition-colors line-clamp-1">
          {sub.name}
        </h3>
        {sub.category_name && (
          <p className="text-xs text-gray-500 line-clamp-1">in {sub.category_name}</p>
        )}
      </div>
      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-amber-600 transition-all flex-shrink-0" />
    </Link>
  );
}

function ServiceCard({ service }) {
  const href =
    service.source === "biz_service"
      ? `/biz-services/${service.id}`
      : `/services/detail/${service.slug}`;
  return (
    <Link
      to={href}
      className="group bg-white rounded-2xl overflow-hidden shadow-md shadow-gray-200/50 border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 no-underline"
    >
      <div className="h-32 bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center relative overflow-hidden">
        <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 300 150">
          <circle cx="40" cy="30" r="2" fill="white" />
          <circle cx="120" cy="60" r="3" fill="white" />
          <circle cx="200" cy="25" r="2" fill="white" />
        </svg>
        {service.image_url ? (
          <img src={service.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <Briefcase className="w-10 h-10 text-white/80 relative" />
        )}
      </div>
      <div className="p-5">
        <h3 className="text-sm font-extrabold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
          {service.name}
        </h3>
        {service.category_name && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-50 text-violet-600 rounded-full text-[10px] font-bold mt-1">
            {service.category_name}
          </span>
        )}
        <p className="text-xs text-gray-500 line-clamp-2 mt-2">{service.description || "No description"}</p>
        {(service.city || service.provider_name) && (
          <p className="text-[11px] text-gray-400 mt-2 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {service.city || service.provider_name}
          </p>
        )}
        <div className="flex items-center justify-between pt-3 mt-2 border-t border-gray-100">
          <div>
            {service.price != null ? (
              <span className="text-sm font-extrabold text-gray-900">₹{service.price}{service.price_unit ? ` / ${service.price_unit}` : ""}</span>
            ) : (
              <span className="text-sm font-bold text-gray-400">Price on request</span>
            )}
            {service.is_featured && (
              <p className="text-[10px] font-bold text-amber-500">Featured</p>
            )}
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600">
            View <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function CategoryCard({ category }) {
  return (
    <Link
      to={`/categories/${category.slug}`}
      className="group bg-white rounded-2xl overflow-hidden shadow-md shadow-gray-200/50 border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 no-underline p-5 flex items-center gap-4"
    >
      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
        {category.logo_url ? (
          <img src={category.logo_url} alt="" className="w-9 h-9 object-contain" />
        ) : (
          <Grid3X3 className="w-6 h-6 text-white" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-extrabold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
          {category.name}
        </h3>
        {category.description && (
          <p className="text-xs text-gray-500 line-clamp-1">{category.description}</p>
        )}
      </div>
      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
    </Link>
  );
}

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q") || "";
  const latitude = searchParams.get("latitude");
  const longitude = searchParams.get("longitude");
  const radius_km = searchParams.get("radius_km");

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (!q.trim()) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setActiveTab("all");
    searchAll({
      q,
      latitude: latitude || undefined,
      longitude: longitude || undefined,
      radius_km: radius_km || undefined,
    })
      .then((res) => setData(res))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [q, latitude, longitude, radius_km]);

  const tabs = useMemo(() => {
    if (!data) return [];
    const perGroup = GROUP_ORDER.map((key) => ({
      id: key,
      label: GROUP_META[key].label,
      count: data[key]?.total || 0,
    })).filter((t) => t.count > 0);
    const total = perGroup.reduce((sum, t) => sum + t.count, 0);
    return [{ id: "all", label: "All", count: total }, ...perGroup];
  }, [data]);

  const shownItems =
    data &&
    GROUP_ORDER.map((key) => ({ key, items: data[key]?.items || [] }))
      .map(({ key, items }) => items.map((item) => ({ ...item, __type: key })));

  const activeItems =
    activeTab === "all"
      ? (shownItems || []).flat()
      : (shownItems || []).find((g) => g[0]?.__type === activeTab) || [];

  const totalCount = useMemo(
    () => (data ? GROUP_ORDER.reduce((s, k) => s + (data[k]?.total || 0), 0) : 0),
    [data]
  );


  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Banner ── */}
      <div className="bg-gradient-to-br from-gray-900 via-slate-900 to-indigo-950 relative overflow-hidden">
        <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 800 200">
          <circle cx="100" cy="40" r="2" fill="#60a5fa" />
          <circle cx="250" cy="80" r="3" fill="#818cf8" />
          <circle cx="400" cy="30" r="2" fill="#a78bfa" />
          <circle cx="550" cy="90" r="3" fill="#60a5fa" />
        </svg>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 text-center relative z-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
              <Search className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold text-white mb-3">
            {q ? (
              <>
                Results for <span className="text-blue-400">"{q}"</span>
              </>
            ) : (
              "Search BizzProfile"
            )}
          </h1>
          <p className="text-white/60 text-base max-w-xl mx-auto">
            {loading
              ? "Searching products, services, businesses, categories and more..."
              : data
                ? `${totalCount} result${totalCount === 1 ? "" : "s"} found`
                : q
                  ? "No results found. Try a different keyword."
                  : "Start typing in the search bar to see live results as you type."}
          </p>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
            <p className="text-sm text-gray-500">Loading results...</p>
          </div>
        ) : !q.trim() ? (
          <div className="text-center py-20">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Start searching</h3>
            <p className="text-sm text-gray-500">
              Type in the search bar above. Results appear live as you type, grouped by product, service, business and more.
            </p>
          </div>
        ) : !data || totalCount === 0 ? (
          <div className="text-center py-20">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">No results found</h3>
            <p className="text-sm text-gray-500 mb-6">Try searching with a different keyword.</p>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex flex-wrap items-center gap-2 mb-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer border-none ${
                    activeTab === tab.id
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                      : "bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-600"
                  }`}
                >
                  {tab.label}
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                    activeTab === tab.id ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Results grid */}
            {activeItems.length === 0 ? (
              <div className="text-center py-20">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-sm text-gray-500">No results in this section.</p>
              </div>
            ) : (
              <>
                {activeTab === "all" ? (
                  <div className="space-y-10">
                    {GROUP_ORDER.map((key) => {
                      const group = data[key];
                      if (!group?.items?.length) return null;
                      const meta = GROUP_META[key];
                      const Icon = meta.icon;
                      return (
                        <div key={key}>
                          <div className="flex items-center gap-2 mb-4">
                            <Icon className="w-5 h-5 text-blue-600" />
                            <h2 className="text-lg font-extrabold text-gray-900">{meta.label}</h2>
                            {group.total > group.items.length && (
                              <button
                                onClick={() => setActiveTab(key)}
                                className="text-xs font-bold text-blue-600 hover:underline cursor-pointer border-none bg-transparent"
                              >
                                See all {group.total}
                              </button>
                            )}
                          </div>
                          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {group.items.map((item) => meta.card(item))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {activeItems.map((item) => GROUP_META[activeTab].card(item))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}