// AdminHome.tsx - Updated
/** @format */

import React from "react";
import { Building2, Layers, Users, DollarSign, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";

interface AdminHomeProps {
  onNavigate: (path: string) => void;
}

const AdminHome: React.FC<AdminHomeProps> = ({ onNavigate }) => {
  const { t } = useTranslation();

  const stats = [
    {
      label: t('admin.totalBranches'),
      value: "12",
      change: "+2",
      color: "bg-red-500",
      icon: <Building2 className="w-6 h-6 text-white" />,
    },
    {
      label: t('admin.totalBuildings'),
      value: "45",
      change: "+5",
      color: "bg-blue-500",
      icon: <Building2 className="w-6 h-6 text-white" />,
    },
    {
      label: t('admin.totalLevels'),
      value: "230",
      change: "+15",
      color: "bg-green-500",
      icon: <Layers className="w-6 h-6 text-white" />,
    },
    {
      label: t('admin.activeUsers'),
      value: "156",
      change: "+8",
      color: "bg-purple-500",
      icon: <Users className="w-6 h-6 text-white" />,
    },
  ];

  const quickActions = [
    {
      label: t('admin.manageBranches'),
      icon: <Building2 className="w-5 h-5" />,
      onClick: () => onNavigate("/admin/branches"),
      color: "bg-red-50 text-red-700 hover:bg-red-100 border-red-200",
    },
    {
      label: t('admin.manageBuildings'),
      icon: <Building2 className="w-5 h-5" />,
      onClick: () => onNavigate("/admin/buildings"),
      color: "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200",
    },
    {
      label: t('admin.manageLevels'),
      icon: <Layers className="w-5 h-5" />,
      onClick: () => onNavigate("/admin/levels"),
      color: "bg-green-50 text-green-700 hover:bg-green-100 border-green-200",
    },
    {
      label: t('admin.billingConfig'),
      icon: <DollarSign className="w-5 h-5" />,
      onClick: () => onNavigate("/admin/billing"),
      color:
        "bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-200",
    },
    {
      label: t('admin.userManagement'),
      icon: <Users className="w-5 h-5" />,
      onClick: () => onNavigate("/admin/users"),
      color:
        "bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200",
    },
  ];

  const recentActivities = [
    {
      id: 1,
      message: t('admin.newBranchAdded'),
      time: "2 " + t('admin.hoursAgo'),
      type: "branch",
    },
    {
      id: 2,
      message: t('admin.buildingUpdated'),
      time: "5 " + t('admin.hoursAgo'),
      type: "building",
    },
    {
      id: 3,
      message: t('admin.levelCreated'),
      time: "1 " + t('admin.daysAgo'),
      type: "level",
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "branch":
        return <Building2 className="w-4 h-4 text-red-500" />;
      case "building":
        return <Building2 className="w-4 h-4 text-blue-500" />;
      case "level":
        return <Layers className="w-4 h-4 text-green-500" />;
      default:
        return <Building2 className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-sm p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">{t('admin.welcome')}</h2>
        <p className="text-blue-100">
          {t('admin.welcomeSubtitle')}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stat.value}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>{stat.icon}</div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600 font-medium">
                {stat.change} {t('admin.fromLastMonth')}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t('admin.quickActions')}
          </h3>
          <div className="space-y-3">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className={`flex items-center space-x-3 w-full p-3 rounded-lg border transition-colors ${action.color}`}
              >
                {action.icon}
                <span className="font-medium">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t('admin.recentActivity')}
          </h3>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminHome;