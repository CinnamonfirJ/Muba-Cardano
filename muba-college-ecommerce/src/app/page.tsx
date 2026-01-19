"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  ShoppingBag,
  Users,
  Shield,
  Truck,
  ArrowRight,
  CheckCircle,
  TrendingUp,
  Heart,
  MessageCircle,
  Book,
  GraduationCap,
  Cake,
  Monitor,
  Sparkles,
  Crown,
  Quote,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

// Assets
// import macbook from "../assets/macbook.jpeg";
// import textbook2 from "../assets/textbook (2).jpeg";
// import iphone from "../assets/iphone.jpeg";
// import earbud from "../assets/earbud.jpeg";
// import rice from "../assets/rice.jpeg";
import bg from "../assets/bg.png"; // Keeping bg as it is likely used in hero

const initialStats = [
  { label: "Active Students", value: "13", suffix: "+", icon: Users },
  { label: "Products Sold", value: "250", suffix: "+", icon: ShoppingBag },
  { label: "Campus Post Office", value: "1", suffix: "+", icon: TrendingUp },
  { label: "Happy Customers", value: "98", suffix: "%", icon: Heart },
];

const features = [
  {
    icon: Shield,
    title: "Student-Verified",
    description:
      "Every seller is verified with their student ID for maximum trust and security.",
    color: "bg-blue-500/10 text-blue-500",
  },
  {
    icon: Truck,
    title: "Campus Delivery",
    description:
      "Fast delivery within campus premises. Get your items in under 2 hours.",
    color: "bg-orange-500/10 text-orange-500",
  },
  {
    icon: MessageCircle,
    title: "Direct Chat",
    description:
      "Connect directly with sellers and buyers through our integrated chat system.",
    color: "bg-purple-500/10 text-purple-500",
  },
  {
    icon: CheckCircle,
    title: "Quality Assured",
    description:
      "All products are quality-checked and come with our student satisfaction guarantee.",
    color: "bg-[#3bb85e]/10 text-[#3bb85e]",
  },
];

const testimonials = [
  {
    name: "Adebayo Olamide",
    role: "Computer Science, UI",
    content:
      "Found my textbooks at 40% cheaper than bookstore prices. MubaXpress is a game-changer!",
    rating: 5,
    initials: "AO",
    bg: "bg-blue-100 text-blue-600",
  },
  {
    name: "Fatima Hassan",
    role: "Medicine, ABU",
    content:
      "Sold my old laptop in just 2 days. The process was so smooth and secure.",
    rating: 5,
    initials: "FH",
    bg: "bg-green-100 text-green-600",
  },
  {
    name: "Chidi Okwu",
    role: "Engineering, UNILAG",
    content:
      "Best place to find quality electronics at student-friendly prices.",
    rating: 5,
    initials: "CO",
    bg: "bg-purple-100 text-purple-600",
  },
];

const initialFeaturedProducts: any[] = [];

const campusItems = [
  { name: "Textbooks", icon: Book, coords: { top: "30%", left: "20%" } },
  {
    name: "Graduation Gear",
    icon: GraduationCap,
    coords: { top: "15%", left: "50%" },
  },
  { name: "Snacks", icon: Cake, coords: { top: "10%", left: "70%" } },
  { name: "Electronics", icon: Monitor, coords: { top: "40%", left: "30%" } },
  { name: "Course Materials", icon: Book, coords: { top: "60%", left: "60%" } },
];

const AnimatedCounter = ({
  value,
  suffix = "",
}: {
  value: string;
  suffix?: string;
}) => {
  const [count, setCount] = useState(0);
  const numValue = parseInt(value.replace(/,/g, ""));

  useEffect(() => {
    let start = 0;
    const end = numValue;
    if (start === end) return;

    let totalMiliseconds = 2000;
    let incrementTime = (totalMiliseconds / end) * 5;

    let timer = setInterval(() => {
      start += 5;
      setCount(start);
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [numValue]);

  return (
    <span>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
};

const FadeInWhenVisible = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
    >
      {children}
    </motion.div>
  );
};

export default function LandingPage() {
  const [stats, setStats] = useState(initialStats);
  const [products, setProducts] = useState(initialFeaturedProducts);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/analytics/public`);
        const json = await res.json();
        if (json.success) {
          setStats([
            { label: "Active Students", value: json.data.users.toString(), suffix: "+", icon: Users },
            { label: "Products Sold", value: json.data.orders.toString(), suffix: "+", icon: ShoppingBag },
            { label: "Campus Post Office", value: json.data.postOffices > 0 ? json.data.postOffices.toString() : "5", suffix: "+", icon: TrendingUp },
            { label: "Happy Customers", value: "98", suffix: "%", icon: Heart },
          ]);
        }
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      }
    };

    const fetchFeatured = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/products/featured`);
        const json = await res.json();
        if (json.success) {
          const mapped = json.data.map((p: any) => ({
            title: p.title,
            subtitle: p.brand || p.description.slice(0, 30) + "...",
            price: `₦${p.price.toLocaleString()}`,
            originalPrice: p.originalPrice ? `₦${p.originalPrice.toLocaleString()}` : "",
            discount: p.originalPrice ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100).toString() : "",
            image: p.images[0],
            rating: p.rating,
            reviews: p.reviews,
            seller: p.store?.name || "Verified Seller",
            badge: p.featuredSlot ? "Promoted" : "Featured",
          }));
          setProducts(mapped);
        }
      } catch (err) {
        console.error("Failed to fetch featured products:", err);
      }
    };

    fetchStats();
    fetchFeatured();
  }, [API_BASE_URL]);

  return (
    <main className="bg-white overflow-x-hidden font-sans text-neutral-900 selection:bg-[#3bb85e]/30">
      {/* Luxurious Hero Section */}
      <section className="relative bg-linear-to-br from-[#f0f9f2] via-white to-[#f0f9f2] px-4 py-24 md:py-40 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="top-[-10%] left-[-5%] absolute bg-[#3bb85e]/5 blur-[120px] rounded-full w-[40%] h-[40%] animate-pulse" />
          <div className="right-[-5%] bottom-[-10%] absolute bg-[#3bb85e]/5 blur-[120px] rounded-full w-[50%] h-[50%] animate-pulse delay-700" />
          <div className="z-[-1] absolute inset-0 bg-[radial-gradient(#3bb85e_0.5px,transparent_0.5px)] [background-size:24px_24px] opacity-[0.05]" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="items-center gap-16 grid grid-cols-1 lg:grid-cols-2 lg:text-left text-center">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 bg-white/80 shadow-sm backdrop-blur-md px-4 py-2 border border-[#3bb85e]/20 rounded-full">
                <Crown className="w-4 h-4 text-[#3bb85e]" />
                <span className="font-semibold text-[#3bb85e] text-xs uppercase tracking-widest">
                  Nigeria's #1 Student Marketplace
                </span>
              </div>

              <h1 className="font-bold text-5xl sm:text-6xl md:text-8xl leading-[1.1] tracking-tight">
                <span className="block text-neutral-800">Elevate Your</span>
                <span className="relative block text-[#3bb85e]">
                  Campus Life.
                  <svg className="bottom-0 left-0 absolute w-full h-3 text-[#3bb85e]/20" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0 5 Q 25 0, 50 5 T 100 5 L 100 10 L 0 10 Z" fill="currentColor" />
                  </svg>
                </span>
              </h1>

              <p className="mx-auto lg:mx-0 max-w-xl font-medium text-neutral-500 text-lg sm:text-xl leading-relaxed">
                Unlock exclusive deals, verified student listings, and the fastest 
                campus delivery system. Built by students, for the academic elite.
              </p>

              <div className="flex sm:flex-row flex-col justify-center lg:justify-start gap-5 pt-4">
                <Link href="/marketplace">
                  <Button className="group bg-[#3bb85e] hover:bg-[#2d8a47] shadow-[0_20px_50px_rgba(59,184,94,0.3)] hover:shadow-[0_20px_50px_rgba(59,184,94,0.5)] px-10 py-7 rounded-2xl font-bold text-white text-lg transition-all hover:-translate-y-1.5 duration-300">
                    Explore Now
                    <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>

                <Link href="/register">
                  <Button
                    variant="outline"
                    className="bg-white/50 hover:bg-white shadow-lg backdrop-blur-md px-10 py-7 border-2 border-[#3bb85e]/30 hover:border-[#3bb85e] rounded-2xl font-bold text-[#3bb85e] text-lg transition-all hover:-translate-y-1.5 duration-300"
                  >
                    Start Selling
                  </Button>
                </Link>
              </div>

              <div className="flex justify-center lg:justify-start items-center gap-8 pt-8">
                <div className="flex -space-x-3">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="bg-neutral-200 border-2 border-white rounded-full w-10 h-10 overflow-hidden">
                       <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`} alt="User" />
                    </div>
                  ))}
                  <div className="flex justify-center items-center bg-[#3bb85e] border-2 border-white rounded-full w-10 h-10 font-bold text-white text-xs">
                    +10k
                  </div>
                </div>
                <div className="text-left text-neutral-500 text-sm">
                  <span className="block font-bold text-neutral-900">Trusted by students</span>
                  from 50+ Nigerian Universities
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="hidden lg:block relative"
            >
              <div className="relative z-10 bg-linear-to-b from-white/40 to-white/10 shadow-2xl backdrop-blur-xl p-8 border border-white/40 rounded-[3rem]">
                <Image 
                  src={bg} 
                  alt="Campus Marketplace" 
                  className="rounded-[2rem] w-full h-auto object-cover transform -rotate-2 hover:rotate-0 transition-transform duration-700"
                />
                
                {/* Floating Product Cards */}
                <motion.div 
                  animate={{ y: [0, -15, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="top-10 -left-10 absolute bg-white/90 shadow-xl backdrop-blur-md p-4 border border-white/50 rounded-2xl"
                >
                   <div className="flex items-center gap-3">
                    <div className="bg-orange-100 p-2 rounded-lg">
                      <ShoppingBag className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-bold text-neutral-900 text-sm">New Listing</p>
                      <p className="text-neutral-500 text-xs text-nowrap">MacBook Pro M2 - ₦850k</p>
                    </div>
                   </div>
                </motion.div>

                <motion.div 
                  animate={{ y: [0, 15, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  className="right-[-20px] bottom-20 absolute bg-white/90 shadow-xl backdrop-blur-md p-4 border border-white/50 rounded-2xl"
                >
                   <div className="flex items-center gap-3">
                    <div className="bg-[#3bb85e]/10 p-2 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-[#3bb85e]" />
                    </div>
                    <div>
                      <p className="font-bold text-neutral-900 text-sm">Verified Seller</p>
                      <p className="text-neutral-500 text-xs">Student ID Checked</p>
                    </div>
                   </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Premium Stats Section */}
      <section className="bg-neutral-950 py-24 text-white overflow-hidden">
        <div className="relative mx-auto px-4 max-w-7xl">
          <div className="gap-12 grid grid-cols-2 lg:grid-cols-4">
            {stats.map(({ label, value, suffix, icon: Icon }, idx) => (
              <FadeInWhenVisible key={idx} delay={idx * 0.1}>
                <div className="relative group text-center">
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-[#3bb85e] blur-xl opacity-20 group-hover:opacity-40 rounded-full transition-opacity" />
                      <div className="relative bg-neutral-900 border-neutral-800 p-5 border rounded-3xl group-hover:scale-110 transition-transform duration-500 transform">
                        <Icon className="w-8 h-8 text-[#3bb85e]" />
                      </div>
                    </div>
                  </div>
                  <div className="mb-2 font-black text-5xl tracking-tighter sm:text-6xl">
                    <AnimatedCounter value={value} suffix={suffix} />
                  </div>
                  <div className="font-semibold text-[#3bb85e]/60 text-xs uppercase tracking-[0.2em]">
                    {label}
                  </div>
                </div>
              </FadeInWhenVisible>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-32 overflow-hidden">
        <div className="mx-auto max-w-7xl">
          <div className="mb-24 text-center">
            <FadeInWhenVisible>
              <div className="inline-flex items-center gap-2 bg-[#3bb85e]/10 mb-4 px-4 py-2 rounded-full">
                <Sparkles className="w-4 h-4 text-[#3bb85e]" />
                <span className="font-bold text-[#3bb85e] text-xs uppercase tracking-widest">Premium Features</span>
              </div>
              <h2 className="mb-6 font-bold text-4xl sm:text-6xl text-neutral-900 tracking-tight">
                Designed for the <span className="text-[#3bb85e]">Student Elite</span>
              </h2>
              <p className="mx-auto max-w-2xl font-medium text-neutral-500 text-lg">
                We've revolutionized campus commerce with cutting-edge technology 
                and exclusive member benefits.
              </p>
            </FadeInWhenVisible>
          </div>

          <div className="gap-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, description, color }, idx) => (
              <FadeInWhenVisible key={idx} delay={idx * 0.1}>
                <div className="group relative bg-gray-50/50 hover:bg-white p-8 border border-gray-100 hover:border-[#3bb85e]/20 rounded-[2.5rem] transition-all duration-500 overflow-hidden">
                  <div className={`w-16 h-16 ${color} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="mb-4 font-bold text-neutral-900 text-2xl tracking-tight">{title}</h3>
                  <p className="font-medium text-neutral-500 leading-relaxed">{description}</p>
                </div>
              </FadeInWhenVisible>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-gray-50/50 px-4 py-32">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-16">
            <div className="max-w-2xl">
              <FadeInWhenVisible>
                <div className="inline-flex items-center gap-2 bg-[#3bb85e]/10 mb-4 px-4 py-2 rounded-full">
                  <TrendingUp className="w-4 h-4 text-[#3bb85e]" />
                  <span className="font-bold text-[#3bb85e] text-xs uppercase tracking-widest">Marketplace Highlights</span>
                </div>
                <h2 className="mb-4 font-bold text-4xl sm:text-5xl text-neutral-900 tracking-tight">
                  Hot Deals & <span className="text-[#3bb85e]">New Arrivals</span>
                </h2>
                <p className="font-medium text-neutral-500 text-lg">
                  Hand-picked quality items from our most trusted campus vendors.
                </p>
              </FadeInWhenVisible>
            </div>
            <FadeInWhenVisible>
              <Link href="/marketplace">
                <Button variant="ghost" className="hover:bg-[#3bb85e]/10 rounded-xl font-bold text-[#3bb85e]">
                  View All Products <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </FadeInWhenVisible>
          </div>

          <div className="gap-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {products.map((product, idx) => (
              <FadeInWhenVisible key={idx} delay={idx * 0.05}>
                <div className="group bg-white shadow-sm hover:shadow-2xl border border-gray-100 rounded-[2rem] transition-all duration-500 overflow-hidden">
                  <div className="relative aspect-square overflow-hidden">
                    <Image
                      src={product.image}
                      alt={product.title}
                      fill
                      className="group-hover:scale-110 object-cover transition-transform duration-700"
                    />
                    <div className="top-4 right-4 z-10 absolute bg-white/90 backdrop-blur-sm p-2 rounded-xl text-neutral-900 cursor-pointer">
                      <Heart className="w-5 h-5 group-hover:fill-red-500 group-hover:text-red-500 transition-colors" />
                    </div>
                    {product.badge && (
                      <Badge className="top-4 left-4 z-10 absolute bg-[#3bb85e] shadow-lg border-none px-3 py-1 rounded-lg font-bold text-white text-[10px] uppercase tracking-wider">
                        {product.badge}
                      </Badge>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-start gap-2 mb-2">
                       <h3 className="group-hover:text-[#3bb85e] font-bold text-neutral-900 text-lg line-clamp-1 transition-colors">
                        {product.title}
                      </h3>
                      <div className="flex items-center gap-1 font-bold text-[#3bb85e] text-xs">
                          <Star className="fill-[#3bb85e] w-3 h-3" />
                          {product.rating}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="font-black text-[#3bb85e] text-2xl">{product.price}</span>
                      <span className="text-neutral-400 text-sm line-through decoration-neutral-300 decoration-2">{product.originalPrice}</span>
                    </div>
                    <Link href="/marketplace">
                      <Button className="bg-[#3bb85e]/5 hover:bg-[#3bb85e] w-full border-none rounded-xl font-bold text-[#3bb85e] hover:text-white transition-all">
                        Buy Now
                      </Button>
                    </Link>
                  </div>
                </div>
              </FadeInWhenVisible>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-4 py-32">
        <div className="mx-auto max-w-7xl">
          <div className="items-center gap-20 grid grid-cols-1 lg:grid-cols-2">
            <FadeInWhenVisible>
              <div className="space-y-8">
                 <div className="inline-flex items-center gap-2 bg-[#3bb85e]/10 px-4 py-2 rounded-full">
                  <Quote className="w-4 h-4 text-[#3bb85e]" />
                  <span className="font-bold text-[#3bb85e] text-xs uppercase tracking-widest">Success Stories</span>
                </div>
                <h2 className="font-bold text-4xl sm:text-6xl text-neutral-900 tracking-tight">
                  Trusted by Over <span className="text-[#3bb85e]">25,000</span> Students
                </h2>
                <p className="font-medium text-neutral-500 text-xl leading-relaxed">
                  Join the thousands of smart students who are already saving money and 
                  building their businesses on MubaXpress.
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(i => <Star key={i} className="fill-yellow-400 w-5 h-5 text-yellow-400" />)}
                  </div>
                  <span className="font-bold text-neutral-900">4.9/5 Average Rating</span>
                </div>
              </div>
            </FadeInWhenVisible>

            <div className="space-y-6">
              {testimonials.map((testimonial, idx) => (
                <FadeInWhenVisible key={idx} delay={idx * 0.15}>
                  <div className="group relative bg-white hover:bg-neutral-50 p-8 border border-gray-100 hover:border-[#3bb85e]/20 rounded-[2rem] transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md">
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`w-14 h-14 rounded-full ${testimonial.bg} flex items-center justify-center font-black text-xl`}>
                        {testimonial.initials}
                      </div>
                      <div>
                        <h4 className="font-bold text-neutral-900 text-lg">{testimonial.name}</h4>
                        <p className="text-[#3bb85e] text-sm font-semibold">{testimonial.role}</p>
                      </div>
                    </div>
                    <p className="font-medium text-neutral-600 text-lg leading-relaxed italic">
                      "{testimonial.content}"
                    </p>
                  </div>
                </FadeInWhenVisible>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Modern CTA Section */}
      <section className="px-4 pb-32">
        <FadeInWhenVisible>
          <div className="relative bg-[#3bb85e] p-12 md:p-24 rounded-[3rem] overflow-hidden">
            <div className="absolute inset-0 z-0 opacity-10">
              <div className="top-[-100px] left-[-100px] absolute bg-white blur-3xl rounded-full w-[400px] h-[400px]" />
              <div className="right-[-100px] bottom-[-100px] absolute bg-white blur-3xl rounded-full w-[400px] h-[400px]" />
            </div>
            
            <div className="relative z-10 mx-auto max-w-4xl text-center text-white">
              <h2 className="mb-8 font-black text-4xl sm:text-7xl leading-tight tracking-tight">
                Ready to Join the Revolution?
              </h2>
              <p className="opacity-80 mx-auto mb-12 max-w-2xl font-medium text-xl md:text-2xl leading-relaxed">
                Start your journey today on Nigeria's premier campus marketplace. 
                Fast, secure, and built for you.
              </p>
              <div className="flex sm:flex-row flex-col justify-center gap-6">
                <Link href="/marketplace">
                  <Button className="bg-white hover:bg-neutral-100 shadow-[0_20px_40px_rgba(255,255,255,0.2)] px-12 py-8 rounded-2xl font-black text-[#3bb85e] text-xl transition-all hover:-translate-y-2 transform">
                    Start Shopping
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="outline" className="hover:bg-white/10 px-12 py-8 border-2 border-white/40 hover:border-white rounded-2xl font-black text-white text-xl transition-all hover:-translate-y-2 transform">
                    Sign Up Now
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </FadeInWhenVisible>
      </section>
    </main>
  );
}
