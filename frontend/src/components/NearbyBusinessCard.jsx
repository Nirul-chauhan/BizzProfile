import { Link } from "react-router-dom";
import { MapPin, Building2, ShieldCheck, MessageSquare } from "lucide-react";

export default function NearbyBusinessCard({ item, onInquire }) {
  const canInquire = item.profile_id != null;
  return (
    <div className="group bg-white rounded-2xl shadow-md shadow-gray-200/50 border border-gray-100 hover:shadow-xl transition-all duration-300 p-5 flex flex-col">
      <Link to={`/enduser/business/${item.slug}`} className="no-underline flex items-start gap-4">
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
            {item.is_verified && <ShieldCheck className="w-4 h-4 text-blue-500 flex-shrink-0" />}
          </div>
          {item.category_name && (
            <p className="text-xs text-gray-500 line-clamp-1">{item.category_name}</p>
          )}
          <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">
            {[item.address, item.city, item.state].filter(Boolean).join(", ") || "Location not set"}
          </p>
          {item.distance_km != null && (
            <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 text-[10px] font-extrabold">
              <MapPin className="w-2.5 h-2.5" />
              {Number(item.distance_km).toFixed(1)} km away
            </span>
          )}
        </div>
      </Link>
      <div className="flex items-center gap-2 pt-4 mt-auto border-t border-gray-100">
        <Link
          to={`/enduser/business/${item.slug}`}
          className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 no-underline"
        >
          View Business
        </Link>
        <button
          type="button"
          disabled={!canInquire}
          onClick={() =>
            canInquire &&
            onInquire({
              type: "business",
              id: item.profile_id,
              name: item.business_name,
              profile_id: item.profile_id,
            })
          }
          className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 disabled:opacity-50 border-none cursor-pointer"
        >
          <MessageSquare className="w-3.5 h-3.5" /> Inquire Now
        </button>
      </div>
    </div>
  );
}