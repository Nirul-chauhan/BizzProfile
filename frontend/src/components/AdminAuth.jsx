import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  KeyRound,
} from "lucide-react";
import { login as loginApi, changePassword, seedAdmin } from "../api";

function OtpInput({ value, onChange, onSubmit }) {
  const refs = useRef(Array(6).fill(null));
  const setRef = (i) => (el) => { refs.current[i] = el; };

  const handleChange = (i, v) => {
    if (!/^\d*$/.test(v)) return;
    const next = value.substring(0, i) + v + value.substring(i + 1);
    onChange(next);
    if (v && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !value[i] && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "Enter") onSubmit();
  };

  return (
    <div className="flex gap-3 justify-center">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={setRef(i)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="w-13 h-15 text-center text-xl font-bold bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900"
        />
      ))}
    </div>
  );
}

export default function AdminAuth() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefill = location.state || {};
  const [showPassword, setShowPassword] = useState(false);

  // Login state
  const [email, setEmail] = useState(prefill.email || "");
  const [password, setPassword] = useState(prefill.password || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Password change state (for first login)
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Seed admin on first visit
  const [seeded, setSeeded] = useState(false);
  useEffect(() => {
    seedAdmin().finally(() => setSeeded(true));
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError("");
    try {
      if (!seeded) await seedAdmin();
      const result = await loginApi({ email, password });
      const user = result.user;
      if (user.role?.name !== "ADMIN") {
        setError("This login is for administrators only.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        return;
      }
      localStorage.setItem("token", result.access_token);
      localStorage.setItem("user", JSON.stringify(user));
      if (user.is_first_login) {
        setMustChangePassword(true);
        setPendingUser(user);
      } else {
        navigate("/admin/dashboard");
      }
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setChangingPassword(true);
    setError("");
    try {
      await changePassword({ new_password: newPassword });
      const updatedUser = { ...pendingUser, is_first_login: false };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err.message || "Failed to change password.");
    } finally {
      setChangingPassword(false);
    }
  };

  // Password change screen
  if (mustChangePassword) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <KeyRound className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Change Your Password</h1>
            <p className="text-gray-500">For security, please change your default password.</p>
          </div>

          <form onSubmit={handleChangePassword} className="bg-white border border-gray-200 rounded-2xl p-8 space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900"
                  placeholder="Min 8 characters"
                  autoFocus
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer border-none bg-transparent">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900"
                  placeholder="Re-enter password"
                />
              </div>
            </div>

            <button type="submit" disabled={changingPassword || !newPassword || !confirmPassword}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-800 transition-all shadow-md disabled:opacity-50 cursor-pointer border-none flex items-center justify-center gap-2">
              {changingPassword ? "Saving..." : "Update Password"} <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Login screen
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Admin Login</h1>
          <p className="text-gray-500">Sign in to manage the platform</p>
        </div>

        {/* Default Credentials Hint */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <p className="text-xs font-bold text-blue-700 mb-1">Default Credentials (Development)</p>
          <p className="text-sm text-blue-600"><span className="font-bold">Email:</span> admin@bizzprofiles.com</p>
          <p className="text-sm text-blue-600"><span className="font-bold">Password:</span> admin123</p>
        </div>

        <form onSubmit={handleLogin} className="bg-white border border-gray-200 rounded-2xl p-8 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900"
              placeholder="admin@bizzprofiles.com"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-12 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900"
                placeholder="Enter your password"
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer border-none bg-transparent">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading || !email || !password}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-800 transition-all shadow-md disabled:opacity-50 cursor-pointer border-none flex items-center justify-center gap-2">
            {loading ? "Signing in..." : "Sign In"} <ArrowRight className="w-4 h-4" />
          </button>

          <div className="text-center pt-2">
            <p className="text-sm text-gray-400">
              Not an admin?{" "}
              <button onClick={() => navigate("/auth/buyer")} className="text-blue-600 font-bold hover:underline cursor-pointer border-none bg-transparent">
                Go back
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
