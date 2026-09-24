import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, ArrowRight, MapPin, Star, IndianRupee, Eye, X, Phone } from "lucide-react";
import { listServiceListings } from "../api";

export default function OurServicesSection() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    listServiceListings({ page_size: 50 })
      .then((data) => setServices(data?.items || []))
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
            {[1,2,3,4].map(i => (
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
            <p className="text-sm text-gray-500 mt-1">Professional services for your home and business</p>
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
            <div
              key={svc.id}
              className="flex-shrink-0 w-80 group cursor-pointer"
              onClick={() => setSelectedService(svc)}
            >
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300">
                <div className="relative h-44 overflow-hidden">
                  {svc.image_url ? (
                    <img
                      src={svc.image_url}
                      alt={svc.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 items-center justify-center text-white text-3xl font-bold ${svc.image_url ? "hidden" : "flex"}`}
                  >
                    {svc.name?.charAt(0)}
                  </div>
                  <div className="absolute top-3 left-3">
                    <span className="bg-white/90 backdrop-blur-sm text-xs font-bold px-2.5 py-1 rounded-lg text-gray-700 shadow-sm">
                      {svc.category_name}
                    </span>
                  </div>
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
                      {svc.city || "India"}
                    </div>
                    {svc.price != null && (
                      <div className="flex items-center gap-0.5 text-sm font-bold text-emerald-600">
                        <IndianRupee className="w-3.5 h-3.5" />
                        {svc.price.toLocaleString("en-IN")}
                        {svc.price_unit && <span className="text-xs font-normal text-gray-400 ml-0.5">/{svc.price_unit}</span>}
                      </div>
                    )}
                  </div>
                  {svc.provider_name && (
                    <p className="text-xs text-gray-400 mt-1.5">by {svc.provider_name}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedService && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedService(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="relative h-56 overflow-hidden">
              {selectedService.image_url ? (
                <img src={selectedService.image_url} alt={selectedService.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-5xl font-bold">
                  {selectedService.name?.charAt(0)}
                </div>
              )}
              <button
                onClick={() => setSelectedService(null)}
                className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white transition-colors cursor-pointer border-none"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-4">
                <span className="bg-white/90 backdrop-blur-sm text-xs font-bold px-3 py-1.5 rounded-lg text-gray-700">
                  {selectedService.category_name}
                  {selectedService.subcategory_name && ` / ${selectedService.subcategory_name}`}
                </span>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <h2 className="text-xl font-extrabold text-gray-900">{selectedService.name}</h2>
                {selectedService.price != null && (
                  <div className="flex items-center gap-0.5 text-lg font-bold text-emerald-600 shrink-0 ml-4">
                    <IndianRupee className="w-4 h-4" />
                    {selectedService.price.toLocaleString("en-IN")}
                    {selectedService.price_unit && <span className="text-sm font-normal text-gray-400 ml-0.5">/{selectedService.price_unit}</span>}
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">{selectedService.description}</p>
              {selectedService.full_details && (
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <h4 className="text-sm font-bold text-gray-700 mb-2">Full Details</h4>
                  <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{selectedService.full_details}</p>
                </div>
              )}
              <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                {selectedService.provider_name && (
                  <span className="bg-gray-100 px-3 py-1.5 rounded-lg font-medium">{selectedService.provider_name}</span>
                )}
                {selectedService.city && (
                  <span className="bg-gray-100 px-3 py-1.5 rounded-lg flex items-center gap-1"><MapPin className="w-3 h-3" />{selectedService.city}{selectedService.state ? `, ${selectedService.state}` : ""}</span>
                )}
                {selectedService.view_count != null && (
                  <span className="bg-gray-100 px-3 py-1.5 rounded-lg flex items-center gap-1"><Eye className="w-3 h-3" />{selectedService.view_count} views</span>
                )}
              </div>
              {selectedService.contact_number && (
                <a
                  href={`tel:${selectedService.contact_number}`}
                  className="mt-5 w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-colors no-underline"
                >
                  <Phone className="w-4 h-4" /> Call {selectedService.contact_number}
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}