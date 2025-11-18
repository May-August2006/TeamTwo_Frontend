import React from 'react';

interface SectionPlaceholderProps {
  title: string;
}

const SectionPlaceholder: React.FC<SectionPlaceholderProps> = ({ title }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-500">
        {title} section content will be implemented here
      </p>
    </div>
  );
};

export default SectionPlaceholder;