import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, ShieldCheck, MapPin, Phone, Tag, Package,
  Send, X, CheckCircle2, ChevronLeft, ChevronRight,
} from "lucide-react";
import { getPublicProduct, buyerCreateEnquiry } from "../api";
import { useAuth } from "../context/AuthContext";

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isBuyer } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImg, setActiveImg] = useState(0);
  const [showInquiry, setShowInquiry] = useState(false);
  const [inquiryMsg, setInquiryMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [inquiryError, setInquiryError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError(null);
    getPublicProduct(id)
      .then((d) => { setProduct(d); setActiveImg(0); })
      .catch((e) => setError(e.message || "Product not found"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleInquiry = async () => {
    if (!inquiryMsg.trim()) return;
    if (!isAuthenticated) return navigate("/login");
    if (!isBuyer) { setInquiryError("Only buyers can send enquiries."); return; }
    setSending(true);
    setInquiryError("");
    try {
      await buyerCreateEnquiry({
        profile_id: product.profile_id,
        product_id: product.id,
        message: inquiryMsg.trim(),
      });
      setSent(true);
      setTimeout(() => { setShowInquiry(false); setSent(false); setInquiryMsg(""); }, 2500);
    } catch (e) {
      setInquiryError(e.message || "Failed to send enquiry");
    }
    setSending(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="h-6 w-32 bg-gray-200 rounded-lg animate-pulse mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="h-80 bg-gray-200 rounded-xl animate-pulse" />
            <div className="space-y-4">
              <div className="h-8 w-3/4 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-5 w-1/2 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-20 bg-gray-200 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Product Not Found</h2>
          <p className="text-sm text-gray-500 mb-4">{error || "This product may have been removed."}</p>
          <Link to="/" className="text-sm font-medium text-gray-900 hover:underline">Back to Home</Link>
        </div>
      </div>
    );
  }

  const images = product.all_images || [];
  const displayImages = images.length > 0 ? images : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-4 bg-transparent border-none cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Images */}
          <div>
            {displayImages.length > 0 ? (
              <>
                <div className="relative rounded-xl overflow-hidden bg-gray-100 aspect-square">
                  <img src={displayImages[activeImg]?.image_url} alt={product.name} className="w-full h-full object-cover" />
                  {displayImages.length > 1 && (
                    <>
                      <button onClick={() => setActiveImg((p) => (p - 1 + displayImages.length) % displayImages.length)} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 border-none cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
                      <button onClick={() => setActiveImg((p) => (p + 1) % displayImages.length)} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 border-none cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
                    </>
                  )}
                </div>
                {displayImages.length > 1 && (
                  <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                    {displayImages.map((img, i) => (
                      <button key={img.id} onClick={() => setActiveImg(i)} className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 cursor-pointer ${activeImg === i ? "border-gray-900" : "border-transparent"}`}>
                        <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center">
                <Package className="w-20 h-20 text-gray-300" />
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              {product.category && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg">
                  <Tag className="w-3 h-3" />{product.category.name}
                </span>
              )}
              {!product.is_available && (
                <span className="px-2.5 py-1 bg-red-50 text-red-600 text-xs font-medium rounded-lg">Unavailable</span>
              )}
            </div>

            <h1 className="text-2xl font-extrabold text-gray-900 mb-2">{product.name}</h1>

            <div className="mb-4">
              {product.price != null ? (
                <span className="text-2xl font-extrabold text-gray-900">{"\u20B9"}{product.price.toLocaleString("en-IN")}</span>
              ) : (
                <span className="text-lg font-semibold text-gray-500">Price on Request</span>
              )}
              {product.price_unit && <span className="text-sm text-gray-400 ml-2">/ {product.price_unit}</span>}
            </div>

            {product.description && (
              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-900 mb-1">Description</h3>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{product.description}</p>
              </div>
            )}

            {/* Business Info */}
            {product.business_name && (
              <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-3">
                  {product.business_logo ? (
                    <img src={product.business_logo} alt="" className="w-11 h-11 rounded-xl object-cover" />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 font-bold">{product.business_name[0]}</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-gray-900 truncate">{product.business_name}</span>
                      {product.is_verified && <ShieldCheck className="w-4 h-4 text-gray-500 flex-shrink-0" />}
                    </div>
                    {product.business_city && (
                      <span className="text-xs text-gray-400 flex items-center gap-1"><MapPin className="w-3 h-3" />{product.business_city}</span>
                    )}
                  </div>
                  {product.business_slug && (
                    <Link to={`/enduser/business/${product.business_slug}`} className="text-xs font-medium text-gray-500 hover:text-gray-900 no-underline">View Profile</Link>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              {product.business_slug && (
                <Link to={`/enduser/business/${product.business_slug}`} className="flex-1 py-3 bg-gray-900 text-white text-sm font-bold rounded-xl text-center hover:bg-gray-800 transition-colors no-underline">
                  View Business
                </Link>
              )}
              <button onClick={() => { if (!isAuthenticated) return navigate("/login"); setShowInquiry(true); }} className="flex-1 py-3 bg-white border border-gray-200 text-gray-900 text-sm font-bold rounded-xl hover:bg-gray-50 transition-colors cursor-pointer flex items-center justify-center gap-2">
                <Send className="w-4 h-4" /> Send Inquiry
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Inquiry Modal */}
      {showInquiry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => !sending && setShowInquiry(false)}>
          <div className="bg-white rounded-xl max-w-lg w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">Send Inquiry</h3>
                <p className="text-xs text-gray-500 mt-0.5">About {product.name}</p>
              </div>
              <button onClick={() => setShowInquiry(false)} className="text-gray-400 hover:text-gray-600 border-none bg-transparent cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            {sent ? (
              <div className="p-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h4 className="text-base font-bold text-gray-900 mb-1">Inquiry Sent!</h4>
                <p className="text-sm text-gray-500">The seller will respond soon.</p>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                {inquiryError && <p className="text-sm text-red-600 bg-red-50 p-2.5 rounded-lg">{inquiryError}</p>}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Message *</label>
                  <textarea
                    value={inquiryMsg}
                    onChange={(e) => setInquiryMsg(e.target.value)}
                    rows={4}
                    placeholder="Describe what you're looking for..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowInquiry(false)} className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 border-none cursor-pointer">Cancel</button>
                  <button onClick={handleInquiry} disabled={sending || !inquiryMsg.trim()} className="flex-1 py-2.5 text-sm font-bold text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50 border-none cursor-pointer">{sending ? "Sending..." : "Send"}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
