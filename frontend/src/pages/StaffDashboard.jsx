import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
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
  Receipt,
  Camera,
  LogOut,
  Plus,
  Upload,
  X,
  CheckCircle2,
  HardHat,
  Image as ImageIcon
} from "lucide-react";

const CATEGORIES = ["M-sand", "Cement", "Steel", "Labour", "Other"];

const StaffDashboard = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("bills");
  const [sites, setSites] = useState([]);
  const [parties, setParties] = useState([]);
  const [isAddBillOpen, setIsAddBillOpen] = useState(false);
  const [isAddPhotoOpen, setIsAddPhotoOpen] = useState(false);
  const [isAddSiteOpen, setIsAddSiteOpen] = useState(false);
  const [isAddPartyOpen, setIsAddPartyOpen] = useState(false);
  const [todayBills, setTodayBills] = useState([]);
  const [todayPhotos, setTodayPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Bill form state
  const [billForm, setBillForm] = useState({
    site_name: "",
    party_name: "",
    category: "",
    bill_amount: "",
    bill_photo: null,
    remarks: ""
  });

  // Photo form state
  const [photoForm, setPhotoForm] = useState({
    site_name: "",
    photo_data: null,
    description: ""
  });

  // New site/party form
  const [newSiteName, setNewSiteName] = useState("");
  const [newPartyName, setNewPartyName] = useState("");

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [sitesRes, partiesRes, billsRes, photosRes] = await Promise.all([
        axios.get(`${API}/sites`, { withCredentials: true }),
        axios.get(`${API}/parties`, { withCredentials: true }),
        axios.get(`${API}/bills`, { withCredentials: true }),
        axios.get(`${API}/site-photos`, { withCredentials: true })
      ]);

      setSites(sitesRes.data);
      setParties(partiesRes.data);

      // Filter today's data
      const today = new Date().toISOString().split("T")[0];
      setTodayBills(billsRes.data.filter(b => b.created_at?.split("T")[0] === today));
      setTodayPhotos(photosRes.data.filter(p => p.uploaded_at?.split("T")[0] === today));
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

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === "bill") {
          setBillForm({ ...billForm, bill_photo: reader.result });
        } else {
          setPhotoForm({ ...photoForm, photo_data: reader.result });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddBill = async () => {
    if (!billForm.site_name || !billForm.party_name || !billForm.category || !billForm.bill_amount) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      await axios.post(`${API}/bills`, {
        ...billForm,
        bill_amount: parseFloat(billForm.bill_amount)
      }, { withCredentials: true });

      toast.success("Bill added successfully!");
      setIsAddBillOpen(false);
      setBillForm({
        site_name: "",
        party_name: "",
        category: "",
        bill_amount: "",
        bill_photo: null,
        remarks: ""
      });
      loadInitialData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to add bill");
    }
  };

  const handleAddPhoto = async () => {
    if (!photoForm.site_name || !photoForm.photo_data) {
      toast.error("Please select a site and upload a photo");
      return;
    }

    try {
      await axios.post(`${API}/site-photos`, photoForm, { withCredentials: true });

      toast.success("Photo uploaded successfully!");
      setIsAddPhotoOpen(false);
      setPhotoForm({
        site_name: "",
        photo_data: null,
        description: ""
      });
      loadInitialData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to upload photo");
    }
  };

  const handleAddSite = async () => {
    if (!newSiteName.trim()) {
      toast.error("Please enter a site name");
      return;
    }

    try {
      await axios.post(`${API}/sites`, { name: newSiteName.trim() }, { withCredentials: true });
      toast.success("Site added!");
      setNewSiteName("");
      setIsAddSiteOpen(false);
      loadInitialData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to add site");
    }
  };

  const handleAddParty = async () => {
    if (!newPartyName.trim()) {
      toast.error("Please enter a party name");
      return;
    }

    try {
      await axios.post(`${API}/parties`, { name: newPartyName.trim() }, { withCredentials: true });
      toast.success("Party added!");
      setNewPartyName("");
      setIsAddPartyOpen(false);
      loadInitialData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to add party");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <header className="bg-slate-900 text-white px-4 py-4 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
              <HardHat className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm">Dhaya Promoters</p>
              <p className="text-xs text-slate-400">Staff Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-slate-400">{user?.email}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              data-testid="logout-btn"
              className="text-slate-300 hover:text-white hover:bg-slate-800"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Today's Summary */}
      <div className="px-4 py-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Today's Activity</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Receipt className="w-5 h-5 text-orange-600" />
              </div>
              <span className="text-slate-600 text-sm">Bills Added</span>
            </div>
            <p className="text-3xl font-bold text-slate-900 font-numeric">{todayBills.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Camera className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-slate-600 text-sm">Photos</span>
            </div>
            <p className="text-3xl font-bold text-slate-900 font-numeric">{todayPhotos.length}</p>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4">
        {activeTab === "bills" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Recent Bills</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAddBillOpen(true)}
                data-testid="add-bill-btn"
                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
              >
                <Plus className="w-4 h-4 mr-1" /> Add Bill
              </Button>
            </div>
            
            {todayBills.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No bills added today</p>
                <Button
                  onClick={() => setIsAddBillOpen(true)}
                  className="mt-4 bg-orange-500 hover:bg-orange-600 text-white"
                  data-testid="add-first-bill-btn"
                >
                  Add Your First Bill
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {todayBills.map((bill) => (
                  <div
                    key={bill.bill_id}
                    className="bg-white rounded-xl border border-slate-200 p-4"
                    data-testid={`bill-card-${bill.bill_id}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-slate-900">{bill.party_name}</p>
                        <p className="text-sm text-slate-500">{bill.site_name}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        bill.status === "Paid" ? "status-paid" :
                        bill.status === "Partially Paid" ? "status-partial" : "status-pending"
                      }`}>
                        {bill.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                        {bill.category}
                      </span>
                      <p className="text-lg font-bold text-slate-900 font-numeric">
                        ₹{bill.bill_amount?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "photos" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Site Photos</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAddPhotoOpen(true)}
                data-testid="add-photo-btn"
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                <Plus className="w-4 h-4 mr-1" /> Upload Photo
              </Button>
            </div>

            {todayPhotos.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                <Camera className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No photos uploaded today</p>
                <Button
                  onClick={() => setIsAddPhotoOpen(true)}
                  className="mt-4 bg-blue-500 hover:bg-blue-600 text-white"
                  data-testid="add-first-photo-btn"
                >
                  Upload First Photo
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {todayPhotos.map((photo) => (
                  <div
                    key={photo.photo_id}
                    className="bg-white rounded-xl border border-slate-200 overflow-hidden"
                    data-testid={`photo-card-${photo.photo_id}`}
                  >
                    <div className="aspect-square bg-slate-100">
                      {photo.photo_data ? (
                        <img
                          src={photo.photo_data}
                          alt={photo.site_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-slate-300" />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="font-medium text-slate-900 text-sm truncate">{photo.site_name}</p>
                      {photo.description && (
                        <p className="text-xs text-slate-500 truncate">{photo.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-[9999] shadow-lg" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 20px)' }}>
        <div className="flex items-center justify-around h-20">
          <button
            onClick={() => setActiveTab("bills")}
            data-testid="nav-bills"
            className={`flex flex-col items-center justify-center w-full h-full ${
              activeTab === "bills" ? "text-orange-600" : "text-slate-400"
            }`}
          >
            <Receipt className="w-6 h-6" />
            <span className="text-xs mt-1 font-medium">Bills</span>
          </button>
          <button
            onClick={() => setIsAddBillOpen(true)}
            data-testid="nav-add"
            className="flex flex-col items-center justify-center w-20 h-20 -mt-6 bg-orange-500 rounded-full text-white shadow-lg active:scale-95 transition-transform"
          >
            <Plus className="w-8 h-8" />
          </button>
          <button
            onClick={() => setActiveTab("photos")}
            data-testid="nav-photos"
            className={`flex flex-col items-center justify-center w-full h-full ${
              activeTab === "photos" ? "text-blue-600" : "text-slate-400"
            }`}
          >
            <Camera className="w-6 h-6" />
            <span className="text-xs mt-1 font-medium">Photos</span>
          </button>
        </div>
      </nav>

      {/* Add Bill Dialog */}
      <Dialog open={isAddBillOpen} onOpenChange={setIsAddBillOpen}>
        <DialogContent className="max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-orange-500" />
              Add New Bill
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Site Name */}
            <div>
              <Label className="text-slate-700 mb-2 block">Site Name *</Label>
              <div className="flex gap-2">
                <Select
                  value={billForm.site_name}
                  onValueChange={(v) => setBillForm({ ...billForm, site_name: v })}
                >
                  <SelectTrigger className="flex-1 h-12" data-testid="bill-site-select">
                    <SelectValue placeholder="Select site" />
                  </SelectTrigger>
                  <SelectContent>
                    {sites.map((site) => (
                      <SelectItem key={site.site_id || site.name} value={site.name}>
                        {site.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setIsAddSiteOpen(true)}
                  className="h-12 w-12"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Party Name */}
            <div>
              <Label className="text-slate-700 mb-2 block">Party Name *</Label>
              <div className="flex gap-2">
                <Select
                  value={billForm.party_name}
                  onValueChange={(v) => setBillForm({ ...billForm, party_name: v })}
                >
                  <SelectTrigger className="flex-1 h-12" data-testid="bill-party-select">
                    <SelectValue placeholder="Select party" />
                  </SelectTrigger>
                  <SelectContent>
                    {parties.map((party) => (
                      <SelectItem key={party.party_id || party.name} value={party.name}>
                        {party.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setIsAddPartyOpen(true)}
                  className="h-12 w-12"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Category */}
            <div>
              <Label className="text-slate-700 mb-2 block">Category *</Label>
              <Select
                value={billForm.category}
                onValueChange={(v) => setBillForm({ ...billForm, category: v })}
              >
                <SelectTrigger className="h-12" data-testid="bill-category-select">
                  <SelectValue placeholder="Select category" />
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

            {/* Bill Amount */}
            <div>
              <Label className="text-slate-700 mb-2 block">Bill Amount (₹) *</Label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={billForm.bill_amount}
                onChange={(e) => setBillForm({ ...billForm, bill_amount: e.target.value })}
                className="h-12"
                data-testid="bill-amount-input"
              />
            </div>

            {/* Bill Photo */}
            <div>
              <Label className="text-slate-700 mb-2 block">Bill Photo</Label>
              <div className="dropzone p-6 text-center cursor-pointer relative">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => handleFileChange(e, "bill")}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  data-testid="bill-photo-input"
                />
                {billForm.bill_photo ? (
                  <div className="relative">
                    <img
                      src={billForm.bill_photo}
                      alt="Bill"
                      className="max-h-40 mx-auto rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setBillForm({ ...billForm, bill_photo: null });
                      }}
                      className="absolute top-0 right-0 bg-white rounded-full shadow"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">Tap to capture or upload</p>
                  </>
                )}
              </div>
            </div>

            {/* Remarks */}
            <div>
              <Label className="text-slate-700 mb-2 block">Remarks (Optional)</Label>
              <Textarea
                placeholder="Add any notes..."
                value={billForm.remarks}
                onChange={(e) => setBillForm({ ...billForm, remarks: e.target.value })}
                className="resize-none"
                rows={3}
                data-testid="bill-remarks-input"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setIsAddBillOpen(false)}
              className="flex-1 h-12"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddBill}
              className="flex-1 h-12 bg-orange-500 hover:bg-orange-600 text-white"
              data-testid="submit-bill-btn"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Add Bill
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Photo Dialog */}
      <Dialog open={isAddPhotoOpen} onOpenChange={setIsAddPhotoOpen}>
        <DialogContent className="max-w-lg mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-blue-500" />
              Upload Site Photo
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Site Name */}
            <div>
              <Label className="text-slate-700 mb-2 block">Site Name *</Label>
              <Select
                value={photoForm.site_name}
                onValueChange={(v) => setPhotoForm({ ...photoForm, site_name: v })}
              >
                <SelectTrigger className="h-12" data-testid="photo-site-select">
                  <SelectValue placeholder="Select site" />
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

            {/* Photo */}
            <div>
              <Label className="text-slate-700 mb-2 block">Photo *</Label>
              <div className="dropzone p-8 text-center cursor-pointer relative">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => handleFileChange(e, "photo")}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  data-testid="photo-file-input"
                />
                {photoForm.photo_data ? (
                  <div className="relative">
                    <img
                      src={photoForm.photo_data}
                      alt="Site"
                      className="max-h-48 mx-auto rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPhotoForm({ ...photoForm, photo_data: null });
                      }}
                      className="absolute top-0 right-0 bg-white rounded-full shadow"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Camera className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">Tap to capture site photo</p>
                  </>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <Label className="text-slate-700 mb-2 block">Description (Optional)</Label>
              <Textarea
                placeholder="Describe what's in the photo..."
                value={photoForm.description}
                onChange={(e) => setPhotoForm({ ...photoForm, description: e.target.value })}
                className="resize-none"
                rows={2}
                data-testid="photo-description-input"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setIsAddPhotoOpen(false)}
              className="flex-1 h-12"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddPhoto}
              className="flex-1 h-12 bg-blue-500 hover:bg-blue-600 text-white"
              data-testid="submit-photo-btn"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Photo
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Site Dialog */}
      <Dialog open={isAddSiteOpen} onOpenChange={setIsAddSiteOpen}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle>Add New Site</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label className="text-slate-700 mb-2 block">Site Name</Label>
            <Input
              placeholder="Enter site name"
              value={newSiteName}
              onChange={(e) => setNewSiteName(e.target.value)}
              className="h-12"
              data-testid="new-site-input"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setIsAddSiteOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleAddSite}
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white"
              data-testid="submit-site-btn"
            >
              Add Site
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Party Dialog */}
      <Dialog open={isAddPartyOpen} onOpenChange={setIsAddPartyOpen}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle>Add New Party</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label className="text-slate-700 mb-2 block">Party Name</Label>
            <Input
              placeholder="Enter party/supplier name"
              value={newPartyName}
              onChange={(e) => setNewPartyName(e.target.value)}
              className="h-12"
              data-testid="new-party-input"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setIsAddPartyOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleAddParty}
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white"
              data-testid="submit-party-btn"
            >
              Add Party
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffDashboard;
