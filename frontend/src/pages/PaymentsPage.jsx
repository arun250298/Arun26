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
  CheckCircle2
} from "lucide-react";

const PaymentsPage = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [bills, setBills] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [selectedBillId, setSelectedBillId] = useState("");
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    notes: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [billsRes, paymentsRes] = await Promise.all([
        axios.get(`${API}/bills`, { withCredentials: true }),
        axios.get(`${API}/payments`, { withCredentials: true })
      ]);

      // Filter only bills with pending balance
      setBills(billsRes.data.filter(b => b.balance_pending > 0));
      setPayments(paymentsRes.data);
    } catch (error) {
      toast.error("Failed to load data");
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

  const handleAddPayment = async () => {
    if (!selectedBillId || !paymentForm.amount) {
      toast.error("Please select a bill and enter amount");
      return;
    }

    try {
      await axios.post(`${API}/payments`, {
        bill_id: selectedBillId,
        amount: parseFloat(paymentForm.amount),
        notes: paymentForm.notes
      }, { withCredentials: true });

      toast.success("Payment recorded!");
      setIsAddPaymentOpen(false);
      setSelectedBillId("");
      setPaymentForm({ amount: "", notes: "" });
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to add payment");
    }
  };

  const selectedBill = bills.find(b => b.bill_id === selectedBillId);

  const filteredPayments = payments.filter(payment => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return payment.bill_id?.toLowerCase().includes(query) ||
           payment.notes?.toLowerCase().includes(query);
  });

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
    { icon: Receipt, label: "Bills", path: "/admin/bills" },
    { icon: CreditCard, label: "Payments", path: "/admin/payments", active: true },
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
          <h1 className="font-bold text-lg">Payments</h1>
        </header>

        <div className="p-4 md:p-8">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 hidden md:block">Payment Management</h1>
              <p className="text-slate-500 hidden md:block">{bills.length} bills with pending balance</p>
            </div>
            <Button
              onClick={() => setIsAddPaymentOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white"
              data-testid="add-payment-btn"
            >
              <Plus className="w-4 h-4 mr-2" />
              Record Payment
            </Button>
          </div>

          {/* Pending Bills Summary */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
            <h3 className="font-bold text-slate-900 mb-4">Bills with Pending Balance</h3>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full spinner"></div>
              </div>
            ) : bills.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-slate-600">All bills are fully paid!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {bills.map((bill) => (
                  <div
                    key={bill.bill_id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100 cursor-pointer hover:border-green-300 transition-colors"
                    onClick={() => {
                      setSelectedBillId(bill.bill_id);
                      setIsAddPaymentOpen(true);
                    }}
                    data-testid={`pending-bill-${bill.bill_id}`}
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{bill.party_name}</p>
                      <p className="text-sm text-slate-500">{bill.site_name} • {bill.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-orange-600 font-numeric">
                        ₹{bill.balance_pending?.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500">pending</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Payments */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Recent Payments</h3>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search payments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full spinner"></div>
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No payments recorded yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPayments.map((payment) => (
                  <div
                    key={payment.payment_id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                    data-testid={`payment-row-${payment.payment_id}`}
                  >
                    <div>
                      <p className="font-medium text-slate-900">Bill: {payment.bill_id?.substring(0, 15)}...</p>
                      <p className="text-sm text-slate-500">
                        {new Date(payment.payment_date).toLocaleDateString()}
                        {payment.notes && ` • ${payment.notes}`}
                      </p>
                    </div>
                    <p className="font-bold text-green-600 font-numeric">
                      +₹{payment.amount?.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add Payment Dialog */}
      <Dialog open={isAddPaymentOpen} onOpenChange={setIsAddPaymentOpen}>
        <DialogContent className="max-w-lg mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-green-500" />
              Record Payment
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Bill Selection */}
            <div>
              <Label className="text-slate-700 mb-2 block">Select Bill *</Label>
              <Select
                value={selectedBillId}
                onValueChange={setSelectedBillId}
              >
                <SelectTrigger className="h-12" data-testid="select-bill-payment">
                  <SelectValue placeholder="Select a bill" />
                </SelectTrigger>
                <SelectContent>
                  {bills.map((bill) => (
                    <SelectItem key={bill.bill_id} value={bill.bill_id}>
                      {bill.party_name} - {bill.site_name} (₹{bill.balance_pending?.toLocaleString()} pending)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selected Bill Details */}
            {selectedBill && (
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-500">Total Amount</p>
                    <p className="font-bold">₹{selectedBill.bill_amount?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Already Paid</p>
                    <p className="font-bold text-green-600">₹{selectedBill.amount_paid?.toLocaleString()}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-slate-500">Balance Pending</p>
                    <p className="font-bold text-orange-600 text-lg">₹{selectedBill.balance_pending?.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Amount */}
            <div>
              <Label className="text-slate-700 mb-2 block">Payment Amount (₹) *</Label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                className="h-12"
                data-testid="payment-amount-input"
                max={selectedBill?.balance_pending}
              />
              {selectedBill && paymentForm.amount && parseFloat(paymentForm.amount) > selectedBill.balance_pending && (
                <p className="text-red-500 text-sm mt-1">Amount exceeds pending balance</p>
              )}
            </div>

            {/* Notes */}
            <div>
              <Label className="text-slate-700 mb-2 block">Notes (Optional)</Label>
              <Textarea
                placeholder="Add payment notes..."
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                rows={2}
                data-testid="payment-notes-input"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddPaymentOpen(false);
                setSelectedBillId("");
                setPaymentForm({ amount: "", notes: "" });
              }}
              className="flex-1 h-12"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddPayment}
              className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white"
              data-testid="submit-payment-btn"
              disabled={!selectedBillId || !paymentForm.amount || (selectedBill && parseFloat(paymentForm.amount) > selectedBill.balance_pending)}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Record Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentsPage;
