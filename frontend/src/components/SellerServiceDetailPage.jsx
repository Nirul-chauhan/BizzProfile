import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { MapPin, Phone, Clock, Star, ArrowLeft, Tag, Globe, Mail, Wrench, ChevronRight, ShieldCheck, Send } from "lucide-react";
import { getPublicServiceById, getAuthToken } from "../api";
import EnquiryFormModal from "./EnquiryFormModal";

function formatPrice(service) {
  const { price_min, price_max, price_unit } = service;
  if (price_min == null && price_max == null) return "Price on Request";
  const unit = price_unit ? ` / ${price_unit}` : "";
  if (price_min != null && price_max != null && price_min !== price_max) {
    return `\u20B9${price_min.toLocaleString("en-IN")} - \u20B9${price_max.toLocaleString("en-IN")}${unit}`;
  }
  const value = price_min != null ? price_min : price_max;
  return `\u20B9${value.toLocaleString("en-IN")}${unit}`;
}

export default function SellerServiceDetailPage() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showEnquiry, setShowEnquiry] = useState(false);

  useEffect(() => {
    if (!serviceId) return;
    setLoading(true);
    getPublicServiceById(serviceId)
      .then((data) => setService(data))
      .catch((e) => setError(e.message || "Service not found"))
      .finally(() => setLoading(false));
  }, [serviceId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-6 w-48 bg-gray-200 rounded-lg" />
            <div className="h-8 w-96 bg-gray-200 rounded-lg" />
            <div className="h-64 bg-gray-200 rounded-2xl" />
            <div className="space-y-3">
              <div className="h-4 w-full bg-gray-200 rounded" />
              <div className="h-4 w-3/4 bg-gray-200 rounded" />
              <div className="h-4 w-1/2 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <Wrench className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Service Not Found</h1>
          <p className="text-gray-500 mb-6">{error || "The service you are looking for does not exist."}</p>
          <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors no-underline">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const location = [service.address, service.city, service.state, service.pincode].filter(Boolean).join(", ");

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6 flex-wrap">
          <Link to="/" className="hover:text-indigo-600 no-underline text-gray-500">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to="/services" className="hover:text-indigo-600 no-underline text-gray-500">Services</Link>
          {service.category && (
            <>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link to={`/services/${service.category.slug || ""}`} className="hover:text-indigo-600 no-underline text-gray-500">{service.category.name}</Link>
            </>
          )}
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-gray-900 font-medium">{service.name}</span>
        </div>

        {/* Service Image */}
        {service.image_url && (
          <div className="rounded-2xl overflow-hidden mb-6 bg-gray-200">
            <img src={service.image_url} alt={service.name} className="w-full h-64 md:h-80 object-cover" />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {service.category && (
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">{service.category.name}</span>
                )}
                {service.subcategory && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">{service.subcategory.name}</span>
                )}
                {service.is_featured && (
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> Featured
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">{service.name}</h1>
              {service.business_name && (
                <p className="text-gray-500 mt-2 flex items-center gap-1.5">
                  by <span className="font-semibold text-gray-700">{service.business_name}</span>
                  {service.is_verified && <ShieldCheck className="w-4 h-4 text-emerald-500" />}
                </p>
              )}
            </div>

            {/* Price */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-1">
                <Tag className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-500">Price</span>
              </div>
              <p className="text-2xl font-extrabold text-gray-900">{formatPrice(service)}</p>
            </div>

            {/* Description */}
            {service.description && (
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h2 className="text-lg font-bold text-gray-900 mb-3">About This Service</h2>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{service.description}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Enquiry Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="text-base font-bold text-gray-900 mb-2">Interested in this service?</h3>
              <p className="text-xs text-gray-500 mb-4">Send an enquiry and the provider will respond with a quotation.</p>
              <button
                onClick={() => { if (!getAuthToken()) return navigate("/login"); setShowEnquiry(true); }}
                className="w-full py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer border-none flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" /> Send Enquiry
              </button>
            </div>

            {/* Contact Card */}
            {(service.contact_phone || service.contact_email || location) && (
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="text-base font-bold text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-3">
                  {service.contact_phone && (
                    <a href={`tel:${service.contact_phone}`} className="flex items-center gap-3 no-underline">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Phone className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Phone</p>
                        <p className="text-sm font-bold text-gray-900">{service.contact_phone}</p>
                      </div>
                    </a>
                  )}
                  {service.contact_email && (
                    <a href={`mailto:${service.contact_email}`} className="flex items-center gap-3 no-underline">
                      <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                        <Mail className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Email</p>
                        <p className="text-sm font-bold text-gray-900">{service.contact_email}</p>
                      </div>
                    </a>
                  )}
                  {location && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Location</p>
                        <p className="text-sm font-bold text-gray-900">{location}</p>
                      </div>
                    </div>
                  )}
                  {service.service_radius != null && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Globe className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Service Radius</p>
                        <p className="text-sm font-bold text-gray-900">{service.service_radius} km</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Availability</p>
                      <p className="text-sm font-bold text-green-600">{service.is_available ? "Available" : "Unavailable"}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enquiry Modal */}
      <EnquiryFormModal
        open={showEnquiry}
        target={service ? { type: "service", id: service.id, name: service.name, profile_id: service.profile_id } : null}
        onClose={() => setShowEnquiry(false)}
      />
    </div>
  );
}
