import React, { useState, useEffect } from "react";
import { Building2, Layers, Users, DollarSign, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { buildingApi } from "../../api/BuildingAPI";
import { branchApi } from "../../api/BranchAPI";
import { levelApi } from "../../api/LevelAPI";
import { userApi } from "../../api/UserAPI";
import { unitApi } from "../../api/UnitAPI";

interface AdminHomeProps {
  onNavigate: (path: string) => void;
}

interface DashboardStats {
  totalBranches: number;
  totalBuildings: number;
  totalLevels: number;
  activeUsers: number;
  totalUnits: number;
  availableUnits: number;
}

const AdminHome: React.FC<AdminHomeProps> = ({ onNavigate }) => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<DashboardStats>({
    totalBranches: 0,
    totalBuildings: 0,
    totalLevels: 0,
    activeUsers: 0,
    totalUnits: 0,
    availableUnits: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [
        branchesResponse,
        buildingsResponse,
        levelsResponse,
        usersResponse,
        unitsResponse,
        availableUnitsResponse,
      ] = await Promise.allSettled([
        branchApi.getAll(),
        buildingApi.getAll(),
        levelApi.getAll(),
        userApi.getAll(),
        unitApi.getAll(),
        unitApi.getAvailable(),
      ]);

      // Extract data from responses
      const branches = branchesResponse.status === 'fulfilled' ? branchesResponse.value.data : [];
      const buildings = buildingsResponse.status === 'fulfilled' ? buildingsResponse.value.data : [];
      const levels = levelsResponse.status === 'fulfilled' ? levelsResponse.value.data : [];
      const users = usersResponse.status === 'fulfilled' ? usersResponse.value.data : [];
      const units = unitsResponse.status === 'fulfilled' ? unitsResponse.value.data : [];
      const availableUnits = availableUnitsResponse.status === 'fulfilled' ? availableUnitsResponse.value.data : [];

      // Filter active users (assuming active status is based on some property)
      const activeUsers = users.filter(user => 
        user.status === 'active' || user.isActive === true
      ).length;

      setStats({
        totalBranches: branches.length,
        totalBuildings: buildings.length,
        totalLevels: levels.length,
        activeUsers: activeUsers,
        totalUnits: units.length,
        availableUnits: availableUnits.length,
      });

      // Generate recent activities from actual data
      generateRecentActivities(branches, buildings, levels, units);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateRecentActivities = (branches: any[], buildings: any[], levels: any[], units: any[]) => {
    const activities: { id: string; message: string; time: string; type: string; }[] = [];
    
    // Get latest branches (limit to 2)
    const recentBranches = [...branches]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 2);
    
    // Get latest buildings (limit to 2)
    const recentBuildings = [...buildings]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 2);
    
    // Get latest levels (limit to 2)
    const recentLevels = [...levels]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 2);
    
    // Get latest units (limit to 2)
    const recentUnits = [...units]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 2);

    // Format time ago
    const formatTimeAgo = (dateString: string) => {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      if (diffHours < 24) {
        return `${diffHours} ${t('admin.hoursAgo')}`;
      } else {
        return `${diffDays} ${t('admin.daysAgo')}`;
      }
    };

    // Add branch activities
    recentBranches.forEach(branch => {
      activities.push({
        id: `branch-${branch.id}`,
        message: `${t('admin.newBranchAdded')}: ${branch.name}`,
        time: branch.createdAt ? formatTimeAgo(branch.createdAt) : '1 ' + t('admin.daysAgo'),
        type: "branch",
      });
    });

    // Add building activities
    recentBuildings.forEach(building => {
      activities.push({
        id: `building-${building.id}`,
        message: `${t('admin.buildingUpdated')}: ${building.name}`,
        time: building.updatedAt ? formatTimeAgo(building.updatedAt) : '2 ' + t('admin.daysAgo'),
        type: "building",
      });
    });

    // Add level activities
    recentLevels.forEach(level => {
      activities.push({
        id: `level-${level.id}`,
        message: `${t('admin.levelCreated')}: ${level.name}`,
        time: level.createdAt ? formatTimeAgo(level.createdAt) : '3 ' + t('admin.daysAgo'),
        type: "level",
      });
    });

    // Add unit activities
    recentUnits.forEach(unit => {
      activities.push({
        id: `unit-${unit.id}`,
        message: `${t('admin.unitAdded')}: ${unit.unitNumber}`,
        time: unit.createdAt ? formatTimeAgo(unit.createdAt) : '4 ' + t('admin.daysAgo'),
        type: "unit",
      });
    });

    // Sort by time (newest first) and limit to 6 activities
    const sortedActivities = activities
      .sort((a, b) => {
        const timeA = parseInt(a.time);
        const timeB = parseInt(b.time);
        return timeA - timeB;
      })
      .slice(0, 6);

    setRecentActivities(sortedActivities);
  };

  // KPI cards with colored sidebar like in the image
  const kpiCards = [
    {
      title: t('admin.totalBranches') || "Total Branches",
      value: loading ? "..." : stats.totalBranches.toString(),
      color: "bg-gradient-to-r from-blue-500 to-blue-600",
      borderColor: "border-l-blue-800",
    },
    {
      title: t('admin.totalBuildings') || "Total Buildings",
      value: loading ? "..." : stats.totalBuildings.toString(),
      color: "bg-gradient-to-r from-blue-500 to-blue-600",
      borderColor: "border-l-blue-800",
    },
    {
      title: t('admin.totalLevels') || "Total Levels",
      value: loading ? "..." : stats.totalLevels.toString(),
      color: "bg-gradient-to-r from-blue-500 to-blue-600",
      borderColor: "border-l-blue-800",
    },
    {
      title: t('admin.activeUsers') || "Active Users",
      value: loading ? "..." : stats.activeUsers.toString(),
      color: "bg-gradient-to-r from-blue-500 to-blue-600",
      borderColor: "border-l-blue-800",
    },
    {
      title: t('admin.totalUnits') || "Total Units",
      value: loading ? "..." : stats.totalUnits.toString(),
      color: "bg-gradient-to-r from-blue-500 to-blue-600",
      borderColor: "border-l-blue-800",
    },
    {
      title: t('admin.availableUnits') || "Available Units",
      value: loading ? "..." : stats.availableUnits.toString(),
      color: "bg-gradient-to-r from-blue-500 to-blue-600",
      borderColor: "border-l-blue-800",
    },
  ];

  const quickActions = [
    {
      label: t('admin.manageBranches') || "Manage Branches",
      icon: <Building2 className="w-5 h-5" />,
      onClick: () => onNavigate("/admin/branches"),
      color: "bg-stone-100 text-stone-900 hover:bg-stone-200 border-stone-200",
    },
    {
      label: t('admin.manageBuildings') || "Manage Buildings",
      icon: <Building2 className="w-5 h-5" />,
      onClick: () => onNavigate("/admin/buildings"),
      color: "bg-stone-100 text-stone-900 hover:bg-stone-200 border-stone-200",
    },
    {
      label: t('admin.manageLevels') || "Manage Levels",
      icon: <Layers className="w-5 h-5" />,
      onClick: () => onNavigate("/admin/levels"),
      color: "bg-stone-100 text-stone-900 hover:bg-stone-200 border-stone-200",
    },
    {
      label: t('admin.manageUnits') || "Manage Units",
      icon: <Layers className="w-5 h-5" />,
      onClick: () => onNavigate("/admin/units"),
      color: "bg-stone-100 text-stone-900 hover:bg-stone-200 border-stone-200",
    },
    {
      label: t('admin.manageUtilities') || "Manage Utilities",
      icon: <Zap className="w-5 h-5" />,
      onClick: () => onNavigate("/admin/utility-types"),
      color: "bg-stone-100 text-stone-900 hover:bg-stone-200 border-stone-200",
    },
    {
      label: t('admin.userManagement') || "User Management",
      icon: <Users className="w-5 h-5" />,
      onClick: () => onNavigate("/admin/users"),
      color: "bg-stone-100 text-stone-900 hover:bg-stone-200 border-stone-200",
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "branch":
        return <Building2 className="w-4 h-4 text-blue-600" />;
      case "building":
        return <Building2 className="w-4 h-4 text-blue-600" />;
      case "level":
        return <Layers className="w-4 h-4 text-blue-600" />;
      case "unit":
        return <Layers className="w-4 h-4 text-blue-600" />;
      default:
        return <Building2 className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="p-4 sm:p-8 min-h-screen bg-stone-50 pt-16">
      {/* KPI Cards with colored sidebar - Like in the image */}
      {/* <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        {kpiCards.map((card, index) => (
          <div
            key={index}
            className="bg-white rounded-lg border border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-150"
          >
            <div className="flex">
              <div className={`w-2 ${card.color}`}></div>
              
              <div className="flex-1 p-5">
                <div className="text-center">
                  <p className="text-sm font-normal text-stone-600 mb-3">
                    {card.title}
                  </p>
                  <p className="text-3xl font-bold text-stone-900">
                    {card.value}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div> */}

      {/* Alternative with colored left border */}
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        {kpiCards.map((card, index) => (
          <div
            key={index}
            className={`bg-white rounded-lg border-l-4 ${card.borderColor} border-t border-r border-b border-stone-200 p-5 shadow-sm hover:shadow-md transition-shadow duration-150`}
          >
            <div className="text-center">
              <p className="text-sm font-normal text-stone-600 mb-3">
                {card.title}
              </p>
              <p className="text-3xl font-bold text-stone-900">
                {card.value}
              </p>
            </div>
          </div>
        ))}
      </div>
     

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-stone-200 p-6">
          <h3 className="text-lg font-semibold text-stone-900 mb-6">
            {t('admin.quickActions') || "Quick Actions"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className={`flex items-center space-x-3 w-full p-4 rounded-lg border transition-all duration-150 hover:shadow-sm ${action.color}`}
              >
                {action.icon}
                <span className="font-medium text-sm">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminHome;