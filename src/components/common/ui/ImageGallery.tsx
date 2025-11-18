// src/components/common/ui/ImageGallery.tsx
import React, { useState } from 'react';

interface ImageGalleryProps {
  images: string[];
  alt: string;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ images, alt }) => {
  const [selectedImage, setSelectedImage] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="bg-[#E5E8EB] rounded-lg h-64 flex items-center justify-center">
        <div className="text-center text-[#0D1B2A] opacity-60">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p>No images available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="bg-[#E5E8EB] rounded-lg overflow-hidden border border-[#0D1B2A]/10">
        <img
          src={images[selectedImage]}
          alt={`${alt} - Image ${selectedImage + 1}`}
          className="w-full h-64 object-cover"
        />
      </div>

      {/* Thumbnail Gallery */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={`bg-[#E5E8EB] rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                selectedImage === index ? 'border-[#D32F2F]' : 'border-transparent hover:border-[#0D1B2A]/30'
              }`}
            >
              <img
                src={image}
                alt={`${alt} - Thumbnail ${index + 1}`}
                className="w-full h-16 object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};