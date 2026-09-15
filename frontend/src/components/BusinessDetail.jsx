import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  ShieldCheck,
  Globe,
  Mail,
  Phone,
  ExternalLink,
  Building2,
  Users,
  Calendar,
  Grid3X3,
  Share2,
  CheckCircle2,
} from "lucide-react";
import { getPublicProfile } from "../api";

const NAV_LINKS = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "features", label: "Features" },
  { id: "blogs", label: "Blogs" },
  { id: "contact", label: "Contact Us" },
];

export default function BusinessDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [slug]);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPublicProfile(slug);
      setProfile(data);
    } catch (err) {
      setError(err.message || "Business not found");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: profile?.business_name,
          text: profile?.description,
          url: window.location.href,
        });
      } catch {}
    } else {
      handleCopyLink();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200/60 px-4 sm:px-6 py-3 sticky top-0 z-30 shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link to="/enduser/portal" className="flex items-center gap-2 no-underline">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 rounded-xl flex items-center justify-center">
                <Grid3X3 className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900 hidden sm:inline">BizzProfiles</span>
            </Link>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-64 bg-gray-200 rounded-3xl" />
            <div className="h-8 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-24 bg-gray-200 rounded-2xl" />
              <div className="h-24 bg-gray-200 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200/60 px-4 sm:px-6 py-3 sticky top-0 z-30 shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link to="/enduser/portal" className="flex items-center gap-2 no-underline">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 rounded-xl flex items-center justify-center">
                <Grid3X3 className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900 hidden sm:inline">BizzProfiles</span>
            </Link>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Building2 className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Business Not Found</h2>
          <p className="text-gray-500 mb-8">{error}</p>
          <Link
            to="/enduser/portal"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors no-underline"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Portal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar */}
      <div className="bg-white border-b border-gray-200/60 px-4 sm:px-6 py-3 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/enduser/portal" className="flex items-center gap-2 no-underline">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Grid3X3 className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent tracking-tight hidden sm:inline">
              BizzProfiles
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.id}
                to={link.id === "home" ? "/enduser/portal" : `/enduser/portal`}
                onClick={(e) => {
                  if (link.id === "home") return;
                  e.preventDefault();
                  navigate("/enduser/portal");
                }}
                className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors no-underline"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl cursor-pointer border-none bg-transparent transition-colors"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? "Copied!" : "Share"}</span>
            </button>
            <Link
              to="/enduser/portal"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors no-underline"
            >
              <ArrowLeft className="w-4 h-4" /> Portal
            </Link>
          </div>
        </div>
      </div>

      {/* Cover Image */}
      <div className="relative h-64 sm:h-80 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 overflow-hidden">
        {profile.cover_image_url && (
          <img src={profile.cover_image_url} alt="" className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      {/* Profile Header */}
      <div className="max-w-4xl mx-auto px-4 -mt-20 relative z-10">
        <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Logo */}
            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center text-white font-bold text-3xl sm:text-4xl shadow-xl border-4 border-white flex-shrink-0">
              {profile.logo_url ? (
                <img src={profile.logo_url} alt={profile.business_name} className="w-full h-full object-cover rounded-3xl" />
              ) : (
                profile.business_name?.split(" ").map((w) => w[0]).join("").slice(0, 2) || "BZ"
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">{profile.business_name}</h1>
                {profile.is_verified && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified
                  </span>
                )}
              </div>
              <p className="text-gray-500 mb-3">
                {profile.category?.name}
                {profile.subcategory?.name && ` • ${profile.subcategory.name}`}
              </p>
              {profile.description && (
                <p className="text-gray-600 leading-relaxed max-w-2xl">{profile.description}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Quick Info Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {profile.phone && (
            <a href={`tel:${profile.phone}`} className="flex items-center gap-4 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow no-underline">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Phone className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Phone</p>
                <p className="text-sm font-bold text-gray-900">{profile.phone}</p>
              </div>
            </a>
          )}
          {profile.email && (
            <a href={`mailto:${profile.email}`} className="flex items-center gap-4 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow no-underline">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Email</p>
                <p className="text-sm font-bold text-gray-900 truncate">{profile.email}</p>
              </div>
            </a>
          )}
          {profile.website && (
            <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow no-underline">
              <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Globe className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Website</p>
                <p className="text-sm font-bold text-gray-900 truncate flex items-center gap-1">
                  {profile.website.replace(/^https?:\/\//, "")} <ExternalLink className="w-3 h-3" />
                </p>
              </div>
            </a>
          )}
        </div>

        {/* Location */}
        {profile.address && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Location</h3>
            </div>
            <p className="text-gray-600 ml-13">
              {profile.address}
              {profile.city && `, ${profile.city}`}
              {profile.state && `, ${profile.state}`}
              {profile.country && `, ${profile.country}`}
              {profile.pincode && ` - ${profile.pincode}`}
            </p>
          </div>
        )}

        {/* Company/Individual/MSME Details */}
        {(profile.company_detail || profile.individual_detail || profile.msme_detail) && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                {profile.profile_type === "COMPANY" && "Company Details"}
                {profile.profile_type === "INDIVIDUAL" && "Professional Details"}
                {profile.profile_type === "MSME" && "MSME Details"}
              </h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 ml-13">
              {profile.company_detail && (
                <>
                  {profile.company_detail.company_registration_number && (
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Registration Number</p>
                      <p className="text-sm font-bold text-gray-900">{profile.company_detail.company_registration_number}</p>
                    </div>
                  )}
                  {profile.company_detail.legal_name && (
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Legal Name</p>
                      <p className="text-sm font-bold text-gray-900">{profile.company_detail.legal_name}</p>
                    </div>
                  )}
                  {profile.company_detail.company_type && (
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Company Type</p>
                      <p className="text-sm font-bold text-gray-900">{profile.company_detail.company_type}</p>
                    </div>
                  )}
                </>
              )}
              {profile.individual_detail && (
                <>
                  {profile.individual_detail.professional_name && (
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Professional Name</p>
                      <p className="text-sm font-bold text-gray-900">{profile.individual_detail.professional_name}</p>
                    </div>
                  )}
                  {profile.individual_detail.profession && (
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Profession</p>
                      <p className="text-sm font-bold text-gray-900">{profile.individual_detail.profession}</p>
                    </div>
                  )}
                  {profile.individual_detail.experience_years && (
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Experience</p>
                      <p className="text-sm font-bold text-gray-900">{profile.individual_detail.experience_years} years</p>
                    </div>
                  )}
                  {profile.individual_detail.services && (
                    <div className="sm:col-span-2">
                      <p className="text-xs text-gray-500 font-medium">Services</p>
                      <p className="text-sm font-bold text-gray-900">{profile.individual_detail.services}</p>
                    </div>
                  )}
                </>
              )}
              {profile.msme_detail && (
                <>
                  {profile.msme_detail.msme_number && (
                    <div>
                      <p className="text-xs text-gray-500 font-medium">MSME Number</p>
                      <p className="text-sm font-bold text-gray-900">{profile.msme_detail.msme_number}</p>
                    </div>
                  )}
                  {profile.msme_detail.business_type && (
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Business Type</p>
                      <p className="text-sm font-bold text-gray-900">{profile.msme_detail.business_type}</p>
                    </div>
                  )}
                  {profile.msme_detail.industry && (
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Industry</p>
                      <p className="text-sm font-bold text-gray-900">{profile.msme_detail.industry}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Social Links */}
        {profile.social_links && profile.social_links.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center">
                <Globe className="w-5 h-5 text-cyan-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Social Links</h3>
            </div>
            <div className="flex flex-wrap gap-3 ml-13">
              {profile.social_links.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-colors no-underline"
                >
                  {link.platform} <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Profile Type Badge */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Business Type</h3>
                <p className="text-sm text-gray-500">{profile.profile_type}</p>
              </div>
            </div>
            {profile.created_at && (
              <div className="text-right">
                <p className="text-xs text-gray-500">Member since</p>
                <p className="text-sm font-bold text-gray-900 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 rounded-3xl p-8 text-center">
          <h3 className="text-xl font-bold text-white mb-2">Interested in this business?</h3>
          <p className="text-white/70 mb-6">Contact them directly or explore more businesses on BizzProfiles</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {profile.phone && (
              <a
                href={`tel:${profile.phone}`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-100 transition-all no-underline"
              >
                <Phone className="w-4 h-4" /> Call Now
              </a>
            )}
            {profile.email && (
              <a
                href={`mailto:${profile.email}`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/20 text-white font-bold rounded-xl hover:bg-white/30 transition-all no-underline"
              >
                <Mail className="w-4 h-4" /> Send Email
              </a>
            )}
            <Link
              to="/enduser/portal"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/20 text-white font-bold rounded-xl hover:bg-white/30 transition-all no-underline"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Portal
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-4 mt-12">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <Grid3X3 className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold">BizzProfiles</span>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            Create your verified business profile and connect with customers worldwide.
          </p>
          <div className="border-t border-gray-800 pt-4 text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} BizzProfiles. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
