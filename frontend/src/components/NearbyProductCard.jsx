import { Link } from "react-router-dom";
import { MapPin, Package, ArrowRight, MessageSquare } from "lucide-react";

export default function NearbyProductCard({ item, onInquire }) {
  const canInquire = item.profile_id != null;
  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-md shadow-gray-200/50 border border-gray-100 hover:shadow-xl transition-all duration-300 flex flex-col">
      <Link to={`/products/${item.id}`} className="no-underline block">
        <div className="relative h-36 bg-gradient-to-br from-indigo-500 to-violet-600">
          {item.primary_image ? (
            <img src={item.primary_image} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-10 h-10 text-white/80" />
            </div>
          )}
          {item.distance_km != null && (
            <span className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/95 text-rose-600 text-[10px] font-extrabold">
              <MapPin className="w-2.5 h-2.5" />
              {Number(item.distance_km).toFixed(1)} km
            </span>
          )}
        </div>
      </Link>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-sm font-extrabold text-gray-900 line-clamp-1">{item.name}</h3>
        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{item.business_name}</p>
        <div className="mt-2">
          <span className="text-sm font-extrabold text-gray-900">
            {item.price != null ? `₹${item.price}` : "Price on request"}
          </span>
          {item.price_unit && <span className="text-xs text-gray-400"> / {item.price_unit}</span>}
        </div>
        <div className="flex items-center gap-2 pt-3 mt-auto border-t border-gray-100">
          <Link
            to={`/products/${item.id}`}
            className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 no-underline"
          >
            View Details <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <button
            type="button"
            disabled={!canInquire}
            onClick={() =>
              canInquire &&
              onInquire({ type: "product", id: item.id, name: item.name, profile_id: item.profile_id })
            }
            className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 border-none cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" /> Inquire Now
          </button>
        </div>
      </div>
    </div>
  );
}