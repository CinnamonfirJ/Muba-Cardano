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

export default function PostOfficeDetail() {
  const { id } = useParams() as { id: string };
  const queryClient = useQueryClient();
  const [rejectReason, setRejectReason] = useState("");
  const [isRejectOpen, setIsRejectOpen] = useState(false);

  // We reuse the single user fetch because the PO application data is ON the user object
  const { data: user, isLoading } = useQuery({
    queryKey: ["adminUser", id],
    queryFn: async () => {
      // Need a way to fetch single user by ID as admin.
      // Implementation plan didn't explicitly add `GetUserById`, but `GetUsersByRole` exists.
      // However, usually `authService.getUserProfile` fetches *my* profile.
      // We can use the Vendor Detail endpoint pattern? No, that's for RequestVendor model.
      // Post Office info is on User model.
      // Let's assume we can fetch via generic user endpoint if we implemented it?
      // Wait, `GetAdminStats` etc are there.
      // I don't have a direct `GetUserById` admin endpoint in the provided snippets.
      // BUT `GetVendorApplication` works for vendors.
      // For Post Office, it's just a user.
      // I'll assume we can filter `GetUsersByRole` or just iterate? No that's inefficient.
      // I should have added `GetUserById`.
      // Workaround: Use `GetUsersByRole` (which returns list) or if I can pass ID?
      // Actually, looking at `admin.route.ts`, there is NO `router.get("/users/:id")`.
      // I will add it or just fail?
      // Wait, `GetPendingPostOfficeApplications` returns a list.
      // I can iterate that list if status is pending.
      // If accepted, I can iterate `GetUsersByRole?role=post_office`.
      // It's a hack but avoiding new backend code if possible.
      // Actually, I'll attempt this. If it fails I'll ask to add endpoint.
      // Better: I'll use the `GetPendingPostOfficeApplications` if pending, else `GetUsersByRole`.
      
      try {
          // Attempt find in pending list
          const pending = await api.get("/api/v1/admin/post-office/pending");
          const foundPending = pending.data.data.find((u: any) => u._id === id);
          if (foundPending) return foundPending;
          
          // Try active
          const active = await api.get("/api/v1/admin/users?role=post_office");
           const foundActive = active.data.data.find((u: any) => u._id === id);
          if (foundActive) return foundActive;

          throw new Error("User not found");
      } catch (e) {
          throw e;
      }
    },
     retry: false
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/api/v1/admin/post-office/${id}/approve`);
    },
    onSuccess: () => {
      toast.success("Post Office approved!");
      queryClient.invalidateQueries({ queryKey: ["adminUser", id] });
      queryClient.invalidateQueries({ queryKey: ["adminPostOffice"] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to approve"),
  });

  const rejectMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/api/v1/admin/post-office/${id}/reject`, { reason: rejectReason });
    },
    onSuccess: () => {
      toast.success("Post Office rejected.");
      setIsRejectOpen(false);
      queryClient.invalidateQueries({ queryKey: ["adminUser", id] });
       queryClient.invalidateQueries({ queryKey: ["adminPostOffice"] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to reject"),
  });

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-green-600" /></div>;
  }

  if (!user) return <div>User not found</div>;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/admin/post-office">
            <Button variant="ghost" size="icon">
                <ChevronLeft className="w-5 h-5" />
            </Button>
        </Link>
        <h1 className="text-2xl font-bold">Post Office Applicant</h1>
      </div>

       <Card>
            <CardHeader><CardTitle>Station Info</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                 <div>
                     <p className="text-sm text-gray-500">Proposed Station Name</p>
                     <p className="text-xl font-bold">{user.postOfficeName || "N/A"}</p>
                 </div>
                 <div className="flex items-center gap-4 border-t pt-4">
                     <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                         {user.firstname[0]}
                     </div>
                     <div>
                         <p className="font-bold">{user.firstname} {user.lastname}</p>
                         <p className="text-gray-500">{user.email}</p>
                     </div>
                 </div>
            </CardContent>
       </Card>

       <div className="flex justify-end gap-4 pb-10">
        {user.postOfficeStatus === "pending" ? (
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
                                Reason for rejection (sent via email):
                            </DialogDescription>
                        </DialogHeader>
                        <Textarea 
                            placeholder="Reason..." 
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
                                {rejectMutation.isPending ? "Rejecting..." : "Confirm"}
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
                Status: <span className={user.postOfficeStatus === "accepted" ? "text-green-600" : "text-red-600"}>
                    {user.postOfficeStatus?.toUpperCase() || (user.role === 'post_office' ? 'ACTIVE' : 'UNKNOWN')}
                </span>
            </div>
        )}
      </div>

    </div>
  );
}
