import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Navigation,
  Loader2,
  Package,
  Wrench,
  Building2,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  Crosshair,
} from "lucide-react";
import { getNearbyAll } from "../api";
import useNearbyLocation from "../hooks/useNearbyLocation";

const RADII = [1, 3, 5, 10];

const GROUPS = [
  { key: "products", label: "Products", icon: Package, accent: "text-indigo-600", ring: "ring-indigo-100", bg: "bg-indigo-50" },
  { key: "services", label: "Services", icon: Wrench, accent: "text-emerald-600", ring: "ring-emerald-100", bg: "bg-emerald-50" },
  { key: "businesses", label: "Businesses", icon: Building2, accent: "text-blue-600", ring: "ring-blue-100", bg: "bg-blue-50" },
];

function DistanceBadge({ km }) {
  if (km == null) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 text-[10px] font-extrabold">
      <MapPin className="w-2.5 h-2.5" />
      {Number(km).toFixed(1)} km
    </span>
  );
}

function NearbyProductCard({ item }) {
  return (
    <Link
      to={`/products/${item.id}`}
      className="group bg-white rounded-2xl overflow-hidden shadow-md shadow-gray-200/50 border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 no-underline"
    >
      <div className="relative h-36 bg-gradient-to-br from-indigo-500 to-violet-600">
        {item.primary_image ? (
          <img src={item.primary_image} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-10 h-10 text-white/80" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <DistanceBadge km={item.distance_km} />
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-sm font-extrabold text-gray-900 group-hover:text-indigo-600 line-clamp-1">
          {item.name}
        </h3>
        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{item.business_name}</p>
        <div className="flex items-center justify-between pt-3 mt-2 border-t border-gray-100">
          <span className="text-sm font-extrabold text-gray-900">
            {item.price != null ? `₹${item.price}` : "Price on request"}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600">
            View <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function NearbyServiceCard({ item }) {
  const href =
    item.source === "biz_service" ? `/biz-services/${item.id}` : `/services/detail/${item.slug}`;
  return (
    <Link
      to={href}
      className="group bg-white rounded-2xl overflow-hidden shadow-md shadow-gray-200/50 border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 no-underline"
    >
      <div className="relative h-36 bg-gradient-to-br from-emerald-500 to-teal-600">
        {item.image_url ? (
          <img src={item.image_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Wrench className="w-10 h-10 text-white/80" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <DistanceBadge km={item.distance_km} />
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-sm font-extrabold text-gray-900 group-hover:text-emerald-600 line-clamp-1">
          {item.name}
        </h3>
        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
          {[item.provider_name, item.city].filter(Boolean).join(" · ")}
        </p>
        <div className="flex items-center justify-between pt-3 mt-2 border-t border-gray-100">
          <span className="text-sm font-extrabold text-gray-900">
            {item.price != null ? `₹${item.price}` : "Price on request"}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
            View <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function NearbyBusinessCard({ item }) {
  return (
    <Link
      to={`/enduser/business/${item.slug}`}
      className="group bg-white rounded-2xl shadow-md shadow-gray-200/50 border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 no-underline p-5"
    >
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {item.logo_url ? (
            <img src={item.logo_url} alt="" className="w-9 h-9 object-contain" />
          ) : (
            <Building2 className="w-6 h-6 text-blue-600" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-extrabold text-gray-900 group-hover:text-blue-600 line-clamp-1">
              {item.business_name}
            </h3>
            {item.is_verified && (
              <ShieldCheck className="w-4 h-4 text-blue-500 flex-shrink-0" />
            )}
          </div>
          {item.category_name && (
            <p className="text-xs text-gray-500 line-clamp-1">{item.category_name}</p>
          )}
          <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">
            {[item.address, item.city, item.state].filter(Boolean).join(", ") ||
              "Location not set"}
          </p>
          <div className="mt-2">
            <DistanceBadge km={item.distance_km} />
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function NearbyMe() {
  const { location, status, error, refresh } = useNearbyLocation();
  const [radius, setRadius] = useState(5);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    if (!location) return;
    setLoading(true);
    setLoadError("");
    try {
      const res = await getNearbyAll({
        latitude: location.lat,
        longitude: location.lng,
        radiusKm: radius,
        limit: 24,
      });
      setData(res);
    } catch {
      setData(null);
      setLoadError("Could not load nearby listings. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [location, radius]);

  useEffect(() => {
    load();
  }, [load]);

  const total = data
    ? GROUPS.reduce((sum, g) => sum + (data[g.key]?.items?.length || 0), 0)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-gray-900 via-slate-900 to-rose-950 relative overflow-hidden">
        <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 800 220">
          <circle cx="90" cy="50" r="2" fill="#fb7185" />
          <circle cx="300" cy="90" r="3" fill="#f472b6" />
          <circle cx="520" cy="40" r="2" fill="#fb7185" />
          <circle cx="700" cy="100" r="3" fill="#f472b6" />
        </svg>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 text-center relative z-10">
          <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 mx-auto mb-4">
            <Crosshair className="w-7 h-7 text-rose-400" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold text-white mb-3">Nearby Me</h1>
          <p className="text-white/60 text-base max-w-xl mx-auto">
            Products, services and businesses around you, sorted by distance.
          </p>

          {/* Radius chips */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 mt-8">
            {RADII.map((km) => (
              <button
                key={km}
                onClick={() => setRadius(km)}
                className={`px-5 py-2.5 rounded-xl text-sm font-extrabold transition-all cursor-pointer border ${
                  radius === km
                    ? "bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/30"
                    : "bg-white/10 text-white/80 border-white/20 hover:bg-white/20 hover:text-white backdrop-blur-sm"
                }`}
              >
                {km} km
              </button>
            ))}
          </div>

          {/* Location status */}
          <div className="mt-5 flex items-center justify-center gap-3 text-xs">
            {status === "locating" && (
              <span className="inline-flex items-center gap-1.5 text-white/70">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Finding your location...
              </span>
            )}
            {status === "ready" && location && (
              <span className="inline-flex items-center gap-1.5 text-white/70">
                <Navigation className="w-3.5 h-3.5 text-rose-400" />
                {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                <button
                  onClick={refresh}
                  className="inline-flex items-center gap-1 text-rose-300 hover:text-rose-200 cursor-pointer border-none bg-transparent font-bold"
                >
                  <RefreshCw className="w-3 h-3" /> update
                </button>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && !location && (
          <div className="mb-6 flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-900">{error}</p>
              <button
                onClick={refresh}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 cursor-pointer border-none"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Try again
              </button>
            </div>
          </div>
        )}

        {loadError && (
          <div className="mb-6 flex items-center gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-200">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <p className="text-sm font-bold text-rose-900">{loadError}</p>
          </div>
        )}

        {loading && !data ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-rose-600 animate-spin mb-4" />
            <p className="text-sm text-gray-500">Finding what's near you...</p>
          </div>
        ) : data && total === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Nothing within {radius} km
            </h3>
            <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
              Try a wider radius, or browse the full marketplace instead.
            </p>
            <div className="flex items-center justify-center gap-2">
              {(RADII.filter((r) => r > radius).length ? RADII.filter((r) => r > radius) : [10]).map((km) => (
                <button
                  key={km}
                  onClick={() => setRadius(km)}
                  className="px-4 py-2 rounded-xl bg-rose-500 text-white text-sm font-bold hover:bg-rose-600 cursor-pointer border-none"
                >
                  {km} km
                </button>
              ))}
            </div>
          </div>
        ) : data ? (
          <>
            <p className="text-sm text-gray-500 mb-8">
              <span className="font-extrabold text-gray-900">{total}</span> result
              {total === 1 ? "" : "s"} within {radius} km
            </p>
            <div className="space-y-10">
              {GROUPS.map((g) => {
                const items = data[g.key]?.items || [];
                if (!items.length) return null;
                const Icon = g.icon;
                return (
                  <div key={g.key}>
                    <div className="flex items-center gap-2.5 mb-4">
                      <span
                        className={`w-9 h-9 rounded-xl ${g.bg} ring-1 ${g.ring} flex items-center justify-center`}
                      >
                        <Icon className={`w-4.5 h-4.5 ${g.accent}`} />
                      </span>
                      <h2 className="text-lg font-extrabold text-gray-900">{g.label}</h2>
                      <span className="text-xs font-bold text-gray-400">{items.length}</span>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                      {items.map((item) => {
                        if (g.key === "products") return <NearbyProductCard key={`p${item.id}`} item={item} />;
                        if (g.key === "services") return <NearbyServiceCard key={`s${item.id}-${item.source}`} item={item} />;
                        return <NearbyBusinessCard key={`b${item.id}`} item={item} />;
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
