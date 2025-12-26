"use client";

// import { Link } from "react-router-dom";
import Link from "next/link";
import type { User } from "../services/authService";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Badge } from "./ui/badge";
import {
  UserIcon,
  Settings,
  ShoppingBag,
  LogOut,
  Store,
  Shield,
  Building2,
} from "lucide-react";

interface UserAccountDropdownProps {
  user: User;
  onLogout: () => void;
}

export const UserAccountDropdown = ({
  user,
  onLogout,
}: UserAccountDropdownProps) => {
  const getFullName = () => {
    const parts = [user.firstname, user.middlename, user.lastname].filter(
      Boolean
    );
    return parts.join(" ");
  };

  const avatarUrl =
    user.profile_img ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(getFullName())}&background=3bb85e&color=fff`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className='flex items-center space-x-2 hover:bg-gray-100 p-2 rounded-lg transition-colors'>
        <Avatar className='w-8 h-8'>
          <AvatarImage
            src={avatarUrl || "/placeholder.svg"}
            alt={getFullName()}
          />
          <AvatarFallback className='bg-[#3bb85e] text-white text-sm'>
            {user.firstname[0]}
            {user.lastname[0]}
          </AvatarFallback>
        </Avatar>
        <div className='hidden md:block text-left'>
          <div className='font-medium text-gray-900 text-sm'>
            {getFullName()}
          </div>
          <div className='flex items-center gap-1 text-gray-500 text-xs'>
            {user.role != "user" && (
              <Badge
                variant={user.role === "vendor" ? "default" : "secondary"}
                className='px-1 py-0 text-xs'
              >
                {user.role}
              </Badge>
            )}
            {user.isVerified && <Shield className='w-3 h-3 text-green-600' />}
          </div>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent align='end' className='w-56'>
        <DropdownMenuLabel>
          <div className='flex flex-col space-y-1'>
            <p className='font-medium text-sm leading-none'>{getFullName()}</p>
            <p className='text-muted-foreground text-xs leading-none'>
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href='/dashboard' className='flex items-center'>
            <UserIcon className='mr-2 w-4 h-4' />
            <span>Dashboard</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href='/dashboard/profile' className='flex items-center'>
            <Settings className='mr-2 w-4 h-4' />
            <span>Profile Settings</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href='/dashboard/orders' className='flex items-center'>
            <ShoppingBag className='mr-2 w-4 h-4' />
            <span>Your Orders</span>
          </Link>
        </DropdownMenuItem>

        {user.role === "vendor" && (
          <DropdownMenuItem asChild>
            <Link href='/dashboard/storefronts' className='flex items-center'>
              <Store className='mr-2 w-4 h-4' />
              <span>Your Stores</span>
            </Link>
          </DropdownMenuItem>
        )}
        
        {user.role === "user" && (
          <DropdownMenuItem asChild>
            <Link href='/dashboard/become-post-office' className='flex items-center'>
              <Building2 className='mr-2 w-4 h-4' />
              <span>Become Post Office</span>
            </Link>
          </DropdownMenuItem>
        )}

        {(user.role === "post_office" || user.role === "post_office_member") && (
           <DropdownMenuItem asChild>
            <Link href='/dashboard/post-office/scan' className='flex items-center'>
              <Building2 className='mr-2 w-4 h-4' />
              <span>PO Dashboard</span>
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={onLogout}
          className='text-red-600 focus:text-red-600'
        >
          <LogOut className='mr-2 w-4 h-4' />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
