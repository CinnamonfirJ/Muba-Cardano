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
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// Placeholder images - replace with actual imports
import macbook from "../assets/macbook.jpeg";
import textbook2 from "../assets/textbook (2).jpeg";
import iphone from "../assets/iphone.jpeg";
import bg from "../assets/bg.png";

const stats = [
  { label: "Active Students", value: "25,000", suffix: "+", icon: Users },
  { label: "Products Sold", value: "150,000", suffix: "+", icon: ShoppingBag },
  { label: "Campus Partners", value: "50", suffix: "+", icon: TrendingUp },
  { label: "Happy Customers", value: "98", suffix: "%", icon: Heart },
];

const features = [
  {
    icon: Shield,
    title: "Student-Verified",
    description:
      "Every seller is verified with their student ID for maximum trust and security.",
  },
  {
    icon: Truck,
    title: "Campus Delivery",
    description:
      "Fast delivery within campus premises. Get your items in under 2 hours.",
  },
  {
    icon: MessageCircle,
    title: "Direct Chat",
    description:
      "Connect directly with sellers and buyers through our integrated chat system.",
  },
  {
    icon: CheckCircle,
    title: "Quality Assured",
    description:
      "All products are quality-checked and come with our student satisfaction guarantee.",
  },
];

const testimonials = [
  {
    name: "Adebayo Olamide",
    role: "Computer Science, UI",
    content:
      "Found my textbooks at 40% cheaper than bookstore prices. MubaXpress is a game-changer!",
    rating: 5,
    avatar: "/placeholder.svg?height=40&width=40&text=AO", // Fixed placeholder
  },
  {
    name: "Fatima Hassan",
    role: "Medicine, ABU",
    content:
      "Sold my old laptop in just 2 days. The process was so smooth and secure.",
    rating: 5,
    avatar: "/placeholder.svg?height=40&width=40&text=FH",
  },
  {
    name: "Chidi Okwu",
    role: "Engineering, UNILAG",
    content:
      "Best place to find quality electronics at student-friendly prices.",
    rating: 5,
    avatar: "/placeholder.svg?height=40&width=40&text=CO",
  },
];

const featuredProducts = [
  {
    title: "MacBook Pro M2",
    subtitle: "Pristine Condition",
    price: "₦850,000",
    originalPrice: "₦1,200,000",
    discount: "29",
    image: macbook,
    rating: 4.8,
    reviews: 24,
    seller: "Tech Hub UNILAG",
    badge: "Trending",
    premium: true,
  },
  {
    title: "Engineering Mathematics",
    subtitle: "Essential Textbook",
    price: "₦4,500",
    originalPrice: "₦8,000",
    discount: "44",
    image: textbook2,
    rating: 4.9,
    reviews: 156,
    seller: "BookStore UI",
    badge: "Best Seller",
  },
  {
    title: "iPhone 13 Pro Max",
    subtitle: "Like New",
    price: "₦420,000",
    originalPrice: "₦600,000",
    discount: "30",
    image: iphone,
    rating: 4.7,
    reviews: 89,
    seller: "Mobile Palace",
    badge: "Hot Deal",
  },
];

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

// Animated counter component
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
    const duration = 2000;
    const steps = 50;
    const increment = numValue / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= numValue) {
        setCount(numValue);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [numValue]);

  return (
    <span>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
};

export default function LandingPage() {
  const [, setHoveredFeature] = useState<number | null>(null);
  const [, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <main className="bg-linear-to-b from-white via-gray-50 to-white overflow-x-hidden font-sans text-neutral-900">
      {/* Luxurious Hero Section */}
      <section className="relative bg-linear-to-br from-[#e0f5e7] via-white to-[#e0f5e7] px-4 py-24 md:py-32 overflow-hidden">
        {/* Animated linear background */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-linear-to-br from-[#3bb85e]/10 via-transparent to-[#3bb85e]/10 animate-pulse" />
        </div>

        {/* Floating orbs for luxury effect */}
        <div className="top-20 left-10 absolute bg-[#3bb85e]/10 blur-3xl rounded-full w-72 h-72 animate-pulse" />
        <div className="right-10 bottom-20 absolute bg-[#3bb85e]/10 blur-3xl rounded-full w-96 h-96 animate-pulse delay-1000" />

        <div className="relative items-center gap-16 grid grid-cols-1 lg:grid-cols-2 mx-auto max-w-7xl lg:text-left text-center">
          <div className="z-10 space-y-8">
            <div className="inline-flex items-center gap-2 bg-linear-to-r from-[#3bb85e]/10 to-[#3bb85e]/5 px-4 py-2 border border-[#3bb85e]/20 rounded-full">
              <Crown className="w-4 h-4 text-[#3bb85e]" />
              <span className="font-medium text-[#3bb85e] text-sm">
                Nigeria's Premium Student Marketplace
              </span>
            </div>

            <h1 className="font-light text-5xl sm:text-6xl md:text-7xl leading-tight tracking-tight">
              <span className="block mb-2 text-neutral-800">Buy Smart.</span>
              <span className="block bg-clip-text bg-linear-to-r from-[#3bb85e] to-[#2d8a47] font-semibold text-transparent">
                Sell Fast.
              </span>
              <span className="block text-neutral-800">Campus-First.</span>
            </h1>

            <p className="mx-auto lg:mx-0 max-w-xl text-neutral-600 text-lg sm:text-xl leading-relaxed">
              Join an exclusive community of 25,000+ students across Nigeria's
              top universities. Experience premium marketplace services tailored
              for the academic elite.
            </p>

            <div className="flex sm:flex-row flex-col justify-center lg:justify-start gap-4">
              <Link href="/marketplace">
                <Button className="group relative bg-linear-to-r from-[#3bb85e] hover:from-[#2d8a47] to-[#2d8a47] hover:to-[#3bb85e] shadow-xl hover:shadow-2xl px-8 py-6 rounded-xl text-white text-lg transition-all hover:-translate-y-1 duration-300 transform">
                  <span className="z-10 relative flex items-center">
                    Browse Marketplace
                    <ArrowRight className="ml-3 w-5 h-5 transition-transform group-hover:translate-x-2" />
                  </span>
                </Button>
              </Link>

              <Button
                variant="outline"
                className="group bg-white/80 hover:bg-[#3bb85e] shadow-lg hover:shadow-xl backdrop-blur px-8 py-6 border-[#3bb85e] border-2 rounded-xl text-[#3bb85e] hover:text-white text-lg transition-all hover:-translate-y-1 duration-300 transform"
              >
                <Sparkles className="mr-2 w-5 h-5" />
                Start Selling
              </Button>

              <div className="hidden lg:block top-1/2 right-0 absolute opacity-25 w-[600px] lg:w-[700px] xl:w-[800px] h-[600px] lg:h-[700px] xl:h-[800px] -translate-y-1/2">
                <div
                  className="bg-contain bg-no-repeat bg-right rotate-12"
                  style={{
                    backgroundImage: `url(${bg.src})`, // Fixed for Next/Image usually, but here imported as string/object by Vite/Webpack
                    width: "100%",
                    height: "100%",
                  }}
                >
                  {campusItems.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={idx}
                        className="absolute flex justify-center items-center bg-white shadow-md rounded-full w-10 h-10 cursor-pointer"
                        style={{
                          top: item.coords.top,
                          left: item.coords.left,
                          transform: "translate(-50%, -50%)",
                        }}
                      >
                        <Icon className="w-6 h-6 text-[#3bb85e]" />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Premium floating cards on the right */}
          <div className="hidden lg:block z-20 relative h-[600px]">
            <div className="absolute inset-0 flex justify-center items-center">
              <div className="relative w-full h-full">
                {campusItems.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={idx}
                      className="group absolute flex flex-col items-center gap-2 bg-white/90 shadow-2xl hover:shadow-3xl backdrop-blur-sm p-4 rounded-2xl hover:scale-110 transition-all duration-500 cursor-pointer"
                      style={{
                        top: item.coords.top,
                        left: item.coords.left,
                        transform: `translate(-50%, -50%) rotate(${
                          idx * 5 - 10
                        }deg)`,
                      }}
                    >
                      <div className="bg-linear-to-br from-[#3bb85e]/20 group-hover:from-[#3bb85e]/30 to-[#3bb85e]/10 group-hover:to-[#3bb85e]/20 p-3 rounded-xl transition-colors">
                        <Icon className="w-8 h-8 text-[#3bb85e]" />
                      </div>
                      <span className="font-medium text-neutral-700 text-xs whitespace-nowrap">
                        {item.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Stats Section */}
      <section className="relative bg-linear-to-r from-neutral-900 via-neutral-800 to-neutral-900 py-20">
        <div className='absolute inset-0 opacity-20 bg-[url("data:image/svg+xml,%3Csvg width=\\"60\\" height=\\"60\\" viewBox=\\"0 0 60 60\\" xmlns=\\"http://www.w3.org/2000/svg\\"%3E%3Cg fill=\\"none\\" fill=\\"%239C92AC\\" d=\\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\\"%3E%3C/g%3E%3C/g%3E%3C/svg%3E")]' />

        <div className="relative mx-auto px-4 max-w-6xl">
          <div className="gap-8 grid grid-cols-2 md:grid-cols-4">
            {stats.map(({ label, value, suffix, icon: Icon }, idx) => (
              <div key={idx} className="group text-center">
                <div className="flex justify-center mb-4">
                  <div className="bg-linear-to-br from-[#3bb85e]/20 group-hover:from-[#3bb85e]/30 to-[#3bb85e]/10 group-hover:to-[#3bb85e]/20 backdrop-blur-sm p-4 rounded-2xl group-hover:scale-110 transition-all duration-300 transform">
                    <Icon className="w-8 h-8 text-[#3bb85e]" />
                  </div>
                </div>
                <div className="mb-2 font-bold text-white text-4xl sm:text-5xl">
                  <AnimatedCounter value={value} suffix={suffix} />
                </div>
                <div className="text-neutral-400 text-sm uppercase tracking-wider">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Luxurious Features Grid */}
      <section className="px-4 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 font-light text-4xl sm:text-5xl">
              Why Students Choose{" "}
              <span className="font-semibold text-[#3bb85e]">MubaXpress</span>
            </h2>
            <p className="mx-auto max-w-2xl text-neutral-600 text-lg">
              Experience excellence in every transaction with our premium
              features
            </p>
          </div>

          <div className="gap-8 grid sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, description }, idx) => (
              <div
                key={idx}
                className="group relative"
                onMouseEnter={() => setHoveredFeature(idx)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <Card className="bg-white/80 shadow-xl hover:shadow-2xl backdrop-blur-sm border-0 h-full overflow-hidden transition-all hover:-translate-y-2 duration-500 transform">
                  <div className="absolute inset-0 bg-linear-to-br from-[#3bb85e]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardContent className="relative p-8 text-center">
                    <div className="bg-linear-to-br from-[#3bb85e]/10 to-[#3bb85e]/5 mx-auto mb-6 p-4 rounded-2xl w-fit group-hover:rotate-12 transition-transform duration-500 transform">
                      <Icon className="w-8 h-8 text-[#3bb85e]" />
                    </div>
                    <h3 className="mb-3 font-semibold text-neutral-800 text-xl">
                      {title}
                    </h3>
                    <p className="text-neutral-600 text-sm leading-relaxed">
                      {description}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Premium Featured Products */}
      <section className="bg-linear-to-b from-gray-50 to-white px-4 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <div className="inline-flex items-center gap-2 bg-[#3bb85e]/10 mb-4 px-4 py-2 rounded-full">
              <TrendingUp className="w-4 h-4 text-[#3bb85e]" />
              <span className="font-medium text-[#3bb85e] text-sm uppercase tracking-wider">
                This Week's Selection
              </span>
            </div>
            <h2 className="mb-4 font-light text-4xl lg:text-5xl">
              Curated{" "}
              <span className="font-semibold text-[#3bb85e]">Premium</span>{" "}
              Finds
            </h2>
            <p className="text-neutral-600 text-lg">
              Handpicked quality items from verified student sellers
            </p>
          </div>

          <div className="gap-8 grid md:grid-cols-3">
            {featuredProducts.map((product, idx) => (
              <Card
                key={idx}
                className="bg-white shadow-lg hover:shadow-xl border-none overflow-hidden transition-all hover:-translate-y-1 duration-300"
              >
                <CardContent className="p-0">
                  <div className="relative">
                    <Image
                      src={product.image}
                      alt={product.title}
                      width={300}
                      height={200}
                      className="w-full h-48 object-cover"
                    />
                    <Badge className="top-3 left-3 absolute bg-[#3bb85e] text-white">
                      {product.badge}
                    </Badge>
                  </div>
                  <div className="p-6">
                    <h3 className="mb-2 font-semibold text-lg line-clamp-2">
                      {product.title}
                    </h3>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-bold text-[#3bb85e] text-xl">
                        {product.price}
                      </span>
                      <span className="text-neutral-500 text-sm line-through">
                        {product.originalPrice}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(product.rating)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-neutral-600 text-sm">
                        {product.rating} ({product.reviews} reviews)
                      </span>
                    </div>
                    <p className="mb-4 text-neutral-600 text-sm">
                      by {product.seller}
                    </p>
                    <Button className="bg-[#3bb85e] hover:bg-[#457753] w-full text-white">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-[#f7f7f7] px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 font-semibold text-3xl lg:text-4xl tracking-tight">
              What Students Say
            </h2>
            <p className="text-neutral-600 text-lg">
              Real experiences from real students
            </p>
          </div>
          <div className="gap-8 grid md:grid-cols-3">
            {testimonials.map((testimonial, idx) => (
              <Card key={idx} className="bg-white shadow-lg border-none">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star
                        key={i}
                        className="fill-yellow-400 w-4 h-4 text-yellow-400"
                      />
                    ))}
                  </div>
                  <p className="mb-6 text-neutral-700 italic">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center gap-3">
                    <Image
                      src={testimonial.avatar || "/placeholder.svg"}
                      alt={testimonial.name}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                    <div>
                      <div className="font-semibold text-sm">
                        {testimonial.name}
                      </div>
                      <div className="text-neutral-600 text-xs">
                        {testimonial.role}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-linear-to-r from-[#3bb85e] to-[#457753] px-4 py-20 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-6 font-semibold text-3xl lg:text-4xl">
            Ready to Join Nigeria's Largest Student Marketplace?
          </h2>
          <p className="opacity-90 mx-auto mb-8 max-w-2xl text-lg lg:text-xl">
            Whether you're looking to buy essentials or sell items you no longer
            need, MubaXpress makes it easy, safe, and profitable.
          </p>
          <div className="flex sm:flex-row flex-col justify-center gap-4">
            <Link href="/marketplace">
              <Button className="bg-white hover:bg-gray-100 px-8 py-6 text-[#3bb85e] text-lg">
                Start Shopping Now
              </Button>
            </Link>
            <Button
              variant="outline"
              className="bg-transparent hover:bg-white px-8 py-6 border-white text-white hover:text-[#3bb85e] text-lg"
            >
              List Your First Item
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
