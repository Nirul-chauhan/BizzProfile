const KEY = "bizzprofile_pending_enquiry";

export function saveEnquiryDraft(draft) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(draft));
  } catch (_) {}
}

export function takeEnquiryDraft() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    sessionStorage.removeItem(KEY);
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
}