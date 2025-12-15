"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";
import type { SignUpPayload } from "@/types/auth";

const signupSchema = z
  .object({
    firstname: z.string().min(1, "First name is required"),
    lastname: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignupFormValues = z.infer<typeof signupSchema>;

interface SignUpFormProps {
  onSubmit: (data: SignUpPayload) => void;
  isLoading?: boolean;
  error?: string | null;
}

export function SignUpForm({
  onSubmit,
  isLoading = false,
  error,
}: SignUpFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  const handleFormSubmit = (data: SignupFormValues) => {
    // Transform the form data to match the API payload
    const payload: SignUpPayload = {
      firstname: data.firstname,
      lastname: data.lastname,
      email: data.email,
      password: data.password,
    };
    onSubmit(payload);
  };

  return (
    <div className='bg-white dark:bg-black shadow-lg mx-auto px-6 py-4 rounded-2xl w-full max-w-md'>
      <div className='mb-6 text-center'>
        <h2 className='font-semibold text-gray-800 dark:text-white text-2xl'>
          Join MubaXpress
        </h2>
        <p className='text-gray-500 dark:text-gray-400 text-sm'>
          Create your account to get started.
        </p>
      </div>

      <div className='space-y-3'>
        <Button variant='outline' className='flex gap-2 bg-transparent w-full'>
          <FcGoogle className='text-xl' />
          Sign up with Google
        </Button>
        <Button variant='outline' className='flex gap-2 bg-transparent w-full'>
          <FaApple className='text-xl' />
          Sign up with Apple
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

      <form onSubmit={handleSubmit(handleFormSubmit)} className='space-y-4'>
        <div className='space-y-1'>
          <Label htmlFor='firstname'>First Name</Label>
          <Input id='firstname' {...register("firstname")} />
          {errors.firstname && (
            <p className='text-red-500 text-sm'>{errors.firstname.message}</p>
          )}
        </div>
        <div className='space-y-1'>
          <Label htmlFor='lastname'>Last Name</Label>
          <Input id='lastname' {...register("lastname")} />
          {errors.lastname && (
            <p className='text-red-500 text-sm'>{errors.lastname.message}</p>
          )}
        </div>
        <div className='space-y-1'>
          <Label htmlFor='email'>Email</Label>
          <Input id='email' type='email' {...register("email")} />
          {errors.email && (
            <p className='text-red-500 text-sm'>{errors.email.message}</p>
          )}
        </div>
        <div className='space-y-1'>
          <Label htmlFor='password'>Password</Label>
          <Input id='password' type='password' {...register("password")} />
          {errors.password && (
            <p className='text-red-500 text-sm'>{errors.password.message}</p>
          )}
        </div>
        <div className='space-y-1'>
          <Label htmlFor='confirmPassword'>Confirm Password</Label>
          <Input
            id='confirmPassword'
            type='password'
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className='text-red-500 text-sm'>
              {errors.confirmPassword.message}
            </p>
          )}
        </div>
        {error && <p className='text-red-500 text-sm'>{error}</p>}
        <Button
          type='submit'
          disabled={isLoading}
          className='bg-[#3bb85e] hover:bg-[#34a852] w-full'
        >
          {isLoading ? "Creating account..." : "Sign up"}
        </Button>
      </form>
    </div>
  );
}
