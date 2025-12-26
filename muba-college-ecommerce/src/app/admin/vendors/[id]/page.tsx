"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle, ChevronLeft } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

export default function VendorApplicationDetail() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const queryClient = useQueryClient();
  const [rejectReason, setRejectReason] = useState("");
  const [isRejectOpen, setIsRejectOpen] = useState(false);

  const { data: application, isLoading } = useQuery({
    queryKey: ["vendorApplication", id],
    queryFn: async () => {
      const response = await api.get(`/api/v1/admin/vendors/${id}`);
      return response.data.data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/api/v1/admin/vendors/${id}/approve`);
    },
    onSuccess: () => {
      toast.success("Vendor application approved!");
      queryClient.invalidateQueries({ queryKey: ["vendorApplication", id] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to approve"),
  });

  const rejectMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/api/v1/admin/vendors/${id}/reject`, { rejectionReason: rejectReason });
    },
    onSuccess: () => {
      toast.success("Vendor application rejected.");
      setIsRejectOpen(false);
      queryClient.invalidateQueries({ queryKey: ["vendorApplication", id] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to reject"),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!application) return <div>Application not found</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/admin/vendors">
            <Button variant="ghost" size="icon">
                <ChevronLeft className="w-5 h-5" />
            </Button>
        </Link>
        <h1 className="text-2xl font-bold">Vendor Application Details</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Info */}
        <Card>
            <CardHeader><CardTitle>Applicant Info</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-4 items-center">
                     <div className="w-20 h-20 bg-gray-200 rounded-full overflow-hidden">
                        {application.picture ? (
                            <img src={application.picture} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500">No Img</div>
                        )}
                     </div>
                     <div>
                         <p className="font-bold text-lg">{application.firstname} {application.lastname}</p>
                         <p className="text-gray-500">{application.email}</p>
                         <p className="text-sm text-gray-500">{application.phone}</p>
                     </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                    <div>
                        <span className="text-gray-500 block">Matric Number</span>
                        <span className="font-medium">{application.matric_number}</span>
                    </div>
                    <div>
                        <span className="text-gray-500 block">Department</span>
                        <span className="font-medium">{application.department}</span>
                    </div>
                    <div>
                        <span className="text-gray-500 block">Faculty</span>
                        <span className="font-medium">{application.faculty}</span>
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* Business Info */}
        <Card>
            <CardHeader><CardTitle>Business Info</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                 <div>
                    <span className="text-gray-500 block text-sm">Business Name</span>
                    <span className="font-medium text-lg">{application.business_name}</span>
                </div>
                <div>
                    <span className="text-gray-500 block text-sm">Target Audience</span>
                    <span className="font-medium">{application.audience}</span>
                </div>
                 <div>
                    <span className="text-gray-500 block text-sm">Description</span>
                    <p className="text-sm text-gray-700">{application.desc}</p>
                </div>
                 <div>
                    <span className="text-gray-500 block text-sm">Address</span>
                    <span className="font-medium">{application.address}</span>
                </div>
            </CardContent>
        </Card>

        {/* Documents */}
        <Card className="md:col-span-2">
            <CardHeader><CardTitle>Documents</CardTitle></CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <p className="font-medium mb-2">Valid ID</p>
                        <div className="border rounded-lg overflow-hidden h-64 bg-gray-50 flex items-center justify-center">
                            {application.valid_id ? (
                                <img src={application.valid_id} alt="ID" className="max-w-full max-h-full object-contain" />
                            ) : <span>No ID Uploaded</span>}
                        </div>
                    </div>
                    <div>
                        <p className="font-medium mb-2">Business Registration (CAC)</p>
                         <div className="border rounded-lg overflow-hidden h-64 bg-gray-50 flex items-center justify-center">
                             {application.cac ? (
                                <img src={application.cac} alt="CAC" className="max-w-full max-h-full object-contain" />
                            ) : <span>No Document</span>}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4 pb-10">
        {application.status === "pending" ? (
             <>
                <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
                    <DialogTrigger asChild>
                         <Button variant="destructive" className="w-32">
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Reject Application</DialogTitle>
                            <DialogDescription>
                                Please provide a reason for rejecting this application. This will be sent to the user via email.
                            </DialogDescription>
                        </DialogHeader>
                        <Textarea 
                            placeholder="Reason for rejection..." 
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                        />
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsRejectOpen(false)}>Cancel</Button>
                            <Button 
                                variant="destructive" 
                                onClick={() => rejectMutation.mutate()}
                                disabled={rejectMutation.isPending || !rejectReason}
                            >
                                {rejectMutation.isPending ? "Rejecting..." : "Confirm Rejection"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Button 
                    className="w-32 bg-green-600 hover:bg-green-700"
                    onClick={() => approveMutation.mutate()}
                    disabled={approveMutation.isPending}
                >
                    {approveMutation.isPending ? <Loader2 className="animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                    Approve
                </Button>
             </>
        ) : (
            <div className="text-lg font-bold p-4 bg-gray-100 rounded-lg">
                Application Status: <span className={application.status === "accepted" ? "text-green-600" : "text-red-600"}>
                    {application.status.toUpperCase()}
                </span>
            </div>
        )}
      </div>
    </div>
  );
}
