import { useCallback, useEffect, useState } from "react";
import {
  MapPin,
  Navigation,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Crosshair,
  CheckCircle2,
} from "lucide-react";
import { getNearbyAll, getCategories, getAuthToken } from "../api";
import useNearbyLocation from "../hooks/useNearbyLocation";
import NearbyFilters from "./NearbyFilters";
import NearbyResults from "./NearbyResults";
import EnquiryFormModal from "./EnquiryFormModal";
import { takeEnquiryDraft } from "./enquiryDraft";

const RADII = [1, 3, 5, 10];

export default function NearbyMe() {
  const { location, status, error, requestLocation } = useNearbyLocation();
  const [radius, setRadius] = useState(5);
  const [type, setType] = useState("all");
  const [categoryId, setCategoryId] = useState(null);
  const [sort, setSort] = useState("nearest");
  const [categories, setCategories] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [searchNonce, setSearchNonce] = useState(0);
  const [inquiryTarget, setInquiryTarget] = useState(null);
  const [inquiryDraft, setInquiryDraft] = useState(null);

  useEffect(() => {
    getCategories()
      .then((res) => setCategories(Array.isArray(res) ? res : res?.items || []))
      .catch(() => setCategories([]));
  }, []);

  // Resume an enquiry that was interrupted by the login redirect.
  useEffect(() => {
    const draft = takeEnquiryDraft();
    if (draft && draft.target && getAuthToken()) {
      setInquiryDraft(draft);
      setInquiryTarget(draft.target);
    }
  }, []);

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
        categoryId,
        bestSellersOnly: type === "best_sellers",
        sort,
      });
      setData(res);
    } catch (e) {
      setData(null);
      setLoadError(e?.message || "Unable to find nearby results. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [location, radius, categoryId, sort, type]);

  useEffect(() => {
    if (hasSearched && location) load();
  }, [hasSearched, location, radius, categoryId, sort, type, searchNonce, load]);

  const handleFindNearby = () => {
    if (!location) return;
    setHasSearched(true);
    setSearchNonce((n) => n + 1);
  };

  const locating = status === "locating";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-gray-900 via-slate-900 to-rose-950 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="text-center">
            <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 mx-auto mb-4">
              <Crosshair className="w-7 h-7 text-rose-400" />
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-white mb-3">Nearby Me</h1>
            <p className="text-white/60 text-base max-w-xl mx-auto">
              Find products &amp; services near you, sorted by real distance.
            </p>
          </div>

          <div className="max-w-xl mx-auto mt-8 bg-white rounded-2xl shadow-xl p-6">
            <h2 className="flex items-center justify-center gap-2 text-base font-extrabold text-gray-900 mb-4">
              <MapPin className="w-5 h-5 text-rose-500" />
              Find Products &amp; Services Near You
            </h2>

            {!location ? (
              <div className="text-center">
                <button
                  type="button"
                  onClick={requestLocation}
                  disabled={locating}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-rose-500 text-white text-sm font-extrabold hover:bg-rose-600 disabled:opacity-60 cursor-pointer border-none shadow-lg shadow-rose-500/25"
                >
                  {locating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Detecting your location...
                    </>
                  ) : (
                    <>
                      <Navigation className="w-4 h-4" /> Use My Current Location
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-sm font-bold text-emerald-600">
                <CheckCircle2 className="w-4 h-4" /> Location detected successfully.
                <button
                  type="button"
                  onClick={requestLocation}
                  className="inline-flex items-center gap-1 text-rose-500 hover:text-rose-600 font-bold bg-transparent border-none cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" /> Change Location
                </button>
              </div>
            )}

            {error && (
              <div className="mt-5 flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-amber-900">{error}</p>
                  <button
                    type="button"
                    onClick={requestLocation}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 cursor-pointer border-none"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Try Again
                  </button>
                </div>
              </div>
            )}

            <div className="mt-6">
              <p className="text-xs font-bold text-gray-400 uppercase mb-2 text-center">
                Search Radius
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                {RADII.map((km) => (
                  <button
                    key={km}
                    type="button"
                    onClick={() => setRadius(km)}
                    className={`px-5 py-2.5 rounded-xl text-sm font-extrabold transition-all cursor-pointer border ${
                      radius === km
                        ? "bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/30"
                        : "bg-white text-gray-600 border-gray-200 hover:border-rose-300 hover:text-rose-600"
                    }`}
                  >
                    {km} KM
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleFindNearby}
              disabled={!location || locating}
              className="w-full mt-6 py-3 rounded-xl bg-gray-900 text-white text-sm font-extrabold hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed border-none cursor-pointer inline-flex items-center justify-center gap-2"
            >
              <MapPin className="w-4 h-4" /> Find Nearby
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {hasSearched && (
          <div className="mb-6">
            <NearbyFilters
              type={type}
              onTypeChange={setType}
              categories={categories}
              categoryId={categoryId}
              onCategoryChange={setCategoryId}
              sort={sort}
              onSortChange={setSort}
            />
          </div>
        )}

        {loadError && (
          <div className="mb-6 flex items-start gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-200">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-rose-900">{loadError}</p>
              <button
                type="button"
                onClick={load}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 cursor-pointer border-none"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Try Again
              </button>
            </div>
          </div>
        )}

        {hasSearched ? (
          <NearbyResults
            data={data}
            type={type}
            radius={radius}
            loading={loading}
            onInquire={setInquiryTarget}
            onWiden={(km) => setRadius(km)}
          />
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Find products & services near you</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Allow location access, choose a radius, then tap “Find Nearby” to see real listings
              around you.
            </p>
          </div>
        )}
      </div>

      <EnquiryFormModal
        open={!!inquiryTarget}
        target={inquiryTarget}
        onClose={() => {
          setInquiryTarget(null);
          setInquiryDraft(null);
        }}
        restoreKey={inquiryDraft ? inquiryDraft.target.id : null}
        initialValues={inquiryDraft}
      />
    </div>
  );
}