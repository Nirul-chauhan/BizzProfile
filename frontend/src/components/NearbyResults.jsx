import { Loader2, MapPin, Package, Wrench, Building2 } from "lucide-react";
import NearbyProductCard from "./NearbyProductCard";
import NearbyServiceCard from "./NearbyServiceCard";
import NearbyBusinessCard from "./NearbyBusinessCard";

const GROUPS = [
  { key: "products", label: "Products", icon: Package, accent: "text-indigo-600", bg: "bg-indigo-50" },
  { key: "services", label: "Services", icon: Wrench, accent: "text-emerald-600", bg: "bg-emerald-50" },
  { key: "businesses", label: "Businesses", icon: Building2, accent: "text-blue-600", bg: "bg-blue-50" },
];

export default function NearbyResults({ data, type, radius, loading, onInquire, onWiden }) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-rose-600 animate-spin mb-4" />
        <p className="text-sm text-gray-500">Finding nearby products, services and businesses...</p>
      </div>
    );
  }

  const visibleGroups =
    type === "products" || type === "best_sellers"
      ? GROUPS.filter((g) => g.key === "products")
      : type === "services"
        ? GROUPS.filter((g) => g.key === "services")
        : type === "businesses"
          ? GROUPS.filter((g) => g.key === "businesses")
          : GROUPS;

  const total = visibleGroups.reduce((sum, g) => sum + (data?.[g.key]?.items?.length || 0), 0);

  if (!data || total === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <MapPin className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">No nearby results found</h3>
        <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
          We couldn't find any approved products, services or businesses within {radius} KM. Try
          increasing your search radius.
        </p>
        {radius < 10 && (
          <button
            type="button"
            onClick={() => onWiden?.(10)}
            className="px-4 py-2 rounded-xl bg-rose-500 text-white text-sm font-bold hover:bg-rose-600 cursor-pointer border-none"
          >
            Try 10 KM
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <p className="text-sm text-gray-500">
        <span className="font-extrabold text-gray-900">{total}</span> result
        {total === 1 ? "" : "s"} within {radius} km
      </p>
      {visibleGroups.map((g) => {
        const items = data[g.key]?.items || [];
        if (!items.length) return null;
        const Icon = g.icon;
        return (
          <div key={g.key}>
            <div className="flex items-center gap-2.5 mb-4">
              <span className={`w-9 h-9 rounded-xl ${g.bg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${g.accent}`} />
              </span>
              <h2 className="text-lg font-extrabold text-gray-900">{g.label}</h2>
              <span className="text-xs font-bold text-gray-400">{items.length}</span>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {items.map((item, idx) => {
                if (g.key === "products")
                  return <NearbyProductCard key={`p${item.id}-${idx}`} item={item} onInquire={onInquire} />;
                if (g.key === "services")
                  return (
                    <NearbyServiceCard
                      key={`s${item.id}-${item.source}-${idx}`}
                      item={item}
                      onInquire={onInquire}
                    />
                  );
                return <NearbyBusinessCard key={`b${item.id}-${idx}`} item={item} onInquire={onInquire} />;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}