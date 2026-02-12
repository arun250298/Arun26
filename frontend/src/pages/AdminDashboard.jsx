import React, { useState, useEffect, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { AuthContext, API } from "../App";
import { Button } from "../components/ui/button";
import {
  LayoutDashboard,
  Receipt,
  CreditCard,
  Camera,
  FileText,
  Users,
  LogOut,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  HardHat,
  Menu,
  X,
  ChevronRight,
  Download
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

const COLORS = ["#F97316", "#0EA5E9", "#22C55E", "#A855F7", "#EAB308"];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/summary`, { withCredentials: true });
      setSummary(response.data);
    } catch (error) {
      toast.error("Failed to load dashboard data");
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

  const handleExportPDF = async () => {
    try {
      const response = await axios.get(`${API}/reports/daily-pdf`, {
        withCredentials: true,
        responseType: "blob"
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `daily_report_${new Date().toISOString().split("T")[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("PDF downloaded!");
    } catch (error) {
      toast.error("Failed to export PDF");
    }
  };

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin", active: true },
    { icon: Receipt, label: "Bills", path: "/admin/bills" },
    { icon: CreditCard, label: "Payments", path: "/admin/payments" },
    { icon: Camera, label: "Site Photos", path: "/admin/photos" },
    { icon: FileText, label: "Reports", path: "/admin/reports" },
    { icon: Users, label: "Users", path: "/admin/users" }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Header */}
      <header className="md:hidden bg-slate-900 text-white px-4 py-4 sticky top-0 z-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="text-white hover:bg-slate-800"
          >
            <Menu className="w-6 h-6" />
          </Button>
          <div className="flex items-center gap-2">
            <HardHat className="w-6 h-6 text-orange-500" />
            <span className="font-bold">Admin</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="text-white hover:bg-slate-800"
          data-testid="logout-btn-mobile"
        >
          <LogOut className="w-5 h-5" />
        </Button>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <aside
            className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                  <HardHat className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">Dhaya Promoters</p>
                  <p className="text-xs text-slate-500">Admin Panel</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <nav className="p-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
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
          </aside>
        </div>
      )}

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
              data-testid={`nav-${item.label.toLowerCase()}`}
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
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
              {user?.picture ? (
                <img src={user.picture} alt="" className="w-10 h-10 rounded-full" />
              ) : (
                <Users className="w-5 h-5 text-slate-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-900 text-sm truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full justify-start text-slate-600"
            data-testid="logout-btn"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 p-4 md:p-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-500">Welcome back, {user?.name?.split(" ")[0]}</p>
          </div>
          <Button
            onClick={handleExportPDF}
            className="bg-slate-900 hover:bg-slate-800 text-white"
            data-testid="export-pdf-btn"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Daily Report
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Bills"
            value={summary?.total_bills || 0}
            icon={Receipt}
            color="slate"
          />
          <StatCard
            label="Pending Bills"
            value={summary?.pending_bills || 0}
            icon={TrendingDown}
            color="orange"
          />
          <StatCard
            label="Overdue"
            value={summary?.overdue_bills || 0}
            icon={AlertTriangle}
            color="red"
          />
          <StatCard
            label="Today's Bills"
            value={summary?.today_bills || 0}
            icon={TrendingUp}
            color="green"
          />
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <p className="text-slate-500 text-sm mb-1">Total Amount</p>
            <p className="text-2xl md:text-3xl font-bold text-slate-900 font-numeric">
              ₹{(summary?.total_amount || 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <p className="text-slate-500 text-sm mb-1">Total Paid</p>
            <p className="text-2xl md:text-3xl font-bold text-green-600 font-numeric">
              ₹{(summary?.total_paid || 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <p className="text-slate-500 text-sm mb-1">Total Pending</p>
            <p className="text-2xl md:text-3xl font-bold text-orange-600 font-numeric">
              ₹{(summary?.total_pending || 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Pending by Site Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6" data-testid="pending-by-site-chart">
            <h3 className="font-bold text-slate-900 mb-4">Pending by Site</h3>
            {summary?.pending_by_site?.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={summary.pending_by_site}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="site" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value) => [`₹${value.toLocaleString()}`, "Pending"]}
                  />
                  <Bar dataKey="amount" fill="#F97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400">
                No pending bills
              </div>
            )}
          </div>

          {/* Pending by Party Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6" data-testid="pending-by-party-chart">
            <h3 className="font-bold text-slate-900 mb-4">Pending by Party</h3>
            {summary?.pending_by_party?.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={summary.pending_by_party}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="amount"
                    nameKey="party"
                    label={({ party, percent }) => 
                      `${party?.substring(0, 10)}... (${(percent * 100).toFixed(0)}%)`
                    }
                  >
                    {summary.pending_by_party.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`₹${value.toLocaleString()}`, "Pending"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400">
                No pending bills
              </div>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuickLinkCard
            title="Manage Bills"
            description="View, edit and filter all bills"
            icon={Receipt}
            path="/admin/bills"
            color="orange"
          />
          <QuickLinkCard
            title="Record Payments"
            description="Add payments against bills"
            icon={CreditCard}
            path="/admin/payments"
            color="green"
          />
          <QuickLinkCard
            title="View Reports"
            description="Monthly summaries and exports"
            icon={FileText}
            path="/admin/reports"
            color="blue"
          />
        </div>
      </main>
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color }) => {
  const colorClasses = {
    slate: "bg-slate-100 text-slate-600",
    orange: "bg-orange-100 text-orange-600",
    red: "bg-red-100 text-red-600",
    green: "bg-green-100 text-green-600"
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-2xl md:text-3xl font-bold text-slate-900 font-numeric">{value}</p>
      <p className="text-slate-500 text-sm">{label}</p>
    </div>
  );
};

const QuickLinkCard = ({ title, description, icon: Icon, path, color }) => {
  const colorClasses = {
    orange: "bg-orange-100 text-orange-600",
    green: "bg-green-100 text-green-600",
    blue: "bg-blue-100 text-blue-600"
  };

  return (
    <Link
      to={path}
      className="bg-white rounded-2xl border border-slate-200 p-6 hover:border-slate-300 hover:shadow-md transition-all group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
      </div>
      <h4 className="font-bold text-slate-900 mb-1">{title}</h4>
      <p className="text-slate-500 text-sm">{description}</p>
    </Link>
  );
};

export default AdminDashboard;
