import { useState, useEffect } from "react";
import { Apple, Play, QrCode, Smartphone } from "lucide-react";
import { getAppPromo } from "../api";

/* ─── APP / PROMOTIONAL SECTION ─────────────────────────────────
   Sits right after Featured Businesses on the Home page.
   Everything (heading, description, image, QR, store links) is
   read from the database via /api/public/app-promo.
------------------------------------------------------------------ */

function PhoneMockup() {
  return (
    <div className="mx-auto w-56 sm:w-64">
      <div className="rounded-[2rem] border-[10px] border-gray-900 bg-white shadow-2xl overflow-hidden">
        <div className="h-7 bg-gray-900 flex items-center justify-center">
          <span className="h-1.5 w-16 rounded-full bg-gray-700" />
        </div>
        <div className="bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 text-white p-4">
          <img src="/favicon.svg" alt="BizzProfile" className="w-10 h-10 mb-2" />
          <p className="text-sm font-extrabold leading-tight">BizzProfiles</p>
          <p className="text-[11px] text-indigo-100">B2B Marketplace</p>
        </div>
        <div className="p-4 space-y-3 bg-gray-50">
          <div className="h-8 rounded-lg bg-white border border-gray-200 flex items-center px-2 gap-2">
            <QrCode className="w-3.5 h-3.5 text-gray-400" />
            <span className="h-2 w-20 rounded bg-gray-200" />
          </div>
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-2">
              <span className="w-7 h-7 rounded-md bg-indigo-100 flex items-center justify-center">
                <Smartphone className="w-3.5 h-3.5 text-indigo-500" />
              </span>
              <span className="flex-1 space-y-1">
                <span className="block h-2 w-24 rounded bg-gray-200" />
                <span className="block h-2 w-16 rounded bg-gray-100" />
              </span>
            </div>
          ))}
        </div>
        <div className="h-6 bg-gray-900 flex justify-center items-end pb-1">
          <span className="h-1 w-20 rounded-full bg-gray-700" />
        </div>
      </div>
    </div>
  );
}

function StoreButton({ href, icon: Icon, kicker, label }) {
  const enabled = Boolean(href);
  const className = `flex items-center gap-3 rounded-xl bg-gray-900 text-white px-4 py-2.5 min-w-[190px] border-none ${
    enabled ? "hover:bg-gray-800 cursor-pointer" : "opacity-50 cursor-not-allowed"
  }`;
  const content = (
    <>
      <Icon className="w-6 h-6 flex-shrink-0" />
      <span className="flex flex-col items-start leading-tight">
        <span className="text-[10px] uppercase tracking-wide text-gray-300">{kicker}</span>
        <span className="text-sm font-bold">{label}</span>
      </span>
    </>
  );

  if (!enabled) {
    return (
      <span className={className} title="Add this link in Admin → App Promo">
        {content}
      </span>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {content}
    </a>
  );
}

export default function AppPromoSection() {
  const [promo, setPromo] = useState(null);

  useEffect(() => {
    getAppPromo()
      .then((data) => setPromo(data && data.is_active !== false ? data : null))
      .catch(() => setPromo(null));
  }, []);

  if (!promo) return null;

  return (
    <section className="py-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-purple-50 shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 lg:items-center gap-6 lg:gap-10 p-6 sm:p-8 lg:p-12">
            {/* Left: app promotional image */}
            <div className="flex items-center justify-center">
              {promo.image_url ? (
                <img
                  src={promo.image_url}
                  alt="BizzProfile app"
                  className="w-full max-w-md max-h-96 object-contain rounded-2xl"
                />
              ) : (
                <PhoneMockup />
              )}
            </div>

            {/* Right: download content */}
            <div className="text-center lg:text-left">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-bold uppercase tracking-wide">
                <Smartphone className="w-3.5 h-3.5" /> BizzProfile Mobile App
              </span>
              <h2 className="mt-4 text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                {promo.heading}
              </h2>
              {promo.description && (
                <p className="mt-3 text-sm sm:text-base text-gray-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
                  {promo.description}
                </p>
              )}

              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-5">
                <div className="flex flex-col items-center">
                  <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
                    <img
                      src={promo.qr_code_url || "/api/public/app-promo/qr"}
                      alt="Scan the QR code to download the BizzProfile app"
                      className="w-28 h-28 object-contain"
                      loading="lazy"
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] font-semibold text-gray-500 flex items-center gap-1">
                    <QrCode className="w-3 h-3" /> Scan to download
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <StoreButton href={promo.google_play_url} icon={Play} kicker="Get it on" label="Google Play" />
                  <StoreButton href={promo.app_store_url} icon={Apple} kicker="Download on the" label="App Store" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
