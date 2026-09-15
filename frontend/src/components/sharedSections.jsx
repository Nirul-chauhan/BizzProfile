import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, ChevronDown, MapPin, ShieldCheck, Shield, Smartphone, Globe, Zap,
  Lock, Users, ArrowRight, Grid3X3, Star, Building2, TrendingUp, Search, Handshake,
  MessageCircle, Clock, Target, BarChart3, CheckCircle2, Briefcase, Eye, Loader2,
  Filter, RotateCcw, Tag, Phone, User, Send, Calendar, BookOpen, X, ShoppingBag, Mail,
  QrCode,
} from "lucide-react";
import { searchProfiles, getCategories } from "../api";
import {
  BLOGS, HOME_SLIDES, HOME_STATS, WHAT_IS_CARDS, HOME_SIDEBAR_CHECKLIST,
  PROMO_BANNER_CHECKLIST, INDUSTRY_CARDS, BENEFITS_CARDS, HOW_IT_WORKS_STEPS,
  ABOUT_CHECKLIST, ABOUT_BADGES, CONTACT_FOUNDER, CONTACT_METHODS,
  CAT_COLORS, CAT_BGS, CAT_TEXTS, POPULAR_CATEGORIES,
} from "./sharedViewData";

const CHECKLIST_ICONS = { Shield, TrendingUp, Smartphone, QrCode, Users };

/* ============================================================
   HOME SECTION — Dual-Pane Hero
   ============================================================ */
export function HomeSection() {
  const navigate = useNavigate();
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => setCurrentSlide((prev) => (prev + 1) % HOME_SLIDES.length), 3500);
    return () => clearInterval(timer);
  }, [isPaused]);

  return (
    <div id="section-home" className="min-h-[calc(100vh-5rem)] bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left: Sliding Carousel Banner */}
          <div
            className="relative rounded-3xl overflow-hidden shadow-2xl shadow-gray-900/15 border border-gray-100 h-[420px] lg:col-span-6 bg-gray-900"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {HOME_SLIDES.map((slide, i) => (
              <div key={i} className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${currentSlide === i ? "opacity-100 z-10" : "opacity-0 z-0"}`}>
                <img src={slide.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <div className={`absolute inset-0 bg-gradient-to-r ${slide.bg} opacity-80`} />
                <div className="relative z-10 h-full flex flex-col justify-center px-10 py-12">
                  <h2 className="text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-4 max-w-lg">{slide.headline}</h2>
                  <p className="text-white/75 text-sm leading-relaxed mb-6 max-w-md">{slide.subtitle}</p>
                  <button
                    onClick={() => {
                      const target = slide.headline.includes("E-Catalogue") || slide.headline.includes("Feature")
                        ? "/businesses"
                        : slide.headline.includes("Verified")
                        ? "/auth/enduser"
                        : "/auth/customer";
                      navigate(target);
                    }}
                    className="self-start inline-flex items-center gap-2 px-7 py-3 bg-white text-gray-900 font-bold text-sm rounded-xl hover:bg-gray-100 transition-colors cursor-pointer border-none shadow-lg"
                  >
                    {slide.cta} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            <button onClick={() => setCurrentSlide((prev) => (prev - 1 + HOME_SLIDES.length) % HOME_SLIDES.length)} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/15 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/25 transition-colors cursor-pointer border border-white/20">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <button onClick={() => setCurrentSlide((prev) => (prev + 1) % HOME_SLIDES.length)} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/15 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/25 transition-colors cursor-pointer border border-white/20">
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5">
              {HOME_SLIDES.map((_, i) => (
                <button key={i} onClick={() => setCurrentSlide(i)} className={`rounded-full transition-all duration-300 cursor-pointer border-none ${currentSlide === i ? "w-7 h-2.5 bg-white" : "w-2.5 h-2.5 bg-white/35 hover:bg-white/55"}`} />
              ))}
            </div>
          </div>

          {/* Right: Static Widget Card */}
          <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-gray-900/15 border border-gray-100 h-[420px] lg:col-span-6 bg-gradient-to-br from-gray-900 via-slate-900 to-indigo-950 flex flex-col justify-center px-10 py-12">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-9 h-9 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
                <Grid3X3 className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-bold text-white/90 tracking-tight">BizzProfiles</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-2">
              Your Business at Your Fingertips
            </h2>
            <p className="text-white/60 text-sm leading-relaxed mb-6">
              Launch Your Online Business Profile in Hours
            </p>
            <div className="space-y-3 mb-8">
              {HOME_SIDEBAR_CHECKLIST.map((item, i) => {
                const Icon = CHECKLIST_ICONS[item.icon] || CheckCircle2;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-white/80" />
                    </div>
                    <span className="text-white/80 text-sm">{item.text}</span>
                  </div>
                );
              })}
            </div>
            <button onClick={() => navigate("/auth/customer")} className="self-start inline-flex items-center gap-2 px-7 py-3 bg-white text-gray-900 font-bold text-sm rounded-xl hover:bg-gray-100 transition-colors cursor-pointer border-none shadow-lg">
              Get Started <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {HOME_STATS.map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl p-5 shadow-md shadow-gray-200/50 border border-gray-100 text-center">
              <div className={`text-2xl font-extrabold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* What is BizzProfiles */}
      <div className="max-w-6xl mx-auto mb-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 rounded-3xl p-10 border border-blue-100">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">What is BizzProfiles?</h2>
            <p className="text-gray-600 text-sm max-w-3xl mx-auto">
              BizzProfiles is a comprehensive B2B business directory and networking platform
              designed to help businesses establish their digital presence and connect with
              potential partners, clients, and collaborators — all commission-free.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {WHAT_IS_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.title} className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
                  <div className={`w-10 h-10 bg-${card.color}-100 rounded-xl flex items-center justify-center mb-3`}>
                    <Icon className={`w-5 h-5 text-${card.color}-600`} />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1">{card.title}</h3>
                  <p className="text-xs text-gray-500">{card.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Explore Industries */}
      <div className="max-w-7xl mx-auto mb-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Explore the <span className="text-blue-600">Industries</span> Tapping Into Us</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {INDUSTRY_CARDS.map((ind) => {
            const Icon = ind.icon;
            return (
              <a
                key={ind.slug}
                href={`/businesses?category=${ind.slug}`}
                className="group bg-white rounded-2xl p-6 shadow-md shadow-gray-200/50 border border-gray-100 flex flex-col items-center text-center hover:shadow-lg hover:border-blue-200 transition-all duration-300 cursor-pointer no-underline"
              >
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                  <Icon className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 leading-snug">{ind.name}</h3>
              </a>
            );
          })}
        </div>
      </div>

      {/* Important Benefits */}
      <div className="max-w-6xl mx-auto mb-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-gray-900 via-slate-900 to-indigo-950 rounded-3xl p-10">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-white mb-2">Important Benefits</h2>
            <p className="text-white/60 text-sm">Key reasons why businesses choose BizzProfiles</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {BENEFITS_CARDS.map((use, i) => {
              const Icon = use.icon;
              return (
                <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-colors">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4 shadow-md">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">{use.title}</h3>
                  <p className="text-xs text-white/60">{use.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Promotional Banner */}
      <div className="max-w-7xl mx-auto mb-12 px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl overflow-hidden shadow-2xl shadow-gray-900/15 border border-gray-100 h-[380px] bg-gradient-to-br from-[#0b1a2e] via-[#0f2340] to-[#1a1040]">
          <div className="grid grid-cols-1 lg:grid-cols-12 h-full">
            {/* Left: Branding Box */}
            <div className="lg:col-span-4 flex flex-col justify-center px-8 py-8 border-r border-white/10">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Grid3X3 className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-bold text-white/90 tracking-tight">BizzProfiles</span>
              </div>
              <h2 className="text-2xl lg:text-3xl font-extrabold text-white leading-tight mb-3">
                Get Your Ready-Made Online Store in Just few hours!
              </h2>
              <p className="text-white/60 text-sm mb-1">Sell Online Without Tech Hassles</p>
              <p className="text-white/40 text-xs mb-6">No Domain, No Setup, No SEO!</p>
              <button onClick={() => navigate("/auth/customer")} className="self-start inline-flex items-center gap-2 px-6 py-2.5 bg-white text-gray-900 font-bold text-sm rounded-xl hover:bg-gray-100 transition-colors cursor-pointer border-none shadow-lg">
                Know More <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Middle: Why Choose Us? Checklist */}
            <div className="lg:col-span-5 flex flex-col justify-center px-8 py-8 border-r border-white/10">
              <h3 className="text-lg font-bold text-white mb-4">Why Choose Us?</h3>
              <div className="grid grid-cols-1 gap-2.5">
                {PROMO_BANNER_CHECKLIST.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-amber-400/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <span className="text-white/80 text-xs leading-snug">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Illustration */}
            <div className="lg:col-span-3 flex items-center justify-center py-8 px-6 relative">
              <div className="relative w-full max-w-[200px]">
                {/* Character silhouette / person illustration */}
                <div className="w-32 h-36 mx-auto relative">
                  {/* Head */}
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-300 to-orange-400 rounded-full mx-auto relative shadow-lg shadow-amber-500/30">
                    <div className="absolute top-5 left-3 w-2 h-2 bg-gray-900 rounded-full" />
                    <div className="absolute top-5 right-3 w-2 h-2 bg-gray-900 rounded-full" />
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-5 h-2 border-b-2 border-gray-900 rounded-b-full" />
                  </div>
                  {/* Body */}
                  <div className="w-24 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-t-2xl mx-auto -mt-2 shadow-lg shadow-blue-500/30" />
                  {/* Arm pointing right */}
                  <div className="absolute top-20 right-0 w-12 h-3 bg-blue-500 rounded-full rotate-[-10deg] shadow-md" />
                </div>
                {/* Laptop preview */}
                <div className="absolute bottom-0 right-0 w-24 h-16 bg-gray-800 rounded-lg border border-gray-700 shadow-xl overflow-hidden">
                  <div className="w-full h-3 bg-gray-700 border-b border-gray-600" />
                  <div className="p-1.5">
                    <div className="w-full h-1.5 bg-blue-500/50 rounded mb-1" />
                    <div className="w-3/4 h-1.5 bg-emerald-500/50 rounded mb-1" />
                    <div className="w-1/2 h-1.5 bg-amber-500/50 rounded" />
                  </div>
                </div>
              </div>
              {/* Phone badge */}
              <div className="absolute bottom-4 right-4 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/20">
                <span className="text-white/70 text-[10px] font-bold">+91-9528174084</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Popular Categories */}
      <div className="max-w-7xl mx-auto mb-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Popular Categories</h2>
          <p className="text-gray-500 text-sm">Browse businesses by category</p>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-3">
          {(showAllCategories ? POPULAR_CATEGORIES : POPULAR_CATEGORIES.slice(0, 24)).map((cat) => {
            const Icon = cat.icon;
            return (
              <a
                key={cat.name}
                href={cat.linkTo}
                title={cat.name}
                className="group flex flex-col items-center justify-center gap-2.5 min-w-[90px] min-h-[90px] w-full p-3 bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 cursor-pointer no-underline"
              >
                <div className="w-10 h-10 rounded-lg bg-gray-50 group-hover:bg-blue-50 flex items-center justify-center transition-colors flex-shrink-0">
                  <Icon className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" strokeWidth={1.5} />
                </div>
                <span className="text-[11px] font-semibold text-gray-600 group-hover:text-gray-900 text-center leading-tight line-clamp-2 transition-colors w-full">{cat.name}</span>
              </a>
            );
          })}
          {!showAllCategories && (
            <button
              onClick={() => setShowAllCategories(true)}
              className="group flex flex-col items-center justify-center gap-2.5 min-w-[90px] min-h-[90px] w-full p-3 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-lg bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors flex-shrink-0">
                <Eye className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" strokeWidth={1.5} />
              </div>
              <span className="text-[11px] font-semibold text-gray-500 group-hover:text-blue-600 text-center leading-tight transition-colors">See More</span>
            </button>
          )}
          {showAllCategories && (
            <button
              onClick={() => setShowAllCategories(false)}
              className="group flex flex-col items-center justify-center gap-2.5 min-w-[90px] min-h-[90px] w-full p-3 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 hover:border-gray-300 hover:bg-gray-100 transition-all duration-300 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-lg bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0">
                <Eye className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" strokeWidth={1.5} />
              </div>
              <span className="text-[11px] font-semibold text-gray-500 group-hover:text-gray-700 text-center leading-tight transition-colors">Show Less</span>
            </button>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-6xl mx-auto mb-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-gray-900 via-slate-900 to-indigo-950 rounded-3xl p-10 text-center text-white shadow-2xl">
          <h2 className="text-2xl font-extrabold mb-3">Ready to Grow Your Business?</h2>
          <p className="text-white/70 text-sm mb-6 max-w-lg mx-auto">Join thousands of businesses already using BizzProfiles to connect, network, and grow.</p>
          <button onClick={() => navigate("/auth/customer")} className="px-8 py-3 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-100 transition-colors cursor-pointer border-none shadow-lg">
            Get Started Free
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   ABOUT SECTION
   ============================================================ */
export function AboutSection() {
  const navigate = useNavigate();

  return (
    <div id="section-about">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-14">
          <span className="inline-block bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full mb-4">About Us</span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-6">About <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">BizzProfiles</span></h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">A smart directory and profile ecosystem connecting verified local businesses with customers seamlessly.</p>
        </div>

        <div className="grid lg:grid-cols-12 gap-10 items-center">
          {/* Left: Text & Checklist */}
          <div className="lg:col-span-6 space-y-7">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 leading-tight">
              One Tap to Share, Sell & Succeed that's{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">BizzProfile</span>
            </h2>
            <p className="text-gray-500 leading-relaxed text-sm lg:text-base">
              BizzProfile is your all-in-one digital solution to create a stunning business profile, showcase
              products and services, accept UPI payments, and connect with customers instantly — no website
              needed, zero commission, and completely free to get started.
            </p>
            <div className="space-y-3.5">
              {ABOUT_CHECKLIST.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-start gap-3.5 group">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-emerald-200 transition-colors">
                      <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-bold text-gray-900">{item.label}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => navigate("/businesses")}
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white font-bold text-sm rounded-xl hover:from-blue-700 hover:via-indigo-700 hover:to-violet-700 transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl hover:-translate-y-0.5 cursor-pointer border-none"
            >
              <Briefcase className="w-4 h-4" /> Explore Businesses
            </button>
          </div>

          {/* Right: Smartphone Mockup */}
          <div className="lg:col-span-6">
            <div className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 rounded-3xl p-8 lg:p-10 border border-blue-100 overflow-hidden">
              <svg className="absolute inset-0 w-full h-full opacity-[0.03]" viewBox="0 0 400 400">
                {Array.from({ length: 20 }, (_, i) => (
                  <circle key={i} cx={20 + (i % 5) * 80} cy={20 + Math.floor(i / 5) * 80} r="2" fill="#4f46e5" />
                ))}
              </svg>
              <div className="relative z-10 flex flex-col items-center">
                <div className="relative mb-8">
                  <div className="relative w-48 h-[340px] bg-gray-900 rounded-[2rem] p-2 shadow-2xl shadow-gray-900/20">
                    <div className="w-full h-full rounded-[1.6rem] bg-white overflow-hidden flex flex-col">
                      <div className="h-6 bg-gray-900 flex items-center justify-center">
                        <div className="w-16 h-1.5 bg-gray-700 rounded-full" />
                      </div>
                      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-4 text-center">
                        <div className="w-14 h-14 bg-white/20 rounded-full mx-auto mb-2 flex items-center justify-center border-2 border-white/30">
                          <Grid3X3 className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-white font-bold text-xs">BizzProfiles</p>
                        <p className="text-white/60 text-[8px]">Digital Business Card</p>
                      </div>
                      <div className="flex-1 p-3 space-y-2">
                        <div className="bg-gray-50 rounded-lg p-2 border border-gray-100">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center"><MapPin className="w-3 h-3 text-blue-600" /></div>
                            <div className="flex-1"><div className="h-1 bg-gray-200 rounded w-3/4" /><div className="h-1 bg-gray-100 rounded w-1/2 mt-1" /></div>
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2 border border-gray-100">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-emerald-100 rounded flex items-center justify-center"><Phone className="w-3 h-3 text-emerald-600" /></div>
                            <div className="flex-1"><div className="h-1 bg-gray-200 rounded w-2/3" /><div className="h-1 bg-gray-100 rounded w-1/3 mt-1" /></div>
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2 border border-gray-100">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-amber-100 rounded flex items-center justify-center"><Star className="w-3 h-3 text-amber-500 fill-amber-500" /></div>
                            <div className="flex-1"><div className="h-1 bg-gray-200 rounded w-1/2" /><div className="h-1 bg-gray-100 rounded w-2/5 mt-1" /></div>
                          </div>
                        </div>
                        <div className="flex justify-center pt-1">
                          <div className="w-14 h-14 bg-white rounded-lg border border-gray-200 flex items-center justify-center">
                            <svg className="w-10 h-10" viewBox="0 0 40 40">
                              <rect x="2" y="2" width="12" height="12" rx="1" fill="#1e293b" />
                              <rect x="4" y="4" width="8" height="8" rx="0.5" fill="white" />
                              <rect x="6" y="6" width="4" height="4" rx="0.5" fill="#1e293b" />
                              <rect x="26" y="2" width="12" height="12" rx="1" fill="#1e293b" />
                              <rect x="28" y="4" width="8" height="8" rx="0.5" fill="white" />
                              <rect x="30" y="6" width="4" height="4" rx="0.5" fill="#1e293b" />
                              <rect x="2" y="26" width="12" height="12" rx="1" fill="#1e293b" />
                              <rect x="4" y="28" width="8" height="8" rx="0.5" fill="white" />
                              <rect x="6" y="30" width="4" height="4" rx="0.5" fill="#1e293b" />
                              <rect x="16" y="2" width="4" height="4" fill="#1e293b" />
                              <rect x="16" y="8" width="4" height="4" fill="#1e293b" />
                              <rect x="16" y="16" width="8" height="4" fill="#1e293b" />
                              <rect x="16" y="26" width="4" height="4" fill="#1e293b" />
                              <rect x="26" y="16" width="4" height="8" fill="#1e293b" />
                              <rect x="32" y="16" width="4" height="4" fill="#1e293b" />
                              <rect x="26" y="28" width="12" height="4" fill="#1e293b" />
                              <rect x="26" y="34" width="4" height="4" fill="#1e293b" />
                              <rect x="34" y="28" width="4" height="8" fill="#1e293b" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-32 h-8 bg-blue-500/15 rounded-full blur-xl" />
                </div>
                <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                  {ABOUT_BADGES.map((badge) => {
                    const Icon = badge.icon;
                    return (
                      <div key={badge.title} className="bg-white rounded-2xl p-3.5 shadow-md shadow-gray-200/50 border border-gray-100 flex items-center gap-3 hover:shadow-lg transition-shadow">
                        <div className={`w-9 h-9 bg-${badge.bg}-100 rounded-xl flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-4.5 h-4.5 text-${badge.bg}-600`} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900">{badge.title}</p>
                          <p className="text-[10px] text-gray-500">{badge.subtitle}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   BUSINESS DIRECTORY SECTION
   ============================================================ */
export function BusinessSection() {
  const [businesses, setBusinesses] = useState([]);
  const [businessesLoading, setBusinessesLoading] = useState(true);
  const [categoriesList, setCategoriesList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [bizFilterCategory, setBizFilterCategory] = useState("");
  const [bizFilterCity, setBizFilterCity] = useState("");
  const [bizShowCategoryDrop, setBizShowCategoryDrop] = useState(false);
  const [bizShowCityDrop, setBizShowCityDrop] = useState(false);

  useEffect(() => {
    loadBusinesses();
    loadCategories();
  }, []);

  const loadBusinesses = async (params = {}) => {
    setBusinessesLoading(true);
    try {
      const result = await searchProfiles({ page_size: 12, ...params });
      setBusinesses(result.items || []);
    } catch { setBusinesses([]); } finally { setBusinessesLoading(false); }
  };

  const loadCategories = async () => {
    try { const r = await getCategories(); setCategoriesList(r || []); } catch {}
  };

  return (
    <div id="section-business">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <span className="inline-block bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full mb-4">Business Directory</span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-6">Explore <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Verified Businesses</span></h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">Discover trusted businesses across categories, locations, and services — all verified on BizzProfiles.</p>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-4 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, location, services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const p = {};
                      if (searchQuery.trim()) p.q = searchQuery;
                      if (bizFilterCategory) p.category_id = bizFilterCategory;
                      if (bizFilterCity) p.city = bizFilterCity;
                      loadBusinesses(p);
                    }
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>
            <div className="relative">
              <button onClick={() => { setBizShowCategoryDrop(!bizShowCategoryDrop); setBizShowCityDrop(false); }} className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-left cursor-pointer hover:border-gray-300 transition-colors">
                <span className={bizFilterCategory ? "text-gray-900" : "text-gray-400"}>{bizFilterCategory ? categoriesList.find((c) => c.id === Number(bizFilterCategory))?.name || "All Categories" : "Business Category"}</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
              {bizShowCategoryDrop && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setBizShowCategoryDrop(false)} />
                  <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-40 max-h-60 overflow-y-auto">
                    <button onClick={() => { setBizFilterCategory(""); setBizShowCategoryDrop(false); }} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors cursor-pointer border-none ${!bizFilterCategory ? "bg-blue-50 text-blue-600 font-bold" : "text-gray-700"}`}>All Categories</button>
                    {categoriesList.map((cat) => (
                      <button key={cat.id} onClick={() => { setBizFilterCategory(cat.id); setBizShowCategoryDrop(false); }} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors cursor-pointer border-none ${bizFilterCategory === String(cat.id) ? "bg-blue-50 text-blue-600 font-bold" : "text-gray-700"}`}>{cat.name}</button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="relative">
              <button onClick={() => { setBizShowCityDrop(!bizShowCityDrop); setBizShowCategoryDrop(false); }} className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-left cursor-pointer hover:border-gray-300 transition-colors">
                <span className={bizFilterCity ? "text-gray-900" : "text-gray-400"}>{bizFilterCity || "Choose City"}</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
              {bizShowCityDrop && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setBizShowCityDrop(false)} />
                  <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-40 max-h-60 overflow-y-auto">
                    <button onClick={() => { setBizFilterCity(""); setBizShowCityDrop(false); }} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors cursor-pointer border-none ${!bizFilterCity ? "bg-blue-50 text-blue-600 font-bold" : "text-gray-700"}`}>All Cities</button>
                    {[...new Set(businesses.map((b) => b.city).filter(Boolean))].sort().map((city) => (
                      <button key={city} onClick={() => { setBizFilterCity(city); setBizShowCityDrop(false); }} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors cursor-pointer border-none ${bizFilterCity === city ? "bg-blue-50 text-blue-600 font-bold" : "text-gray-700"}`}>{city}</button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
            <button onClick={() => { const p = {}; if (searchQuery.trim()) p.q = searchQuery; if (bizFilterCategory) p.category_id = bizFilterCategory; if (bizFilterCity) p.city = bizFilterCity; loadBusinesses(p); }} className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md shadow-blue-500/20 cursor-pointer border-none">
              <Filter className="w-4 h-4" /> Apply
            </button>
            <button onClick={() => { setSearchQuery(""); setBizFilterCategory(""); setBizFilterCity(""); loadBusinesses(); }} className="flex items-center gap-2 px-5 py-2 bg-gray-100 text-gray-600 font-bold text-sm rounded-xl hover:bg-gray-200 transition-colors cursor-pointer border-none">
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
          </div>
        </div>

        {/* Cards */}
        {businessesLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
            <p className="text-sm text-gray-500">Loading businesses...</p>
          </div>
        ) : businesses.length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">No businesses found</h3>
            <p className="text-sm text-gray-500">Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {businesses.map((biz) => {
              const ci = ((biz.category_id || 1) - 1) % CAT_COLORS.length;
              return (
                <a key={biz.id} href={`/enduser/business/${biz.slug}`} className="group bg-white rounded-2xl overflow-hidden shadow-md shadow-gray-200/50 border border-gray-100 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 hover:-translate-y-1 no-underline">
                  <div className={`relative h-36 bg-gradient-to-br ${CAT_COLORS[ci]} overflow-hidden`}>
                    <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 300 150">
                      <circle cx="40" cy="30" r="2" fill="white" /><circle cx="120" cy="60" r="3" fill="white" />
                      <circle cx="200" cy="25" r="2" fill="white" /><circle cx="260" cy="80" r="2" fill="white" />
                      <line x1="40" y1="30" x2="120" y2="60" stroke="white" strokeWidth="0.5" />
                      <line x1="120" y1="60" x2="200" y2="25" stroke="white" strokeWidth="0.5" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform duration-300">
                        {biz.logo_url ? <img src={biz.logo_url} alt="" className="w-10 h-10 object-contain" /> : <span className="text-white font-extrabold text-lg">{biz.business_name?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "BZ"}</span>}
                      </div>
                    </div>
                    {biz.is_verified && <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full border border-white/30"><ShieldCheck className="w-3 h-3 text-white" /><span className="text-[10px] font-bold text-white">Verified</span></div>}
                  </div>
                  <div className="p-5">
                    <h3 className="text-sm font-extrabold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1 mb-1.5">{biz.business_name}</h3>
                    {biz.category_name && <span className={`inline-flex items-center gap-1 px-2 py-0.5 ${CAT_BGS[ci]} ${CAT_TEXTS[ci]} rounded-full text-[10px] font-bold mb-2`}><Tag className="w-2.5 h-2.5" />{biz.category_name}</span>}
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2.5"><MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" /><span className="line-clamp-1">{[biz.city, biz.state, biz.country].filter(Boolean).join(", ") || "Location not set"}</span></div>
                    {biz.subcategory_name && <div className="flex flex-wrap gap-1.5 mb-3">{biz.subcategory_name.split(",").slice(0, 3).map((tag, i) => <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-medium rounded-full">{tag.trim()}</span>)}</div>}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-1.5">
                        {biz.phone && <a href={`tel:${biz.phone}`} onClick={(e) => e.stopPropagation()} className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center hover:bg-emerald-100 transition-colors"><Phone className="w-3.5 h-3.5 text-emerald-600" /></a>}
                        {biz.phone && <a href={`https://wa.me/${biz.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center hover:bg-green-100 transition-colors"><MessageCircle className="w-3.5 h-3.5 text-green-600" /></a>}
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 group-hover:gap-2 transition-all">View Profile <ArrowRight className="w-3.5 h-3.5" /></span>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   BLOGS SECTION
   ============================================================ */
export function BlogsSection({ selectedBlog, setSelectedBlog }) {
  return (
    <div id="section-blogs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <span className="inline-block bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full mb-4">Blog</span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-6">Latest <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Insights & Updates</span></h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">Stay updated with the latest news, tips, and trends from the BizzProfiles team.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {BLOGS.map((blog) => (
            <article key={blog.id} onClick={() => setSelectedBlog(blog)} className="bg-white border border-gray-200/60 rounded-3xl overflow-hidden hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 hover:-translate-y-1 group cursor-pointer">
              <div className={`h-48 bg-gradient-to-br ${blog.color} flex items-center justify-center relative overflow-hidden`}>
                <div className="absolute inset-0 opacity-10"><svg className="w-full h-full"><defs><pattern id={`blog-${blog.id}`} width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="1.5" fill="white" /></pattern></defs><rect width="100%" height="100%" fill={`url(#blog-${blog.id})`} /></svg></div>
                <div className="relative z-10 w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300"><BookOpen className="w-8 h-8 text-white" /></div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3"><span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full"><Tag className="w-3 h-3" />{blog.category}</span></div>
                <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">{blog.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-4 line-clamp-2">{blog.excerpt}</p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-3"><span className="flex items-center gap-1"><User className="w-3 h-3" />{blog.author}</span><span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{blog.date}</span></div>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{blog.readTime}</span>
                </div>
                <div className="mt-4 flex items-center gap-2 text-indigo-600 text-sm font-semibold"><BookOpen className="w-4 h-4" /> Read More</div>
              </div>
            </article>
          ))}
        </div>
        <div className="bg-gradient-to-r from-gray-900 via-slate-900 to-indigo-950 rounded-3xl p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-5"><svg className="w-full h-full"><defs><pattern id="blog-cta" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M 30 0 L 0 0 0 30" fill="none" stroke="white" strokeWidth="0.5" /></pattern></defs><rect width="100%" height="100%" fill="url(#blog-cta)" /></svg></div>
          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-white mb-4">Want to Stay Updated?</h2>
            <p className="text-white/60 mb-8 text-lg">Subscribe to our newsletter for the latest business insights.</p>
            <button className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold rounded-full hover:from-indigo-700 hover:to-violet-700 transition-all shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:-translate-y-0.5 cursor-pointer border-none">Subscribe <ArrowRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   CONTACT SECTION
   ============================================================ */
export function ContactSection() {
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
  const [contactSent, setContactSent] = useState(false);

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactSent(true);
    setTimeout(() => setContactSent(false), 3000);
    setContactForm({ name: "", email: "", message: "" });
  };

  return (
    <div id="section-contact">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <span className="inline-block bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full mb-4">Contact</span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-6">Get in <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Touch</span></h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">Have a question or need assistance? We're here to help.</p>
        </div>
        <div className="grid lg:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div className="bg-white border border-gray-200/60 rounded-3xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg"><User className="w-7 h-7 text-white" /></div>
                <div><h3 className="text-xl font-bold text-gray-900">{CONTACT_FOUNDER.name}</h3><p className="text-sm text-gray-500">{CONTACT_FOUNDER.role}</p></div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-gray-600">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center"><Mail className="w-5 h-5 text-blue-600" /></div>
                  <div><p className="text-xs text-gray-400 font-medium">Email</p><p className="text-sm font-semibold text-gray-900">{CONTACT_FOUNDER.email}</p></div>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center"><MapPin className="w-5 h-5 text-emerald-600" /></div>
                  <div><p className="text-xs text-gray-400 font-medium">Location</p><p className="text-sm font-semibold text-gray-900">{CONTACT_FOUNDER.location}</p></div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {CONTACT_METHODS.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="bg-white border border-gray-200/60 rounded-2xl p-5 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                    <div className={`w-11 h-11 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md`}><Icon className="w-5 h-5 text-white" /></div>
                    <h5 className="font-bold text-gray-900 text-sm mb-1">{item.title}</h5>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bg-white border border-gray-200/60 rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Send a Message</h3>
              {contactSent && <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-6 flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" /><p className="text-emerald-700 font-medium text-sm">Message sent successfully!</p></div>}
              <form onSubmit={handleContactSubmit} className="space-y-5">
                <div><label className="block text-sm font-bold text-gray-700 mb-2">Name</label><input type="text" value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} placeholder="Your full name" required className="w-full px-5 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 placeholder:text-gray-400" /></div>
                <div><label className="block text-sm font-bold text-gray-700 mb-2">Email</label><input type="email" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} placeholder="you@example.com" required className="w-full px-5 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 placeholder:text-gray-400" /></div>
                <div><label className="block text-sm font-bold text-gray-700 mb-2">Message</label><textarea rows="5" value={contactForm.message} onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })} placeholder="How can we help you?" required className="w-full px-5 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 placeholder:text-gray-400 resize-none" /></div>
                <button type="submit" className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:via-indigo-700 hover:to-violet-700 transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl hover:-translate-y-0.5 cursor-pointer border-none"><Send className="w-4 h-4" /> Submit</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   GLOBAL CTA SECTION
   ============================================================ */
export function GlobalCTASection() {
  const navigate = useNavigate();
  return (
    <section className="py-16 px-4">
      <div className="max-w-4xl mx-auto bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 rounded-3xl p-12 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full"><defs><pattern id="cta-dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="1.5" fill="white" /></pattern></defs><rect width="100%" height="100%" fill="url(#cta-dots)" /></svg>
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-white/70 mb-8 text-lg">Join thousands of businesses already on BizzProfiles</p>
          <button onClick={() => navigate("/auth/enduser")} className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 font-bold rounded-full hover:bg-gray-100 transition-all shadow-xl cursor-pointer border-none">
            <Users className="w-4 h-4" /> Join Now
          </button>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   BLOG MODAL
   ============================================================ */
export function BlogModal({ selectedBlog, setSelectedBlog }) {
  if (!selectedBlog) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedBlog(null)}>
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className={`bg-gradient-to-br ${selectedBlog.color} p-6 relative`}>
          <button onClick={() => setSelectedBlog(null)} className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors border-none cursor-pointer"><X className="w-4 h-4 text-white" /></button>
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4"><BookOpen className="w-8 h-8 text-white" /></div>
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/20 text-white text-xs font-medium rounded-full mb-3"><Tag className="w-3 h-3" />{selectedBlog.category}</span>
          <h2 className="text-2xl font-bold text-white">{selectedBlog.title}</h2>
        </div>
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-6 pb-4 border-b border-gray-100">
            <span className="flex items-center gap-1"><User className="w-4 h-4" />{selectedBlog.author}</span>
            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{selectedBlog.date}</span>
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{selectedBlog.readTime}</span>
          </div>
          <p className="text-gray-600 leading-relaxed">{selectedBlog.excerpt}</p>
        </div>
        <div className="p-6 border-t border-gray-100 bg-gray-50">
          <button onClick={() => setSelectedBlog(null)} className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-violet-700 transition-all cursor-pointer border-none">Close</button>
        </div>
      </div>
    </div>
  );
}
