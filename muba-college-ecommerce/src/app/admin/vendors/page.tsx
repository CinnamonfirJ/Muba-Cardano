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
import { Input } from "@/components/ui/input";

export default function AdminVendorsPage() {
  const [filter, setFilter] = useState("all");
  
  const { data: vendors, isLoading } = useQuery({
    queryKey: ["adminVendors"],
    queryFn: async () => {
      // Fetch ALL applications (pending, approved, rejected)
      // The backend endpoint GetAllVendorApplications returns everything with status attached
      const response = await api.get("/api/v1/admin/vendors");
      return response.data.data;
    },
  });

  const filteredVendors = vendors?.filter((v: any) => {
    if (filter === "all") return true;
    return v.status === filter;
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
        <h1 className="text-2xl font-bold">Vendor Applications</h1>
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
             <Button 
                variant={filter === "rejected" ? "default" : "outline"}
                onClick={() => setFilter("rejected")}
                className={filter === "rejected" ? "bg-red-600 hover:bg-red-700" : ""}
            >
                Rejected
            </Button>
        </div>
      </div>

      <div className="border rounded-lg bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Business Name</TableHead>
              <TableHead>Applicant</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVendors?.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No applications found.
                    </TableCell>
                </TableRow>
            ) : (
                filteredVendors?.map((vendor: any) => (
                <TableRow key={vendor._id}>
                    <TableCell className="font-medium">{vendor.business_name || "N/A"}</TableCell>
                    <TableCell>{vendor.firstname} {vendor.lastname}</TableCell>
                    <TableCell>{vendor.email}</TableCell>
                    <TableCell>
                    <Badge variant={
                        vendor.status === "accepted" ? "default" : 
                        vendor.status === "rejected" ? "destructive" : "secondary"
                    }>
                        {vendor.status}
                    </Badge>
                    </TableCell>
                    <TableCell>{new Date(vendor.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                    <Link href={`/admin/vendors/${vendor._id}`}>
                        <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                        </Button>
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
