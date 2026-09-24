import { useState, useEffect } from "react";
import {
  adminListTrendingVideos, adminCreateTrendingVideo, adminUpdateTrendingVideo,
  adminDeleteTrendingVideo, adminToggleTrendingVideo, adminToggleVideoActive,
  adminUpdateVideoOrder, adminListVideoRequests, adminReviewVideo, getCategories,
} from "../api";
import { Play, Plus, Pencil, Trash2, X, CheckCircle2, Clock, XCircle, Search, TrendingUp, Eye, Globe } from "lucide-react";

export default function TrendingVideoManagement() {
  const [activeTab, setActiveTab] = useState("videos");
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [trendingFilter, setTrendingFilter] = useState("all");
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);

  // Form
  const [showForm, setShowForm] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [form, setForm] = useState({
    title: "", video_url: "", platform: "YOUTUBE", description: "",
    thumbnail_url: "", company_name: "", city: "", state: "", country: "",
    category_id: "", is_active: true, is_trending: false, sort_order: 0,
  });

  // Requests
  const [requests, setRequests] = useState([]);
  const [requestFilter, setRequestFilter] = useState("");
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [reviewingId, setReviewingId] = useState(null);
  const [reviewNote, setReviewNote] = useState("");
  const [showNoteModal, setShowNoteModal] = useState(null);

  // Preview
  const [previewVideo, setPreviewVideo] = useState(null);

  const loadVideos = async () => {
    setLoading(true);
    try {
      const data = await adminListTrendingVideos({
        search: search || undefined,
        platform: platformFilter || undefined,
        is_trending: trendingFilter === "trending" ? true : trendingFilter === "not-trending" ? false : undefined,
        page_size: 100,
      });
      setVideos(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const loadRequests = async () => {
    setRequestsLoading(true);
    try {
      const data = await adminListVideoRequests(requestFilter || undefined);
      setRequests(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
    setRequestsLoading(false);
  };

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(Array.isArray(data) ? data : data.items || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { loadVideos(); }, [search, platformFilter, trendingFilter]);
  useEffect(() => { if (activeTab === "requests") loadRequests(); }, [activeTab, requestFilter]);
  useEffect(() => { loadCategories(); }, []);

  const resetForm = () => {
    setForm({
      title: "", video_url: "", platform: "YOUTUBE", description: "",
      thumbnail_url: "", company_name: "", city: "", state: "", country: "",
      category_id: "", is_active: true, is_trending: false, sort_order: 0,
    });
    setEditingVideo(null);
  };

  const handleSave = async () => {
    if (!form.video_url.trim()) { setMsg("Video URL is required."); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        category_id: form.category_id ? parseInt(form.category_id) : null,
        sort_order: parseInt(form.sort_order) || 0,
      };
      if (editingVideo) {
        await adminUpdateTrendingVideo(editingVideo.id, payload);
        setMsg("Video updated successfully.");
      } else {
        await adminCreateTrendingVideo(payload);
        setMsg("Video created successfully.");
      }
      setShowForm(false);
      resetForm();
      loadVideos();
    } catch (e) {
      setMsg(e.message || "Failed to save video.");
    }
    setSaving(false);
  };

  const handleEdit = (video) => {
    setEditingVideo(video);
    setForm({
      title: video.title || "",
      video_url: video.video_url || "",
      platform: video.platform || "YOUTUBE",
      description: video.description || "",
      thumbnail_url: video.thumbnail_url || "",
      company_name: video.company_name || "",
      city: video.city || "",
      state: video.state || "",
      country: video.country || "",
      category_id: video.category_id || "",
      is_active: video.is_active !== false,
      is_trending: video.is_trending || false,
      sort_order: video.sort_order || 0,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this video?")) return;
    try {
      await adminDeleteTrendingVideo(id);
      setMsg("Video deleted.");
      loadVideos();
    } catch (e) {
      setMsg(e.message || "Failed to delete.");
    }
  };

  const handleToggleTrending = async (id) => {
    try {
      await adminToggleTrendingVideo(id);
      loadVideos();
    } catch (e) {
      setMsg(e.message || "Failed to toggle trending.");
    }
  };

  const handleToggleActive = async (id) => {
    try {
      await adminToggleVideoActive(id);
      loadVideos();
    } catch (e) {
      setMsg(e.message || "Failed to toggle active.");
    }
  };

  const handleUpdateOrder = async (id, order) => {
    try {
      await adminUpdateVideoOrder(id, parseInt(order) || 0);
      loadVideos();
    } catch (e) {
      setMsg(e.message || "Failed to update order.");
    }
  };

  const handleReview = async (id, status) => {
    setReviewingId(id);
    try {
      await adminReviewVideo(id, {
        approval_status: status,
        rejection_reason: status === "REJECTED" ? reviewNote : null,
      });
      setMsg(`Video ${status.toLowerCase()} successfully.`);
      setShowNoteModal(null);
      setReviewNote("");
      loadRequests();
    } catch (e) {
      setMsg(e.message || "Failed to review.");
    }
    setReviewingId(null);
  };

  const filteredVideos = videos.filter(v => {
    if (statusFilter === "active" && v.is_active === false) return false;
    if (statusFilter === "inactive" && v.is_active !== false) return false;
    if (statusFilter === "trending" && !v.is_trending) return false;
    return true;
  });

  const getThumbnail = (video) => {
    if (video.thumbnail_url) return video.thumbnail_url;
    if (video.platform === "YOUTUBE" && video.embed_id) {
      return `https://img.youtube.com/vi/${video.embed_id}/mqdefault.jpg`;
    }
    return null;
  };

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        <button onClick={() => setActiveTab("videos")} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors cursor-pointer border-none ${activeTab === "videos" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
          <Play className="w-4 h-4 inline mr-1.5" />Manage Videos
        </button>
        <button onClick={() => setActiveTab("requests")} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors cursor-pointer border-none ${activeTab === "requests" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
          <Clock className="w-4 h-4 inline mr-1.5" />Buyer Requests
        </button>
      </div>

      {msg && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${msg.includes("success") || msg.includes("deleted") ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {msg}
          <button onClick={() => setMsg("")} className="float-right cursor-pointer border-none bg-transparent text-inherit"><X className="w-4 h-4" /></button>
        </div>
      )}

      {activeTab === "videos" ? (
        <>
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search videos..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <select value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
              <option value="">All Platforms</option>
              <option value="YOUTUBE">YouTube</option>
              <option value="INSTAGRAM">Instagram</option>
              <option value="FACEBOOK">Facebook</option>
              <option value="UPLOAD">Uploaded</option>
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="trending">Trending</option>
            </select>
            <button onClick={() => { setShowForm(true); resetForm(); }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer border-none">
              <Plus className="w-4 h-4" />Add Video
            </button>
          </div>

          {/* Video Form Modal */}
          {showForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => !saving && setShowForm(false)}>
              <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">{editingVideo ? "Edit Video" : "Add Trending Video"}</h3>
                  <button onClick={() => setShowForm(false)} className="cursor-pointer bg-transparent border-none"><X className="w-5 h-5 text-gray-400" /></button>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-gray-700 mb-1">Video URL *</label>
                      <input type="url" value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-gray-700 mb-1">Title *</label>
                      <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                        placeholder="Video title"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                      <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                        placeholder="Describe this video..."
                        rows={3}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Platform</label>
                      <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                        <option value="YOUTUBE">YouTube</option>
                        <option value="INSTAGRAM">Instagram</option>
                        <option value="FACEBOOK">Facebook</option>
                        <option value="UPLOAD">Uploaded Video</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
                      <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                        <option value="">Select Category</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-gray-700 mb-1">Thumbnail URL</label>
                      <input type="url" value={form.thumbnail_url} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })}
                        placeholder="https://example.com/thumbnail.jpg"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Company Name</label>
                      <input type="text" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                        placeholder="Company or shop name"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Sort Order</label>
                      <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">City</label>
                      <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">State</label>
                      <input type="text" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Country</label>
                      <input type="text" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div className="flex items-center gap-4 md:col-span-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 accent-indigo-600" />
                        <span className="text-sm font-medium text-gray-700">Active</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={form.is_trending} onChange={(e) => setForm({ ...form, is_trending: e.target.checked })} className="w-4 h-4 accent-indigo-600" />
                        <span className="text-sm font-medium text-gray-700">Trending</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-3 border-t border-gray-200">
                    <button onClick={() => setShowForm(false)} disabled={saving} className="flex-1 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer border-none">
                      Cancel
                    </button>
                    <button onClick={handleSave} disabled={saving || !form.video_url.trim()} className="flex-1 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer border-none disabled:opacity-50">
                      {saving ? "Saving..." : editingVideo ? "Update" : "Add Video"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Videos List */}
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="bg-white rounded-xl h-24 animate-pulse" />)}
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <Play className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No videos found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredVideos.map((video) => (
                <div key={video.id} className="bg-white border border-gray-200/60 rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition-all">
                  <div className="w-28 h-20 bg-gray-900 rounded-lg flex-shrink-0 overflow-hidden relative cursor-pointer" onClick={() => setPreviewVideo(video)}>
                    {getThumbnail(video) ? (
                      <img src={getThumbnail(video)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play className="w-6 h-6 text-white/60" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center">
                        <Eye className="w-4 h-4 text-gray-900" />
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-gray-900 truncate">{video.title || "Untitled"}</h4>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-gray-100 text-gray-600">{video.platform}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${video.is_active !== false ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                        {video.is_active !== false ? "Active" : "Inactive"}
                      </span>
                      {video.is_trending && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">Trending</span>
                      )}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        video.approval_status === "APPROVED" ? "bg-emerald-100 text-emerald-700" :
                        video.approval_status === "PENDING" ? "bg-amber-100 text-amber-700" :
                        "bg-red-100 text-red-700"
                      }`}>{video.approval_status || "APPROVED"}</span>
                      {video.company_name && <span className="text-[10px] text-gray-400">{video.company_name}</span>}
                      {video.city && <span className="text-[10px] text-gray-400">{video.city}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <input type="number" value={video.sort_order || 0} onChange={(e) => handleUpdateOrder(video.id, e.target.value)}
                      className="w-16 px-2 py-1 text-xs bg-gray-50 border border-gray-200 rounded-lg text-center outline-none focus:ring-1 focus:ring-indigo-500"
                      title="Sort order" />
                    <button onClick={() => handleToggleTrending(video.id)} title="Toggle trending"
                      className={`p-1.5 rounded-lg cursor-pointer border-none transition-colors ${video.is_trending ? "bg-indigo-100 text-indigo-600" : "bg-gray-100 text-gray-400 hover:text-indigo-600"}`}>
                      <TrendingUp className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleToggleActive(video.id)} title="Toggle active"
                      className={`p-1.5 rounded-lg cursor-pointer border-none transition-colors ${video.is_active !== false ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-400 hover:text-emerald-600"}`}>
                      <Globe className="w-4 h-4" />
                    </button>
                    <button onClick={() => setPreviewVideo(video)} title="Preview"
                      className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 cursor-pointer border-none transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleEdit(video)} title="Edit"
                      className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 cursor-pointer border-none transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(video.id)} title="Delete"
                      className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 cursor-pointer border-none transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Requests Tab */
        <>
          <div className="flex items-center gap-3 mb-4">
            <select value={requestFilter} onChange={(e) => setRequestFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
              <option value="">Pending Requests</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          {requestsLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="bg-white rounded-xl h-20 animate-pulse" />)}
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <Clock className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No requests found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((video) => (
                <div key={video.id} className="bg-white border border-gray-200/60 rounded-xl p-4 flex items-center gap-4">
                  <div className="w-24 h-16 bg-gray-900 rounded-lg flex-shrink-0 overflow-hidden">
                    {getThumbnail(video) ? (
                      <img src={getThumbnail(video)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Play className="w-5 h-5 text-white/60" /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-gray-900 truncate">{video.title || "Untitled"}</h4>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{video.description || "No description"}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-gray-100 text-gray-600">{video.platform}</span>
                      {video.company_name && <span className="text-[10px] text-gray-400">{video.company_name}</span>}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        video.approval_status === "APPROVED" ? "bg-emerald-100 text-emerald-700" :
                        video.approval_status === "PENDING" ? "bg-amber-100 text-amber-700" :
                        "bg-red-100 text-red-700"
                      }`}>{video.approval_status}</span>
                    </div>
                  </div>
                  {video.approval_status === "PENDING" && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => setShowNoteModal(video)} disabled={reviewingId === video.id}
                        className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 cursor-pointer border-none disabled:opacity-50">
                        Reject
                      </button>
                      <button onClick={() => handleReview(video.id, "APPROVED")} disabled={reviewingId === video.id}
                        className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 cursor-pointer border-none disabled:opacity-50">
                        Approve
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Reject Note Modal */}
          {showNoteModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowNoteModal(null)}>
              <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Reject Video</h3>
                  <textarea value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} placeholder="Reason for rejection (optional)..."
                    rows={3} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none mb-4" />
                  <div className="flex gap-3">
                    <button onClick={() => { setShowNoteModal(null); setReviewNote(""); }} className="flex-1 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 cursor-pointer border-none">
                      Cancel
                    </button>
                    <button onClick={() => handleReview(showNoteModal.id, "REJECTED")} className="flex-1 py-2.5 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 cursor-pointer border-none">
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Preview Modal */}
      {previewVideo && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4" onClick={() => setPreviewVideo(null)}>
          <div className="relative w-full max-w-3xl bg-black rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPreviewVideo(null)} className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 cursor-pointer border-none">
              <X className="w-5 h-5" />
            </button>
            <div className="aspect-video">
              {previewVideo.platform === "YOUTUBE" && previewVideo.embed_id && (
                <iframe src={`https://www.youtube.com/embed/${previewVideo.embed_id}?autoplay=1`} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen title={previewVideo.title} />
              )}
              {previewVideo.platform === "INSTAGRAM" && previewVideo.embed_id && (
                <iframe src={`https://www.instagram.com/reel/${previewVideo.embed_id}/embed`} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen title={previewVideo.title} />
              )}
              {previewVideo.platform === "FACEBOOK" && (
                <iframe src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(previewVideo.video_url)}&autoplay=1`} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen title={previewVideo.title} />
              )}
              {previewVideo.platform === "UPLOAD" && (
                <video src={previewVideo.video_url} controls autoPlay className="w-full h-full" />
              )}
            </div>
            <div className="p-4 bg-gray-900">
              <h3 className="text-white font-bold">{previewVideo.title || "Untitled"}</h3>
              {previewVideo.company_name && <p className="text-gray-400 text-sm mt-1">{previewVideo.company_name}</p>}
              {previewVideo.description && <p className="text-gray-400 text-sm mt-1">{previewVideo.description}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
