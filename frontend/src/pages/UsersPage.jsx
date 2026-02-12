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
  DialogDescription,
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
  Shield,
  UserCheck,
  UserPlus,
  Copy,
  Mail,
  CheckCircle2
} from "lucide-react";

const UsersPage = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadUsers();
    // Generate invite link
    const baseUrl = window.location.origin;
    setInviteLink(baseUrl);
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/users`, { withCredentials: true });
      setUsers(response.data);
    } catch (error) {
      toast.error("Failed to load users");
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

  const handleRoleChange = async (email, newRole) => {
    if (email === currentUser?.email) {
      toast.error("You cannot change your own role");
      return;
    }

    try {
      await axios.post(
        `${API}/auth/set-role?email=${encodeURIComponent(email)}&role=${newRole}`,
        {},
        { withCredentials: true }
      );
      toast.success(`Role updated to ${newRole}`);
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to update role");
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
    { icon: Receipt, label: "Bills", path: "/admin/bills" },
    { icon: CreditCard, label: "Payments", path: "/admin/payments" },
    { icon: Camera, label: "Site Photos", path: "/admin/photos" },
    { icon: FileText, label: "Reports", path: "/admin/reports" },
    { icon: Users, label: "Users", path: "/admin/users", active: true }
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
          <h1 className="font-bold text-lg">Users</h1>
        </header>

        <div className="p-4 md:p-8">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 hidden md:block">User Management</h1>
              <p className="text-slate-500 hidden md:block">{users.length} registered users</p>
            </div>
            <Button
              onClick={() => setIsInviteOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white"
              data-testid="invite-user-btn"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add / Invite Users
            </Button>
          </div>

          {/* Users List */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full spinner"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="font-bold text-slate-900 mb-2">No users yet</h3>
              <p className="text-slate-500 mb-4">Invite team members to get started</p>
              <Button
                onClick={() => setIsInviteOpen(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Invite First User
              </Button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">User</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Email</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Role</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {users.map((user) => (
                      <tr key={user.user_id} data-testid={`user-row-${user.user_id}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center overflow-hidden">
                              {user.picture ? (
                                <img src={user.picture} alt="" className="w-10 h-10 rounded-full" />
                              ) : (
                                <Users className="w-5 h-5 text-slate-500" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{user.name}</p>
                              {user.email === currentUser?.email && (
                                <span className="text-xs text-orange-600 font-medium">You</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{user.email}</td>
                        <td className="px-6 py-4">
                          {user.email === currentUser?.email ? (
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                              user.role === "admin" 
                                ? "bg-purple-100 text-purple-700" 
                                : "bg-slate-100 text-slate-700"
                            }`}>
                              {user.role === "admin" ? (
                                <Shield className="w-4 h-4" />
                              ) : (
                                <UserCheck className="w-4 h-4" />
                              )}
                              {user.role}
                            </span>
                          ) : (
                            <Select
                              value={user.role}
                              onValueChange={(v) => handleRoleChange(user.email, v)}
                            >
                              <SelectTrigger 
                                className="w-32"
                                data-testid={`role-select-${user.user_id}`}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="staff">
                                  <div className="flex items-center gap-2">
                                    <UserCheck className="w-4 h-4" />
                                    Staff
                                  </div>
                                </SelectItem>
                                <SelectItem value="admin">
                                  <div className="flex items-center gap-2">
                                    <Shield className="w-4 h-4" />
                                    Admin
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-sm">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Info Card */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h4 className="font-semibold text-blue-900 mb-2">Role Permissions</h4>
            <div className="space-y-2 text-sm text-blue-800">
              <p><strong>Staff:</strong> Can add bills, upload site photos, and view their own submissions.</p>
              <p><strong>Admin:</strong> Full access - manage bills, payments, users, view reports, upload photos, and export data.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Invite Users Dialog */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="max-w-lg mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-green-600" />
              Add / Invite Users
            </DialogTitle>
            <DialogDescription>
              Share this link with team members to invite them to join
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Invite Link */}
            <div>
              <Label className="text-slate-700 mb-2 block">Invite Link</Label>
              <div className="flex gap-2">
                <Input
                  value={inviteLink}
                  readOnly
                  className="h-12 bg-slate-50"
                />
                <Button
                  onClick={handleCopyLink}
                  className={`h-12 px-4 ${copied ? 'bg-green-600' : 'bg-slate-900'} hover:bg-slate-800 text-white`}
                  data-testid="copy-link-btn"
                >
                  {copied ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-slate-500 mt-2">
                Users who sign in via this link will automatically be added as Staff. You can change their role later.
              </p>
            </div>

            {/* Instructions */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h5 className="font-semibold text-slate-900 mb-3">How to add users:</h5>
              <ol className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="bg-orange-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0">1</span>
                  <span>Copy the invite link above</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-orange-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0">2</span>
                  <span>Share it with your team members via WhatsApp, SMS, or Email</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-orange-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0">3</span>
                  <span>They sign in with their Google account</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-orange-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0">4</span>
                  <span>They'll appear here as Staff (you can promote to Admin)</span>
                </li>
              </ol>
            </div>

            {/* Quick Share */}
            <div>
              <Label className="text-slate-700 mb-2 block">Quick Share</Label>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    const text = `Join Dhaya Promoters Site Manager: ${inviteLink}`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                  }}
                  data-testid="share-whatsapp-btn"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    const subject = "Join Dhaya Promoters Site Manager";
                    const body = `You've been invited to join Dhaya Promoters Site Manager.\n\nClick here to join: ${inviteLink}\n\nSign in with your Google account to get started.`;
                    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                  }}
                  data-testid="share-email-btn"
                >
                  <Mail className="w-5 h-5 mr-2" />
                  Email
                </Button>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => setIsInviteOpen(false)}
            className="w-full h-12"
          >
            Done
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersPage;
