import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

export interface AnimatedButtonProps extends ButtonProps {
  animation?: "shine" | "glow" | "float" | "scale" | "shimmer";
  glowColor?: string;
}

const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ className, animation = "shine", glowColor, children, ...props }, ref) => {
    const animationClasses = {
      shine: "shine-effect",
      glow: "animate-glow",
      float: "animate-float",
      scale: "hover:scale-105 transition-transform duration-300",
      shimmer: "animate-shimmer",
    };

    return (
      <Button
        ref={ref}
        className={cn(
          "relative overflow-hidden transition-all duration-300",
          animationClasses[animation],
          animation === "glow" && glowColor && `hover:shadow-[0_0_20px_${glowColor}]`,
          className
        )}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

AnimatedButton.displayName = "AnimatedButton";

export { AnimatedButton };
