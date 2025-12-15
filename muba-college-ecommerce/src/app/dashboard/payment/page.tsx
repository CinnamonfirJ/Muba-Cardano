"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import {
  MapPin,
  Plus,
  Edit,
  Trash2,
  Check,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Address {
  _id: string;
  fullname: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  isDefault: boolean;
}

export default function PaymentPage() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  
  const [formData, setFormData] = useState({
    fullname: "",
    phone: "",
    address: "",
    city: "",
    state: "",
  });

  // Since backend endpoints don't exist yet, using localStorage as temporary storage
  useEffect(() => {
    loadAddresses();
  }, [user]);

  const loadAddresses = () => {
    try {
      const saved = localStorage.getItem(`addresses_${user?._id}`);
      if (saved) {
        setAddresses(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Error loading addresses:", error);
    }
  };

  const saveAddresses = (newAddresses: Address[]) => {
    try {
      localStorage.setItem(
        `addresses_${user?._id}`,
        JSON.stringify(newAddresses)
      );
      setAddresses(newAddresses);
    } catch (error) {
      console.error("Error saving addresses:", error);
      setError("Failed to save addresses");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (editingAddress) {
        // Update existing address
        const updated = addresses.map((addr) =>
          addr._id === editingAddress._id
            ? { ...addr, ...formData }
            : addr
        );
        saveAddresses(updated);
      } else {
        // Add new address
        const newAddress: Address = {
          _id: Date.now().toString(),
          ...formData,
          isDefault: addresses.length === 0,
        };
        saveAddresses([...addresses, newAddress]);
      }

      resetForm();
      setIsDialogOpen(false);
    } catch (err) {
      setError("Failed to save address");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setFormData({
      fullname: address.fullname,
      phone: address.phone,
      address: address.address,
      city: address.city,
      state: address.state,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (addressId: string) => {
    if (window.confirm("Are you sure you want to delete this address?")) {
      const filtered = addresses.filter((addr) => addr._id !== addressId);
      saveAddresses(filtered);
    }
  };

  const handleSetDefault = (addressId: string) => {
    const updated = addresses.map((addr) => ({
      ...addr,
      isDefault: addr._id === addressId,
    }));
    saveAddresses(updated);
  };

  const resetForm = () => {
    setFormData({
      fullname: "",
      phone: "",
      address: "",
      city: "",
      state: "",
    });
    setEditingAddress(null);
  };

  const handleOpenDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Shipping Addresses
          </h1>
          <p className="text-muted-foreground">
            Manage your delivery addresses
          </p>
        </div>
        <Button
          onClick={handleOpenDialog}
          className="bg-[#3bb85e] hover:bg-[#2d8a47]"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Address
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-800">
              <span className="font-medium">Error:</span>
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Addresses List */}
      {addresses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No addresses yet
            </h3>
            <p className="text-gray-600 mb-4">
              Add your first shipping address to get started.
            </p>
            <Button
              onClick={handleOpenDialog}
              className="bg-[#3bb85e] hover:bg-[#2d8a47]"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Address
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {addresses.map((address) => (
            <Card
              key={address._id}
              className={
                address.isDefault
                  ? "border-[#3bb85e] border-2"
                  : ""
              }
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {address.fullname}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {address.phone}
                    </p>
                  </div>
                  {address.isDefault && (
                    <Badge className="bg-[#3bb85e]">
                      <Check className="mr-1 h-3 w-3" />
                      Default
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-gray-600">
                  <p>{address.address}</p>
                  <p>
                    {address.city}, {address.state}
                  </p>
                </div>
                <div className="flex gap-2">
                  {!address.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(address._id)}
                    >
                      Set as Default
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(address)}
                  >
                    <Edit className="mr-1 h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(address._id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? "Edit Address" : "Add New Address"}
            </DialogTitle>
            <DialogDescription>
              {editingAddress
                ? "Update your shipping address details."
                : "Add a new shipping address for delivery."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="fullname">Full Name</Label>
                <Input
                  id="fullname"
                  value={formData.fullname}
                  onChange={(e) =>
                    setFormData({ ...formData, fullname: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) =>
                      setFormData({ ...formData, state: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-[#3bb85e] hover:bg-[#2d8a47]"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingAddress ? "Update" : "Add"} Address
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
