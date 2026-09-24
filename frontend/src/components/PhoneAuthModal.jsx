import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Phone, ArrowLeft, UserCheck, Briefcase, ShieldCheck } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

function extractError(data) {
  if (!data) return "Request failed";
  if (typeof data.detail === "string") return data.detail;
  if (Array.isArray(data.detail)) {
    return data.detail.map((d) => d.msg || d.message || "Error").join(", ");
  }
  if (typeof data.detail === "object" && data.detail !== null) {
    return data.detail.msg || data.detail.message || JSON.stringify(data.detail);
  }
  return data.message || "Request failed";
}

const ROLES = [
  { value: "BUYER", label: "Join as Buyer", desc: "Find services", icon: UserCheck },
  { value: "SELLER", label: "Join as Seller", desc: "Offer services", icon: Briefcase },
];

export default function PhoneAuthModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [step, setStep] = useState("role");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [signupToken, setSignupToken] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("BUYER");
  const [societyId, setSocietyId] = useState("");
  const [blockTower, setBlockTower] = useState("");
  const [flatNumber, setFlatNumber] = useState("");
  const [societies, setSocieties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchSocieties = async () => {
    try {
      const res = await fetch(`${API}/societies`);
      if (res.ok) setSocieties(await res.json());
    } catch {}
  };

  const selectRole = (r) => {
    setRole(r);
    setStep("phone");
    setError("");
  };

  const requestOtp = async () => {
    if (phone.length < 10) return setError("Enter a valid phone number");
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/otp/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(extractError(data));
      setStep("otp");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) return setError("Enter the 6-digit OTP");
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(extractError(data));
      if (data.is_new_user) {
        setSignupToken(data.signup_token);
        setStep("signup");
        fetchSocieties();
      } else {
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("user", JSON.stringify(data.user));
        onClose();
        const roleName = data.user.role?.name;
        if (roleName === "ADMIN") navigate("/admin/dashboard");
        else if (roleName === "BUYER" || roleName === "CUSTOMER") navigate("/buyer/dashboard");
        else navigate("/seller/dashboard");
        window.location.reload();
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const completeSignup = async () => {
    if (!name.trim()) return setError("Enter your name");
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/signup/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signup_token: signupToken,
          name: name.trim(),
          role,
          society_id: societyId ? parseInt(societyId) : null,
          block_tower: blockTower || null,
          flat_number: flatNumber || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(extractError(data));
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      onClose();
      if (role === "ADMIN") navigate("/admin/dashboard");
      else if (role === "BUYER") navigate("/buyer/dashboard");
      else navigate("/seller/dashboard");
      window.location.reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const titles = { role: "Get Started", phone: "Enter Phone Number", otp: "Verify OTP", signup: "Complete Profile" };

  return (
    <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl border border-gray-200" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-1">
            {step !== "role" ? (
              <button onClick={() => { setStep(step === "signup" ? "otp" : "role"); setError(""); }} className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer border-none bg-transparent">
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : <div />}
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer border-none bg-transparent">
              <X className="w-4 h-4" />
            </button>
          </div>
          <h2 className="text-lg font-bold text-gray-900">{titles[step]}</h2>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
          )}

          {step === "role" && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 mb-2">How do you want to use BizzProfiles?</p>
              {ROLES.map((r) => {
                const Icon = r.icon;
                return (
                  <button
                    key={r.value}
                    onClick={() => selectRole(r.value)}
                    className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all cursor-pointer bg-white text-left"
                  >
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-gray-900 block">{r.label}</span>
                      <span className="text-xs text-gray-500">{r.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {step === "phone" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                <div className="flex">
                  <span className="flex items-center px-3 bg-gray-50 border border-r-0 border-gray-200 rounded-l-lg text-sm text-gray-500">+91</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="Enter 10-digit number"
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-r-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    onKeyDown={(e) => e.key === "Enter" && requestOtp()}
                  />
                </div>
              </div>
              <button
                onClick={requestOtp}
                disabled={loading || phone.length < 10}
                className="w-full py-2.5 bg-gray-900 text-white font-bold text-sm rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50 cursor-pointer border-none"
              >
                {loading ? "Sending..." : "Send OTP"}
              </button>
              <p className="text-center text-xs text-gray-400">By continuing, you agree to our Terms of Service</p>
            </div>
          )}

          {step === "otp" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Enter 6-digit OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-center text-2xl font-mono tracking-[0.5em] focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  maxLength={6}
                  onKeyDown={(e) => e.key === "Enter" && verifyOtp()}
                />
              </div>
              <button
                onClick={verifyOtp}
                disabled={loading || otp.length !== 6}
                className="w-full py-2.5 bg-gray-900 text-white font-bold text-sm rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50 cursor-pointer border-none"
              >
                {loading ? "Verifying..." : "Verify & Continue"}
              </button>
            </div>
          )}

          {step === "signup" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Society (Optional)</label>
                <select
                  value={societyId}
                  onChange={(e) => setSocietyId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                >
                  <option value="">Select society</option>
                  {societies.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Block/Tower</label>
                  <input
                    type="text"
                    value={blockTower}
                    onChange={(e) => setBlockTower(e.target.value)}
                    placeholder="e.g. A"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Flat No.</label>
                  <input
                    type="text"
                    value={flatNumber}
                    onChange={(e) => setFlatNumber(e.target.value)}
                    placeholder="e.g. 101"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
              <button
                onClick={completeSignup}
                disabled={loading || !name.trim()}
                className="w-full py-2.5 bg-gray-900 text-white font-bold text-sm rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50 cursor-pointer border-none"
              >
                {loading ? "Creating account..." : "Complete Signup"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
