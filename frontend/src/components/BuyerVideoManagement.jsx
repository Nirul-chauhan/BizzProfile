import { useState, useEffect } from "react";
import {
  buyerListMyVideos, buyerUploadVideo, buyerUpdateVideo, buyerDeleteVideo, getCategories,
} from "../api";
import { Play, Plus, Pencil, Trash2, X, Clock, CheckCircle2, Search, Send } from "lucide-react";

export default function BuyerVideoManagement() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState("videos");

  // Form
  const [showForm, setShowForm] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [form, setForm] = useState({
    title: "", video_url: "", platform: "YOUTUBE", description: "",
    thumbnail_url: "", company_name: "", city: "", state: "", country: "",
    category_id: "", sort_order: 0,
  });

  const loadVideos = async () => {
    setLoading(true);
    try {
      const data = await buyerListMyVideos();
      setVideos(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(Array.isArray(data) ? data : data.items || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { loadVideos(); loadCategories(); }, []);

  const resetForm = () => {
    setForm({
      title: "", video_url: "", platform: "YOUTUBE", description: "",
      thumbnail_url: "", company_name: "", city: "", state: "", country: "",
      category_id: "", sort_order: 0,
    });
    setEditingVideo(null);
  };

  const handleSubmit = async () => {
    if (!form.video_url.trim()) { setMsg("Video URL is required."); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        category_id: form.category_id ? parseInt(form.category_id) : null,
        sort_order: parseInt(form.sort_order) || 0,
      };
      if (editingVideo) {
        await buyerUpdateVideo(editingVideo.id, payload);
        setMsg("Video updated and resubmitted for approval.");
      } else {
        await buyerUploadVideo(payload);
        setMsg("Video submitted for admin approval!");
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
    if (video.approval_status === "APPROVED") {
      setMsg("Cannot edit an approved video. Contact admin.");
      return;
    }
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
      sort_order: video.sort_order || 0,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this video?")) return;
    try {
      await buyerDeleteVideo(id);
      setMsg("Video deleted.");
      loadVideos();
    } catch (e) {
      setMsg(e.message || "Failed to delete.");
    }
  };

  const getThumbnail = (video) => {
    if (video.thumbnail_url) return video.thumbnail_url;
    if (video.platform === "YOUTUBE" && video.embed_id) {
      return `https://img.youtube.com/vi/${video.embed_id}/mqdefault.jpg`;
    }
    return null;
  };

  const statusColor = (status) => {
    switch (status) {
      case "APPROVED": return "bg-emerald-100 text-emerald-700";
      case "PENDING": return "bg-amber-100 text-amber-700";
      case "REJECTED": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div>
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        <button onClick={() => setActiveTab("videos")} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors cursor-pointer border-none ${activeTab === "videos" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
          <Play className="w-4 h-4 inline mr-1.5" />My Videos
        </button>
      </div>

      {msg && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${msg.includes("success") || msg.includes("deleted") || msg.includes("submitted") ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {msg}
          <button onClick={() => setMsg("")} className="float-right cursor-pointer border-none bg-transparent text-inherit"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{videos.length} video(s) uploaded</p>
        <button onClick={() => { setShowForm(true); resetForm(); }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-colors cursor-pointer border-none">
          <Plus className="w-4 h-4" />Upload Video
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => !saving && setShowForm(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">{editingVideo ? "Edit Video" : "Upload New Video"}</h3>
              <button onClick={() => setShowForm(false)} className="cursor-pointer bg-transparent border-none"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
                Videos require admin approval before appearing on the homepage.
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Video URL *</label>
                  <input type="url" value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Title *</label>
                  <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Video title"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Describe this video..." rows={3}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Platform</label>
                  <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
                    <option value="YOUTUBE">YouTube</option>
                    <option value="INSTAGRAM">Instagram</option>
                    <option value="FACEBOOK">Facebook</option>
                    <option value="UPLOAD">Uploaded Video</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
                  <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Thumbnail URL</label>
                  <input type="url" value={form.thumbnail_url} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })}
                    placeholder="https://example.com/thumbnail.jpg"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Company Name</label>
                  <input type="text" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                    placeholder="Your business name"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">City</label>
                  <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">State</label>
                  <input type="text" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Country</label>
                  <input type="text" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-3 border-t border-gray-200">
                <button onClick={() => setShowForm(false)} disabled={saving} className="flex-1 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer border-none">
                  Cancel
                </button>
                <button onClick={handleSubmit} disabled={saving || !form.video_url.trim()} className="flex-1 py-2.5 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors cursor-pointer border-none disabled:opacity-50">
                  {saving ? "Submitting..." : editingVideo ? "Update & Resubmit" : "Submit for Approval"}
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
      ) : videos.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Play className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">No videos uploaded yet.</p>
          <button onClick={() => { setShowForm(true); resetForm(); }} className="mt-3 px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 cursor-pointer border-none">
            Upload Your First Video
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {videos.map((video) => (
            <div key={video.id} className="bg-white border border-gray-200/60 rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition-all">
              <div className="w-28 h-20 bg-gray-900 rounded-lg flex-shrink-0 overflow-hidden">
                {getThumbnail(video) ? (
                  <img src={getThumbnail(video)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Play className="w-6 h-6 text-white/60" /></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-gray-900 truncate">{video.title || "Untitled"}</h4>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-gray-100 text-gray-600">{video.platform}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${statusColor(video.approval_status)}`}>
                    {video.approval_status}
                  </span>
                  {video.rejection_reason && video.approval_status === "REJECTED" && (
                    <span className="text-[10px] text-red-500" title={video.rejection_reason}>(See reason)</span>
                  )}
                  {video.company_name && <span className="text-[10px] text-gray-400">{video.company_name}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {video.approval_status !== "APPROVED" && (
                  <button onClick={() => handleEdit(video)} className="px-3 py-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 cursor-pointer border-none">
                    <Pencil className="w-3.5 h-3.5 inline mr-1" />Edit
                  </button>
                )}
                <button onClick={() => handleDelete(video.id)} className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 cursor-pointer border-none">
                  <Trash2 className="w-3.5 h-3.5 inline mr-1" />Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
