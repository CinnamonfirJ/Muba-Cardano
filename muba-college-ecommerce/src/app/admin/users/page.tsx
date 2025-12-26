"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Ban, CheckCircle } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function AdminUsersPage() {
  const [roleFilter, setRoleFilter] = useState("all");
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  // Fetch Users
  const { data: users, isLoading } = useQuery({
    queryKey: ["adminUsers", roleFilter],
    queryFn: async () => {
      const url = roleFilter !== "all" 
        ? `/api/v1/admin/users?role=${roleFilter}` 
        : "/api/v1/admin/users";
      const response = await api.get(url);
      return response.data.data;
    },
  });

  const toggleBanMutation = useMutation({
    mutationFn: async ({ id, banned }: { id: string, banned: boolean }) => {
        await api.patch(`/api/v1/admin/users/${id}/ban`, { banned });
    },
    onSuccess: () => {
        toast.success("User status updated");
        queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    },
    onError: () => toast.error("Failed to update user status")
  });

  const filteredUsers = users?.filter((u: any) => {
      const searchLower = search.toLowerCase();
      return (
          u.email.toLowerCase().includes(searchLower) ||
          u.firstname.toLowerCase().includes(searchLower) ||
          u.lastname.toLowerCase().includes(searchLower)
      );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl font-bold">User Management</h1>
        <div className="flex gap-4 w-full md:w-auto">
            <Input 
                placeholder="Search users..." 
                className="max-w-[300px]"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
            <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="user">Users</SelectItem>
                    <SelectItem value="vendor">Vendors</SelectItem>
                    <SelectItem value="post_office">Post Office</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </div>

      <div className="border rounded-lg bg-white">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {isLoading ? (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                            <Loader2 className="animate-spin w-8 h-8 mx-auto text-green-600" />
                        </TableCell>
                    </TableRow>
                ) : filteredUsers?.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">No users found.</TableCell>
                    </TableRow>
                ) : (
                    filteredUsers?.map((user: any) => (
                        <TableRow key={user._id}>
                            <TableCell className="font-medium">{user.firstname} {user.lastname}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                                <Badge variant="outline">{user.role}</Badge>
                            </TableCell>
                            <TableCell>
                                {user.isBanned ? (
                                    <Badge variant="destructive">Banned</Badge>
                                ) : (
                                    <Badge variant="secondary" className="bg-green-100 text-green-700">Active</Badge>
                                )}
                            </TableCell>
                            <TableCell className="text-right">
                                {user.role !== "admin" && (
                                    <Button 
                                        size="sm" 
                                        variant={user.isBanned ? "outline" : "ghost"}
                                        className={user.isBanned ? "text-green-600 border-green-200" : "text-red-500 hover:text-red-600 hover:bg-red-50"}
                                        onClick={() => toggleBanMutation.mutate({ id: user._id, banned: !user.isBanned })}
                                        disabled={toggleBanMutation.isPending}
                                    >
                                        {user.isBanned ? (
                                            <>
                                                <CheckCircle className="w-4 h-4 mr-1" /> Unban
                                            </>
                                        ) : (
                                            <>
                                                <Ban className="w-4 h-4 mr-1" /> Ban
                                            </>
                                        )}
                                    </Button>
                                )}
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
      </div>
    </div>
  );
}
