import { useState } from "react";
import { Clock, User, Tag, ArrowRight, Search } from "lucide-react";
import { BLOGS } from "./sharedViewData";

export default function BlogsView() {
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBlogs = BLOGS.filter((blog) =>
    blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    blog.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <section id="section-blogs" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Our Blog</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">Stay updated with the latest news, tips, and insights from BizzProfiles</p>
          </div>

          <div className="max-w-md mx-auto mb-12">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search blogs..." className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBlogs.map((blog) => (
              <div key={blog.id} onClick={() => setSelectedBlog(blog)} className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer">
                <div className={`h-48 bg-gradient-to-br ${blog.gradient} flex items-center justify-center`}>
                  <span className="text-5xl">{blog.icon}</span>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">{blog.category}</span>
                    <span className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" />{blog.readTime}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{blog.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-3 mb-4">{blog.excerpt}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center"><User className="w-3 h-3 text-gray-500" /></div>
                      <span className="text-xs text-gray-500">{blog.author}</span>
                    </div>
                    <span className="text-xs text-gray-400">{blog.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredBlogs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No blogs found matching your search.</p>
            </div>
          )}
        </div>
      </section>

      {/* Blog Modal */}
      {selectedBlog && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50" onClick={() => setSelectedBlog(null)}>
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className={`h-48 bg-gradient-to-br ${selectedBlog.gradient} flex items-center justify-center`}>
              <span className="text-6xl">{selectedBlog.icon}</span>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">{selectedBlog.category}</span>
                <span className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" />{selectedBlog.readTime}</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{selectedBlog.title}</h2>
              <p className="text-gray-600 leading-relaxed mb-6">{selectedBlog.content}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center"><User className="w-4 h-4 text-gray-500" /></div>
                  <div><p className="text-sm font-medium text-gray-900">{selectedBlog.author}</p><p className="text-xs text-gray-500">{selectedBlog.date}</p></div>
                </div>
                <button onClick={() => setSelectedBlog(null)} className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors cursor-pointer border-none">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
