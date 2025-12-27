/** @format */

import React, { useState, useEffect, useRef } from "react";
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
  Eye,
  EyeOff,
  Users2, // Add this for Board of Directors icon
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
  buildingId?: number;
  accountantBuildingId?: number;
  branchName?: string;
  buildingName?: string;
  accountantBuildingName?: string;
  building?: any;
  branch?: any;
  accountantBuilding?: any;
}

interface Building {
  id: number;
  buildingName: string;
  branchName: string;
  branchId: number;
  managerId?: number;
  managerName?: string;
  accountantId?: number;
  accountantName?: string;
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
  | "bod" // Add Board of Directors tab
  | "pending-approval"
  | "deactivated";

const UserManagement: React.FC = () => {
  const { t } = useTranslation();
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
  const [loadingUsers, setLoadingUsers] = useState(true);
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
  const notificationTimeoutsRef = useRef<{ [key: number]: NodeJS.Timeout }>({});

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
    username: /^[a-zA-Z0-9_]{3,20}$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    fullName: /^[a-zA-Z\s.'-]{2,30}$/,
  };

  const maxLengths = {
    username: 20,
    email: 50,
    fullName: 30,
  };

  const validationMessages = {
    username: {
      required: t('userManagement.validation.usernameRequired'),
      invalid: t('userManagement.validation.usernameInvalid'),
      tooLong: t('userManagement.validation.usernameTooLong', { max: maxLengths.username }),
      exists: t('userManagement.validation.usernameExists'),
    },
    email: {
      required: t('userManagement.validation.emailRequired'),
      invalid: t('userManagement.validation.emailInvalid'),
      tooLong: t('userManagement.validation.emailTooLong', { max: maxLengths.email }),
      exists: t('userManagement.validation.emailExists'),
    },
    fullName: {
      required: t('userManagement.validation.fullNameRequired'),
      invalid: t('userManagement.validation.fullNameInvalid'),
      tooLong: t('userManagement.validation.fullNameTooLong', { max: maxLengths.fullName }),
    },
  };

  const getFilteredUsers = (): User[] => {
    switch (activeTab) {
      case "all":
        return users.filter(user => user.isActive);
      case "guests":
        return users.filter((user) => user.roleName === "ROLE_GUEST" && user.isActive);
      case "managers":
        return users.filter((user) => user.roleName === "ROLE_MANAGER" && user.isActive);
      case "accountants":
        return users.filter((user) => user.roleName === "ROLE_ACCOUNTANT" && user.isActive);
      case "bod": // Add Board of Directors filter
        return users.filter((user) => user.roleName === "ROLE_BOD" && user.isActive);
      case "pending-approval":
        return users.filter(
          (user) =>
            user.roleName === "ROLE_GUEST" &&
            (user.approvalStatus === "PENDING" || !user.approvalStatus) &&
            user.isActive
        );
      case "deactivated":
        return users.filter(user => !user.isActive);
      default:
        return users.filter(user => user.isActive);
    }
  };

  const getTabDisplayName = (tab: TabType) => {
    const tabMap: Record<TabType, string> = {
      all: t('userManagement.tabs.all'),
      guests: t('userManagement.tabs.guests'),
      managers: t('userManagement.tabs.managers'),
      accountants: t('userManagement.tabs.accountants'),
      bod: t('userManagement.tabs.bod'),
      "pending-approval": t('userManagement.tabs.pendingApproval'),
      deactivated: t('userManagement.tabs.deactivated'),
    };
    return tabMap[tab] || tab;
  };

  const getTabIcon = (tab: TabType) => {
    const iconMap: Record<TabType, React.ReactNode> = {
      all: <Users className="w-4 h-4" />,
      guests: <UserCog className="w-4 h-4" />,
      managers: <Building className="w-4 h-4" />,
      accountants: <Briefcase className="w-4 h-4" />,
      bod: <Users2 className="w-4 h-4" />, // Add Board of Directors icon
      "pending-approval": <Clock className="w-4 h-4" />,
      deactivated: <XCircle className="w-4 h-4" />,
    };
    return iconMap[tab] || <Users className="w-4 h-4" />;
  };

  const getUserCountByTab = (tab: TabType) => {
    switch (tab) {
      case "all":
        return users.filter(user => user.isActive).length;
      case "guests":
        return users.filter((user) => user.roleName === "ROLE_GUEST" && user.isActive).length;
      case "managers":
        return users.filter((user) => user.roleName === "ROLE_MANAGER" && user.isActive).length;
      case "accountants":
        return users.filter((user) => user.roleName === "ROLE_ACCOUNTANT" && user.isActive)
          .length;
      case "bod": // Add Board of Directors count
        return users.filter((user) => user.roleName === "ROLE_BOD" && user.isActive).length;
      case "pending-approval":
        return users.filter(
          (user) =>
            user.roleName === "ROLE_GUEST" &&
            (user.approvalStatus === "PENDING" || !user.approvalStatus) &&
            user.isActive
        ).length;
      case "deactivated":
        return users.filter(user => !user.isActive).length;
      default:
        return 0;
    }
  };

  const getApprovalStatusDisplay = (status?: string) => {
    const effectiveStatus = status || "PENDING";

    switch (effectiveStatus) {
      case "PENDING":
        return {
          text: t('userManagement.approvalStatus.pending'),
          icon: <Clock className="w-3 h-3" />,
          color: "bg-yellow-100 text-yellow-800",
        };
      case "APPROVED":
        return {
          text: t('userManagement.approvalStatus.approved'),
          icon: <CheckCircle className="w-3 h-3" />,
          color: "bg-green-100 text-green-800",
        };
      case "REJECTED":
        return {
          text: t('userManagement.approvalStatus.rejected'),
          icon: <XCircle className="w-3 h-3" />,
          color: "bg-red-100 text-red-800",
        };
      default:
        return {
          text: t('userManagement.approvalStatus.pending'),
          icon: <Clock className="w-3 h-3" />,
          color: "bg-yellow-100 text-yellow-800",
        };
    }
  };

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
          t('userManagement.notifications.statusUpdated', { status: status.toLowerCase() })
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
        t('userManagement.errors.statusUpdateFailed', { status: status.toLowerCase() });
      addNotification("error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUserClick = (user: User) => {
    const isCurrentlyApproved = user.approvalStatus === "APPROVED";
    const message = isCurrentlyApproved
      ? t('userManagement.confirm.reApprove', { name: user.fullName })
      : t('userManagement.confirm.approve', { name: user.fullName });

    showConfirmation({
      title: t('userManagement.confirm.approveTitle'),
      message,
      confirmText: t('userManagement.confirm.approve'),
      cancelText: t('common.cancel'),
      onConfirm: async () => {
        await updateUserApprovalStatus(user.id, "APPROVED");
        setMobileMenuOpen(null);
      },
      onCancel: () => {
        setMobileMenuOpen(null);
      },
    });
  };

  const handleRejectUserClick = (user: User) => {
    const isCurrentlyRejected = user.approvalStatus === "REJECTED";
    const message = isCurrentlyRejected
      ? t('userManagement.confirm.reReject', { name: user.fullName })
      : t('userManagement.confirm.reject', { name: user.fullName });

    showConfirmation({
      title: t('userManagement.confirm.rejectTitle'),
      message,
      confirmText: t('userManagement.confirm.reject'),
      cancelText: t('common.cancel'),
      onConfirm: async () => {
        await updateUserApprovalStatus(user.id, "REJECTED");
        setMobileMenuOpen(null);
      },
      onCancel: () => {
        setMobileMenuOpen(null);
      },
    });
  };

  const handlePendingUserClick = (user: User) => {
    const isCurrentlyPending =
      user.approvalStatus === "PENDING" || !user.approvalStatus;
    const message = isCurrentlyPending
      ? t('userManagement.confirm.rePending', { name: user.fullName })
      : t('userManagement.confirm.setPendingMessage', { name: user.fullName });

    showConfirmation({
      title: t('userManagement.confirm.pendingTitle'),
      message,
      confirmText: t('userManagement.confirm.setPending'),
      cancelText: t('common.cancel'),
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

    if (notificationTimeoutsRef.current[id]) {
      clearTimeout(notificationTimeoutsRef.current[id]);
    }

    notificationTimeoutsRef.current[id] = setTimeout(() => {
      removeNotification(id);
    }, 5000);
  };

  const removeNotification = (id: number) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );

    if (notificationTimeoutsRef.current[id]) {
      clearTimeout(notificationTimeoutsRef.current[id]);
      delete notificationTimeoutsRef.current[id];
    }
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
  
  return () => {
    Object.values(notificationTimeoutsRef.current).forEach(clearTimeout);
  };
}, []);

  const fetchAllData = async () => {
    try {
      setLoadingUsers(true);
      await Promise.all([
        fetchUsers(),
        fetchBuildings(),
        fetchBranches(),
        fetchAvailableBuildings(),
        fetchAvailableBranches(),
      ]);
    } catch (error) {
      setErrors({ general: t('userManagement.errors.loadDataFailed') });
      addNotification("error", t('userManagement.errors.loadDataFailed'));
    } finally {
      setLoadingUsers(false);
    }
  };

  // In UserManagement.tsx, replace the fetchUsers function:
const fetchUsers = async () => {
  try {
    setErrors({});
    
    let response;
    
    // Always fetch all users including inactive for the deactivated tab
    response = await userApi.getAll();

    let usersData: User[] = [];

    if (response.data) {
      if (Array.isArray(response.data)) {
        usersData = response.data;
      } else if (
        response.data.content &&
        Array.isArray(response.data.content)
      ) {
        usersData = response.data.content;
      } else if (
        typeof response.data === "object" &&
        !Array.isArray(response.data)
      ) {
        usersData = [response.data];
      }
    }

    const processedUsers = usersData.map((user: User) => {
      if (user.roleName === "ROLE_GUEST") {
        return {
          ...user,
          approvalStatus: user.approvalStatus || "PENDING",
        };
      }
      return user;
    });

    setUsers(processedUsers);
  } catch (error: any) {
    setErrors({ general: t('userManagement.errors.loadUsersFailed') });
    addNotification("error", t('userManagement.errors.loadUsersFailed'));
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
      const response = await buildingApi.getAll();
      setAvailableBuildings(response.data);
    } catch (error) {
      console.error("Error fetching buildings:", error);
      setAvailableBuildings([]);
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
    if (user.roleName === "ROLE_MANAGER") {
      if (user.buildingId) {
        const building = buildings.find((b) => b.id === user.buildingId);
        return building ? building.buildingName : t('userManagement.unknownBuilding');
      }
      if (user.building) {
        return user.building.buildingName || t('userManagement.unknownBuilding');
      }
      if (user.buildingName) {
        return user.buildingName;
      }
    }

    if (user.roleName === "ROLE_ACCOUNTANT") {
      const accountantBuilding = buildings.find(
        (b) => b.accountantId === user.id
      );
      if (accountantBuilding) {
        return accountantBuilding.buildingName;
      }

      if (user.accountantBuildingName) {
        return user.accountantBuildingName;
      }
      if (user.accountantBuilding) {
        return user.accountantBuilding.buildingName || t('userManagement.unknownBuilding');
      }
    }

    return "";
  };

  const getUserBranchName = (user: User): string => {
    if (user.branchId) {
      const branch = branches.find((b) => b.id === user.branchId);
      return branch ? branch.branchName : t('userManagement.unknownBranch');
    }

    if (user.branch) {
      return user.branch.branchName || t('userManagement.unknownBranch');
    }

    if (user.branchName) {
      return user.branchName;
    }

    return "";
  };

  const getUserBuildingId = (user: User): number | undefined => {
    if (user.roleName === "ROLE_MANAGER") {
      if (user.buildingId) return user.buildingId;
      if (user.building) return user.building.id;
    }

    if (user.roleName === "ROLE_ACCOUNTANT") {
      const accountantBuilding = buildings.find(
        (b) => b.accountantId === user.id
      );
      if (accountantBuilding) return accountantBuilding.id;

      if (user.accountantBuilding) return user.accountantBuilding.id;
    }

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
      return validationMessages[name]?.required || t('common.fieldRequired');
    }

    if (value.length > maxLengths[name]) {
      return (
        validationMessages[name]?.tooLong ||
        t('common.fieldTooLong', { max: maxLengths[name] })
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
        branchId: null, // Accountants are assigned to buildings, not branches
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
        t('userManagement.notifications.userCreated', { name: newUser.fullName })
      );

      if (createdUser && createdUser.id) {
        if (newUser.roleName === "ROLE_MANAGER" && newUser.buildingId) {
          try {
            await buildingApi.assignManager(newUser.buildingId, createdUser.id);
            addNotification(
              "info",
              t('userManagement.notifications.managerAssigned')
            );
          } catch (assignError: any) {
            console.error("Failed to assign manager to building:", assignError);
            addNotification(
              "warning",
              t('userManagement.notifications.managerAssignmentFailed')
            );
          }
        }

        if (newUser.roleName === "ROLE_ACCOUNTANT" && newUser.buildingId) {
          try {
            await buildingApi.assignAccountant(newUser.buildingId, createdUser.id);
            addNotification(
              "info",
              t('userManagement.notifications.accountantAssigned')
            );
          } catch (assignError: any) {
            console.error(
              "Failed to assign accountant to building:",
              assignError
            );
            addNotification(
              "warning",
              t('userManagement.notifications.accountantAssignmentFailed')
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
          setErrors({ general: t('userManagement.errors.unauthorized') });
          addNotification("error", t('userManagement.errors.unauthorized'));
        } else if (error.response.status === 403) {
          setErrors({
            general: t('userManagement.errors.forbidden'),
          });
          addNotification(
            "error",
            t('userManagement.errors.forbidden')
          );
        } else if (error.response.status === 400) {
          setErrors({ general: t('userManagement.errors.badRequest') });
          addNotification("error", t('userManagement.errors.badRequest'));
        } else {
          setErrors({
            general: t('userManagement.errors.serverError', { status: error.response.status }),
          });
          addNotification(
            "error",
            t('userManagement.errors.serverError', { status: error.response.status })
          );
        }
      } else if (error.request) {
        setErrors({
          general: t('userManagement.errors.networkError'),
        });
        addNotification(
          "error",
          t('userManagement.errors.networkError')
        );
      } else {
        setErrors({ general: t('userManagement.errors.createUserError', { error: error.message }) });
        addNotification("error", t('userManagement.errors.createUserError', { error: error.message }));
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

      addNotification("success", t('userManagement.notifications.userUpdated'));

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
          t('userManagement.errors.updateUserFailed');
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
        await userApi.assignManagerToBuilding(assignment.userId, assignment.buildingId);
        addNotification("success", t('userManagement.notifications.managerAssignmentSuccess'));
      } else if (assignment.assignmentType === "accountant" && assignment.buildingId) {
        await userApi.assignAccountantToBuilding(assignment.userId, assignment.buildingId);
        addNotification("success", t('userManagement.notifications.accountantAssignmentSuccess'));
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
      const errorMessage = error.response?.data?.message || t('userManagement.errors.assignmentFailed');
      setErrors({ general: errorMessage });
      addNotification("error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAssignmentClick = (user: User) => {
    const buildingId = getUserBuildingId(user);

    if (!buildingId) {
      addNotification("error", t('userManagement.errors.noAssignmentFound'));
      return;
    }

    showConfirmation({
      title: t('userManagement.confirm.removeAssignmentTitle'),
      message: t('userManagement.confirm.removeAssignment', { name: user.fullName }),
      confirmText: t('userManagement.confirm.remove'),
      cancelText: t('common.cancel'),
      onConfirm: async () => {
        try {
          if (user.roleName === "ROLE_MANAGER") {
            await buildingApi.removeManager(buildingId);
            addNotification("success", t('userManagement.notifications.managerRemoved'));
          } else if (user.roleName === "ROLE_ACCOUNTANT") {
            await buildingApi.removeAccountant(buildingId);
            addNotification("success", t('userManagement.notifications.accountantRemoved'));
          }

          fetchAllData();
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || t('userManagement.errors.removeAssignmentFailed');
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

  const handleDeleteUserClick = async (user: User) => {
    showConfirmation({
      title: t('userManagement.confirm.deactivateTitle'),
      message: t('userManagement.confirm.deactivateMessage', { name: user.fullName }),
      confirmText: t('userManagement.confirm.deactivate'),
      cancelText: t('common.cancel'),
      onConfirm: async () => {
        try {
          await userApi.delete(user.id);
          addNotification("success", t('userManagement.notifications.userDeactivated'));
          fetchAllData();
        } catch (error: any) {
          const errorMessage =
            error.response?.data?.message || t('userManagement.errors.deactivateFailed');
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

  const handleRestoreUserClick = (user: User) => {
    showConfirmation({
      title: t('userManagement.confirm.restoreTitle'),
      message: t('userManagement.confirm.restoreMessage', { name: user.fullName }),
      confirmText: t('userManagement.confirm.restore'),
      cancelText: t('common.cancel'),
      onConfirm: async () => {
        try {
          await userApi.restore(user.id);
          addNotification("success", t('userManagement.notifications.userRestored'));
          fetchAllData();
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || t('userManagement.errors.restoreFailed');
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
      ROLE_ADMIN: t('userManagement.roles.admin'),
      ROLE_MANAGER: t('userManagement.roles.manager'),
      ROLE_ACCOUNTANT: t('userManagement.roles.accountant'),
      ROLE_BOD: t('userManagement.roles.bod'),
      ROLE_TENANT: t('userManagement.roles.tenant'),
      ROLE_GUEST: t('userManagement.roles.guest'),
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

  const handleAssignmentBuildingChange = (
    value: string,
    forRole: "manager" | "accountant"
  ) => {
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

    if (field === "email") {
      const error = validateField("email", truncatedValue);
      if (error) {
        setErrors((prev) => ({ ...prev, email: error }));
      } else if (patterns.email.test(truncatedValue)) {
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

  const showBuildingSelectionForAccountant =
    newUser.roleName === "ROLE_ACCOUNTANT";
  const showBuildingSelectionForManager = newUser.roleName === "ROLE_MANAGER";
  const showBuildingSelection =
    showBuildingSelectionForManager || showBuildingSelectionForAccountant;
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
    field: keyof typeof maxLengths;
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
        {currentLength}/{maxLength} {t('common.characters')} {isOverLimit && `(${t('common.tooLong')})`}
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
    "bod", // Add Board of Directors tab
    "pending-approval",
    "deactivated",
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
                {confirmation.cancelText || t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-[#1E40AF] rounded-md hover:bg-[#1E3A8A] transition-colors"
              >
                {confirmation.confirmText || t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
            {t('userManagement.title')}
          </h1>
          <p className="text-stone-600 mt-1 text-sm sm:text-base">
            {t('userManagement.subtitle')}
          </p>
        </div>

        <button
          onClick={() => {
            resetNewUserForm();
            setShowAddModal(true);
          }}
          className="flex items-center space-x-2 bg-[#1E40AF] hover:bg-[#1E3A8A] text-white px-4 py-2 rounded-lg transition-colors w-full sm:w-auto justify-center shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>{t('userManagement.addUser')}</span>
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
                  ? "bg-[#1E40AF] text-white shadow-md"
                  : "bg-white text-stone-700 hover:bg-stone-50 border border-stone-200"
              }`}
            >
              {getTabIcon(tab)}
              <span className="font-medium">{getTabDisplayName(tab)}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  activeTab === tab
                    ? "bg-[#1E3A8A] text-white"
                    : "bg-stone-100 text-stone-700"
                }`}
              >
                {getUserCountByTab(tab)}
              </span>
            </button>
          ))}
        </div>

        {/* <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            <p className="text-sm text-blue-800">
              {t('userManagement.showingCount', {
                count: filteredUsers.length,
                tab: getTabDisplayName(activeTab).toLowerCase()
              })}
              {activeTab === "guests" && ` - ${t('userManagement.guestsDescription')}`}
              {activeTab === "bod" && ` - ${t('userManagement.bodDescription')}`}
              {activeTab === "pending-approval" && ` - ${t('userManagement.pendingApprovalDescription')}`}
              {activeTab === "deactivated" && ` - ${t('userManagement.deactivatedDescription')}`}
            </p>
          </div>
        </div> */}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-xl border border-stone-200 overflow-hidden mb-6">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-200">
            <thead className="bg-stone-100">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-neutral-800 uppercase tracking-wider">
                  {t('userManagement.table.user')}
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-neutral-800 uppercase tracking-wider">
                  {t('userManagement.table.role')}
                </th>
                {(activeTab === "guests" ||
                  activeTab === "pending-approval" ||
                  activeTab === "all") && (
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-neutral-800 uppercase tracking-wider">
                    {t('userManagement.table.approvalStatus')}
                  </th>
                )}
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-neutral-800 uppercase tracking-wider">
                  {t('userManagement.table.assignment')}
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-neutral-800 uppercase tracking-wider">
                  {t('userManagement.table.status')}
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-neutral-800 uppercase tracking-wider">
                  {t('userManagement.table.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-stone-200">
              {loadingUsers ? (
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
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E40AF]"></div>
                      <span className="ml-3 text-gray-600">
                        {t('userManagement.loadingUsers')}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
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
                      <p className="text-lg font-medium">{t('userManagement.noUsersFound')}</p>
                      <p className="text-sm">
                        {t('userManagement.tryChangingFilter')}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user: User) => {
                  const buildingName = getUserBuildingName(user);
                  const branchName = getUserBranchName(user);
                  const approvalStatus = getApprovalStatusDisplay(
                    user.approvalStatus
                  );

                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-stone-50 transition-colors ${
                        !user.isActive ? "bg-stone-50 opacity-80" : ""
                      }`}
                    >
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-neutral-800">
                            {user.fullName}
                            {!user.isActive && (
                              <span className="ml-2 text-xs text-stone-500">
                                ({t('userManagement.deactivated')})
                              </span>
                            )}
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
                              : user.roleName === "ROLE_BOD"
                              ? "bg-indigo-100 text-indigo-800" // Add color for BOD
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
                        {buildingName && user.roleName === "ROLE_MANAGER" && (
                          <div className="flex items-center space-x-1 text-stone-700">
                            <Building className="w-4 h-4" />
                            <span>{buildingName} ({t('userManagement.manager')})</span>
                          </div>
                        )}
                        {buildingName &&
                          user.roleName === "ROLE_ACCOUNTANT" && (
                            <div className="flex items-center space-x-1 text-stone-700">
                              <Briefcase className="w-4 h-4" />
                              <span>{buildingName} ({t('userManagement.accountant')})</span>
                            </div>
                          )}
                        {!buildingName && (
                          <span className="text-stone-400">{t('userManagement.notAssigned')}</span>
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
                          {user.isActive ? t('userManagement.active') : t('userManagement.inactive')}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {/* Approval buttons for guest users */}
                          {user.roleName === "ROLE_GUEST" && user.isActive && (
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
                                    ? t('userManagement.tooltips.reApprove')
                                    : t('userManagement.tooltips.approve')
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
                                    ? t('userManagement.tooltips.reReject')
                                    : t('userManagement.tooltips.reject')
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
                                    ? t('userManagement.tooltips.rePending')
                                    : t('userManagement.tooltips.setPending')
                                }
                              >
                                <Clock className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {/* Restore button for inactive users */}
                          {!user.isActive && (
                            <button
                              onClick={() => handleRestoreUserClick(user)}
                              className="text-green-600 hover:text-green-800 transition-colors"
                              title={t('userManagement.tooltips.restore')}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}

                          {/* Manager actions (only for active users) */}
                          {user.roleName === "ROLE_MANAGER" && user.isActive && (
                            <>
                              {buildingName ? (
                                <button
                                  onClick={() =>
                                    handleRemoveAssignmentClick(user)
                                  }
                                  className="text-[#1E40AF] hover:text-[#1E3A8A] transition-colors"
                                  title={t('userManagement.tooltips.removeFromBuilding')}
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() =>
                                    openAssignModal(user, "manager")
                                  }
                                  className="text-[#1E40AF] hover:text-[#1E3A8A] transition-colors"
                                  title={t('userManagement.tooltips.assignToBuilding')}
                                >
                                  <Building className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}

                          {/* Accountant actions (only for active users) */}
                          {user.roleName === "ROLE_ACCOUNTANT" && user.isActive && (
                            <>
                              {buildingName ? (
                                <button
                                  onClick={() =>
                                    handleRemoveAssignmentClick(user)
                                  }
                                  className="text-[#1E40AF] hover:text-[#1E3A8A] transition-colors"
                                  title={t('userManagement.tooltips.removeFromBuilding')}
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() =>
                                    openAssignModal(user, "accountant")
                                  }
                                  className="text-[#1E40AF] hover:text-[#1E3A8A] transition-colors"
                                  title={t('userManagement.tooltips.assignToBuilding')}
                                >
                                  <Briefcase className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}

                          {/* Edit button (for all active users) */}
                          {user.isActive && (
                            <button
                              onClick={() => handleEditClick(user)}
                              className="text-stone-600 hover:text-stone-800 transition-colors"
                              title={t('userManagement.tooltips.edit')}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete/Deactivate button (only for active users) */}
                          {user.isActive && (
                            <button
                              onClick={() => handleDeleteUserClick(user)}
                              className="text-[#1E40AF] hover:text-[#1E3A8A] transition-colors"
                              title={t('userManagement.tooltips.deactivate')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
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
          {loadingUsers ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E40AF]"></div>
              <span className="ml-3 text-gray-600">{t('userManagement.loadingUsers')}</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-stone-500">
              <div className="flex flex-col items-center justify-center">
                <Users className="w-12 h-12 text-stone-300 mb-2" />
                <p className="text-lg font-medium">{t('userManagement.noUsersFound')}</p>
                <p className="text-sm">
                  {t('userManagement.tryChangingFilter')}
                </p>
              </div>
            </div>
          ) : (
            filteredUsers.map((user: User) => {
              const buildingName = getUserBuildingName(user);
              const branchName = getUserBranchName(user);
              const approvalStatus = getApprovalStatusDisplay(
                user.approvalStatus
              );

              return (
                <div
                  key={user.id}
                  className={`border-b border-stone-200 p-4 hover:bg-stone-50 transition-colors ${
                    !user.isActive ? "bg-stone-50 opacity-80" : ""
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-neutral-800">
                            {user.fullName}
                            {!user.isActive && (
                              <span className="ml-2 text-xs text-stone-500">
                                ({t('userManagement.deactivated')})
                              </span>
                            )}
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
                          <span className="text-stone-500">{t('userManagement.table.role')}:</span>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              user.roleName === "ROLE_ADMIN"
                                ? "bg-purple-100 text-purple-800"
                                : user.roleName === "ROLE_MANAGER"
                                ? "bg-blue-100 text-blue-800"
                                : user.roleName === "ROLE_ACCOUNTANT"
                                ? "bg-green-100 text-green-800"
                                : user.roleName === "ROLE_BOD"
                                ? "bg-indigo-100 text-indigo-800"
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
                            <span className="text-stone-500">{t('userManagement.table.approvalStatus')}:</span>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${approvalStatus.color}`}
                            >
                              {approvalStatus.icon}
                              {approvalStatus.text}
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between">
                          <span className="text-stone-500">{t('userManagement.table.status')}:</span>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {user.isActive ? t('userManagement.active') : t('userManagement.inactive')}
                          </span>
                        </div>

                        {buildingName && (
                          <div className="flex justify-between">
                            <span className="text-stone-500">{t('userManagement.table.assignment')}:</span>
                            <div className="text-right text-stone-700">
                              {buildingName && (
                                <div className="flex items-center space-x-1 justify-end">
                                  {user.roleName === "ROLE_MANAGER" ? (
                                    <Building className="w-3 h-3" />
                                  ) : (
                                    <Briefcase className="w-3 h-3" />
                                  )}
                                  <span className="text-xs">
                                    {buildingName}
                                  </span>
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
                        {/* Approval buttons for guest users */}
                        {user.roleName === "ROLE_GUEST" && user.isActive && (
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
                              <span>{t('userManagement.approve')}</span>
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
                              <span>{t('userManagement.reject')}</span>
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
                              <span>{t('userManagement.setToPending')}</span>
                            </button>
                          </>
                        )}

                        {/* Restore button for inactive users */}
                        {!user.isActive && (
                          <button
                            onClick={() => handleRestoreUserClick(user)}
                            className="flex items-center space-x-1 text-green-600 hover:text-green-800 text-xs"
                          >
                            <CheckCircle className="w-3 h-3" />
                            <span>{t('userManagement.restore')}</span>
                          </button>
                        )}

                        {user.roleName === "ROLE_MANAGER" && user.isActive && (
                          <>
                            {buildingName ? (
                              <button
                                onClick={() =>
                                  handleRemoveAssignmentClick(user)
                                }
                                className="flex items-center space-x-1 text-[#1E40AF] hover:text-[#1E3A8A] text-xs"
                              >
                                <X className="w-3 h-3" />
                                <span>{t('userManagement.removeFromBuilding')}</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => openAssignModal(user, "manager")}
                                className="flex items-center space-x-1 text-[#1E40AF] hover:text-[#1E3A8A] text-xs"
                              >
                                <Building className="w-3 h-3" />
                                <span>{t('userManagement.assignToBuilding')}</span>
                              </button>
                            )}
                          </>
                        )}
                        {user.roleName === "ROLE_ACCOUNTANT" && user.isActive && (
                          <>
                            {buildingName ? (
                              <button
                                onClick={() =>
                                  handleRemoveAssignmentClick(user)
                                }
                                className="flex items-center space-x-1 text-[#1E40AF] hover:text-[#1E3A8A] text-xs"
                              >
                                <X className="w-3 h-3" />
                                <span>{t('userManagement.removeFromBuilding')}</span>
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  openAssignModal(user, "accountant")
                                }
                                className="flex items-center space-x-1 text-[#1E40AF] hover:text-[#1E3A8A] text-xs"
                              >
                                <Briefcase className="w-3 h-3" />
                                <span>{t('userManagement.assignToBuilding')}</span>
                              </button>
                            )}
                          </>
                        )}

                        {user.isActive && (
                          <button
                            onClick={() => handleEditClick(user)}
                            className="flex items-center space-x-1 text-stone-600 hover:text-stone-800 text-xs"
                          >
                            <Edit className="w-3 h-3" />
                            <span>{t('userManagement.edit')}</span>
                          </button>
                        )}

                        {user.isActive && (
                          <button
                            onClick={() => handleDeleteUserClick(user)}
                            className="flex items-center space-x-1 text-[#1E40AF] hover:text-[#1E3A8A] text-xs"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>{t('userManagement.deactivate')}</span>
                          </button>
                        )}
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
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            {/* Sticky Header */}
            <div className="sticky top-0 bg-white border-b border-stone-200 p-4 sm:p-6 z-10">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-neutral-800">
                    {t('userManagement.addNewUser')}
                  </h3>
                  <p className="text-sm text-stone-600 mt-1">
                    {t('userManagement.defaultPasswordMessage')}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetNewUserForm();
                  }}
                  className="text-stone-400 hover:text-stone-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <form onSubmit={handleAddUser}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700">
                      {t('userManagement.form.fullName')} *
                    </label>
                    <input
                      type="text"
                      value={newUser.fullName}
                      onChange={(e) =>
                        handleFieldChange("fullName", e.target.value)
                      }
                      maxLength={maxLengths.fullName}
                      className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-[#1E40AF] focus:border-[#1E40AF] text-sm text-neutral-800 ${
                        errors.fullName ? "border-red-500" : "border-stone-300"
                      }`}
                      placeholder={t('userManagement.form.fullNamePlaceholder')}
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
                      {t('userManagement.form.email')} *
                    </label>
                    <input
                      type="text"
                      value={newUser.email}
                      onChange={(e) => handleFieldChange("email", e.target.value)}
                      maxLength={maxLengths.email}
                      className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-[#1E40AF] focus:border-[#1E40AF] text-sm text-neutral-800 ${
                        errors.email ? "border-red-500" : "border-stone-300"
                      }`}
                      placeholder={t('userManagement.form.emailPlaceholder')}
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
                        {t('userManagement.checkingEmail')}
                      </p>
                    )}
                    {emailAvailable !== null && !errors.email && (
                      <p
                        className={`mt-1 text-xs ${
                          emailAvailable ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {emailAvailable
                          ? t('userManagement.emailAvailable')
                          : t('userManagement.emailTaken')}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700">
                      {t('userManagement.form.username')} *
                    </label>
                    <input
                      type="text"
                      value={newUser.username}
                      onChange={(e) =>
                        handleFieldChange("username", e.target.value)
                      }
                      maxLength={maxLengths.username}
                      className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-[#1E40AF] focus:border-[#1E40AF] text-sm text-neutral-800 ${
                        errors.username ? "border-red-500" : "border-stone-300"
                      }`}
                      placeholder={t('userManagement.form.usernamePlaceholder')}
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
                        {t('userManagement.checkingUsername')}
                      </p>
                    )}
                    {usernameAvailable !== null && !errors.username && (
                      <p
                        className={`mt-1 text-xs ${
                          usernameAvailable ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {usernameAvailable
                          ? t('userManagement.usernameAvailable')
                          : t('userManagement.usernameTaken')}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700">
                      {t('userManagement.form.role')} *
                    </label>
                    <select
                      value={newUser.roleName}
                      onChange={(e) =>
                        setNewUser({ ...newUser, roleName: e.target.value })
                      }
                      className="mt-1 block w-full border border-stone-300 rounded-md px-3 py-2 focus:outline-none focus:ring-[#1E40AF] focus:border-[#1E40AF] text-sm text-neutral-800 bg-white"
                    >
                      <option value="ROLE_GUEST">{t('userManagement.roles.guest')}</option>
                      <option value="ROLE_ACCOUNTANT">{t('userManagement.roles.accountant')}</option>
                      <option value="ROLE_MANAGER">{t('userManagement.roles.manager')}</option>
                      <option value="ROLE_BOD">{t('userManagement.roles.bod')}</option>
                    </select>
                  </div>

                  {newUser.roleName === "ROLE_GUEST" && (
                    <div>
                      <label className="block text-sm font-medium text-stone-700">
                        {t('userManagement.form.initialApprovalStatus')}
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
                        className="mt-1 block w-full border border-stone-300 rounded-md px-3 py-2 focus:outline-none focus:ring-[#1E40AF] focus:border-[#1E40AF] text-sm text-neutral-800 bg-white"
                      >
                        <option value="PENDING">
                          {t('userManagement.form.pendingRequiresApproval')}
                        </option>
                        <option value="APPROVED">
                          {t('userManagement.form.approvedAutoAccess')}
                        </option>
                        <option value="REJECTED">
                          {t('userManagement.form.rejectedNoAccess')}
                        </option>
                      </select>
                      <p className="text-xs text-stone-500 mt-1">
                        {t('userManagement.form.guestApprovalNote')}
                      </p>
                    </div>
                  )}

                  {showBuildingSelection && (
                    <div>
                      <label className="block text-sm font-medium text-stone-700">
                        {newUser.roleName === "ROLE_MANAGER"
                          ? t('userManagement.form.assignManagerToBuilding')
                          : t('userManagement.form.assignAccountantToBuilding')}
                      </label>
                      <select
                        value={newUser.buildingId || ""}
                        onChange={(e) => handleBuildingChange(e.target.value)}
                        className="mt-1 block w-full border border-stone-300 rounded-md px-3 py-2 focus:outline-none focus:ring-[#1E40AF] focus:border-[#1E40AF] text-sm text-neutral-800 bg-white"
                      >
                        <option value="">{t('userManagement.form.selectBuildingOptional')}</option>
                        {newUser.roleName === "ROLE_MANAGER"
                          ? availableBuildings
                              .filter((b) => !b.managerId)
                              .map((building) => (
                                <option key={building.id} value={building.id}>
                                  {building.buildingName} - {building.branchName}
                                </option>
                              ))
                          : availableBuildings
                              .filter((b) => !b.accountantId)
                              .map((building) => (
                                <option key={building.id} value={building.id}>
                                  {building.buildingName} - {building.branchName}
                                </option>
                              ))}
                      </select>
                      <p className="text-xs text-stone-500 mt-1">
                        {newUser.roleName === "ROLE_MANAGER"
                          ? t('userManagement.form.onlyBuildingsWithoutManagers')
                          : t('userManagement.form.onlyBuildingsWithoutAccountants')}
                      </p>
                    </div>
                  )}
                </div>

                {errors.general && (
                  <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                    {errors.general}
                  </div>
                )}
              </form>
            </div>
            
            {/* Sticky Footer */}
            <div className="sticky bottom-0 bg-white border-t border-stone-200 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetNewUserForm();
                  }}
                  className="px-4 py-2 text-sm font-medium text-stone-700 hover:text-neutral-800 border border-stone-300 rounded-md transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  onClick={handleAddUser}
                  disabled={
                    loading ||
                    Object.keys(errors).length > 0 ||
                    checkingUsername ||
                    checkingEmail ||
                    !newUser.fullName.trim() ||
                    !newUser.email.trim() ||
                    !newUser.username.trim()
                  }
                  className="px-4 py-2 text-sm font-medium text-white bg-[#1E40AF] rounded-md hover:bg-[#1E3A8A] disabled:opacity-50 transition-colors"
                >
                  {loading ? t('userManagement.creating') : t('userManagement.createUser')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-neutral-800 bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <h3 className="text-lg font-semibold mb-4 text-neutral-800">
              {t('userManagement.editUser', { name: editingUser.fullName })}
            </h3>
            <p className="text-sm text-stone-600 mb-4">
              {t('userManagement.role')} {getRoleDisplayName(editingUser.roleName)}
            </p>
            <form onSubmit={handleEditUser}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700">
                    {t('userManagement.form.fullName')} *
                  </label>
                  <input
                    type="text"
                    value={editUserData.fullName}
                    onChange={(e) =>
                      handleEditFieldChange("fullName", e.target.value)
                    }
                    maxLength={maxLengths.fullName}
                    className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-[#1E40AF] focus:border-[#1E40AF] text-sm text-neutral-800 ${
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
                    {t('userManagement.form.email')} *
                  </label>
                  <input
                    type="text"
                    value={editUserData.email}
                    onChange={(e) =>
                      handleEditFieldChange("email", e.target.value)
                    }
                    maxLength={maxLengths.email}
                    className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-[#1E40AF] focus:border-[#1E40AF] text-sm text-neutral-800 ${
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
                    {t('userManagement.form.username')} *
                  </label>
                  <input
                    type="text"
                    value={editUserData.username}
                    onChange={(e) =>
                      handleEditFieldChange("username", e.target.value)
                    }
                    maxLength={maxLengths.username}
                    className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-[#1E40AF] focus:border-[#1E40AF] text-sm text-neutral-800 ${
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
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loading || Object.keys(errors).length > 0 || !editUserData.fullName.trim() || !editUserData.email.trim() || !editUserData.username.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#1E40AF] rounded-md hover:bg-[#1E3A8A] disabled:opacity-50 transition-colors"
                >
                  {loading ? t('userManagement.updating') : t('userManagement.updateUser')}
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
              {t('userManagement.assignUser', {
                name: selectedUser?.fullName,
                type: assignment.assignmentType === "manager"
                  ? t('userManagement.buildingManager')
                  : t('userManagement.buildingAccountant')
              })}
            </h3>
            <form onSubmit={handleAssignUser}>
              <div className="space-y-4">
                {assignment.assignmentType === "manager" && (
                  <div>
                    <label className="block text-sm font-medium text-stone-700">
                      {t('userManagement.form.selectBuilding')}
                    </label>
                    <select
                      required
                      value={assignment.buildingId}
                      onChange={(e) =>
                        handleAssignmentBuildingChange(
                          e.target.value,
                          "manager"
                        )
                      }
                      className="mt-1 block w-full border border-stone-300 rounded-md px-3 py-2 focus:outline-none focus:ring-[#1E40AF] focus:border-[#1E40AF] text-sm text-neutral-800 bg-white"
                    >
                      <option value="">{t('userManagement.form.chooseBuilding')}</option>
                      {availableBuildings
                        .filter((b) => !b.managerId)
                        .map((building) => (
                          <option key={building.id} value={building.id}>
                            {building.buildingName} - {building.branchName}
                          </option>
                        ))}
                      {availableBuildings.filter((b) => !b.managerId).length ===
                        0 && (
                        <option value="" disabled>
                          {t('userManagement.form.noAvailableBuildingsWithoutManagers')}
                        </option>
                      )}
                    </select>
                    <p className="text-xs text-stone-500 mt-1">
                      {t('userManagement.form.onlyBuildingsWithoutManagers')}
                    </p>
                  </div>
                )}

                {assignment.assignmentType === "accountant" && (
                  <div>
                    <label className="block text-sm font-medium text-stone-700">
                      {t('userManagement.form.selectBuilding')}
                    </label>
                    <select
                      required
                      value={assignment.buildingId}
                      onChange={(e) =>
                        handleAssignmentBuildingChange(
                          e.target.value,
                          "accountant"
                        )
                      }
                      className="mt-1 block w-full border border-stone-300 rounded-md px-3 py-2 focus:outline-none focus:ring-[#1E40AF] focus:border-[#1E40AF] text-sm text-neutral-800 bg-white"
                    >
                      <option value="">{t('userManagement.form.chooseBuilding')}</option>
                      {availableBuildings
                        .filter((b) => !b.accountantId)
                        .map((building) => (
                          <option key={building.id} value={building.id}>
                            {building.buildingName} - {building.branchName}
                          </option>
                        ))}
                      {availableBuildings.filter((b) => !b.accountantId)
                        .length === 0 && (
                        <option value="" disabled>
                          {t('userManagement.form.noAvailableBuildingsWithoutAccountants')}
                        </option>
                      )}
                    </select>
                    <p className="text-xs text-stone-500 mt-1">
                      {t('userManagement.form.onlyBuildingsWithoutAccountants')}
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
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={
                    loading ||
                    (assignment.assignmentType === "manager" &&
                      availableBuildings.filter((b) => !b.managerId).length ===
                        0) ||
                    (assignment.assignmentType === "accountant" &&
                      availableBuildings.filter((b) => !b.accountantId)
                        .length === 0)
                  }
                  className="px-4 py-2 text-sm font-medium text-white bg-[#1E40AF] rounded-md hover:bg-[#1E3A8A] disabled:opacity-50 transition-colors"
                >
                  {loading ? t('userManagement.assigning') : t('userManagement.assign')}
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