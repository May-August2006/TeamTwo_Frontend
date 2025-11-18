// src/components/homepage/ContactSection.tsx
import React from 'react';

export const ContactSection: React.FC = () => {
  return (
    <section id="contact" className="py-16 bg-[#0D1B2A]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">Get In Touch</h2>
          <p className="text-lg text-[#E5E8EB] opacity-80">Have questions? Our team is here to help you find the perfect space.</p>
        </div>
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg border border-[#E5E8EB] p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-center">
            <div className="p-6 rounded-lg bg-[#F8F9FA] hover:bg-[#E5E8EB] transition-colors duration-200">
              <div className="text-[#D32F2F] mb-3">
                <svg className="w-10 h-10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h3 className="font-semibold text-[#0D1B2A] mb-2">Call Us</h3>
              <p className="text-[#0D1B2A] opacity-80">+95 9 123 456789</p>
            </div>
            <div className="p-6 rounded-lg bg-[#F8F9FA] hover:bg-[#E5E8EB] transition-colors duration-200">
              <div className="text-[#D32F2F] mb-3">
                <svg className="w-10 h-10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-[#0D1B2A] mb-2">Email Us</h3>
              <p className="text-[#0D1B2A] opacity-80">info@seingayhar.com</p>
            </div>
          </div>
          <div className="mt-8 text-center">
            <p className="text-[#0D1B2A] opacity-70 text-sm">
              Visit us at: 123 Mall Road, Yangon
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};