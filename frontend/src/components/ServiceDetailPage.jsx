import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { MapPin, Phone, Clock, Shield, Star, ArrowLeft, Tag, Globe, Mail, CheckCircle2, Wrench, ChevronRight } from "lucide-react";
import { getServiceBySlug } from "../api";

export default function ServiceDetailPage() {
  const { slug } = useParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    getServiceBySlug(slug)
      .then((data) => setService(data))
      .catch((e) => setError(e.message || "Service not found"))
      .finally(() => setLoading(false));
  }, [slug]);

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

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/" className="hover:text-indigo-600 no-underline text-gray-500">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to="/services" className="hover:text-indigo-600 no-underline text-gray-500">Services</Link>
          {service.category_name && (
            <>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link to={`/services/${service.category_slug || ""}`} className="hover:text-indigo-600 no-underline text-gray-500">{service.category_name}</Link>
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
              <div className="flex items-center gap-2 mb-2">
                {service.category_name && (
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">{service.category_name}</span>
                )}
                {service.subcategory_name && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">{service.subcategory_name}</span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">{service.name}</h1>
              {service.provider_name && (
                <p className="text-gray-500 mt-2">by <span className="font-semibold text-gray-700">{service.provider_name}</span></p>
              )}
            </div>

            {/* Price */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-1">
                <Tag className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-500">Price</span>
              </div>
              {service.price != null ? (
                <p className="text-2xl font-extrabold text-gray-900">{"\u20B9"}{service.price.toLocaleString("en-IN")}{service.price_unit && <span className="text-sm font-medium text-gray-400"> / {service.price_unit}</span>}</p>
              ) : (
                <p className="text-lg font-medium text-gray-400">Price on Request</p>
              )}
            </div>

            {/* Description */}
            {service.description && (
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h2 className="text-lg font-bold text-gray-900 mb-3">About This Service</h2>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{service.description}</p>
              </div>
            )}

            {/* Full Details */}
            {service.full_details && (
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h2 className="text-lg font-bold text-gray-900 mb-3">Service Details</h2>
                <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{service.full_details}</div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Contact Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="text-base font-bold text-gray-900 mb-4">Contact Information</h3>
              <div className="space-y-3">
                {service.contact_number && (
                  <a href={`tel:${service.contact_number}`} className="flex items-center gap-3 no-underline">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Phone className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Phone</p>
                      <p className="text-sm font-bold text-gray-900">{service.contact_number}</p>
                    </div>
                  </a>
                )}
                {service.city && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Location</p>
                      <p className="text-sm font-bold text-gray-900">{[service.society_name, service.city, service.state].filter(Boolean).join(", ")}</p>
                    </div>
                  </div>
                )}
                {service.service_radius_km && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Globe className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Service Radius</p>
                      <p className="text-sm font-bold text-gray-900">{service.service_radius_km} km</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Available</p>
                    <p className="text-sm font-bold text-green-600">Active Service</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="text-base font-bold text-gray-900 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                {service.contact_number && (
                  <a href={`tel:${service.contact_number}`} className="block w-full py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-lg text-center hover:bg-indigo-700 transition-colors no-underline">
                    Call Now
                  </a>
                )}
                <Link to="/services" className="block w-full py-2.5 bg-gray-100 text-gray-700 text-sm font-bold rounded-lg text-center hover:bg-gray-200 transition-colors no-underline">
                  Browse More Services
                </Link>
              </div>
            </div>

            {/* Provider Info */}
            {service.provider_name && (
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="text-base font-bold text-gray-900 mb-3">Provider</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 font-bold text-sm">
                    {service.provider_name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{service.provider_name}</p>
                    {service.city && <p className="text-xs text-gray-400">{service.city}</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
