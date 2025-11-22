"use client";

import { useEffect, useRef } from "react";

export function BackgroundShader() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouseRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };
        };
        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId: number;
        let time = 0;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener("resize", resize);
        resize();

        const draw = () => {
            time += 0.002; // Smooth, slow movement
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            const isDark = document.documentElement.classList.contains("dark");

            // Deep Slate / Teal Theme
            if (isDark) {
                gradient.addColorStop(0, "#020617"); // Slate 950
                gradient.addColorStop(0.5, "#0f172a"); // Slate 900
                gradient.addColorStop(1, "#0f172a"); // Slate 900
            } else {
                gradient.addColorStop(0, "#f8fafc"); // Slate 50
                gradient.addColorStop(0.5, "#f1f5f9"); // Slate 100
                gradient.addColorStop(1, "#e2e8f0"); // Slate 200
            }

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Premium Gradient Mesh
            // We'll create large, soft moving orbs of color that blend together
            const orbs = [
                { x: Math.sin(time * 0.3) * 0.3 + 0.5, y: Math.cos(time * 0.2) * 0.3 + 0.5, r: 0.6, color: isDark ? "rgba(20, 184, 166, 0.08)" : "rgba(148, 163, 184, 0.15)" }, // Teal/Slate
                { x: Math.cos(time * 0.4) * 0.3 + 0.5, y: Math.sin(time * 0.3) * 0.3 + 0.5, r: 0.5, color: isDark ? "rgba(99, 102, 241, 0.08)" : "rgba(203, 213, 225, 0.15)" }, // Indigo/Slate
                { x: Math.sin(time * 0.2 + 2) * 0.3 + 0.5, y: Math.cos(time * 0.3 + 1) * 0.3 + 0.5, r: 0.7, color: isDark ? "rgba(15, 23, 42, 0.5)" : "rgba(255, 255, 255, 0.8)" }, // Deep/Light mask
            ];

            orbs.forEach(orb => {
                const x = orb.x * canvas.width;
                const y = orb.y * canvas.height;
                const radius = Math.max(canvas.width, canvas.height) * orb.r;

                const blobGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
                if (isDark) {
                    // Teal/Cyan glow
                    blobGradient.addColorStop(0, `rgba(20, 184, 166, 0.03)`); // Teal 500
                    blobGradient.addColorStop(1, `rgba(20, 184, 166, 0)`);
                } else {
                    // Slate/Blue glow
                    blobGradient.addColorStop(0, `rgba(51, 65, 85, 0.03)`); // Slate 700
                    blobGradient.addColorStop(1, `rgba(51, 65, 85, 0)`);
                }

                ctx.fillStyle = blobGradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            });

            // Subtle Noise Overlay for Texture (Optional, adds "premium" feel)
            // We'll skip per-pixel noise for performance, but add a very subtle grid or line overlay if needed.
            // For now, just the smooth gradient is cleaner.
        };

        animationFrameId = requestAnimationFrame(function animate() {
            draw();
            animationFrameId = requestAnimationFrame(animate);
        });

        return () => {
            window.removeEventListener("resize", resize);
            cancelAnimationFrame(animationFrameId);
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
