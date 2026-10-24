import { useCallback, useState } from "react";

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

  // Do not auto-detect on mount; require explicit user action as per requirements

  const refresh = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      setStatus("error");
      return;
    }
    setStatus("locating");
    setError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => store(pos.coords.latitude, pos.coords.longitude),
      (err) => {
        setStatus("error");
        if (err.code === err.PERMISSION_DENIED) {
          setError("Location access was denied. Please allow location access or search using another location.");
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setError("Location unavailable. Please try again.");
        } else {
          setError("Unable to find nearby results. Please try again.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [store]);

  const requestLocation = refresh;

  const clear = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* nothing to clean up */
    }
    setLocation(null);
    setStatus("idle");
  }, []);

  return { location, status, error, refresh, requestLocation, clear, setLocation: store };
}

export default useNearbyLocation;
