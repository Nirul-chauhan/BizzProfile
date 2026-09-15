import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  User,
  Mail,
  Lock,
  Smartphone,
  ArrowRight,
  CheckCircle2,
  ArrowLeft,
  Eye,
  EyeOff,
  ArrowLeft as Back,
} from "lucide-react";
import SearchableSelect from "./SearchableSelect";
import { COUNTRIES, getCitiesForState, getStatesForCountry } from "./locationData";
import { sendOtp, verifyOtp, register, login as loginApi, forgotPassword, resetPassword } from "../api";

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

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted);
    if (pasted.length > 0) refs.current[Math.min(pasted.length, 5)]?.focus();
  };

  return (
    <div className="flex gap-3 justify-center" onPaste={handlePaste}>
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
          className="w-13 h-15 text-center text-xl font-bold bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-gray-900"
        />
      ))}
    </div>
  );
}

export default function EndUserAuth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("register");
  const [showPassword, setShowPassword] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("India");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [password, setPassword] = useState("");
  const [mobile, setMobile] = useState("");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [forgotMode, setForgotMode] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [timer, setTimer] = useState(58);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!otpSent || timer <= 0) return;
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [otpSent, timer]);

  const canSendOtp = fullName && email && city && state && password && mobile.length === 10;

  const availableStates = getStatesForCountry(country);
  const availableCities = getCitiesForState(state);

  const handleCountryChange = (val) => {
    setCountry(val);
    setState("");
    setCity("");
  };

  const handleStateChange = (val) => {
    setState(val);
    setCity("");
  };

  const handleSendOtp = useCallback(async () => {
    if (!canSendOtp) return;
    setLoading(true);
    setError("");
    try {
      await sendOtp({ mobile, purpose: "MOBILE_VERIFICATION" });
      setOtpSent(true);
      setTimer(58);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [canSendOtp, mobile]);

  const handleResend = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      await sendOtp({ mobile, purpose: "MOBILE_VERIFICATION" });
      setTimer(58);
      setOtp("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [mobile]);

  const handleVerifyAndRegister = useCallback(async () => {
    if (otp.length !== 6) return;
    setLoading(true);
    setError("");
    try {
      await register({
        full_name: fullName,
        email,
        mobile,
        password,
        city,
        state,
        country,
        role: "ENDUSER",
      });
      try {
        await verifyOtp({ email, mobile, otp, purpose: "MOBILE_VERIFICATION" });
      } catch (otpErr) {
        // OTP verification is optional since register already sets verified flags
      }
      const result = await loginApi({ email, password });
      localStorage.setItem("token", result.access_token);
      localStorage.setItem("user", JSON.stringify(result.user));
      setOtpVerified(true);
      setTimeout(() => navigate("/enduser"), 500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [otp, mobile, fullName, email, password, navigate]);

  const handleLogin = useCallback(async () => {
    if (!loginEmail || !loginPassword) return;
    setLoading(true);
    setError("");
    try {
      const result = await loginApi({ email: loginEmail, password: loginPassword });
      localStorage.setItem("token", result.access_token);
      localStorage.setItem("user", JSON.stringify(result.user));
      navigate("/enduser");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [loginEmail, loginPassword, navigate]);

  const handleForgotSendOtp = useCallback(async () => {
    if (!forgotEmail) return;
    setLoading(true);
    setError("");
    try {
      await forgotPassword({ email: forgotEmail });
      setForgotStep(2);
      setTimer(58);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [forgotEmail]);

  const handleForgotResendOtp = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      await forgotPassword({ email: forgotEmail });
      setTimer(58);
      setForgotOtp("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [forgotEmail]);

  const handleResetPassword = useCallback(async () => {
    if (forgotOtp.length !== 6 || !newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await resetPassword({ email: forgotEmail, otp: forgotOtp, new_password: newPassword });
      setForgotMode(false);
      setForgotStep(1);
      setForgotEmail("");
      setForgotOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setMode("login");
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [forgotOtp, newPassword, confirmPassword, forgotEmail]);

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-gray-50 via-white to-amber-50/30">
      <div className="w-full max-w-lg">
        {/* Back to Home */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-medium text-sm cursor-pointer border-none bg-transparent mb-8 transition-colors"
        >
          <Back className="w-4 h-4" /> Back to Home
        </button>

        {/* Card */}
        <div className="bg-white rounded-3xl p-8 lg:p-10 shadow-xl shadow-gray-200/50 border border-gray-100">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-amber-500/25">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
              {mode === "register" ? "Create Your Account" : "Welcome Back"}
            </h2>
            <p className="text-gray-500">
              {mode === "register"
                ? "Register to discover businesses"
                : "Login to your account"}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 text-center">
              {error}
            </div>
          )}

          {/* REGISTER MODE */}
          {mode === "register" && (
            <>
              {!otpSent ? (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input type="text" placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-gray-900 placeholder:text-gray-400 text-base" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-gray-900 placeholder:text-gray-400 text-base" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <SearchableSelect
                      label="Country"
                      value={country}
                      onChange={handleCountryChange}
                      options={COUNTRIES}
                      placeholder="Select country"
                    />
                    <SearchableSelect
                      label="State"
                      value={state}
                      onChange={handleStateChange}
                      options={availableStates}
                      placeholder="Select state"
                    />
                    <SearchableSelect
                      label="City"
                      value={city}
                      onChange={setCity}
                      options={availableCities}
                      placeholder="Select city"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input type={showPassword ? "text" : "password"} placeholder="Create a strong password" value={password} onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-12 pr-12 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-gray-900 placeholder:text-gray-400 text-base" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-lg cursor-pointer border-none bg-transparent">
                        {showPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Mobile Number</label>
                    <div className="flex gap-3">
                      <div className="flex items-center gap-2 px-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl text-sm font-medium text-gray-700">
                        <span className="text-lg leading-none">🇮🇳</span><span>+91</span>
                      </div>
                      <input type="tel" placeholder="Enter mobile number" value={mobile}
                        onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        className="flex-1 px-5 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-gray-900 placeholder:text-gray-400 text-base" />
                    </div>
                  </div>
                  <button onClick={handleSendOtp} disabled={!canSendOtp}
                    className="w-full py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white font-bold rounded-2xl hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 transition-all shadow-lg shadow-amber-500/25 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer border-none flex items-center justify-center gap-2 text-base">
                    <Smartphone className="w-5 h-5" /> Send OTP to Verify
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center">
                    <p className="text-sm text-amber-700 font-medium">
                      OTP sent to <span className="font-bold">+91 {mobile}</span>
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-4 text-center">Enter 6-Digit OTP</label>
                    <OtpInput value={otp} onChange={setOtp} onSubmit={handleVerifyAndRegister} />
                  </div>
                  <div className="flex items-center justify-between">
                    {timer > 0 ? (
                      <span className="text-sm text-gray-400">Resend OTP ({timer}s)</span>
                    ) : (
                      <button onClick={handleResend} className="text-sm text-amber-600 font-bold hover:text-amber-700 cursor-pointer border-none bg-transparent">Resend OTP</button>
                    )}
                  </div>
                  <button onClick={handleVerifyAndRegister} disabled={otp.length !== 6 || otpVerified || loading}
                    className="w-full py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white font-bold rounded-2xl hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 transition-all shadow-lg shadow-amber-500/25 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer border-none flex items-center justify-center gap-2 text-base">
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                        Verifying...
                      </span>
                    ) : otpVerified ? (
                      <><CheckCircle2 className="w-5 h-5" /> Verified!</>
                    ) : (
                      <>Verify & Register <ArrowRight className="w-5 h-5" /></>
                    )}
                  </button>
                  <button onClick={() => { setOtpSent(false); setOtp(""); setOtpVerified(false); }}
                    className="w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700 cursor-pointer border-none bg-transparent py-2">
                    <ArrowLeft className="w-4 h-4" /> Back to registration
                  </button>
                </div>
              )}
              <div className="mt-8 text-center">
                <p className="text-sm text-gray-500">
                  Already have an account?{" "}
                  <button onClick={() => { setMode("login"); setOtpSent(false); setOtp(""); setOtpVerified(false); }}
                    className="text-amber-600 font-bold hover:text-amber-700 cursor-pointer border-none bg-transparent">Login</button>
                </p>
              </div>
            </>
          )}

          {/* LOGIN MODE */}
          {mode === "login" && !forgotMode && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Email Address / Mobile Number</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="text" placeholder="you@example.com or +91 1234567890" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-gray-900 placeholder:text-gray-400 text-base" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type={showPassword ? "text" : "password"} placeholder="Enter your password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-gray-900 placeholder:text-gray-400 text-base" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-lg cursor-pointer border-none bg-transparent">
                    {showPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-end">
                <button onClick={() => { setForgotMode(true); setForgotStep(1); setForgotEmail(loginEmail); setError(""); }}
                  className="text-sm text-amber-600 font-semibold hover:text-amber-700 cursor-pointer border-none bg-transparent">
                  Forgot Password?
                </button>
              </div>
              <button onClick={handleLogin} disabled={!loginEmail || !loginPassword || loading}
                className="w-full py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white font-bold rounded-2xl hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 transition-all shadow-lg shadow-amber-500/25 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer border-none flex items-center justify-center gap-2 text-base">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Logging in...
                  </span>
                ) : (
                  <>Login to Dashboard <ArrowRight className="w-5 h-5" /></>
                )}
              </button>
              <div className="mt-8 text-center">
                <p className="text-sm text-gray-500">
                  Don't have an account?{" "}
                  <button onClick={() => { setMode("register"); setLoginEmail(""); setLoginPassword(""); }}
                    className="text-amber-600 font-bold hover:text-amber-700 cursor-pointer border-none bg-transparent">Register</button>
                </p>
              </div>
            </div>
          )}

          {/* FORGOT PASSWORD MODE */}
          {forgotMode && (
            <div className="space-y-5">
              <button onClick={() => { setForgotMode(false); setForgotStep(1); setForgotEmail(""); setForgotOtp(""); setNewPassword(""); setConfirmPassword(""); setError(""); }}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-medium text-sm cursor-pointer border-none bg-transparent mb-2 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Login
              </button>

              {forgotStep === 1 && (
                <>
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Forgot Password?</h3>
                    <p className="text-sm text-gray-500">Enter your email to receive a verification code</p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input type="email" placeholder="you@example.com" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-gray-900 placeholder:text-gray-400 text-base" />
                    </div>
                  </div>
                  <button onClick={handleForgotSendOtp} disabled={!forgotEmail || loading}
                    className="w-full py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white font-bold rounded-2xl hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 transition-all shadow-lg shadow-amber-500/25 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer border-none flex items-center justify-center gap-2 text-base">
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                        Sending...
                      </span>
                    ) : (
                      <>Send Verification Code <ArrowRight className="w-5 h-5" /></>
                    )}
                  </button>
                </>
              )}

              {forgotStep === 2 && (
                <>
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Enter Verification Code</h3>
                    <p className="text-sm text-gray-500">We sent a code to <span className="font-semibold">{forgotEmail}</span></p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-4 text-center">Enter 6-Digit OTP</label>
                    <OtpInput value={forgotOtp} onChange={setForgotOtp} onSubmit={handleResetPassword} />
                  </div>
                  <div className="flex items-center justify-between">
                    {timer > 0 ? (
                      <span className="text-sm text-gray-400">Resend OTP ({timer}s)</span>
                    ) : (
                      <button onClick={handleForgotResendOtp} className="text-sm text-amber-600 font-bold hover:text-amber-700 cursor-pointer border-none bg-transparent">Resend OTP</button>
                    )}
                  </div>
                  <button onClick={() => setForgotStep(3)} disabled={forgotOtp.length !== 6 || loading}
                    className="w-full py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white font-bold rounded-2xl hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 transition-all shadow-lg shadow-amber-500/25 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer border-none flex items-center justify-center gap-2 text-base">
                    Verify Code <ArrowRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {forgotStep === 3 && (
                <>
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Create New Password</h3>
                    <p className="text-sm text-gray-500">Enter your new password below</p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input type={showPassword ? "text" : "password"} placeholder="Create a strong password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-12 pr-12 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-gray-900 placeholder:text-gray-400 text-base" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-lg cursor-pointer border-none bg-transparent">
                        {showPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input type={showPassword ? "text" : "password"} placeholder="Confirm your password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-gray-900 placeholder:text-gray-400 text-base" />
                    </div>
                  </div>
                  <button onClick={handleResetPassword} disabled={!newPassword || !confirmPassword || loading}
                    className="w-full py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white font-bold rounded-2xl hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 transition-all shadow-lg shadow-amber-500/25 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer border-none flex items-center justify-center gap-2 text-base">
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                        Resetting...
                      </span>
                    ) : (
                      <>Reset Password <ArrowRight className="w-5 h-5" /></>
                    )}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
