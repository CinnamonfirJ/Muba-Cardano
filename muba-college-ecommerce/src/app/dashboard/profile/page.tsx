"use client";

import type React from "react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Save, User, Mail, Phone, MapPin } from "lucide-react";
import { authService } from "@/services/authService";
import toast from "react-hot-toast";



const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    firstname: user?.firstname || "",
    lastname: user?.lastname || "",
    email: user?.email || "",
    phone: user?.phone || "",
    matric_number: user?.matric_number || "",
    bio: "",
    delivery_location: user?.delivery_location || "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value,
    });
  };



  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Call backend API
      const updatedUser = await authService.updateProfile({
        firstname: profileData.firstname,
        lastname: profileData.lastname,
        phone: profileData.phone,
        matric_number: profileData.matric_number,
        delivery_location: profileData.delivery_location,
        bio: profileData.bio,
      });

      // Update local context
      updateUser(updatedUser);

      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setProfileData({
      firstname: user?.firstname || "",
      lastname: user?.lastname || "",
      email: user?.email || "",
      phone: user?.phone || "",
      matric_number: user?.matric_number || "",
      bio: user?.bio || "",
      delivery_location: user?.delivery_location || "",
    });
    setIsEditing(false);
  };

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <User className='w-5 h-5' />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          {/* Profile Picture */}
          <div className='flex items-center space-x-4'>
            <div className='relative'>
              <Avatar className='w-20 h-20'>
                <AvatarImage src='/placeholder.svg?height=80&width=80&text=User' />
                <AvatarFallback className='text-lg'>
                  {user?.firstname?.[0]}
                  {user?.lastname?.[0]}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <Button
                  size='sm'
                  variant='outline'
                  className='-right-2 -bottom-2 absolute bg-transparent p-0 rounded-full w-8 h-8'
                >
                  <Camera className='w-4 h-4' />
                </Button>
              )}
            </div>
            <div>
              <h3 className='font-semibold text-lg'>
                {user?.firstname} {user?.lastname}
              </h3>
              <p className='text-gray-600 capitalize'>{user?.role}</p>
              <p className='text-gray-500 text-sm'>{user?.matric_number}</p>
            </div>
          </div>

          {/* Form Fields */}
          <div className='gap-6 grid grid-cols-1 md:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='firstname'>First Name</Label>
              <Input
                id='firstname'
                name='firstname'
                value={profileData.firstname}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={!isEditing ? "bg-gray-50" : ""}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='lastname'>Last Name</Label>
              <Input
                id='lastname'
                name='lastname'
                value={profileData.lastname}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={!isEditing ? "bg-gray-50" : ""}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <div className='relative'>
                <Mail className='top-3 left-3 absolute w-4 h-4 text-gray-400' />
                <Input
                  id='email'
                  name='email'
                  type='email'
                  value={profileData.email}
                  onChange={handleInputChange}
                  disabled={true} // Email usually can't be changed
                  className='bg-gray-50 pl-10'
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='phone'>Phone Number</Label>
              <div className='relative'>
                <Phone className='top-3 left-3 absolute w-4 h-4 text-gray-400' />
                <Input
                  id='phone'
                  name='phone'
                  type='tel'
                  value={profileData.phone}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`pl-10 ${!isEditing ? "bg-gray-50" : ""}`}
                  placeholder='Enter your phone number'
                />
              </div>
            </div>

            <div className='space-y-2 md:col-span-2'>
              <Label htmlFor='matric_number'>matric_number</Label>
                <Input
                  id="matric_number"
                  name="matric_number"
                  value={profileData.matric_number}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={!isEditing ? "bg-gray-50" : ""}
                  placeholder="Enter your Matric Number"
                />
            </div>

            <div className='space-y-2 md:col-span-2'>
              <Label htmlFor='bio'>Bio</Label>
              <textarea
                id='bio'
                name='bio'
                value={profileData.bio}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#3bb85e] focus:border-transparent resize-none ${
                  !isEditing ? "bg-gray-50" : ""
                }`}
                rows={3}
                placeholder='Tell us about yourself...'
              />
            </div>

            <div className='space-y-2 md:col-span-2'>
              <Label htmlFor='delivery_location'>Delivery Location</Label>
              <Input
                id='delivery_location'
                name='delivery_location'
                value={profileData.delivery_location}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={!isEditing ? "bg-gray-50" : ""}
                placeholder='Your current delivery location (e.g., Hostel Name)'
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className='flex justify-end space-x-3'>
            {isEditing ? (
              <>
                <Button
                  variant='outline'
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isLoading}
                  className='bg-[#3bb85e] hover:bg-[#457753]'
                >
                  <Save className='mr-2 w-4 h-4' />
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setIsEditing(true)}
                className='bg-[#3bb85e] hover:bg-[#457753]'
              >
                Edit Profile
              </Button>
            )}
          </div>
        </CardContent>
      </Card>



    </div>
  );
};

export default ProfilePage;
