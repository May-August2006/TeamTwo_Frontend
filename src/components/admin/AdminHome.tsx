import React, { useState, useEffect } from "react";
import { Building2, Layers, Users, DollarSign, TrendingUp, Zap } from "lucide-react";
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
  const [lastMonthComparison, setLastMonthComparison] = useState({
    branchesChange: 0,
    buildingsChange: 0,
    levelsChange: 0,
    usersChange: 0,
  });

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

      // Calculate changes (for demo - in real app, you'd fetch historical data)
      // This is a simplified version - you might want to fetch actual month-over-month data
      const lastMonthData = {
        branches: Math.max(0, branches.length - 2), // Example calculation
        buildings: Math.max(0, buildings.length - 5),
        levels: Math.max(0, levels.length - 10),
        users: Math.max(0, activeUsers - 3),
      };

      setStats({
        totalBranches: branches.length,
        totalBuildings: buildings.length,
        totalLevels: levels.length,
        activeUsers: activeUsers,
        totalUnits: units.length,
        availableUnits: availableUnits.length,
      });

      setLastMonthComparison({
        branchesChange: branches.length - lastMonthData.branches,
        buildingsChange: buildings.length - lastMonthData.buildings,
        levelsChange: levels.length - lastMonthData.levels,
        usersChange: activeUsers - lastMonthData.users,
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

  const formatChange = (change: number) => {
    return change > 0 ? `+${change}` : change.toString();
  };

  const getChangeColor = (change: number) => {
    return change > 0 ? "text-green-600" : change < 0 ? "text-red-600" : "text-gray-600";
  };

  const dashboardStats = [
    {
      label: t('admin.totalBranches'),
      value: loading ? "..." : stats.totalBranches.toString(),
      change: formatChange(lastMonthComparison.branchesChange),
      changeColor: getChangeColor(lastMonthComparison.branchesChange),
      color: "bg-red-600",
      icon: <Building2 className="w-6 h-6 text-white" />,
    },
    {
      label: t('admin.totalBuildings'),
      value: loading ? "..." : stats.totalBuildings.toString(),
      change: formatChange(lastMonthComparison.buildingsChange),
      changeColor: getChangeColor(lastMonthComparison.buildingsChange),
      color: "bg-red-600",
      icon: <Building2 className="w-6 h-6 text-white" />,
    },
    {
      label: t('admin.totalLevels'),
      value: loading ? "..." : stats.totalLevels.toString(),
      change: formatChange(lastMonthComparison.levelsChange),
      changeColor: getChangeColor(lastMonthComparison.levelsChange),
      color: "bg-red-600",
      icon: <Layers className="w-6 h-6 text-white" />,
    },
    {
      label: t('admin.activeUsers'),
      value: loading ? "..." : stats.activeUsers.toString(),
      change: formatChange(lastMonthComparison.usersChange),
      changeColor: getChangeColor(lastMonthComparison.usersChange),
      color: "bg-red-600",
      icon: <Users className="w-6 h-6 text-white" />,
    },
    {
      label: t('admin.totalUnits'),
      value: loading ? "..." : stats.totalUnits.toString(),
      change: "+0", // You can implement unit change calculation similarly
      changeColor: "text-green-600",
      color: "bg-blue-600",
      icon: <Layers className="w-6 h-6 text-white" />,
    },
    {
      label: t('admin.availableUnits'),
      value: loading ? "..." : stats.availableUnits.toString(),
      change: "+0", // You can implement available units change calculation
      changeColor: "text-green-600",
      color: "bg-green-600",
      icon: <Layers className="w-6 h-6 text-white" />,
    },
  ];

  const quickActions = [
    {
      label: t('admin.manageBranches'),
      icon: <Building2 className="w-5 h-5" />,
      onClick: () => onNavigate("/admin/branches"),
      color: "bg-stone-100 text-stone-900 hover:bg-stone-200 border-stone-200",
    },
    {
      label: t('admin.manageBuildings'),
      icon: <Building2 className="w-5 h-5" />,
      onClick: () => onNavigate("/admin/buildings"),
      color: "bg-stone-100 text-stone-900 hover:bg-stone-200 border-stone-200",
    },
    {
      label: t('admin.manageLevels'),
      icon: <Layers className="w-5 h-5" />,
      onClick: () => onNavigate("/admin/levels"),
      color: "bg-stone-100 text-stone-900 hover:bg-stone-200 border-stone-200",
    },
    {
      label: t('admin.manageUnits'),
      icon: <Layers className="w-5 h-5" />,
      onClick: () => onNavigate("/admin/units"),
      color: "bg-stone-100 text-stone-900 hover:bg-stone-200 border-stone-200",
    },
    {
      label: t('admin.manageUtilities'),
      icon: <Zap className="w-5 h-5" />,
      onClick: () => onNavigate("/admin/utility-types"),
      color: "bg-stone-100 text-stone-900 hover:bg-stone-200 border-stone-200",
    },
    {
      label: t('admin.billingConfig'),
      icon: <DollarSign className="w-5 h-5" />,
      onClick: () => onNavigate("/admin/billing"),
      color: "bg-stone-100 text-stone-900 hover:bg-stone-200 border-stone-200",
    },
    {
      label: t('admin.userManagement'),
      icon: <Users className="w-5 h-5" />,
      onClick: () => onNavigate("/admin/users"),
      color: "bg-stone-100 text-stone-900 hover:bg-stone-200 border-stone-200",
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "branch":
        return <Building2 className="w-4 h-4 text-red-600" />;
      case "building":
        return <Building2 className="w-4 h-4 text-blue-600" />;
      case "level":
        return <Layers className="w-4 h-4 text-green-600" />;
      case "unit":
        return <Layers className="w-4 h-4 text-purple-600" />;
      default:
        return <Building2 className="w-4 h-4 text-stone-500" />;
    }
  };

  return (
    <div className="p-4 sm:p-8 min-h-screen bg-stone-50">
      {/* Welcome Section
      <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg p-6 text-white mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">{t('admin.welcome')}</h2>
        <p className="text-red-100 text-sm sm:text-base">
          {t('admin.welcomeSubtitle')}
        </p>
      </div> */}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {dashboardStats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-lg border border-stone-200 p-6 hover:shadow-xl transition-shadow duration-150"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-stone-600">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-stone-900 mt-1">
                  {stat.value}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>{stat.icon}</div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className={`w-4 h-4 mr-1 ${stat.changeColor}`} />
              <span className={`text-sm font-medium ${stat.changeColor}`}>
                {stat.change} {t('admin.fromLastMonth')}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg border border-stone-200 p-6">
          <h3 className="text-lg font-bold text-stone-900 mb-4">
            {t('admin.quickActions')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className={`flex items-center space-x-3 w-full p-4 rounded-lg border transition-all duration-150 hover:shadow-md ${action.color}`}
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