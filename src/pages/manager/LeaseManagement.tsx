// pages/ContractsPage.tsx
import React, { useState } from 'react';
import type { Contract, CreateContractRequest } from '../../types/contract';
import { contractApi } from '../../api/ContractAPI';
import { ContractList } from '../../components/contracts/ContractList';
import { Button } from '../../components/common/ui/Button';
import { ContractForm } from '../../components/contracts/ContractForm';
import { ContractDetail } from '../../components/contracts/ContractDetail';


type ViewMode = 'list' | 'create' | 'edit' | 'view';

export const LeaseManagement: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewMode>('list');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleCreateContract = async (contractData: CreateContractRequest) => {
    setLoading(true);
    try {
      await contractApi.create(contractData);
      showMessage('success', 'Contract created successfully!');
      setCurrentView('list');
    } catch (error: any) {
      console.error('Error creating contract:', error);
      showMessage('error', error.response?.data?.error || 'Failed to create contract');
    } finally {
      setLoading(false);
    }
  };

  const handleViewContract = (contract: Contract) => {
    setSelectedContract(contract);
    setCurrentView('view');
  };

  const handleEditContract = (contract: Contract) => {
    setSelectedContract(contract);
    setCurrentView('edit');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedContract(null);
  };

  const handleCreateNew = () => {
    setCurrentView('create');
    setSelectedContract(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Message Alert */}
        {message && (
          <div className={`mb-6 p-4 rounded-md ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <div className="flex items-center">
              <svg className={`w-5 h-5 mr-2 ${
                message.type === 'success' ? 'text-green-400' : 'text-red-400'
              }`} fill="currentColor" viewBox="0 0 20 20">
                {message.type === 'success' ? (
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                )}
              </svg>
              {message.text}
            </div>
          </div>
        )}

        {currentView === 'list' && (
          <ContractList
            onViewContract={handleViewContract}
            onEditContract={handleEditContract}
            onRenewContract={handleEditContract} // You can implement renew logic separately
            onTerminateContract={(contract) => {
              // Implement terminate logic
              console.log('Terminate contract:', contract);
            }}
            onCreateContract={handleCreateNew}
          />
        )}

        {currentView === 'create' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Create New Contract</h1>
                  <p className="text-gray-600 mt-1">Fill in the details to create a new rental contract</p>
                </div>
                <Button
                  onClick={handleBackToList}
                  variant="secondary"
                >
                  Back to List
                </Button>
              </div>
            </div>
            <div className="p-6">
              <ContractForm
                onSubmit={handleCreateContract}
                onCancel={handleBackToList}
                isLoading={loading}
              />
            </div>
          </div>
        )}

        {currentView === 'view' && selectedContract && (
          <ContractDetail
            contractId={selectedContract.id}
            onBack={handleBackToList}
            onEdit={handleEditContract}
            onRenew={handleEditContract}
            onTerminate={(contract) => {
              // Implement terminate logic
              console.log('Terminate contract:', contract);
            }}
          />
        )}

        {currentView === 'edit' && selectedContract && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Edit Contract</h1>
                  <p className="text-gray-600 mt-1">Update contract details for {selectedContract.contractNumber}</p>
                </div>
                <Button
                  onClick={handleBackToList}
                  variant="secondary"
                >
                  Back to List
                </Button>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-600 text-center py-8">
                Edit form implementation would go here...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaseManagement;