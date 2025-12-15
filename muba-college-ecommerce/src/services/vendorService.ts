import api from "./api";

export interface VendorApplicationData {
  firstname: string;
  email: string;
  address: string;
  matric_number?: string;
  department: string;
  faculty: string;
  valid_id: File;
  picture: File;
  cac?: File;
}

export interface VendorApplication {
  _id: string;
  userId: string;
  firstname: string;
  email: string;
  address: string;
  matric_number?: string;
  department: string;
  faculty: string;
  valid_id: string;
  picture: string;
  cac?: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export interface Vendor {
  _id: string;
  user: {
    _id: string;
    firstname: string;
    lastname: string;
    email: string;
  };
  firstname: string;
  email: string;
  address: string;
  matric_number?: string;
  department: string;
  faculty: string;
  status: "pending" | "approved" | "rejected";
  documents: {
    valid_id: string;
    picture: string;
    cac?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export const vendorService = {
  // Only change this one function in your vendorService.ts:

  async submitApplication(data: VendorApplicationData): Promise<{
    success: boolean;
    message: string;
  }> {
    const formData = new FormData();

    // Add text fields
    formData.append("firstname", data.firstname);
    formData.append("email", data.email);
    formData.append("address", data.address);
    formData.append("department", data.department);
    formData.append("faculty", data.faculty);

    if (data.matric_number) {
      formData.append("matric_number", data.matric_number);
    }

    // Add files
    formData.append("valid_id", data.valid_id);
    formData.append("picture", data.picture);
    if (data.cac) {
      formData.append("cac", data.cac);
    }

    // Change the endpoint to match your backend route
    const response = await api.post("/api/v1/vendors", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 60000, // 60 seconds for file uploads
    });

    return response.data;
  },

  async getApplicationStatus(): Promise<VendorApplication | null> {
    try {
      const response = await api.get("/api/v1/vendors");
      return response.data.application;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null; // No application found
      }
      throw error;
    }
  },

  async getVendorProfile(): Promise<any> {
    const response = await api.get("/api/v1/vendor/profile");
    return response.data;
  },

  async updateVendorProfile(data: any): Promise<any> {
    const response = await api.put("/api/v1/vendor/profile", data);
    return response.data;
  },

  async getAllVendors() {
    const response = await api.get("/api/v1/vendors");
    return response.data;
  },

  async getVendorById(id: string) {
    const response = await api.get(`/api/v1/vendors/${id}`);
    return response.data;
  },

  async updateVendorStatus(id: string, status: "approved" | "rejected") {
    const response = await api.patch(`/api/v1/vendors/${id}`, { status });
    return response.data;
  },

  async getMyVendorApplication() {
    const response = await api.get("/api/v1/vendors/my-application");
    return response.data;
  },
};
