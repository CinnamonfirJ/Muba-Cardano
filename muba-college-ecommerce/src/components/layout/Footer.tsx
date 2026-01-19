"use client";

import { Facebook, Instagram, Twitter, Linkedin } from "lucide-react";
import Logo from "../../assets/logo.png";
import { Button } from "../ui/button";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import PromoBanner from "../../assets/campus_promo_banner.png";

export default function Footer() {
  const { user } = useAuth();
  return (
    <footer className='bg-neutral-900 text-neutral-300 text-sm'>
      {/* Promo Banner with Dark Overlay */}
      {user?.role === "user" ? (
        <section
          className='relative'
          style={{
            backgroundImage: `url(${PromoBanner.src})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className='absolute inset-0 bg-black/70' />
          <div className='z-10 relative mx-auto px-4 py-24 max-w-4xl text-center'>
            <h2 className='mb-4 font-light text-white text-3xl'>
              Own Your Campus Storefront
            </h2>
            <p className='mb-6 text-neutral-300'>
              Sell premium or everyday items with zero hassle. Join sellers
              redefining the student marketplace.
            </p>
            <Link href='/dashboard/become-vendor'>
              <Button className='bg-[#3bb85e] hover:bg-[#457753] px-6 py-6 text-lg transition'>
                Become a Seller
              </Button>
            </Link>
          </div>
        </section>
      ) : (
        ""
      )}

      <div className='flex md:flex-row flex-col justify-between md:items-center gap-12 mx-auto px-6 pt-12 max-w-6xl'>
        {/* Logo and tagline */}
        <div className='flex flex-col justify-center'>
          <div className='flex items-end gap-2 mb-3'>
            <img src={Logo.src} alt='MubaXpress Logo' className='w-20' />
            <h1 className='font-bold text-white text-2xl lg:text-5xl'>
              MubaXpress
            </h1>
          </div>
          <p className='max-w-[300px] text-neutral-400'>
            Buy & Sell on Campus — Fast, Safe, and Simple
          </p>

          {/* Social Icons */}
          <div className='flex gap-4 mt-4'>
            <a href='#' aria-label='Instagram' className='hover:text-white'>
              <Instagram className='w-5 h-5' />
            </a>
            <a href='#' aria-label='Facebook' className='hover:text-white'>
              <Facebook className='w-5 h-5' />
            </a>
            <a href='#' aria-label='Twitter' className='hover:text-white'>
              <Twitter className='w-5 h-5' />
            </a>
            <a href='#' aria-label='LinkedIn' className='hover:text-white'>
              <Linkedin className='w-5 h-5' />
            </a>
          </div>
        </div>
        <div className='gap-12 grid grid-cols-1 md:grid-cols-3'>
          {/* Quick Links */}
          <div>
            <h3 className='mb-3 font-semibold text-white'>Company</h3>
            <ul className='space-y-2'>
              <li>
                <a href='#' className='hover:text-white'>
                  About Us
                </a>
              </li>
              <li>
                <a href='#' className='hover:text-white'>
                  Careers
                </a>
              </li>
              <li>
                <a href='#' className='hover:text-white'>
                  Blog
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className='mb-3 font-semibold text-white'>Support</h3>
            <ul className='space-y-2'>
              <li>
                <a href='#' className='hover:text-white'>
                  Contact Us
                </a>
              </li>
              <li>
                <a href='#' className='hover:text-white'>
                  Help Center
                </a>
              </li>
              <li>
                <a href='#' className='hover:text-white'>
                  Returns
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className='mb-3 font-semibold text-white'>Legal</h3>
            <ul className='space-y-2'>
              <li>
                <a href='#' className='hover:text-white'>
                  Terms of Service
                </a>
              </li>
              <li>
                <a href='#' className='hover:text-white'>
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href='#' className='hover:text-white'>
                  Cookie Policy
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Line */}
      <div className='mt-12 py-6 border-neutral-800 border-t text-neutral-500 text-center'>
        &copy; 2025 <span className='font-medium text-white'>MubaXpress</span>.
        All rights reserved.
      </div>
    </footer>
  );
}
