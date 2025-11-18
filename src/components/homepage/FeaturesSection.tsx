// src/components/homepage/FeaturesSection.tsx
import React from 'react';

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => (
  <div className="text-center p-8 bg-white rounded-lg shadow-sm border border-[#E5E8EB] hover:shadow-lg hover:border-[#D32F2F]/20 transition-all duration-300 group">
    <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">
      {icon}
    </div>
    <h3 className="text-xl font-semibold text-[#0D1B2A] mb-4 group-hover:text-[#D32F2F] transition-colors duration-200">
      {title}
    </h3>
    <p className="text-[#0D1B2A] opacity-80 leading-relaxed">
      {description}
    </p>
  </div>
);

export const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: "📍",
      title: "Prime Location",
      description: "High-traffic areas with excellent visibility and accessibility for maximum customer reach."
    },
    {
      icon: "🛡️",
      title: "Secure Environment",
      description: "24/7 security surveillance and professional management for your peace of mind."
    },
    {
      icon: "⚡",
      title: "Modern Facilities",
      description: "State-of-the-art infrastructure including high-speed internet and modern utilities."
    }
  ];

  return (
    <section className="py-16 bg-[#E5E8EB]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[#0D1B2A] mb-4">
            Why Choose Our Mall?
          </h2>
          <p className="text-lg text-[#0D1B2A] opacity-80 max-w-2xl mx-auto">
            Premium features designed for your business success and growth
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
};