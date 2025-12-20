import React from 'react';

interface InactiveTenantSearchProps {
  searchName: string;
  onSearchNameChange: (name: string) => void;
  onSearch: () => void;
  onReset: () => void;
  loading?: boolean;
}

const InactiveTenantSearch: React.FC<InactiveTenantSearchProps> = ({
  searchName,
  onSearchNameChange,
  onSearch,
  onReset,
  loading = false,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Limit to 30 characters
    if (value.length <= 30) {
      onSearchNameChange(value);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Inactive Tenants</h3>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="inactive-search" className="block text-sm font-medium text-gray-700">
              Tenant Name
            </label>
            <span className="text-xs text-gray-500">
              {searchName.length}/30
            </span>
          </div>
          <input
            type="text"
            id="inactive-search"
            value={searchName}
            onChange={handleChange}
            maxLength={30}
            placeholder="Search by tenant name..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-[#1E40AF]"
            disabled={loading}
          />
        </div>
        <div className="flex space-x-2 self-end">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-[#1E40AF] text-white rounded-md hover:bg-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Searching...
              </div>
            ) : (
              'Search'
            )}
          </button>
          <button
            type="button"
            onClick={onReset}
            disabled={loading}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
};

export default InactiveTenantSearch;