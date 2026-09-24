const API_BASE = "/api";

function getToken() {
  return localStorage.getItem("token");
}

function authHeaders(extra = {}) {
  const token = getToken();
  const headers = { ...extra };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const config = {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  };

  // Auto-inject token if not already set
  if (!config.headers["Authorization"]) {
    const token = getToken();
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const res = await fetch(url, config);
  const text = await res.text();

  // Handle 401 — clear stale session
  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    let msg = "Unauthorized";
    try {
      const errData = JSON.parse(text);
      if (errData.detail) {
        msg = typeof errData.detail === "string" ? errData.detail : msg;
      }
    } catch {}
    // Only redirect if not already on a login/auth page
    if (
      !window.location.pathname.startsWith("/auth") &&
      !window.location.pathname.startsWith("/login")
    ) {
      window.location.href = "/login";
    }
    throw new Error(msg);
  }

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

export async function changePassword({ new_password }) {
  return request("/auth/change-password", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ new_password }),
  });
}

export async function seedAdmin() {
  return request("/auth/seed-admin", {
    method: "POST",
  });
}

export async function getMe() {
  return request("/auth/me", {
    headers: authHeaders(),
  });
}

export async function updateProfile({ full_name, city, state, country }) {
  return request("/auth/me", {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ full_name, city, state, country }),
  });
}

export async function uploadProfilePic(file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/auth/me/profile-pic", {
    method: "POST",
    headers: authHeaders(),
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
  const res = await fetch("/api/auth/me/profile-pic", {
    method: "DELETE",
    headers: authHeaders(),
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

export async function searchAll({ q, latitude, longitude, radius_km, limit = 12 } = {}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (latitude) params.set("latitude", latitude);
  if (longitude) params.set("longitude", longitude);
  if (radius_km) params.set("radius_km", radius_km);
  params.set("limit", limit);
  return request(`/search/all?${params.toString()}`);
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

export async function getCategoryTree() {
  return request("/categories/tree");
}

export async function getCategoryById(id) {
  return request(`/categories/${id}`);
}

export async function getCategoryChildren(categoryId) {
  return request(`/categories/${categoryId}/children`);
}

export async function getCategoryBreadcrumbs(categoryId) {
  return request(`/categories/${categoryId}/breadcrumbs`);
}

export async function getFeaturedBusinesses(limit = 6) {
  const params = new URLSearchParams();
  if (limit) params.set("limit", limit);
  return request(`/public/featured-businesses?${params.toString()}`);
}

export async function adminListBusinesses({ search, is_featured, page = 1, page_size = 20 } = {}) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (is_featured !== undefined && is_featured !== null) params.set("is_featured", is_featured);
  params.set("page", page);
  params.set("page_size", page_size);
  return request(`/admin/featured-businesses?${params.toString()}`, {
    headers: authHeaders(),
  });
}

export async function adminToggleFeatured(businessId, isFeatured, featuredOrder = null) {
  return request(`/admin/featured-businesses/${businessId}/toggle-featured`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ is_featured: isFeatured, featured_order: featuredOrder }),
  });
}

export async function adminCreateFeaturedBusiness(data) {
  return request("/admin/featured-businesses", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export async function adminUpdateFeaturedBusiness(businessId, data) {
  return request(`/admin/featured-businesses/${businessId}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export async function adminDeleteFeaturedBusiness(businessId) {
  return request(`/admin/featured-businesses/${businessId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}

export async function adminListCategories() {
  return request("/admin/categories", {
    headers: authHeaders(),
  });
}

export async function adminCreateCategory(data) {
  return request("/admin/categories", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export async function adminUpdateCategory(categoryId, data) {
  return request(`/admin/categories/${categoryId}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export async function adminDeleteCategory(categoryId) {
  return request(`/admin/categories/${categoryId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}

export async function adminCreateSubcategory(categoryId, data) {
  return request(`/admin/categories/${categoryId}/subcategories`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export async function adminUpdateSubcategory(subcategoryId, data) {
  return request(`/admin/subcategories/${subcategoryId}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export async function adminDeleteSubcategory(subcategoryId) {
  return request(`/admin/subcategories/${subcategoryId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}

export async function adminListSubcategories(categoryId = null) {
  const params = new URLSearchParams();
  if (categoryId) params.set("category_id", categoryId);
  const qs = params.toString();
  return request(`/admin/subcategories${qs ? `?${qs}` : ""}`, {
    headers: authHeaders(),
  });
}

export async function adminUploadCategoryLogo(categoryId, file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`/api/admin/categories/${categoryId}/logo`, {
    method: "POST",
    headers: authHeaders(),
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
  return request("/profiles/my", {
    headers: authHeaders(),
  });
}

export async function createProfile(data) {
  return request("/profiles", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export async function updateProfileById(profileId, data) {
  return request(`/profiles/${profileId}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export async function deleteProfile(profileId) {
  return request(`/profiles/${profileId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}

export async function getProfileDocuments(profileId) {
  return request(`/profiles/${profileId}/documents`, {
    headers: authHeaders(),
  });
}

export async function uploadDocument(profileId, file, documentType) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("document_type", documentType);
  const res = await fetch(`/api/profiles/${profileId}/documents`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { throw new Error("Server error"); }
  if (!res.ok) throw new Error(data.detail || "Upload failed");
  return data;
}

export async function deleteDocument(documentId) {
  return request(`/documents/${documentId}`, {
    method: "DELETE",
    headers: authHeaders(),
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
  const params = new URLSearchParams();
  if (search) params.set("q", search);
  if (is_verified !== undefined && is_verified !== null) params.set("is_verified", is_verified);
  if (is_active !== undefined && is_active !== null) params.set("is_active", is_active);
  params.set("page", page);
  params.set("page_size", page_size);
  return request(`/admin/profiles?${params.toString()}`, {
    headers: authHeaders(),
  });
}

export async function adminVerifyProfile(profileId, isVerified) {
  return request(`/admin/profiles/${profileId}/verify`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ is_verified: isVerified }),
  });
}

export async function adminListDocuments({ verification_status, page = 1, page_size = 20 } = {}) {
  const params = new URLSearchParams();
  if (verification_status) params.set("verification_status", verification_status);
  params.set("page", page);
  params.set("page_size", page_size);
  return request(`/admin/documents?${params.toString()}`, {
    headers: authHeaders(),
  });
}

export async function adminVerifyDocument(documentId, status, rejectionReason = null) {
  const body = { status };
  if (rejectionReason) body.rejection_reason = rejectionReason;
  return request(`/admin/documents/${documentId}/verify`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
}

export async function adminGetStats() {
  return request("/admin/stats", {
    headers: authHeaders(),
  });
}

// ---------------------------------------------------------------------------
// Buyer API
// ---------------------------------------------------------------------------

export async function buyerGetDashboard() {
  return request("/buyer/dashboard", { headers: authHeaders() });
}

export async function buyerGetProfile() {
  return request("/buyer/profile", { headers: authHeaders() });
}

export async function buyerUpdateProfile(data) {
  return request("/buyer/profile", {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export async function buyerCreateRequirement(data) {
  return request("/buyer/requirements", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export async function buyerListRequirements(page = 1, pageSize = 20) {
  return request(`/buyer/requirements?page=${page}&page_size=${pageSize}`, {
    headers: authHeaders(),
  });
}

export async function buyerGetRequirement(id) {
  return request(`/buyer/requirements/${id}`, { headers: authHeaders() });
}

export async function buyerUpdateRequirement(id, data) {
  return request(`/buyer/requirements/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export async function buyerDeleteRequirement(id) {
  return request(`/buyer/requirements/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}

export async function buyerCreateEnquiry(data) {
  return request("/buyer/enquiries", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export async function buyerListEnquiries(page = 1, pageSize = 20) {
  return request(`/buyer/enquiries?page=${page}&page_size=${pageSize}`, {
    headers: authHeaders(),
  });
}

export async function buyerGetEnquiry(id) {
  return request(`/buyer/enquiries/${id}`, { headers: authHeaders() });
}

export async function buyerAddFavorite(targetType, targetId) {
  return request("/buyer/favorites", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ target_type: targetType, target_id: targetId }),
  });
}

export async function buyerListFavorites(page = 1, pageSize = 20) {
  return request(`/buyer/favorites?page=${page}&page_size=${pageSize}`, {
    headers: authHeaders(),
  });
}

export async function buyerRemoveFavorite(id) {
  return request(`/buyer/favorites/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}

export async function buyerListQuotations(page = 1, pageSize = 20) {
  return request(`/buyer/quotations?page=${page}&page_size=${pageSize}`, {
    headers: authHeaders(),
  });
}

export async function buyerGetQuotation(id) {
  return request(`/buyer/quotations/${id}`, { headers: authHeaders() });
}

export async function buyerAcceptQuotation(id) {
  return request(`/buyer/quotations/${id}/accept`, {
    method: "PATCH",
    headers: authHeaders(),
  });
}

export async function buyerRejectQuotation(id) {
  return request(`/buyer/quotations/${id}/reject`, {
    method: "PATCH",
    headers: authHeaders(),
  });
}

export async function buyerGetConversations() {
  return request("/buyer/messages/conversations", { headers: authHeaders() });
}

export async function buyerGetMessages(userId, page = 1, pageSize = 50) {
  return request(`/buyer/messages/${userId}?page=${page}&page_size=${pageSize}`, {
    headers: authHeaders(),
  });
}

export async function buyerSendMessage(receiverId, content) {
  return request("/buyer/messages", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ receiver_id: receiverId, content }),
  });
}

export async function buyerMarkRead(userId) {
  return request(`/buyer/messages/${userId}/read`, {
    method: "PUT",
    headers: authHeaders(),
  });
}

// ─── SELLER API ──────────────────────────────────────────────────────────────

export async function sellerGetDashboard() {
  return request("/seller/dashboard", { headers: authHeaders() });
}

export async function sellerGetReviews() {
  return request("/seller/reviews", { headers: authHeaders() });
}

export async function sellerGetProfile() {
  return request("/seller/profile", { headers: authHeaders() });
}

export async function sellerCreateProfile(data) {
  return request("/seller/profile", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export async function sellerUpdateProfile(data) {
  return request("/seller/profile", {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export async function sellerUpdateLocation(latitude, longitude) {
  return request(`/seller/profile/location?latitude=${latitude}&longitude=${longitude}`, {
    method: "PUT",
    headers: authHeaders(),
  });
}

export async function sellerGetSocialLinks() {
  return request("/seller/social-links", { headers: authHeaders() });
}

export async function sellerCreateSocialLink(platform, url) {
  return request(`/seller/social-links?platform=${encodeURIComponent(platform)}&url=${encodeURIComponent(url)}`, {
    method: "POST",
    headers: authHeaders(),
  });
}

export async function sellerDeleteSocialLink(id) {
  return request(`/seller/social-links/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}

export async function sellerGetDocuments() {
  return request("/seller/documents", { headers: authHeaders() });
}

export async function sellerListProducts(page = 1, pageSize = 20) {
  return request(`/seller/products?page=${page}&page_size=${pageSize}`, {
    headers: authHeaders(),
  });
}

export async function sellerGetProduct(id) {
  return request(`/seller/products/${id}`, { headers: authHeaders() });
}

export async function sellerCreateProduct(data) {
  return request("/seller/products", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export async function sellerUpdateProduct(id, data) {
  return request(`/seller/products/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export async function sellerDeleteProduct(id) {
  return request(`/seller/products/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}

export async function sellerGetProductImages(productId) {
  return request(`/seller/products/${productId}/images`, {
    headers: authHeaders(),
  });
}

export async function sellerAddProductImage(productId, imageUrl, sortOrder = 0, isPrimary = false) {
  return request(
    `/seller/products/${productId}/images?image_url=${encodeURIComponent(imageUrl)}&sort_order=${sortOrder}&is_primary=${isPrimary}`,
    { method: "POST", headers: authHeaders() }
  );
}

export async function sellerDeleteProductImage(imageId) {
  return request(`/seller/product-images/${imageId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}

export async function sellerListServices(page = 1, pageSize = 20) {
  return request(`/seller/services?page=${page}&page_size=${pageSize}`, {
    headers: authHeaders(),
  });
}

export async function sellerListEnquiries(page = 1, pageSize = 20, status = null) {
  const params = new URLSearchParams({ page, page_size: pageSize });
  if (status) params.append("status", status);
  return request(`/seller/enquiries?${params}`, { headers: authHeaders() });
}

export async function sellerGetEnquiry(id) {
  return request(`/seller/enquiries/${id}`, { headers: authHeaders() });
}

export async function sellerUpdateEnquiryStatus(id, status) {
  return request(`/seller/enquiries/${id}/status`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  });
}

export async function sellerCreateQuotation(data) {
  return request("/seller/quotations", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export async function sellerListQuotations(page = 1, pageSize = 20, status = null) {
  const params = new URLSearchParams({ page, page_size: pageSize });
  if (status) params.append("status", status);
  return request(`/seller/quotations?${params}`, { headers: authHeaders() });
}

export async function sellerGetQuotation(id) {
  return request(`/seller/quotations/${id}`, { headers: authHeaders() });
}

export async function sellerUpdateQuotation(id, data) {
  return request(`/seller/quotations/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export async function sellerListRequirements(page = 1, pageSize = 20, categoryId = null, city = null) {
  const params = new URLSearchParams({ page, page_size: pageSize });
  if (categoryId) params.append("category_id", categoryId);
  if (city) params.append("city", city);
  return request(`/seller/requirements?${params}`, { headers: authHeaders() });
}

export async function sellerGetRequirement(id) {
  return request(`/seller/requirements/${id}`, { headers: authHeaders() });
}

export async function sellerGetConversations() {
  return request("/seller/messages/conversations", { headers: authHeaders() });
}

export async function sellerGetMessages(userId, page = 1, pageSize = 50) {
  return request(`/seller/messages/${userId}?page=${page}&page_size=${pageSize}`, {
    headers: authHeaders(),
  });
}

export async function sellerSendMessage(receiverId, content) {
  return request("/seller/messages", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ receiver_id: receiverId, content }),
  });
}

export async function sellerMarkRead(userId) {
  return request(`/seller/messages/${userId}/read`, {
    method: "PUT",
    headers: authHeaders(),
  });
}

export async function sellerGetSettings() {
  return request("/seller/settings", { headers: authHeaders() });
}

export async function sellerUpdateSettings(data) {
  return request("/seller/settings", {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export async function sellerGetBusinessHours() {
  return request("/seller/business-hours", { headers: authHeaders() });
}

export async function sellerUpsertBusinessHours(dayOfWeek, data) {
  return request(`/seller/business-hours/${dayOfWeek}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

// ─── Banners (Public) ────────────────────────────────────────
export async function getBanners() {
  return request("/banners");
}

// ─── Banners (Admin) ────────────────────────────────────────
export async function adminListBanners() {
  return request("/admin/banners", { headers: authHeaders() });
}

export async function adminCreateBanner(data) {
  return request("/admin/banners", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export async function adminUpdateBanner(id, data) {
  return request(`/admin/banners/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export async function adminDeleteBanner(id) {
  return request(`/admin/banners/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}

export async function adminUploadBannerImage(id, file) {
  const formData = new FormData();
  formData.append("file", file);
  return request(`/admin/banners/${id}/image`, {
    method: "POST",
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    body: formData,
  });
}

// --- Trending Videos (Public) ---
export async function getTrendingVideos(limit = 20) {
  return request(`/trending-videos?is_active=true&limit=${limit}`);
}

export async function getTrendingVideosCount() {
  return request("/trending-videos/count");
}

// --- Trending Videos (Admin) ---
export async function adminListTrendingVideos(params = {}) {
  const qs = new URLSearchParams();
  if (params.search) qs.set("search", params.search);
  if (params.platform) qs.set("platform", params.platform);
  if (params.approval_status) qs.set("approval_status", params.approval_status);
  if (params.is_trending !== undefined) qs.set("is_trending", params.is_trending);
  if (params.page) qs.set("page", params.page);
  if (params.page_size) qs.set("page_size", params.page_size);
  return request(`/trending-videos/admin/list?${qs}`, { headers: authHeaders() });
}

export async function adminCreateTrendingVideo(data) {
  return request("/trending-videos", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export async function adminUpdateTrendingVideo(id, data) {
  return request(`/trending-videos/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export async function adminDeleteTrendingVideo(id) {
  return request(`/trending-videos/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}

export async function adminToggleTrendingVideo(id) {
  return request(`/trending-videos/${id}/trending`, {
    method: "PATCH",
    headers: authHeaders(),
  });
}

export async function adminToggleVideoActive(id) {
  return request(`/trending-videos/${id}/active`, {
    method: "PATCH",
    headers: authHeaders(),
  });
}

export async function adminUpdateVideoOrder(id, sortOrder) {
  return request(`/trending-videos/${id}/trending-order`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ sort_order: sortOrder }),
  });
}

export async function adminListVideoRequests(approvalStatus = "") {
  const qs = approvalStatus ? `?approval_status=${approvalStatus}` : "";
  return request(`/trending-videos/admin/requests${qs}`, { headers: authHeaders() });
}

export async function adminReviewVideo(id, data) {
  return request(`/trending-videos/${id}/review`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

// --- Trending Videos (Buyer) ---
export async function buyerListMyVideos() {
  return request("/trending-videos/buyer/list", { headers: authHeaders() });
}

export async function buyerUploadVideo(data) {
  return request("/trending-videos/buyer/upload", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export async function buyerUpdateVideo(id, data) {
  return request(`/trending-videos/buyer/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export async function buyerDeleteVideo(id) {
  return request(`/trending-videos/buyer/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}

// --- Trending Videos (Seller) ---
export async function sellerListMyVideos() {
  return request("/trending-videos/seller/list", { headers: authHeaders() });
}

export async function sellerUploadVideo(data) {
  return request("/trending-videos/seller/upload", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export async function sellerUpdateVideo(id, data) {
  return request(`/trending-videos/seller/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export async function sellerDeleteVideo(id) {
  return request(`/trending-videos/seller/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}

// --- Leads ---
export async function buyerCreateLead(data) {
  return request("/leads", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export async function buyerListLeads(page = 1, pageSize = 20) {
  return request(`/leads?page=${page}&page_size=${pageSize}`, {
    headers: authHeaders(),
  });
}

export async function adminListLeads(status = null, page = 1, pageSize = 20) {
  const params = new URLSearchParams({ page, page_size: pageSize });
  if (status) params.set("status", status);
  return request(`/leads?${params}`, { headers: authHeaders() });
}

// --- Societies ---
export async function getSocieties() {
  return request("/societies");
}

// --- Nearby Profiles (Public with location) ---
export async function getNearbyProfilesPublic(latitude, longitude, radiusKm = 10, page = 1, pageSize = 12) {
  const params = new URLSearchParams();
  params.set("latitude", latitude);
  params.set("longitude", longitude);
  params.set("radius_km", radiusKm);
  params.set("page", page);
  params.set("page_size", pageSize);
  return request(`/profiles/nearby?${params.toString()}`);
}

// --- Public Services ---
export async function getPublicServices(params = {}) {
  const q = new URLSearchParams();
  if (params.category_id) q.set("category_id", params.category_id);
  if (params.subcategory_id) q.set("subcategory_id", params.subcategory_id);
  if (params.is_trending !== undefined) q.set("is_trending", params.is_trending);
  if (params.is_featured !== undefined) q.set("is_featured", params.is_featured);
  if (params.city) q.set("city", params.city);
  if (params.latitude) q.set("latitude", params.latitude);
  if (params.longitude) q.set("longitude", params.longitude);
  if (params.radius_km) q.set("radius_km", params.radius_km);
  if (params.page) q.set("page", params.page);
  if (params.page_size) q.set("page_size", params.page_size);
  return request(`/public/services?${q.toString()}`);
}

export async function getTrendingServices(limit = 10) {
  return request(`/public/services/trending?limit=${limit}`);
}

// --- Public Products (Best Sellers) ---
export async function getBestSellers(params = {}) {
  const q = new URLSearchParams();
  if (params.category_id) q.set("category_id", params.category_id);
  if (params.page) q.set("page", params.page);
  if (params.page_size) q.set("page_size", params.page_size);
  return request(`/public/products/best-sellers?${q.toString()}`);
}

export async function getBestSellersCount(categoryId) {
  const q = new URLSearchParams();
  if (categoryId) q.set("category_id", categoryId);
  return request(`/public/products/best-sellers/count?${q.toString()}`);
}

export async function getPublicProduct(productId) {
  return request(`/public/products/${productId}`);
}

export async function listPublicProducts(params = {}) {
  const q = new URLSearchParams();
  if (params.category_id) q.set("category_id", params.category_id);
  if (params.subcategory_id) q.set("subcategory_id", params.subcategory_id);
  if (params.q) q.set("q", params.q);
  if (params.page) q.set("page", params.page);
  if (params.page_size) q.set("page_size", params.page_size);
  return request(`/public/products/list?${q.toString()}`);
}

/** Services whose service-category/subcategory name matches the given main-taxonomy category/subcategory. */
export async function listServicesForTaxonomy(params = {}) {
  const q = new URLSearchParams();
  if (params.subcategory_id) q.set("subcategory_id", params.subcategory_id);
  if (params.category_id) q.set("category_id", params.category_id);
  if (params.page) q.set("page", params.page);
  if (params.page_size) q.set("page_size", params.page_size);
  return request(`/public/services-listing/by-subcategory?${q.toString()}`);
}

// --- Admin Best Sellers ---
export async function adminListProducts(params = {}) {
  const q = new URLSearchParams();
  if (params.search) q.set("search", params.search);
  if (params.category_id) q.set("category_id", params.category_id);
  if (params.is_best_seller !== undefined) q.set("is_best_seller", params.is_best_seller);
  if (params.page) q.set("page", params.page);
  if (params.page_size) q.set("page_size", params.page_size);
  return request(`/admin/best-sellers?${q.toString()}`);
}

export async function adminListProductsCount(params = {}) {
  const q = new URLSearchParams();
  if (params.search) q.set("search", params.search);
  if (params.category_id) q.set("category_id", params.category_id);
  if (params.is_best_seller !== undefined) q.set("is_best_seller", params.is_best_seller);
  return request(`/admin/best-sellers/count?${q.toString()}`);
}

export async function adminToggleBestSeller(productId, isBestSeller) {
  return request(`/admin/best-sellers/${productId}/toggle`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_best_seller: isBestSeller }),
  });
}

export async function adminUpdateBestSellerOrder(productId, bestSellerOrder) {
  return request(`/admin/best-sellers/${productId}/order`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ best_seller_order: bestSellerOrder }),
  });
}

export async function adminListBestSellerRequests(params = {}) {
  const q = new URLSearchParams();
  if (params.status) q.set("status", params.status);
  if (params.page) q.set("page", params.page);
  if (params.page_size) q.set("page_size", params.page_size);
  return request(`/admin/best-sellers/requests?${q.toString()}`);
}

export async function adminReviewBestSellerRequest(requestId, reviewStatus, adminNote) {
  return request(`/admin/best-sellers/requests/${requestId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: reviewStatus, admin_note: adminNote || null }),
  });
}

// --- Buyer Best Seller Requests ---
export async function buyerCreateBestSellerRequest(data) {
  return request("/buyer/best-seller-requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function buyerListBestSellerRequests(page = 1, pageSize = 20) {
  return request(`/buyer/best-seller-requests?page=${page}&page_size=${pageSize}`);
}

// --- Public Trending Categories ---
export async function getTrendingCategories(limit = 7) {
  return request(`/public/products/trending-categories?limit=${limit}`);
}

export async function getTrendingCategoriesCount() {
  return request("/public/products/trending-categories/count");
}

// --- Public Trending Products ---
export async function getTrendingProducts(limit = 7) {
  return request(`/public/products/trending-products?limit=${limit}`);
}

export async function getTrendingProductsCount() {
  return request("/public/products/trending-products/count");
}

// --- Admin Trending Products ---
export async function adminListTrendingProducts(params = {}) {
  const q = new URLSearchParams();
  if (params.search) q.set("search", params.search);
  if (params.category_id) q.set("category_id", params.category_id);
  if (params.is_trending !== undefined) q.set("is_trending", params.is_trending);
  if (params.page) q.set("page", params.page);
  if (params.page_size) q.set("page_size", params.page_size);
  return request(`/admin/trending-products?${q.toString()}`);
}

export async function adminToggleTrendingProduct(productId, isTrending) {
  return request(`/admin/trending-products/${productId}/toggle`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_trending: isTrending }),
  });
}

export async function adminUpdateTrendingProductOrder(productId, trendingOrder) {
  return request(`/admin/trending-products/${productId}/order`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ trending_order: trendingOrder }),
  });
}

export async function adminListTrendingProductRequests(params = {}) {
  const q = new URLSearchParams();
  if (params.status) q.set("status", params.status);
  if (params.page) q.set("page", params.page);
  if (params.page_size) q.set("page_size", params.page_size);
  return request(`/admin/trending-products/requests?${q.toString()}`);
}

export async function adminReviewTrendingProductRequest(requestId, reviewStatus, adminNote) {
  return request(`/admin/trending-products/requests/${requestId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: reviewStatus, admin_note: adminNote || null }),
  });
}

// --- Buyer Trending Product Requests ---
export async function buyerCreateTrendingProductRequest(data) {
  return request("/buyer/trending-product-requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function buyerListTrendingProductRequests(page = 1, pageSize = 20) {
  return request(`/buyer/trending-product-requests?page=${page}&page_size=${pageSize}`);
}

// --- Admin Trending Categories ---
export async function adminListTrendingCategories() {
  return request("/admin/trending-categories");
}

export async function adminToggleTrending(categoryId, isTrending) {
  return request(`/admin/categories/${categoryId}/trending`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_trending: isTrending }),
  });
}

export async function adminUpdateTrendingOrder(categoryId, trendingOrder) {
  return request(`/admin/categories/${categoryId}/trending-order`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ trending_order: trendingOrder }),
  });
}

// ─── Service Listings (Public) ────────────────────────────────
export async function getServiceCategories() {
  return request("/public/services-listing/categories");
}

export async function getServiceCategory(slug) {
  return request(`/public/services-listing/categories/${slug}`);
}

export async function getSubcategoryBySlug(slug) {
  return request(`/public/services-listing/subcategories/${slug}`);
}

export async function listServiceListings(params = {}) {
  const qs = new URLSearchParams();
  if (params.category_slug) qs.set("category_slug", params.category_slug);
  if (params.subcategory_slug) qs.set("subcategory_slug", params.subcategory_slug);
  if (params.city) qs.set("city", params.city);
  if (params.search) qs.set("search", params.search);
  if (params.is_featured !== undefined) qs.set("is_featured", params.is_featured);
  if (params.page) qs.set("page", params.page);
  if (params.page_size) qs.set("page_size", params.page_size);
  return request(`/public/services-listing?${qs}`);
}

export async function getFeaturedServices(limit = 8) {
  return request(`/public/services-listing/featured?limit=${limit}`);
}

export async function getServiceBySlug(slug) {
  return request(`/public/services-listing/${slug}`);
}

export async function getServiceListingsCount() {
  return request("/public/services-listing/count");
}

// ─── Service Listings (Admin) ────────────────────────────────
export async function adminListServiceCategories() {
  return request("/admin/services-listing/categories", { headers: authHeaders() });
}

export async function adminListEnquiries(params = {}) {
  const q = new URLSearchParams();
  if (params.status) q.set("status", params.status);
  if (params.search) q.set("search", params.search);
  if (params.page) q.set("page", params.page);
  if (params.page_size) q.set("page_size", params.page_size);
  return request(`/admin/enquiries?${q.toString()}`, { headers: authHeaders() });
}

export async function adminUpdateEnquiryStatus(enquiryId, status) {
  return request(`/admin/enquiries/${enquiryId}/status`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  });
}

export async function adminCreateServiceCategory(data) {
  return request("/admin/services-listing/categories", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export async function adminUpdateServiceCategory(id, data) {
  return request(`/admin/services-listing/categories/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export async function adminDeleteServiceCategory(id) {
  return request(`/admin/services-listing/categories/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}

export async function adminToggleServiceCategory(id) {
  return request(`/admin/services-listing/categories/${id}/toggle`, {
    method: "PATCH",
    headers: authHeaders(),
  });
}

export async function adminCreateServiceSubcategory(data) {
  return request("/admin/services-listing/subcategories", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export async function adminUpdateServiceSubcategory(id, data) {
  return request(`/admin/services-listing/subcategories/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export async function adminDeleteServiceSubcategory(id) {
  return request(`/admin/services-listing/subcategories/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}

export async function adminListServiceListings(params = {}) {
  const qs = new URLSearchParams();
  if (params.search) qs.set("search", params.search);
  if (params.category_id) qs.set("category_id", params.category_id);
  if (params.approval_status) qs.set("approval_status", params.approval_status);
  if (params.is_active !== undefined) qs.set("is_active", params.is_active);
  if (params.is_featured !== undefined) qs.set("is_featured", params.is_featured);
  if (params.page) qs.set("page", params.page);
  if (params.page_size) qs.set("page_size", params.page_size);
  return request(`/admin/services-listing/services?${qs}`, { headers: authHeaders() });
}

export async function adminCreateServiceListing(data) {
  return request("/admin/services-listing/services", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export async function adminUpdateServiceListing(id, data) {
  return request(`/admin/services-listing/services/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export async function adminDeleteServiceListing(id) {
  return request(`/admin/services-listing/services/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}

export async function adminToggleServiceActive(id) {
  return request(`/admin/services-listing/services/${id}/toggle-active`, {
    method: "PATCH",
    headers: authHeaders(),
  });
}

export async function adminToggleServiceFeatured(id) {
  return request(`/admin/services-listing/services/${id}/toggle-featured`, {
    method: "PATCH",
    headers: authHeaders(),
  });
}

export async function adminReviewServiceListing(id, data) {
  return request(`/admin/services-listing/services/${id}/review`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export async function adminListServiceRequests(approvalStatus = "") {
  const qs = approvalStatus ? `?approval_status=${approvalStatus}` : "";
  return request(`/admin/services-listing/requests${qs}`, { headers: authHeaders() });
}

// ─── Service Listings (Seller) ──────────────────────────────
export async function sellerListMyServices() {
  return request("/services-listing/seller/list", { headers: authHeaders() });
}

export async function sellerCreateService(data) {
  return request("/services-listing/seller/upload", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export async function sellerUpdateService(id, data) {
  return request(`/services-listing/seller/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export async function sellerDeleteService(id) {
  return request(`/services-listing/seller/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}

// ─── Service Listings (Buyer) ───────────────────────────────
export async function buyerListMyServices() {
  return request("/services-listing/buyer/list", { headers: authHeaders() });
}

export async function buyerCreateService(data) {
  return request("/services-listing/buyer/upload", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export async function buyerUpdateService(id, data) {
  return request(`/services-listing/buyer/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export async function buyerDeleteService(id) {
  return request(`/services-listing/buyer/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}

// ─── Admin Services (BizService) ─────────────────────────────
export async function adminListBizServices(params = {}) {
  const qs = new URLSearchParams();
  if (params.approval_status) qs.set("approval_status", params.approval_status);
  if (params.category_id) qs.set("category_id", params.category_id);
  if (params.is_trending !== undefined) qs.set("is_trending", params.is_trending);
  if (params.is_featured !== undefined) qs.set("is_featured", params.is_featured);
  if (params.search) qs.set("search", params.search);
  if (params.page) qs.set("page", params.page);
  if (params.page_size) qs.set("page_size", params.page_size);
  return request(`/admin/services?${qs}`, { headers: authHeaders() });
}

export async function adminListBizServicesCount(params = {}) {
  const qs = new URLSearchParams();
  if (params.approval_status) qs.set("approval_status", params.approval_status);
  if (params.category_id) qs.set("category_id", params.category_id);
  if (params.search) qs.set("search", params.search);
  return request(`/admin/services/count?${qs}`, { headers: authHeaders() });
}

export async function adminGetBizService(serviceId) {
  return request(`/admin/services/${serviceId}`, { headers: authHeaders() });
}

export async function adminApproveBizService(serviceId) {
  return request(`/admin/services/${serviceId}/approve`, {
    method: "PATCH",
    headers: authHeaders(),
  });
}

export async function adminRejectBizService(serviceId, rejectionReason) {
  return request(`/admin/services/${serviceId}/reject`, {
    method: "PATCH",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ rejection_reason: rejectionReason || null }),
  });
}

export async function adminToggleBizServiceTrending(serviceId) {
  return request(`/admin/services/${serviceId}/toggle-trending`, {
    method: "PATCH",
    headers: authHeaders(),
  });
}

export async function adminToggleBizServiceFeatured(serviceId) {
  return request(`/admin/services/${serviceId}/toggle-featured`, {
    method: "PATCH",
    headers: authHeaders(),
  });
}

export async function adminUpdateBizServiceOrder(serviceId, sortOrder) {
  return request(`/admin/services/${serviceId}/order`, {
    method: "PATCH",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ sort_order: sortOrder }),
  });
}

export async function adminDeleteBizService(serviceId) {
  return request(`/admin/services/${serviceId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}

export async function adminListBizServiceRequests() {
  return request("/admin/services/requests", { headers: authHeaders() });
}

export async function adminReviewBizServiceRequest(serviceId, action, rejectionReason) {
  return request(`/admin/services/requests/${serviceId}`, {
    method: "PATCH",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ action, rejection_reason: rejectionReason || null }),
  });
}
