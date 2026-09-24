import { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Grid3X3,
  Home,
  User,
  Briefcase,
  SquarePen,
  List,
  ChevronDown,
  ShieldCheck,
  UserCheck,
  Users,
  LogOut,
  UserCircle,
  Menu,
  X,
  Search,
  Navigation,
} from "lucide-react";
import MegaMenu from "./MegaMenu";

const ROLE_ROUTES = {
  ADMIN: "/admin/dashboard",
  BUYER: "/buyer/dashboard",
  SELLER: "/seller/dashboard",
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
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [user, setUser] = useState(getUserFromStorage);
  const [searchQuery, setSearchQuery] = useState("");
  const [nearbyMode, setNearbyMode] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [radiusKm, setRadiusKm] = useState(10);

  useEffect(() => {
    setUser(getUserFromStorage());
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setShowProfileMenu(false);
    navigate("/");
  };

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setNearbyMode(true);
        setLocationLoading(false);
      },
      () => {
        setLocationLoading(false);
        setNearbyMode(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const handleSearch = useCallback(
    (e) => {
      e.preventDefault();
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      if (nearbyMode && userLocation) {
        params.set("latitude", userLocation.lat);
        params.set("longitude", userLocation.lng);
        params.set("radius_km", radiusKm);
      }
      navigate(`/search?${params.toString()}`);
    },
    [searchQuery, nearbyMode, userLocation, radiusKm, navigate]
  );

  const getProfileRoute = () => {
    if (!user) return "/";
    const roleName = typeof user.role === "string" ? user.role : user.role?.name;
    return ROLE_ROUTES[roleName] || "/";
  };

  const roleName = user
    ? typeof user.role === "string"
      ? user.role
      : user.role?.name
    : null;
  const showNavLinks = !user || roleName === "SELLER" || roleName === "ENDUSER";
  const displayRole =
    roleName === "SELLER" || roleName === "ENDUSER"
      ? "USER"
      : roleName === "ADMIN"
        ? "ADMIN"
        : roleName === "BUYER" || roleName === "CUSTOMER"
          ? "BUYER"
          : "USER";

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* ── Top Bar ── */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link
            to={user ? getProfileRoute() : "/"}
            className="flex items-center gap-2.5 no-underline flex-shrink-0"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Grid3X3 className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent tracking-tight hidden sm:block">
              BizzProfiles
            </span>
          </Link>

          {/* Search */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex items-center gap-2 flex-1 max-w-lg mx-4"
          >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products, services, businesses..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
              <button
                type="button"
                onClick={detectLocation}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all whitespace-nowrap ${
                  nearbyMode && userLocation
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
                }`}
              >
                {locationLoading ? (
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Navigation className="w-3.5 h-3.5" />
                )}
                Nearby
              </button>
              {nearbyMode && userLocation && (
                <div className="flex items-center gap-1.5">
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(parseInt(e.target.value))}
                    className="w-16 accent-indigo-600"
                  />
                  <span className="text-[10px] text-gray-500 whitespace-nowrap">
                    {radiusKm}km
                  </span>
                </div>
              )}
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all"
              >
                Search
              </button>
            </form>
          <div className="flex-1 md:hidden" />

          {/* Mobile hamburger */}
          {showNavLinks && (
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden flex items-center justify-center w-10 h-10 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer border-none"
            >
              {showMobileMenu ? (
                <X className="w-5 h-5 text-gray-700" />
              ) : (
                <Menu className="w-5 h-5 text-gray-700" />
              )}
            </button>
          )}

          {/* Right: Login / Profile */}
          {user ? (
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-3 px-3 py-1.5 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl hover:from-gray-200 hover:to-gray-300 transition-all cursor-pointer border-none"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
                  {user.profile_pic ? (
                    <img
                      src={user.profile_pic}
                      alt=""
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-bold text-sm">
                      {user.full_name?.charAt(0) || "U"}
                    </span>
                  )}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-bold text-gray-900 leading-tight">
                    {user.full_name}
                  </div>
                  <div className="text-[10px] text-gray-500">{displayRole}</div>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-gray-500 transition-transform ${showProfileMenu ? "rotate-180" : ""}`}
                />
              </button>

              {showProfileMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowProfileMenu(false)}
                  />
                  <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                    <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
                      <p className="text-sm font-bold text-gray-900">
                        {user.full_name}
                      </p>
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
                        <span className="text-sm font-medium text-gray-700">
                          My Dashboard
                        </span>
                      </button>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-red-50 transition-colors cursor-pointer border-none bg-transparent text-left"
                      >
                        <LogOut className="w-5 h-5 text-red-500" />
                        <span className="text-sm font-medium text-red-600">
                          Logout
                        </span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex-shrink-0">
              <button
                onClick={() => navigate("/login")}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white font-bold text-sm rounded-xl hover:from-blue-700 hover:via-indigo-700 hover:to-violet-700 transition-all shadow-lg shadow-blue-500/25 cursor-pointer border-none whitespace-nowrap"
              >
                Login / Sign Up
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Category Bar ── */}
      {showNavLinks && (
        <div className="bg-gray-50/90 backdrop-blur-xl border-b border-gray-200/40 hidden lg:block">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <MegaMenu />
          </div>
        </div>
      )}

      {/* ── Mobile Menu ── */}
      {showMobileMenu && showNavLinks && (
        <div className="lg:hidden bg-white border-b border-gray-200 shadow-lg">
          <nav className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-1">
            <Link
              to="/"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 no-underline"
              onClick={() => setShowMobileMenu(false)}
            >
              <Home className="w-5 h-5" />
              Home
            </Link>
            <Link
              to="/categories"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 no-underline"
              onClick={() => setShowMobileMenu(false)}
            >
              <Grid3X3 className="w-5 h-5" />
              All Categories
            </Link>
            <Link
              to="/businesses"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 no-underline"
              onClick={() => setShowMobileMenu(false)}
            >
              <Briefcase className="w-5 h-5" />
              Businesses
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
