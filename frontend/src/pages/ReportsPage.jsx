import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { AuthContext, API } from "../App";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
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
  Download,
  Mail,
  Calendar,
  TrendingUp,
  TrendingDown
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
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const ReportsPage = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [monthlyReport, setMonthlyReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [exportingPDF, setExportingPDF] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    loadReport();
  }, [selectedMonth, selectedYear]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API}/dashboard/monthly-report?month=${selectedMonth}&year=${selectedYear}`,
        { withCredentials: true }
      );
      setMonthlyReport(response.data);
    } catch (error) {
      toast.error("Failed to load report");
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
      setExportingPDF(true);
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
    } finally {
      setExportingPDF(false);
    }
  };

  const handleSendEmail = async () => {
    try {
      setSendingEmail(true);
      const response = await axios.post(`${API}/reports/send-email`, {}, { withCredentials: true });
      
      if (response.data.status === "pending_setup") {
        toast.info(response.data.message);
      } else {
        toast.success("Email sent!");
      }
    } catch (error) {
      toast.error("Failed to send email");
    } finally {
      setSendingEmail(false);
    }
  };

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
    { icon: Receipt, label: "Bills", path: "/admin/bills" },
    { icon: CreditCard, label: "Payments", path: "/admin/payments" },
    { icon: Camera, label: "Site Photos", path: "/admin/photos" },
    { icon: FileText, label: "Reports", path: "/admin/reports", active: true },
    { icon: Users, label: "Users", path: "/admin/users" }
  ];

  const years = [];
  for (let y = 2024; y <= new Date().getFullYear(); y++) {
    years.push(y);
  }

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
          <h1 className="font-bold text-lg">Reports</h1>
        </header>

        <div className="p-4 md:p-8">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 hidden md:block">Reports</h1>
              <p className="text-slate-500 hidden md:block">View and export expense reports</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleExportPDF}
                disabled={exportingPDF}
                className="bg-slate-900 hover:bg-slate-800 text-white"
                data-testid="export-pdf-btn"
              >
                <Download className="w-4 h-4 mr-2" />
                {exportingPDF ? "Exporting..." : "Export Daily PDF"}
              </Button>
              <Button
                onClick={handleSendEmail}
                disabled={sendingEmail}
                variant="outline"
                data-testid="send-email-btn"
              >
                <Mail className="w-4 h-4 mr-2" />
                {sendingEmail ? "Sending..." : "Send to Email"}
              </Button>
            </div>
          </div>

          {/* Month/Year Selector */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
            <div className="flex items-center gap-4">
              <Calendar className="w-5 h-5 text-slate-400" />
              <Label className="text-slate-600">Select Period:</Label>
              <div className="flex gap-2">
                <Select
                  value={selectedMonth.toString()}
                  onValueChange={(v) => setSelectedMonth(parseInt(v))}
                >
                  <SelectTrigger className="w-36" data-testid="select-month">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((month, index) => (
                      <SelectItem key={index} value={(index + 1).toString()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={selectedYear.toString()}
                  onValueChange={(v) => setSelectedYear(parseInt(v))}
                >
                  <SelectTrigger className="w-24" data-testid="select-year">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
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
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                      <Receipt className="w-5 h-5 text-orange-600" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 font-numeric">
                    {monthlyReport?.bills_count || 0}
                  </p>
                  <p className="text-slate-500 text-sm">Bills This Month</p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 font-numeric">
                    {monthlyReport?.payments_count || 0}
                  </p>
                  <p className="text-slate-500 text-sm">Payments Made</p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-red-600" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 font-numeric">
                    ₹{(monthlyReport?.total_billed || 0).toLocaleString()}
                  </p>
                  <p className="text-slate-500 text-sm">Total Billed</p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <TrendingDown className="w-5 h-5 text-green-600" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-green-600 font-numeric">
                    ₹{(monthlyReport?.total_paid || 0).toLocaleString()}
                  </p>
                  <p className="text-slate-500 text-sm">Total Paid</p>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar Chart */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6" data-testid="category-bar-chart">
                  <h3 className="font-bold text-slate-900 mb-4">Expenses by Category</h3>
                  {monthlyReport?.by_category?.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={monthlyReport.by_category}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip 
                          formatter={(value) => [`₹${value.toLocaleString()}`, "Amount"]}
                        />
                        <Bar dataKey="amount" fill="#F97316" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-slate-400">
                      No data for this period
                    </div>
                  )}
                </div>

                {/* Pie Chart */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6" data-testid="category-pie-chart">
                  <h3 className="font-bold text-slate-900 mb-4">Category Distribution</h3>
                  {monthlyReport?.by_category?.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={monthlyReport.by_category}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="amount"
                          nameKey="category"
                          label={({ category, percent }) => 
                            `${category} (${(percent * 100).toFixed(0)}%)`
                          }
                        >
                          {monthlyReport.by_category.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value) => [`₹${value.toLocaleString()}`, "Amount"]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-slate-400">
                      No data for this period
                    </div>
                  )}
                </div>
              </div>

              {/* Category List */}
              {monthlyReport?.by_category?.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 mt-6">
                  <h3 className="font-bold text-slate-900 mb-4">Category Breakdown</h3>
                  <div className="space-y-3">
                    {monthlyReport.by_category.map((item, index) => (
                      <div
                        key={item.category}
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          ></div>
                          <span className="font-medium text-slate-900">{item.category}</span>
                        </div>
                        <span className="font-bold text-slate-900 font-numeric">
                          ₹{item.amount?.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default ReportsPage;
