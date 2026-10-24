import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, ChevronLeft, ChevronRight, Package, RefreshCw, Send, ShieldCheck,
} from "lucide-react";
import { getCategories, getCategoriesByLetter, getPopularProducts, getAuthToken } from "../api";
import EnquiryFormModal from "./EnquiryFormModal";
import { takeEnquiryDraft } from "./enquiryDraft";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function CategoryInitial({ category, className }) {
  if (category.logo_url || category.product_image) {
    return (
      <img
        src={category.product_image || category.logo_url}
        alt={category.name}
        loading="lazy"
        className={`${className} object-cover`}
      />
    );
  }
  return (
    <span className={`${className} flex items-center justify-center font-extrabold text-indigo-500`}>
      {(category.name || "?").charAt(0).toUpperCase()}
    </span>
  );
}

/* ─── TOP CATEGORIES ─────────────────────────────────────────
   Scrollable row of circular category buttons.
   Source: GET /api/categories (PostgreSQL).
--------------------------------------------------------------- */
export function TopCategoriesSection() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reload, setReload] = useState(0);
  const scrollRef = useRef(null);

  const retry = () => {
    setLoading(true);
    setError(null);
    setReload((r) => r + 1);
  };

  useEffect(() => {
    getCategories()
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch((e) => setError(e.message || "Failed to load categories"))
      .finally(() => setLoading(false));
  }, [reload]);

  const scroll = (dir) => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: dir * 300, behavior: "smooth" });
  };

  if (loading) {
    return (
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-7 w-48 bg-gray-100 rounded-lg animate-pulse mb-6" />
          <div className="flex gap-6 overflow-hidden">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="flex-shrink-0 flex flex-col items-center gap-3">
                <div className="w-24 h-24 rounded-full bg-gray-100 animate-pulse" />
                <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">Top Categories</h2>
            <p className="text-sm text-gray-500 mt-1">Browse categories across the marketplace</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => scroll(-1)} aria-label="Scroll left" className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button onClick={() => scroll(1)} aria-label="Scroll right" className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer">
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {error ? (
          <div className="text-center py-10 bg-gray-50 rounded-2xl">
            <p className="text-sm text-gray-500 mb-3">{error}</p>
            <button onClick={retry} className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-bold rounded-lg border-none cursor-pointer">
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-2xl">
            <p className="text-sm text-gray-500">No categories available.</p>
          </div>
        ) : (
          <div ref={scrollRef} className="flex gap-7 overflow-x-auto pb-3" style={{ scrollbarWidth: "none" }}>
            {categories.map((cat) => (
              <Link key={cat.id} to={`/categories/${cat.slug}`} className="flex-shrink-0 w-24 group flex flex-col items-center gap-3 no-underline">
                <div className="w-24 h-24 rounded-full p-[3px] bg-gray-200 group-hover:bg-gradient-to-br group-hover:from-indigo-500 group-hover:to-sky-500 transition-all">
                  <div className="w-full h-full rounded-full bg-white overflow-hidden flex items-center justify-center border border-white shadow-inner">
                    <CategoryInitial category={cat} className="w-full h-full text-3xl" />
                  </div>
                </div>
                <span className="text-xs font-semibold text-gray-700 text-center leading-tight line-clamp-2 group-hover:text-indigo-600 transition-colors">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ─── POPULAR PRODUCTS ────────────────────────────────────────
   Grid of 8 products from GET /api/public/products/popular,
   ranked in PostgreSQL by real signals (enquiries, best seller).
--------------------------------------------------------------- */
export function PopularProductsSection() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reload, setReload] = useState(0);
  const [inquiryProduct, setInquiryProduct] = useState(null);
  const [inquiryDraft, setInquiryDraft] = useState(null);

  const retry = () => {
    setLoading(true);
    setError(null);
    setReload((r) => r + 1);
  };

  useEffect(() => {
    getPopularProducts(8)
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch((e) => setError(e.message || "Failed to load products"))
      .finally(() => setLoading(false));
  }, [reload]);

  useEffect(() => {
    const draft = takeEnquiryDraft();
    if (draft && getAuthToken()) {
      setInquiryProduct(draft.target);
      setInquiryDraft(draft);
    }
  }, []);

  if (loading) {
    return (
      <section className="py-12 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-7 w-56 bg-gray-100 rounded-lg animate-pulse mb-6" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-64 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="py-12 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-2xl font-extrabold text-gray-900">Popular Products</h2>
            <p className="text-sm text-gray-500 mt-1">Most enquired products from verified businesses</p>
          </div>

          {error ? (
            <div className="text-center py-10 bg-white rounded-2xl">
              <p className="text-sm text-gray-500 mb-3">{error}</p>
              <button onClick={retry} className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-bold rounded-lg border-none cursor-pointer">
                <RefreshCw className="w-4 h-4" /> Retry
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl">
              <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No products available.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((prod) => (
                  <div key={prod.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all group flex flex-col">
                    <Link to={`/products/${prod.id}`} className="relative h-40 bg-gray-50 overflow-hidden block no-underline">
                      {prod.primary_image ? (
                        <img src={prod.primary_image} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
                          <Package className="w-10 h-10 text-orange-300" />
                        </div>
                      )}
                      {prod.is_verified && (
                        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-md px-1.5 py-0.5 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span className="text-[9px] font-bold text-emerald-700">Verified</span>
                        </div>
                      )}
                    </Link>
                    <div className="p-3 flex flex-col flex-1">
                      <h3 className="text-sm font-bold text-gray-900 truncate mb-0.5 group-hover:text-orange-600">{prod.name}</h3>
                      {prod.business_name && (
                        <p className="text-[11px] text-gray-400 truncate mb-1">{prod.business_name}</p>
                      )}
                      <div className="flex items-center gap-1 mb-3 mt-auto">
                        {prod.price != null ? (
                          <span className="text-sm font-extrabold text-gray-900">{"\u20B9"}{prod.price.toLocaleString("en-IN")}</span>
                        ) : (
                          <span className="text-xs font-medium text-gray-400">Price on Request</span>
                        )}
                        {prod.price_unit && <span className="text-[10px] text-gray-400">/ {prod.price_unit}</span>}
                      </div>
                      <div className="flex gap-2">
                        <Link to={`/products/${prod.id}`} className="flex-1 py-1.5 bg-gray-900 text-white text-[11px] font-bold rounded-lg text-center hover:bg-gray-800 transition-colors no-underline">
                          View Details
                        </Link>
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setInquiryProduct(prod); }}
                          className="flex-1 py-1.5 bg-orange-50 text-orange-700 text-[11px] font-bold rounded-lg hover:bg-orange-100 transition-colors cursor-pointer border-none flex items-center justify-center gap-1"
                        >
                          <Send className="w-3 h-3" />Inquiry
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 text-center">
                <Link
                  to="/categories"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 text-gray-900 text-sm font-bold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors no-underline"
                >
                  View All Products <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      <EnquiryFormModal
        open={!!inquiryProduct}
        target={inquiryProduct ? { type: "product", id: inquiryProduct.id, name: inquiryProduct.name, profile_id: inquiryProduct.profile_id } : null}
        onClose={() => { setInquiryProduct(null); setInquiryDraft(null); }}
        restoreKey={inquiryDraft ? inquiryDraft.target.id : null}
        initialValues={inquiryDraft}
      />
    </>
  );
}

/* ─── ALL CATEGORIES + A-Z DIRECTORY ──────────────────────────
   Alphabet rail on the left, category list on the right.
   Each letter fetches GET /api/categories?letter=X (DB filtered).
--------------------------------------------------------------- */
export function CategoryDirectorySection() {
  const [letter, setLetter] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reload, setReload] = useState(0);

  const selectLetter = (target) => {
    if (target === letter) return;
    setLetter(target);
    setLoading(true);
    setError(null);
  };

  const retry = () => {
    setLoading(true);
    setError(null);
    setReload((r) => r + 1);
  };

  useEffect(() => {
    const request = letter ? getCategoriesByLetter(letter) : getCategories();
    request
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch((e) => setError(e.message || "Failed to load categories"))
      .finally(() => setLoading(false));
  }, [letter, reload]);

  const letterClass = (active) =>
    `h-9 w-9 rounded-lg text-xs font-bold border transition-colors cursor-pointer flex items-center justify-center ${
      active
        ? "bg-gray-900 text-white border-gray-900"
        : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
    }`;

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">All Categories</h2>
            <p className="text-sm text-gray-500 mt-1">Pick a letter to see categories starting with it</p>
          </div>
          {!loading && !error && (
            <span className="text-xs font-semibold text-gray-400 whitespace-nowrap">
              {categories.length} {categories.length === 1 ? "category" : "categories"}
            </span>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Alphabet rail */}
          <div className="lg:w-40 flex-shrink-0">
            <p className="hidden lg:block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
              Alphabet
            </p>
            <div className="flex flex-row flex-wrap gap-1.5 lg:grid lg:grid-cols-2 lg:max-h-[540px] lg:overflow-y-auto lg:pr-1">
              <button
                onClick={() => selectLetter(null)}
                className={`${letterClass(letter === null)} col-span-2 lg:col-span-2 w-auto lg:w-full px-3`}
              >
                All
              </button>
              {LETTERS.map((l) => (
                <button key={l} onClick={() => selectLetter(l)} className={letterClass(letter === l)}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Category list */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-10 bg-gray-50 rounded-2xl">
                <p className="text-sm text-gray-500 mb-3">{error}</p>
                <button onClick={retry} className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-bold rounded-lg border-none cursor-pointer">
                  <RefreshCw className="w-4 h-4" /> Retry
                </button>
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded-2xl">
                <p className="text-sm text-gray-500">No categories available.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/categories/${cat.slug}`}
                    className="group flex items-center gap-3 px-4 py-3 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 hover:border-gray-200 transition-all no-underline"
                  >
                    <div className="w-9 h-9 rounded-full bg-indigo-50 overflow-hidden flex items-center justify-center flex-shrink-0">
                      <CategoryInitial category={cat} className="w-full h-full text-sm" />
                    </div>
                    <span className="text-sm font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                      {cat.name}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-300 ml-auto flex-shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
