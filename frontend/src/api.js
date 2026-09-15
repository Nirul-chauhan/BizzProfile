const API_BASE = "/api";

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const config = {
    headers: { "Content-Type": "application/json" },
    ...options,
  };

  const res = await fetch(url, config);
  const text = await res.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Server error. Please make sure the backend is running on port 8000.");
  }

  if (!res.ok) {
    let msg = "Something went wrong";
    if (data.detail) {
      if (typeof data.detail === "string") {
        msg = data.detail;
      } else if (Array.isArray(data.detail)) {
        msg = data.detail.map((d) => d.msg || JSON.stringify(d)).join(", ");
      } else if (typeof data.detail === "object") {
        msg = data.detail.msg || JSON.stringify(data.detail);
      }
    }
    throw new Error(msg);
  }

  return data;
}

export async function sendOtp({ email, mobile, purpose = "MOBILE_VERIFICATION" }) {
  return request("/auth/send-otp", {
    method: "POST",
    body: JSON.stringify({ email, mobile, purpose }),
  });
}

export async function verifyOtp({ email, mobile, otp, purpose = "MOBILE_VERIFICATION" }) {
  return request("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({ email, mobile, otp, purpose }),
  });
}

export async function register({ full_name, email, mobile, password, city, state, country, role = "USER" }) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify({ full_name, email, mobile, password, city, state, country, role }),
  });
}

export async function login({ email, password }) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function forgotPassword({ email }) {
  return request("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword({ email, otp, new_password }) {
  return request("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ email, otp, purpose: "FORGOT_PASSWORD", new_password }),
  });
}

export async function updateProfile({ full_name, city, state, country }) {
  const token = localStorage.getItem("token");
  return request("/auth/me", {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ full_name, city, state, country }),
  });
}

export async function uploadProfilePic(file) {
  const token = localStorage.getItem("token");
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/auth/me/profile-pic", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Server error");
  }
  if (!res.ok) {
    throw new Error(data.detail || "Upload failed");
  }
  return data;
}

export async function removeProfilePic() {
  const token = localStorage.getItem("token");
  const res = await fetch("/api/auth/me/profile-pic", {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Server error");
  }
  if (!res.ok) {
    throw new Error(data.detail || "Remove failed");
  }
  return data;
}

export async function searchProfiles({ q, category_id, city, page = 1, page_size = 20 } = {}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (category_id) params.set("category_id", category_id);
  if (city) params.set("city", city);
  params.set("page", page);
  params.set("page_size", page_size);
  return request(`/search?${params.toString()}`);
}

export async function getPublicProfile(slug) {
  return request(`/public/profiles/${slug}`);
}

export async function getCategories() {
  return request("/categories");
}

export async function getPopularCategories() {
  return request("/categories/popular");
}

export async function getFeaturedBusinesses(limit = 6) {
  const params = new URLSearchParams();
  if (limit) params.set("limit", limit);
  return request(`/public/featured-businesses?${params.toString()}`);
}

export async function adminListBusinesses({ search, is_featured, page = 1, page_size = 20 } = {}) {
  const token = localStorage.getItem("token");
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (is_featured !== undefined && is_featured !== null) params.set("is_featured", is_featured);
  params.set("page", page);
  params.set("page_size", page_size);
  return request(`/admin/featured-businesses?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function adminToggleFeatured(businessId, isFeatured, featuredOrder = null) {
  const token = localStorage.getItem("token");
  return request(`/admin/featured-businesses/${businessId}/toggle-featured`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ is_featured: isFeatured, featured_order: featuredOrder }),
  });
}

export async function adminCreateFeaturedBusiness(data) {
  const token = localStorage.getItem("token");
  return request("/admin/featured-businesses", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
}

export async function adminListCategories() {
  const token = localStorage.getItem("token");
  return request("/admin/categories", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function adminCreateCategory(data) {
  const token = localStorage.getItem("token");
  return request("/admin/categories", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
}

export async function adminUpdateCategory(categoryId, data) {
  const token = localStorage.getItem("token");
  return request(`/admin/categories/${categoryId}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
}

export async function adminDeleteCategory(categoryId) {
  const token = localStorage.getItem("token");
  return request(`/admin/categories/${categoryId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function adminCreateSubcategory(categoryId, data) {
  const token = localStorage.getItem("token");
  return request(`/admin/categories/${categoryId}/subcategories`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
}

export async function adminUpdateSubcategory(subcategoryId, data) {
  const token = localStorage.getItem("token");
  return request(`/admin/subcategories/${subcategoryId}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
}

export async function adminDeleteSubcategory(subcategoryId) {
  const token = localStorage.getItem("token");
  return request(`/admin/subcategories/${subcategoryId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function adminListSubcategories(categoryId = null) {
  const token = localStorage.getItem("token");
  const params = new URLSearchParams();
  if (categoryId) params.set("category_id", categoryId);
  const qs = params.toString();
  return request(`/admin/subcategories${qs ? `?${qs}` : ""}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function adminUploadCategoryLogo(categoryId, file) {
  const token = localStorage.getItem("token");
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`/api/admin/categories/${categoryId}/logo`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Server error");
  }
  if (!res.ok) {
    throw new Error(data.detail || "Upload failed");
  }
  return data;
}

export async function getMyProfiles() {
  const token = localStorage.getItem("token");
  return request("/profiles/my", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function createProfile(data) {
  const token = localStorage.getItem("token");
  return request("/profiles", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
}

export async function updateProfileById(profileId, data) {
  const token = localStorage.getItem("token");
  return request(`/profiles/${profileId}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
}

export async function deleteProfile(profileId) {
  const token = localStorage.getItem("token");
  return request(`/profiles/${profileId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getProfileDocuments(profileId) {
  const token = localStorage.getItem("token");
  return request(`/profiles/${profileId}/documents`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function uploadDocument(profileId, file, documentType) {
  const token = localStorage.getItem("token");
  const formData = new FormData();
  formData.append("file", file);
  formData.append("document_type", documentType);
  const res = await fetch(`/api/profiles/${profileId}/documents`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { throw new Error("Server error"); }
  if (!res.ok) throw new Error(data.detail || "Upload failed");
  return data;
}

export async function deleteDocument(documentId) {
  const token = localStorage.getItem("token");
  return request(`/documents/${documentId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getNearbyProfiles(latitude, longitude, radiusKm = 10, page = 1, pageSize = 20) {
  const params = new URLSearchParams();
  params.set("latitude", latitude);
  params.set("longitude", longitude);
  params.set("radius_km", radiusKm);
  params.set("page", page);
  params.set("page_size", pageSize);
  return request(`/profiles/nearby?${params.toString()}`);
}

export async function getSubcategories(categoryId) {
  return request(`/categories/${categoryId}/subcategories`);
}

export async function adminListProfiles({ search, is_verified, is_active, page = 1, page_size = 20 } = {}) {
  const token = localStorage.getItem("token");
  const params = new URLSearchParams();
  if (search) params.set("q", search);
  if (is_verified !== undefined && is_verified !== null) params.set("is_verified", is_verified);
  if (is_active !== undefined && is_active !== null) params.set("is_active", is_active);
  params.set("page", page);
  params.set("page_size", page_size);
  return request(`/admin/profiles?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function adminVerifyProfile(profileId, isVerified) {
  const token = localStorage.getItem("token");
  return request(`/admin/profiles/${profileId}/verify`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ is_verified: isVerified }),
  });
}

export async function adminListDocuments({ verification_status, page = 1, page_size = 20 } = {}) {
  const token = localStorage.getItem("token");
  const params = new URLSearchParams();
  if (verification_status) params.set("verification_status", verification_status);
  params.set("page", page);
  params.set("page_size", page_size);
  return request(`/admin/documents?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function adminVerifyDocument(documentId, status, rejectionReason = null) {
  const token = localStorage.getItem("token");
  const body = { status };
  if (rejectionReason) body.rejection_reason = rejectionReason;
  return request(`/admin/documents/${documentId}/verify`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
}

export async function adminGetStats() {
  const token = localStorage.getItem("token");
  return request("/admin/stats", {
    headers: { Authorization: `Bearer ${token}` },
  });
}
