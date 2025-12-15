export interface Order {
  _id: string;
  orderNumber: string;
  date: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  total: number;
  items: OrderItem[];
  shippingAddress: Address;
}

export interface OrderItem {
  _id: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  variant?: string;
}

export interface Review {
  _id: string;
  productId: string;
  productName: string;
  productImage: string;
  rating: number;
  comment: string;
  date: string;
  helpful: number;
}

export interface Store {
  _id: string;
  name: string;
  logo: string;
  description: string;
  rating: number;
  followers: number;
  isFollowing: boolean;
}

export interface Address {
  _id: string;
  type: "home" | "work" | "other";
  firstname: string;
  lastname: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

export interface PaymentMethod {
  _id: string;
  type: "card" | "paypal" | "bank";
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  email?: string;
  bankName?: string;
  accountNumber?: string;
  isDefault: boolean;
}

export interface BrowsingHistoryItem {
  _id: string;
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  viewedAt: string;
}

export interface VendorApplication {
  businessName: string;
  businessType: string;
  businessRegistrationNumber: string;
  taxId: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  bankDetails: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    routingNumber: string;
  };
  documents: {
    businessLicense: File | null;
    taxCertificate: File | null;
    identityDocument: File | null;
  };
}

export interface Vendor {
  _id: string;
  userId: string;
  businessName: string;
  status: "pending" | "approved" | "rejected";
  stores: Store[];
  createdAt: string;
}
