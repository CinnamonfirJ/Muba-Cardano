"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { Store, Upload, FileText, CheckCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

type ApplicationStatus = "none" | "pending" | "accepted" | "rejected";

export default function BecomeVendorPage() {
  const { user, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [formData, setFormData] = useState({
    businessName: "",
    businessDescription: "",
    businessAddress: "",
    businessPhone: "",
    businessEmail: user?.email || "",
    idDocument: null as File | null,
    businessDocument: null as File | null,
  });

  // Get application status from user object or localStorage
  const applicationStatus: ApplicationStatus = user?.vendorStatus || "none";

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "idDocument" | "businessDocument"
  ) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, [field]: e.target.files[0] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!acceptedTerms) {
      setError("You must accept the terms and conditions");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // TODO: Submit to backend when available
      // For now, update local state
      updateUser({
        ...user!,
        vendorStatus: "pending",
      });

      // Store application data in localStorage
      localStorage.setItem(
        `vendor_application_${user?._id}`,
        JSON.stringify({
          ...formData,
          submittedAt: new Date().toISOString(),
        })
      );
    } catch (err: any) {
      setError(err.message || "Failed to submit application");
    } finally {
      setIsLoading(false);
    }
  };

  // If already a vendor or pending
  if (applicationStatus === "accepted") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendor Status</h1>
          <p className="text-muted-foreground">
            You are already a registered vendor
          </p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="w-16 h-16 mx-auto text-green-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              Congratulations! You're a Vendor
            </h3>
            <p className="text-gray-600 mb-4">
              You now have full access to vendor features.
            </p>
            <Button
              onClick={() => (window.location.href = "/dashboard/storefronts")}
              className="bg-[#3bb85e] hover:bg-[#2d8a47]"
            >
              Go to My Stores
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (applicationStatus === "pending") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendor Application</h1>
          <p className="text-muted-foreground">
            Application status: Pending review
          </p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="w-16 h-16 mx-auto text-[#3bb85e] mb-4 animate-spin" />
            <h3 className="text-xl font-semibold mb-2">
              Application Under Review
            </h3>
            <p className="text-gray-600">
              Your vendor application is being reviewed by our team.
              <br />
              We'll notify you once a decision has been made.
            </p>
            <Badge className="mt-4" variant="secondary">
              Estimated review time: 2-3 business days
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (applicationStatus === "rejected") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendor Application</h1>
          <p className="text-muted-foreground">
            Application status: Rejected
          </p>
        </div>
        <Card className="border-red-200">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              Application Not Approved
            </h3>
            <p className="text-gray-600 mb-4">
              Unfortunately, your vendor application was not approved.
              <br />
              Please contact support for more information.
            </p>
            <Button variant="outline">Contact Support</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Application form for new applicants
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Become a Vendor</h1>
        <p className="text-muted-foreground">
          Apply to sell your products on Muba College Marketplace
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Benefits */}
      <Card>
        <CardHeader>
          <CardTitle>Vendor Benefits</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-[#3bb85e] shrink-0 mt-0.5" />
              <span>Reach thousands of students on campus</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-[#3bb85e] shrink-0 mt-0.5" />
              <span>Create multiple storefronts for different product categories</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-[#3bb85e] shrink-0 mt-0.5" />
              <span>Manage orders and inventory with our dashboard</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-[#3bb85e] shrink-0 mt-0.5" />
              <span>Secure payment processing and timely payouts</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Application Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Vendor Application Form
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-medium">Business Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="businessName">Business/Store Name *</Label>
                <Input
                  id="businessName"
                  value={formData.businessName}
                  onChange={(e) =>
                    setFormData({ ...formData, businessName: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessDescription">Business Description *</Label>
                <Textarea
                  id="businessDescription"
                  value={formData.businessDescription}
                  onChange={(e) =>
                    setFormData({ ...formData, businessDescription: e.target.value })
                  }
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessPhone">Business Phone *</Label>
                  <Input
                    id="businessPhone"
                    type="tel"
                    value={formData.businessPhone}
                    onChange={(e) =>
                      setFormData({ ...formData, businessPhone: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessEmail">Business Email *</Label>
                  <Input
                    id="businessEmail"
                    type="email"
                    value={formData.businessEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, businessEmail: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessAddress">Business Address *</Label>
                <Input
                  id="businessAddress"
                  value={formData.businessAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, businessAddress: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">Required Documents</h3>
              
              <div className="space-y-2">
                <Label htmlFor="idDocument">Valid ID Document *</Label>
                <Input
                  id="idDocument"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, "idDocument")}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Student ID, National ID, or Driver's License
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessDocument">Business Registration (Optional)</Label>
                <Input
                  id="businessDocument"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, "businessDocument")}
                />
                <p className="text-xs text-muted-foreground">
                  CAC registration or business license if applicable
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Checkbox
                id="terms"
                checked={acceptedTerms}
                onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
              />
              <label htmlFor="terms" className="text-sm">
                I agree to the{" "}
                <a href="#" className="text-[#3bb85e] hover:underline">
                  Terms and Conditions
                </a>{" "}
                and{" "}
                <a href="#" className="text-[#3bb85e] hover:underline">
                  Vendor Policy
                </a>
              </label>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !acceptedTerms}
              className="bg-[#3bb85e] hover:bg-[#2d8a47] w-full"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Application
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
