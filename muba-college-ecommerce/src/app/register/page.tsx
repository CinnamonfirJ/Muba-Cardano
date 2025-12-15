"use client";

import type React from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Eye, EyeOff, User, Mail, Phone, Hash } from "lucide-react";
import toast from "react-hot-toast";

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    firstname: "",
    middlename: "",
    lastname: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    matric_number: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validation
    if (
      !formData.firstname.trim() ||
      !formData.lastname.trim() ||
      !formData.email.trim() ||
      !formData.password ||
      !formData.phone.trim()
    ) {
      toast.error("Please fill in all required fields");
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      setIsLoading(false);
      return;
    }

    try {
      // Prepare data for API
      const registrationData = {
        firstname: formData.firstname.trim(),
        lastname: formData.lastname.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim(),
        ...(formData.middlename.trim() && {
          middlename: formData.middlename.trim(),
        }),
        ...(formData.matric_number.trim() && {
          matric_number: formData.matric_number.trim(),
        }),
      };

      await register(registrationData);
      toast.success("Registration successful! Please login to continue.");
      router.push("/login");
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error(
        error.response?.data?.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='flex justify-center items-center bg-linear-to-br from-[#e0f5e7] to-[#d2fade] px-4 py-8 min-h-screen'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <div className='flex justify-center mb-4'>
            <div className='bg-[#3bb85e] px-4 py-2 rounded font-bold text-white text-2xl'>
              MubaXpress
            </div>
          </div>
          <CardTitle className='font-bold text-2xl'>Create Account</CardTitle>
          <p className='text-gray-600'>Join the MubaXpress community</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-4'>
            {/* First Name */}
            <div className='space-y-2'>
              <Label htmlFor='firstname'>First Name *</Label>
              <div className='relative'>
                <User className='top-3 left-3 absolute w-4 h-4 text-gray-400' />
                <Input
                  id='firstname'
                  name='firstname'
                  type='text'
                  placeholder='Enter your first name'
                  value={formData.firstname}
                  onChange={handleChange}
                  className='pl-10'
                  required
                />
              </div>
            </div>

            {/* Middle Name */}
            <div className='space-y-2'>
              <Label htmlFor='middlename'>Middle Name (Optional)</Label>
              <div className='relative'>
                <User className='top-3 left-3 absolute w-4 h-4 text-gray-400' />
                <Input
                  id='middlename'
                  name='middlename'
                  type='text'
                  placeholder='Enter your middle name'
                  value={formData.middlename}
                  onChange={handleChange}
                  className='pl-10'
                />
              </div>
            </div>

            {/* Last Name */}
            <div className='space-y-2'>
              <Label htmlFor='lastname'>Last Name *</Label>
              <div className='relative'>
                <User className='top-3 left-3 absolute w-4 h-4 text-gray-400' />
                <Input
                  id='lastname'
                  name='lastname'
                  type='text'
                  placeholder='Enter your last name'
                  value={formData.lastname}
                  onChange={handleChange}
                  className='pl-10'
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className='space-y-2'>
              <Label htmlFor='email'>Email *</Label>
              <div className='relative'>
                <Mail className='top-3 left-3 absolute w-4 h-4 text-gray-400' />
                <Input
                  id='email'
                  name='email'
                  type='email'
                  placeholder='Enter your email'
                  value={formData.email}
                  onChange={handleChange}
                  className='pl-10'
                  required
                />
              </div>
            </div>

            {/* Phone */}
            <div className='space-y-2'>
              <Label htmlFor='phone'>Phone Number *</Label>
              <div className='relative'>
                <Phone className='top-3 left-3 absolute w-4 h-4 text-gray-400' />
                <Input
                  id='phone'
                  name='phone'
                  type='tel'
                  placeholder='Enter your phone number'
                  value={formData.phone}
                  onChange={handleChange}
                  className='pl-10'
                  required
                />
              </div>
            </div>

            {/* Matric Number */}
            <div className='space-y-2'>
              <Label htmlFor='matric_number'>Matric Number (Optional)</Label>
              <div className='relative'>
                <Hash className='top-3 left-3 absolute w-4 h-4 text-gray-400' />
                <Input
                  id='matric_number'
                  name='matric_number'
                  type='text'
                  placeholder='Enter your matric number'
                  value={formData.matric_number}
                  onChange={handleChange}
                  className='pl-10'
                />
              </div>
            </div>

            {/* Password */}
            <div className='space-y-2'>
              <Label htmlFor='password'>Password *</Label>
              <div className='relative'>
                <Input
                  id='password'
                  name='password'
                  type={showPassword ? "text" : "password"}
                  placeholder='Create a password'
                  value={formData.password}
                  onChange={handleChange}
                  className='pr-10'
                  required
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='top-3 right-3 absolute text-gray-400 hover:text-gray-600'
                >
                  {showPassword ? (
                    <EyeOff className='w-4 h-4' />
                  ) : (
                    <Eye className='w-4 h-4' />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className='space-y-2'>
              <Label htmlFor='confirmPassword'>Confirm Password *</Label>
              <div className='relative'>
                <Input
                  id='confirmPassword'
                  name='confirmPassword'
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder='Confirm your password'
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className='pr-10'
                  required
                />
                <button
                  type='button'
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className='top-3 right-3 absolute text-gray-400 hover:text-gray-600'
                >
                  {showConfirmPassword ? (
                    <EyeOff className='w-4 h-4' />
                  ) : (
                    <Eye className='w-4 h-4' />
                  )}
                </button>
              </div>
            </div>

            <Button
              type='submit'
              className='bg-[#3bb85e] hover:bg-[#457753] w-full'
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <div className='mt-6 text-center'>
            <p className='text-gray-600 text-sm'>
              Already have an account?{" "}
              <Link
                href='/login'
                className='font-medium text-[#3bb85e] hover:underline'
              >
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterPage;
