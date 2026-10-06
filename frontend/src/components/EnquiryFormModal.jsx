import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, CheckCircle2 } from "lucide-react";
import { buyerCreateEnquiry, getAuthToken } from "../api";

/**
 * Reusable enquiry modal.
 *
 * `target` describes what the buyer is enquiring about:
 *   { type: "product" | "service", id, name, profile_id }
 *
 * Submits to POST /buyer/enquiries. The backend derives the seller from the
 * product/service, so only the profile_id + item id need to be sent.
 */
export default function EnquiryFormModal({ open, target, onClose }) {
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState("1");
  const [requirement, setRequirement] = useState("");
  const [location, setLocation] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  if (!open || !target) return null;

  const reset = () => {
    setQuantity("1");
    setRequirement("");
    setLocation("");
    setMessage("");
    setSending(false);
    setSent(false);
    setError("");
  };

  const handleClose = () => {
    if (sending) return;
    reset();
    onClose && onClose();
  };

  const handleSubmit = async () => {
    if (!message.trim()) return;
    // Check the token the request will actually use, not just the React state,
    // so an expired session sends the buyer to login instead of a bare
    // "Not authenticated" error.
    if (!getAuthToken()) {
      reset();
      onClose && onClose();
      return navigate("/login", { state: { from: window.location.pathname } });
    }
    setSending(true);
    setError("");
    try {
      await buyerCreateEnquiry({
        profile_id: target.profile_id,
        ...(target.type === "service"
          ? { service_id: target.id }
          : { product_id: target.id }),
        quantity: Math.max(1, parseInt(quantity, 10) || 1),
        requirement: requirement.trim() || undefined,
        location: location.trim() || undefined,
        message: message.trim(),
      });
      setSent(true);
      setTimeout(handleClose, 2200);
    } catch (e) {
      setError(e.message || "Failed to send enquiry");
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200] p-4" onClick={handleClose}>
      <div className="bg-white rounded-xl max-w-lg w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">Send {target.type === "service" ? "Enquiry" : "Inquiry"}</h3>
            <p className="text-xs text-gray-500 mt-0.5">About {target.name}</p>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 border-none bg-transparent cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        {sent ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3"><CheckCircle2 className="w-5 h-5 text-emerald-600" /></div>
            <h4 className="text-base font-bold text-gray-900 mb-1">Inquiry Sent!</h4>
            <p className="text-sm text-gray-500">The {target.type === "service" ? "provider" : "seller"} will respond soon.</p>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {error && <p className="text-sm text-red-600 bg-red-50 p-2.5 rounded-lg">{error}</p>}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City / area for delivery"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Requirement</label>
              <input
                type="text"
                value={requirement}
                onChange={(e) => setRequirement(e.target.value)}
                placeholder="e.g. bulk quantity, custom size, installation..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Message *</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="Describe what you're looking for..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={handleClose} className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 border-none cursor-pointer">Cancel</button>
              <button onClick={handleSubmit} disabled={sending || !message.trim()} className="flex-1 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 border-none cursor-pointer">
                {sending ? "Sending..." : "Send Enquiry"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}