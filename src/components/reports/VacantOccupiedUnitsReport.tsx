// components/reports/VacantOccupiedUnitsReport.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { unitApi } from '../../api/UnitAPI';
import { contractApi } from '../../api/ContractAPI';
import type { Unit } from '../../types/unit';
import type { Contract } from '../../types/contract';
import type { OccupancyStats, BuildingOccupancy, FloorOccupancy, RoomStatus } from '../../types/occupancy';
import { Button } from '../common/ui/Button';
import { LoadingSpinner } from '../common/ui/LoadingSpinner';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface VacantOccupiedUnitsReportProps {
  onBack?: () => void;
}

export const VacantOccupiedUnitsReport: React.FC<VacantOccupiedUnitsReportProps> = ({ onBack }) => {
  const [rooms, setRooms] = useState<Unit[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'buildings' | 'floors' | 'rooms'>('overview');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load all rooms and contracts in parallel
      const [roomsResponse, contractsResponse] = await Promise.all([
        unitApi.getAll(),
        contractApi.getAll()
      ]);

      const roomsData = Array.isArray(roomsResponse.data) ? roomsResponse.data : [];
      const contractsData = Array.isArray(contractsResponse.data) ? contractsResponse.data : [];

      setRooms(roomsData);
      setContracts(contractsData);

    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load occupancy data');
    } finally {
      setLoading(false);
    }
  };

  // CORRECTED: Get branch name from the nested structure
  const getBranchName = (room: Unit): string => {
    return room.level?.building?.branch?.branchName || 'Main Branch';
  };

  // Calculate overall occupancy statistics
  const occupancyStats = useMemo((): OccupancyStats => {
    const totalUnits = rooms.length;
    const occupiedUnits = contracts.filter(contract => 
      contract.contractStatus === 'ACTIVE' || contract.contractStatus === 'EXPIRING'
    ).length;
    const vacantUnits = totalUnits - occupiedUnits;
    const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;
    const vacancyRate = 100 - occupancyRate;

    return {
      totalUnits,
      occupiedUnits,
      vacantUnits,
      occupancyRate,
      vacancyRate
    };
  }, [rooms, contracts]);

  // Building-wise occupancy
  const buildingOccupancy = useMemo((): BuildingOccupancy[] => {
    const buildingsMap = new Map<string, BuildingOccupancy>();
    
    rooms.forEach(room => {
      const buildingName = room.level?.building?.buildingName || 'Unknown Building';
      const buildingId = room.level?.building?.id || 0;
      const branchName = getBranchName(room);
      const key = `${buildingId}-${buildingName}`;
      
      if (!buildingsMap.has(key)) {
        buildingsMap.set(key, {
          buildingId,
          buildingName,
          branchName,
          totalUnits: 0,
          occupiedUnits: 0,
          vacantUnits: 0,
          occupancyRate: 0
        });
      }
      
      const building = buildingsMap.get(key)!;
      building.totalUnits++;
      
      // Check if room is occupied by active contract
      const isOccupied = contracts.some(contract => 
        contract.unit?.id === room.id && 
        (contract.contractStatus === 'ACTIVE' || contract.contractStatus === 'EXPIRING')
      );
      
      if (isOccupied) {
        building.occupiedUnits++;
      } else {
        building.vacantUnits++;
      }
    });
    
    // Calculate occupancy rates
    return Array.from(buildingsMap.values()).map(building => ({
      ...building,
      occupancyRate: building.totalUnits > 0 ? (building.occupiedUnits / building.totalUnits) * 100 : 0
    })).sort((a, b) => a.buildingName.localeCompare(b.buildingName));
  }, [rooms, contracts]);

  // Floor-wise occupancy
  const floorOccupancy = useMemo((): FloorOccupancy[] => {
    const floorsMap = new Map<string, FloorOccupancy>();
    
    rooms.forEach(room => {
      const floorName = room.level?.levelName || 'Unknown Floor';
      const floorId = room.level?.id || 0;
      const buildingName = room.level?.building?.buildingName || 'Unknown Building';
      const branchName = getBranchName(room);
      const key = `${floorId}-${floorName}-${buildingName}`;
      
      if (!floorsMap.has(key)) {
        floorsMap.set(key, {
          floorId,
          floorName,
          buildingName,
          totalUnits: 0,
          occupiedUnits: 0,
          vacantUnits: 0,
          occupancyRate: 0
        });
      }
      
      const floor = floorsMap.get(key)!;
      floor.totalUnits++;
      
      // Check if room is occupied by active contract
      const isOccupied = contracts.some(contract => 
        contract.unit?.id === room.id && 
        (contract.contractStatus === 'ACTIVE' || contract.contractStatus === 'EXPIRING')
      );
      
      if (isOccupied) {
        floor.occupiedUnits++;
      } else {
        floor.vacantUnits++;
      }
    });
    
    // Calculate occupancy rates and sort
    return Array.from(floorsMap.values()).map(floor => ({
      ...floor,
      occupancyRate: floor.totalUnits > 0 ? (floor.occupiedUnits / floor.totalUnits) * 100 : 0
    })).sort((a, b) => {
      // Sort by building name, then by floor name
      const buildingCompare = a.buildingName.localeCompare(b.buildingName);
      if (buildingCompare !== 0) return buildingCompare;
      return a.floorName.localeCompare(b.floorName);
    });
  }, [rooms, contracts]);

  // Detailed room status
  const roomStatus = useMemo((): RoomStatus[] => {
    return rooms.map(room => {
      const activeContract = contracts.find(contract => 
        contract.unit?.id === room.id && 
        (contract.contractStatus === 'ACTIVE' || contract.contractStatus === 'EXPIRING')
      );
      
      return {
        roomId: room.id,
        roomNumber: room.unitNumber,
        roomType: room.roomType?.typeName || 'Unknown',
        floor: room.level?.levelName || 'Unknown',
        building: room.level?.building?.buildingName || 'Unknown',
        branch: getBranchName(room),
        status: (activeContract ? 'OCCUPIED' : 'VACANT') as 'OCCUPIED' | 'VACANT',
        currentTenant: activeContract?.tenant?.tenantName,
        contractEndDate: activeContract?.endDate,
        size: room.unitSpace || 0,
        rentalFee: room.rentalFee || 0,
        isAvailable: room.isAvailable
      };
    }).sort((a, b) => a.roomNumber.localeCompare(b.roomNumber));
  }, [rooms, contracts]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US').format(amount) + ' MMK';
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      });
    } catch {
      return '-';
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      OCCUPIED: { color: 'bg-green-100 text-green-800', label: 'Occupied' },
      VACANT: { color: 'bg-blue-100 text-blue-800', label: 'Vacant' }
    }[status] || { color: 'bg-gray-100 text-gray-800', label: status };
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

 // Export to Excel function
const exportToExcel = () => {
  // Prepare data for all tabs
  const overviewData = [{
    'Total Units': occupancyStats.totalUnits,
    'Occupied Units': occupancyStats.occupiedUnits,
    'Vacant Units': occupancyStats.vacantUnits,
    'Occupancy Rate': `${occupancyStats.occupancyRate.toFixed(1)}%`,
    'Vacancy Rate': `${occupancyStats.vacancyRate.toFixed(1)}%`,
    'Generated Date': new Date().toLocaleDateString()
  }];

  const buildingData = buildingOccupancy.map(building => ({
    'Building Name': building.buildingName,
    'Branch': building.branchName,
    'Total Units': building.totalUnits,
    'Occupied Units': building.occupiedUnits,
    'Vacant Units': building.vacantUnits,
    'Occupancy Rate': `${building.occupancyRate.toFixed(1)}%`
  }));

  const floorData = floorOccupancy.map(floor => ({
    'Floor Name': floor.floorName,
    'Building': floor.buildingName,
    'Total Units': floor.totalUnits,
    'Occupied Units': floor.occupiedUnits,
    'Vacant Units': floor.vacantUnits,
    'Occupancy Rate': `${floor.occupancyRate.toFixed(1)}%`
  }));

  const roomData = roomStatus.map(room => ({
    'Room Number': room.roomNumber,
    'Room Type': room.roomType,
    'Building': room.building,
    'Floor': room.floor,
    'Branch': room.branch,
    'Size (sqm)': room.size,
    'Rental Fee (MMK)': room.rentalFee,
    'Status': room.status === 'OCCUPIED' ? 'Occupied' : 'Vacant',
    'Current Tenant': room.currentTenant || '',
    'Contract End Date': room.contractEndDate ? new Date(room.contractEndDate) : ''
  }));

  // Create workbook with multiple sheets
  const workbook = XLSX.utils.book_new();

  // Overview sheet
  const overviewSheet = XLSX.utils.json_to_sheet(overviewData);
  XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Overview');

  // Buildings sheet
  const buildingSheet = XLSX.utils.json_to_sheet(buildingData);
  XLSX.utils.book_append_sheet(workbook, buildingSheet, 'Buildings');

  // Floors sheet
  const floorSheet = XLSX.utils.json_to_sheet(floorData);
  XLSX.utils.book_append_sheet(workbook, floorSheet, 'Floors');

  // Rooms sheet
  const roomSheet = XLSX.utils.json_to_sheet(roomData);
  XLSX.utils.book_append_sheet(workbook, roomSheet, 'Rooms');

  // Set column widths for better formatting
  const buildingColWidths = [
    { wch: 20 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 }
  ];
  buildingSheet['!cols'] = buildingColWidths;

  const roomColWidths = [
    { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, 
    { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 20 }, { wch: 15 }
  ];
  roomSheet['!cols'] = roomColWidths;

  // Save the file
  XLSX.writeFile(workbook, `occupancy-report-${new Date().toISOString().split('T')[0]}.xlsx`);
};

// Export to PDF function with logo on right side
const exportToPDF = async () => {
  // Create new PDF document
  const doc = new jsPDF('l', 'mm', 'a4');
  
  // Logo configuration - moved to right side
  const logoUrl = '/src/assets/SeinGayHarLogo.png';
  const logoWidth = 30;
  const logoHeight = 15;
  const logoX = doc.internal.pageSize.width - logoWidth - 14; // Right side with 14mm margin
  const logoY = 10;

  try {
    // Add logo if available
    if (logoUrl) {
      doc.addImage(logoUrl, 'PNG', logoX, logoY, logoWidth, logoHeight);
    }
  } catch (error) {
    console.warn('Could not load logo:', error);
    // Continue without logo if there's an error
  }

  // Title - remains on left side
  const titleX = 14;
  
  doc.setFontSize(18);
  doc.setTextColor(30, 64, 175);
  doc.setFont('helvetica', 'bold');
  doc.text('VACANT VS OCCUPIED UNITS REPORT', titleX, 20);
  
  // Subtitle
  doc.setFontSize(10);
  doc.setTextColor(75, 85, 99);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric'
  })}`, titleX, 28);
  
  doc.text(`Total Units: ${occupancyStats.totalUnits} | Occupied: ${occupancyStats.occupiedUnits} | Vacant: ${occupancyStats.vacantUnits} | Occupancy Rate: ${occupancyStats.occupancyRate.toFixed(1)}%`, titleX, 34);

  // Rest of your existing PDF code remains the same...
  // Summary Stats
  doc.setFillColor(239, 246, 255);
  doc.rect(titleX, 38, 260, 8, 'F');
  doc.setFontSize(9);
  doc.setTextColor(30, 64, 175);
  doc.setFont('helvetica', 'bold');
  doc.text(`OCCUPIED: ${occupancyStats.occupiedUnits} | VACANT: ${occupancyStats.vacantUnits} | OCCUPANCY RATE: ${occupancyStats.occupancyRate.toFixed(1)}%`, titleX + 2, 43);

  // Building-wise Table
  const startY = 50;
  
  doc.setFontSize(12);
  doc.setTextColor(30, 64, 175);
  doc.setFont('helvetica', 'bold');
  doc.text('Building-wise Occupancy', titleX, startY);

  const buildingTableData = buildingOccupancy.map(building => [
    building.buildingName,
    building.branchName,
    building.totalUnits.toString(),
    building.occupiedUnits.toString(),
    building.vacantUnits.toString(),
    `${building.occupancyRate.toFixed(1)}%`
  ]);

  autoTable(doc, {
    head: [['Building', 'Branch', 'Total Units', 'Occupied', 'Vacant', 'Occupancy Rate']],
    body: buildingTableData,
    startY: startY + 5,
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [30, 64, 175],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 20 },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 15, halign: 'center' },
      5: { cellWidth: 21, halign: 'center' }
    },
  });

  // Floor-wise Table (on new page if needed)
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  if (finalY > 180) {
    doc.addPage();
    // Add logo to new page on right side
    if (logoUrl) {
      try {
        const newPageLogoX = doc.internal.pageSize.width - logoWidth - 14;
        doc.addImage(logoUrl, 'PNG', newPageLogoX, logoY, logoWidth, logoHeight);
      } catch (error) {
        // Continue without logo
      }
    }
    doc.setFontSize(12);
    doc.setTextColor(30, 64, 175);
    doc.setFont('helvetica', 'bold');
    doc.text('Floor-wise Occupancy', titleX, 20);
  } else {
    doc.setFontSize(12);
    doc.setTextColor(30, 64, 175);
    doc.setFont('helvetica', 'bold');
    doc.text('Floor-wise Occupancy', titleX, finalY);
  }

  const floorTableData = floorOccupancy.map(floor => [
    floor.floorName,
    floor.buildingName,
    floor.totalUnits.toString(),
    floor.occupiedUnits.toString(),
    floor.vacantUnits.toString(),
    `${floor.occupancyRate.toFixed(1)}%`
  ]);

  autoTable(doc, {
    head: [['Floor', 'Building', 'Total Units', 'Occupied', 'Vacant', 'Occupancy Rate']],
    body: floorTableData,
    startY: finalY > 180 ? 25 : finalY + 5,
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 25 },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 15, halign: 'center' },
      5: { cellWidth: 21, halign: 'center' }
    },
  });

  // Room Details Table (on new page)
  doc.addPage();
  // Add logo to new page on right side
  if (logoUrl) {
    try {
      const newPageLogoX = doc.internal.pageSize.width - logoWidth - 14;
      doc.addImage(logoUrl, 'PNG', newPageLogoX, logoY, logoWidth, logoHeight);
    } catch (error) {
      // Continue without logo
    }
  }
  doc.setFontSize(12);
  doc.setTextColor(30, 64, 175);
  doc.setFont('helvetica', 'bold');
  doc.text('Detailed Room Status', titleX, 20);

  const roomTableData = roomStatus.map(room => [
    room.roomNumber,
    room.roomType,
    room.building,
    room.floor,
    room.branch,
    room.size.toString(),
    `${room.rentalFee.toLocaleString()} MMK`,
    room.status === 'OCCUPIED' ? 'Occupied' : 'Vacant',
    room.currentTenant || '',
    room.contractEndDate ? new Date(room.contractEndDate).toLocaleDateString('en-US') : ''
  ]);

  autoTable(doc, {
    head: [['Room No.', 'Type', 'Building', 'Floor', 'Branch', 'Size', 'Rental Fee', 'Status', 'Current Tenant', 'Contract End']],
    body: roomTableData,
    startY: 25,
    styles: {
      fontSize: 6,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [16, 185, 129],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 12 },
      1: { cellWidth: 15 },
      2: { cellWidth: 18 },
      3: { cellWidth: 12 },
      4: { cellWidth: 15 },
      5: { cellWidth: 10, halign: 'center' },
      6: { cellWidth: 15, halign: 'right' },
      7: { cellWidth: 12, halign: 'center' },
      8: { cellWidth: 20 },
      9: { cellWidth: 15, halign: 'center' }
    },
    didDrawCell: (data) => {
      if (data.section === 'body' && data.column.index === 7) {
        const status = data.cell.raw as string;
        const color = status === 'Occupied' ? [34, 197, 94] : [59, 130, 246];
        
        doc.setTextColor(color[0], color[1], color[2]);
        doc.text(data.cell.raw, data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 1, {
          align: 'center',
          baseline: 'middle'
        });
        doc.setTextColor(31, 41, 55);
        return false;
      }
    },
  });

  // Add footer to all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    doc.setDrawColor(209, 213, 219);
    doc.setLineWidth(0.5);
    doc.line(14, doc.internal.pageSize.height - 20, doc.internal.pageSize.width - 14, doc.internal.pageSize.height - 20);
    
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text(
      `Page ${i} of ${pageCount} • Generated on ${new Date().toLocaleDateString()}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 15,
      { align: 'center' }
    );
  }

  // Save the PDF
  doc.save(`occupancy-report-${new Date().toISOString().split('T')[0]}.pdf`);
};

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-2 text-gray-600">Loading occupancy report...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <Button onClick={loadData} variant="primary">
          Try Again
        </Button>
        {onBack && (
          <Button onClick={onBack} variant="secondary" className="ml-2">
            Back to Reports
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
              {onBack && (
                <Button variant="secondary" size="sm" onClick={onBack} className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Reports
                </Button>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Vacant vs Occupied Units Report</h1>
                <p className="text-gray-600 mt-1">
                  Real-time occupancy analysis based on actual room and contract data
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={exportToExcel} className="flex items-center gap-2">
              Export Excel
            </Button>
            <Button variant="danger" onClick={exportToPDF} className="flex items-center gap-2">
              Export PDF
            </Button>
            <Button variant="secondary" onClick={loadData}>
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
          <div className="text-3xl font-bold text-blue-600">{occupancyStats.totalUnits}</div>
          <div className="text-sm text-gray-600 mt-1">Total Units</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
          <div className="text-3xl font-bold text-green-600">{occupancyStats.occupiedUnits}</div>
          <div className="text-sm text-gray-600 mt-1">Occupied Units</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
          <div className="text-3xl font-bold text-blue-600">{occupancyStats.vacantUnits}</div>
          <div className="text-sm text-gray-600 mt-1">Vacant Units</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
          <div className="text-3xl font-bold text-purple-600">{occupancyStats.occupancyRate.toFixed(1)}%</div>
          <div className="text-sm text-gray-600 mt-1">Occupancy Rate</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'overview' as const, label: 'Overview' },
            { id: 'buildings' as const, label: 'By Building' },
            { id: 'floors' as const, label: 'By Floor' },
            { id: 'rooms' as const, label: 'Room Details' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Occupancy Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Occupancy Distribution</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-green-600 font-medium">Occupied</span>
                      <span>{occupancyStats.occupiedUnits} units ({occupancyStats.occupancyRate.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-green-500 h-3 rounded-full" 
                        style={{ width: `${occupancyStats.occupancyRate}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-blue-600 font-medium">Vacant</span>
                      <span>{occupancyStats.vacantUnits} units ({occupancyStats.vacancyRate.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-blue-500 h-3 rounded-full" 
                        style={{ width: `${occupancyStats.vacancyRate}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Building Summary */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Building Summary</h3>
                <div className="space-y-3">
                  {buildingOccupancy.map(building => (
                    <div key={building.buildingId} className="flex justify-between items-center">
                      <div>
                        <span className="text-sm font-medium">{building.buildingName}</span>
                        <span className="text-xs text-gray-500 ml-2">({building.branchName})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-green-600">{building.occupiedUnits} occ</span>
                        <span className="text-xs text-blue-600">{building.vacantUnits} vac</span>
                        <span className={`text-xs font-medium ${
                          building.occupancyRate >= 80 ? 'text-green-600' : 
                          building.occupancyRate >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {building.occupancyRate.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Branch Summary */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Branch Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from(new Set(buildingOccupancy.map(b => b.branchName))).map(branch => {
                  const branchBuildings = buildingOccupancy.filter(b => b.branchName === branch);
                  const totalUnits = branchBuildings.reduce((sum, b) => sum + b.totalUnits, 0);
                  const occupiedUnits = branchBuildings.reduce((sum, b) => sum + b.occupiedUnits, 0);
                  const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;
                  
                  return (
                    <div key={branch} className="bg-white p-4 rounded-lg border border-gray-200">
                      <h4 className="font-semibold text-gray-900">{branch}</h4>
                      <div className="mt-2 space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Buildings:</span>
                          <span className="font-medium">{branchBuildings.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Units:</span>
                          <span className="font-medium">{totalUnits}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Occupied:</span>
                          <span className="font-medium text-green-600">{occupiedUnits}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Vacant:</span>
                          <span className="font-medium text-blue-600">{totalUnits - occupiedUnits}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Occupancy Rate:</span>
                          <span className={`font-medium ${
                            occupancyRate >= 80 ? 'text-green-600' : 
                            occupancyRate >= 60 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {occupancyRate.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'buildings' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Building-wise Occupancy</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Building</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Branch</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Units</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Occupied</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vacant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Occupancy Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {buildingOccupancy.map(building => (
                    <tr key={building.buildingId}>
                      <td className="px-6 py-4 font-medium">{building.buildingName}</td>
                      <td className="px-6 py-4 text-gray-600">{building.branchName}</td>
                      <td className="px-6 py-4">{building.totalUnits}</td>
                      <td className="px-6 py-4 text-green-600 font-medium">{building.occupiedUnits}</td>
                      <td className="px-6 py-4 text-blue-600 font-medium">{building.vacantUnits}</td>
                      <td className="px-6 py-4">
                        <span className={`font-medium ${
                          building.occupancyRate >= 80 ? 'text-green-600' : 
                          building.occupancyRate >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {building.occupancyRate.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'floors' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Floor-wise Occupancy</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Floor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Building</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Branch</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Units</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Occupied</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vacant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Occupancy Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {floorOccupancy.map(floor => {
                    // Find the building to get branch name
                    const building = buildingOccupancy.find(b => 
                      b.buildingName === floor.buildingName
                    );
                    
                    return (
                      <tr key={`${floor.floorId}-${floor.buildingName}`}>
                        <td className="px-6 py-4 font-medium">{floor.floorName}</td>
                        <td className="px-6 py-4 text-gray-600">{floor.buildingName}</td>
                        <td className="px-6 py-4 text-gray-600">{building?.branchName || 'N/A'}</td>
                        <td className="px-6 py-4">{floor.totalUnits}</td>
                        <td className="px-6 py-4 text-green-600 font-medium">{floor.occupiedUnits}</td>
                        <td className="px-6 py-4 text-blue-600 font-medium">{floor.vacantUnits}</td>
                        <td className="px-6 py-4">
                          <span className={`font-medium ${
                            floor.occupancyRate >= 80 ? 'text-green-600' : 
                            floor.occupancyRate >= 60 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {floor.occupancyRate.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'rooms' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Detailed Room Status</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Room No.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Building</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Floor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Branch</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rental Fee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Tenant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contract End</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {roomStatus.map(room => (
                    <tr key={room.roomId}>
                      <td className="px-6 py-4 font-medium">{room.roomNumber}</td>
                      <td className="px-6 py-4">{room.roomType}</td>
                      <td className="px-6 py-4">{room.building}</td>
                      <td className="px-6 py-4">{room.floor}</td>
                      <td className="px-6 py-4 text-gray-600">{room.branch}</td>
                      <td className="px-6 py-4">{room.size} sqm</td>
                      <td className="px-6 py-4">{formatCurrency(room.rentalFee)}</td>
                      <td className="px-6 py-4">{getStatusBadge(room.status)}</td>
                      <td className="px-6 py-4">{room.currentTenant || '-'}</td>
                      <td className="px-6 py-4">{formatDate(room.contractEndDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};