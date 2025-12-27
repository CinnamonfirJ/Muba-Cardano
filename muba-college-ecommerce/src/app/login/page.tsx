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
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import toast from "react-hot-toast";

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
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

    try {
      await login(formData.email, formData.password);
      toast.success("Login successful!");
      router.push("/marketplace");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='flex justify-center items-center bg-gradient-to-br from-[#e0f5e7] to-[#d2fade] p-4 sm:p-6 min-h-screen'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <div className='flex justify-center mb-4'>
            <div className='bg-[#3bb85e] px-4 py-2 rounded font-bold text-white text-2xl'>
              MubaXpress
            </div>
          </div>
          <CardTitle className='font-bold text-2xl'>Welcome Back</CardTitle>
          <p className='text-gray-600'>Sign in to your MubaXpress account</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
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

            <div className='space-y-2'>
              <Label htmlFor='password'>Password</Label>
              <div className='relative'>
                <Lock className='top-3 left-3 absolute w-4 h-4 text-gray-400' />
                <Input
                  id='password'
                  name='password'
                  type={showPassword ? "text" : "password"}
                  placeholder='Enter your password'
                  value={formData.password}
                  onChange={handleChange}
                  className='pr-10 pl-10'
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

            <div className='flex justify-between items-center'>
              <div className='flex items-center space-x-2'>
                <input
                  id='remember'
                  type='checkbox'
                  className='border-gray-300 rounded focus:ring-[#3bb85e] w-4 h-4 text-[#3bb85e]'
                />
                <Label htmlFor='remember' className='text-gray-600 text-sm'>
                  Remember me
                </Label>
              </div>
              <Link
                href='/forgot-password'
                className='text-[#3bb85e] text-sm hover:underline'
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type='submit'
              className='bg-[#3bb85e] hover:bg-[#457753] w-full'
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className='mt-6 text-center'>
            <p className='text-gray-600 text-sm'>
              Don't have an account?{" "}
              <Link
                href='/register'
                className='font-medium text-[#3bb85e] hover:underline'
              >
                Sign up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
