'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Poppins } from 'next/font/google';
import LensFlare from './LensFlare';
import Typed from 'typed.js'; // Corrected import

const poppins = Poppins({
  weight: ['400', '700', '900'],
  subsets: ['latin'],
  display: 'swap',
});

const LandingPage: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const typedRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Particle[] = [];
    const particleCount = 100;

    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;

      constructor() {
        this.x = Math.random() * (canvas?.width ?? 0);
        this.y = Math.random() * (canvas?.height ?? 0);
        this.size = Math.random() * 2 + 1; // Smaller size range: 1 to 3 pixels
        this.speedX = Math.random() * 0.5 - 0.25; // Slower movement
        this.speedY = Math.random() * 0.5 - 0.25;
        this.color = this.getColor();
      }

      getColor() {
        const colors = [
          'rgba(255, 255, 255, 0.3)', // White with low opacity
          'rgba(173, 216, 230, 0.3)', // Light blue with low opacity
          'rgba(240, 248, 255, 0.3)', // Alice blue with low opacity
        ];
        return colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Wrap around screen edges
        if (this.x < 0) this.x = canvas?.width ?? 0;
        if (this.x > (canvas?.width ?? 0)) this.x = 0;
        if (this.y < 0) this.y = canvas?.height ?? 0;
        if (this.y > (canvas?.height ?? 0)) this.y = 0;
      }

      draw() {
        if (ctx) {
          ctx.fillStyle = this.color;
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    const createParticles = () => {
      particles.length = 0; // Clear existing particles
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    };

    const animateParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
      }
      requestAnimationFrame(animateParticles);
    };

    createParticles();
    animateParticles();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      createParticles(); // Recreate particles on resize
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const typed = new Typed(typedRef.current, {
      strings: [
        "Explore the world's weather with stunning visuals and accurate forecasts",
        "Discover real-time weather data from around the globe",
        "Experience weather like never before with interactive maps and charts"
      ],
      typeSpeed: 40,
      backSpeed: 30,
      loop: true
    });

    return () => {
      typed.destroy();
    };
  }, []);

  return (
    <div className={`relative h-screen w-full overflow-hidden ${poppins.className}`}>
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 animate-gradient-xy"></div>
      
      {/* Canvas for particles */}
      <canvas ref={canvasRef} className="absolute inset-0 z-10" />
      
      {/* Lens flare */}
      <div className="absolute inset-0 z-20">
        <LensFlare />
      </div>
      
      {/* Content */}
      <div className="relative z-30 flex h-full flex-col items-center justify-center text-white">
        <h1 className="mb-16 text-center relative group"> {/* Increased bottom margin from mb-8 to mb-16 */}
          <span className="block text-6xl font-black mb-2 animate-float-slow transition-all duration-300 group-hover:scale-110">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-300 to-sky-500 animate-gradient-x hover:animate-text-shimmer">
              Weather
            </span>
          </span>
          <span className="block text-7xl font-black animate-float-fast animation-delay-300 transition-all duration-300 group-hover:scale-110">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 animate-gradient-x hover:animate-text-shimmer">
              Wonder
            </span>
          </span>
          <span className="text-4xl animate-pulse absolute -top-8 -left-8 transition-all duration-300 group-hover:scale-125 group-hover:-translate-x-2">☀️</span>
          <span className="text-4xl animate-pulse animation-delay-150 absolute -top-8 -right-8 transition-all duration-300 group-hover:scale-125 group-hover:translate-x-2">🌦️</span>
          <span className="text-4xl animate-pulse animation-delay-300 absolute -bottom-8 left-1/2 transform -translate-x-1/2 transition-all duration-300 group-hover:scale-125 group-hover:translate-y-2">❄️</span>
        </h1>
        
        <div className="mb-8 text-2xl font-light animate-fade-in-down animation-delay-300 text-blue-200 max-w-2xl text-center">
          <span ref={typedRef}></span>
        </div>
        
        <Link href="/weather">
          <button className="rounded-full bg-gradient-to-r from-blue-500 to-purple-500 px-10 py-4 font-bold text-lg text-white shadow-lg transition-all duration-300 hover:from-blue-600 hover:to-purple-600 animate-fade-in-up animation-delay-600 hover:scale-105 transform hover:shadow-xl hover:text-opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50">
            <span className="flex items-center">
              Explore Weather
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-2 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </button>
        </Link>
      </div>
    </div>
  );
};

export default LandingPage;