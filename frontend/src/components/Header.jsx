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
  MapPin,
  Bell,
} from "lucide-react";
import MegaMenu from "./MegaMenu";
import GlobalSearch from "./GlobalSearch";
import {
  listNotifications,
  getUnreadNotificationsCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "../api";

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

function timeAgo(iso) {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? "1d ago" : `${days}d ago`;
}

export default function Header() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [user, setUser] = useState(getUserFromStorage);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showBellMenu, setShowBellMenu] = useState(false);

  useEffect(() => {
    setUser(getUserFromStorage());
  }, [pathname]);

  const refreshNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const [count, list] = await Promise.all([
        getUnreadNotificationsCount(),
        listNotifications(1, 10),
      ]);
      setUnreadCount(count?.unread ?? 0);
      setNotifications(list?.items || []);
    } catch {
      // Transient notification failures must never break the header.
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    refreshNotifications();
    const timer = setInterval(refreshNotifications, 30000);
    return () => clearInterval(timer);
  }, [user, refreshNotifications]);

  const handleNotificationClick = async (n) => {
    if (!n.is_read) {
      try {
        await markNotificationRead(n.id);
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {}
    }
    setShowBellMenu(false);
    navigate(getProfileRoute());
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setUnreadCount(0);
      const list = await listNotifications(1, 10);
      setNotifications(list?.items || []);
    } catch {}
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setShowProfileMenu(false);
    navigate("/");
  };

  const handleSearch = useCallback(
    (e) => {
      e.preventDefault();
      if (!searchQuery.trim()) return;
      // Location filtering lives on the Nearby Me page, which is the single
      // place it is offered. Keeping it out of the search bar avoids two
      // competing radius controls.
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    },
    [searchQuery, navigate]
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
              <GlobalSearch
                value={searchQuery}
                onChange={setSearchQuery}
                className="flex-1"
              />
              {/* Single entry point for location search. The Nearby Me page owns
                  the 1/3/5/10 km choice, so there is no radius control here and
                  no second "Nearby" button competing with it. */}
              <Link
                to="/nearby"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white text-gray-600 border border-gray-200 hover:border-rose-300 hover:text-rose-600 transition-all whitespace-nowrap no-underline"
              >
                <MapPin className="w-3.5 h-3.5" />
                Nearby Me
              </Link>
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

          {/* Right: Notifications / Profile */}
          {user ? (
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Notification bell */}
              <div className="relative">
                <button
                  onClick={() => {
                    if (!showBellMenu) refreshNotifications();
                    setShowBellMenu(!showBellMenu);
                  }}
                  className="relative flex items-center justify-center w-10 h-10 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer border-none"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5 text-gray-700" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {showBellMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowBellMenu(false)}
                    />
                    <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100">
                        <p className="text-sm font-bold text-gray-900">
                          Notifications
                        </p>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer border-none bg-transparent"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-gray-400">
                            <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
                            <p className="text-sm font-medium">
                              No notifications yet
                            </p>
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <button
                              key={n.id}
                              onClick={() => handleNotificationClick(n)}
                              className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-50 border-none ${
                                n.is_read ? "opacity-70" : "bg-blue-50/50"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-bold text-gray-900 truncate">
                                  {n.title}
                                </span>
                                <span className="text-[10px] text-gray-400 flex-shrink-0">
                                  {timeAgo(n.created_at)}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                {n.message}
                              </p>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Profile */}
              <div className="relative">
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
      {/* Visible at every breakpoint: MegaMenu renders the desktop nav row and,
          below `lg`, a horizontally scrolling category strip. This wrapper used
          to be `hidden lg:block`, which left mobile/tablet with no category
          navigation at all. */}
      {showNavLinks && (
        <div className="bg-gray-50/90 backdrop-blur-xl border-b border-gray-200/40">
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
            <Link
              to="/nearby"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 no-underline"
              onClick={() => setShowMobileMenu(false)}
            >
              <MapPin className="w-5 h-5" />
              Nearby Me
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
