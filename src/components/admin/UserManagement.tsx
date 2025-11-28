/** @format */

import React, { useState, useEffect } from "react";
import { Edit, Trash2, Plus, Building, Briefcase, X, MoreVertical } from "lucide-react";
import { userApi } from "../../api/UserAPI";
import { buildingApi } from "../../api/BuildingAPI";
import { branchApi } from "../../api/BranchAPI";
import { useTranslation } from "react-i18next";

interface User {
  id: number;
  fullName: string;
  email: string;
  username: string;
  roleName: string;
  isActive: boolean;
  lastLogin?: string;
  branchId?: number;
  buildingId?: number;
  branchName?: string;
  buildingName?: string;
  building?: any;
  branch?: any;
}

interface Building {
  id: number;
  buildingName: string;
  branchName: string;
  branchId: number;
  managerId?: number;
  managerName?: string;
}

interface Branch {
  id: number;
  branchName: string;
  accountantId?: number;
  accountantName?: string;
}

interface UserRequest {
  username: string;
  email: string;
  fullName: string;
  roleName: string;
  password: string;
  branchId?: number | null;
  buildingId?: number | null;
}

interface Assignment {
  userId: number;
  buildingId: number;
  branchId: number;
  assignmentType: "manager" | "accountant" | "";
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [availableBuildings, setAvailableBuildings] = useState<Building[]>([]);
  const [availableBranches, setAvailableBranches] = useState<Branch[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<number | null>(null);

  const { t } = useTranslation();

  const [newUser, setNewUser] = useState<UserRequest>({
    username: "",
    email: "",
    fullName: "",
    roleName: "ROLE_GUEST",
    password: "defaultPassword123",
    branchId: null,
    buildingId: null
  });

  const [editUserData, setEditUserData] = useState({
    username: "",
    email: "",
    fullName: "",
  });

  const [assignment, setAssignment] = useState<Assignment>({
    userId: 0,
    buildingId: 0,
    branchId: 0,
    assignmentType: ""
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      await Promise.all([
        fetchUsers(),
        fetchBuildings(),
        fetchBranches(),
        fetchAvailableBuildings(),
        fetchAvailableBranches()
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      setError(null);
      const response = await userApi.getAll();
      
      console.log("Raw users response:", response);
      console.log("Users data:", response.data);
      
      let usersData = response.data;
      
      if (response.data && Array.isArray(response.data)) {
        usersData = response.data;
      } else if (response.data && response.data.content) {
        usersData = response.data.content;
      }
      
      console.log("Processed users data:", usersData);
      
      if (usersData.length > 0) {
        console.log("Sample user:", usersData[0]);
        console.log("User keys:", Object.keys(usersData[0]));
      }
      
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Failed to load users");
    }
  };

  const fetchBuildings = async () => {
    try {
      const response = await buildingApi.getAll();
      console.log("Buildings data:", response.data);
      setBuildings(response.data);
    } catch (error) {
      console.error("Error fetching buildings:", error);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await branchApi.getAll();
      console.log("Branches data:", response.data);
      setBranches(response.data);
    } catch (error) {
      console.error("Error fetching branches:", error);
    }
  };

  const fetchAvailableBuildings = async () => {
    try {
      const response = await buildingApi.getAvailableBuildings();
      setAvailableBuildings(response.data);
    } catch (error) {
      console.error("Error fetching available buildings:", error);
      const response = await buildingApi.getAll();
      setAvailableBuildings(response.data);
    }
  };

  const fetchAvailableBranches = async () => {
    try {
      const response = await branchApi.getAvailableBranches();
      setAvailableBranches(response.data);
    } catch (error) {
      console.error("Error fetching available branches:", error);
      const response = await branchApi.getAll();
      setAvailableBranches(response.data);
    }
  };

  // Function to get building name for a user
  const getUserBuildingName = (user: User): string => {
    if (user.buildingId) {
      const building = buildings.find(b => b.id === user.buildingId);
      return building ? building.buildingName : 'Unknown Building';
    }
    
    if (user.building) {
      return user.building.buildingName || 'Unknown Building';
    }
    
    if (user.buildingName) {
      return user.buildingName;
    }
    
    return '';
  };

  // Function to get branch name for a user
  const getUserBranchName = (user: User): string => {
    if (user.branchId) {
      const branch = branches.find(b => b.id === user.branchId);
      return branch ? branch.branchName : 'Unknown Branch';
    }
    
    if (user.branch) {
      return user.branch.branchName || 'Unknown Branch';
    }
    
    if (user.branchName) {
      return user.branchName;
    }
    
    return '';
  };

  // Function to get building ID for a user
  const getUserBuildingId = (user: User): number | undefined => {
    if (user.buildingId) return user.buildingId;
    if (user.building) return user.building.id;
    return undefined;
  };

  // Function to get branch ID for a user
  const getUserBranchId = (user: User): number | undefined => {
    if (user.branchId) return user.branchId;
    if (user.branch) return user.branch.id;
    return undefined;
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const userData: UserRequest = {
        username: newUser.username,
        email: newUser.email,
        fullName: newUser.fullName,
        roleName: newUser.roleName,
        password: newUser.password
      };

      console.log("Creating user with data:", userData);

      const response = await userApi.create(userData);
      const createdUser = response.data.user || response.data;
      
      console.log("User created successfully:", createdUser);

      if (newUser.roleName === "ROLE_MANAGER" && newUser.buildingId) {
        try {
          await buildingApi.assignManager(newUser.buildingId, createdUser.id);
          console.log("Manager assigned to building successfully");
        } catch (assignError: any) {
          console.error("Failed to assign manager to building:", assignError);
          console.warn("User created but manager assignment failed");
        }
      }
      
      if (newUser.roleName === "ROLE_ACCOUNTANT" && newUser.branchId) {
        try {
          await branchApi.assignAccountant(newUser.branchId, createdUser.id);
          console.log("Accountant assigned to branch successfully");
        } catch (assignError: any) {
          console.error("Failed to assign accountant to branch:", assignError);
          console.warn("User created but accountant assignment failed");
        }
      }

      setShowAddModal(false);
      setNewUser({
        username: "",
        email: "",
        fullName: "",
        roleName: "ROLE_GUEST",
        password: "defaultPassword123",
        branchId: null,
        buildingId: null
      });
      
      fetchAllData();
      
    } catch (error: any) {
      console.error("Error creating user:", error);
      console.error("Error details:", error.response);
      setError(error.response?.data?.error || error.response?.data?.message || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setEditUserData({
      username: user.username,
      email: user.email,
      fullName: user.fullName,
    });
    setShowEditModal(true);
    setError(null);
    setMobileMenuOpen(null);
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setLoading(true);
    setError(null);

    try {
      const userData: UserRequest = {
        username: editUserData.username,
        email: editUserData.email,
        fullName: editUserData.fullName,
        roleName: editingUser.roleName, // Keep the original role
        password: "", // Empty password - backend should handle this
        branchId: editingUser.branchId || null, // Keep original assignments
        buildingId: editingUser.buildingId || null // Keep original assignments
      };

      console.log("Updating user with data:", userData);

      await userApi.update(editingUser.id, userData);

      setShowEditModal(false);
      setEditingUser(null);
      fetchAllData();
      
    } catch (error: any) {
      console.error("Error updating user:", error);
      setError(error.response?.data?.error || error.response?.data?.message || "Failed to update user");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (assignment.assignmentType === "manager" && assignment.buildingId) {
        await buildingApi.assignManager(assignment.buildingId, assignment.userId);
      } else if (assignment.assignmentType === "accountant" && assignment.branchId) {
        await branchApi.assignAccountant(assignment.branchId, assignment.userId);
      } else {
        throw new Error("Invalid assignment parameters");
      }

      setShowAssignModal(false);
      setAssignment({
        userId: 0,
        buildingId: 0,
        branchId: 0,
        assignmentType: ""
      });
      
      fetchAllData();
    } catch (error: any) {
      console.error("Error assigning user:", error);
      setError(error.response?.data?.message || "Failed to assign user");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAssignment = async (user: User) => {
    const buildingId = getUserBuildingId(user);
    const branchId = getUserBranchId(user);
    
    if (window.confirm(`Are you sure you want to remove ${user.fullName} from their assignment?`)) {
      try {
        if (user.roleName === "ROLE_MANAGER" && buildingId) {
          await buildingApi.removeManager(buildingId);
        } else if (user.roleName === "ROLE_ACCOUNTANT" && branchId) {
          await branchApi.removeAccountant(branchId);
        }
        
        fetchAllData();
      } catch (error: any) {
        console.error("Error removing assignment:", error);
        setError(error.response?.data?.message || "Failed to remove assignment");
      }
    }
    setMobileMenuOpen(null);
  };

  const handleDeleteUser = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await userApi.delete(id);
        fetchAllData();
      } catch (error: any) {
        console.error("Error deleting user:", error);
        setError(error.response?.data?.message || "Failed to delete user");
      }
    }
    setMobileMenuOpen(null);
  };

  const openAssignModal = (user: User, type: "manager" | "accountant") => {
    setSelectedUser(user);
    setAssignment({
      userId: user.id,
      buildingId: 0,
      branchId: 0,
      assignmentType: type
    });
    setShowAssignModal(true);
    setError(null);
    setMobileMenuOpen(null);
  };

  const getRoleDisplayName = (roleName: string) => {
    const roleMap: { [key: string]: string } = {
      "ROLE_ADMIN": "Administrator",
      "ROLE_MANAGER": "Manager",
      "ROLE_ACCOUNTANT": "Accountant",
      "ROLE_BOD": "Board of Directors",
      "ROLE_TENANT": "Tenant",
      "ROLE_GUEST": "Guest"
    };
    return roleMap[roleName] || roleName;
  };

  const handleBuildingChange = (value: string) => {
    const buildingId = value ? parseInt(value) : null;
    setNewUser({ ...newUser, buildingId });
  };

  const handleBranchChange = (value: string) => {
    const branchId = value ? parseInt(value) : null;
    setNewUser({ ...newUser, branchId });
  };

  const handleAssignmentBuildingChange = (value: string) => {
    const buildingId = value ? parseInt(value) : 0;
    setAssignment({ ...assignment, buildingId });
  };

  const handleAssignmentBranchChange = (value: string) => {
    const branchId = value ? parseInt(value) : 0;
    setAssignment({ ...assignment, branchId });
  };

  const showBuildingSelection = newUser.roleName === "ROLE_MANAGER";
  const showBranchSelection = newUser.roleName === "ROLE_ACCOUNTANT";

  const toggleMobileMenu = (userId: number) => {
    setMobileMenuOpen(mobileMenuOpen === userId ? null : userId);
  };

  return (
    <div className="p-4 sm:p-6 bg-stone-100 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
  <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
    User Management
  </h1>
  <p className="text-stone-600 mt-1 text-sm sm:text-base">
    Manage system users and their assigned roles and permissions.
  </p>
</div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-lg transition-colors w-full sm:w-auto justify-center shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Add New User</span>
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-xl border border-stone-200 overflow-hidden mb-6">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-200">
            <thead className="bg-stone-100">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-neutral-800 uppercase tracking-wider">
                  User
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-neutral-800 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-neutral-800 uppercase tracking-wider">
                  Assignment
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-neutral-800 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-neutral-800 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-stone-200">
              {users.map((user) => {
                const buildingName = getUserBuildingName(user);
                const branchName = getUserBranchName(user);
                const hasAssignment = buildingName || branchName;
                
                return (
                  <tr key={user.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-neutral-800">
                          {user.fullName}
                        </p>
                        <p className="text-sm text-stone-500">{user.email}</p>
                        <p className="text-xs text-stone-400">@{user.username}</p>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-neutral-800">
                      {getRoleDisplayName(user.roleName)}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-neutral-800">
                      {buildingName && (
                        <div className="flex items-center space-x-1 text-stone-700">
                          <Building className="w-4 h-4" />
                          <span>{buildingName}</span>
                        </div>
                      )}
                      {branchName && (
                        <div className="flex items-center space-x-1 text-stone-700">
                          <Briefcase className="w-4 h-4" />
                          <span>{branchName}</span>
                        </div>
                      )}
                      {!hasAssignment && (
                        <span className="text-stone-400">Not assigned</span>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.isActive
                            ? "bg-green-100 text-green-800" // Kept green for "Active" as it's a standard positive status color
                            : "bg-red-100 text-red-700" // Using red for "Inactive"
                        }`}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {user.roleName === "ROLE_MANAGER" && (
                          <>
                            {buildingName ? (
                              <button
                                onClick={() => handleRemoveAssignment(user)}
                                className="text-red-700 hover:text-red-900 transition-colors"
                                title="Remove from Building"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => openAssignModal(user, "manager")}
                                className="text-red-700 hover:text-red-900 transition-colors"
                                title="Assign to Building"
                              >
                                <Building className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                        {user.roleName === "ROLE_ACCOUNTANT" && (
                          <>
                            {branchName ? (
                              <button
                                onClick={() => handleRemoveAssignment(user)}
                                className="text-red-700 hover:text-red-900 transition-colors"
                                title="Remove from Branch"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => openAssignModal(user, "accountant")}
                                className="text-red-700 hover:text-red-900 transition-colors"
                                title="Assign to Branch"
                              >
                                <Briefcase className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                        
                        <button 
                          onClick={() => handleEditClick(user)}
                          className="text-stone-600 hover:text-stone-800 transition-colors"
                          title="Edit User"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-700 hover:text-red-900 transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden">
          {users.map((user) => {
            const buildingName = getUserBuildingName(user);
            const branchName = getUserBranchName(user);
            const hasAssignment = buildingName || branchName;
            
            return (
              <div key={user.id} className="border-b border-stone-200 p-4 bg-white hover:bg-stone-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-neutral-800">{user.fullName}</p>
                        <p className="text-sm text-stone-500">{user.email}</p>
                        <p className="text-xs text-stone-400">@{user.username}</p>
                      </div>
                      <button
                        onClick={() => toggleMobileMenu(user.id)}
                        className="text-stone-400 hover:text-stone-600 ml-2"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-stone-500">Role:</span>
                        <span className="text-neutral-800">{getRoleDisplayName(user.roleName)}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-stone-500">Status:</span>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      
                      {hasAssignment && (
                        <div className="flex justify-between">
                          <span className="text-stone-500">Assignment:</span>
                          <div className="text-right text-stone-700">
                            {buildingName && (
                              <div className="flex items-center space-x-1 justify-end">
                                <Building className="w-3 h-3" />
                                <span className="text-xs">{buildingName}</span>
                              </div>
                            )}
                            {branchName && (
                              <div className="flex items-center space-x-1 justify-end">
                                <Briefcase className="w-3 h-3" />
                                <span className="text-xs">{branchName}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mobile Action Menu */}
                {mobileMenuOpen === user.id && (
                  <div className="mt-3 pt-3 border-t border-stone-200">
                    <div className="flex flex-wrap gap-3">
                      {user.roleName === "ROLE_MANAGER" && (
                        <>
                          {buildingName ? (
                            <button
                              onClick={() => handleRemoveAssignment(user)}
                              className="flex items-center space-x-1 text-red-700 hover:text-red-900 text-xs"
                            >
                              <X className="w-3 h-3" />
                              <span>Remove from Building</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => openAssignModal(user, "manager")}
                              className="flex items-center space-x-1 text-red-700 hover:text-red-900 text-xs"
                            >
                              <Building className="w-3 h-3" />
                              <span>Assign to Building</span>
                            </button>
                          )}
                        </>
                      )}
                      {user.roleName === "ROLE_ACCOUNTANT" && (
                        <>
                          {branchName ? (
                            <button
                              onClick={() => handleRemoveAssignment(user)}
                              className="flex items-center space-x-1 text-red-700 hover:text-red-900 text-xs"
                            >
                              <X className="w-3 h-3" />
                              <span>Remove from Branch</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => openAssignModal(user, "accountant")}
                              className="flex items-center space-x-1 text-red-700 hover:text-red-900 text-xs"
                            >
                              <Briefcase className="w-3 h-3" />
                              <span>Assign to Branch</span>
                            </button>
                          )}
                        </>
                      )}
                      
                      <button 
                        onClick={() => handleEditClick(user)}
                        className="flex items-center space-x-1 text-stone-600 hover:text-stone-800 text-xs"
                      >
                        <Edit className="w-3 h-3" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="flex items-center space-x-1 text-red-700 hover:text-red-900 text-xs"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-neutral-800 bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <h3 className="text-lg font-semibold mb-4 text-neutral-800">Add New User</h3>
            <form onSubmit={handleAddUser}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newUser.fullName}
                    onChange={(e) => setNewUser({...newUser, fullName: e.target.value})}
                    className="mt-1 block w-full border border-stone-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-700 focus:border-red-700 text-sm text-neutral-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700">Email</label>
                  <input
                    type="email"
                    required
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    className="mt-1 block w-full border border-stone-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-700 focus:border-red-700 text-sm text-neutral-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700">Username</label>
                  <input
                    type="text"
                    required
                    value={newUser.username}
                    onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                    className="mt-1 block w-full border border-stone-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-700 focus:border-red-700 text-sm text-neutral-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700">Role</label>
                  <select
                    value={newUser.roleName}
                    onChange={(e) => setNewUser({...newUser, roleName: e.target.value})}
                    className="mt-1 block w-full border border-stone-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-700 focus:border-red-700 text-sm text-neutral-800 bg-white"
                  >
                    <option value="ROLE_GUEST">Guest</option>
                    <option value="ROLE_TENANT">Tenant</option>
                    <option value="ROLE_ACCOUNTANT">Accountant</option>
                    <option value="ROLE_MANAGER">Manager</option>
                    <option value="ROLE_BOD">Board of Directors</option>
                  </select>
                </div>

                {/* Building Selection for Managers - Only show available buildings */}
                {showBuildingSelection && (
                  <div>
                    <label className="block text-sm font-medium text-stone-700">Assign to Building</label>
                    <select
                      value={newUser.buildingId || ""}
                      onChange={(e) => handleBuildingChange(e.target.value)}
                      className="mt-1 block w-full border border-stone-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-700 focus:border-red-700 text-sm text-neutral-800 bg-white"
                    >
                      <option value="">Select a building (optional)</option>
                      {availableBuildings.map((building) => (
                        <option key={building.id} value={building.id}>
                          {building.buildingName} - {building.branchName}
                        </option>
                      ))}
                      {availableBuildings.length === 0 && (
                        <option value="" disabled>No available buildings</option>
                      )}
                    </select>
                    <p className="text-xs text-stone-500 mt-1">
                      Only buildings without managers are shown
                    </p>
                  </div>
                )}

                {/* Branch Selection for Accountants - Only show available branches */}
                {showBranchSelection && (
                  <div>
                    <label className="block text-sm font-medium text-stone-700">Assign to Branch</label>
                    <select
                      value={newUser.branchId || ""}
                      onChange={(e) => handleBranchChange(e.target.value)}
                      className="mt-1 block w-full border border-stone-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-700 focus:border-red-700 text-sm text-neutral-800 bg-white"
                    >
                      <option value="">Select a branch (optional)</option>
                      {availableBranches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.branchName}
                        </option>
                      ))}
                      {availableBranches.length === 0 && (
                        <option value="" disabled>No available branches</option>
                      )}
                    </select>
                    <p className="text-xs text-stone-500 mt-1">
                      Only branches without accountants are shown
                    </p>
                  </div>
                )}
              </div>
              <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium text-stone-700 hover:text-neutral-800 border border-stone-300 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-700 rounded-md hover:bg-red-800 disabled:opacity-50 transition-colors"
                >
                  {loading ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal - Simplified with only basic info */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-neutral-800 bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <h3 className="text-lg font-semibold mb-4 text-neutral-800">Edit User: {editingUser.fullName}</h3>
            <p className="text-sm text-stone-600 mb-4">Role: {getRoleDisplayName(editingUser.roleName)}</p>
            <form onSubmit={handleEditUser}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editUserData.fullName}
                    onChange={(e) => setEditUserData({...editUserData, fullName: e.target.value})}
                    className="mt-1 block w-full border border-stone-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-700 focus:border-red-700 text-sm text-neutral-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700">Email</label>
                  <input
                    type="email"
                    required
                    value={editUserData.email}
                    onChange={(e) => setEditUserData({...editUserData, email: e.target.value})}
                    className="mt-1 block w-full border border-stone-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-700 focus:border-red-700 text-sm text-neutral-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700">Username</label>
                  <input
                    type="text"
                    required
                    value={editUserData.username}
                    onChange={(e) => setEditUserData({...editUserData, username: e.target.value})}
                    className="mt-1 block w-full border border-stone-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-700 focus:border-red-700 text-sm text-neutral-800"
                  />
                </div>
              </div>
              <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-stone-700 hover:text-neutral-800 border border-stone-300 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-700 rounded-md hover:bg-red-800 disabled:opacity-50 transition-colors"
                >
                  {loading ? "Updating..." : "Update User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign User Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-neutral-800 bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <h3 className="text-lg font-semibold mb-4 text-neutral-800">
              Assign {selectedUser?.fullName} as {assignment.assignmentType === "manager" ? "Building Manager" : "Branch Accountant"}
            </h3>
            <form onSubmit={handleAssignUser}>
              <div className="space-y-4">
                {assignment.assignmentType === "manager" && (
                  <div>
                    <label className="block text-sm font-medium text-stone-700">Select Building</label>
                    <select
                      required
                      value={assignment.buildingId}
                      onChange={(e) => handleAssignmentBuildingChange(e.target.value)}
                      className="mt-1 block w-full border border-stone-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-700 focus:border-red-700 text-sm text-neutral-800 bg-white"
                    >
                      <option value="">Choose a building...</option>
                      {availableBuildings.map((building) => (
                        <option key={building.id} value={building.id}>
                          {building.buildingName} - {building.branchName}
                        </option>
                      ))}
                      {availableBuildings.length === 0 && (
                        <option value="" disabled>No available buildings</option>
                      )}
                    </select>
                    <p className="text-xs text-stone-500 mt-1">
                      Only buildings without managers are shown
                    </p>
                  </div>
                )}
                {assignment.assignmentType === "accountant" && (
                  <div>
                    <label className="block text-sm font-medium text-stone-700">Select Branch</label>
                    <select
                      required
                      value={assignment.branchId}
                      onChange={(e) => handleAssignmentBranchChange(e.target.value)}
                      className="mt-1 block w-full border border-stone-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-700 focus:border-red-700 text-sm text-neutral-800 bg-white"
                    >
                      <option value="">Choose a branch...</option>
                      {availableBranches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.branchName}
                        </option>
                      ))}
                      {availableBranches.length === 0 && (
                        <option value="" disabled>No available branches</option>
                      )}
                    </select>
                    <p className="text-xs text-stone-500 mt-1">
                      Only branches without accountants are shown
                    </p>
                  </div>
                )}
              </div>
              <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 text-sm font-medium text-stone-700 hover:text-neutral-800 border border-stone-300 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || (assignment.assignmentType === "manager" && availableBuildings.length === 0) || (assignment.assignmentType === "accountant" && availableBranches.length === 0)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-700 rounded-md hover:bg-red-800 disabled:opacity-50 transition-colors"
                >
                  {loading ? "Assigning..." : "Assign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;