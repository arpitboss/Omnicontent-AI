"use client";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import React, { useEffect, useState } from "react";

export const Meteors = ({
  number,
  className,
}: {
  number?: number;
  className?: string;
}) => {
  const [meteors, setMeteors] = useState<Array<{ id: number; left: number; delay: number; duration: number }>>([]);
  const meteorCount = number || 20;

  useEffect(() => {
    // Generate random values only on the client
    const generated = new Array(meteorCount).fill(true).map((_, idx) => ({
      id: idx,
      left: idx * (800 / meteorCount) - 400,
      delay: Math.random() * 5,
      duration: Math.floor(Math.random() * (10 - 5) + 5),
    }));
    setMeteors(generated);
  }, [meteorCount]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {meteors.map((meteor) => (
        <span
          key={"meteor" + meteor.id}
          className={cn(
            "animate-meteor-effect absolute h-0.5 w-0.5 rotate-[45deg] rounded-[9999px] bg-slate-500 shadow-[0_0_0_1px_#ffffff10]",
            "before:absolute before:top-1/2 before:h-[1px] before:w-[50px] before:-translate-y-[50%] before:transform before:bg-gradient-to-r before:from-[#64748b] before:to-transparent before:content-['']",
            className,
          )}
          style={{
            top: "-40px",
            left: meteor.left + "px",
            animationDelay: meteor.delay + "s",
            animationDuration: meteor.duration + "s",
          }}
        ></span>
      ))}
    </motion.div>
  );
};
