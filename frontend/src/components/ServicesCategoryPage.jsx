import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronRight, MapPin, Phone, Tag, Wrench, Star, ArrowLeft } from "lucide-react";
import { getServiceCategory, listServiceListings, getServiceCategories } from "../api";

export default function ServicesCategoryPage() {
  const { categorySlug, subcategorySlug } = useParams();
  const [category, setCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => { loadCategories(); }, []);
  useEffect(() => { loadServices(); }, [categorySlug, subcategorySlug, page]);

  const loadCategories = async () => {
    try { const d = await getServiceCategories(); setCategories(Array.isArray(d) ? d : []); } catch {}
  };

  const loadServices = async () => {
    setLoading(true);
    try {
      const params = { page, page_size: 12 };
      if (subcategorySlug) params.subcategory_slug = subcategorySlug;
      else if (categorySlug) params.category_slug = categorySlug;
      const d = await listServiceListings(params);
      setServices(d);
      if (categorySlug && !subcategorySlug) {
        try { const cat = await getServiceCategory(categorySlug); setCategory(cat); } catch {}
      }
    } catch {}
    setLoading(false);
  };

  if (loading && services.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 bg-gray-200 rounded-2xl animate-pulse" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/" className="hover:text-indigo-600 no-underline text-gray-500">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to="/services" className="hover:text-indigo-600 no-underline text-gray-500">Services</Link>
          {category && (
            <>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-gray-900 font-medium">{category.name}</span>
            </>
          )}
        </div>

        {/* Category Header */}
        {category && (
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">{category.name}</h1>
            {category.description && <p className="text-gray-500 mt-2">{category.description}</p>}
          </div>
        )}

        {/* Subcategory Tabs */}
        {category && categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-4 mb-6" style={{ scrollbarWidth: "none" }}>
            {categories.filter(c => c.id === category.id).map(cat =>
              cat.subcategories?.map(sub => (
                <Link
                  key={sub.id}
                  to={`/services/${cat.slug}/${sub.slug}`}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold no-underline transition-colors ${subcategorySlug === sub.slug ? "bg-indigo-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-indigo-300"}`}
                >
                  {sub.name}
                </Link>
              ))
            )}
          </div>
        )}

        {/* Services Grid */}
        {services.items.length === 0 ? (
          <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl">
            <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-900 mb-1">No services found</h3>
            <p className="text-sm text-gray-500">Check back later or browse other categories</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.items.map(svc => (
              <Link key={svc.id} to={`/services/detail/${svc.slug}`} className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all no-underline group">
                {svc.image_url && (
                  <div className="h-40 bg-gray-100 overflow-hidden">
                    <img src={svc.image_url} alt={svc.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                )}
                {!svc.image_url && (
                  <div className="h-40 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                    <Wrench className="w-10 h-10 text-indigo-300" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    {svc.category_name && <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded">{svc.category_name}</span>}
                    {svc.subcategory_name && <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded">{svc.subcategory_name}</span>}
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 mt-2">{svc.name}</h3>
                  {svc.provider_name && <p className="text-xs text-gray-400 mt-1">{svc.provider_name}</p>}
                  <div className="flex items-center justify-between mt-3">
                    {svc.price != null ? (
                      <span className="text-sm font-extrabold text-gray-900">{"\u20B9"}{svc.price.toLocaleString("en-IN")}</span>
                    ) : (
                      <span className="text-xs text-gray-400">Price on Request</span>
                    )}
                    {svc.city && <span className="text-[10px] text-gray-400 flex items-center gap-1"><MapPin className="w-2.5 h-2.5" />{svc.city}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {services.total_pages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: services.total_pages }, (_, i) => (
              <button key={i} onClick={() => setPage(i + 1)} className={`w-8 h-8 rounded-lg text-sm font-bold cursor-pointer border-none ${page === i + 1 ? "bg-indigo-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>{i + 1}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
