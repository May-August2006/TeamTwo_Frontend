/** @format */

import React from "react";
import { Building2, Layers, Users, DollarSign, TrendingUp, Zap } from "lucide-react";
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
      color: "bg-red-600",
      icon: <Building2 className="w-6 h-6 text-white" />,
    },
    {
      label: t('admin.totalBuildings'),
      value: "45",
      change: "+5",
      color: "bg-red-600",
      icon: <Building2 className="w-6 h-6 text-white" />,
    },
    {
      label: t('admin.totalLevels'),
      value: "230",
      change: "+15",
      color: "bg-red-600",
      icon: <Layers className="w-6 h-6 text-white" />,
    },
    {
      label: t('admin.activeUsers'),
      value: "156",
      change: "+8",
      color: "bg-red-600",
      icon: <Users className="w-6 h-6 text-white" />,
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
      label: t('admin.manageRooms'),
      icon: <Layers className="w-5 h-5" />,
      onClick: () => onNavigate("/admin/rooms"),
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
    {
      id: 4,
      message: t('admin.roomAdded'),
      time: "3 " + t('admin.daysAgo'),
      type: "room",
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "branch":
        return <Building2 className="w-4 h-4 text-red-600" />;
      case "building":
        return <Building2 className="w-4 h-4 text-red-600" />;
      case "level":
        return <Layers className="w-4 h-4 text-red-600" />;
      case "room":
        return <Layers className="w-4 h-4 text-red-600" />;
      default:
        return <Building2 className="w-4 h-4 text-stone-500" />;
    }
  };

  return (
    <div className="p-4 sm:p-8 min-h-screen bg-stone-50">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg p-6 text-white mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">{t('admin.welcome')}</h2>
        <p className="text-red-100 text-sm sm:text-base">
          {t('admin.welcomeSubtitle')}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
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
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600 font-medium">
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

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-lg border border-stone-200 p-6">
          <h3 className="text-lg font-bold text-stone-900 mb-4">
            {t('admin.recentActivity')}
          </h3>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-stone-50 transition-colors duration-150">
                <div className="p-2 bg-red-100 rounded-lg">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-stone-900">{activity.message}</p>
                  <p className="text-xs text-stone-500 mt-1">{activity.time}</p>
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