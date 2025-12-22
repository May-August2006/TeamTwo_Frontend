// src/components/homepage/ContactSection.tsx
import React from 'react';

export const ContactSection: React.FC = () => {
  return (
    <section id="contact" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#0F172A] mb-4">
            Get In Touch
          </h2>
          <p className="text-lg text-[#64748B] max-w-2xl mx-auto">
            Ready to find your perfect retail space? Contact our team today.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-6 text-center hover:shadow-md transition-shadow duration-300">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#1E40AF] to-[#3B82F6] flex items-center justify-center mb-4 mx-auto">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h3 className="font-bold text-[#0F172A] mb-2">Call Us</h3>
              <a 
                href="tel:+959123456789" 
                className="text-[#1E40AF] hover:text-[#1E3A8A] font-medium transition-colors duration-300 block"
              >
                +95 9 123 456789
              </a>
              <p className="text-sm text-[#94A3B8] mt-1">Mon-Fri 9AM-6PM</p>
            </div>

            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-6 text-center hover:shadow-md transition-shadow duration-300">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#1E40AF] to-[#3B82F6] flex items-center justify-center mb-4 mx-auto">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-bold text-[#0F172A] mb-2">Email Us</h3>
              <a 
                href="mailto:info@seingayhar.com" 
                className="text-[#1E40AF] hover:text-[#1E3A8A] font-medium transition-colors duration-300 block"
              >
                info@seingayhar.com
              </a>
              <p className="text-sm text-[#94A3B8] mt-1">Response within 24 hours</p>
            </div>

            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-6 text-center hover:shadow-md transition-shadow duration-300">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#1E40AF] to-[#3B82F6] flex items-center justify-center mb-4 mx-auto">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-[#0F172A] mb-2">Visit Us</h3>
              <p className="text-[#1E40AF] font-medium">123 Mall Road, Yangon</p>
              <p className="text-sm text-[#94A3B8] mt-1">Get directions</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-[#1E40AF]/5 to-[#3B82F6]/5 border border-[#1E40AF]/20 rounded-xl p-6 text-center">
            <h3 className="text-xl font-bold text-[#0F172A] mb-3">Business Hours</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <div className="font-medium text-[#1E40AF]">Monday - Friday</div>
                <div className="text-[#64748B]">9:00 AM - 9:00 PM</div>
              </div>
              <div>
                <div className="font-medium text-[#1E40AF]">Saturday - Sunday</div>
                <div className="text-[#64748B]">10:00 AM - 10:00 PM</div>
              </div>
            </div>
            <p className="text-sm text-[#64748B]">
              Visit our leasing office during business hours for personalized assistance.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};