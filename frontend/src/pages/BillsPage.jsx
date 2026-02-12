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
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Plus,
  X
} from "lucide-react";

const CATEGORIES = ["M-sand", "Cement", "Steel", "Labour", "Other"];
const STATUSES = ["Pending", "Partially Paid", "Paid"];

const BillsPage = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [bills, setBills] = useState([]);
  const [sites, setSites] = useState([]);
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    site_name: "",
    party_name: "",
    category: "",
    status: ""
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.site_name) params.append("site_name", filters.site_name);
      if (filters.party_name) params.append("party_name", filters.party_name);
      if (filters.category) params.append("category", filters.category);
      if (filters.status) params.append("status", filters.status);

      const [billsRes, sitesRes, partiesRes] = await Promise.all([
        axios.get(`${API}/bills?${params.toString()}`, { withCredentials: true }),
        axios.get(`${API}/sites`, { withCredentials: true }),
        axios.get(`${API}/parties`, { withCredentials: true })
      ]);

      setBills(billsRes.data);
      setSites(sitesRes.data);
      setParties(partiesRes.data);
    } catch (error) {
      toast.error("Failed to load bills");
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

  const handleDeleteBill = async (billId) => {
    if (!window.confirm("Are you sure you want to delete this bill?")) return;

    try {
      await axios.delete(`${API}/bills/${billId}`, { withCredentials: true });
      toast.success("Bill deleted");
      loadData();
    } catch (error) {
      toast.error("Failed to delete bill");
    }
  };

  const handleEditBill = async () => {
    try {
      await axios.put(`${API}/bills/${selectedBill.bill_id}`, editForm, { withCredentials: true });
      toast.success("Bill updated");
      setIsEditOpen(false);
      loadData();
    } catch (error) {
      toast.error("Failed to update bill");
    }
  };

  const openEditDialog = (bill) => {
    setSelectedBill(bill);
    setEditForm({
      site_name: bill.site_name,
      party_name: bill.party_name,
      category: bill.category,
      bill_amount: bill.bill_amount,
      remarks: bill.remarks
    });
    setIsEditOpen(true);
  };

  const filteredBills = bills.filter(bill => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      bill.site_name?.toLowerCase().includes(query) ||
      bill.party_name?.toLowerCase().includes(query) ||
      bill.category?.toLowerCase().includes(query)
    );
  });

  const clearFilters = () => {
    setFilters({ site_name: "", party_name: "", category: "", status: "" });
  };

  const hasActiveFilters = Object.values(filters).some(v => v);

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
    { icon: Receipt, label: "Bills", path: "/admin/bills", active: true },
    { icon: CreditCard, label: "Payments", path: "/admin/payments" },
    { icon: Camera, label: "Site Photos", path: "/admin/photos" },
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
          <h1 className="font-bold text-lg">Bills</h1>
        </header>

        <div className="p-4 md:p-8">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 hidden md:block">Bills Management</h1>
              <p className="text-slate-500 hidden md:block">{bills.length} total bills</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Search by site, party, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12"
                  data-testid="search-input"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={`h-12 ${hasActiveFilters ? "border-orange-500 text-orange-600" : ""}`}
                data-testid="filter-btn"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters {hasActiveFilters && `(${Object.values(filters).filter(v => v).length})`}
              </Button>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label className="mb-2 block text-sm">Site</Label>
                  <Select
                    value={filters.site_name || "all"}
                    onValueChange={(v) => setFilters({ ...filters, site_name: v === "all" ? "" : v })}
                  >
                    <SelectTrigger data-testid="filter-site">
                      <SelectValue placeholder="All Sites" />
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
                <div>
                  <Label className="mb-2 block text-sm">Party</Label>
                  <Select
                    value={filters.party_name || "all"}
                    onValueChange={(v) => setFilters({ ...filters, party_name: v === "all" ? "" : v })}
                  >
                    <SelectTrigger data-testid="filter-party">
                      <SelectValue placeholder="All Parties" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Parties</SelectItem>
                      {parties.map((party) => (
                        <SelectItem key={party.party_id || party.name} value={party.name}>
                          {party.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-2 block text-sm">Category</Label>
                  <Select
                    value={filters.category || "all"}
                    onValueChange={(v) => setFilters({ ...filters, category: v === "all" ? "" : v })}
                  >
                    <SelectTrigger data-testid="filter-category">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-2 block text-sm">Status</Label>
                  <Select
                    value={filters.status || "all"}
                    onValueChange={(v) => setFilters({ ...filters, status: v === "all" ? "" : v })}
                  >
                    <SelectTrigger data-testid="filter-status">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {hasActiveFilters && (
                  <div className="md:col-span-4">
                    <Button
                      variant="ghost"
                      onClick={clearFilters}
                      className="text-slate-500"
                      data-testid="clear-filters-btn"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Clear All Filters
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bills List */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full spinner"></div>
            </div>
          ) : filteredBills.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Receipt className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="font-bold text-slate-900 mb-2">No bills found</h3>
              <p className="text-slate-500">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBills.map((bill) => (
                <div
                  key={bill.bill_id}
                  className="bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 transition-colors"
                  data-testid={`bill-row-${bill.bill_id}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-slate-900 truncate">{bill.party_name}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                          bill.status === "Paid" ? "status-paid" :
                          bill.status === "Partially Paid" ? "status-partial" : "status-pending"
                        }`}>
                          {bill.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 mb-2">{bill.site_name}</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="bg-slate-100 px-2 py-1 rounded text-slate-600">
                          {bill.category}
                        </span>
                        <span className="text-slate-400">
                          {new Date(bill.bill_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-slate-900 font-numeric">
                        ₹{bill.bill_amount?.toLocaleString()}
                      </p>
                      {bill.balance_pending > 0 && (
                        <p className="text-sm text-orange-600 font-medium">
                          Pending: ₹{bill.balance_pending?.toLocaleString()}
                        </p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" data-testid={`bill-menu-${bill.bill_id}`}>
                          <MoreVertical className="w-5 h-5 text-slate-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setSelectedBill(bill); setIsViewOpen(true); }}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditDialog(bill)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Bill
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteBill(bill.bill_id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* View Bill Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-lg mx-4">
          <DialogHeader>
            <DialogTitle>Bill Details</DialogTitle>
          </DialogHeader>
          {selectedBill && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-500 text-sm">Site</Label>
                  <p className="font-medium">{selectedBill.site_name}</p>
                </div>
                <div>
                  <Label className="text-slate-500 text-sm">Party</Label>
                  <p className="font-medium">{selectedBill.party_name}</p>
                </div>
                <div>
                  <Label className="text-slate-500 text-sm">Category</Label>
                  <p className="font-medium">{selectedBill.category}</p>
                </div>
                <div>
                  <Label className="text-slate-500 text-sm">Status</Label>
                  <p className={`font-medium ${
                    selectedBill.status === "Paid" ? "text-green-600" :
                    selectedBill.status === "Partially Paid" ? "text-yellow-600" : "text-red-600"
                  }`}>{selectedBill.status}</p>
                </div>
                <div>
                  <Label className="text-slate-500 text-sm">Bill Amount</Label>
                  <p className="font-bold text-lg">₹{selectedBill.bill_amount?.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-slate-500 text-sm">Amount Paid</Label>
                  <p className="font-medium text-green-600">₹{selectedBill.amount_paid?.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-slate-500 text-sm">Balance Pending</Label>
                  <p className="font-medium text-orange-600">₹{selectedBill.balance_pending?.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-slate-500 text-sm">Bill Date</Label>
                  <p className="font-medium">{new Date(selectedBill.bill_date).toLocaleDateString()}</p>
                </div>
              </div>
              {selectedBill.remarks && (
                <div>
                  <Label className="text-slate-500 text-sm">Remarks</Label>
                  <p className="font-medium">{selectedBill.remarks}</p>
                </div>
              )}
              {selectedBill.bill_photo && (
                <div>
                  <Label className="text-slate-500 text-sm">Bill Photo</Label>
                  <img
                    src={selectedBill.bill_photo}
                    alt="Bill"
                    className="mt-2 rounded-lg max-h-64 object-contain"
                  />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Bill Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg mx-4">
          <DialogHeader>
            <DialogTitle>Edit Bill</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="mb-2 block">Site Name</Label>
              <Select
                value={editForm.site_name}
                onValueChange={(v) => setEditForm({ ...editForm, site_name: v })}
              >
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sites.map((site) => (
                    <SelectItem key={site.site_id || site.name} value={site.name}>
                      {site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block">Party Name</Label>
              <Select
                value={editForm.party_name}
                onValueChange={(v) => setEditForm({ ...editForm, party_name: v })}
              >
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {parties.map((party) => (
                    <SelectItem key={party.party_id || party.name} value={party.name}>
                      {party.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block">Category</Label>
              <Select
                value={editForm.category}
                onValueChange={(v) => setEditForm({ ...editForm, category: v })}
              >
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block">Bill Amount (₹)</Label>
              <Input
                type="number"
                value={editForm.bill_amount}
                onChange={(e) => setEditForm({ ...editForm, bill_amount: parseFloat(e.target.value) })}
                className="h-12"
              />
            </div>
            <div>
              <Label className="mb-2 block">Remarks</Label>
              <Textarea
                value={editForm.remarks || ""}
                onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setIsEditOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleEditBill}
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white"
              data-testid="save-edit-btn"
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BillsPage;
