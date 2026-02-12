import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { AuthContext, API } from "../App";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
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
  Calendar,
  ClipboardList,
  User,
  Building2,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  ZoomIn
} from "lucide-react";

const DailyUpdatesPage = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [summary, setSummary] = useState(null);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterSite, setFilterSite] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [summaryRes, sitesRes] = await Promise.all([
        axios.get(`${API}/daily-updates/summary?date=${selectedDate}`, { withCredentials: true }),
        axios.get(`${API}/sites`, { withCredentials: true })
      ]);
      setSummary(summaryRes.data);
      setSites(sitesRes.data);
    } catch (error) {
      toast.error("Failed to load daily updates");
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

  const changeDate = (days) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const filteredBySite = summary?.by_site?.filter(item => {
    if (!filterSite || filterSite === "all") return true;
    return item.site === filterSite;
  }) || [];

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
    { icon: Receipt, label: "Bills", path: "/admin/bills" },
    { icon: CreditCard, label: "Payments", path: "/admin/payments" },
    { icon: Camera, label: "Site Photos", path: "/admin/photos" },
    { icon: Building2, label: "Sites", path: "/admin/sites" },
    { icon: ClipboardList, label: "Daily Updates", path: "/admin/daily-updates", active: true },
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
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
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
          <h1 className="font-bold text-lg">Daily Updates</h1>
        </header>

        <div className="p-4 md:p-8">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 hidden md:block">Daily Work Updates</h1>
            <p className="text-slate-500 hidden md:block">Track daily progress from all staff members</p>
          </div>

          {/* Date Selector */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-slate-400" />
                <Label className="text-slate-600">Select Date:</Label>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => changeDate(-1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-44"
                  data-testid="date-picker"
                />
                <Button variant="outline" size="icon" onClick={() => changeDate(1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                  className="text-orange-600"
                >
                  Today
                </Button>
              </div>
              <div className="md:ml-auto">
                <Select
                  value={filterSite || "all"}
                  onValueChange={setFilterSite}
                >
                  <SelectTrigger className="w-48" data-testid="filter-site">
                    <SelectValue placeholder="Filter by site" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sites</SelectItem>
                    {sites.map((site) => (
                      <SelectItem key={site.site_id || site.name} value={site.name}>
                        {site.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full spinner"></div>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <ClipboardList className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 font-numeric">
                    {summary?.total_updates || 0}
                  </p>
                  <p className="text-slate-500 text-sm">Total Updates</p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-green-600 font-numeric">
                    {summary?.staff_submitted || 0}
                  </p>
                  <p className="text-slate-500 text-sm">Staff Submitted</p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-red-600 font-numeric">
                    {summary?.staff_pending || 0}
                  </p>
                  <p className="text-slate-500 text-sm">Pending Updates</p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-orange-600" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 font-numeric">
                    {summary?.by_site?.length || 0}
                  </p>
                  <p className="text-slate-500 text-sm">Sites Updated</p>
                </div>
              </div>

              {/* Pending Staff */}
              {summary?.pending_users?.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                  <h3 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Staff Pending Updates
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {summary.pending_users.map((staff) => (
                      <span
                        key={staff.user_id}
                        className="bg-white px-3 py-1 rounded-full text-sm text-red-700 border border-red-200"
                      >
                        {staff.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Updates by Site */}
              {filteredBySite.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                  <ClipboardList className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="font-bold text-slate-900 mb-2">No updates for this date</h3>
                  <p className="text-slate-500">Updates from staff will appear here</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredBySite.map((siteData) => (
                    <div
                      key={siteData.site}
                      className="bg-white rounded-xl border border-slate-200 overflow-hidden"
                    >
                      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Building2 className="w-5 h-5 text-orange-500" />
                            <h3 className="font-bold text-slate-900">{siteData.site}</h3>
                          </div>
                          <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium">
                            {siteData.count} update{siteData.count !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {siteData.updates.map((update) => (
                          <div key={update.update_id} className="p-5" data-testid={`update-${update.update_id}`}>
                            <div className="flex items-start gap-4">
                              <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center shrink-0">
                                <User className="w-5 h-5 text-slate-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="font-semibold text-slate-900">{update.user_name}</p>
                                  <div className="flex items-center gap-1 text-slate-500 text-sm">
                                    <Clock className="w-4 h-4" />
                                    {new Date(update.check_in_time).toLocaleTimeString([], { 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}
                                  </div>
                                </div>
                                <p className="text-slate-700 mb-3">{update.work_description}</p>
                                {update.progress_percentage && (
                                  <div className="mb-3">
                                    <div className="flex items-center justify-between text-sm mb-1">
                                      <span className="text-slate-500">Progress</span>
                                      <span className="font-medium text-slate-700">{update.progress_percentage}%</span>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-2">
                                      <div
                                        className="bg-green-500 h-2 rounded-full transition-all"
                                        style={{ width: `${update.progress_percentage}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                )}
                                {update.issues && (
                                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                                    <p className="text-sm text-yellow-800">
                                      <strong>Issues:</strong> {update.issues}
                                    </p>
                                  </div>
                                )}
                                {update.photo_data && (
                                  <div
                                    className="w-24 h-24 rounded-lg overflow-hidden bg-slate-100 cursor-pointer"
                                    onClick={() => setSelectedPhoto(update.photo_data)}
                                  >
                                    <img
                                      src={update.photo_data}
                                      alt="Update"
                                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Photo Viewer Dialog */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-3xl mx-4">
          <DialogHeader>
            <DialogTitle>Update Photo</DialogTitle>
          </DialogHeader>
          {selectedPhoto && (
            <div className="rounded-lg overflow-hidden bg-slate-100">
              <img
                src={selectedPhoto}
                alt="Update"
                className="w-full h-auto max-h-[60vh] object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DailyUpdatesPage;
