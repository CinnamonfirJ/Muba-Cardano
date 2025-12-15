"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";
import Link from "next/link";
import type { SignInPayload } from "@/types/auth";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSubmit: (data: SignInPayload) => void;
  isLoading?: boolean;
  error?: string | null;
}

export function LoginForm({
  onSubmit,
  isLoading = false,
  error,
}: LoginFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  return (
    <div className='bg-white dark:bg-black shadow-lg mx-auto px-6 py-4 rounded-2xl w-full max-w-md'>
      <div className='mb-6 text-center'>
        <h2 className='font-semibold text-gray-800 dark:text-white text-2xl'>
          Welcome!
        </h2>
        <p className='text-gray-500 dark:text-gray-400 text-sm'>
          Log in to continue to{" "}
          <span className='font-medium text-[#3bb85e]'>MubaXpress</span>
        </p>
      </div>

      <div className='space-y-3'>
        <Button variant='outline' className='flex gap-2 bg-transparent w-full'>
          <FcGoogle className='text-xl' />
          Log in with Google
        </Button>
        <Button variant='outline' className='flex gap-2 bg-transparent w-full'>
          <FaApple className='text-xl' />
          Log in with Apple
        </Button>
      </div>

      <div className='relative my-6 text-center'>
        <div className='absolute inset-0 flex items-center'>
          <div className='border-gray-300 dark:border-gray-700 border-t w-full'></div>
        </div>
        <span className='relative bg-white dark:bg-black px-2 text-muted-foreground text-sm'>
          OR
        </span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
        <div className='space-y-1'>
          <Label htmlFor='email'>Email</Label>
          <Input id='email' type='email' {...register("email")} />
          {errors.email && (
            <p className='text-red-500 text-sm'>{errors.email.message}</p>
          )}
        </div>
        <div className='space-y-1'>
          <div className='flex justify-between'>
            <Label htmlFor='password'>Password</Label>
            <Link
              href='/forgot-password'
              className='text-[#3bb85e] text-sm hover:underline'
            >
              Forgot password?
            </Link>
          </div>
          <Input id='password' type='password' {...register("password")} />
          {errors.password && (
            <p className='text-red-500 text-sm'>{errors.password.message}</p>
          )}
        </div>
        {error && <p className='text-red-500 text-sm'>{error}</p>}
        <Button
          type='submit'
          disabled={isLoading}
          className='bg-[#3bb85e] hover:bg-[#34a852] w-full'
        >
          {isLoading ? "Logging in..." : "Log in"}
        </Button>
      </form>
    </div>
  );
}
