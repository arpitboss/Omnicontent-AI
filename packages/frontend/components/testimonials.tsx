import { Star, Quote } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";

const testimonials = [
  {
    name: "Alex Chen",
    role: "Content Creator",
    avatar: "AC",
    rating: 5,
    content: "OmniContent AI has revolutionized how I create content. What used to take hours now takes minutes, and the quality is incredible.",
    gradient: "from-chart-1 to-chart-2"
  },
  {
    name: "Sarah Martinez", 
    role: "Marketing Director",
    avatar: "SM",
    rating: 5,
    content: "The translation feature is a game-changer. I can now reach global audiences effortlessly with accurate, context-aware translations.",
    gradient: "from-chart-2 to-chart-3"
  },
  {
    name: "Michael Johnson",
    role: "Podcast Host", 
    avatar: "MJ",
    rating: 5,
    content: "As a podcaster, this tool has streamlined my entire workflow. From recording to publishing across all platforms - it's seamless.",
    gradient: "from-chart-3 to-chart-4"
  },
  {
    name: "Emily Rodriguez",
    role: "Social Media Manager",
    avatar: "ER", 
    rating: 5,
    content: "The AI-generated social media content is spot-on every time. It understands our brand voice and creates engaging posts instantly.",
    gradient: "from-chart-4 to-chart-5"
  },
  {
    name: "David Kim",
    role: "Video Producer",
    avatar: "DK",
    rating: 5, 
    content: "Real-time processing is incredible. I can see my content being transformed as it uploads. The efficiency gains are massive.",
    gradient: "from-chart-5 to-primary"
  },
  {
    name: "Lisa Thompson",
    role: "Educational Content Creator",
    avatar: "LT",
    rating: 5,
    content: "Creating educational content in multiple languages has never been easier. The accuracy and context preservation is remarkable.",
    gradient: "from-primary to-secondary"
  }
];

const companies = [
  "TechCorp", "MediaFlow", "Creator+", "StreamLab", "Podify", "ContentAI", 
  "VoiceGen", "TransLingo", "AICreate", "FlowMedia", "ContentPro", "SmartGen"
];

export function TestimonialsSection() {
  return (
    <section className="py-24 relative">
      <div className="dot-pattern absolute inset-0 opacity-20" />
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center space-y-4 mb-16 animate-fade-in">
          <h2 className="text-5xl font-bold gradient-text text-shadow-lg">
            Trusted by Content Creators
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join thousands of creators who are scaling their content with AI
          </p>
        </div>

        {/* Company Logos */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 items-center justify-center mb-20">
          {companies.map((company, index) => (
            <GlassCard
              key={company}
              className="p-6 flex items-center justify-center h-20 opacity-60 hover:opacity-100 transition-all duration-300 group"
              data-testid={`company-${index}`}
            >
              <span className="text-lg font-semibold text-muted-foreground group-hover:gradient-text transition-all duration-300">
                {company}
              </span>
            </GlassCard>
          ))}
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <GlassCard
              key={testimonial.name}
              variant="premium"
              className="p-8 card-3d group hover:shadow-2xl transition-all duration-500 relative overflow-hidden"
              style={{ animationDelay: `${index * 0.1}s` }}
              data-testid={`testimonial-${index}`}
            >
              {/* Quote Icon */}
              <div className="absolute top-6 right-6 opacity-10 group-hover:opacity-20 transition-opacity duration-300">
                <Quote className="w-8 h-8" />
              </div>
              
              {/* Rating */}
              <div className="flex items-center space-x-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 fill-chart-3 text-chart-3"
                  />
                ))}
              </div>
              
              {/* Content */}
              <p className="text-muted-foreground leading-relaxed mb-6 relative z-10">
                "{testimonial.content}"
              </p>
              
              {/* Author */}
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 bg-gradient-to-br ${testimonial.gradient} rounded-full flex items-center justify-center text-white font-semibold shadow-lg`}>
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-semibold text-foreground">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}
