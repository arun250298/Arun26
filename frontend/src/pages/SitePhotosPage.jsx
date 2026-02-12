import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { AuthContext, API } from "../App";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  LayoutDashboard,
  Receipt,
  CreditCard,
  Camera,
  FileText,
  Users,
  LogOut,
  HardHat,
  ArrowLeft,
  Filter,
  Trash2,
  Image as ImageIcon,
  X,
  ZoomIn
} from "lucide-react";

const SitePhotosPage = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [photos, setPhotos] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSite, setFilterSite] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    loadData();
  }, [filterSite]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterSite) params.append("site_name", filterSite);

      const [photosRes, sitesRes] = await Promise.all([
        axios.get(`${API}/site-photos?${params.toString()}`, { withCredentials: true }),
        axios.get(`${API}/sites`, { withCredentials: true })
      ]);

      setPhotos(photosRes.data);
      setSites(sitesRes.data);
    } catch (error) {
      toast.error("Failed to load photos");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
      navigate("/", { replace: true });
    } catch (error) {
      navigate("/", { replace: true });
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (!window.confirm("Are you sure you want to delete this photo?")) return;

    try {
      await axios.delete(`${API}/site-photos/${photoId}`, { withCredentials: true });
      toast.success("Photo deleted");
      loadData();
    } catch (error) {
      toast.error("Failed to delete photo");
    }
  };

  // Group photos by date
  const groupedPhotos = photos.reduce((acc, photo) => {
    const date = new Date(photo.uploaded_at).toLocaleDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(photo);
    return acc;
  }, {});

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
    { icon: Receipt, label: "Bills", path: "/admin/bills" },
    { icon: CreditCard, label: "Payments", path: "/admin/payments" },
    { icon: Camera, label: "Site Photos", path: "/admin/photos", active: true },
    { icon: FileText, label: "Reports", path: "/admin/reports" },
    { icon: Users, label: "Users", path: "/admin/users" }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-200 bg-white h-screen fixed left-0 top-0">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
              <HardHat className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-slate-900">Dhaya Promoters</p>
              <p className="text-xs text-slate-500">Admin Panel</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                item.active
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-200">
          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full justify-start text-slate-600"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 min-h-screen">
        {/* Mobile Header */}
        <header className="md:hidden bg-slate-900 text-white px-4 py-4 sticky top-0 z-40 flex items-center gap-3">
          <Link to="/admin" className="text-white">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="font-bold text-lg">Site Photos</h1>
        </header>

        <div className="p-4 md:p-8">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 hidden md:block">Site Photos</h1>
              <p className="text-slate-500 hidden md:block">{photos.length} total photos</p>
            </div>
          </div>

          {/* Filter */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
            <div className="flex items-center gap-4">
              <Filter className="w-5 h-5 text-slate-400" />
              <Select
                value={filterSite}
                onValueChange={setFilterSite}
              >
                <SelectTrigger className="w-full md:w-64" data-testid="filter-site-photos">
                  <SelectValue placeholder="Filter by site" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Sites</SelectItem>
                  {sites.map((site) => (
                    <SelectItem key={site.site_id || site.name} value={site.name}>
                      {site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {filterSite && (
                <Button variant="ghost" size="sm" onClick={() => setFilterSite("")}>
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Photos Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full spinner"></div>
            </div>
          ) : photos.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Camera className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="font-bold text-slate-900 mb-2">No photos found</h3>
              <p className="text-slate-500">Photos uploaded by staff will appear here</p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedPhotos).map(([date, datePhotos]) => (
                <div key={date}>
                  <h3 className="font-bold text-slate-900 mb-4">{date}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {datePhotos.map((photo) => (
                      <div
                        key={photo.photo_id}
                        className="bg-white rounded-xl border border-slate-200 overflow-hidden group relative"
                        data-testid={`photo-card-${photo.photo_id}`}
                      >
                        <div className="aspect-square bg-slate-100 relative">
                          {photo.photo_data ? (
                            <img
                              src={photo.photo_data}
                              alt={photo.site_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-10 h-10 text-slate-300" />
                            </div>
                          )}
                          {/* Overlay on hover */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button
                              variant="secondary"
                              size="icon"
                              onClick={() => setSelectedPhoto(photo)}
                              className="bg-white/90 hover:bg-white"
                            >
                              <ZoomIn className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="secondary"
                              size="icon"
                              onClick={() => handleDeletePhoto(photo.photo_id)}
                              className="bg-white/90 hover:bg-white text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="p-3">
                          <p className="font-medium text-slate-900 text-sm truncate">{photo.site_name}</p>
                          {photo.description && (
                            <p className="text-xs text-slate-500 truncate">{photo.description}</p>
                          )}
                          <p className="text-xs text-slate-400 mt-1">
                            {new Date(photo.uploaded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Photo Viewer Dialog */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-3xl mx-4">
          <DialogHeader>
            <DialogTitle>{selectedPhoto?.site_name}</DialogTitle>
          </DialogHeader>
          {selectedPhoto && (
            <div className="space-y-4">
              <div className="rounded-lg overflow-hidden bg-slate-100">
                {selectedPhoto.photo_data ? (
                  <img
                    src={selectedPhoto.photo_data}
                    alt={selectedPhoto.site_name}
                    className="w-full h-auto max-h-[60vh] object-contain"
                  />
                ) : (
                  <div className="w-full h-64 flex items-center justify-center">
                    <ImageIcon className="w-16 h-16 text-slate-300" />
                  </div>
                )}
              </div>
              {selectedPhoto.description && (
                <p className="text-slate-600">{selectedPhoto.description}</p>
              )}
              <p className="text-sm text-slate-500">
                Uploaded on {new Date(selectedPhoto.uploaded_at).toLocaleString()}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SitePhotosPage;
