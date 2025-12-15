"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Badge } from "../ui/badge";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import {
  FileText,
  User,
  GraduationCap,
  Building,
  Camera,
  Shield,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Textarea } from "../ui/textarea";
import {
  vendorService,
  // type VendorApplication,
  type VendorApplicationData,
} from "../../services/vendorService";

// Nigerian Universities Faculties and Departments
const facultiesAndDepartments = {
  Engineering: [
    "Civil Engineering",
    "Mechanical Engineering",
    "Electrical Engineering",
    "Chemical Engineering",
    "Computer Engineering",
    "Petroleum Engineering",
    "Agricultural Engineering",
    "Marine Engineering",
  ],
  Medicine: [
    "Medicine and Surgery",
    "Nursing",
    "Pharmacy",
    "Physiotherapy",
    "Medical Laboratory Science",
    "Radiography",
    "Dentistry",
  ],
  Sciences: [
    "Computer Science",
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "Biochemistry",
    "Microbiology",
    "Statistics",
  ],
  Arts: [
    "English Language",
    "History",
    "Philosophy",
    "Linguistics",
    "Fine Arts",
    "Music",
    "Theatre Arts",
  ],
  "Social Sciences": [
    "Economics",
    "Political Science",
    "Sociology",
    "Psychology",
    "Geography",
    "Mass Communication",
    "International Relations",
  ],
  Law: ["Law"],
  Education: [
    "Educational Administration",
    "Curriculum Studies",
    "Educational Psychology",
    "Adult Education",
    "Special Education",
  ],
  "Management Sciences": [
    "Business Administration",
    "Accounting",
    "Banking and Finance",
    "Marketing",
    "Insurance",
    "Industrial Relations",
  ],
  Agriculture: [
    "Crop Production",
    "Animal Science",
    "Soil Science",
    "Agricultural Economics",
    "Food Science and Technology",
    "Forestry",
  ],
};

const BecomeVendorSection = () => {
  const { user, refreshUser } = useAuth(); // Add refreshUser from context
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  // const [applicationStatus, setApplicationStatus] =
  //   useState<VendorApplication | null>(null);

  const [formData, setFormData] = useState({
    firstname: user?.firstname || "",
    email: user?.email || "",
    address: "",
    matric_number: user?.matric_number || "",
    department: "",
    faculty: "",
  });

  const [files, setFiles] = useState({
    valid_id: null as File | null,
    picture: null as File | null,
    cac: null as File | null,
  });

  // Set loading to false since we're using user status directly
  useEffect(() => {
    setIsLoading(false);
  }, [user]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    fileType: keyof typeof files
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }

      // Validate file type (images only)
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }

      setFiles({
        ...files,
        [fileType]: file,
      });
    }
  };

  const handleFacultyChange = (faculty: string) => {
    setSelectedFaculty(faculty);
    setSelectedDepartment("");
    setFormData({
      ...formData,
      faculty,
      department: "",
    });
  };

  const handleDepartmentChange = (department: string) => {
    setSelectedDepartment(department);
    setFormData({
      ...formData,
      department,
    });
  };

  // 3. Update the handleSubmit function (replace the entire function)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (
        !formData.firstname.trim() ||
        !formData.email.trim() ||
        !formData.address.trim() ||
        !formData.faculty ||
        !formData.department
      ) {
        toast.error("Please fill in all required fields");
        return;
      }

      if (!files.valid_id || !files.picture) {
        toast.error("Please upload your valid ID and profile picture");
        return;
      }

      // Validate file sizes
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (files.valid_id.size > maxSize || files.picture.size > maxSize) {
        toast.error("File sizes must be less than 5MB each");
        return;
      }

      if (files.cac && files.cac.size > maxSize) {
        toast.error("CAC file size must be less than 5MB");
        return;
      }

      // Create the correct data structure for API call
      const applicationData: VendorApplicationData = {
        firstname: formData.firstname.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        department: formData.department,
        faculty: formData.faculty,
        valid_id: files.valid_id,
        picture: files.picture,
      };

      // Add optional fields
      if (formData.matric_number.trim()) {
        applicationData.matric_number = formData.matric_number.trim();
      }

      if (files.cac) {
        applicationData.cac = files.cac;
      }

      console.log("Submitting application with files:", {
        firstname: applicationData.firstname,
        email: applicationData.email,
        department: applicationData.department,
        faculty: applicationData.faculty,
        valid_id: files.valid_id.name,
        picture: files.picture.name,
        cac: files.cac?.name || "Not provided",
      });

      // Submit application
      const response = await vendorService.submitApplication(applicationData);

      toast.success(
        response.message ||
          "Vendor application submitted successfully! We'll review it within 24-48 hours."
      );

      // Refresh user data to get updated vendor status
      if (refreshUser) {
        await refreshUser();
      }

      // Reset form
      setFormData({
        firstname: user?.firstname || "",
        email: user?.email || "",
        address: "",
        matric_number: user?.matric_number || "",
        department: "",
        faculty: "",
      });
      setFiles({
        valid_id: null,
        picture: null,
        cac: null,
      });
      setSelectedFaculty("");
      setSelectedDepartment("");

      // Clear file inputs
      const fileInputs = document.querySelectorAll('input[type="file"]');
      fileInputs.forEach((input: any) => {
        input.value = "";
      });
    } catch (error: any) {
      console.error("Vendor application error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to submit application. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const FileUploadArea = ({
    fileType,
    label,
    icon: Icon,
    required = false,
  }: {
    fileType: keyof typeof files;
    label: string;
    icon: any;
    required?: boolean;
  }) => (
    <div className='space-y-2'>
      <Label className='font-medium text-sm'>
        {label} {required && <span className='text-red-500'>*</span>}
      </Label>
      <div className='p-6 border-2 border-gray-300 hover:border-[#3bb85e] border-dashed rounded-lg text-center transition-colors'>
        <input
          type='file'
          accept='image/*'
          onChange={(e) => handleFileChange(e, fileType)}
          className='hidden'
          id={fileType}
        />
        <label htmlFor={fileType} className='cursor-pointer'>
          <Icon className='mx-auto mb-2 w-12 h-12 text-gray-400' />
          <p className='mb-1 text-gray-600 text-sm'>
            {files[fileType]
              ? files[fileType]!.name
              : "Click to upload or drag and drop"}
          </p>
          <p className='text-gray-500 text-xs'>PNG, JPG, JPEG up to 5MB</p>
        </label>
      </div>
      {files[fileType] && (
        <div className='flex items-center gap-2 text-green-600 text-sm'>
          <CheckCircle className='w-4 h-4' />
          File uploaded successfully
        </div>
      )}
    </div>
  );

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardContent className='p-8 text-center'>
          <div className='mx-auto mb-4 border-4 border-gray-200 border-t-[#3bb85e] rounded-full w-8 h-8 animate-spin'></div>
          <p className='text-gray-600'>Loading application status...</p>
        </CardContent>
      </Card>
    );
  }

  // Show different content based on user's vendor status
  if (user?.vendorStatus === "pending") {
    return (
      <Card>
        <CardContent className='p-8 text-center'>
          <Clock className='mx-auto mb-4 w-16 h-16 text-yellow-500' />
          <h3 className='mb-2 font-semibold text-gray-900 text-xl'>
            Application Under Review
          </h3>
          <p className='mb-4 text-gray-600'>
            Your vendor application is currently being reviewed by our team.
            We'll notify you within 24-48 hours.
          </p>
          <Badge className='bg-yellow-100 text-yellow-800'>
            <Clock className='mr-1 w-3 h-3' />
            Pending Review
          </Badge>
        </CardContent>
      </Card>
    );
  }

  if (user?.vendorStatus === "accepted") {
    return (
      <Card>
        <CardContent className='p-8 text-center'>
          <CheckCircle className='mx-auto mb-4 w-16 h-16 text-green-500' />
          <h3 className='mb-2 font-semibold text-gray-900 text-xl'>
            Application Approved!
          </h3>
          <p className='mb-6 text-gray-600'>
            Congratulations! Your vendor application has been approved. You can
            now start selling on MubaXpress.
          </p>
          <Badge className='bg-green-100 mb-4 text-green-800'>
            <CheckCircle className='mr-1 w-3 h-3' />
            Approved Vendor
          </Badge>

          {/* Show user's application details */}
          <div className='bg-gray-50 mb-6 p-4 rounded-lg text-left'>
            <h4 className='mb-3 font-medium text-gray-900'>
              Your Vendor Details:
            </h4>
            <div className='space-y-2 text-sm'>
              <p>
                <span className='font-medium'>Name:</span> {user.firstname}{" "}
                {user.lastname}
              </p>
              <p>
                <span className='font-medium'>Email:</span> {user.email}
              </p>
              {user.matric_number && (
                <p>
                  <span className='font-medium'>Matric Number:</span>{" "}
                  {user.matric_number}
                </p>
              )}
              {/* Add more details if available in user object */}
            </div>
          </div>

          <div className='flex justify-center gap-4'>
            <Button className='bg-[#3bb85e] hover:bg-[#457753]'>
              Create Your Store
            </Button>
            <Button variant='outline'>View Vendor Dashboard</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (user?.vendorStatus === "rejected") {
    return (
      <Card>
        <CardContent className='p-8 text-center'>
          <XCircle className='mx-auto mb-4 w-16 h-16 text-red-500' />
          <h3 className='mb-2 font-semibold text-gray-900 text-xl'>
            Application Rejected
          </h3>
          <p className='mb-4 text-gray-600'>
            Unfortunately, your vendor application was not approved at this
            time.
          </p>

          <div className='bg-red-50 mb-4 p-4 border border-red-200 rounded-lg'>
            <div className='flex items-start gap-2'>
              <AlertCircle className='mt-0.5 w-5 h-5 text-red-600' />
              <div className='text-left'>
                <h4 className='mb-1 font-medium text-red-800'>Next Steps:</h4>
                <ul className='space-y-1 text-red-700 text-sm'>
                  <li>• Review your application information carefully</li>
                  <li>• Ensure all documents are clear and valid</li>
                  <li>• Make sure all required fields are properly filled</li>
                  <li>• Contact support if you need clarification</li>
                </ul>
              </div>
            </div>
          </div>

          <Badge className='bg-red-100 mb-4 text-red-800'>
            <XCircle className='mr-1 w-3 h-3' />
            Application Rejected
          </Badge>
          <p className='mb-6 text-gray-600 text-sm'>
            You can submit a new application after addressing the issues above.
          </p>
          <Button
            onClick={() => {
              // Reset form for reapplication
              setFormData({
                firstname: user?.firstname || "",
                email: user?.email || "",
                address: "",
                matric_number: user?.matric_number || "",
                department: "",
                faculty: "",
              });
              setFiles({
                valid_id: null,
                picture: null,
                cac: null,
              });
              setSelectedFaculty("");
              setSelectedDepartment("");
            }}
            className='bg-[#3bb85e] hover:bg-[#457753]'
          >
            Submit New Application
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Default form for new applications (vendorStatus === "none")
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Shield className='w-5 h-5' />
          Become a Vendor
        </CardTitle>
        <p className='text-gray-600'>
          Join thousands of vendors selling on MubaXpress. Fill out the
          application below to get started.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* Personal Information */}
          <div className='space-y-4'>
            <h3 className='flex items-center gap-2 font-semibold text-gray-900 text-lg'>
              <User className='w-5 h-5' />
              Personal Information
            </h3>

            <div className='gap-4 grid grid-cols-1 md:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='firstname'>First Name *</Label>
                <Input
                  id='firstname'
                  name='firstname'
                  value={formData.firstname}
                  onChange={handleInputChange}
                  placeholder='Enter your first name'
                  required
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='email'>Email Address *</Label>
                <Input
                  id='email'
                  name='email'
                  type='email'
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder='Enter your email'
                  required
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='address'>Address *</Label>
              <Textarea
                id='address'
                name='address'
                value={formData.address}
                onChange={handleInputChange}
                placeholder='Enter your full address'
                rows={3}
                required
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='matric_number'>Matric Number (Optional)</Label>
              <Input
                id='matric_number'
                name='matric_number'
                value={formData.matric_number}
                onChange={handleInputChange}
                placeholder='Enter your matric number'
              />
            </div>
          </div>

          {/* Academic Information */}
          <div className='space-y-4'>
            <h3 className='flex items-center gap-2 font-semibold text-gray-900 text-lg'>
              <GraduationCap className='w-5 h-5' />
              Academic Information
            </h3>

            <div className='gap-4 grid grid-cols-1 md:grid-cols-2'>
              <div className='space-y-2'>
                <Label>Faculty *</Label>
                <Select
                  value={selectedFaculty}
                  onValueChange={handleFacultyChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select your faculty' />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(facultiesAndDepartments).map((faculty) => (
                      <SelectItem key={faculty} value={faculty}>
                        {faculty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label>Department *</Label>
                <Select
                  value={selectedDepartment}
                  onValueChange={handleDepartmentChange}
                  disabled={!selectedFaculty}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select your department' />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedFaculty &&
                      facultiesAndDepartments[
                        selectedFaculty as keyof typeof facultiesAndDepartments
                      ]?.map((department) => (
                        <SelectItem key={department} value={department}>
                          {department}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Document Upload */}
          <div className='space-y-4'>
            <h3 className='flex items-center gap-2 font-semibold text-gray-900 text-lg'>
              <FileText className='w-5 h-5' />
              Required Documents
            </h3>

            <div className='gap-6 grid grid-cols-1 md:grid-cols-2'>
              <FileUploadArea
                fileType='valid_id'
                label='Valid ID (Student ID, National ID, etc.)'
                icon={Shield}
                required
              />

              <FileUploadArea
                fileType='picture'
                label='Profile Picture'
                icon={Camera}
                required
              />
            </div>

            <FileUploadArea
              fileType='cac'
              label='CAC Document (Optional - for business registration)'
              icon={Building}
            />
          </div>

          {/* Terms and Conditions */}
          <div className='bg-gray-50 p-4 rounded-lg'>
            <h4 className='mb-2 font-medium text-gray-900'>
              Terms and Conditions
            </h4>
            <ul className='space-y-1 text-gray-600 text-sm'>
              <li>• You must be a registered student or staff member</li>
              <li>• All products must comply with university guidelines</li>
              <li>• You agree to maintain quality standards</li>
              <li>
                • MubaXpress reserves the right to review and approve all
                vendors
              </li>
              <li>• False information may result in permanent ban</li>
            </ul>
          </div>

          {/* Submit Button */}
          <Button
            type='submit'
            disabled={isSubmitting}
            className='bg-[#3bb85e] hover:bg-[#457753] py-3 w-full'
          >
            {isSubmitting
              ? "Submitting Application..."
              : "Submit Vendor Application"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default BecomeVendorSection;
