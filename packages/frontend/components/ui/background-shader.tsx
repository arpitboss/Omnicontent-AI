"use client";

import { useEffect, useRef } from "react";

export function BackgroundShader() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId: number;
        let time = 0;
        let isDark = document.documentElement.classList.contains("dark");

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === "class") {
                    isDark = document.documentElement.classList.contains("dark");
                }
            });
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class"],
        });

        const resize = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            canvas.style.width = `${window.innerWidth}px`;
            canvas.style.height = `${window.innerHeight}px`;
            ctx.scale(dpr, dpr);
        };

        window.addEventListener("resize", resize);
        resize();

        const w = () => window.innerWidth;
        const h = () => window.innerHeight;

        const draw = () => {
            time += 0.0012;
            ctx.clearRect(0, 0, w(), h());

            // Base gradient — monochrome
            const baseGradient = ctx.createLinearGradient(0, 0, w(), h());
            if (isDark) {
                baseGradient.addColorStop(0, "#0e0e11");
                baseGradient.addColorStop(0.5, "#101014");
                baseGradient.addColorStop(1, "#0d0d10");
            } else {
                baseGradient.addColorStop(0, "#fafafa");
                baseGradient.addColorStop(0.5, "#f7f7f8");
                baseGradient.addColorStop(1, "#f5f5f6");
            }

            ctx.fillStyle = baseGradient;
            ctx.fillRect(0, 0, w(), h());

            // Ambient orbs — very subtle grays
            const orbs = [
                {
                    x: Math.sin(time * 0.3) * 0.25 + 0.3,
                    y: Math.cos(time * 0.2) * 0.2 + 0.3,
                    r: 0.55,
                    color: isDark ? "rgba(255, 255, 255, 0.012)" : "rgba(0, 0, 0, 0.012)",
                },
                {
                    x: Math.cos(time * 0.25) * 0.25 + 0.7,
                    y: Math.sin(time * 0.35) * 0.2 + 0.6,
                    r: 0.5,
                    color: isDark ? "rgba(255, 255, 255, 0.008)" : "rgba(0, 0, 0, 0.008)",
                },
            ];

            orbs.forEach((orb) => {
                const x = orb.x * w();
                const y = orb.y * h();
                const radius = Math.max(w(), h()) * orb.r;

                const orbGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
                orbGradient.addColorStop(0, orb.color);
                orbGradient.addColorStop(1, "rgba(0, 0, 0, 0)");

                ctx.fillStyle = orbGradient;
                ctx.fillRect(0, 0, w(), h());
            });
        };

        const animate = () => {
            draw();
            animationFrameId = requestAnimationFrame(animate);
        };
        animationFrameId = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener("resize", resize);
            cancelAnimationFrame(animationFrameId);
            observer.disconnect();
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 -z-10 h-full w-full pointer-events-none"
            style={{ opacity: 1 }}
        />
    );
}
