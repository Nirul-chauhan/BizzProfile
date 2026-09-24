import { useState, useEffect, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ChevronRight, Search, MapPin, Star, Phone, Building2,
  ArrowRight, LayoutGrid, List, ChevronLeft, Loader,
  Box, Wrench,
} from "lucide-react";
import { getCategoryTree, searchProfiles, listPublicProducts, listServicesForTaxonomy } from "../api";

const CAT_COLORS = [
  "bg-pink-100 text-pink-600", "bg-sky-100 text-sky-600",
  "bg-emerald-100 text-emerald-600", "bg-red-100 text-red-600",
  "bg-violet-100 text-violet-600", "bg-amber-100 text-amber-600",
  "bg-indigo-100 text-indigo-600", "bg-teal-100 text-teal-600",
];

const CATEGORY_ICONS = {
  heart: "❤️", zap: "⚡", droplets: "💧", hammer: "🔨", settings: "⚙️",
  sparkles: "✨", home: "🏠", shirt: "👕", wrench: "🔧", leaf: "🌿",
  gift: "🎁", box: "📦", gem: "💎", cross: "🏥", flask: "🧪", cog: "⚙️",
  building: "🏗️",
};

function CategoryIcon({ icon, className = "" }) {
  const emoji = CATEGORY_ICONS[icon];
  return (
    <div className={`w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center ${className}`}>
      {emoji ? <span className="text-lg">{emoji}</span> : <LayoutGrid className="w-5 h-5 text-indigo-500" />}
    </div>
  );
}

export default function CategoryPage() {
  const { categorySlug } = useParams();
  const navigate = useNavigate();
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [bizLoading, setBizLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [cityFilter, setCityFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState("grid");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getCategoryTree()
      .then((data) => {
        if (!mounted) return;
        setTree(data);
        if (categorySlug) {
          const found = data.find((c) => c.slug === categorySlug);
          if (found) setSelectedCat(found);
        } else {
          setSelectedCat(null);
        }
      })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [categorySlug]);

  const fetchBusinesses = useCallback(async () => {
    if (!selectedCat) { setBusinesses([]); return; }
    setBizLoading(true);
    try {
      const params = { category_id: selectedCat.id, page, page_size: 12 };
      if (cityFilter) params.city = cityFilter;
      const result = await searchProfiles(params);
      let items = result.items || [];
      if (sortBy === "name") items.sort((a, b) => (a.business_name || "").localeCompare(b.business_name || ""));
      else if (sortBy === "verified") items.sort((a, b) => (b.is_verified ? 1 : 0) - (a.is_verified ? 1 : 0));
      setBusinesses(items);
      setTotalPages(result.total_pages || 0);
    } catch { setBusinesses([]); }
    finally { setBizLoading(false); }
  }, [selectedCat, page, cityFilter, sortBy]);

  useEffect(() => { fetchBusinesses(); }, [fetchBusinesses]);

  const displayCategories = selectedCat ? selectedCat.children || [] : tree;
  const displaySubcategories = selectedCat ? selectedCat.subcategories || [] : [];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-48" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-32 bg-gray-200 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-indigo-600">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <Link to="/categories" className="hover:text-indigo-600">Categories</Link>
        {selectedCat && (
          <>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-900 font-medium">{selectedCat.name}</span>
          </>
        )}
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {selectedCat ? selectedCat.name : "All Categories"}
          </h1>
          {selectedCat && (
            <button
              onClick={() => { setSelectedCat(null); navigate("/categories"); }}
              className="text-sm text-indigo-600 hover:text-indigo-700 mt-1"
            >
              ← View all categories
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg ${viewMode === "grid" ? "bg-indigo-100 text-indigo-600" : "text-gray-400 hover:bg-gray-100"}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-lg ${viewMode === "list" ? "bg-indigo-100 text-indigo-600" : "text-gray-400 hover:bg-gray-100"}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Category Grid */}
      {displayCategories.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {selectedCat ? "Subcategories" : "Main Categories"}
          </h2>
          <div className={
            viewMode === "grid"
              ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
              : "space-y-2"
          }>
            {displayCategories.map((cat, idx) => (
              <Link
                key={cat.id}
                to={`/categories/${cat.slug}`}
                className={
                  viewMode === "grid"
                    ? "bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-indigo-200 transition-all group"
                    : "bg-white rounded-lg border border-gray-200 px-4 py-3 flex items-center gap-3 hover:shadow-sm transition-all"
                }
              >
                <div className={
                  viewMode === "grid"
                    ? "w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center mb-3 group-hover:bg-indigo-100 transition-colors"
                    : "w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0"
                }>
                  <CategoryIcon icon={cat.icon} className={viewMode === "grid" ? "" : "w-8 h-8"} />
                </div>
                <div className={viewMode === "grid" ? "" : "flex-1 min-w-0"}>
                  <h3 className="text-sm font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">
                    {cat.name}
                  </h3>
                  {viewMode === "grid" && (
                    <p className="text-xs text-gray-500 mt-1">
                      {(cat.children?.length || 0) + (cat.subcategories?.length || 0)} items
                    </p>
                  )}
                </div>
                {viewMode === "grid" && cat.children?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {cat.children.slice(0, 3).map((child) => (
                      <span key={child.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        {child.name}
                      </span>
                    ))}
                    {cat.children.length > 3 && (
                      <span className="text-xs text-gray-400">+{cat.children.length - 3} more</span>
                    )}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Direct Subcategories */}
      {displaySubcategories.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {displaySubcategories.map((sub) => (
              <Link
                key={sub.id}
                to={`/categories/${selectedCat.slug}/${sub.slug}`}
                className="bg-white rounded-lg border border-gray-200 px-4 py-3 flex items-center gap-3 hover:shadow-sm hover:border-indigo-200 transition-all"
              >
                <div className="w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-800 truncate">{sub.name}</h4>
                  {sub.description && (
                    <p className="text-xs text-gray-500 truncate mt-0.5">{sub.description}</p>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Business Listings */}
      {selectedCat && (
        <div className="mb-8">
          <hr className="mb-6" />
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="text-lg font-semibold text-gray-800">
              Businesses in {selectedCat.name}
            </h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter by city..."
                  value={cityFilter}
                  onChange={(e) => { setCityFilter(e.target.value); setPage(1); }}
                  className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-44"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="newest">Newest</option>
                <option value="name">Name A-Z</option>
                <option value="verified">Verified First</option>
              </select>
            </div>
          </div>

          {bizLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="animate-pulse bg-gray-200 rounded-xl h-48" />
              ))}
            </div>
          ) : businesses.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No businesses found in this category yet.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {businesses.map((biz) => (
                  <Link
                    key={biz.id}
                    to={`/enduser/business/${biz.slug}`}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-indigo-200 transition-all group"
                  >
                    {biz.cover_image_url && (
                      <img src={biz.cover_image_url} alt="" className="w-full h-32 object-cover" />
                    )}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        {biz.logo_url ? (
                          <img src={biz.logo_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 text-sm font-bold">
                            {(biz.business_name || "?")[0]}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                              {biz.business_name}
                            </span>
                            {biz.is_verified && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700">✓</span>
                            )}
                          </div>
                        </div>
                      </div>
                      {biz.description && (
                        <p className="text-xs text-gray-500 truncate mb-2">{biz.description}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        {biz.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />{biz.city}
                          </span>
                        )}
                        {biz.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />{biz.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-gray-600 px-3">Page {page} of {totalPages}</span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Empty state */}
      {!selectedCat && displayCategories.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <LayoutGrid className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-700">No categories found</h3>
          <p className="text-sm text-gray-500 mt-1">No categories available.</p>
        </div>
      )}
    </div>
  );
}


export function SubcategoryPage() {
  const { categorySlug, subcategorySlug } = useParams();
  const [category, setCategory] = useState(null);
  const [subcategory, setSubcategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState([]);
  const [bizLoading, setBizLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getCategoryTree()
      .then((data) => {
        if (!mounted) return;
        const cat = data.find((c) => c.slug === categorySlug);
        if (cat) {
          setCategory(cat);
          const sub = cat.subcategories?.find((s) => s.slug === subcategorySlug);
          if (sub) setSubcategory(sub);
        }
      })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [categorySlug, subcategorySlug]);

  useEffect(() => {
    if (!subcategory) return;
    setBizLoading(true);
    searchProfiles({ subcategory_id: subcategory.id, page, page_size: 12 })
      .then((result) => {
        if ((result.items || []).length > 0 || !category) {
          setBusinesses(result.items || []);
          setTotalPages(result.total_pages || 0);
          return;
        }
        return searchProfiles({ category_id: category.id, page, page_size: 12 });
      })
      .then((fallback) => {
        if (fallback) { setBusinesses(fallback.items || []); setTotalPages(fallback.total_pages || 0); }
      })
      .catch(() => setBusinesses([]))
      .finally(() => setBizLoading(false));
  }, [subcategory, category, page]);

  useEffect(() => {
    if (!subcategory) return;
    setProductsLoading(true);
    listPublicProducts({ subcategory_id: subcategory.id, page_size: 12 })
      .then((result) => {
        if ((result.items || []).length > 0 || !category) return result;
        return listPublicProducts({ category_id: category.id, page_size: 12 });
      })
      .then((result) => setProducts(result ? result.items || [] : []))
      .catch(() => setProducts([]))
      .finally(() => setProductsLoading(false));
  }, [subcategory, category]);

  useEffect(() => {
    if (!subcategory) return;
    setServicesLoading(true);
    listServicesForTaxonomy({ subcategory_id: subcategory.id, page_size: 12 })
      .then((result) => setServices(result.items || []))
      .catch(() => setServices([]))
      .finally(() => setServicesLoading(false));
  }, [subcategory]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-64" />
          <div className="h-32 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-indigo-600">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <Link to="/categories" className="hover:text-indigo-600">Categories</Link>
        {category && (
          <>
            <ChevronRight className="w-3 h-3" />
            <Link to={`/categories/${category.slug}`} className="hover:text-indigo-600">{category.name}</Link>
          </>
        )}
        {subcategory && (
          <>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-900 font-medium">{subcategory.name}</span>
          </>
        )}
      </nav>

      {/* Subcategory Info */}
      {subcategory && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{subcategory.name}</h1>
          {subcategory.description && (
            <p className="text-gray-600 mb-3">{subcategory.description}</p>
          )}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg font-medium">
              <LayoutGrid className="w-3 h-3" />{category?.name}
            </span>
            {subcategory.is_trending && (
              <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-lg font-medium">
                <Star className="w-3 h-3" />Trending
              </span>
            )}
          </div>
        </div>
      )}

      {/* Business Listings */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Businesses in {subcategory?.name}
        </h2>
        {bizLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="animate-pulse bg-gray-200 rounded-xl h-48" />
            ))}
          </div>
        ) : businesses.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-700">No businesses listed yet</h3>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {businesses.map((biz) => (
                <Link
                  key={biz.id}
                  to={`/enduser/business/${biz.slug}`}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-indigo-200 transition-all group"
                >
                  {biz.cover_image_url && (
                    <img src={biz.cover_image_url} alt="" className="w-full h-32 object-cover" />
                  )}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      {biz.logo_url ? (
                        <img src={biz.logo_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 text-sm font-bold">
                          {(biz.business_name || "?")[0]}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                            {biz.business_name}
                          </span>
                          {biz.is_verified && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700">✓</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {biz.description && (
                      <p className="text-xs text-gray-500 truncate mb-2">{biz.description}</p>
                    )}
                    {biz.city && (
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <MapPin className="w-3 h-3" />{biz.city}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-600 px-3">Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Products */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Products in {subcategory?.name}
        </h2>
        {productsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => (
              <div key={i} className="animate-pulse bg-gray-200 rounded-xl h-40" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Box className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No products found in this subcategory yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((prod) => (
              <Link
                key={prod.id}
                to={`/products/${prod.id}`}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-indigo-200 transition-all group"
              >
                {prod.primary_image ? (
                  <img src={prod.primary_image} alt="" className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-indigo-50 flex items-center justify-center">
                    <Box className="w-10 h-10 text-indigo-300" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-center gap-1 mb-1">
                    <h3 className="text-sm font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                      {prod.name}
                    </h3>
                    {prod.is_verified && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700">✓</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate mb-2">{prod.business_name}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-indigo-600">
                      {prod.price != null ? `₹${prod.price}` + (prod.price_unit ? ` / ${prod.price_unit}` : "") : "Price on request"}
                    </span>
                    {prod.business_city && (
                      <span className="flex items-center gap-1 text-gray-400">
                        <MapPin className="w-3 h-3" />{prod.business_city}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Services */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Services in {subcategory?.name}
        </h2>
        {servicesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => (
              <div key={i} className="animate-pulse bg-gray-200 rounded-xl h-40" />
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Wrench className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No matching services found in this subcategory yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((svc) => (
              <Link
                key={svc.id}
                to={`/services/detail/${svc.slug}`}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-indigo-200 transition-all group"
              >
                {svc.image_url ? (
                  <img src={svc.image_url} alt="" className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-indigo-50 flex items-center justify-center">
                    <Wrench className="w-10 h-10 text-indigo-300" />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="text-sm font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors mb-1">
                    {svc.name}
                  </h3>
                  <p className="text-xs text-gray-500 truncate mb-2">
                    {svc.provider_name || svc.category_name}
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-indigo-600">
                      {svc.price != null ? `₹${svc.price}` + (svc.price_unit ? ` / ${svc.price_unit}` : "") : "Price on request"}
                    </span>
                    {svc.city && (
                      <span className="flex items-center gap-1 text-gray-400">
                        <MapPin className="w-3 h-3" />{svc.city}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
