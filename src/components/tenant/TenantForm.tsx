import React, { useState, useEffect } from 'react';
import API from '../../api/api';
import type { CreateTenantRequest, Tenant, TenantCategory, UpdateTenantRequest } from '../../types/tenant';

// NRC Types and Interfaces
interface NRCState {
  code: string;
  name: string;
  nameMm: string;
}

interface NRCType {
  code: string;
  name: string;
  nameMm: string;
  description: string;
}

interface ParsedNRC {
  state: string;
  township: string;
  type: string;
  number: string;
}

// Myanmar States Data
const MYANMAR_STATES: NRCState[] = [
  { code: '1', name: 'Kachin', nameMm: 'ကချင်' },
  { code: '2', name: 'Kayah', nameMm: 'ကယား' },
  { code: '3', name: 'Kayin', nameMm: 'ကရင်' },
  { code: '4', name: 'Chin', nameMm: 'ချင်း' },
  { code: '5', name: 'Sagaing', nameMm: 'စစ်ကိုင်း' },
  { code: '6', name: 'Tanintharyi', nameMm: 'တနင်္သာရီ' },
  { code: '7', name: 'Bago', nameMm: 'ပဲခူး' },
  { code: '8', name: 'Magway', nameMm: 'မကွေး' },
  { code: '9', name: 'Mandalay', nameMm: 'မန္တလေး' },
  { code: '10', name: 'Mon', nameMm: 'မွန်' },
  { code: '11', name: 'Rakhine', nameMm: 'ရခိုင်' },
  { code: '12', name: 'Yangon', nameMm: 'ရန်ကုန်' },
  { code: '13', name: 'Shan', nameMm: 'ရှမ်း' },
  { code: '14', name: 'Ayeyarwady', nameMm: 'ဧရာဝတီ' },
];

// NRC Types
const NRC_TYPES: NRCType[] = [
  { code: 'N', name: 'National', nameMm: 'နိုင်', description: 'နိုင်ငံသား (National)' },
  { code: 'C', name: 'Citizenship', nameMm: 'ပြု', description: 'ပြုခွင့်ရ (Citizenship)' },
  { code: 'AC', name: 'Associate Citizen', nameMm: 'ဧည့်', description: 'ဧည့်နိုင်ငံသား (Associate Citizen)' },
  { code: 'NC', name: 'Naturalized Citizen', nameMm: 'ပြုပြင်', description: 'ပြုပြင်နိုင်ငံသား (Naturalized Citizen)' },
];

// Township codes for all 15 states - ALL UPPERCASE
const TOWNSHIPS_BY_STATE: string[][] = [
  // State 1 - Kachin
  ["AHGAYA","BAKANA","BAMANA","DAHPAYA","HAPANA","HASDANA","HSAPABA","KAMANA","KAMATA","KAPATA","KHABADA","KHALAHPHA","KHAHPANA","LAGANA","MAGADA","MAKANA","MAKATA","MAKATHA","MAKHABA","MALANA","MAMANA","MANYANA","MASANA","MATANA","NAMANA","PAMANA","PANADA","PATAAH","PAWANA","PHAKANA","RABAYA","SABANA","SABATA","SAKANA","SALANA","SAPABA","TANANA","WAMANA","YAKANA"],
  
  // State 2 - Kayah
  ["BALAKHA","DAMASA","HPAHSANA","HTATAPA","KHASANA","LAKANA","MASANA","PHALASA","PHAYASA","RATHANA","SASANA","YATANA"],
  
  // State 3 - Kayin
  ["BAAHNA","BAGALA","BATHAHSA","KADANA","KAKAYA","KAMAMA","KASAKA","KATAKHA","LABANA","LATHANA","MASALA","MAWATA","PAKANA","PHAAHNA","PHAPANA","SAKALA","THATAKA","THATANA","WALAMA","YAYATHA"],
  
  // State 4 - Chin
  ["HAKHANA","HPALANA","HTATALA","KAKHANA","KAPALA","MATANA","MATAPA","PALAWA","SAMANA","TATANA","TAZANA","YAKHADA","YAZANA"],
  
  // State 5 - Sagaing
  ["AHTANA","AHYATA","BAMANA","BATALA","DAPAYA","HAMALA","HPAPANA","HTAKHANA","KABALA","KALAHTA","KALANA","KALATA","KALAWA","KAMANA","KANANA","KATHANA","KHAOUNA","KHAOUTA","KHAPANA","KHATANA","LAHANA","LAYANA","MAKANA","MALANA","MAMANA","MAMATA","MAYANA","NAYANA","NGAZANA","PALABA","PALANA","SAKANA","SALAKA","TAMANA","TASANA","TAZANA","WALANA","WATHANA","YABANA","YAMAPA","YAOUNA"],
  
  // State 6 - Tanintharyi
  ["BAPANA","HTAWANA","KALAAH","KASANA","KATHANA","KAYAYA","KHAMANA","LALANA","MAAHYA","MAMANA","MATANA","PALANA","PALATA","TATHAYA","THAYAKHA","YAHPANA"],
  
  // State 7 - Bago
  ["AHHPANA","AHTANA","DAOUNAS","HPAMANA","HTATAPA","KAKANA","KAPAKA","KATAKHA","KAWANA","LAPATA","MALANA","MANYANA","NATALA","NYALAPA","PAKHANA","PAKHATA","PAMANA","PANAKA","PATANA","PATASA","PATATA","TANGANA","THAKANA","THANAPA","THASANA","THAWATA","WAMANA","YAKANA","YATANA","YATAYA","ZAKANA"],
  
  // State 8 - Magway
  ["AHLANA","GAGANA","HTALANA","KAHTANA","KAMANA","KHAMANA","MABANA","MAHTANA","MAHTANA","MAKANA","MALANA","MAMANA","MATANA","MATANA","MATHANA","NAMANA","NGAHPANA","PAHPANA","PAKHAKA","PAMANA","SAHPANA","SALANA","SAMANA","SAPAWA","SATAYA","TATAKA","THAYANA","YANAKHA","YASAKA"],
  
  // State 9 - Mandalay
  ["AHMAYA","AHMAZA","DAKHATHA","KAPATA","KASANA","KHAAHZA","KHAMASA","LAWANA","MAHAMA","MAHTALA","MAKANA","MAKHANA","MALANA","MAMANA","MANAMA","MANATA","MATAYA","MATHANA","MAYAMA","MAYATA","NAHTAKA","NGATHAYA","NGATHAYA","NGAZANA","NYAOUNA","OUTATHA","PABANA","PABATHA","PAKAKHA","PAMANA","PAOULA","PATHKA","SAKANA","SAKATA","TAKANA","TAKANA","TAKATA","TATAOU","TATHANA","THAPAKA","THASANA","WATANA","YAMATHA","ZABATHA","ZAYATHA"],
  
  // State 10 - Mon
  ["BALANA","KAHTANA","KAMAYA","KHASANA","KHAZANA","LAMANA","MADANA","MALAMA","PAMANA","THAHPAYA","THAHTANA","YAMANA"],
  
  // State 11 - Rakhine
  ["AHMANA","BATHATA","GAMANA","KAHPAYA","KATALA","KATANA","MAAHNA","MAAHNA","MAAHTA","MAOUNA","MAPANA","MAPATA","MATANA","PANAKA","PANATA","PATANA","SATANA","TAKANA","TAPAWA","THATANA","YABANA","YATHATA"],
  
  // State 12 - Yangon
  ["AHLANA","AHSANA","BAHANA","BATAHTA","DAGAMA","DAGANA","DAGASA","DAGATA","DAGAYA","DALANA","DAPANA","HTATAPA","KAKAKA","KAKHAKA","KAMANA","KAMATA","KAMAYA","KATANA","KATATA","KHAYANA","LAKANA","LAMANA","LAMATA","LATHANA","LATHAYA","MABANA","MAGADA","MAGATA","MAYAKA","OUKAMA","OUKANA","OUKATA","PABATA","PAZATA","SAKAKHA","SAKANA","SAKHANA","TAKANA","TAMANA","TATAHTA","TATANA","THAGAKA","THAKATA","THAKHANA","THALANA","YAKANA","YAPATHA"],
  
  // State 13 - Shan
  ["AHKHANA","AHTANA","HAPANA","HAPATA","HATANA","HPAKHANA","KAHANA","KAKHANA","KALADA","KALAHP","KALANA","KALANA","KALATA","KAMANA","KAMASA","KATALA","KATANA","KATATA","KATHANA","KAYANA","KHALANA","KHAMANA","KHAYAHA","LAHANA","LAHTANA","LAKANA","LAKANA","LAKATA","LAKHANA","LAKHANA","LAKHATA","LALANA","LAYANA","MABANA","MABANA","MAHAYA","MAHPANA","MAHPANA","MAKANA","MAKANA","MAKHANA","MALANA","MAMANA","MAMANA","MAMANA","MAMANA","MAMASA","MAMATA","MAMATA","MANANA","MANGANA","MAPANA","MAPANA","MAPANA","MASANA","MASATA","MATANA","MATANA","MATANA","MATATA","MAYANA","MAYANA","MAYANA","MAYATA","NAHPANA","NAKANA","NAKHANA","NAKHANA","NAKHATA","NAKHATA","NAKHAWA","NAMATA","NAPHANA","NASANA","NASANA","NATANA","NATAYA","NAWANA","NYAYANA","PAKHANA","PALANA","PALATA","PAPAKA","PASANA","PATAYA","PAWANA","PAYANA","SAHPANA","SASANA","TAKANA","TAKHALA","TALANA","TAMANYA","TAYANA","THANANA","THAPANA","YAHPANA","YALANA","YANGANA","YASANA"],
  
  // State 14 - Ayeyarwady
  ["AHGAPA","AHMANA","AHMATA","BAKALA","DADAYA","DANAHP","HAKAKA","HATHATA","HPAPANA","KAKAHTA","KAKANA","KAKHANA","KALANA","KAPANA","LAMANA","LAPATA","MAAHNA","MAAHPA","MAMAKA","MAMANA","NGAPATA","NGASANA","NGATHAKHA","NGATHAYA","NGAYAKA","NYATANA","PASALA","PATANA","PATHANA","PATHYA","THAPANA","WAKHAMA","YAKANA","YATHAYA","ZALANA"],
];

// Utility functions
const getTownshipsByState = (stateCode: string): string[] => {
  const stateIndex = parseInt(stateCode) - 1;
  return stateIndex >= 0 && stateIndex < TOWNSHIPS_BY_STATE.length ? TOWNSHIPS_BY_STATE[stateIndex] : [];
};

const parseNRC = (nrcString: string): ParsedNRC | null => {
  const match = nrcString.match(/^(\d+)\/([A-Za-z]+)\(([A-Za-z]+)\)(\d+)$/);
  return match ? { state: match[1], township: match[2], type: match[3], number: match[4] } : null;
};

const formatNRC = (state: string, township: string, type: string, number: string): string => {
  return state && township && type && number ? `${state}/${township}(${type})${number}` : '';
};

const validateNRC = (state: string, township: string, type: string, number: string): string[] => {
  const errors: string[] = [];
  if (!state) errors.push('State is required');
  else if (parseInt(state) < 1 || parseInt(state) > 15) errors.push('State must be 1-15');
  
  if (!township) errors.push('Township is required');
  else if (state && !getTownshipsByState(state).includes(township)) errors.push('Invalid township for selected state');
  
  if (!type) errors.push('NRC type is required');
  else if (!['N', 'C', 'AC', 'NC'].includes(type)) errors.push('Invalid NRC type');
  
  if (!number) errors.push('NRC number is required');
  else if (!/^\d{6}$/.test(number)) errors.push('NRC number must be 6 digits');
  
  return errors;
};

interface GuestAccountStatus {
  exists: boolean;
  hasSameUser: boolean;
  isGuestRole: boolean;
  currentRole?: string;
  userId?: number;
  username?: string;
  fullName?: string;
  emailExists?: boolean;
  usernameExists?: boolean;
  differentUsers?: boolean;
  emailUserHasTenant?: boolean;
  usernameUserHasTenant?: boolean;
}

interface TenantFormProps {
  tenant?: Tenant;
  categories: TenantCategory[];
  onSubmit: (data: CreateTenantRequest | UpdateTenantRequest) => void;
  onCancel: () => void;
  isEditing: boolean;
  isLoading?: boolean;
}

const TenantForm: React.FC<TenantFormProps> = ({
  tenant,
  categories,
  onSubmit,
  onCancel,
  isEditing,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    tenantName: '',
    contactPerson: '',
    email: '',
    nrc_no: '',
    phone: '',
    address: '',
    tenantCategoryId: 0,
    username: '',
  });

  // NRC components state
  const [nrcState, setNrcState] = useState('');
  const [nrcTownship, setNrcTownship] = useState('');
  const [nrcType, setNrcType] = useState('N');
  const [nrcNumber, setNrcNumber] = useState('');
  
  const [filteredTownships, setFilteredTownships] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isCheckingGuest, setIsCheckingGuest] = useState(false);
  const [guestAccountStatus, setGuestAccountStatus] = useState<GuestAccountStatus | null>(null);

  // Field length limits (matching backend DTO validation)
  const FIELD_LIMITS = {
    tenantName: { max: 30, min: 2 },
    contactPerson: { max: 30, min: 2 },
    email: { max: 30 },
    nrc_no: { max: 30 },
    phone: { max: 11, min: 6 },
    address: { max: 500 },
    username: { max: 20, min: 3 },
  };

  // Validation patterns
  const EMAIL_REGEX = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  const USERNAME_REGEX = /^[a-zA-Z0-9._-]+$/;

  // Filter townships based on selected state
  useEffect(() => {
    if (nrcState) {
      const townships = getTownshipsByState(nrcState);
      setFilteredTownships(townships);
      if (!townships.includes(nrcTownship)) setNrcTownship('');
    } else {
      setFilteredTownships([]);
      setNrcTownship('');
    }
  }, [nrcState, nrcTownship]);

  // Parse existing NRC number when editing
  useEffect(() => {
    if (tenant && isEditing) {
      setFormData({
        tenantName: tenant.tenantName,
        contactPerson: tenant.contactPerson,
        email: tenant.email,
        nrc_no: tenant.nrc_no || '',
        phone: tenant.phone,
        address: tenant.address || '',
        tenantCategoryId: tenant.tenantCategoryId,
        username: tenant.username,
      });

      if (tenant.nrc_no) {
        const parsed = parseNRC(tenant.nrc_no);
        if (parsed) {
          setNrcState(parsed.state);
          setNrcTownship(parsed.township);
          setNrcType(parsed.type);
          setNrcNumber(parsed.number);
        }
      }
    }
  }, [tenant, isEditing]);

  // Update the full NRC number when any component changes
  useEffect(() => {
    if (nrcState && nrcTownship && nrcType && nrcNumber) {
      const fullNrc = formatNRC(nrcState, nrcTownship, nrcType, nrcNumber);
      setFormData(prev => ({ ...prev, nrc_no: fullNrc }));
    } else {
      setFormData(prev => ({ ...prev, nrc_no: '' }));
    }
  }, [nrcState, nrcTownship, nrcType, nrcNumber]);

  // Check for duplicate email
  const checkDuplicateEmail = async (): Promise<boolean> => {
    if (!formData.email || !EMAIL_REGEX.test(formData.email)) return true;
    
    setIsCheckingEmail(true);
    try {
      const params: any = { email: formData.email };
      if (isEditing && tenant?.id) {
        params.tenantId = tenant.id;
      }
      
      // Call backend API to check email availability
      const response = await API.get(`/api/tenants/check-email`, { params });
      
      // If we get here without error, email is available
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.email;
        return newErrors;
      });
      
      return true;
    } catch (error: any) {
      // Handle 409 Conflict (email already exists)
      if (error.response?.status === 409) {
        const errorData = error.response.data;
        const errorMessage = errorData.message || 'Email already registered';
        setErrors(prev => ({ ...prev, email: errorMessage }));
        setIsCheckingEmail(false);
        return false;
      }
      
      // Handle other API errors
      if (error.response?.status === 400 || error.response?.status === 500) {
        const errorData = error.response.data;
        setErrors(prev => ({ ...prev, email: errorData.message || 'Error checking email' }));
        setIsCheckingEmail(false);
        return false;
      }
      
      console.error('Error checking email:', error);
      return true; // Don't block form submission on network errors
    } finally {
      setIsCheckingEmail(false);
    }
  };

  // Check for duplicate username
  const checkDuplicateUsername = async (): Promise<boolean> => {
    if (!formData.username || !USERNAME_REGEX.test(formData.username)) return true;
    
    setIsCheckingUsername(true);
    try {
      const params: any = { username: formData.username };
      if (isEditing && tenant?.id) {
        params.tenantId = tenant.id;
      }
      
      const response = await API.get(`/api/tenants/check-username`, { params });
      
      // If we get here, username is available
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.username;
        return newErrors;
      });
      
      return true;
    } catch (error: any) {
      if (error.response?.status === 409) {
        const errorData = error.response.data;
        setErrors(prev => ({ ...prev, username: errorData.message || 'Username already taken' }));
        setIsCheckingUsername(false);
        return false;
      }
      
      if (error.response?.status === 400 || error.response?.status === 500) {
        const errorData = error.response.data;
        setErrors(prev => ({ ...prev, username: errorData.message || 'Error checking username' }));
        setIsCheckingUsername(false);
        return false;
      }
      
      console.error('Error checking username:', error);
      return true;
    } finally {
      setIsCheckingUsername(false);
    }
  };

  // Check guest account
  const checkGuestAccount = async (): Promise<boolean> => {
    if (!formData.email || !formData.username || !EMAIL_REGEX.test(formData.email) || !USERNAME_REGEX.test(formData.username)) {
      setGuestAccountStatus(null);
      return true;
    }
    
    setIsCheckingGuest(true);
    try {
      const response = await API.get(`/api/tenants/check-guest-account`, {
        params: {
          email: formData.email,
          username: formData.username
        }
      });
      
      const data = response.data;
      
      // Update guest account status for display
      const guestStatus: GuestAccountStatus = {
        exists: data.emailExists && data.usernameExists,
        hasSameUser: data.hasSameUser || false,
        isGuestRole: (data.emailUserIsGuest && data.usernameUserIsGuest) || false,
        currentRole: data.emailUserRole || data.usernameUserRole,
        userId: data.emailUserId || data.usernameUserId,
        username: data.username,
        fullName: data.fullName,
        emailExists: data.emailExists,
        usernameExists: data.usernameExists,
        differentUsers: data.differentUsers,
        emailUserHasTenant: data.emailUserHasTenant,
        usernameUserHasTenant: data.usernameUserHasTenant
      };
      
      setGuestAccountStatus(guestStatus);
      
      // Check for conflicts
      let hasError = false;
      const newErrors: { [key: string]: string } = {};
      
      // Case 1: Email and username belong to different users
      if (data.differentUsers) {
        newErrors.email = 'Email and username belong to different users';
        newErrors.username = 'Email and username belong to different users';
        hasError = true;
      }
      // Case 2: Email exists and already has tenant profile
      else if (data.emailExists && data.emailUserHasTenant) {
        newErrors.email = 'Email already registered';
        hasError = true;
      }
      // Case 3: Username exists and already has tenant profile
      else if (data.usernameExists && data.usernameUserHasTenant) {
        newErrors.username = 'Username already taken';
        hasError = true;
      }
      // Case 4: Email exists but not ROLE_GUEST
      else if (data.emailExists && data.emailUserRole !== 'ROLE_GUEST' && data.hasSameUser) {
        newErrors.email = `Cannot use this email (role: ${data.emailUserRole})`;
        newErrors.username = `Cannot use this username (role: ${data.emailUserRole})`;
        hasError = true;
      }
      // Case 5: Username exists but not ROLE_GUEST
      else if (data.usernameExists && data.usernameUserRole !== 'ROLE_GUEST' && data.hasSameUser) {
        newErrors.email = `Cannot use this email (role: ${data.usernameUserRole})`;
        newErrors.username = `Cannot use this username (role: ${data.usernameUserRole})`;
        hasError = true;
      }
      // Case 6: Email exists but no matching username
      else if (data.emailExists && !data.hasSameUser) {
        newErrors.email = 'Email already registered but username doesn\'t match';
        hasError = true;
      }
      // Case 7: Username exists but no matching email
      else if (data.usernameExists && !data.hasSameUser) {
        newErrors.username = 'Username already taken but email doesn\'t match';
        hasError = true;
      }
      
      if (hasError) {
        setErrors(prev => ({ ...prev, ...newErrors }));
        setIsCheckingGuest(false);
        return false;
      }
      
      // Clear any previous guest account errors
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.email;
        delete newErrors.username;
        return newErrors;
      });
      
      return true;
    } catch (error: any) {
      // API instance handles auth errors automatically
      console.error('Error checking guest account:', error);
      return true; // Don't block on network errors
    } finally {
      setIsCheckingGuest(false);
    }
  };

  // Debounced check for email
  useEffect(() => {
    if (formData.email && EMAIL_REGEX.test(formData.email)) {
      const timer = setTimeout(() => {
        checkDuplicateEmail();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [formData.email]);

  // Debounced check for username
  useEffect(() => {
    if (formData.username && USERNAME_REGEX.test(formData.username)) {
      const timer = setTimeout(() => {
        checkDuplicateUsername();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [formData.username]);

  // Check guest account when both email and username are filled
  useEffect(() => {
    if (formData.email && formData.username && 
        EMAIL_REGEX.test(formData.email) && 
        USERNAME_REGEX.test(formData.username)) {
      const timer = setTimeout(() => {
        checkGuestAccount();
      }, 700);
      return () => clearTimeout(timer);
    } else {
      setGuestAccountStatus(null);
    }
  }, [formData.email, formData.username]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Validate required fields
    if (!formData.tenantName.trim()) {
      newErrors.tenantName = 'Tenant name is required';
    } else if (formData.tenantName.length < FIELD_LIMITS.tenantName.min) {
      newErrors.tenantName = `Tenant name must be at least ${FIELD_LIMITS.tenantName.min} characters`;
    } else if (formData.tenantName.length > FIELD_LIMITS.tenantName.max) {
      newErrors.tenantName = `Tenant name cannot exceed ${FIELD_LIMITS.tenantName.max} characters`;
    }

    if (!formData.contactPerson.trim()) {
      newErrors.contactPerson = 'Contact person is required';
    } else if (formData.contactPerson.length < FIELD_LIMITS.contactPerson.min) {
      newErrors.contactPerson = `Contact person must be at least ${FIELD_LIMITS.contactPerson.min} characters`;
    } else if (formData.contactPerson.length > FIELD_LIMITS.contactPerson.max) {
      newErrors.contactPerson = `Contact person cannot exceed ${FIELD_LIMITS.contactPerson.max} characters`;
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!EMAIL_REGEX.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    } else if (formData.email.length > FIELD_LIMITS.email.max) {
      newErrors.email = `Email cannot exceed ${FIELD_LIMITS.email.max} characters`;
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else {
      const phoneDigits = formData.phone.replace(/\D/g, '');
      if (!/^09\d{7,9}$/.test(phoneDigits)) {
        newErrors.phone = 'Phone must start with 09 and be 9-11 digits total';
      } else if (phoneDigits.length < FIELD_LIMITS.phone.min) {
        newErrors.phone = `Phone number must be at least ${FIELD_LIMITS.phone.min} digits`;
      } else if (formData.phone.length > FIELD_LIMITS.phone.max) {
        newErrors.phone = `Phone number cannot exceed ${FIELD_LIMITS.phone.max} characters`;
      }
    }
    
    if (!formData.tenantCategoryId) {
      newErrors.tenantCategoryId = 'Category is required';
    }
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < FIELD_LIMITS.username.min) {
      newErrors.username = `Username must be at least ${FIELD_LIMITS.username.min} characters`;
    } else if (formData.username.length > FIELD_LIMITS.username.max) {
      newErrors.username = `Username cannot exceed ${FIELD_LIMITS.username.max} characters`;
    } else if (!USERNAME_REGEX.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, dots, underscores, and hyphens';
    }

    // Address validation (optional)
    if (formData.address && formData.address.length > FIELD_LIMITS.address.max) {
      newErrors.address = `Address cannot exceed ${FIELD_LIMITS.address.max} characters`;
    }

    // Validate NRC (optional but must be valid if provided)
    if (formData.nrc_no && formData.nrc_no.trim()) {
      if (formData.nrc_no.length > FIELD_LIMITS.nrc_no.max) {
        newErrors.nrc_no = `NRC cannot exceed ${FIELD_LIMITS.nrc_no.max} characters`;
      } else if (!/^\d{1,2}\/[A-Za-z]+\([A-Za-z]+\)\d{6}$/.test(formData.nrc_no)) {
        newErrors.nrc_no = 'Invalid NRC format. Expected: State/Township(Type)Number (e.g., 12/YGN(N)123456)';
      } else {
        // Validate state code (1-14)
        const stateCode = parseInt(formData.nrc_no.split('/')[0]);
        if (isNaN(stateCode) || stateCode < 1 || stateCode > 14) {
          newErrors.nrc_no = 'NRC state code must be between 1 and 14';
        }
      }
    }

    // Validate NRC components
    const nrcErrors = validateNRC(nrcState, nrcTownship, nrcType, nrcNumber);
    if (nrcErrors.length > 0) {
      if (!nrcState) newErrors.nrcState = 'State is required';
      else if (parseInt(nrcState) < 1 || parseInt(nrcState) > 14) {
        newErrors.nrcState = 'State must be between 1 and 14';
      }
      
      if (!nrcTownship) newErrors.nrcTownship = 'Township is required';
      else if (nrcState && !getTownshipsByState(nrcState).includes(nrcTownship)) {
        newErrors.nrcTownship = 'Invalid township for selected state';
      }
      
      if (!nrcNumber) newErrors.nrcNumber = 'NRC number is required';
      else if (!/^\d{6}$/.test(nrcNumber)) newErrors.nrcNumber = 'NRC number must be exactly 6 digits';
    }

    setErrors(prev => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // First do client-side validation
    if (!validateForm()) {
      return;
    }

    // Then check for duplicates
    const isEmailValid = await checkDuplicateEmail();
    const isUsernameValid = await checkDuplicateUsername();
    
    // Only check guest account if both email and username are valid
    let isGuestValid = true;
    if (isEmailValid && isUsernameValid) {
      isGuestValid = await checkGuestAccount();
    }

    if (!isEmailValid || !isUsernameValid || !isGuestValid) {
      return;
    }

    // Submit the form
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Apply field length limits
    switch (name) {
      case 'tenantName':
        if (value.length > FIELD_LIMITS.tenantName.max) return;
        break;
      case 'contactPerson':
        if (value.length > FIELD_LIMITS.contactPerson.max) return;
        break;
      case 'email':
        if (value.length > FIELD_LIMITS.email.max) return;
        break;
      case 'phone':
        if (value.length > FIELD_LIMITS.phone.max) return;
        break;
      case 'address':
        if (value.length > FIELD_LIMITS.address.max) return;
        break;
      case 'username':
        if (value.length > FIELD_LIMITS.username.max) return;
        break;
      case 'nrc_no':
        if (value.length > FIELD_LIMITS.nrc_no.max) return;
        break;
    }
    
    setFormData(prev => ({ ...prev, [name]: name === 'tenantCategoryId' ? Number(value) : value }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.startsWith('09')) value = value.slice(0, 11);
    else value = '09' + value.slice(0, 9);
    
    // Limit total characters
    if (value.length > FIELD_LIMITS.phone.max) return;
    
    setFormData(prev => ({ ...prev, phone: value }));
    if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
  };

  const handleNrcNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setNrcNumber(value);
    if (errors.nrcNumber) setErrors(prev => ({ ...prev, nrcNumber: '' }));
  };

  // Check if email and username are both filled and valid
  const isBothCredentialsFilled = formData.email && formData.username && 
                                  EMAIL_REGEX.test(formData.email) && 
                                  USERNAME_REGEX.test(formData.username);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            {isEditing ? 'Edit Tenant' : 'Add New Tenant'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tenant Name */}
            <div>
              <label htmlFor="tenantName" className="block text-sm font-medium text-gray-700 mb-1">
                Tenant Name *
              </label>
              <input
                type="text"
                id="tenantName"
                name="tenantName"
                value={formData.tenantName}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                  errors.tenantName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter tenant name"
                disabled={isLoading}
                maxLength={FIELD_LIMITS.tenantName.max}
              />
              {errors.tenantName && <p className="mt-1 text-sm text-red-600">{errors.tenantName}</p>}
            </div>

            {/* Contact Person */}
            <div>
              <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700 mb-1">
                Contact Person *
              </label>
              <input
                type="text"
                id="contactPerson"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                  errors.contactPerson ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter contact person"
                disabled={isLoading}
                maxLength={FIELD_LIMITS.contactPerson.max}
              />
              {errors.contactPerson && <p className="mt-1 text-sm text-red-600">{errors.contactPerson}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="example@domain.com"
                  disabled={isLoading}
                  maxLength={FIELD_LIMITS.email.max}
                />
                {isCheckingEmail && (
                  <div className="absolute right-2 top-2">
                    <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              {!errors.email && formData.email && EMAIL_REGEX.test(formData.email) && !isCheckingEmail && (
                <p className="mt-1 text-sm text-green-600">✓ Email is available</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone *
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handlePhoneChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="09xxxxxxxxx"
                maxLength={FIELD_LIMITS.phone.max}
                disabled={isLoading}
              />
              {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username *
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                    errors.username ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter username"
                  disabled={isLoading}
                  maxLength={FIELD_LIMITS.username.max}
                />
                {isCheckingUsername && (
                  <div className="absolute right-2 top-2">
                    <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}
              </div>
              {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
              {!errors.username && formData.username && USERNAME_REGEX.test(formData.username) && !isCheckingUsername && (
                <p className="mt-1 text-sm text-green-600">✓ Username is available</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label htmlFor="tenantCategoryId" className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                id="tenantCategoryId"
                name="tenantCategoryId"
                value={formData.tenantCategoryId}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                  errors.tenantCategoryId ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isLoading}
              >
                <option value={0}>Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.categoryName} - {category.businessType}
                  </option>
                ))}
              </select>
              {errors.tenantCategoryId && <p className="mt-1 text-sm text-red-600">{errors.tenantCategoryId}</p>}
            </div>
          </div>

          {/* Guest Account Status Display */}
          {/* {isBothCredentialsFilled && guestAccountStatus && (
            <div className={`p-3 rounded-md border ${
              guestAccountStatus.exists && guestAccountStatus.hasSameUser && guestAccountStatus.isGuestRole 
                ? 'bg-green-50 border-green-200' 
                : guestAccountStatus.differentUsers 
                  ? 'bg-red-50 border-red-200'
                  : (guestAccountStatus.emailExists && !guestAccountStatus.hasSameUser) || 
                    (guestAccountStatus.usernameExists && !guestAccountStatus.hasSameUser)
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {guestAccountStatus.exists && guestAccountStatus.hasSameUser && guestAccountStatus.isGuestRole ? (
                    <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : guestAccountStatus.differentUsers ? (
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="ml-3">
                  <h3 className={`text-sm font-medium ${
                    guestAccountStatus.exists && guestAccountStatus.hasSameUser && guestAccountStatus.isGuestRole 
                      ? 'text-green-800' 
                      : guestAccountStatus.differentUsers
                        ? 'text-red-800'
                        : 'text-yellow-800'
                  }`}>
                    {guestAccountStatus.exists && guestAccountStatus.hasSameUser && guestAccountStatus.isGuestRole 
                      ? `Guest Account Found (ID: ${guestAccountStatus.userId})`
                      : guestAccountStatus.differentUsers
                        ? 'Credentials Conflict'
                        : (guestAccountStatus.emailExists && !guestAccountStatus.hasSameUser) 
                          ? 'Email Already Registered'
                          : (guestAccountStatus.usernameExists && !guestAccountStatus.hasSameUser)
                            ? 'Username Already Taken'
                            : 'No Conflict Found'}
                  </h3>
                  <div className={`mt-1 text-sm ${
                    guestAccountStatus.exists && guestAccountStatus.hasSameUser && guestAccountStatus.isGuestRole 
                      ? 'text-green-700' 
                      : guestAccountStatus.differentUsers
                        ? 'text-red-700'
                        : 'text-yellow-700'
                  }`}>
                    {guestAccountStatus.exists && guestAccountStatus.hasSameUser && guestAccountStatus.isGuestRole 
                      ? `User: ${guestAccountStatus.username} will be converted to tenant.`
                      : guestAccountStatus.differentUsers
                        ? 'Email and username belong to different users.'
                        : (guestAccountStatus.emailExists && !guestAccountStatus.hasSameUser)
                          ? 'This email is already registered with a different username.'
                          : (guestAccountStatus.usernameExists && !guestAccountStatus.hasSameUser)
                            ? 'This username is already taken with a different email.'
                            : 'Email and username are available.'}
                  </div>
                </div>
              </div>
            </div>
          )} */}

          {/* NRC Number Section - Simple Compact Design */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-800 mb-4">NRC Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* State/Region - Compact */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State *
                </label>
                <select
                  value={nrcState}
                  onChange={(e) => {
                    setNrcState(e.target.value);
                    setNrcTownship('');
                    if (errors.nrcState) setErrors(prev => ({ ...prev, nrcState: '' }));
                  }}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm ${
                    errors.nrcState ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={isLoading}
                >
                  <option value="">State</option>
                  {MYANMAR_STATES.map((state) => (
                    <option key={state.code} value={state.code}>
                      {state.code}
                    </option>
                  ))}
                </select>
                {errors.nrcState && <p className="mt-1 text-xs text-red-600">{errors.nrcState}</p>}
              </div>

              {/* Township - Compact */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Township *
                </label>
                <select
                  value={nrcTownship}
                  onChange={(e) => {
                    setNrcTownship(e.target.value);
                    if (errors.nrcTownship) setErrors(prev => ({ ...prev, nrcTownship: '' }));
                  }}
                  disabled={!nrcState || isLoading}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm ${
                    errors.nrcTownship ? 'border-red-500' : 'border-gray-300'
                  } ${!nrcState ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                >
                  <option value="">Township</option>
                  {filteredTownships.map((township) => (
                    <option key={township} value={township}>
                      {township}
                    </option>
                  ))}
                </select>
                {errors.nrcTownship && <p className="mt-1 text-xs text-red-600">{errors.nrcTownship}</p>}
              </div>

              {/* NRC Type - Compact */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={nrcType}
                  onChange={(e) => setNrcType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                  disabled={isLoading}
                >
                  {NRC_TYPES.map((type) => (
                    <option key={type.code} value={type.code}>
                      {type.code}
                    </option>
                  ))}
                </select>
              </div>

              {/* NRC Number - Compact */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number *
                </label>
                <input
                  type="text"
                  value={nrcNumber}
                  onChange={handleNrcNumberChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm ${
                    errors.nrcNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="123456"
                  maxLength={6}
                  disabled={isLoading}
                />
                {errors.nrcNumber && <p className="mt-1 text-xs text-red-600">{errors.nrcNumber}</p>}
              </div>
            </div>

            {/* Current NRC Display (Simple) */}
            <div className="mt-4 p-3 bg-white border border-gray-300 rounded-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Current NRC:</p>
                  <p className="text-lg font-bold font-mono text-gray-800">
                    {formData.nrc_no ? (
                      <span className="text-green-600">{formData.nrc_no}</span>
                    ) : (
                      <span className="text-gray-400">--/---(N)------</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={3}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                errors.address ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter full address"
              disabled={isLoading}
              maxLength={FIELD_LIMITS.address.max}
            />
            {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1E40AF] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || isCheckingEmail || isCheckingUsername || isCheckingGuest}
              className="px-4 py-2 text-sm font-medium text-white bg-[#1E40AF] border border-transparent rounded-md shadow-sm hover:bg-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1E40AF] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading || isCheckingEmail || isCheckingUsername || isCheckingGuest ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isEditing ? 'Updating...' : 'Creating...'}
                </span>
              ) : (
                isEditing ? 'Update' : 'Create'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TenantForm;