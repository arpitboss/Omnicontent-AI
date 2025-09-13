import { cn } from "@/lib/utils";
import { forwardRef } from "react";

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "premium" | "floating";
  blur?: "sm" | "md" | "lg" | "xl";
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = "default", blur = "md", children, ...props }, ref) => {
    const variants = {
      default: "glass-effect",
      premium: "glass-effect-strong",
      floating: "glass-effect shadow-2xl hover:shadow-3xl transition-all duration-500",
    };

    const blurLevels = {
      sm: "backdrop-blur-sm",
      md: "backdrop-blur-xl",
      lg: "backdrop-blur-2xl", 
      xl: "backdrop-blur-strong",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl",
          variants[variant],
          blurLevels[blur],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = "GlassCard";

export { GlassCard };
