import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Grid3X3, Home, User, Briefcase, SquarePen, List, ChevronDown, ShieldCheck, UserCheck, Users, LogOut, UserCircle, Menu, X } from "lucide-react";

const NAV_LINKS = [
  { id: "home", label: "Home", icon: Home },
  { id: "about", label: "About", icon: User },
  { id: "business", label: "Business", icon: Briefcase },
  { id: "blogs", label: "Blogs", icon: SquarePen },
  { id: "contact", label: "Contact Us", icon: List },
];

const AUTH_OPTIONS = [
  { path: "/auth/admin", label: "Join as Admin", icon: ShieldCheck, color: "from-blue-500 to-indigo-600" },
  { path: "/auth/customer", label: "Join as Customer", icon: UserCheck, color: "from-emerald-500 to-teal-600" },
  { path: "/auth/enduser", label: "Join as End User", icon: Users, color: "from-amber-500 to-orange-600" },
];

const ROLE_ROUTES = {
  ADMIN: "/admin/dashboard",
  CUSTOMER: "/customer/dashboard",
  ENDUSER: "/enduser",
};

function getUserFromStorage() {
  try {
    const stored = localStorage.getItem("user");
    if (stored) return JSON.parse(stored);
  } catch {}
  return null;
}

export default function Header() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [showAuthMenu, setShowAuthMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [user, setUser] = useState(getUserFromStorage);

  useEffect(() => {
    setUser(getUserFromStorage());
  }, [pathname]);

  const isActive = (id) => {
    if (pathname === "/" || pathname === "/enduser") {
      const hash = window.location.hash.replace("#section-", "");
      return hash === id || (!hash && id === "home");
    }
    return false;
  };

  const scrollToSection = (id) => {
    setShowMobileMenu(false);
    if (pathname === "/enduser") {
      const el = document.getElementById(`section-${id}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (pathname === "/") {
      const el = document.getElementById(`section-${id}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      navigate(`/#section-${id}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setShowProfileMenu(false);
    navigate("/");
  };

  const getProfileRoute = () => {
    if (!user) return "/";
    const roleName = typeof user.role === "string" ? user.role : user.role?.name;
    return ROLE_ROUTES[roleName] || "/";
  };

  const roleName = user ? (typeof user.role === "string" ? user.role : user.role?.name) : null;
  const showNavLinks = !user || roleName === "ENDUSER";
  const displayRole = roleName === "ENDUSER" ? "USER" : roleName === "ADMIN" ? "ADMIN" : roleName === "CUSTOMER" ? "CUSTOMER" : "USER";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link to={user ? getProfileRoute() : "/"} className="flex items-center gap-2.5 no-underline">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Grid3X3 className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent tracking-tight">
            BizzProfiles
          </span>
        </Link>

        {/* Center Nav Links - Only for non-logged-in or EndUser */}
        {showNavLinks && (
          <>
            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1 bg-gray-100/60 rounded-2xl p-1.5">
              {NAV_LINKS.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.id);
                return (
                  <button
                    key={link.id}
                    onClick={() => scrollToSection(link.id)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer border-none ${
                      active
                        ? "bg-white text-blue-600 shadow-md shadow-blue-500/10"
                        : "text-gray-500 hover:text-gray-900 hover:bg-white/50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden lg:inline">{link.label}</span>
                  </button>
                );
              })}
            </nav>
            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden flex items-center justify-center w-10 h-10 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer border-none"
            >
              {showMobileMenu ? <X className="w-5 h-5 text-gray-700" /> : <Menu className="w-5 h-5 text-gray-700" />}
            </button>
          </>
        )}

        {/* Right Side: Login/Register OR Profile */}
        {user ? (
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl hover:from-gray-200 hover:to-gray-300 transition-all cursor-pointer border-none"
            >
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
                {user.profile_pic ? (
                  <img src={user.profile_pic} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-white font-bold text-sm">{user.full_name?.charAt(0) || "U"}</span>
                )}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-sm font-bold text-gray-900 leading-tight">{user.full_name}</div>
                <div className="text-[10px] text-gray-500">{displayRole}</div>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showProfileMenu ? "rotate-180" : ""}`} />
            </button>

            {showProfileMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                  <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
                    <p className="text-sm font-bold text-gray-900">{user.full_name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        navigate(getProfileRoute());
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer border-none bg-transparent text-left"
                    >
                      <UserCircle className="w-5 h-5 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">My Dashboard</span>
                    </button>
                    {roleName === "ADMIN" && (
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          navigate("/admin/profile");
                        }}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer border-none bg-transparent text-left"
                      >
                        <UserCircle className="w-5 h-5 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Edit Profile</span>
                      </button>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-red-50 transition-colors cursor-pointer border-none bg-transparent text-left"
                    >
                      <LogOut className="w-5 h-5 text-red-500" />
                      <span className="text-sm font-medium text-red-600">Logout</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="relative">
            <button
              onClick={() => setShowAuthMenu(!showAuthMenu)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white font-bold text-sm rounded-xl hover:from-blue-700 hover:via-indigo-700 hover:to-violet-700 transition-all shadow-lg shadow-blue-500/25 cursor-pointer border-none"
            >
              Login / Register
              <ChevronDown className={`w-4 h-4 transition-transform ${showAuthMenu ? "rotate-180" : ""}`} />
            </button>

            {showAuthMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowAuthMenu(false)} />
                <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                  <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
                    <p className="text-sm font-bold text-gray-900">Choose your role</p>
                    <p className="text-xs text-gray-500">Select how you want to join</p>
                  </div>
                  <div className="p-2">
                    {AUTH_OPTIONS.map((option) => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.path}
                          onClick={() => {
                            setShowAuthMenu(false);
                            navigate(option.path);
                          }}
                          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer border-none bg-transparent text-left"
                        >
                          <div className={`w-10 h-10 bg-gradient-to-br ${option.color} rounded-xl flex items-center justify-center shadow-md`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-sm font-bold text-gray-900">{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Mobile Menu Dropdown */}
      {showMobileMenu && showNavLinks && (
        <div className="md:hidden bg-white border-b border-gray-200 shadow-lg">
          <nav className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-1">
            {NAV_LINKS.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.id);
              return (
                <button
                  key={link.id}
                  onClick={() => scrollToSection(link.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer border-none text-left ${
                    active
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {link.label}
                </button>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
