/** @format */

import React from "react";
import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  path?: string;
}

export const Breadcrumb: React.FC<{ items: BreadcrumbItem[] }> = ({
  items,
}) => {
  return (
    <div className="flex items-center text-sm text-stone-500 mb-4">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center">
          {idx > 0 && <ChevronRight className="w-4 h-4 mx-2 text-stone-400" />}
          {item.path ? (
            <a href={item.path} className="hover:text-red-600 font-medium">
              {item.label}
            </a>
          ) : (
            <span className="font-semibold text-stone-800">{item.label}</span>
          )}
        </div>
      ))}
    </div>
  );
};
