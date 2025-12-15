"use client";

import type React from "react";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import {
  CreditCard,
  MapPin,
  Plus,
  Edit,
  Trash2,
  Home,
  Building,
  Save,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

// Define Address types
interface CampusAddress {
  id: string;
  type: "campus";
  title: string;
  fullName: string;
  phone: string;
  address: string;
  campus: string;
  landmark?: string; // Optional landmark
  isDefault: boolean;
}

interface HomeAddress {
  id: string;
  type: "home";
  title: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  landmark?: string; // Optional landmark
  isDefault: boolean;
}

type Address = CampusAddress | HomeAddress;

// Mock data - replace with actual API calls
const mockAddresses: Address[] = [
  {
    id: "addr-1",
    type: "campus",
    title: "Campus Hostel",
    fullName: "John Doe",
    phone: "+234 801 234 5678",
    address: "Room 205, Block A, Male Hostel",
    campus: "University of Lagos (UNILAG)",
    landmark: "Near the cafeteria",
    isDefault: true,
  },
  {
    id: "addr-2",
    type: "home",
    title: "Home Address",
    fullName: "John Doe",
    phone: "+234 801 234 5678",
    address: "15, Adebayo Street, Ikeja",
    city: "Lagos",
    state: "Lagos State",
    landmark: "Opposite First Bank",
    isDefault: false,
  },
];

const mockPaymentMethods = [
  {
    id: "card-1",
    type: "card",
    cardNumber: "**** **** **** 1234",
    cardType: "Visa",
    expiryDate: "12/26",
    holderName: "John Doe",
    isDefault: true,
  },
  {
    id: "card-2",
    type: "card",
    cardNumber: "**** **** **** 5678",
    cardType: "Mastercard",
    expiryDate: "08/25",
    holderName: "John Doe",
    isDefault: false,
  },
];

const campuses = [
  "University of Lagos (UNILAG)",
  "University of Ibadan (UI)",
  "Ahmadu Bello University (ABU)",
  "University of Nigeria, Nsukka (UNN)",
  "Obafemi Awolowo University (OAU)",
];

const nigerianStates = [
  "Lagos State",
  "Abuja FCT",
  "Kano State",
  "Rivers State",
  "Oyo State",
  "Kaduna State",
  "Ogun State",
  "Imo State",
  "Plateau State",
  "Akwa Ibom State",
];

// Define a combined type for the address form state to accommodate all fields
interface AddressFormState {
  type: "campus" | "home";
  title: string;
  fullName: string;
  phone: string;
  address: string;
  campus: string; // Always present, but might be empty for home type
  city: string; // Always present, but might be empty for campus type
  state: string; // Always present, but might be empty for campus type
  landmark?: string;
  isDefault: boolean;
}

const PaymentAddressSection = () => {
  const [addresses, setAddresses] = useState<Address[]>(mockAddresses);
  const [paymentMethods, setPaymentMethods] = useState(mockPaymentMethods);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<string | null>(null);
  const [editingPayment, setEditingPayment] = useState<string | null>(null);

  const [addressForm, setAddressForm] = useState<AddressFormState>({
    type: "campus",
    title: "",
    fullName: "",
    phone: "",
    address: "",
    campus: "",
    city: "",
    state: "",
    landmark: "",
    isDefault: false,
  });

  const [paymentForm, setPaymentForm] = useState({
    cardNumber: "",
    cardType: "",
    expiryDate: "",
    cvv: "",
    holderName: "",
    isDefault: false,
  });

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let newOrUpdatedAddress: Address;

    if (addressForm.type === "campus") {
      newOrUpdatedAddress = {
        id: editingAddress || `addr-${Date.now()}`,
        type: "campus",
        title: addressForm.title,
        fullName: addressForm.fullName,
        phone: addressForm.phone,
        address: addressForm.address,
        campus: addressForm.campus,
        landmark: addressForm.landmark,
        isDefault: addressForm.isDefault,
      };
    } else {
      // type is "home"
      newOrUpdatedAddress = {
        id: editingAddress || `addr-${Date.now()}`,
        type: "home",
        title: addressForm.title,
        fullName: addressForm.fullName,
        phone: addressForm.phone,
        address: addressForm.address,
        city: addressForm.city,
        state: addressForm.state,
        landmark: addressForm.landmark,
        isDefault: addressForm.isDefault,
      };
    }

    if (editingAddress) {
      setAddresses(
        addresses.map((addr) =>
          addr.id === editingAddress ? newOrUpdatedAddress : addr
        )
      );
      toast.success("Address updated successfully!");
    } else {
      setAddresses([...addresses, newOrUpdatedAddress]);
      toast.success("Address added successfully!");
    }

    resetAddressForm();
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingPayment) {
      setPaymentMethods(
        paymentMethods.map((payment) =>
          payment.id === editingPayment
            ? { ...paymentForm, id: editingPayment, type: "card" }
            : payment
        )
      );
      toast.success("Payment method updated successfully!");
    } else {
      const newPayment = {
        ...paymentForm,
        id: `card-${Date.now()}`,
        type: "card" as const,
        cardNumber: `**** **** **** ${paymentForm.cardNumber.slice(-4)}`,
      };
      setPaymentMethods([...paymentMethods, newPayment]);
      toast.success("Payment method added successfully!");
    }

    resetPaymentForm();
  };

  const resetAddressForm = () => {
    setAddressForm({
      type: "campus",
      title: "",
      fullName: "",
      phone: "",
      address: "",
      campus: "",
      city: "",
      state: "",
      landmark: "",
      isDefault: false,
    });
    setShowAddressForm(false);
    setEditingAddress(null);
  };

  const resetPaymentForm = () => {
    setPaymentForm({
      cardNumber: "",
      cardType: "",
      expiryDate: "",
      cvv: "",
      holderName: "",
      isDefault: false,
    });
    setShowPaymentForm(false);
    setEditingPayment(null);
  };

  const handleEditAddress = (address: Address) => {
    setAddressForm({
      type: address.type,
      title: address.title,
      fullName: address.fullName,
      phone: address.phone,
      address: address.address,
      campus: address.type === "campus" ? address.campus : "",
      city: address.type === "home" ? address.city : "",
      state: address.type === "home" ? address.state : "",
      landmark: address.landmark,
      isDefault: address.isDefault,
    });
    setEditingAddress(address.id);
    setShowAddressForm(true);
  };

  const handleEditPayment = (payment: (typeof mockPaymentMethods)[0]) => {
    setPaymentForm({
      cardNumber: payment.cardNumber,
      cardType: payment.cardType,
      expiryDate: payment.expiryDate,
      cvv: "",
      holderName: payment.holderName,
      isDefault: payment.isDefault,
    });
    setEditingPayment(payment.id);
    setShowPaymentForm(true);
  };

  const handleDeleteAddress = (addressId: string) => {
    // Replace window.confirm with a custom modal UI for confirmation
    // if (window.confirm("Are you sure you want to delete this address?")) {
    setAddresses(addresses.filter((addr) => addr.id !== addressId));
    toast.success("Address deleted successfully!");
    // }
  };

  const handleDeletePayment = (paymentId: string) => {
    // Replace window.confirm with a custom modal UI for confirmation
    // if (window.confirm("Are you sure you want to delete this payment method?")) {
    setPaymentMethods(
      paymentMethods.filter((payment) => payment.id !== paymentId)
    );
    toast.success("Payment method deleted successfully!");
    // }
  };

  const setDefaultAddress = (addressId: string) => {
    setAddresses(
      addresses.map((addr) => ({
        ...addr,
        isDefault: addr.id === addressId,
      }))
    );
    toast.success("Default address updated!");
  };

  const setDefaultPayment = (paymentId: string) => {
    setPaymentMethods(
      paymentMethods.map((payment) => ({
        ...payment,
        isDefault: payment.id === paymentId,
      }))
    );
    toast.success("Default payment method updated!");
  };

  return (
    <div className='space-y-6'>
      {/* Delivery Addresses */}
      <Card>
        <CardHeader className='flex flex-row justify-between items-center'>
          <CardTitle className='flex items-center gap-2'>
            <MapPin className='w-5 h-5' />
            Delivery Addresses
          </CardTitle>
          <Button
            onClick={() => setShowAddressForm(true)}
            className='bg-[#3bb85e] hover:bg-[#457753]'
          >
            <Plus className='mr-2 w-4 h-4' />
            Add Address
          </Button>
        </CardHeader>
        <CardContent>
          {/* Address Form */}
          {showAddressForm && (
            <Card className='mb-6 border-[#3bb85e] border-2'>
              <CardHeader>
                <CardTitle className='text-lg'>
                  {editingAddress ? "Edit Address" : "Add New Address"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddressSubmit} className='space-y-4'>
                  <div className='gap-4 grid grid-cols-1 md:grid-cols-2'>
                    <div className='space-y-2'>
                      <Label htmlFor='addressType'>Address Type</Label>
                      <Select
                        value={addressForm.type}
                        onValueChange={(value) =>
                          setAddressForm({
                            ...addressForm,
                            type: value as "campus" | "home",
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='campus'>Campus Address</SelectItem>
                          <SelectItem value='home'>Home Address</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='title'>Address Title</Label>
                      <Input
                        id='title'
                        value={addressForm.title}
                        onChange={(e) =>
                          setAddressForm({
                            ...addressForm,
                            title: e.target.value,
                          })
                        }
                        placeholder='e.g., Campus Hostel, Home'
                        required
                      />
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='fullName'>Full Name</Label>
                      <Input
                        id='fullName'
                        value={addressForm.fullName}
                        onChange={(e) =>
                          setAddressForm({
                            ...addressForm,
                            fullName: e.target.value,
                          })
                        }
                        placeholder="Recipient's full name"
                        required
                      />
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='phone'>Phone Number</Label>
                      <Input
                        id='phone'
                        value={addressForm.phone}
                        onChange={(e) =>
                          setAddressForm({
                            ...addressForm,
                            phone: e.target.value,
                          })
                        }
                        placeholder='+234 801 234 5678'
                        required
                      />
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='address'>Address</Label>
                    <Input
                      id='address'
                      value={addressForm.address}
                      onChange={(e) =>
                        setAddressForm({
                          ...addressForm,
                          address: e.target.value,
                        })
                      }
                      placeholder='Street address, room number, etc.'
                      required
                    />
                  </div>

                  {addressForm.type === "campus" ? (
                    <div className='space-y-2'>
                      <Label htmlFor='campus'>Campus</Label>
                      <Select
                        value={addressForm.campus}
                        onValueChange={(value) =>
                          setAddressForm({ ...addressForm, campus: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='Select your campus' />
                        </SelectTrigger>
                        <SelectContent>
                          {campuses.map((campus) => (
                            <SelectItem key={campus} value={campus}>
                              {campus}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className='gap-4 grid grid-cols-1 md:grid-cols-2'>
                      <div className='space-y-2'>
                        <Label htmlFor='city'>City</Label>
                        <Input
                          id='city'
                          value={addressForm.city}
                          onChange={(e) =>
                            setAddressForm({
                              ...addressForm,
                              city: e.target.value,
                            })
                          }
                          placeholder='City'
                          required
                        />
                      </div>

                      <div className='space-y-2'>
                        <Label htmlFor='state'>State</Label>
                        <Select
                          value={addressForm.state}
                          onValueChange={(value) =>
                            setAddressForm({ ...addressForm, state: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder='Select state' />
                          </SelectTrigger>
                          <SelectContent>
                            {nigerianStates.map((state) => (
                              <SelectItem key={state} value={state}>
                                {state}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  <div className='space-y-2'>
                    <Label htmlFor='landmark'>Landmark (Optional)</Label>
                    <Input
                      id='landmark'
                      value={addressForm.landmark}
                      onChange={(e) =>
                        setAddressForm({
                          ...addressForm,
                          landmark: e.target.value,
                        })
                      }
                      placeholder='Nearby landmark for easy identification'
                    />
                  </div>

                  <div className='flex items-center space-x-2'>
                    <input
                      type='checkbox'
                      id='defaultAddress'
                      checked={addressForm.isDefault}
                      onChange={(e) =>
                        setAddressForm({
                          ...addressForm,
                          isDefault: e.target.checked,
                        })
                      }
                      className='border-gray-300 rounded focus:ring-[#3bb85e] text-[#3bb85e]'
                    />
                    <Label htmlFor='defaultAddress'>
                      Set as default address
                    </Label>
                  </div>

                  <div className='flex gap-3'>
                    <Button
                      type='submit'
                      className='bg-[#3bb85e] hover:bg-[#457753]'
                    >
                      <Save className='mr-2 w-4 h-4' />
                      {editingAddress ? "Update Address" : "Save Address"}
                    </Button>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={resetAddressForm}
                    >
                      <X className='mr-2 w-4 h-4' />
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Address List */}
          {addresses.length === 0 ? (
            <div className='py-8 text-center'>
              <MapPin className='mx-auto mb-4 w-12 h-12 text-gray-400' />
              <h3 className='mb-2 font-medium text-gray-900 text-lg'>
                No addresses saved
              </h3>
              <p className='text-gray-600'>
                Add your first delivery address to get started.
              </p>
            </div>
          ) : (
            <div className='space-y-4'>
              {addresses.map((address) => (
                <Card key={address.id} className='border border-gray-200'>
                  <CardContent className='p-4'>
                    <div className='flex justify-between items-start'>
                      <div className='flex items-start gap-3'>
                        <div className='bg-gray-100 p-2 rounded-full'>
                          {address.type === "campus" ? (
                            <Building className='w-5 h-5 text-gray-600' />
                          ) : (
                            <Home className='w-5 h-5 text-gray-600' />
                          )}
                        </div>
                        <div className='flex-1'>
                          <div className='flex items-center gap-2 mb-1'>
                            <h3 className='font-semibold text-gray-900'>
                              {address.title}
                            </h3>
                            {address.isDefault && (
                              <Badge className='bg-[#3bb85e] text-white text-xs'>
                                Default
                              </Badge>
                            )}
                          </div>
                          <p className='mb-1 text-gray-700 text-sm'>
                            {address.fullName}
                          </p>
                          <p className='mb-1 text-gray-600 text-sm'>
                            {address.phone}
                          </p>
                          <p className='mb-1 text-gray-600 text-sm'>
                            {address.address}
                          </p>
                          <p className='mb-1 text-gray-600 text-sm'>
                            {address.type === "campus"
                              ? address.campus
                              : `${(address as HomeAddress).city}, ${(address as HomeAddress).state}`}
                          </p>
                          {address.landmark && (
                            <p className='text-gray-500 text-sm'>
                              Landmark: {address.landmark}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className='flex gap-2'>
                        {!address.isDefault && (
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => setDefaultAddress(address.id)}
                          >
                            Set Default
                          </Button>
                        )}
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => handleEditAddress(address)}
                        >
                          <Edit className='w-4 h-4' />
                        </Button>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => handleDeleteAddress(address.id)}
                          className='text-red-600 hover:text-red-700'
                        >
                          <Trash2 className='w-4 h-4' />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader className='flex flex-row justify-between items-center'>
          <CardTitle className='flex items-center gap-2'>
            <CreditCard className='w-5 h-5' />
            Payment Methods
          </CardTitle>
          <Button
            onClick={() => setShowPaymentForm(true)}
            className='bg-[#3bb85e] hover:bg-[#457753]'
          >
            <Plus className='mr-2 w-4 h-4' />
            Add Card
          </Button>
        </CardHeader>
        <CardContent>
          {/* Payment Form */}
          {showPaymentForm && (
            <Card className='mb-6 border-[#3bb85e] border-2'>
              <CardHeader>
                <CardTitle className='text-lg'>
                  {editingPayment ? "Edit Payment Method" : "Add New Card"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePaymentSubmit} className='space-y-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='holderName'>Cardholder Name</Label>
                    <Input
                      id='holderName'
                      value={paymentForm.holderName}
                      onChange={(e) =>
                        setPaymentForm({
                          ...paymentForm,
                          holderName: e.target.value,
                        })
                      }
                      placeholder='Name on card'
                      required
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='cardNumber'>Card Number</Label>
                    <Input
                      id='cardNumber'
                      value={paymentForm.cardNumber}
                      onChange={(e) =>
                        setPaymentForm({
                          ...paymentForm,
                          cardNumber: e.target.value,
                        })
                      }
                      placeholder='1234 5678 9012 3456'
                      maxLength={19}
                      required
                    />
                  </div>

                  <div className='gap-4 grid grid-cols-1 md:grid-cols-3'>
                    <div className='space-y-2'>
                      <Label htmlFor='expiryDate'>Expiry Date</Label>
                      <Input
                        id='expiryDate'
                        value={paymentForm.expiryDate}
                        onChange={(e) =>
                          setPaymentForm({
                            ...paymentForm,
                            expiryDate: e.target.value,
                          })
                        }
                        placeholder='MM/YY'
                        maxLength={5}
                        required
                      />
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='cvv'>CVV</Label>
                      <Input
                        id='cvv'
                        value={paymentForm.cvv}
                        onChange={(e) =>
                          setPaymentForm({
                            ...paymentForm,
                            cvv: e.target.value,
                          })
                        }
                        placeholder='123'
                        maxLength={4}
                        required
                      />
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='cardType'>Card Type</Label>
                      <Select
                        value={paymentForm.cardType}
                        onValueChange={(value) =>
                          setPaymentForm({ ...paymentForm, cardType: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='Select type' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='Visa'>Visa</SelectItem>
                          <SelectItem value='Mastercard'>Mastercard</SelectItem>
                          <SelectItem value='Verve'>Verve</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className='flex items-center space-x-2'>
                    <input
                      type='checkbox'
                      id='defaultPayment'
                      checked={paymentForm.isDefault}
                      onChange={(e) =>
                        setPaymentForm({
                          ...paymentForm,
                          isDefault: e.target.checked,
                        })
                      }
                      className='border-gray-300 rounded focus:ring-[#3bb85e] text-[#3bb85e]'
                    />
                    <Label htmlFor='defaultPayment'>
                      Set as default payment method
                    </Label>
                  </div>

                  <div className='flex gap-3'>
                    <Button
                      type='submit'
                      className='bg-[#3bb85e] hover:bg-[#457753]'
                    >
                      <Save className='mr-2 w-4 h-4' />
                      {editingPayment ? "Update Card" : "Save Card"}
                    </Button>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={resetPaymentForm}
                    >
                      <X className='mr-2 w-4 h-4' />
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Payment Methods List */}
          {paymentMethods.length === 0 ? (
            <div className='py-8 text-center'>
              <CreditCard className='mx-auto mb-4 w-12 h-12 text-gray-400' />
              <h3 className='mb-2 font-medium text-gray-900 text-lg'>
                No payment methods saved
              </h3>
              <p className='text-gray-600'>
                Add your first payment method for faster checkout.
              </p>
            </div>
          ) : (
            <div className='space-y-4'>
              {paymentMethods.map((payment) => (
                <Card key={payment.id} className='border border-gray-200'>
                  <CardContent className='p-4'>
                    <div className='flex justify-between items-center'>
                      <div className='flex items-center gap-3'>
                        <div className='bg-gray-100 p-2 rounded-full'>
                          <CreditCard className='w-5 h-5 text-gray-600' />
                        </div>
                        <div>
                          <div className='flex items-center gap-2 mb-1'>
                            <h3 className='font-semibold text-gray-900'>
                              {payment.cardType} {payment.cardNumber}
                            </h3>
                            {payment.isDefault && (
                              <Badge className='bg-[#3bb85e] text-white text-xs'>
                                Default
                              </Badge>
                            )}
                          </div>
                          <p className='text-gray-600 text-sm'>
                            {payment.holderName}
                          </p>
                          <p className='text-gray-500 text-sm'>
                            Expires {payment.expiryDate}
                          </p>
                        </div>
                      </div>
                      <div className='flex gap-2'>
                        {!payment.isDefault && (
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => setDefaultPayment(payment.id)}
                          >
                            Set Default
                          </Button>
                        )}
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => handleEditPayment(payment)}
                        >
                          <Edit className='w-4 h-4' />
                        </Button>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => handleDeletePayment(payment.id)}
                          className='text-red-600 hover:text-red-700'
                        >
                          <Trash2 className='w-4 h-4' />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentAddressSection;
