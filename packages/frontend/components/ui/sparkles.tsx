"use client";
import React, { useId, useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type ParticlesProps = {
  id?: string;
  className?: string;
  background?: string;
  minSize?: number;
  maxSize?: number;
  speed?: number;
  particleColor?: string;
  particleDensity?: number;
};

export const SparklesCore = (props: ParticlesProps) => {
  const {
    id,
    className,
    background,
    minSize = 0.4,
    maxSize = 1,
    speed = 0.5,
    particleColor,
    particleDensity = 120,
  } = props;
  const [mounted, setMounted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const generatedId = useId();

  const resolvedColor = particleColor ?? (
    typeof window !== "undefined" &&
    getComputedStyle(document.documentElement)
      .getPropertyValue("--foreground").trim()
      ? `oklch(${getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim()})`
      : "#000000"
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      let animationFrameId: number;
      let particles: Particle[] = [];

      const resizeCanvas = () => {
        const parent = canvas.parentElement;
        if (parent) {
          canvas.width = parent.offsetWidth;
          canvas.height = parent.offsetHeight;
          initParticles();
        }
      };

      class Particle {
        x: number;
        y: number;
        size: number;
        speedX: number;
        speedY: number;

        constructor() {
          this.x = Math.random() * canvas.width;
          this.y = Math.random() * canvas.height;
          this.size = Math.random() * (maxSize - minSize) + minSize;
          this.speedX = (Math.random() - 0.5) * speed;
          this.speedY = (Math.random() - 0.5) * speed;
        }

        update() {
          this.x += this.speedX;
          this.y += this.speedY;

          if (this.x > canvas.width) this.x = 0;
          if (this.x < 0) this.x = canvas.width;
          if (this.y > canvas.height) this.y = 0;
          if (this.y < 0) this.y = canvas.height;
        }

        draw() {
          if (!ctx) return;
          ctx.fillStyle = resolvedColor;
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const initParticles = () => {
        particles = [];
        const count = (canvas.width * canvas.height) / 10000 * (particleDensity / 10);
        for (let i = 0; i < count; i++) {
          particles.push(new Particle());
        }
      };

      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach((particle) => {
          particle.update();
          particle.draw();
        });
        animationFrameId = requestAnimationFrame(animate);
      };

      resizeCanvas();
      animate();

      window.addEventListener("resize", resizeCanvas);

      return () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener("resize", resizeCanvas);
      };
    }
  }, [mounted, particleColor, particleDensity, speed, minSize, maxSize]);

  if (!mounted) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className={cn("h-full w-full relative", className)}
    >
      <canvas
        ref={canvasRef}
        id={id || generatedId}
        className="h-full w-full pointer-events-none"
        style={{
          background: background || "transparent",
        }}
      />
    </motion.div>
  );
};
