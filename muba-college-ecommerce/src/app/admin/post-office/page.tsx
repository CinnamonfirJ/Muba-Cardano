"use client";

import { useQuery } from "@tanstack/react-query";
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
import { Loader2, Eye } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function AdminPostOfficePage() {
  const [filter, setFilter] = useState("all");

  const { data: users, isLoading } = useQuery({
    queryKey: ["adminPostOffice"],
    queryFn: async () => {
      // We fetch ALL users with 'post_office' involved roles OR 'postOfficeStatus' pending
      // Wait, there isn't a single endpoint for "All Post Office Applications".
      // We have `GetPendingPostOfficeApplications` (pending only).
      // We have `GetUsersByRole` (role based).
      // We need a way to see Rejected ones too (who still have role='user' but postOfficeStatus='rejected').
      // Let's use `GetUsersByRole` but that only filters by role.
      // Hmm. The Admin API for Post Office is a bit limited in the implementation plan.
      // Let's look at `GetPendingPostOfficeApplications` in backend. It queries `User.find({ postOfficeStatus: "pending" })`.
      // We potentially need to client-side filter or add a query param to `GetUsersByRole` or a new endpoint.
      // For now, let's fetch 'pending' ones from the devoted endpoint, AND fetch valid 'post_office' users from Users endpoint.
      // Rejected ones might be hard to find unless we search all users.
      // Let's stick to showing Pending and Active for now, as that covers most use cases.
      // Actually, let's fetch `GetPendingPostOfficeApplications` for PENDING.
      // And `GetUsersByRole?role=post_office` for ACTIVE.
      // Merge them?
      
      const pendingRes = await api.get("/api/v1/admin/post-office/pending");
      const activeRes = await api.get("/api/v1/admin/users?role=post_office");
      
      const pending = pendingRes.data.data.map((u: any) => ({ ...u, _status: "pending" }));
      const active = activeRes.data.data.map((u: any) => ({ ...u, _status: "accepted" }));
      
      return [...pending, ...active];
    },
  });

   // Deduplicate by ID just in case
   const uniqueUsers = users ? Array.from(new Map(users.map((item:any) => [item._id, item])).values()) : [];

   const filteredDetails = uniqueUsers.filter((u: any) => {
       if (filter === "all") return true;
       return u._status === filter;
   });

  if (isLoading) {
     return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Post Office Applications</h1>
         <div className="flex gap-2">
            <Button 
                variant={filter === "all" ? "default" : "outline"}
                onClick={() => setFilter("all")}
            >
                All
            </Button>
            <Button 
                variant={filter === "pending" ? "default" : "outline"}
                onClick={() => setFilter("pending")}
                className={filter === "pending" ? "bg-yellow-500 hover:bg-yellow-600" : ""}
            >
                Pending
            </Button>
            <Button 
                variant={filter === "accepted" ? "default" : "outline"}
                onClick={() => setFilter("accepted")}
                className={filter === "accepted" ? "bg-green-600 hover:bg-green-700" : ""}
            >
                Active
            </Button>
        </div>
      </div>

      <div className="border rounded-lg bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Station Name</TableHead>
              <TableHead>Applicant</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
               <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
             {filteredDetails.length === 0 ? (
                <TableRow>
                     <TableCell colSpan={5} className="text-center py-8">No applications found.</TableCell>
                </TableRow>
             ) : (
                 filteredDetails.map((u: any) => (
                    <TableRow key={u._id}>
                        <TableCell className="font-medium">{u.postOfficeName || "N/A"}</TableCell>
                        <TableCell>{u.firstname} {u.lastname}</TableCell>
                        <TableCell>{u.email}</TableCell>
                         <TableCell>
                            <Badge variant={u._status === "accepted" ? "default" : "secondary"}>
                                {u._status.toUpperCase()}
                            </Badge>
                        </TableCell>
                         <TableCell className="text-right">
                             <Link href={`/admin/post-office/${u._id}`}>
                                <Button size="sm" variant="outline">View</Button>
                             </Link>
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
