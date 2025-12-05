/** @format */

import React, { useState, useEffect } from "react";
import {
  Edit,
  Trash2,
  Plus,
  Building,
  Briefcase,
  X,
  MoreVertical,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  AlertTriangle,
  Users,
  UserCog,
  ThumbsUp,
  ThumbsDown,
  Clock,
  UserCheck,
  UserX,
} from "lucide-react";
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
  approvalStatus?: "PENDING" | "APPROVED" | "REJECTED";
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
  password?: string;
  branchId?: number | null;
  buildingId?: number | null;
  approvalStatus?: "PENDING" | "APPROVED" | "REJECTED";
}

interface Assignment {
  userId: number;
  buildingId: number;
  branchId: number;
  assignmentType: "manager" | "accountant" | "";
}

interface ValidationErrors {
  username?: string;
  email?: string;
  fullName?: string;
  general?: string;
}

interface Notification {
  id: number;
  type: "success" | "error" | "info" | "warning";
  message: string;
}

interface Confirmation {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

type TabType =
  | "all"
  | "guests"
  | "managers"
  | "accountants"
  | "admins"
  | "tenants"
  | "pending-approval";

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
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState<number | null>(null);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null
  );
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [confirmation, setConfirmation] = useState<Confirmation>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const [activeTab, setActiveTab] = useState<TabType>("all");
  // const { t } = useTranslation();

  const [newUser, setNewUser] = useState<UserRequest>({
    username: "",
    email: "",
    fullName: "",
    roleName: "ROLE_GUEST",
    password: "",
    branchId: null,
    buildingId: null,
    approvalStatus: "PENDING",
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
    assignmentType: "",
  });

  const patterns = {
    username: /^[a-zA-Z0-9_]{3,50}$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    fullName: /^[a-zA-Z\s.'-]{2,100}$/,
  };

  const maxLengths = {
    username: 50,
    email: 100,
    fullName: 100,
  };

  const validationMessages = {
    username: {
      required: "Username is required",
      invalid:
        "Username must be 3-50 characters (letters, numbers, underscores only)",
      tooLong: `Username cannot exceed ${maxLengths.username} characters`,
      exists: "Username already exists",
    },
    email: {
      required: "Email is required",
      invalid: "Please enter a valid email address",
      tooLong: `Email cannot exceed ${maxLengths.email} characters`,
      exists: "Email already exists",
    },
    fullName: {
      required: "Full name is required",
      invalid:
        "Full name must be 2-100 characters (letters, spaces, dots, apostrophes, hyphens only)",
      tooLong: `Full name cannot exceed ${maxLengths.fullName} characters`,
    },
  };

  const getFilteredUsers = () => {
    switch (activeTab) {
      case "all":
        return users;
      case "guests":
        return users.filter((user) => user.roleName === "ROLE_GUEST");
      case "managers":
        return users.filter((user) => user.roleName === "ROLE_MANAGER");
      case "accountants":
        return users.filter((user) => user.roleName === "ROLE_ACCOUNTANT");
      case "admins":
        return users.filter((user) => user.roleName === "ROLE_ADMIN");
      case "tenants":
        return users.filter((user) => user.roleName === "ROLE_TENANT");
      case "pending-approval":
        return users.filter(
          (user) =>
            user.roleName === "ROLE_GUEST" &&
            (user.approvalStatus === "PENDING" || !user.approvalStatus)
        );
      default:
        return users;
    }
  };

  const getTabDisplayName = (tab: TabType) => {
    const tabMap: Record<TabType, string> = {
      all: "All Users",
      guests: "Guests",
      managers: "Managers",
      accountants: "Accountants",
      admins: "Administrators",
      tenants: "Tenants",
      "pending-approval": "Pending Approval",
    };
    return tabMap[tab] || tab;
  };

  const getTabIcon = (tab: TabType) => {
    const iconMap: Record<TabType, React.ReactNode> = {
      all: <Users className="w-4 h-4" />,
      guests: <UserCog className="w-4 h-4" />,
      managers: <Building className="w-4 h-4" />,
      accountants: <Briefcase className="w-4 h-4" />,
      admins: <AlertCircle className="w-4 h-4" />,
      tenants: <Users className="w-4 h-4" />,
      "pending-approval": <Clock className="w-4 h-4" />,
    };
    return iconMap[tab] || <Users className="w-4 h-4" />;
  };

  const getUserCountByTab = (tab: TabType) => {
    switch (tab) {
      case "all":
        return users.length;
      case "guests":
        return users.filter((user) => user.roleName === "ROLE_GUEST").length;
      case "managers":
        return users.filter((user) => user.roleName === "ROLE_MANAGER").length;
      case "accountants":
        return users.filter((user) => user.roleName === "ROLE_ACCOUNTANT")
          .length;
      case "admins":
        return users.filter((user) => user.roleName === "ROLE_ADMIN").length;
      case "tenants":
        return users.filter((user) => user.roleName === "ROLE_TENANT").length;
      case "pending-approval":
        return users.filter(
          (user) =>
            user.roleName === "ROLE_GUEST" &&
            (user.approvalStatus === "PENDING" || !user.approvalStatus)
        ).length;
      default:
        return 0;
    }
  };

  const getApprovalStatusDisplay = (status?: string) => {
    // Default to PENDING if status is undefined
    const effectiveStatus = status || "PENDING";

    switch (effectiveStatus) {
      case "PENDING":
        return {
          text: "Pending",
          icon: <Clock className="w-3 h-3" />,
          color: "bg-yellow-100 text-yellow-800",
        };
      case "APPROVED":
        return {
          text: "Approved",
          icon: <CheckCircle className="w-3 h-3" />,
          color: "bg-green-100 text-green-800",
        };
      case "REJECTED":
        return {
          text: "Rejected",
          icon: <XCircle className="w-3 h-3" />,
          color: "bg-red-100 text-red-800",
        };
      default:
        return {
          text: "Pending",
          icon: <Clock className="w-3 h-3" />,
          color: "bg-yellow-100 text-yellow-800",
        };
    }
  };

  // UPDATE: Function to update user approval status (updated to include PENDING)
  const updateUserApprovalStatus = async (
    userId: number,
    status: "APPROVED" | "REJECTED" | "PENDING"
  ) => {
    try {
      setLoading(true);
      const response = await userApi.updateApprovalStatus(userId, {
        approvalStatus: status,
      });

      if (response.data) {
        addNotification(
          "success",
          `User status updated to ${status.toLowerCase()} successfully!`
        );

        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === userId ? { ...user, approvalStatus: status } : user
          )
        );
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        `Failed to update user status to ${status.toLowerCase()}`;
      addNotification("error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // UPDATE: Function to handle approve user click
  const handleApproveUserClick = (user: User) => {
    const isCurrentlyApproved = user.approvalStatus === "APPROVED";
    const message = isCurrentlyApproved
      ? `Are you sure you want to re-approve ${user.fullName}? This will grant them access to the system.`
      : `Are you sure you want to approve ${user.fullName}? This will grant them access to the system.`;

    showConfirmation({
      title: "Approve User",
      message,
      confirmText: "Approve",
      cancelText: "Cancel",
      onConfirm: async () => {
        await updateUserApprovalStatus(user.id, "APPROVED");
        setMobileMenuOpen(null);
      },
      onCancel: () => {
        setMobileMenuOpen(null);
      },
    });
  };

  // UPDATE: Function to handle reject user click
  const handleRejectUserClick = (user: User) => {
    const isCurrentlyRejected = user.approvalStatus === "REJECTED";
    const message = isCurrentlyRejected
      ? `Are you sure you want to keep ${user.fullName} rejected? This will deny them access to the system.`
      : `Are you sure you want to reject ${user.fullName}? This will deny them access to the system.`;

    showConfirmation({
      title: "Reject User",
      message,
      confirmText: "Reject",
      cancelText: "Cancel",
      onConfirm: async () => {
        await updateUserApprovalStatus(user.id, "REJECTED");
        setMobileMenuOpen(null);
      },
      onCancel: () => {
        setMobileMenuOpen(null);
      },
    });
  };

  // NEW: Function to handle pending user click
  const handlePendingUserClick = (user: User) => {
    const isCurrentlyPending =
      user.approvalStatus === "PENDING" || !user.approvalStatus;
    const message = isCurrentlyPending
      ? `Are you sure you want to keep ${user.fullName} in pending status?`
      : `Are you sure you want to set ${user.fullName} to pending status?`;

    showConfirmation({
      title: "Set User to Pending",
      message,
      confirmText: "Set to Pending",
      cancelText: "Cancel",
      onConfirm: async () => {
        await updateUserApprovalStatus(user.id, "PENDING");
        setMobileMenuOpen(null);
      },
      onCancel: () => {
        setMobileMenuOpen(null);
      },
    });
  };

  const addNotification = (type: Notification["type"], message: string) => {
    const id = Date.now();
    const newNotification: Notification = { id, type, message };
    setNotifications((prev) => [...prev, newNotification]);

    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  };

  const removeNotification = (id: number) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
  };

  const showConfirmation = (config: Omit<Confirmation, "isOpen">) => {
    setConfirmation({
      ...config,
      isOpen: true,
    });
  };

  const closeConfirmation = () => {
    setConfirmation((prev) => ({ ...prev, isOpen: false }));
  };

  const handleConfirm = () => {
    confirmation.onConfirm();
    closeConfirmation();
  };

  const handleCancel = () => {
    if (confirmation.onCancel) {
      confirmation.onCancel();
    }
    closeConfirmation();
  };

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
        fetchAvailableBranches(),
      ]);
    } catch (error) {
      setErrors({ general: "Failed to load data. Please refresh the page." });
      addNotification("error", "Failed to load data. Please refresh the page.");
    }
  };

  const fetchUsers = async () => {
    try {
      setErrors({});
      const response = await userApi.getAll();

      console.log("API Response:", response); // Add this for debugging
      console.log("API Data:", response.data); // Add this for debugging

      let usersData = response.data;

      if (response.data && Array.isArray(response.data)) {
        usersData = response.data;
      } else if (response.data && response.data.content) {
        usersData = response.data.content;
      }

      // Ensure all guest users have an approvalStatus
      const processedUsers = usersData.map((user: User) => {
        // For ROLE_GUEST users, ensure approvalStatus is properly set
        if (user.roleName === "ROLE_GUEST") {
          return {
            ...user,
            // If approvalStatus is missing, set it to PENDING
            approvalStatus: user.approvalStatus || "PENDING",
          };
        }
        return user;
      });

      setUsers(processedUsers);
    } catch (error: any) {
      setErrors({ general: "Failed to load users" });
      addNotification("error", "Failed to load users");
    }
  };

  const fetchBuildings = async () => {
    try {
      const response = await buildingApi.getAll();
      setBuildings(response.data);
    } catch (error) {
      console.error("Error fetching buildings:", error);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await branchApi.getAll();
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
      const response = await buildingApi.getAll();
      setAvailableBuildings(response.data);
    }
  };

  const fetchAvailableBranches = async () => {
    try {
      const response = await branchApi.getAvailableBranches();
      setAvailableBranches(response.data);
    } catch (error) {
      const response = await branchApi.getAll();
      setAvailableBranches(response.data);
    }
  };

  const getUserBuildingName = (user: User): string => {
    if (user.buildingId) {
      const building = buildings.find((b) => b.id === user.buildingId);
      return building ? building.buildingName : "Unknown Building";
    }

    if (user.building) {
      return user.building.buildingName || "Unknown Building";
    }

    if (user.buildingName) {
      return user.buildingName;
    }

    return "";
  };

  const getUserBranchName = (user: User): string => {
    if (user.branchId) {
      const branch = branches.find((b) => b.id === user.branchId);
      return branch ? branch.branchName : "Unknown Branch";
    }

    if (user.branch) {
      return user.branch.branchName || "Unknown Branch";
    }

    if (user.branchName) {
      return user.branchName;
    }

    return "";
  };

  const getUserBuildingId = (user: User): number | undefined => {
    if (user.buildingId) return user.buildingId;
    if (user.building) return user.building.id;
    return undefined;
  };

  const getUserBranchId = (user: User): number | undefined => {
    if (user.branchId) return user.branchId;
    if (user.branch) return user.branch.id;
    return undefined;
  };

  const validateField = (
    name: keyof ValidationErrors,
    value: string
  ): string => {
    if (!value.trim()) {
      return validationMessages[name]?.required || "This field is required";
    }

    if (value.length > maxLengths[name]) {
      return (
        validationMessages[name]?.tooLong ||
        `Cannot exceed ${maxLengths[name]} characters`
      );
    }

    switch (name) {
      case "username":
        if (!patterns.username.test(value)) {
          return validationMessages.username.invalid;
        }
        break;
      case "email":
        if (!patterns.email.test(value)) {
          return validationMessages.email.invalid;
        }
        break;
      case "fullName":
        if (!patterns.fullName.test(value)) {
          return validationMessages.fullName.invalid;
        }
        break;
    }

    return "";
  };

  const validateUserForm = (formData: UserRequest): ValidationErrors => {
    const newErrors: ValidationErrors = {};

    const usernameError = validateField("username", formData.username);
    if (usernameError) newErrors.username = usernameError;

    const emailError = validateField("email", formData.email);
    if (emailError) newErrors.email = emailError;

    const fullNameError = validateField("fullName", formData.fullName);
    if (fullNameError) newErrors.fullName = fullNameError;

    return newErrors;
  };

  const checkUsernameAvailability = async (username: string) => {
    if (
      !username ||
      username.length < 3 ||
      username.length > maxLengths.username
    ) {
      setUsernameAvailable(null);
      return;
    }

    setCheckingUsername(true);
    try {
      const response = await userApi.checkUsername(username);
      setUsernameAvailable(response.data.available);

      if (!response.data.available) {
        setErrors((prev) => ({
          ...prev,
          username: validationMessages.username.exists,
        }));
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.username;
          return newErrors;
        });
      }
    } catch (error) {
      console.error("Error checking username:", error);
    } finally {
      setCheckingUsername(false);
    }
  };

  const checkEmailAvailability = async (email: string) => {
    if (
      !email ||
      !patterns.email.test(email) ||
      email.length > maxLengths.email
    ) {
      setEmailAvailable(null);
      return;
    }

    setCheckingEmail(true);
    try {
      const response = await userApi.checkEmail(email);
      setEmailAvailable(response.data.available);

      if (!response.data.available) {
        setErrors((prev) => ({
          ...prev,
          email: validationMessages.email.exists,
        }));
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.email;
          return newErrors;
        });
      }
    } catch (error) {
      console.error("Error checking email:", error);
    } finally {
      setCheckingEmail(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();

    setFormSubmitted(true);

    const validationErrors = validateUserForm(newUser);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const userData: UserRequest = {
        username: newUser.username.trim(),
        email: newUser.email.trim().toLowerCase(),
        fullName: newUser.fullName.trim(),
        roleName: newUser.roleName,
        password: undefined,
        branchId: newUser.branchId,
        buildingId: newUser.buildingId,
        approvalStatus: newUser.approvalStatus,
      };

      const response = await userApi.create(userData);

      if (response.data && response.data.success === false) {
        if (response.data.errors) {
          const backendErrors: ValidationErrors = {};
          Object.entries(response.data.errors).forEach(([key, value]) => {
            backendErrors[key as keyof ValidationErrors] = value as string;
          });
          setErrors(backendErrors);
        } else if (response.data.errors) {
          setErrors({ general: response.data.errors });
        } else if (response.data.message) {
          setErrors({ general: response.data.message });
        }
        setLoading(false);
        return;
      }

      const createdUser = response.data?.user || response.data;

      addNotification(
        "success",
        `User "${newUser.fullName}" created successfully! A default password has been generated.`
      );

      if (createdUser && createdUser.id) {
        if (newUser.roleName === "ROLE_MANAGER" && newUser.buildingId) {
          try {
            await buildingApi.assignManager(newUser.buildingId, createdUser.id);
            addNotification(
              "info",
              "Manager assigned to building successfully."
            );
          } catch (assignError: any) {
            console.error("Failed to assign manager to building:", assignError);
            addNotification(
              "warning",
              "User created but manager assignment failed."
            );
          }
        }

        if (newUser.roleName === "ROLE_ACCOUNTANT" && newUser.branchId) {
          try {
            await branchApi.assignAccountant(newUser.branchId, createdUser.id);
            addNotification(
              "info",
              "Accountant assigned to branch successfully."
            );
          } catch (assignError: any) {
            console.error(
              "Failed to assign accountant to branch:",
              assignError
            );
            addNotification(
              "warning",
              "User created but accountant assignment failed."
            );
          }
        }
      }

      setShowAddModal(false);
      resetNewUserForm();
      setFormSubmitted(false);

      await fetchAllData();
    } catch (error: any) {
      if (error.response) {
        if (error.response.data?.errors) {
          const backendErrors: ValidationErrors = {};
          Object.entries(error.response.data.errors).forEach(([key, value]) => {
            backendErrors[key as keyof ValidationErrors] = value as string;
          });
          setErrors(backendErrors);
        } else if (error.response.data?.error) {
          setErrors({ general: error.response.data.error });
          addNotification("error", error.response.data.error);
        } else if (error.response.data?.message) {
          setErrors({ general: error.response.data.message });
          addNotification("error", error.response.data.message);
        } else if (error.response.status === 401) {
          setErrors({ general: "Unauthorized. Please check your login." });
          addNotification("error", "Unauthorized. Please check your login.");
        } else if (error.response.status === 403) {
          setErrors({
            general: "Forbidden. You don't have permission to create users.",
          });
          addNotification(
            "error",
            "Forbidden. You don't have permission to create users."
          );
        } else if (error.response.status === 400) {
          setErrors({ general: "Bad request. Please check the form data." });
          addNotification("error", "Bad request. Please check the form data.");
        } else {
          setErrors({
            general: `Server error (${error.response.status}). Please try again.`,
          });
          addNotification(
            "error",
            `Server error (${error.response.status}). Please try again.`
          );
        }
      } else if (error.request) {
        setErrors({
          general: "No response from server. Check your network connection.",
        });
        addNotification(
          "error",
          "No response from server. Check your network connection."
        );
      } else {
        setErrors({ general: "Error creating user: " + error.message });
        addNotification("error", "Error creating user: " + error.message);
      }
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
    setErrors({});
    setMobileMenuOpen(null);
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const validationErrors = validateUserForm({
      ...editUserData,
      roleName: editingUser.roleName,
      password: "",
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const userData = {
        username: editUserData.username.trim(),
        email: editUserData.email.trim().toLowerCase(),
        fullName: editUserData.fullName.trim(),
      };

      const response = await userApi.update(editingUser.id, userData);

      if (
        response.data &&
        response.data.success === false &&
        response.data.errors
      ) {
        const backendErrors: ValidationErrors = {};
        Object.entries(response.data.errors).forEach(([key, value]) => {
          backendErrors[key as keyof ValidationErrors] = value as string;
        });
        setErrors(backendErrors);
        return;
      }

      addNotification("success", "User updated successfully!");

      setShowEditModal(false);
      setEditingUser(null);
      fetchAllData();
    } catch (error: any) {
      if (error.response?.data?.errors) {
        const backendErrors: ValidationErrors = {};
        Object.entries(error.response.data.errors).forEach(([key, value]) => {
          backendErrors[key as keyof ValidationErrors] = value as string;
        });
        setErrors(backendErrors);
      } else {
        const errorMessage =
          error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to update user. Please try again.";
        setErrors({ general: errorMessage });
        addNotification("error", errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAssignUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      if (assignment.assignmentType === "manager" && assignment.buildingId) {
        await buildingApi.assignManager(
          assignment.buildingId,
          assignment.userId
        );
        addNotification(
          "success",
          "Manager assigned to building successfully!"
        );
      } else if (
        assignment.assignmentType === "accountant" &&
        assignment.branchId
      ) {
        await branchApi.assignAccountant(
          assignment.branchId,
          assignment.userId
        );
        addNotification(
          "success",
          "Accountant assigned to branch successfully!"
        );
      } else {
        throw new Error("Invalid assignment parameters");
      }

      setShowAssignModal(false);
      setAssignment({
        userId: 0,
        buildingId: 0,
        branchId: 0,
        assignmentType: "",
      });

      fetchAllData();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to assign user";
      setErrors({ general: errorMessage });
      addNotification("error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAssignmentClick = (user: User) => {
    const buildingId = getUserBuildingId(user);
    const branchId = getUserBranchId(user);

    showConfirmation({
      title: "Remove Assignment",
      message: `Are you sure you want to remove ${user.fullName} from their assignment?`,
      confirmText: "Remove",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          if (user.roleName === "ROLE_MANAGER" && buildingId) {
            await buildingApi.removeManager(buildingId);
            addNotification(
              "success",
              "Manager removed from building successfully!"
            );
          } else if (user.roleName === "ROLE_ACCOUNTANT" && branchId) {
            await branchApi.removeAccountant(branchId);
            addNotification(
              "success",
              "Accountant removed from branch successfully!"
            );
          }

          fetchAllData();
        } catch (error: any) {
          const errorMessage =
            error.response?.data?.message || "Failed to remove assignment";
          setErrors({ general: errorMessage });
          addNotification("error", errorMessage);
        }
        setMobileMenuOpen(null);
      },
      onCancel: () => {
        setMobileMenuOpen(null);
      },
    });
  };

  const handleDeleteUserClick = (id: number) => {
    const user = users.find((u) => u.id === id);

    showConfirmation({
      title: "Delete User",
      message: user
        ? `Are you sure you want to delete ${user.fullName}? This action cannot be undone.`
        : "Are you sure you want to delete this user? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          await userApi.delete(id);
          addNotification("success", "User deleted successfully!");
          fetchAllData();
        } catch (error: any) {
          const errorMessage =
            error.response?.data?.message || "Failed to delete user";
          setErrors({ general: errorMessage });
          addNotification("error", errorMessage);
        }
        setMobileMenuOpen(null);
      },
      onCancel: () => {
        setMobileMenuOpen(null);
      },
    });
  };

  const openAssignModal = (user: User, type: "manager" | "accountant") => {
    setSelectedUser(user);
    setAssignment({
      userId: user.id,
      buildingId: 0,
      branchId: 0,
      assignmentType: type,
    });
    setShowAssignModal(true);
    setErrors({});
    setMobileMenuOpen(null);
  };

  const getRoleDisplayName = (roleName: string) => {
    const roleMap: { [key: string]: string } = {
      ROLE_ADMIN: "Administrator",
      ROLE_MANAGER: "Manager",
      ROLE_ACCOUNTANT: "Accountant",
      ROLE_BOD: "Board of Directors",
      ROLE_TENANT: "Tenant",
      ROLE_GUEST: "Guest",
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

  const truncateInput = (value: string, maxLength: number): string => {
    return value.length > maxLength ? value.substring(0, maxLength) : value;
  };

  const handleFieldChange = (field: keyof UserRequest, value: string) => {
    const truncatedValue = truncateInput(value, maxLengths[field]);

    setNewUser((prev) => ({ ...prev, [field]: truncatedValue }));

    if (errors[field as keyof ValidationErrors]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field as keyof ValidationErrors];
        return newErrors;
      });
    }

    if (field === "username" && truncatedValue.length >= 3) {
      const error = validateField("username", truncatedValue);
      if (error) {
        setErrors((prev) => ({ ...prev, username: error }));
      } else {
        checkUsernameAvailability(truncatedValue);
      }
    }

    if (field === "email" && patterns.email.test(truncatedValue)) {
      const error = validateField("email", truncatedValue);
      if (error) {
        setErrors((prev) => ({ ...prev, email: error }));
      } else {
        checkEmailAvailability(truncatedValue);
      }
    }

    if (field === "fullName") {
      const error = validateField("fullName", truncatedValue);
      if (error) {
        setErrors((prev) => ({ ...prev, fullName: error }));
      }
    }
  };

  const handleEditFieldChange = (
    field: "username" | "email" | "fullName",
    value: string
  ) => {
    const truncatedValue = truncateInput(value, maxLengths[field]);

    setEditUserData((prev) => ({ ...prev, [field]: truncatedValue }));

    if (errors[field as keyof ValidationErrors]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    const error = validateField(field, truncatedValue);
    if (error) {
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  const resetNewUserForm = () => {
    setNewUser({
      username: "",
      email: "",
      fullName: "",
      roleName: "ROLE_GUEST",
      password: "",
      branchId: null,
      buildingId: null,
      approvalStatus: "PENDING",
    });
    setErrors({});
    setUsernameAvailable(null);
    setEmailAvailable(null);
  };

  const showBuildingSelection = newUser.roleName === "ROLE_MANAGER";
  const showBranchSelection = newUser.roleName === "ROLE_ACCOUNTANT";

  const toggleMobileMenu = (userId: number) => {
    setMobileMenuOpen(mobileMenuOpen === userId ? null : userId);
  };

  const CharacterCounter = ({
    value,
    maxLength,
    field,
  }: {
    value: string;
    maxLength: number;
    field: string;
  }) => {
    const currentLength = value.length;
    const isNearLimit = currentLength > maxLength * 0.8;
    const isOverLimit = currentLength > maxLength;

    return (
      <div
        className={`text-xs mt-1 ${
          isOverLimit
            ? "text-red-600"
            : isNearLimit
            ? "text-amber-600"
            : "text-stone-500"
        }`}
      >
        {currentLength}/{maxLength} characters {isOverLimit && "(Too long!)"}
      </div>
    );
  };

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-5 h-5" />;
      case "error":
        return <XCircle className="w-5 h-5" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5" />;
      case "info":
        return <Info className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getNotificationBgColor = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return "bg-green-100 border-green-400 text-green-800";
      case "error":
        return "bg-red-100 border-red-400 text-red-800";
      case "warning":
        return "bg-amber-100 border-amber-400 text-amber-800";
      case "info":
        return "bg-blue-100 border-blue-400 text-blue-800";
      default:
        return "bg-blue-100 border-blue-400 text-blue-800";
    }
  };

  const tabs: TabType[] = [
    "all",
    "guests",
    "managers",
    "accountants",
    "admins",
    "tenants",
    "pending-approval",
  ];
  const filteredUsers = getFilteredUsers();

  return (
    <div className="p-4 sm:p-6 bg-stone-100 min-h-screen">
      {/* Notification Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md w-full">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`flex items-start p-4 rounded-lg border shadow-lg ${getNotificationBgColor(
              notification.type
            )} animate-fade-in`}
          >
            <div className="flex-shrink-0 mr-3 mt-0.5">
              {getNotificationIcon(notification.type)}
            </div>
            <div className="flex-1 text-sm">{notification.message}</div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="flex-shrink-0 ml-3 text-current hover:opacity-70"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Confirmation Modal */}
      {confirmation.isOpen && (
        <div className="fixed inset-0 bg-neutral-800 bg-opacity-70 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-neutral-800">
                {confirmation.title}
              </h3>
              <p className="text-stone-600 mt-2">{confirmation.message}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 justify-end">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-stone-700 hover:text-neutral-800 border border-stone-300 rounded-md transition-colors"
              >
                {confirmation.cancelText || "Cancel"}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-red-700 rounded-md hover:bg-red-800 transition-colors"
              >
                {confirmation.confirmText || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

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
          onClick={() => {
            resetNewUserForm();
            setShowAddModal(true);
          }}
          className="flex items-center space-x-2 bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-lg transition-colors w-full sm:w-auto justify-center shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Add New User</span>
        </button>
      </div>

      {errors.general && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded text-sm flex items-start">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
          <span>{errors.general}</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                activeTab === tab
                  ? "bg-red-700 text-white shadow-md"
                  : "bg-white text-stone-700 hover:bg-stone-50 border border-stone-200"
              }`}
            >
              {getTabIcon(tab)}
              <span className="font-medium">{getTabDisplayName(tab)}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  activeTab === tab
                    ? "bg-red-800 text-white"
                    : "bg-stone-100 text-stone-700"
                }`}
              >
                {getUserCountByTab(tab)}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            <p className="text-sm text-blue-800">
              Showing{" "}
              <span className="font-semibold">{filteredUsers.length}</span>{" "}
              {getTabDisplayName(activeTab).toLowerCase()}
              {activeTab === "guests" &&
                " - Users with limited access permissions"}
              {activeTab === "pending-approval" &&
                " - Guest users awaiting approval"}
            </p>
          </div>
        </div>
      </div>

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
                {(activeTab === "guests" ||
                  activeTab === "pending-approval" ||
                  activeTab === "all") && (
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-neutral-800 uppercase tracking-wider">
                    Approval Status
                  </th>
                )}
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
              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={
                      activeTab === "guests" ||
                      activeTab === "pending-approval" ||
                      activeTab === "all"
                        ? 6
                        : 5
                    }
                    className="px-4 sm:px-6 py-8 text-center text-stone-500"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <Users className="w-12 h-12 text-stone-300 mb-2" />
                      <p className="text-lg font-medium">No users found</p>
                      <p className="text-sm">
                        Try changing your filter or add a new user
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const buildingName = getUserBuildingName(user);
                  const branchName = getUserBranchName(user);
                  const hasAssignment = buildingName || branchName;
                  const approvalStatus = getApprovalStatusDisplay(
                    user.approvalStatus
                  );

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-stone-50 transition-colors"
                    >
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-neutral-800">
                            {user.fullName}
                          </p>
                          <p className="text-sm text-stone-500">{user.email}</p>
                          <p className="text-xs text-stone-400">
                            @{user.username}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-neutral-800">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            user.roleName === "ROLE_ADMIN"
                              ? "bg-purple-100 text-purple-800"
                              : user.roleName === "ROLE_MANAGER"
                              ? "bg-blue-100 text-blue-800"
                              : user.roleName === "ROLE_ACCOUNTANT"
                              ? "bg-green-100 text-green-800"
                              : user.roleName === "ROLE_GUEST"
                              ? "bg-gray-100 text-gray-800"
                              : user.roleName === "ROLE_TENANT"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-stone-100 text-stone-800"
                          }`}
                        >
                          {getRoleDisplayName(user.roleName)}
                        </span>
                      </td>
                      {(activeTab === "guests" ||
                        activeTab === "pending-approval" ||
                        activeTab === "all") && (
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          {user.roleName === "ROLE_GUEST" ? (
                            <span
                              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${approvalStatus.color}`}
                            >
                              {approvalStatus.icon}
                              {approvalStatus.text}
                            </span>
                          ) : (
                            <span className="text-stone-400 text-sm">-</span>
                          )}
                        </td>
                      )}
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
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {/* UPDATED: Approval buttons for all guest users */}
                          {user.roleName === "ROLE_GUEST" && (
                            <>
                              <button
                                onClick={() => handleApproveUserClick(user)}
                                className={`text-green-600 hover:text-green-800 transition-colors ${
                                  user.approvalStatus === "APPROVED"
                                    ? "opacity-100"
                                    : "opacity-70 hover:opacity-100"
                                }`}
                                title={
                                  user.approvalStatus === "APPROVED"
                                    ? "User is approved - Click to re-approve"
                                    : "Approve User"
                                }
                              >
                                <ThumbsUp className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleRejectUserClick(user)}
                                className={`text-red-600 hover:text-red-800 transition-colors ${
                                  user.approvalStatus === "REJECTED"
                                    ? "opacity-100"
                                    : "opacity-70 hover:opacity-100"
                                }`}
                                title={
                                  user.approvalStatus === "REJECTED"
                                    ? "User is rejected - Click to reject again"
                                    : "Reject User"
                                }
                              >
                                <ThumbsDown className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handlePendingUserClick(user)}
                                className={`text-yellow-600 hover:text-yellow-800 transition-colors ${
                                  user.approvalStatus === "PENDING" ||
                                  !user.approvalStatus
                                    ? "opacity-100"
                                    : "opacity-70 hover:opacity-100"
                                }`}
                                title={
                                  user.approvalStatus === "PENDING" ||
                                  !user.approvalStatus
                                    ? "User is pending - Click to set pending again"
                                    : "Set User to Pending"
                                }
                              >
                                <Clock className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {user.roleName === "ROLE_MANAGER" && (
                            <>
                              {buildingName ? (
                                <button
                                  onClick={() =>
                                    handleRemoveAssignmentClick(user)
                                  }
                                  className="text-red-700 hover:text-red-900 transition-colors"
                                  title="Remove from Building"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() =>
                                    openAssignModal(user, "manager")
                                  }
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
                                  onClick={() =>
                                    handleRemoveAssignmentClick(user)
                                  }
                                  className="text-red-700 hover:text-red-900 transition-colors"
                                  title="Remove from Branch"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() =>
                                    openAssignModal(user, "accountant")
                                  }
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
                            onClick={() => handleDeleteUserClick(user.id)}
                            className="text-red-700 hover:text-red-900 transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-stone-500">
              <div className="flex flex-col items-center justify-center">
                <Users className="w-12 h-12 text-stone-300 mb-2" />
                <p className="text-lg font-medium">No users found</p>
                <p className="text-sm">
                  Try changing your filter or add a new user
                </p>
              </div>
            </div>
          ) : (
            filteredUsers.map((user) => {
              const buildingName = getUserBuildingName(user);
              const branchName = getUserBranchName(user);
              const hasAssignment = buildingName || branchName;
              const approvalStatus = getApprovalStatusDisplay(
                user.approvalStatus
              );

              return (
                <div
                  key={user.id}
                  className="border-b border-stone-200 p-4 bg-white hover:bg-stone-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-neutral-800">
                            {user.fullName}
                          </p>
                          <p className="text-sm text-stone-500">{user.email}</p>
                          <p className="text-xs text-stone-400">
                            @{user.username}
                          </p>
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
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              user.roleName === "ROLE_ADMIN"
                                ? "bg-purple-100 text-purple-800"
                                : user.roleName === "ROLE_MANAGER"
                                ? "bg-blue-100 text-blue-800"
                                : user.roleName === "ROLE_ACCOUNTANT"
                                ? "bg-green-100 text-green-800"
                                : user.roleName === "ROLE_GUEST"
                                ? "bg-gray-100 text-gray-800"
                                : user.roleName === "ROLE_TENANT"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-stone-100 text-stone-800"
                            }`}
                          >
                            {getRoleDisplayName(user.roleName)}
                          </span>
                        </div>

                        {user.roleName === "ROLE_GUEST" && (
                          <div className="flex justify-between">
                            <span className="text-stone-500">Approval:</span>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${approvalStatus.color}`}
                            >
                              {approvalStatus.icon}
                              {approvalStatus.text}
                            </span>
                          </div>
                        )}

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
                                  <span className="text-xs">
                                    {buildingName}
                                  </span>
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
                        {/* UPDATED: Approval buttons for all guest users */}
                        {user.roleName === "ROLE_GUEST" && (
                          <>
                            <button
                              onClick={() => handleApproveUserClick(user)}
                              className={`flex items-center space-x-1 text-green-600 hover:text-green-800 text-xs ${
                                user.approvalStatus === "APPROVED"
                                  ? "font-semibold"
                                  : ""
                              }`}
                            >
                              <ThumbsUp className="w-3 h-3" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => handleRejectUserClick(user)}
                              className={`flex items-center space-x-1 text-red-600 hover:text-red-800 text-xs ${
                                user.approvalStatus === "REJECTED"
                                  ? "font-semibold"
                                  : ""
                              }`}
                            >
                              <ThumbsDown className="w-3 h-3" />
                              <span>Reject</span>
                            </button>
                            <button
                              onClick={() => handlePendingUserClick(user)}
                              className={`flex items-center space-x-1 text-yellow-600 hover:text-yellow-800 text-xs ${
                                user.approvalStatus === "PENDING" ||
                                !user.approvalStatus
                                  ? "font-semibold"
                                  : ""
                              }`}
                            >
                              <Clock className="w-3 h-3" />
                              <span>Set to Pending</span>
                            </button>
                          </>
                        )}

                        {user.roleName === "ROLE_MANAGER" && (
                          <>
                            {buildingName ? (
                              <button
                                onClick={() =>
                                  handleRemoveAssignmentClick(user)
                                }
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
                                onClick={() =>
                                  handleRemoveAssignmentClick(user)
                                }
                                className="flex items-center space-x-1 text-red-700 hover:text-red-900 text-xs"
                              >
                                <X className="w-3 h-3" />
                                <span>Remove from Branch</span>
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  openAssignModal(user, "accountant")
                                }
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
                          onClick={() => handleDeleteUserClick(user.id)}
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
            })
          )}
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-neutral-800 bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <h3 className="text-lg font-semibold mb-4 text-neutral-800">
              Add New User
            </h3>
            <p className="text-sm text-stone-600 mb-4">
              A default password will be auto-generated. User will need to reset
              it on first login.
            </p>
            <form onSubmit={handleAddUser}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newUser.fullName}
                    onChange={(e) =>
                      handleFieldChange("fullName", e.target.value)
                    }
                    maxLength={maxLengths.fullName}
                    className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-red-700 focus:border-red-700 text-sm text-neutral-800 ${
                      errors.fullName ? "border-red-500" : "border-stone-300"
                    }`}
                    placeholder="John Doe"
                  />
                  <CharacterCounter
                    value={newUser.fullName}
                    maxLength={maxLengths.fullName}
                    field="fullName"
                  />
                  {errors.fullName && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.fullName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={newUser.email}
                    onChange={(e) => handleFieldChange("email", e.target.value)}
                    maxLength={maxLengths.email}
                    className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-red-700 focus:border-red-700 text-sm text-neutral-800 ${
                      errors.email ? "border-red-500" : "border-stone-300"
                    }`}
                    placeholder="john@example.com"
                  />
                  <CharacterCounter
                    value={newUser.email}
                    maxLength={maxLengths.email}
                    field="email"
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                  )}
                  {checkingEmail && (
                    <p className="mt-1 text-xs text-blue-600">
                      Checking email availability...
                    </p>
                  )}
                  {emailAvailable !== null && !errors.email && (
                    <p
                      className={`mt-1 text-xs ${
                        emailAvailable ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {emailAvailable
                        ? "✓ Email is available"
                        : "✗ Email is already taken"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={newUser.username}
                    onChange={(e) =>
                      handleFieldChange("username", e.target.value)
                    }
                    maxLength={maxLengths.username}
                    className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-red-700 focus:border-red-700 text-sm text-neutral-800 ${
                      errors.username ? "border-red-500" : "border-stone-300"
                    }`}
                    placeholder="johndoe123"
                  />
                  <CharacterCounter
                    value={newUser.username}
                    maxLength={maxLengths.username}
                    field="username"
                  />
                  {errors.username && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.username}
                    </p>
                  )}
                  {checkingUsername && (
                    <p className="mt-1 text-xs text-blue-600">
                      Checking username availability...
                    </p>
                  )}
                  {usernameAvailable !== null && !errors.username && (
                    <p
                      className={`mt-1 text-xs ${
                        usernameAvailable ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {usernameAvailable
                        ? "✓ Username is available"
                        : "✗ Username is already taken"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700">
                    Role *
                  </label>
                  <select
                    value={newUser.roleName}
                    onChange={(e) =>
                      setNewUser({ ...newUser, roleName: e.target.value })
                    }
                    className="mt-1 block w-full border border-stone-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-700 focus:border-red-700 text-sm text-neutral-800 bg-white"
                  >
                    <option value="ROLE_GUEST">Guest</option>
                    <option value="ROLE_TENANT">Tenant</option>
                    <option value="ROLE_ACCOUNTANT">Accountant</option>
                    <option value="ROLE_MANAGER">Manager</option>
                    <option value="ROLE_BOD">Board of Directors</option>
                    <option value="ROLE_ADMIN">Administrator</option>
                  </select>
                </div>

                {newUser.roleName === "ROLE_GUEST" && (
                  <div>
                    <label className="block text-sm font-medium text-stone-700">
                      Initial Approval Status
                    </label>
                    <select
                      value={newUser.approvalStatus}
                      onChange={(e) =>
                        setNewUser({
                          ...newUser,
                          approvalStatus: e.target.value as
                            | "PENDING"
                            | "APPROVED"
                            | "REJECTED",
                        })
                      }
                      className="mt-1 block w-full border border-stone-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-700 focus:border-red-700 text-sm text-neutral-800 bg-white"
                    >
                      <option value="PENDING">
                        Pending (Requires Approval)
                      </option>
                      <option value="APPROVED">Approved (Auto Access)</option>
                      <option value="REJECTED">Rejected (No Access)</option>
                    </select>
                    <p className="text-xs text-stone-500 mt-1">
                      Guest users require approval before they can access the
                      system
                    </p>
                  </div>
                )}

                {showBuildingSelection && (
                  <div>
                    <label className="block text-sm font-medium text-stone-700">
                      Assign to Building
                    </label>
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
                        <option value="" disabled>
                          No available buildings
                        </option>
                      )}
                    </select>
                    <p className="text-xs text-stone-500 mt-1">
                      Only buildings without managers are shown
                    </p>
                  </div>
                )}

                {showBranchSelection && (
                  <div>
                    <label className="block text-sm font-medium text-stone-700">
                      Assign to Branch
                    </label>
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
                        <option value="" disabled>
                          No available branches
                        </option>
                      )}
                    </select>
                    <p className="text-xs text-stone-500 mt-1">
                      Only branches without accountants are shown
                    </p>
                  </div>
                )}
              </div>

              {errors.general && (
                <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                  {errors.general}
                </div>
              )}

              <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetNewUserForm();
                  }}
                  className="px-4 py-2 text-sm font-medium text-stone-700 hover:text-neutral-800 border border-stone-300 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    loading ||
                    Object.keys(errors).length > 0 ||
                    checkingUsername ||
                    checkingEmail
                  }
                  className="px-4 py-2 text-sm font-medium text-white bg-red-700 rounded-md hover:bg-red-800 disabled:opacity-50 transition-colors"
                >
                  {loading ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-neutral-800 bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <h3 className="text-lg font-semibold mb-4 text-neutral-800">
              Edit User: {editingUser.fullName}
            </h3>
            <p className="text-sm text-stone-600 mb-4">
              Role: {getRoleDisplayName(editingUser.roleName)}
            </p>
            <form onSubmit={handleEditUser}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editUserData.fullName}
                    onChange={(e) =>
                      handleEditFieldChange("fullName", e.target.value)
                    }
                    maxLength={maxLengths.fullName}
                    className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-red-700 focus:border-red-700 text-sm text-neutral-800 ${
                      errors.fullName ? "border-red-500" : "border-stone-300"
                    }`}
                  />
                  <CharacterCounter
                    value={editUserData.fullName}
                    maxLength={maxLengths.fullName}
                    field="fullName"
                  />
                  {errors.fullName && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.fullName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={editUserData.email}
                    onChange={(e) =>
                      handleEditFieldChange("email", e.target.value)
                    }
                    maxLength={maxLengths.email}
                    className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-red-700 focus:border-red-700 text-sm text-neutral-800 ${
                      errors.email ? "border-red-500" : "border-stone-300"
                    }`}
                  />
                  <CharacterCounter
                    value={editUserData.email}
                    maxLength={maxLengths.email}
                    field="email"
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={editUserData.username}
                    onChange={(e) =>
                      handleEditFieldChange("username", e.target.value)
                    }
                    maxLength={maxLengths.username}
                    className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-red-700 focus:border-red-700 text-sm text-neutral-800 ${
                      errors.username ? "border-red-500" : "border-stone-300"
                    }`}
                  />
                  <CharacterCounter
                    value={editUserData.username}
                    maxLength={maxLengths.username}
                    field="username"
                  />
                  {errors.username && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.username}
                    </p>
                  )}
                </div>
              </div>

              {errors.general && (
                <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                  {errors.general}
                </div>
              )}

              <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
                    setErrors({});
                  }}
                  className="px-4 py-2 text-sm font-medium text-stone-700 hover:text-neutral-800 border border-stone-300 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || Object.keys(errors).length > 0}
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
              Assign {selectedUser?.fullName} as{" "}
              {assignment.assignmentType === "manager"
                ? "Building Manager"
                : "Branch Accountant"}
            </h3>
            <form onSubmit={handleAssignUser}>
              <div className="space-y-4">
                {assignment.assignmentType === "manager" && (
                  <div>
                    <label className="block text-sm font-medium text-stone-700">
                      Select Building
                    </label>
                    <select
                      required
                      value={assignment.buildingId}
                      onChange={(e) =>
                        handleAssignmentBuildingChange(e.target.value)
                      }
                      className="mt-1 block w-full border border-stone-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-700 focus:border-red-700 text-sm text-neutral-800 bg-white"
                    >
                      <option value="">Choose a building...</option>
                      {availableBuildings.map((building) => (
                        <option key={building.id} value={building.id}>
                          {building.buildingName} - {building.branchName}
                        </option>
                      ))}
                      {availableBuildings.length === 0 && (
                        <option value="" disabled>
                          No available buildings
                        </option>
                      )}
                    </select>
                    <p className="text-xs text-stone-500 mt-1">
                      Only buildings without managers are shown
                    </p>
                  </div>
                )}
                {assignment.assignmentType === "accountant" && (
                  <div>
                    <label className="block text-sm font-medium text-stone-700">
                      Select Branch
                    </label>
                    <select
                      required
                      value={assignment.branchId}
                      onChange={(e) =>
                        handleAssignmentBranchChange(e.target.value)
                      }
                      className="mt-1 block w-full border border-stone-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-700 focus:border-red-700 text-sm text-neutral-800 bg-white"
                    >
                      <option value="">Choose a branch...</option>
                      {availableBranches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.branchName}
                        </option>
                      ))}
                      {availableBranches.length === 0 && (
                        <option value="" disabled>
                          No available branches
                        </option>
                      )}
                    </select>
                    <p className="text-xs text-stone-500 mt-1">
                      Only branches without accountants are shown
                    </p>
                  </div>
                )}
              </div>

              {errors.general && (
                <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                  {errors.general}
                </div>
              )}

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
                  disabled={
                    loading ||
                    (assignment.assignmentType === "manager" &&
                      availableBuildings.length === 0) ||
                    (assignment.assignmentType === "accountant" &&
                      availableBranches.length === 0)
                  }
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
