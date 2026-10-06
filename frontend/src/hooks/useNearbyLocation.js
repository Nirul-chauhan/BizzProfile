import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "bp_user_location";

// Remembered for 30 days; long enough to feel "stored", short enough that a user
// who has moved is not stuck with a stale pin.
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.lat !== "number" || typeof parsed?.lng !== "number") return null;
    if (Date.now() - (parsed.savedAt || 0) > MAX_AGE_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Resolves the visitor's coordinates once, then reuses the stored value.
 *
 * Priority: previously stored location -> browser geolocation. This means the
 * browser permission prompt appears at most once, not on every Nearby visit.
 */
export function useNearbyLocation() {
  const [location, setLocation] = useState(() => readStored());
  const [status, setStatus] = useState(() => (readStored() ? "ready" : "idle"));
  const [error, setError] = useState("");

  const store = useCallback((lat, lng) => {
    const entry = { lat, lng, savedAt: Date.now() };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
    } catch {
      /* private mode: fall back to in-memory only for this session */
    }
    setLocation(entry);
    setStatus("ready");
    setError("");
    return entry;
  }, []);

  // Detect on first mount only when nothing is stored yet.
  useEffect(() => {
    if (location) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => store(pos.coords.latitude, pos.coords.longitude),
      (err) => {
        setStatus("error");
        if (err.code === err.PERMISSION_DENIED) {
          setError(
            "Location permission denied. Enable it in your browser, or search by area name instead."
          );
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setError("Could not determine your location. Please try again.");
        } else {
          setError("Location request timed out. Please try again.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, [location, store]);

  const refresh = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }
    setStatus("locating");
    setError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => store(pos.coords.latitude, pos.coords.longitude),
      () => {
        setStatus("error");
        setError("Could not get your location. Please try again.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [store]);

  const clear = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* nothing to clean up */
    }
    setLocation(null);
    setStatus("idle");
  }, []);

  return { location, status, error, refresh, clear, setLocation: store };
}

export default useNearbyLocation;
