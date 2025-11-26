// components/contracts/LeaseManagement.tsx
import React, { useState } from 'react';
import type { Contract } from '../../types/contract';
import { contractApi } from '../../api/ContractAPI';
import { ContractList } from '../../components/contracts/ContractList';
import { Button } from '../../components/common/ui/Button';
import { ContractForm } from '../../components/contracts/ContractForm';
import { ContractDetail } from '../../components/contracts/ContractDetail';
import { TerminationModal } from '../../components/contracts/TerminationModal';


type ViewMode = 'list' | 'create' | 'edit' | 'view' | 'renew';

export const LeaseManagement: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewMode>('list');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [listRefreshKey, setListRefreshKey] = useState(0);
  const [showTerminationModal, setShowTerminationModal] = useState(false);
  const [contractToTerminate, setContractToTerminate] = useState<Contract | null>(null);

  const refreshList = () => setListRefreshKey(prev => prev + 1);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  // Contract Creation
  const handleCreateContract = async (formData: FormData) => {
    setLoading(true);
    try {
      await contractApi.create(formData);
      showMessage('success', 'Contract created successfully!');
      refreshList();
      setCurrentView('list');
    } catch (error: any) {
      console.error('Error creating contract:', error);
      showMessage('error', error.response?.data?.error || 'Failed to create contract');
    } finally {
      setLoading(false);
    }
  };

  // Contract Editing
  const handleEditContract = async (formData: FormData) => {
    if (!selectedContract) return;

    setLoading(true);
    try {
      await contractApi.update(selectedContract.id, formData);
      showMessage('success', `Contract ${selectedContract.contractNumber} updated successfully!`);
      refreshList();
      setCurrentView('list');
      setSelectedContract(null);
    } catch (error: any) {
      console.error('Error updating contract:', error);
      showMessage('error', error.response?.data?.error || 'Failed to update contract');
    } finally {
      setLoading(false);
    }
  };

  // Contract Renewal
  const handleRenewContract = async (formData: FormData) => {
    if (!selectedContract) return;

    setLoading(true);
    try {
      await contractApi.renew(selectedContract.id, formData);
      showMessage('success', `Contract ${selectedContract.contractNumber} renewed successfully!`);
      refreshList();
      setCurrentView('list');
      setSelectedContract(null);
    } catch (error: any) {
      console.error('Error renewing contract:', error);
      showMessage('error', error.response?.data?.error || 'Failed to renew contract');
    } finally {
      setLoading(false);
    }
  };

  // MMS-6: Contract Termination
  const handleTerminateContract = (contract: Contract) => {
    setContractToTerminate(contract);
    setShowTerminationModal(true);
  };

  const handleTerminationSuccess = (terminatedContract: Contract) => {
    showMessage('success', `Contract ${terminatedContract.contractNumber} terminated successfully!`);
    refreshList();
    setShowTerminationModal(false);
    setContractToTerminate(null);
    
    // If we're currently viewing the terminated contract, update the view
    if (selectedContract && selectedContract.id === terminatedContract.id) {
      setSelectedContract(terminatedContract);
    }
  };

  // Navigation Handlers
  const handleViewContract = (contract: Contract) => {
    setSelectedContract(contract);
    setCurrentView('view');
  };

  const handleEditContractView = (contract: Contract) => {
    setSelectedContract(contract);
    setCurrentView('edit');
  };

  const handleRenewContractView = (contract: Contract) => {
    setSelectedContract(contract);
    setCurrentView('renew');
  };

  const handleCreateNew = () => {
    setCurrentView('create');
    setSelectedContract(null);
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedContract(null);
  };

  const getViewTitle = () => {
    switch (currentView) {
      case 'create': return 'Create New Contract';
      case 'edit': return `Edit Contract ${selectedContract?.contractNumber}`;
      case 'renew': return `Renew Contract ${selectedContract?.contractNumber}`;
      case 'view': return `Contract Details - ${selectedContract?.contractNumber}`;
      default: return 'Contracts Management';
    }
  };

  const getViewDescription = () => {
    switch (currentView) {
      case 'create': return 'Fill in the details to create a new rental contract';
      case 'edit': return `Update contract details for ${selectedContract?.contractNumber}`;
      case 'renew': return `Renew contract ${selectedContract?.contractNumber} with new terms`;
      case 'view': return `Viewing details for contract ${selectedContract?.contractNumber}`;
      default: return 'Manage all rental contracts and lease agreements';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success/Error Messages */}
        {message && (
          <div className={`mb-6 p-4 rounded-md flex items-center ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <svg 
              className={`w-5 h-5 mr-3 ${
                message.type === 'success' ? 'text-green-400' : 'text-red-400'
              }`} 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              {message.type === 'success' ? (
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              ) : (
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              )}
            </svg>
            <span className="font-medium">{message.text}</span>
          </div>
        )}

        {/* Main Content */}
        {currentView === 'list' && (
          <ContractList
            key={listRefreshKey}
            onViewContract={handleViewContract}
            onEditContract={handleEditContractView}
            onRenewContract={handleRenewContractView}
            onTerminateContract={handleTerminateContract}
            onCreateContract={handleCreateNew}
          />
        )}

        {/* Form Views (Create, Edit, Renew) */}
        {(currentView === 'create' || currentView === 'edit' || currentView === 'renew') && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{getViewTitle()}</h1>
                  <p className="text-gray-600 mt-1">{getViewDescription()}</p>
                </div>
                <Button onClick={handleBackToList} variant="secondary">
                  Back to List
                </Button>
              </div>
            </div>

            <div className="p-6">
              <ContractForm
                onSubmit={
                  currentView === 'create' ? handleCreateContract :
                  currentView === 'edit' ? handleEditContract :
                  handleRenewContract
                }
                onCancel={handleBackToList}
                isLoading={loading}
                initialData={selectedContract || undefined}
                isRenewal={currentView === 'renew'}
                isEdit={currentView === 'edit'}
              />
            </div>
          </div>
        )}

        {/* Contract Detail View */}
        {currentView === 'view' && selectedContract && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{getViewTitle()}</h1>
                  <p className="text-gray-600 mt-1">{getViewDescription()}</p>
                </div>
                <Button onClick={handleBackToList} variant="secondary">
                  Back to List
                </Button>
              </div>
            </div>

            <div className="p-6">
              <ContractDetail
                contractId={selectedContract.id}
                onBack={handleBackToList}
                onEdit={handleEditContractView}
                onRenew={handleRenewContractView}
                onTerminate={handleTerminateContract}
              />
            </div>
          </div>
        )}

        {/* MMS-6: Termination Modal */}
        {showTerminationModal && contractToTerminate && (
          <TerminationModal
            isOpen={showTerminationModal}
            onClose={() => setShowTerminationModal(false)}
            onSuccess={handleTerminationSuccess}
            contract={contractToTerminate}
          />
        )}
      </div>
    </div>
  );
};

export default LeaseManagement;