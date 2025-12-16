import React, { useState } from 'react';
import type {  Contract, Lease } from '../../types/contract';
import { contractApi } from '../../api/ContractAPI';
import { ContractList } from '../../components/contracts/ContractList';
import { Button } from '../../components/common/ui/Button';
import { ContractForm } from '../../components/contracts/ContractForm';
import { ContractDetail } from '../../components/contracts/ContractDetail';
import { TerminationModal } from '../../components/contracts/TerminationModal';
import { useNotification } from '../../context/NotificationContext';

type ViewMode = 'list' | 'view';

export const LeaseManagement: React.FC = () => {
  const { showSuccess, showError, showInfo } = useNotification();
  
  const [currentView, setCurrentView] = useState<ViewMode>('list');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [listRefreshKey, setListRefreshKey] = useState(0);
  
  // Modal states
  const [showContractForm, setShowContractForm] = useState(false);
  const [contractFormMode, setContractFormMode] = useState<'create' | 'edit' | 'renew'>('create');
  const [contractToEdit, setContractToEdit] = useState<Contract | null>(null);
  const [contractToRenew, setContractToRenew] = useState<Contract | null>(null);
  
  const [showTerminationModal, setShowTerminationModal] = useState(false);
  const [contractToTerminate, setContractToTerminate] = useState<Contract | null>(null);
  
  // Loading states
  const [loading, setLoading] = useState({
    create: false,
    edit: false,
    renew: false,
    terminate: false
  });

  const refreshList = () => setListRefreshKey(prev => prev + 1);

  //  Lease Creation
  const handleCreateContract = async (formData: FormData) => {
    setLoading(prev => ({ ...prev, create: true }));
    try {
      const response = await contractApi.create(formData);
      showSuccess(`Contract created successfully!  Lease Number: ${response.data?.contractNumber || 'N/A'}`);
      refreshList();
      setShowContractForm(false);
      setContractToEdit(null);
      return Promise.resolve(); // Indicate success
    } catch (error: any) {
      console.error('Error creating contract:', error);
      
      // Let ContractForm handle the error, just re-throw it
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, create: false }));
    }
  };

  //  Lease Editing
  const handleEditContract = async (formData: FormData) => {
    if (!contractToEdit) {
      showError('No Lease selected for editing');
      return Promise.reject(new Error('No  Lease selected'));
    }

    setLoading(prev => ({ ...prev, edit: true }));
    try {
      const response = await contractApi.update(contractToEdit.id, formData);
      showSuccess(`Contract ${contractToEdit.contractNumber} updated successfully!`);
      refreshList();
      setShowContractForm(false);
      setContractToEdit(null);
      
      // If we're viewing this contract, update the view
      if (currentView === 'view' && selectedContract?.id === contractToEdit.id) {
        loadContractForView(contractToEdit.id);
      }
      
      return Promise.resolve(); // Indicate success
    } catch (error: any) {
      console.error('Error updating contract:', error);
      
      // Let ContractForm handle the error, just re-throw it
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, edit: false }));
    }
  };

  //  Lease Renewal
  const handleRenewContract = async (formData: FormData) => {
    if (!contractToRenew) {
      showError('No  Lease selected for renewal');
      return Promise.reject(new Error('No  Lease selected'));
    }

    setLoading(prev => ({ ...prev, renew: true }));
    try {
      const response = await contractApi.renew(contractToRenew.id, formData);
      showSuccess(`Contract ${contractToRenew.contractNumber} renewed successfully!`);
      refreshList();
      setShowContractForm(false);
      setContractToRenew(null);
      
      return Promise.resolve(); // Indicate success
    } catch (error: any) {
      console.error('Error renewing contract:', error);
      
      // Let ContractForm handle the error, just re-throw it
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, renew: false }));
    }
  };

  //  Lease Termination
  const handleTerminateContract = (contract: Contract) => {
    setContractToTerminate(contract);
    setShowTerminationModal(true);
  };

  const handleTerminationConfirm = async (terminationData: any) => {
    if (!contractToTerminate) return;

    setLoading(prev => ({ ...prev, terminate: true }));
    try {
      const response = await contractApi.terminateWithDetails(contractToTerminate.id, terminationData);
      
      showSuccess(`Contract ${contractToTerminate.contractNumber} terminated successfully!`);
      refreshList();
      setShowTerminationModal(false);
      setContractToTerminate(null);
      
      // If we're viewing this contract, update the view
      if (currentView === 'view' && selectedContract?.id === contractToTerminate.id) {
        setSelectedContract(response.data.contract);
      }
      
      // If we're in list view, show info about unit availability
      if (response.data.unitReleased) {
        showInfo(`Unit ${contractToTerminate.unit?.unitNumber || 'N/A'} has been marked as available.`);
      }
    } catch (error: any) {
      console.error('Error terminating contract:', error);
      
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        showError(errorData.error || 'Failed to terminate contract');
      } else if (error.response?.status === 404) {
        showError('Contract not found. It may have been deleted.');
      } else {
        showError('Failed to terminate contract. Please try again.');
      }
    } finally {
      setLoading(prev => ({ ...prev, terminate: false }));
    }
  };

  // Load  Lease for detail view
  const loadContractForView = async (contractId: number) => {
    try {
      const response = await contractApi.getById(contractId);
      setSelectedContract(response.data);
    } catch (error: any) {
      console.error('Error loading contract:', error);
      showError('Failed to load  Lease details. Please try again.');
    }
  };

  // Navigation Handlers
  const handleViewContract = async (contract: Contract) => {
    setSelectedContract(contract);
    setCurrentView('view');
  };

  const handleEditContractView = (contract: Contract) => {
    setContractToEdit(contract);
    setContractFormMode('edit');
    setShowContractForm(true);
  };

  const handleRenewContractView = (contract: Contract) => {
    setContractToRenew(contract);
    setContractFormMode('renew');
    setShowContractForm(true);
  };

  const handleCreateNew = () => {
    setContractToEdit(null);
    setContractToRenew(null);
    setContractFormMode('create');
    setShowContractForm(true);
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedContract(null);
  };

  const handleCloseContractForm = () => {
    setShowContractForm(false);
    setContractToEdit(null);
    setContractToRenew(null);
  };

  const handleCloseTerminationModal = () => {
    setShowTerminationModal(false);
    setContractToTerminate(null);
  };

  const getCurrentLoading = () => {
    if (loading.create) return 'create';
    if (loading.edit) return 'edit';
    if (loading.renew) return 'renew';
    if (loading.terminate) return 'terminate';
    return null;
  };

  const getFormInitialData = () => {
    if (contractFormMode === 'edit' && contractToEdit) {
      return contractToEdit;
    }
    if (contractFormMode === 'renew' && contractToRenew) {
      return contractToRenew;
    }
    return undefined;
  };

  const getFormTitle = () => {
    switch (contractFormMode) {
      case 'create': return 'Create New Contract';
      case 'edit': return `Edit  Lease ${contractToEdit?.contractNumber}`;
      case 'renew': return `Renew  Lease ${contractToRenew?.contractNumber}`;
      default: return 'Contract Form';
    }
  };

  const getViewTitle = () => {
    if (currentView === 'view' && selectedContract) {
      return `Lease Details - ${selectedContract.contractNumber}`;
    }
    return 'Leases Management';
  };

  const getViewDescription = () => {
    if (currentView === 'view' && selectedContract) {
      return `Viewing details for  Lease ${selectedContract.contractNumber}`;
    }
    return 'Manage all rental contracts and lease agreements';
  };

  const handleContractFormSubmit = async (formData: FormData) => {
    try {
      if (contractFormMode === 'create') {
        await handleCreateContract(formData);
      } else if (contractFormMode === 'edit') {
        await handleEditContract(formData);
      } else if (contractFormMode === 'renew') {
        await handleRenewContract(formData);
      }
      // If successful, the form will be closed in the respective handler
    } catch (error) {
      // Error is handled by ContractForm component
      // The form will stay open for user to fix errors
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header for Detail View */}
        {currentView === 'view' && (
          <div className="mb-6 bg-white rounded-xl shadow-sm border border-stone-200">
            <div className="p-6 border-b border-stone-200">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-stone-900">{getViewTitle()}</h1>
                  <p className="text-stone-600 mt-1">{getViewDescription()}</p>
                </div>
                <Button onClick={handleBackToList} variant="secondary">
                  Back to List
                </Button>
              </div>
            </div>
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

        {/*  Lease Detail View */}
        {currentView === 'view' && selectedContract && (
          <div className="bg-white rounded-xl shadow-sm border border-stone-200">
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

        {/*  Lease Form Modal */}
        {showContractForm && (
          <ContractForm
            isOpen={showContractForm}
            onSubmit={handleContractFormSubmit}
            onClose={handleCloseContractForm}
            isLoading={
              (contractFormMode === 'create' && loading.create) ||
              (contractFormMode === 'edit' && loading.edit) ||
              (contractFormMode === 'renew' && loading.renew)
            }
            initialData={getFormInitialData()}
            isRenewal={contractFormMode === 'renew'}
            isEdit={contractFormMode === 'edit'}
          />
        )}

        {/* Termination Modal */}
        {showTerminationModal && contractToTerminate && (
          <TerminationModal
            isOpen={showTerminationModal}
            onClose={handleCloseTerminationModal}
            onSuccess={handleTerminationConfirm}
            contract={contractToTerminate}
            isLoading={loading.terminate}
          />
        )}
      </div>
    </div>
  );
};

export default LeaseManagement;