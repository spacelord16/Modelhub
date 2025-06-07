"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Users,
  Search,
  Settings,
  Shield,
  UserCheck,
  UserX,
  RefreshCw,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";

interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  is_active: boolean;
  role: "USER" | "MODERATOR" | "ADMIN" | "SUPER_ADMIN";
  last_login?: string;
  login_count: number;
  created_at: string;
  model_count: number;
}

const roleColors = {
  USER: "bg-gray-100 text-gray-800",
  MODERATOR: "bg-blue-100 text-blue-800",
  ADMIN: "bg-purple-100 text-purple-800",
  SUPER_ADMIN: "bg-red-100 text-red-800",
};

const roleLabels = {
  USER: "User",
  MODERATOR: "Moderator",
  ADMIN: "Admin",
  SUPER_ADMIN: "Super Admin",
};

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newRole, setNewRole] = useState<string>("");
  const [newStatus, setNewStatus] = useState<boolean>(true);
  const [statusReason, setStatusReason] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/admin/users", {
        params: {
          role_filter: roleFilter !== "all" ? roleFilter : undefined,
          active_only: statusFilter === "active",
        },
      });
      setUsers(response.data);
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleUpdate = async () => {
    if (!selectedUser) return;

    try {
      const response = await apiClient.put(
        `/admin/users/${selectedUser.id}/role`,
        {
          role: newRole,
        }
      );

      setUsers(
        users.map((user) =>
          user.id === selectedUser.id ? response.data : user
        )
      );

      toast.success(`Role updated for ${selectedUser.username}`);
      setShowRoleDialog(false);
      setSelectedUser(null);
    } catch (error) {
      toast.error("Failed to update user role");
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedUser) return;

    try {
      const response = await apiClient.put(
        `/admin/users/${selectedUser.id}/status`,
        {
          is_active: newStatus,
          reason: statusReason,
        }
      );

      setUsers(
        users.map((user) =>
          user.id === selectedUser.id ? response.data : user
        )
      );

      toast.success(`Status updated for ${selectedUser.username}`);
      setShowStatusDialog(false);
      setSelectedUser(null);
      setStatusReason("");
    } catch (error) {
      toast.error("Failed to update user status");
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.full_name &&
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && user.is_active) ||
      (statusFilter === "inactive" && !user.is_active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
          </CardTitle>
          <CardDescription>
            Manage user accounts, roles, and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users by name, username, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="USER">Users</SelectItem>
                <SelectItem value="MODERATOR">Moderators</SelectItem>
                <SelectItem value="ADMIN">Admins</SelectItem>
                <SelectItem value="SUPER_ADMIN">Super Admins</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={loadUsers} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* User Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Models</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-2" />
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-gray-500"
                    >
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{user.username}</div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                          {user.full_name && (
                            <div className="text-sm text-gray-500">
                              {user.full_name}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={roleColors[user.role]}>
                          {roleLabels[user.role]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.is_active ? "default" : "secondary"}
                        >
                          {user.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.model_count}</TableCell>
                      <TableCell>
                        {user.last_login
                          ? new Date(user.last_login).toLocaleDateString()
                          : "Never"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setNewRole(user.role);
                              setShowRoleDialog(true);
                            }}
                          >
                            <Shield className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setNewStatus(!user.is_active);
                              setShowStatusDialog(true);
                            }}
                          >
                            {user.is_active ? (
                              <UserX className="h-4 w-4" />
                            ) : (
                              <UserCheck className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Role Update Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update User Role</DialogTitle>
            <DialogDescription>
              Change the role for {selectedUser?.username}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role
              </Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">User</SelectItem>
                  <SelectItem value="MODERATOR">Moderator</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRoleUpdate}>Update Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update User Status</DialogTitle>
            <DialogDescription>
              {newStatus ? "Activate" : "Deactivate"} account for{" "}
              {selectedUser?.username}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reason" className="text-right">
                Reason
              </Label>
              <Textarea
                id="reason"
                placeholder="Reason for status change..."
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowStatusDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleStatusUpdate}
              variant={newStatus ? "default" : "destructive"}
            >
              {newStatus ? "Activate" : "Deactivate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
