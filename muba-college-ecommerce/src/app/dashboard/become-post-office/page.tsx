"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Building2, Upload } from "lucide-react";
import toast from "react-hot-toast";

interface PostOfficeForm {
  postOfficeName: string;
  // email is taken from user account usually, or we can ask for contact email
  contactEmail: string;
}

export default function BecomePostOfficePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PostOfficeForm>();

  const mutation = useMutation({
    mutationFn: async (data: PostOfficeForm) => {
      // We match the backend expectation: postOfficeName.
      // Docs are optional for now as per backend implementation.
      const response = await api.post("/api/v1/post-office/register", {
        postOfficeName: data.postOfficeName,
        // documents: [] // handled separately if needed
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Application submitted successfully!");
      router.push("/dashboard"); // Redirect to dashboard
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to submit application"
      );
    },
  });

  const onSubmit = (data: PostOfficeForm) => {
    setIsSubmitting(true);
    mutation.mutate(data, {
      onSettled: () => setIsSubmitting(false),
    });
  };

  return (
    <div className='py-10 max-w-2xl container'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-2xl'>
            <Building2 className='w-6 h-6 text-blue-600' />
            Register as Campus Post Office
          </CardTitle>
          <CardDescription>
            become a trusted point for secure package handoffs and deliveries.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
            <div className='space-y-2'>
              <Label htmlFor='postOfficeName'>Post Office / Station Name</Label>
              <Input
                id='postOfficeName'
                placeholder='e.g. Main Library Hub'
                {...register("postOfficeName", {
                  required: "Station Name is required",
                })}
              />
              {errors.postOfficeName && (
                <p className='text-red-500 text-sm'>
                  {errors.postOfficeName.message}
                </p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='contactEmail'>Contact Email</Label>
              <Input
                id='contactEmail'
                type='email'
                placeholder='e.g. logistics@campus.edu'
                {...register("contactEmail", {
                  required: "Contact Email is required",
                })}
              />
              {errors.contactEmail && (
                <p className='text-red-500 text-sm'>
                  {errors.contactEmail.message}
                </p>
              )}
            </div>

            <div className='bg-blue-50 p-4 border border-blue-100 rounded-lg text-blue-700 text-sm'>
              <p>
                By registering, you agree to act as a trusted entity for
                verifying package custody. All handoffs and deliveries will be
                recorded on the Cardano Blockchain.
              </p>
            </div>

            <Button type='submit' className='w-full' disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className='mr-2 w-4 h-4 animate-spin' />
                  Submitting Application...
                </>
              ) : (
                "Submit Application"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
