import React from 'react';
import type { TenantCategory, TenantSearchParams } from '../../types/tenant';

interface TenantSearchProps {
  searchParams: TenantSearchParams;
  categories: TenantCategory[];
  onSearchChange: (params: TenantSearchParams) => void;
  onSearch: () => void;
  onReset: () => void;
}

const TenantSearch: React.FC<TenantSearchProps> = ({
  searchParams,
  categories,
  onSearchChange,
  onSearch,
  onReset,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Apply max length validation based on field
    let processedValue = value;
    
    // Convert categoryId to number, keep others as string
    const finalValue = name === 'categoryId' 
      ? (value ? parseInt(value, 10) : undefined)
      : (value || undefined);
    
    onSearchChange({
      ...searchParams,
      [name]: finalValue,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  const handleReset = () => {
    onSearchChange({});
    onReset();
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Search Tenants</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Name Search */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Tenant Name
              </label>
              <span className="text-xs text-gray-500">
                {searchParams.name?.length || 0}/30
              </span>
            </div>
            <input
              type="text"
              id="name"
              name="name"
              value={searchParams.name || ''}
              onChange={handleChange}
              maxLength={30}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-[#1E40AF]"
              placeholder="Search by name"
            />
          </div>

          {/* Email Search */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <span className="text-xs text-gray-500">
                {searchParams.email?.length || 0}/30
              </span>
            </div>
            <input
              type="email"
              id="email"
              name="email"
              value={searchParams.email || ''}
              onChange={handleChange}
              maxLength={30}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-[#1E40AF]"
              placeholder="Search by email"
            />
          </div>

          {/* Phone Search */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone
              </label>
              <span className="text-xs text-gray-500">
                {searchParams.phone?.length || 0}/11
              </span>
            </div>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={searchParams.phone || ''}
              onChange={handleChange}
              maxLength={11}
              pattern="[0-9]*"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-[#1E40AF]"
              placeholder="Search by phone"
            />
          </div>

          {/* Category Search */}
          <div>
            <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="categoryId"
              name="categoryId"
              value={searchParams.categoryId || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-[#1E40AF]"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.categoryName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1E40AF]"
          >
            Reset
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-[#1E40AF] border border-transparent rounded-md shadow-sm hover:bg-[#1E3FAF] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1E40AF]"
          >
            Search
          </button>
        </div>
      </form>
    </div>
  );
};

export default TenantSearch;