// src/components/homepage/FeaturesSection.tsx
import React from 'react';

export const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: "📍",
      title: "Prime Location",
      description: "High-traffic areas with excellent visibility"
    },
    {
      icon: "🛡️",
      title: "Secure Environment",
      description: "24/7 security and professional management"
    },
    {
      icon: "⚡",
      title: "Modern Facilities",
      description: "State-of-the-art infrastructure and utilities"
    }
  ];

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-[#0F172A] mb-3">
            Why Choose Our Mall?
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            Premium features designed for your business success
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="bg-white rounded-lg border border-gray-200 p-5 hover:border-[#1E40AF] hover:shadow-md transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#1E40AF] to-[#3B82F6] flex items-center justify-center mb-4">
                <div className="text-xl text-white">
                  {feature.icon}
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};