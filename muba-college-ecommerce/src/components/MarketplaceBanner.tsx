import { useState, useEffect } from "react";
import {
  Zap,
  Gift,
  ShoppingBag,
  Star,
  Heart,
  Sparkles,
  Package,
  Tag,
} from "lucide-react";
import banner from "../assets/banner.png";

const MarketplaceBanner = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 2,
    hours: 15,
    minutes: 42,
    seconds: 18,
  });

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let newSeconds = prev.seconds - 1;
        let newMinutes = prev.minutes;
        let newHours = prev.hours;
        let newDays = prev.days;

        if (newSeconds < 0) {
          newSeconds = 59;
          newMinutes -= 1;
        }
        if (newMinutes < 0) {
          newMinutes = 59;
          newHours -= 1;
        }
        if (newHours < 0) {
          newHours = 23;
          newDays -= 1;
        }
        if (newDays < 0) {
          return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        }

        return {
          days: newDays,
          hours: newHours,
          minutes: newMinutes,
          seconds: newSeconds,
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className='relative bg-linear-to-r from-[#3bb85e] via-[#2da653] to-[#1f8e47] overflow-hidden text-white'>
      {/* Background Pattern */}
      <div className='absolute inset-0 opacity-10'>
        <Gift className='top-2 left-10 absolute w-8 h-8 rotate-12' />
        <Star className='top-8 right-20 absolute w-6 h-6 -rotate-12' />
        <ShoppingBag className='bottom-4 left-1/4 absolute w-5 h-5 rotate-45' />
        <Zap className='right-1/3 bottom-2 absolute w-7 h-7 -rotate-45' />
        <Heart className='top-1/2 left-5 absolute w-6 h-6 -rotate-12' />
        <Sparkles className='top-3 right-1/4 absolute w-5 h-5 rotate-45' />
        <Package className='bottom-1/2 left-2/3 absolute w-7 h-7 rotate-12' />
        <Tag className='top-1/4 left-1/3 absolute w-5 h-5 -rotate-45' />
      </div>

      <div className='relative mx-auto px-4 py-8 max-w-7xl'>
        <div className='flex md:flex-row flex-col-reverse md:justify-between items-center gap-8'>
          {/* Left Content */}
          <div className='space-y-6 md:w-1/2 md:text-left text-center'>
            {/* Flash Sale Text */}
            <div className='flex justify-center md:justify-start items-center space-x-3'>
              <div className='bg-white/20 backdrop-blur-sm p-2 rounded-full'>
                <Zap className='w-6 h-6 text-yellow-300 animate-pulse' />
              </div>
              <div>
                <h2 className='font-bold text-2xl md:text-3xl tracking-wide'>
                  Flash Sale
                </h2>
                <p className='text-green-100 text-sm md:text-base'>
                  Up to 70% off campus essentials
                </p>
              </div>
            </div>

            {/* Countdown */}
            <div className='flex flex-wrap justify-center md:justify-start items-center gap-2'>
              <span className='text-green-100 text-sm'>Sale ends in:</span>
              <div className='flex items-center gap-2'>
                {[
                  {
                    label: "D",
                    value: timeLeft.days.toString().padStart(2, "0"),
                  },
                  {
                    label: "H",
                    value: timeLeft.hours.toString().padStart(2, "0"),
                  },
                  {
                    label: "M",
                    value: timeLeft.minutes.toString().padStart(2, "0"),
                  },
                  {
                    label: "S",
                    value: timeLeft.seconds.toString().padStart(2, "0"),
                  },
                ].map((item, index) => (
                  <div key={item.label} className='flex items-center'>
                    <div className='bg-white/20 backdrop-blur-sm px-3 py-2 rounded'>
                      <span className='font-bold'>{item.value}</span>
                    </div>
                    <span className='ml-1 text-green-100 text-xs'>
                      {item.label}
                    </span>
                    {index < 3 && <span className='mx-1 text-white/60'>:</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Image */}
          <div className='flex justify-center md:justify-end md:w-1/2'>
            <img
              src={banner}
              alt='Flash Sale Products'
              className='w-full max-w-sm md:max-w-md h-auto object-contain'
            />
          </div>
        </div>
      </div>

      {/* Bottom glow */}
      <div className='right-0 bottom-0 left-0 absolute bg-linear-to-r from-transparent via-white/30 to-transparent h-1'></div>
    </div>
  );
};

export default MarketplaceBanner;
