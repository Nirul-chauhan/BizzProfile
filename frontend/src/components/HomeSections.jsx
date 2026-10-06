import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, ShieldCheck, Building2, Play, X, Package, Send, MapPin, TrendingUp, Phone } from "lucide-react";
import { getTrendingVideos, getBestSellers, getTrendingProducts, getTrendingCategories, getAuthToken } from "../api";
import EnquiryFormModal from "./EnquiryFormModal";

/* ─── BEST SELLERS ────────────────────────────────────── */
export function BestSellersSection() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);
  const navigate = useNavigate();
  const [inquiryProduct, setInquiryProduct] = useState(null);

  useEffect(() => {
    getBestSellers({ page_size: 20 })
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch((e) => setError(e.message || "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const scroll = (dir) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir * 300, behavior: "smooth" });
    }
  };

  if (loading) {
    return (
      <section className="py-10 bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-7 w-48 bg-white/20 rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-72 bg-white/15 rounded-lg animate-pulse mb-6" />
          <div className="flex gap-4 overflow-hidden">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="flex-shrink-0 w-52 h-64 bg-white/15 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-10 bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-white/80 text-sm mb-3">{error}</p>
          <button onClick={() => { setError(null); setLoading(true); getBestSellers({ page_size: 20 }).then(d => setProducts(Array.isArray(d) ? d : [])).catch(e => setError(e.message)).finally(() => setLoading(false)); }} className="px-4 py-2 bg-white text-orange-600 text-sm font-bold rounded-lg border-none cursor-pointer">Retry</button>
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <>
      <section className="py-10 bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-extrabold text-white">Best Sellers</h2>
              <p className="text-sm text-white/75 mt-1">Discover popular products from businesses in your community</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => scroll(-1)} className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer border-none">
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <button onClick={() => scroll(1)} className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer border-none">
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
          <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
            {products.map((prod) => (
              <div key={prod.id} className="flex-shrink-0 w-52 bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all group">
                <div className="relative h-40 bg-gray-100 overflow-hidden">
                  {prod.primary_image ? (
                    <img src={prod.primary_image} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-amber-50">
                      <Package className="w-10 h-10 text-orange-300" />
                    </div>
                  )}
                  {prod.is_verified && (
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-md px-1.5 py-0.5 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span className="text-[9px] font-bold text-emerald-700">Verified</span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-bold text-gray-900 truncate mb-0.5 group-hover:text-orange-600">{prod.name}</h3>
                  {prod.business_name && (
                    <p className="text-[11px] text-gray-400 truncate mb-1">{prod.business_name}</p>
                  )}
                  <div className="flex items-center gap-1 mb-2">
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
                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (!getAuthToken()) return navigate("/login"); setInquiryProduct(prod); }} className="flex-1 py-1.5 bg-orange-50 text-orange-700 text-[11px] font-bold rounded-lg hover:bg-orange-100 transition-colors cursor-pointer border-none flex items-center justify-center gap-1">
                      <Send className="w-3 h-3" />Inquiry
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Inquiry Modal */}
      <EnquiryFormModal
        open={!!inquiryProduct}
        target={inquiryProduct ? { type: "product", id: inquiryProduct.id, name: inquiryProduct.name, profile_id: inquiryProduct.profile_id } : null}
        onClose={() => setInquiryProduct(null)}
      />
    </>
  );
}

/* ─── TRENDING CATEGORIES ────────────────────────────────────── */
export function TrendingProductsSection() {
  const [products, setProducts] = useState([]);
  const [isRealTrending, setIsRealTrending] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);
  const navigate = useNavigate();
  const [inquiryProduct, setInquiryProduct] = useState(null);

  useEffect(() => {
    getTrendingProducts(7)
      .then((data) => {
        const items = Array.isArray(data) ? data : [];
        setProducts(items);
        // The endpoint falls back to recent products when nothing is flagged
        // trending; every item then reports is_trending=false.
        setIsRealTrending(items.some((d) => d.is_trending));
      })
      .catch((e) => setError(e.message || "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const scroll = (dir) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir * 300, behavior: "smooth" });
    }
  };

  if (loading) {
    return (
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-7 w-56 bg-gray-100 rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-80 bg-gray-100 rounded-lg animate-pulse mb-6" />
          <div className="flex gap-4 overflow-hidden">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="flex-shrink-0 w-52 h-64 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm">{error}</p>
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <>
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <h2 className="text-2xl font-extrabold text-gray-900">{isRealTrending ? "Trending Products" : "Recently Added Products"}</h2>
              </div>
              <p className="text-sm text-gray-500 mt-1">{isRealTrending ? "Popular picks from verified businesses" : "The latest products from verified businesses"}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => scroll(-1)} className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer">
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <button onClick={() => scroll(1)} className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer">
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
          <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
            {products.map((prod) => (
              <div key={prod.id} className="flex-shrink-0 w-52 bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-purple-200 transition-all group">
                <div className="relative h-40 bg-gray-50 overflow-hidden">
                  {prod.primary_image ? (
                    <img src={prod.primary_image} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
                      <Package className="w-10 h-10 text-purple-300" />
                    </div>
                  )}
                  {prod.is_verified && (
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-md px-1.5 py-0.5 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span className="text-[9px] font-bold text-emerald-700">Verified</span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-bold text-gray-900 truncate mb-0.5 group-hover:text-purple-600">{prod.name}</h3>
                  {prod.business_name && (
                    <p className="text-[11px] text-gray-400 truncate mb-1">{prod.business_name}</p>
                  )}
                  <div className="flex items-center gap-1 mb-2">
                    {prod.price != null ? (
                      <span className="text-sm font-extrabold text-gray-900">{"\u20B9"}{prod.price.toLocaleString("en-IN")}</span>
                    ) : (
                      <span className="text-xs font-medium text-gray-400">Price on Request</span>
                    )}
                    {prod.price_unit && <span className="text-[10px] text-gray-400">/ {prod.price_unit}</span>}
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/products/${prod.id}`} className="flex-1 py-1.5 bg-purple-600 text-white text-[11px] font-bold rounded-lg text-center hover:bg-purple-700 transition-colors no-underline">
                      View Details
                    </Link>
                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (!getAuthToken()) return navigate("/login"); setInquiryProduct(prod); }} className="flex-1 py-1.5 bg-purple-50 text-purple-700 text-[11px] font-bold rounded-lg hover:bg-purple-100 transition-colors cursor-pointer border-none flex items-center justify-center gap-1">
                      <Send className="w-3 h-3" />Inquiry
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Inquiry Modal */}
      <EnquiryFormModal
        open={!!inquiryProduct}
        target={inquiryProduct ? { type: "product", id: inquiryProduct.id, name: inquiryProduct.name, profile_id: inquiryProduct.profile_id } : null}
        onClose={() => setInquiryProduct(null)}
      />
    </>
  );
}

/* ─── TRENDING CATEGORIES ─────────────────────────────────── */
export function TrendingCategoriesSection() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    getTrendingCategories(7)
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch((e) => setError(e.message || "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const scroll = (dir) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir * 300, behavior: "smooth" });
    }
  };

  if (loading) {
    return (
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-7 w-56 bg-gray-100 rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-80 bg-gray-100 rounded-lg animate-pulse mb-6" />
          <div className="flex gap-4 overflow-hidden">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="flex-shrink-0 w-52 h-52 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm">{error}</p>
        </div>
      </section>
    );
  }

  if (categories.length === 0) return null;

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <h2 className="text-2xl font-extrabold text-gray-900">Trending Categories</h2>
            </div>
            <p className="text-sm text-gray-500 mt-1">Popular categories on BizzProfiles right now</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => scroll(-1)} className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button onClick={() => scroll(1)} className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer">
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
        <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
          {categories.map((cat) => (
            <div key={cat.id} className="flex-shrink-0 w-52 bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-purple-200 transition-all group">
              <Link to={`/categories/${cat.slug}`} className="block relative h-32 bg-gray-50 overflow-hidden no-underline">
                {cat.product_image ? (
                  <img src={cat.product_image} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : cat.logo_url ? (
                  <img src={cat.logo_url} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
                    <Package className="w-10 h-10 text-purple-300" />
                  </div>
                )}
                {cat.is_verified && (
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-md px-1.5 py-0.5 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span className="text-[9px] font-bold text-emerald-700">Verified</span>
                  </div>
                )}
              </Link>
              <div className="p-3">
                <h3 className="text-sm font-bold text-gray-900 truncate mb-0.5 group-hover:text-purple-600">{cat.name}</h3>
                {cat.product_name && (
                  <p className="text-[11px] text-gray-400 truncate mb-1">{cat.product_name}</p>
                )}
                {cat.product_price != null && (
                  <div className="flex items-center gap-1 mb-2">
                    <span className="text-sm font-extrabold text-gray-900">{"\u20B9"}{cat.product_price.toLocaleString("en-IN")}</span>
                    {cat.product_price_unit && <span className="text-[10px] text-gray-400">/ {cat.product_price_unit}</span>}
                  </div>
                )}
                <div className="flex gap-2">
                  <Link to={`/categories/${cat.slug}`} className="flex-1 py-1.5 bg-purple-600 text-white text-[11px] font-bold rounded-lg text-center hover:bg-purple-700 transition-colors no-underline">
                    Browse
                  </Link>
                  <Link to={`/products/${cat.product_id}`} className="flex-1 py-1.5 bg-purple-50 text-purple-700 text-[11px] font-bold rounded-lg hover:bg-purple-100 transition-colors no-underline text-center">
                    View
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── TRENDING VIDEOS ────────────────────────────────────── */
export function TrendingVideosSection() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    getTrendingVideos(7)
      .then((data) => setVideos(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const scroll = (dir) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir * 300, behavior: "smooth" });
    }
  };

  const getThumbnail = (video) => {
    if (video.thumbnail_url) return video.thumbnail_url;
    if (video.platform === "YOUTUBE" && video.embed_id) {
      return `https://img.youtube.com/vi/${video.embed_id}/mqdefault.jpg`;
    }
    return null;
  };

  if (loading || videos.length === 0) return null;

  return (
    <section className="py-12 bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Trending Videos</h2>
            <p className="text-gray-500 mt-1">Watch what is popular in your industry</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => scroll(-1)} className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button onClick={() => scroll(1)} className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer">
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
        <div ref={scrollRef} className="flex gap-5 overflow-x-auto pb-4" style={{ scrollbarWidth: "none" }}>
          {videos.map((video) => (
            <div
              key={video.id}
              className="flex-shrink-0 w-72 bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => setActiveVideo(video)}
            >
              <div className="relative h-40 bg-gray-900">
                {getThumbnail(video) ? (
                  <img src={getThumbnail(video)} alt={video.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                    <Play className="w-12 h-12 text-white/60" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="w-6 h-6 text-gray-900 ml-0.5" />
                  </div>
                </div>
                <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm rounded-lg px-2 py-1">
                  <span className="text-[10px] font-bold text-white uppercase">{video.platform}</span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 group-hover:text-blue-600">
                  {video.title || "Trending Video"}
                </h3>
                {video.company_name && (
                  <p className="text-xs text-gray-500 mt-1 truncate">{video.company_name}</p>
                )}
                {video.city && (
                  <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5" />{video.city}{video.state ? `, ${video.state}` : ""}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

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
              {activeVideo.city && <p className="text-gray-400 text-xs mt-0.5">{activeVideo.city}{activeVideo.state ? `, ${activeVideo.state}` : ""}</p>}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
