import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, MapPin, Star, ShieldCheck } from "lucide-react";
import { getPublicServices } from "../api";

function priceLabel(svc) {
  const { price_min, price_max, price_unit } = svc;
  if (price_min == null && price_max == null) return null;
  const unit = price_unit ? <span className="text-xs font-normal text-gray-400 ml-0.5">/{price_unit}</span> : null;
  if (price_min != null && price_max != null && price_min !== price_max) {
    return <>{"\u20B9"}{price_min.toLocaleString("en-IN")} - {"\u20B9"}{price_max.toLocaleString("en-IN")}{unit}</>;
  }
  const value = price_min != null ? price_min : price_max;
  return <>{"\u20B9"}{value.toLocaleString("en-IN")}{unit}</>;
}

export default function OurServicesSection() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    getPublicServices({ page_size: 12 })
      .then((data) => setServices(Array.isArray(data) ? data : data?.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const scroll = (dir) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir * 340, behavior: "smooth" });
    }
  };

  if (loading) {
    return (
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-7 w-48 bg-gray-100 rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-72 bg-gray-100 rounded-lg animate-pulse mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (services.length === 0) return null;

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">Our Services</h2>
            <p className="text-sm text-gray-500 mt-1">Professional services from verified businesses</p>
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
          {services.map((svc) => (
            <Link
              key={svc.id}
              to={`/biz-services/${svc.id}`}
              className="flex-shrink-0 w-80 group no-underline"
            >
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 h-full">
                <div className="relative h-44 overflow-hidden">
                  {svc.image_url ? (
                    <img
                      src={svc.image_url}
                      alt={svc.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.style.display = "none";
                        if (e.target.nextSibling) e.target.nextSibling.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 items-center justify-center text-white text-3xl font-bold ${svc.image_url ? "hidden" : "flex"}`}
                  >
                    {svc.name?.charAt(0)}
                  </div>
                  {svc.category?.name && (
                    <div className="absolute top-3 left-3">
                      <span className="bg-white/90 backdrop-blur-sm text-xs font-bold px-2.5 py-1 rounded-lg text-gray-700 shadow-sm">
                        {svc.category.name}
                      </span>
                    </div>
                  )}
                  {svc.is_featured && (
                    <div className="absolute top-3 right-3">
                      <span className="bg-amber-400 text-white text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                        <Star className="w-3 h-3 fill-white" /> Featured
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 text-sm leading-tight mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
                    {svc.name}
                  </h3>
                  <p className="text-xs text-gray-500 mb-2 line-clamp-2">{svc.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="w-3 h-3" />
                      {svc.business_city || "India"}
                    </div>
                    {priceLabel(svc) && (
                      <div className="flex items-center gap-0.5 text-sm font-bold text-emerald-600">
                        {priceLabel(svc)}
                      </div>
                    )}
                  </div>
                  {svc.business_name && (
                    <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                      by {svc.business_name}
                      {svc.is_verified && <ShieldCheck className="w-3 h-3 text-emerald-500" />}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
