import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { AuthContext, API } from "../App";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
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
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  MapPin,
  Building2,
  CheckCircle2,
  Clock,
  PauseCircle
} from "lucide-react";

const SITE_STATUSES = [
  { value: "active", label: "Active", color: "bg-green-100 text-green-700" },
  { value: "completed", label: "Completed", color: "bg-blue-100 text-blue-700" },
  { value: "on_hold", label: "On Hold", color: "bg-yellow-100 text-yellow-700" }
];

const SitesPage = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState(null);
  const [siteForm, setSiteForm] = useState({
    name: "",
    address: "",
    status: "active"
  });

  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/sites`, { withCredentials: true });
      setSites(response.data);
    } catch (error) {
      toast.error("Failed to load sites");
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

  const handleAddSite = async () => {
    if (!siteForm.name.trim()) {
      toast.error("Please enter a site name");
      return;
    }

    try {
      await axios.post(`${API}/sites`, { name: siteForm.name.trim() }, { withCredentials: true });
      toast.success("Site created successfully!");
      setIsAddOpen(false);
      setSiteForm({ name: "", address: "", status: "active" });
      loadSites();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create site");
    }
  };

  const handleEditSite = async () => {
    if (!siteForm.name.trim()) {
      toast.error("Please enter a site name");
      return;
    }

    try {
      await axios.put(`${API}/sites/${selectedSite.site_id}`, {
        name: siteForm.name.trim(),
        address: siteForm.address,
        status: siteForm.status
      }, { withCredentials: true });
      toast.success("Site updated successfully!");
      setIsEditOpen(false);
      setSelectedSite(null);
      setSiteForm({ name: "", address: "", status: "active" });
      loadSites();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to update site");
    }
  };

  const handleDeleteSite = async (siteId) => {
    if (!window.confirm("Are you sure you want to delete this site?")) return;

    try {
      await axios.delete(`${API}/sites/${siteId}`, { withCredentials: true });
      toast.success("Site deleted");
      loadSites();
    } catch (error) {
      toast.error("Failed to delete site");
    }
  };

  const openEditDialog = (site) => {
    setSelectedSite(site);
    setSiteForm({
      name: site.name,
      address: site.address || "",
      status: site.status || "active"
    });
    setIsEditOpen(true);
  };

  const filteredSites = sites.filter(site => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return site.name?.toLowerCase().includes(query) ||
           site.address?.toLowerCase().includes(query);
  });

  const getStatusBadge = (status) => {
    const statusConfig = SITE_STATUSES.find(s => s.value === status) || SITE_STATUSES[0];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
        {statusConfig.label}
      </span>
    );
  };

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
    { icon: Receipt, label: "Bills", path: "/admin/bills" },
    { icon: CreditCard, label: "Payments", path: "/admin/payments" },
    { icon: Camera, label: "Site Photos", path: "/admin/photos" },
    { icon: Building2, label: "Sites", path: "/admin/sites", active: true },
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
          <h1 className="font-bold text-lg">Sites Management</h1>
        </header>

        <div className="p-4 md:p-8">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 hidden md:block">Sites Management</h1>
              <p className="text-slate-500 hidden md:block">{sites.length} construction sites</p>
            </div>
            <Button
              onClick={() => setIsAddOpen(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white"
              data-testid="add-site-btn"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Site
            </Button>
          </div>

          {/* Search */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Search sites by name or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12"
                data-testid="search-sites"
              />
            </div>
          </div>

          {/* Sites Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full spinner"></div>
            </div>
          ) : filteredSites.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="font-bold text-slate-900 mb-2">No sites found</h3>
              <p className="text-slate-500 mb-4">Create your first construction site</p>
              <Button
                onClick={() => setIsAddOpen(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Site
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSites.map((site) => (
                <div
                  key={site.site_id}
                  className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 transition-colors"
                  data-testid={`site-card-${site.site_id}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900">{site.name}</h4>
                        {getStatusBadge(site.status)}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-5 h-5 text-slate-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(site)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Site
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteSite(site.site_id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {site.address && (
                    <div className="flex items-start gap-2 text-sm text-slate-500">
                      <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>{site.address}</span>
                    </div>
                  )}
                  <p className="text-xs text-slate-400 mt-3">
                    Created: {new Date(site.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add Site Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-lg mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-orange-500" />
              Add New Site
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label className="text-slate-700 mb-2 block">Site Name *</Label>
              <Input
                placeholder="e.g., Villa Project - Adyar"
                value={siteForm.name}
                onChange={(e) => setSiteForm({ ...siteForm, name: e.target.value })}
                className="h-12"
                data-testid="site-name-input"
              />
            </div>
            <div>
              <Label className="text-slate-700 mb-2 block">Address (Optional)</Label>
              <Textarea
                placeholder="Enter site address..."
                value={siteForm.address}
                onChange={(e) => setSiteForm({ ...siteForm, address: e.target.value })}
                rows={2}
                data-testid="site-address-input"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddOpen(false);
                setSiteForm({ name: "", address: "", status: "active" });
              }}
              className="flex-1 h-12"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddSite}
              className="flex-1 h-12 bg-orange-500 hover:bg-orange-600 text-white"
              data-testid="submit-site-btn"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Create Site
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Site Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-blue-500" />
              Edit Site
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label className="text-slate-700 mb-2 block">Site Name *</Label>
              <Input
                placeholder="Site name"
                value={siteForm.name}
                onChange={(e) => setSiteForm({ ...siteForm, name: e.target.value })}
                className="h-12"
              />
            </div>
            <div>
              <Label className="text-slate-700 mb-2 block">Address</Label>
              <Textarea
                placeholder="Enter site address..."
                value={siteForm.address}
                onChange={(e) => setSiteForm({ ...siteForm, address: e.target.value })}
                rows={2}
              />
            </div>
            <div>
              <Label className="text-slate-700 mb-2 block">Status</Label>
              <Select
                value={siteForm.status}
                onValueChange={(v) => setSiteForm({ ...siteForm, status: v })}
              >
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SITE_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditOpen(false);
                setSelectedSite(null);
                setSiteForm({ name: "", address: "", status: "active" });
              }}
              className="flex-1 h-12"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSite}
              className="flex-1 h-12 bg-slate-900 hover:bg-slate-800 text-white"
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SitesPage;
