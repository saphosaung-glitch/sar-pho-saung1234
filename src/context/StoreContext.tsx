import React, { createContext, useContext, useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { translations } from '../lib/translations';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  getDocs,
  serverTimestamp,
  increment,
  getDoc,
  addDoc,
  deleteDoc,
  limit,
  writeBatch,
  Unsubscribe
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType, getIsQuotaExceeded, onQuotaExceededChange, resetQuotaExceeded as resetQuota, signInAnonymously, googleProvider, signInWithPopup } from '../lib/firebase';
import { onAuthStateChanged, setPersistence, browserLocalPersistence, signOut, createUserWithEmailAndPassword as createAuthUser } from 'firebase/auth';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
// Fix: Use absolute-like relative path and ensure it's imported correctly
import firebaseConfig from '../../firebase-applet-config.json';

const getSecondaryAuth = () => {
  const secondaryAppName = 'SecondaryAuth';
  try {
    const existingApp = getApps().find(app => app.name === secondaryAppName);
    const secondaryApp = existingApp || initializeApp(firebaseConfig as any, secondaryAppName);
    return getAuth(secondaryApp);
  } catch (error) {
    console.error("Secondary Auth Init Error:", error);
    // Fallback to primary if secondary fails, though this might cause sign-out
    return auth;
  }
};
import { Address, ServiceArea } from '../types';

import { BroadcastToast } from '../components/ui/BroadcastToast';
import { toast } from 'sonner';

export interface Product {
  id: string;
  name: string;
  mmName: string;
  msName?: string;
  thName?: string;
  zhName?: string;
  price: number;
  category: string;
  image: string;
  unit: string;
  isPremium?: boolean;
  stock: number;
  salePrice?: number;
  description?: string;
  sku?: string;
  weight?: string;
  status: 'published' | 'draft';
  isAvailable?: boolean;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Session {
  id: string;
  userId: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  browser: string;
  os: string;
  lastActive: number;
  isCurrent: boolean;
  userAgent: string;
}

export interface Order {
  id: string;
  roomNumber: string;
  customerName: string;
  customerPhone: string;
  items: CartItem[];
  total: number;
  pointDiscount: number;
  deliveryFee: number;
  pointsUsed: number;
  earnedPoints: number;
  status: 'pending' | 'packing' | 'delivered' | 'cancelled';
  paymentMethod: string;
  address?: string;
  deliveryDate?: string;
  deliveryDay?: string;
  note?: string;
  paymentScreenshot?: string;
  timestamp: number;
  createdAt: number;
  uid?: string;
}

export interface Bundle {
  id: string;
  type: string;
  title: string;
  titleMm: string;
  description: string;
  descriptionMm: string;
  originalPrice: number;
  price: number;
  image: string;
  items: string[];
  isActive: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderAmount: number;
  maxDiscount: number;
  expiryDate: string;
  usageLimit: number;
  usageCount: number;
  isActive: boolean;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  target: string;
  details: string;
  createdAt: any;
}

export interface BroadcastNotification {
  id: string;
  title: string;
  message: string;
  image: string;
  type: 'promotion' | 'system' | 'update';
  createdAt: any;
}

export interface AdminUser {
  uid: string;
  email: string;
  role: 'superadmin' | 'staff';
  name: string;
}

export interface Category {
  id: string;
  key: string;
  nameEn: string;
  nameMm: string;
  nameMs?: string;
  nameTh?: string;
  nameZh?: string;
  isActive: boolean;
  order: number;
  supportPhone?: string;
}

export interface PromotionBanner {
  id: string;
  type: string;
  tag: string;
  title: string;
  subtitle: string;
  image: string;
  color: string;
  isActive: boolean;
  priority: number;
}

export interface Deal {
  id: string;
  type: string;
  title: string;
  titleMm: string;
  originalPrice: number;
  price: number;
  discount: string;
  image: string;
  endTime: string;
  soldCount: number;
  totalCount: number;
  description: string;
  descriptionMm: string;
  isActive: boolean;
}

export interface SupportContact {
  id: string;
  type: 'general' | 'order' | 'cancellation' | 'help' | 'other';
  labelEn: string;
  labelMm: string;
  phone: string;
}

interface StoreContextType {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  cartTotal: number;
  userName: string;
  setUserName: (name: string) => void;
  userPhone: string;
  setUserPhone: (phone: string) => void;
  roomNumber: string;
  setRoomNumber: (room: string) => void;
  estimatedDeliveryTime: string;
  setEstimatedDeliveryTime: (time: string) => Promise<void>;
  orders: Order[];
  adminOrders: Order[];
  supportNumber: string;
  setSupportNumber: (num: string) => void;
  supportContacts: SupportContact[];
  setSupportContacts: (contacts: SupportContact[]) => Promise<void>;
  shopPhone: string;
  setShopPhone: (phone: string) => Promise<void>;
  shopEmail: string;
  setShopEmail: (email: string) => Promise<void>;
  bankName: string;
  setBankName: (name: string) => void;
  bankAccountNumber: string;
  setBankAccountNumber: (num: string) => void;
  bankAccountName: string;
  setBankAccountName: (name: string) => void;
  userAvatar: string;
  setUserAvatar: (avatar: string) => void;
  userEmail: string;
  setUserEmail: (email: string) => void;
  userBirthday: string;
  setUserBirthday: (birthday: string) => void;
  updateUserProfile: (profile: {
    name?: string;
    phone?: string;
    room?: string;
    avatar?: string;
    email?: string;
    birthday?: string;
  }) => Promise<void>;
  placeOrder: (details: { 
    name: string; 
    phone: string; 
    room: string; 
    address?: string;
    paymentMethod: string; 
    pointDiscount: number; 
    pointsUsed: number 
  }) => any;
  updateOrderStatus: (id: string, status: Order['status']) => void;
  cancelOrder: (id: string) => void;
  reorder: (order: Order) => Promise<{ success: boolean; message?: string }>;
  favorites: string[];
  toggleFavorite: (id: string) => void;
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
  emailNotificationsEnabled: boolean;
  setEmailNotificationsEnabled: (enabled: boolean) => void;
  paymentMethods: PaymentMethod[];
  addPaymentMethod: (method: Omit<PaymentMethod, 'id'>) => void;
  removePaymentMethod: (id: string) => void;
  setDefaultPaymentMethod: (id: string) => void;
  points: number;
  setPoints: (points: number) => void;
  language: string;
  setLanguage: (lang: string) => void;
  currency: 'RM' | 'MMK';
  setCurrency: (currency: 'RM' | 'MMK') => void;
  formatPrice: (price: number) => string;
  getCategoryName: (categoryId: string) => string;
  getMainName: (item: any) => string;
  getSecondaryName: (item: any) => string;
  getLocalizedName: (item: any) => string;
  t: (key: string) => string;
  darkMode: boolean;
  setDarkMode: (enabled: boolean) => void;
  isDeliveryEnabled: boolean;
  setIsDeliveryEnabled: (enabled: boolean) => Promise<void>;
  deliveryFee: number;
  setDeliveryFee: (fee: number) => Promise<void>;
  isLowStockAlertEnabled: boolean;
  setIsLowStockAlertEnabled: (enabled: boolean) => Promise<void>;
  cutoffTime: string;
  setCutoffTime: (time: string) => Promise<void>;
  isBankEnabled: boolean;
  setIsBankEnabled: (enabled: boolean) => Promise<void>;
  getDeliveryDate: () => { date: string; isToday: boolean };
  logout: () => void;
  forceSync: () => Promise<void>;
  isSyncing: boolean;
  isProfileLoaded: boolean;
  uid: string | null;
  authUid: string | null;
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addresses: Address[];
  addAddress: (address: Omit<Address, 'id'>) => Promise<void>;
  updateAddress: (id: string, address: Partial<Address>) => Promise<void>;
  removeAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;
  selectedAddressId: string | null;
  setSelectedAddressId: (id: string | null) => void;
  categories: Category[];
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  promotionBanners: PromotionBanner[];
  deals: Deal[];
  bundles: Bundle[];
  addPromotionBanner: (banner: Omit<PromotionBanner, 'id' | 'priority'>) => Promise<void>;
  updatePromotionBanner: (id: string, banner: Partial<PromotionBanner>) => Promise<void>;
  deletePromotionBanner: (id: string) => Promise<void>;
  reorderPromotionBanners: (banners: PromotionBanner[]) => Promise<void>;
  addDeal: (deal: Omit<Deal, 'id'>) => Promise<void>;
  updateDeal: (id: string, deal: Partial<Deal>) => Promise<void>;
  deleteDeal: (id: string) => Promise<void>;
  addBundle: (bundle: Omit<Bundle, 'id'>) => Promise<void>;
  updateBundle: (id: string, bundle: Partial<Bundle>) => Promise<void>;
  deleteBundle: (id: string) => Promise<void>;
  updateProductStock: (productId: string, newStock: number) => Promise<void>;
  coupons: Coupon[];
  addCoupon: (coupon: Omit<Coupon, 'id'>) => Promise<void>;
  updateCoupon: (id: string, coupon: Partial<Coupon>) => Promise<void>;
  deleteCoupon: (id: string) => Promise<void>;
  auditLogs: AuditLog[];
  logAudit: (action: string, target: string, details: string) => Promise<void>;
  broadcastNotifications: BroadcastNotification[];
  sendBroadcast: (notification: Omit<BroadcastNotification, 'id' | 'createdAt'>) => Promise<void>;
  admins: AdminUser[];
  addAdmin: (admin: Omit<AdminUser, 'createdAt'>) => Promise<void>;
  createNewAdmin: (email: string, password: string, name: string, role: AdminUser['role']) => Promise<void>;
  updateAdminRole: (uid: string, role: AdminUser['role']) => Promise<void>;
  removeAdmin: (uid: string) => Promise<void>;
  users: any[];
  updateUserPoints: (uid: string, points: number) => Promise<void>;
  isAdmin: boolean;
  isAuthLoading: boolean;
  isQuotaExceeded: boolean;
  resetQuotaExceeded: () => void;
  deviceId: string;
  sessions: Session[];
  revokeSession: (sessionId: string) => Promise<void>;
  refreshAllData: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  isBlocked: boolean;
  blockMessage: string;
  totalOrders: number;
  serviceAreas: ServiceArea[];
  addServiceArea: (area: Omit<ServiceArea, 'id'>) => Promise<void>;
  updateServiceArea: (id: string, updates: Partial<ServiceArea>) => Promise<void>;
  deleteServiceArea: (id: string) => Promise<void>;
  settings: { productionUrl: string };
  updateSettings: (newSettings: { productionUrl: string }) => Promise<void>;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'offer' | 'system';
  timestamp: number;
  read: boolean;
}

export interface PaymentMethod {
  id: string;
  type: 'visa' | 'mastercard' | 'amex' | 'kpay' | 'wave';
  last4: string;
  expiry: string;
  cardHolder: string;
  isDefault: boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const safeParse = <T,>(saved: string | null, fallback: T): T => {
    if (!saved) return fallback;
    try {
      return JSON.parse(saved);
    } catch {
      return fallback;
    }
  };

  const [cart, setCart] = useState<CartItem[]>(() => safeParse(sessionStorage.getItem('sp_cart'), []));

  const [authUid, setAuthUid] = useState<string | null>(null);
  const [userName, setUserName] = useState(() => {
    const val = localStorage.getItem('sp_user_name');
    return (val && val !== 'null' && val !== 'undefined') ? val : '';
  });
  const [userPhone, setUserPhone] = useState(() => {
    const val = localStorage.getItem('sp_user_phone');
    return (val && val !== 'null' && val !== 'undefined') ? val : '';
  });

  // Persist user info to localStorage
  useEffect(() => {
    if (userName) localStorage.setItem('sp_user_name', userName);
    else localStorage.removeItem('sp_user_name');
  }, [userName]);

  useEffect(() => {
    if (userPhone) localStorage.setItem('sp_user_phone', userPhone);
    else localStorage.removeItem('sp_user_phone');
  }, [userPhone]);

  const [userAvatar, setUserAvatar] = useState(() => {
    const val = localStorage.getItem('sp_user_avatar');
    return (val && val !== 'null' && val !== 'undefined') ? val : '';
  });
  const [userEmail, setUserEmail] = useState(() => {
    const val = localStorage.getItem('sp_user_email');
    return (val && val !== 'null' && val !== 'undefined') ? val : '';
  });
  const [userBirthday, setUserBirthday] = useState(() => {
    const val = localStorage.getItem('sp_user_birthday');
    return (val && val !== 'null' && val !== 'undefined') ? val : '';
  });
  const [roomNumber, setRoomNumber] = useState(() => localStorage.getItem('sp_room') || '');
  const [orders, setOrders] = useState<Order[]>(() => safeParse(localStorage.getItem('sp_orders'), []));
  const [totalOrders, setTotalOrders] = useState<number>(0);
  const [adminOrders, setAdminOrders] = useState<Order[]>([]);
  const [estimatedDeliveryTime, setEstimatedDeliveryTimeState] = useState('8:00 AM - 10:00 AM');
  const [points, setPoints] = useState(() => {
    const saved = localStorage.getItem('sp_points');
    const parsed = saved ? parseInt(saved, 10) : 0;
    return isNaN(parsed) ? 0 : parsed;
  });
  const [products, setProducts] = useState<any[]>(() => safeParse(localStorage.getItem('sp_products'), []));
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockMessage, setBlockMessage] = useState('');
  
  // Persist products to local storage
  useEffect(() => {
    if (products.length > 0) {
      localStorage.setItem('sp_products', JSON.stringify(products));
    }
  }, [products]);
  const [addresses, setAddresses] = useState<Address[]>(() => safeParse(localStorage.getItem('sp_addresses'), []));
  const [selectedAddressId, setSelectedAddressIdState] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>(() => safeParse(localStorage.getItem('sp_favorites'), []));
  const [categories, setCategories] = useState<Category[]>(() => safeParse(localStorage.getItem('sp_categories'), []));
  
  useEffect(() => {
    if (categories.length > 0) {
      localStorage.setItem('sp_categories', JSON.stringify(categories));
    }
  }, [categories]);
  const [promotionBanners, setPromotionBanners] = useState<PromotionBanner[]>(() => safeParse(localStorage.getItem('sp_banners'), []));
  
  useEffect(() => {
    if (promotionBanners.length > 0) {
      localStorage.setItem('sp_banners', JSON.stringify(promotionBanners));
    }
  }, [promotionBanners]);
  const [deals, setDeals] = useState<Deal[]>(() => safeParse(localStorage.getItem('sp_deals'), []));
  
  useEffect(() => {
    if (deals.length > 0) {
      localStorage.setItem('sp_deals', JSON.stringify(deals));
    }
  }, [deals]);
  const [bundles, setBundles] = useState<Bundle[]>(() => safeParse(localStorage.getItem('sp_bundles'), []));
  
  useEffect(() => {
    if (bundles.length > 0) {
      localStorage.setItem('sp_bundles', JSON.stringify(bundles));
    }
  }, [bundles]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [broadcastNotifications, setBroadcastNotifications] = useState<BroadcastNotification[]>([]);
  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>(() => safeParse(localStorage.getItem('sp_serviceAreas'), []));
  const [settings, setSettings] = useState<{ productionUrl: string }>({ productionUrl: 'https://sartawset.com' });
  
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'global'), (doc) => {
      if (doc.exists()) {
        setSettings(doc.data() as { productionUrl: string });
      }
    });
    return () => unsub();
  }, []);

  const updateSettings = async (newSettings: { productionUrl: string }) => {
    if (!isAdmin) return;
    try {
      await setDoc(doc(db, 'settings', 'global'), {
        ...newSettings,
        updatedAt: serverTimestamp()
      }, { merge: true });
      toast.success('System settings updated');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'settings/global');
    }
  };

  useEffect(() => {
    if (serviceAreas.length > 0) {
      localStorage.setItem('sp_serviceAreas', JSON.stringify(serviceAreas));
    }
  }, [serviceAreas]);
  const [notifications, setNotifications] = useState<Notification[]>(() => safeParse(localStorage.getItem('sp_notifications'), []));
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isMappingSynced, setIsMappingSynced] = useState(false);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(getIsQuotaExceeded());
  const [deviceId] = useState(() => {
    let id = localStorage.getItem('sp_device_id');
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      localStorage.setItem('sp_device_id', id);
    }
    return id;
  });

  const resetQuotaExceeded = () => {
    resetQuota();
    setIsQuotaExceeded(false);
  };

  const stateRef = useRef({
    userName, userPhone, roomNumber, userAvatar, userEmail, userBirthday, points
  });

  useEffect(() => {
    stateRef.current = {
      userName, userPhone, roomNumber, userAvatar, userEmail, userBirthday, points
    };
  });

  // Listen for quota changes
  useEffect(() => {
    return onQuotaExceededChange((exceeded) => {
      setIsQuotaExceeded(exceeded);
    });
  }, []);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId] = useState(() => {
    let id = sessionStorage.getItem('sp_session_id');
    if (!id) {
      id = Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem('sp_session_id', id);
    }
    return id;
  });

  // UID for data is derived from phone number for persistence across devices
  const uid = useMemo(() => {
    if (!userPhone) return null;
    return userPhone.replace(/[^0-9]/g, '');
  }, [userPhone]);

  const logAudit = useCallback(async (action: string, target: string, details: string) => {
    // Audit logging disabled to save Firestore quota
    return;
  }, [isAdmin, uid]);

  const lastSyncedCartRef = useRef<string>('');
  const lastSyncedFavoritesRef = useRef<string>('');
  const lastSyncedUidRef = useRef<string | null>(null);
  const lookupPhoneMappingRef = useRef<string | null>(null);
  const lastSyncedUserDataRef = useRef<string>('');
  const shouldMergeGuestDataRef = useRef(true);
  const isInitialMount = useRef(true);
  const isProfileLoadedRef = useRef(false);

  // Keep ref in sync for closure access
  useEffect(() => {
    isProfileLoadedRef.current = isProfileLoaded;
  }, [isProfileLoaded]);

  // Helper to reset all user-related state and storage
  const clearUserData = useCallback((options?: { skipPhoneReset?: boolean }) => {
    console.log("StoreContext: Clearing all local user data", options);
    
    // Clear storage
    const keysToClear = [
      'sp_addresses', 'sp_orders', 'sp_points', 'sp_favorites', 
      'sp_user_name', 'sp_room', 'sp_cart',
      'sp_user_avatar', 'sp_user_email', 'sp_user_birthday',
      'sp_notifications', 'sp_payment_methods', 'sp_recent_searches'
    ];
    if (!options?.skipPhoneReset) {
      keysToClear.push('sp_user_phone');
    }
    
    keysToClear.forEach(key => localStorage.removeItem(key));
    sessionStorage.removeItem('sp_cart');
    
    // Reset state
    setUserName('');
    if (!options?.skipPhoneReset) {
      setUserPhone('');
    }
    setUserEmail('');
    setUserBirthday('');
    setUserAvatar('');
    setRoomNumber('');
    setPoints(0);
    setAddresses([]);
    setOrders([]);
    setFavorites([]);
    setCart([]);
    setNotifications([]);
    setPaymentMethods([]);

    // Invalidate sync refs to ensure proper initial merge from cloud
    lastSyncedCartRef.current = '[]';
    lastSyncedFavoritesRef.current = '[]';
    lastSyncedUserDataRef.current = '';
  }, []);

  // Sync User Data with Firestore
  useEffect(() => {
    // BACKWARD LOOKUP: If we have an Auth UID but no Phone UID (e.g. after reload), 
    // try to find the mapping in Firestore to restore the phone-based session
    if (authUid && !uid && !isAuthLoading && !getIsQuotaExceeded()) {
      // Prevent multiple lookups for the same auth session
      if (lookupPhoneMappingRef.current === authUid) {
        // If we already tried and didn't find anything, we can mark as loaded if not already
        if (!isProfileLoaded && !uid) {
           setIsProfileLoaded(true);
        }
        return;
      }
      
      const lookupMapping = async () => {
        try {
          console.log("StoreContext: Attempting auth mapping restoration for:", authUid);
          const mappingSnap = await getDoc(doc(db, 'authToPhone', authUid));
          if (mappingSnap.exists()) {
            const mappedPhone = mappingSnap.data().phone;
            if (mappedPhone) {
              console.log("StoreContext: Restored phone from mapping:", mappedPhone);
              setUserPhone(mappedPhone);
              // Note: setUserPhone will update uid via useMemo, triggering this effect again
              return;
            }
          }
        } catch (err) {
          console.warn("StoreContext: Auth mapping restoration failed:", err);
        } finally {
          setIsProfileLoaded(true);
        }
      };
      lookupPhoneMappingRef.current = authUid;
      lookupMapping();
      return;
    }

    if (!uid) {
      if (isAuthLoading) return;
      
      console.log("StoreContext: No UID available (Not logged in), marking profile as loaded");
      setIsProfileLoaded(true);
      lastSyncedUidRef.current = null;
      return;
    }

    // Wait for authUid only if we actually need it for secure writes, 
    // but we can start the profile listener as soon as we have a phone UID
    if (!authUid) {
      console.log("StoreContext: Waiting for authUid before syncing secure mappings for UID:", uid);
      // We don't return here if we want to show points/name immediately from basic doc
      // setIsProfileLoaded(false); // keep loading
    }

    // SECURITY & ISOLATION: Check for User Switch
    const isNewUserSwitch = lastSyncedUidRef.current !== uid;
    
    if (isNewUserSwitch) {
      const wasGuest = lastSyncedUidRef.current === null;
      // ONLY clear data if we are switching from a valid User A to a valid User B
      // This prevents clearing during temporary null flips
      if (!wasGuest && uid !== null) {
        console.log("StoreContext: Real user switch detected, clearing data.");
        clearUserData({ skipPhoneReset: true });
        lastSyncedUidRef.current = uid;
        shouldMergeGuestDataRef.current = false;
        return; 
      }
      
      if (uid !== null) {
        lastSyncedUidRef.current = uid;
        shouldMergeGuestDataRef.current = wasGuest;
      }
    }
    
    if (!isNewUserSwitch && isProfileLoaded && (authUid === null || isMappingSynced)) {
      console.log("StoreContext: Profile and mapping already synced for UID, skipping refresh.");
      return;
    }

    lastSyncedUidRef.current = uid;
    setIsProfileLoaded(false);
    const userDocRef = doc(db, 'users', uid);
    const authMappingRef = authUid ? doc(db, 'authToPhone', authUid) : null;
    
    // 1. One-time Setup/Merge logic (Async)
    const runInitialMerge = async () => {
      // Only run mapping sync if we have both
      if (uid && authUid && authMappingRef && !getIsQuotaExceeded()) {
        try {
          await setDoc(authMappingRef, { phone: uid, lastActive: serverTimestamp() }, { merge: true });
        } catch (e) {
          console.warn("Auth mapping update skipped or failed:", e);
        }
      }

      try {
        console.log("StoreContext: Syncing profile for UID:", uid);
        const docSnap = await getDoc(userDocRef);
        const shouldMerge = shouldMergeGuestDataRef.current;
        
        if (!docSnap.exists()) {
          console.log("StoreContext: Initializing new account doc", { shouldMerge });
          if (getIsQuotaExceeded()) {
            setIsProfileLoaded(true);
            return;
          }
          const initialCart = (shouldMerge && cart.length > 0) ? cart : [];
          const initialFavorites = (shouldMerge && favorites.length > 0) ? favorites : [];
          
          lastSyncedCartRef.current = JSON.stringify(initialCart);
          lastSyncedFavoritesRef.current = JSON.stringify(initialFavorites);
          setCart(initialCart);
          setFavorites(initialFavorites);

          const initialData: any = {
            uid,
            authUid: authUid || null,
            name: userName, 
            phone: userPhone,
            room: '',
            avatar: '',
            email: '',
            birthday: '',
            points: 0,
            cart: initialCart,
            favorites: initialFavorites,
            lastActive: serverTimestamp()
          };
          await setDoc(userDocRef, initialData, { merge: true });

          // Also sync any local addresses to the new account with DEDUPLICATION
          if (shouldMerge && addresses.length > 0) {
            console.log("StoreContext: Syncing local addresses to new account doc (with deduplication)");
            const addressesRef = collection(db, 'users', uid, 'addresses');
            const batch = writeBatch(db);
            
            // To prevent duplicates during initial sync, we'll keep track of normalized addresses
            const addedAddressKeys = new Set<string>();

            addresses.forEach(addr => {
              // Create a unique key for this address to detect duplicates
              const addressKey = `${addr.building || ''}-${addr.street || ''}-${addr.room || ''}`.toLowerCase().replace(/\s/g, '');
              
              if (!addedAddressKeys.has(addressKey)) {
                const newDocRef = doc(addressesRef); // Generate new ID in Firestore
                batch.set(newDocRef, { ...addr, id: newDocRef.id });
                addedAddressKeys.add(addressKey);
              }
            });
            await batch.commit().catch(err => console.error("Initial address sync failed:", err));
          }
        } else {
          console.log("StoreContext: Merging existing account doc", { shouldMerge });
          const data = docSnap.data();
          
          // Merge logic
          const firestoreFavorites = data.favorites || [];
          console.log("StoreContext: Merging favorites", { firestore: firestoreFavorites.length, local: favorites.length, shouldMerge });
          const mergedFavorites = shouldMerge 
            ? Array.from(new Set([...firestoreFavorites, ...favorites]))
            : firestoreFavorites;
          
          const firestoreCart = data.cart || [];
          const mergedCart = [...firestoreCart];
          if (shouldMerge) {
            console.log("StoreContext: Merging cart", { firestore: firestoreCart.length, local: cart.length });
            cart.forEach(localItem => {
              const existingIndex = mergedCart.findIndex(i => i.id === localItem.id);
              if (existingIndex > -1) {
                mergedCart[existingIndex].quantity = Math.max(mergedCart[existingIndex].quantity, localItem.quantity);
              } else {
                mergedCart.push(localItem);
              }
            });
          }

          const updateData: any = {
            favorites: mergedFavorites,
            cart: mergedCart,
            // Prioritize server name if it exists, otherwise use local name
            name: data.name || userName || '',
            // Ensure points are restored correctly from server
            points: data.points !== undefined ? data.points : (points || 0),
            lastActive: serverTimestamp()
          };
          if (authUid) updateData.authUid = authUid;
          
          if (!getIsQuotaExceeded()) {
            console.log("StoreContext: Pushing merged data to Firestore", { favorites: mergedFavorites.length, cart: mergedCart.length });
            await updateDoc(userDocRef, updateData).catch(err => console.error("Initial sync update failed:", err));
          }
          
          lastSyncedCartRef.current = JSON.stringify(mergedCart);
          lastSyncedFavoritesRef.current = JSON.stringify(mergedFavorites);
          setCart(mergedCart);
          setFavorites(mergedFavorites);

          if (data.points !== undefined) setPoints(data.points);
          else if (points > 0) {
            // If server has no points but local has, we effectively just "pushed" them in the updateDoc above
            // So we don't need to do anything here, local state is already correct
          }

          // Sync addresses for existing doc with DEDUPLICATION
          if (shouldMerge && addresses.length > 0) {
             const addressesRef = collection(db, 'users', uid, 'addresses');
             const existingAddrsSnap = await getDocs(addressesRef);
             
             // Build a set of existing address keys to prevent duplicates
             const existingAddressKeys = new Set<string>();
             existingAddrsSnap.docs.forEach(doc => {
               const addr = doc.data();
               const key = `${addr.building || ''}-${addr.street || ''}-${addr.room || ''}`.toLowerCase().replace(/\s/g, '');
               existingAddressKeys.add(key);
             });

             console.log("StoreContext: Merging local addresses with cloud (deduplicating)");
             const batch = writeBatch(db);
             let addedCount = 0;

             addresses.forEach(addr => {
               const key = `${addr.building || ''}-${addr.street || ''}-${addr.room || ''}`.toLowerCase().replace(/\s/g, '');
               if (!existingAddressKeys.has(key)) {
                 const newDocRef = doc(addressesRef);
                 batch.set(newDocRef, { ...addr, id: newDocRef.id });
                 existingAddressKeys.add(key);
                 addedCount++;
               }
             });

             if (addedCount > 0) {
               await batch.commit().catch(err => console.error("Initial address merge failed:", err));
             }
          }
        }
        // Reset flag after first sync run for this UID
        shouldMergeGuestDataRef.current = true;
        // Mark as loaded ONLY after initial merge/check is fully done
        setIsProfileLoaded(true);
      } catch (err) {
        console.error("StoreContext: Error during profile sync:", err);
        setIsProfileLoaded(true); // Don't block UI on error
      }
    };

    runInitialMerge();

    // 2. Continuous Listeners (Synchronous setup)
    const unsubscribeProfile = onSnapshot(userDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        
        // Use functional updates to prevent stale closure issues and redundant re-renders
        if (data.points !== undefined) {
          setPoints(prev => prev !== data.points ? (data.points || 0) : prev);
        }
        
        // Sync Profile details - Only override if server has data and it's different
        if (data.name && data.name !== stateRef.current.userName) {
          setUserName(data.name);
          localStorage.setItem('sp_user_name', data.name);
        }
        
        if (data.room !== undefined && data.room !== stateRef.current.roomNumber) {
          setRoomNumber(data.room);
        }
        
        if (data.avatar !== undefined && data.avatar !== stateRef.current.userAvatar) {
          setUserAvatar(data.avatar);
        }
        
        if (data.email !== undefined && data.email !== stateRef.current.userEmail) {
          setUserEmail(data.email);
        }

        if (data.isBlocked !== undefined) {
          setIsBlocked(data.isBlocked);
        }
        if (data.blockMessage !== undefined) {
          setBlockMessage(data.blockMessage);
        }
        
        if (data.totalOrders !== undefined) {
          setTotalOrders(data.totalOrders);
        }

        // Sync Cart - with stability check and PROTECTION against accidental wipes
        if (data.cart) {
          const cartString = JSON.stringify(data.cart);
          
          setCart(currentCart => {
            const isServerCartPopulated = data.cart.length > 0;
            const isSafeToOverwrite = isProfileLoadedRef.current && (isServerCartPopulated || currentCart.length === 0);
            
            if (isServerCartPopulated || isSafeToOverwrite) {
              if (cartString !== lastSyncedCartRef.current) {
                lastSyncedCartRef.current = cartString;
                return data.cart;
              }
            }
            return currentCart;
          });
        }

        if (data.favorites) {
           const favString = JSON.stringify(data.favorites);
           
           setFavorites(currentFavorites => {
             const isServerFavPopulated = data.favorites.length > 0;
             const isSafeToOverwriteFav = isProfileLoadedRef.current && (isServerFavPopulated || currentFavorites.length === 0);
             
             if (isServerFavPopulated || isSafeToOverwriteFav) {
               if (favString !== lastSyncedFavoritesRef.current) {
                 lastSyncedFavoritesRef.current = favString;
                 return data.favorites;
               }
             }
             return currentFavorites;
           });
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${uid}`);
    });

    return () => {
      unsubscribeProfile();
    };
  }, [uid, authUid]);

  // Handle Addresses Listener in a separate effect to avoid loop with isProfileLoaded
  useEffect(() => {
    if (!uid || !isProfileLoaded || (!isMappingSynced && !isAdmin)) {
      return;
    }

    console.log("StoreContext: Starting addresses listener for UID:", uid);
    const addressesRef = collection(db, 'users', uid, 'addresses');
    const unsubscribeAddresses = onSnapshot(addressesRef, (snapshot) => {
      const fetchedAddresses = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Address[];

      // DEDUPLICATION: Ensure no identical addresses are displayed
      const uniqueItems = new Map<string, Address>();
      fetchedAddresses.forEach(addr => {
        // Create a unique fingerprint based on building/street/room
        const key = `${addr.building || ''}-${addr.street || ''}-${addr.room || ''}`.toLowerCase().replace(/\s/g, '');
        // If we don't have this address yet, or this one is set as default, keep it
        if (!uniqueItems.has(key) || addr.isDefault) {
          uniqueItems.set(key, addr);
        }
      });
      const deduplicated = Array.from(uniqueItems.values());

      // PROTECTION: Only override if cloud has data OR we are sure Firestore has been synced
      if (deduplicated.length > 0 || isProfileLoaded) {
        setAddresses(deduplicated);
      }
    }, (error) => {
      // Only log if it's not a quota issue (handled globally)
      if (!error.message.includes('resource-exhausted')) {
        handleFirestoreError(error, OperationType.LIST, `users/${uid}/addresses`);
      }
    });

    return () => unsubscribeAddresses();
  }, [uid, isProfileLoaded, isMappingSynced, isAdmin]);

  const setSelectedAddressId = (id: string | null) => {
    setSelectedAddressIdState(id);
    if (id) {
      localStorage.setItem('sp_selected_address_id', id);
    } else {
      localStorage.removeItem('sp_selected_address_id');
    }
  };

  // Persist addresses to localStorage
  useEffect(() => {
    localStorage.setItem('sp_addresses', JSON.stringify(addresses));
  }, [addresses]);

  // Persist products to localStorage
  useEffect(() => {
    if (products.length > 0) {
      localStorage.setItem('sp_products', JSON.stringify(products));
    }
  }, [products]);

  // Persist orders to localStorage
  useEffect(() => {
    localStorage.setItem('sp_orders', JSON.stringify(orders));
  }, [orders]);

  // Dedicated Effect to sync Favorites to Firestore
  useEffect(() => {
    // SECURITY: Never push favorites to Firestore if profile isn't fully loaded
    // This prevents empty guest state from wiping server state during transitions
    if (!uid || !isProfileLoaded || getIsQuotaExceeded()) return;
    
    const favString = JSON.stringify(favorites);
    if (favString !== lastSyncedFavoritesRef.current) {
      // Protection against empty wipe: 
      // If server document was just loaded and was non-empty, but we have [] locally 
      // and we haven't confirmed a manual "un-favourite all" action, don't sync.
      // For now, we assume if isProfileLoaded is true, local state is the truth.
      
      console.log("StoreContext: Pushed favorites update to cloud", favorites.length, { prev: lastSyncedFavoritesRef.current, current: favString });
      lastSyncedFavoritesRef.current = favString;
      updateDoc(doc(db, 'users', uid), {
        favorites: favorites,
        lastActive: serverTimestamp()
      }).catch(err => {
        if (!err.message.includes('resource-exhausted')) {
          console.error("Favorites sync to Firestore failed:", err);
        }
      });
    }
  }, [favorites, uid, isProfileLoaded]);

  // Dedicated Effect to sync Cart to Firestore
  useEffect(() => {
    if (!uid || !isProfileLoaded || getIsQuotaExceeded()) return;
    
    const cartString = JSON.stringify(cart);
    if (cartString !== lastSyncedCartRef.current) {
      console.log("StoreContext: Syncing cart to Firestore", cart.length);
      lastSyncedCartRef.current = cartString;
      updateDoc(doc(db, 'users', uid), {
        cart: cart,
        lastActive: serverTimestamp()
      }).catch(err => {
        if (!err.message.includes('resource-exhausted')) {
          console.error("Cart sync to Firestore failed:", err);
        }
      });
    }
  }, [cart, uid, isProfileLoaded]);

  // Persist banners, deals, bundles to localStorage
  useEffect(() => {
    if (categories.length > 0) localStorage.setItem('sp_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    if (promotionBanners.length > 0) localStorage.setItem('sp_banners', JSON.stringify(promotionBanners));
  }, [promotionBanners]);

  useEffect(() => {
    if (deals.length > 0) localStorage.setItem('sp_deals', JSON.stringify(deals));
  }, [deals]);

  useEffect(() => {
    if (bundles.length > 0) localStorage.setItem('sp_bundles', JSON.stringify(bundles));
  }, [bundles]);

  useEffect(() => {
    if (coupons.length > 0) localStorage.setItem('sp_coupons', JSON.stringify(coupons));
  }, [coupons]);

  useEffect(() => {
    if (broadcastNotifications.length > 0) localStorage.setItem('sp_broadcasts', JSON.stringify(broadcastNotifications));
  }, [broadcastNotifications]);

  // Persistence Helpers
  const getCacheTime = (key: string) => {
    const time = localStorage.getItem(`sp_cache_time_${key}`);
    return time ? parseInt(time, 10) : 0;
  };

  const setCacheTime = (key: string) => {
    localStorage.setItem(`sp_cache_time_${key}`, Date.now().toString());
  };

  const isCacheValid = (key: string, ttlMs = 1800000) => { // Default 30 mins
    const now = Date.now();
    const lastSync = getCacheTime(key);
    return (now - lastSync) < ttlMs;
  };

  // Sync categories from Firestore (Real-time)
  useEffect(() => {
    const q = query(collection(db, 'categories'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Category[];
      setCategories(data);
      localStorage.setItem('sp_categories', JSON.stringify(data));
    }, (error) => {
      if (!error.message?.includes('resource-exhausted')) {
        handleFirestoreError(error, OperationType.LIST, 'categories');
      }
    });

    return () => unsubscribe();
  }, []);

  // Sync serviceAreas from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'serviceAreas'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ServiceArea[];
      setServiceAreas(data);
      localStorage.setItem('sp_serviceAreas', JSON.stringify(data));
    }, (error) => {
      if (!error.message?.includes('resource-exhausted')) {
        handleFirestoreError(error, OperationType.LIST, 'serviceAreas');
      }
    });

    return () => unsubscribe();
  }, []);

  const addServiceArea = async (area: Omit<ServiceArea, 'id'>) => {
    if (getIsQuotaExceeded()) {
      toast.error('Daily limit reached. Cannot add service area.');
      return;
    }
    try {
      await addDoc(collection(db, 'serviceAreas'), area);
      toast.success('Service area added');
    } catch (error) {
      toast.error('Failed to add service area');
      handleFirestoreError(error, OperationType.CREATE, 'serviceAreas');
    }
  };

  const updateServiceArea = async (id: string, updates: Partial<ServiceArea>) => {
    if (getIsQuotaExceeded()) {
      toast.error('Daily limit reached. Cannot update service area.');
      return;
    }
    try {
      await updateDoc(doc(db, 'serviceAreas', id), updates);
      toast.success('Service area updated');
    } catch (error) {
      toast.error('Failed to update service area');
      handleFirestoreError(error, OperationType.UPDATE, `serviceAreas/${id}`);
    }
  };

  const deleteServiceArea = async (id: string) => {
    if (getIsQuotaExceeded()) {
      toast.error('Daily limit reached. Cannot delete service area.');
      return;
    }
    try {
      await deleteDoc(doc(db, 'serviceAreas', id));
      toast.success('Service area deleted');
    } catch (error) {
      toast.error('Failed to delete service area');
      handleFirestoreError(error, OperationType.DELETE, `serviceAreas/${id}`);
    }
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    if (getIsQuotaExceeded()) {
      toast.error('Daily limit reached. Cannot update category.');
      return;
    }
    
    // Sanitize updates
    const cleanUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key as keyof Category] = value as any;
      }
      return acc;
    }, {} as any);

    try {
      await updateDoc(doc(db, 'categories', id), cleanUpdates);
      toast.success('Category updated');
    } catch (error) {
      toast.error('Failed to update category');
      handleFirestoreError(error, OperationType.UPDATE, `categories/${id}`);
    }
  };

  const addCategory = async (category: Omit<Category, 'id'>) => {
    if (getIsQuotaExceeded()) {
      toast.error('Daily limit reached. Cannot add category.');
      return;
    }
    try {
      const id = category.key.toLowerCase().replace(/[^a-z0-9]/g, '-');
      await setDoc(doc(db, 'categories', id), { ...category, id });
      toast.success('Category added');
    } catch (error) {
      toast.error('Failed to add category');
      handleFirestoreError(error, OperationType.CREATE, 'categories');
    }
  };

  const deleteCategory = async (id: string) => {
    if (getIsQuotaExceeded()) {
      toast.error('Daily limit reached. Cannot delete category.');
      return;
    }
    try {
      await deleteDoc(doc(db, 'categories', id));
      toast.success('Category deleted');
    } catch (error) {
      toast.error('Failed to delete category');
      handleFirestoreError(error, OperationType.DELETE, `categories/${id}`);
    }
  };

  // Sync products from Firestore with onSnapshot for real-time updates
  useEffect(() => {
    // If not admin and we have cache, we might want to stick to cache to save quota
    // But user asked for real-time, so we'll use onSnapshot if quota allows
    if (getIsQuotaExceeded()) return;

    const q = query(collection(db, 'products'), limit(300));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
      
      if (productsData.length > 0) {
        setProducts(productsData);
        setCacheTime('products');
        localStorage.setItem('sp_products', JSON.stringify(productsData));
      } else if (snapshot.empty && !getIsQuotaExceeded()) {
        // Auto-seed only if truly empty
        import('../lib/seed').then(({ seedDatabase }) => {
          seedDatabase().catch(() => {});
        });
      }
    }, (error) => {
      if (!error.message?.includes('resource-exhausted')) {
        handleFirestoreError(error, OperationType.LIST, 'products');
      }
    });

    return () => unsubscribe();
  }, [isAdmin]); // Admins might need fresher data/permissions

  // Sync Coupons from Firestore
  const syncingCoupons = useRef(false);
  useEffect(() => {
    const fetchCoupons = async () => {
      if (coupons.length > 0 && isCacheValid('coupons', 3600000)) return;
      if (syncingCoupons.current) return;
      syncingCoupons.current = true;
      try {
        const q = query(collection(db, 'coupons'), limit(20));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Coupon[];
        setCoupons(data);
        setCacheTime('coupons');
      } catch (error) {
      } finally {
        syncingCoupons.current = false;
      }
    };
    fetchCoupons();
  }, []);

  // Sync Audit Logs from Firestore
  useEffect(() => {
    if (!authUid || !isAdmin) return;

    const fetchAuditLogs = async () => {
      try {
        const q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(100));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AuditLog[];
        setAuditLogs(data);
      } catch (error) {
        console.error('Firestore auditLogs fetch error:', error);
      }
    };
    fetchAuditLogs();
  }, [authUid, isAdmin]);

  // Sync Broadcast Notifications from Firestore in Real-time
  useEffect(() => {
    const q = query(collection(db, 'broadcastNotifications'), orderBy('timestamp', 'desc'), limit(50));
    
    let isInitialLoad = true;

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as BroadcastNotification[];
      setBroadcastNotifications(data);

      if (isInitialLoad) {
        isInitialLoad = false;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const broadcast = change.doc.data() as BroadcastNotification;
          
          toast.custom((t) => (
            <BroadcastToast 
              title={broadcast.title} 
              message={broadcast.message} 
              type={broadcast.type} 
              t={t} 
            />
          ), { duration: 5000 });
          
          setNotifications(prev => {
            const newNotification: Notification = {
              title: broadcast.title,
              message: broadcast.message,
              type: 'offer',
              id: `NT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              timestamp: Date.now(),
              read: false
            };
            return [newNotification, ...prev].slice(0, 50);
          });
        }
      });
    }, (error) => {
      console.error('Firestore broadcastNotifications snapshot error:', error);
    });

    return () => unsubscribe();
  }, []);

  const addNotification = React.useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `NT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: Date.now(),
      read: false
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep last 50
  }, [setNotifications]);

  useEffect(() => {
    if (!authUid || !isAdmin) return;

    const fetchAdmins = async () => {
      try {
        const querySnapshot = await getDocs(query(collection(db, 'admins'), limit(50)));
        const data = querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })) as any as AdminUser[];
        setAdmins(data);
      } catch (error) {
        console.error('Firestore admins fetch error:', error);
      }
    };
    fetchAdmins();
  }, [authUid, isAdmin]);

  // Sync All Users from Firestore (Admin only)
  useEffect(() => {
    if (!authUid || !isAdmin) return;
    if (getIsQuotaExceeded()) return;

    try {
      const q = query(collection(db, 'users'), limit(50));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(data);
      }, (error) => {
        console.error('Firestore users fetch error:', error);
      });
      return () => unsubscribe();
    } catch (e) {
      console.error(e);
    }
  }, [authUid, isAdmin]);

  // Sync Promotion Banners from Firestore with onSnapshot for real-time updates
  useEffect(() => {
    if (getIsQuotaExceeded()) return;

    const q = query(collection(db, 'promotionBanners'), limit(20));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PromotionBanner[];
      // Sort by priority locally as well to ensure consistent UI
      const sortedData = data.sort((a, b) => (b.priority || 0) - (a.priority || 0));
      setPromotionBanners(sortedData);
      setCacheTime('banners');
      localStorage.setItem('sp_banners', JSON.stringify(sortedData));
    }, (error) => {
      if (!error.message?.includes('resource-exhausted')) {
        handleFirestoreError(error, OperationType.LIST, 'promotionBanners');
      }
    });

    return () => unsubscribe();
  }, []);

  // Sync Deals from Firestore
  useEffect(() => {
    const fetchDeals = async () => {
      if (deals.length > 0 && isCacheValid('deals', 3600000)) return;
      try {
        const q = query(collection(db, 'deals'), limit(15));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Deal[];
        setDeals(data);
        setCacheTime('deals');
      } catch (error) {}
    };
    fetchDeals();
  }, []);

  // Sync Bundles from Firestore
  useEffect(() => {
    const fetchBundles = async () => {
      if (bundles.length > 0 && isCacheValid('bundles', 3600000)) return;
      try {
        const q = query(collection(db, 'bundles'), limit(15));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Bundle[];
        setBundles(data);
        setCacheTime('bundles');
      } catch (error) {}
    };
    fetchBundles();
  }, []);

  // Initialize Auth session
  useEffect(() => {
    // Set persistence to LOCAL to keep user logged in across sessions
    setPersistence(auth, browserLocalPersistence).catch(err => handleFirestoreError(err, OperationType.WRITE, 'auth/persistence'));

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("StoreContext: Auth state changed", user ? user.uid : 'null');
      if (user) {
        setAuthUid(user.uid);
        if (user.email) setUserEmail(user.email);
        setIsAuthLoading(false);
      } else {
        setAuthUid(null);
        setUserEmail('');
        // Sign in anonymously if no user is present with retries
        let retryCount = 0;
        const maxRetries = 5;
        
        const attemptSignIn = () => {
          signInAnonymously(auth).then(() => {
            setIsAuthLoading(false);
          }).catch(err => {
            if (err.code === 'auth/network-request-failed' && retryCount < maxRetries) {
              retryCount++;
              const delay = Math.pow(2, retryCount) * 1000;
              console.warn(`Anonymous auth failed (network-error). Retrying in ${delay}ms... (Attempt ${retryCount}/${maxRetries})`);
              setTimeout(attemptSignIn, delay);
            } else {
              setIsAuthLoading(false);
              if (err.code === 'auth/admin-restricted-operation') {
                console.warn("[Firebase] Anonymous authentication is currently disabled in your Firebase/Google Cloud project. Please go to the Firebase Console -> Authentication -> Sign-in method and enable 'Anonymous' to support guest user features with unique identifiers.");
              } else {
                console.error("Anonymous auth failed:", err);
              }
            }
          });
        };
        
        attemptSignIn();
      }
    });

    // Safety timeout: Ensure loading always clears even if Auth is slow/blocked
    const timer = setTimeout(() => {
      setIsAuthLoading(prev => {
        if (prev) {
          console.warn("Auth loading timed out. Unblocking UI.");
          return false;
        }
        return prev;
      });
    }, 5000);

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, [uid]);

  // AUTOMATED SYNC: Keep authToPhone mapping and User document linked to the current Auth UID
  useEffect(() => {
    if (!uid) {
      setIsMappingSynced(true); // Don't block guest listeners if no phone
      return;
    }
    
    if (!authUid) {
      // If auth is finished loading but we still have no UID, ensure we don't block mappings
      if (!isAuthLoading) {
        setIsMappingSynced(true);
      } else {
        setIsMappingSynced(false);
      }
      return;
    }

    const performSync = async () => {
      try {
        console.log("StoreContext: Syncing Auth Mapping", { authUid, uid });
        
        // 1. Sync the primary mapping collection
        await setDoc(doc(db, 'authToPhone', authUid), { 
          phone: uid, 
          updatedAt: serverTimestamp() 
        }, { merge: true });

        // 2. Ensure the user document has the current authUid link
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (userData.authUid !== authUid) {
            await updateDoc(userRef, { 
              authUid: authUid,
              lastActive: serverTimestamp()
            });
          }
        }
        setIsMappingSynced(true);
      } catch (err) {
        console.warn("StoreContext: Sync failed, but proceeding to allow listener attempts:", err);
        setIsMappingSynced(true); // Proceed anyway to avoid blocking UI forever
      }
    };

    performSync();
  }, [authUid, uid]);

  // Verify Admin Status
  useEffect(() => {
    if (!authUid) {
      setIsAdmin(false);
      return;
    }

    // Hardcoded check for initial setup/dev
    const hardcodedAdmins = ['sartawset@gmail.com', 'yelwinaung9981@gmail.com'];
    if (userEmail && hardcodedAdmins.includes(userEmail)) {
      console.log("User email matches hardcoded admin list:", userEmail);
      setIsAdmin(true);
    }

    console.log("Setting up admin snapshot listener for UID:", authUid);
    const unsub = onSnapshot(doc(db, 'admins', authUid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        console.log("Admin document found in Firestore for UID:", authUid, "Permissions:", data.permissions);
        setIsAdmin(true);
      } else if (userEmail && !hardcodedAdmins.includes(userEmail)) {
        console.log("No admin document found and email not in hardcoded list. Revoking admin status.");
        setIsAdmin(false);
      }
    }, (error) => {
      console.error("Error in admin snapshot listener:", error);
      // If quota exceeded, don't necessarily revoke admin status if they were already admin
      if (error.message.includes('resource-exhausted')) {
        console.warn("Quota exceeded while checking admin status. Retaining current status.");
        return;
      }
      // If permission denied, they are likely not an admin
      if (userEmail && !hardcodedAdmins.includes(userEmail)) {
        setIsAdmin(false);
      }
    });

    return () => unsub();
  }, [authUid, userEmail]);

  // Session tracking removed to prevent remote termination issues
  useEffect(() => {
    if (!uid) {
      setSessions([]);
      return;
    }
  }, [uid]);

  const revokeSession = async (sessionId: string) => {
    if (!uid) return;
    if (getIsQuotaExceeded()) {
      toast.error('Daily limit reached. Cannot revoke session.');
      return;
    }
    const t = (key: string) => (translations[language] as any)[key] || key;
    try {
      await deleteDoc(doc(db, 'users', uid, 'sessions', sessionId));
      toast.success(t('sessionRevoked'));
    } catch (error) {
      toast.error(t('failedToRevokeSession'));
      handleFirestoreError(error, OperationType.DELETE, `users/${uid}/sessions/${sessionId}`);
    }
  };

  const logout = async () => {
    try {
      console.log("StoreContext: Logout initiated");
      // Clear data and state immediately for instant feedback
      const currentUid = uid;
      const sid = currentSessionId;
      
      // Perform signOut - this will trigger onAuthStateChanged(null)
      await signOut(auth);
      
      // Background session deletion to avoid blocking UI
      if (currentUid && sid && !getIsQuotaExceeded()) {
        deleteDoc(doc(db, 'users', currentUid, 'sessions', sid)).catch(() => {
          // Ignore background errors
        });
      }
      
      localStorage.removeItem('isAdmin');
      localStorage.removeItem('sp_user_phone');
      localStorage.removeItem('sp_favorites');
      sessionStorage.removeItem('sp_cart');
      
      setAuthUid(null);
      clearUserData();
      setIsProfileLoaded(false);
      lastSyncedUidRef.current = null;
      lookupPhoneMappingRef.current = null;
      sessionStorage.clear();
      
    } catch (error) {
      console.error("Logout error:", error);
      clearUserData();
      setAuthUid(null);
      lastSyncedUidRef.current = null;
      throw error;
    }
  };

  const forceSync = useCallback(async () => {
    if (!uid || getIsQuotaExceeded()) return;
    console.log("StoreContext: Force sync initiated for UID:", uid);
    setIsSyncing(true);
    try {
      const userDocRef = doc(db, 'users', uid);
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const data = snap.data();
        if (data.favorites) {
          const merged = Array.from(new Set([...(data.favorites || []), ...favorites]));
          setFavorites(merged);
          lastSyncedFavoritesRef.current = JSON.stringify(merged);
          localStorage.setItem('sp_favorites', JSON.stringify(merged));
        }
        if (data.cart) {
           // Basic merge
           const mergedCart = [...(data.cart || [])];
           cart.forEach(li => {
             if (!mergedCart.find(mi => mi.id === li.id)) mergedCart.push(li);
           });
           setCart(mergedCart);
           lastSyncedCartRef.current = JSON.stringify(mergedCart);
           sessionStorage.setItem('sp_cart', JSON.stringify(mergedCart));
        }
        if (data.points !== undefined) setPoints(data.points);
        if (data.name) setUserName(data.name);
        toast.success("Account data synced!");
      }
    } catch (err) {
      console.error("Force sync failed:", err);
      toast.error("Sync failed. Please check network.");
    } finally {
      setIsSyncing(false);
      setIsProfileLoaded(true);
    }
  }, [uid, favorites, cart]);

  const updateUserProfile = async (profile: {
    name?: string;
    phone?: string;
    room?: string;
    avatar?: string;
    email?: string;
    birthday?: string;
  }) => {
    if (!uid) return;

    // Update local state
    if (profile.name !== undefined) {
      setUserName(profile.name);
      localStorage.setItem('sp_user_name', profile.name);
    }
    if (profile.phone !== undefined) {
      setUserPhone(profile.phone);
      localStorage.setItem('sp_user_phone', profile.phone);
    }
    if (profile.room !== undefined) {
      setRoomNumber(profile.room);
      localStorage.setItem('sp_room', profile.room);
    }
    if (profile.avatar !== undefined) {
      setUserAvatar(profile.avatar);
      localStorage.setItem('sp_user_avatar', profile.avatar);
    }
    if (profile.email !== undefined) {
      setUserEmail(profile.email);
      localStorage.setItem('sp_user_email', profile.email);
    }
    if (profile.birthday !== undefined) {
      setUserBirthday(profile.birthday);
      localStorage.setItem('sp_user_birthday', profile.birthday);
    }

    // Update Firestore
    if (getIsQuotaExceeded()) {
      toast.error('Daily limit reached. Profile updated locally.');
      return;
    }
    const userDocRef = doc(db, 'users', uid);
    try {
      const updateData: any = {
        ...profile,
        lastActive: serverTimestamp()
      };
      if (authUid) updateData.authUid = authUid;
      
      await updateDoc(userDocRef, updateData);
    } catch (error) {
      console.error("Error updating profile in Firestore:", error);
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  };

  // Sync Orders from Firestore
  useEffect(() => {
    if (!uid) return;
    
    // Always fetch user's personal orders regardless of admin status
    // if mapping isn't fully ready yet, we will just fetch what matches the phone UID
    const userOrdersQuery = query(
      collection(db, 'orders'), 
      where('uid', '==', uid)
    );

    const unsubUserOrders = onSnapshot(userOrdersQuery, (snapshot) => {
      const fetchedOrders = snapshot.docs.map(doc => {
        const data = doc.data();
        let createdAtMillis = Date.now();
        if (data.createdAt) {
          if (typeof data.createdAt.toMillis === 'function') createdAtMillis = data.createdAt.toMillis();
          else if (typeof data.createdAt === 'number') createdAtMillis = data.createdAt;
          else if (typeof data.createdAt === 'string') createdAtMillis = new Date(data.createdAt).getTime();
        } else if (data.timestamp) createdAtMillis = data.timestamp;

        return { ...data, id: doc.id, createdAt: createdAtMillis, timestamp: createdAtMillis };
      }) as Order[];
      
      const validOrders = fetchedOrders.filter(o => o.uid === uid).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      setOrders(validOrders);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'orders'));

    // Admin specific fetch: fetch all orders separately to `adminOrders`
    let unsubAdminOrders = () => {};
    if (isAdmin && isProfileLoaded) {
      const adminOrdersQuery = query(collection(db, 'orders'), orderBy('timestamp', 'desc'), limit(60));
      unsubAdminOrders = onSnapshot(adminOrdersQuery, (snapshot) => {
        const fetchedOrders = snapshot.docs.map(doc => {
          const data = doc.data();
          let createdAtMillis = Date.now();
          if (data.createdAt) {
            if (typeof data.createdAt.toMillis === 'function') createdAtMillis = data.createdAt.toMillis();
            else if (typeof data.createdAt === 'number') createdAtMillis = data.createdAt;
            else if (typeof data.createdAt === 'string') createdAtMillis = new Date(data.createdAt).getTime();
          } else if (data.timestamp) createdAtMillis = data.timestamp;

          return { ...data, id: doc.id, createdAt: createdAtMillis, timestamp: createdAtMillis };
        }) as Order[];
        
        setAdminOrders(fetchedOrders);
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'admin_orders'));
    } else {
      setAdminOrders([]);
    }

    return () => {
      unsubUserOrders();
      unsubAdminOrders();
    };
  }, [uid, isAdmin, isProfileLoaded]);

  const [supportNumber, setSupportNumber] = useState(() => {
    return localStorage.getItem('sp_support_number') || '601128096366';
  });
  const [supportContacts, setSupportContactsState] = useState<SupportContact[]>(() => {
    const saved = localStorage.getItem('sp_support_contacts');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'help', type: 'help', labelEn: 'Help Center', labelMm: 'အကူအညီဗဟိုဌာန', phone: '601128096366' },
      { id: 'support', type: 'general', labelEn: 'General Support', labelMm: 'အထွေထွေ အကူအညီ', phone: '601128096366' },
      { id: 'cancel', type: 'cancellation', labelEn: 'Cancellation Request', labelMm: 'အော်ဒါပယ်ဖျက်ရန်', phone: '601128096366' },
      { id: 'order', type: 'order', labelEn: 'Order Inquiries', labelMm: 'အောဒါမေးမြန်းမှုများ', phone: '601128096366' }
    ];
  });

  const setSupportContacts = async (contacts: SupportContact[]) => {
    setSupportContactsState(contacts);
    localStorage.setItem('sp_support_contacts', JSON.stringify(contacts));
    
    // Also sync to firestore if admin
    if (isAdmin && !getIsQuotaExceeded()) {
      try {
        await setDoc(doc(db, 'settings', 'support'), { contacts }, { merge: true });
      } catch (err) {
        console.error("Failed to sync support contacts:", err);
      }
    }
  };

  useEffect(() => {
    if (isAdmin && !getIsQuotaExceeded()) {
      const unsub = onSnapshot(doc(db, 'settings', 'support'), (snap) => {
        if (snap.exists() && snap.data().contacts) {
          const data = snap.data().contacts;
          setSupportContactsState(data);
          localStorage.setItem('sp_support_contacts', JSON.stringify(data));
        }
      });
      return () => unsub();
    }
  }, [isAdmin]);

  const [shopPhone, setShopPhoneState] = useState(() => {
    return localStorage.getItem('sp_shop_phone') || '+95 9 123 456 789';
  });
  const [shopEmail, setShopEmailState] = useState(() => {
    return localStorage.getItem('sp_shop_email') || 'concierge@sartawset.com';
  });
  const [bankName, setBankName] = useState(() => {
    return localStorage.getItem('sp_bank_name') || 'Maybank';
  });
  const [bankAccountNumber, setBankAccountNumber] = useState(() => {
    return localStorage.getItem('sp_bank_acc_num') || '1234 5678 9012';
  });
  const [bankAccountName, setBankAccountName] = useState(() => {
    return localStorage.getItem('sp_bank_acc_name') || 'SAR TAW SET GROCERY';
  });

  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(() => {
    const saved = localStorage.getItem('sp_email_enabled');
    return saved === null ? true : saved === 'true';
  });
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(() => safeParse(localStorage.getItem('sp_payment_methods'), [
    { id: 'pm-1', type: 'visa', last4: '4242', expiry: '12/26', cardHolder: 'SAR TAW SET', isDefault: true }
  ]));
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('sp_language') || 'en';
    console.log('StoreContext: Initial language:', saved);
    return saved;
  });
  const [currency, setCurrency] = useState<'RM' | 'MMK'>(() => {
    return (localStorage.getItem('sp_currency') as 'RM' | 'MMK') || 'RM';
  });
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('sp_dark_mode') === 'true';
  });

  // Persist notifications to localStorage
  useEffect(() => {
    localStorage.setItem('sp_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Persist settings to localStorage
  useEffect(() => {
    localStorage.setItem('sp_email_enabled', emailNotificationsEnabled.toString());
  }, [emailNotificationsEnabled]);

  useEffect(() => {
    localStorage.setItem('sp_payment_methods', JSON.stringify(paymentMethods));
  }, [paymentMethods]);

  useEffect(() => {
    localStorage.setItem('sp_language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('sp_currency', currency);
  }, [currency]);

  useEffect(() => {
    localStorage.setItem('sp_dark_mode', darkMode.toString());
  }, [darkMode]);
  const [isDeliveryEnabled, setIsDeliveryEnabledState] = useState(true);
  const [deliveryFee, setDeliveryFeeState] = useState(0);
  const [isLowStockAlertEnabled, setIsLowStockAlertEnabledState] = useState(true);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [cutoffTime, setCutoffTimeState] = useState('06:00');
  const [isBankEnabled, setIsBankEnabledState] = useState(true);

  // Sync settings from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'delivery'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setIsDeliveryEnabledState(data.enabled ?? true);
        setDeliveryFeeState(data.deliveryFee ?? 0);
        setIsLowStockAlertEnabledState(data.lowStockAlertsEnabled ?? true);
        setCutoffTimeState(data.cutoffTime ?? '06:00');
        setEstimatedDeliveryTimeState(data.estimatedDeliveryTime ?? '8:00 AM - 10:00 AM');
        setIsBankEnabledState(data.isBankEnabled ?? true);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/delivery');
    });

    const unsubscribeMaintenance = onSnapshot(doc(db, 'settings', 'maintenance'), (snap) => {
      if (snap.exists()) {
        setIsMaintenanceMode(snap.data().isPaused ?? false);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/maintenance');
    });

    const unsubscribeShop = onSnapshot(doc(db, 'settings', 'shop'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.phone) {
          setShopPhoneState(data.phone);
          localStorage.setItem('sp_shop_phone', data.phone);
        }
        if (data.email) {
          setShopEmailState(data.email);
          localStorage.setItem('sp_shop_email', data.email);
        }
      }
    }, (error) => {
      // Don't toast for shop settings fetch errors to avoid noise if doc doesn't exist yet
      console.warn('Firestore shop settings sync error:', error);
    });

    return () => {
      unsubscribe();
      unsubscribeMaintenance();
      unsubscribeShop();
    };
  }, []);

  const setIsDeliveryEnabled = async (enabled: boolean) => {
    if (!authUid) {
      console.error('Cannot update delivery settings: User not authenticated.');
      return;
    }
    if (getIsQuotaExceeded()) {
      toast.error('Daily limit reached. Cannot update settings.');
      return;
    }
    try {
      await setDoc(doc(db, 'settings', 'delivery'), { enabled }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/delivery');
    }
  };

  const setDeliveryFee = async (fee: number) => {
    if (!authUid) return;
    if (getIsQuotaExceeded()) {
      toast.error('Daily limit reached. Cannot update settings.');
      return;
    }
    try {
      await setDoc(doc(db, 'settings', 'delivery'), { deliveryFee: fee }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/delivery');
    }
  };

  const setIsLowStockAlertEnabled = async (enabled: boolean) => {
    if (!authUid) return;
    if (getIsQuotaExceeded()) {
      toast.error('Daily limit reached. Cannot update settings.');
      return;
    }
    try {
      await setDoc(doc(db, 'settings', 'delivery'), { lowStockAlertsEnabled: enabled }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/delivery');
    }
  };

  const setCutoffTime = async (time: string) => {
    if (!authUid) return;
    if (getIsQuotaExceeded()) {
      toast.error('Daily limit reached. Cannot update settings.');
      return;
    }
    try {
      await setDoc(doc(db, 'settings', 'delivery'), { cutoffTime: time }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/delivery');
    }
  };

  const setEstimatedDeliveryTime = async (time: string) => {
    if (!authUid) return;
    if (getIsQuotaExceeded()) {
      toast.error('Daily limit reached. Cannot update settings.');
      return;
    }
    try {
      await setDoc(doc(db, 'settings', 'delivery'), { estimatedDeliveryTime: time }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/delivery');
    }
  };

  const setIsBankEnabled = async (enabled: boolean) => {
    if (!authUid) return;
    if (getIsQuotaExceeded()) {
      toast.error('Daily limit reached. Cannot update settings.');
      return;
    }
    try {
      await setDoc(doc(db, 'settings', 'delivery'), { isBankEnabled: enabled }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/delivery');
    }
  };

  const setShopPhone = async (phone: string) => {
    if (!authUid) return;
    if (getIsQuotaExceeded()) {
      toast.error('Daily limit reached. Cannot update settings.');
      return;
    }
    try {
      await setDoc(doc(db, 'settings', 'shop'), { phone }, { merge: true });
      setShopPhoneState(phone);
      localStorage.setItem('sp_shop_phone', phone);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/shop');
    }
  };

  const setShopEmail = async (email: string) => {
    if (!authUid) return;
    if (getIsQuotaExceeded()) {
      toast.error('Daily limit reached. Cannot update settings.');
      return;
    }
    try {
      await setDoc(doc(db, 'settings', 'shop'), { email }, { merge: true });
      setShopEmailState(email);
      localStorage.setItem('sp_shop_email', email);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/shop');
    }
  };

  const updateMaintenanceMode = async (isPaused: boolean) => {
    if (!authUid) return;
    if (getIsQuotaExceeded()) {
      toast.error('Daily limit reached. Cannot update settings.');
      return;
    }
    try {
      await setDoc(doc(db, 'settings', 'maintenance'), { isPaused }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/maintenance');
    }
  };

  const getDeliveryDate = () => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    
    const [cutoffHour, cutoffMinute] = cutoffTime.split(':').map(Number);
    
    // Cut-off time logic
    const isBeforeMarket = hour < cutoffHour || (hour === cutoffHour && minute < cutoffMinute);
    
    const deliveryDate = new Date();
    if (!isBeforeMarket) {
      deliveryDate.setDate(deliveryDate.getDate() + 1);
    }
    
    const isToday = deliveryDate.toDateString() === now.toDateString();
    
    // Format date in Burmese/English based on language
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
    const dateStr = deliveryDate.toLocaleDateString(language === 'mm' ? 'my-MM' : 'en-US', options);
    
    return { date: dateStr, isToday };
  };

  const addToCart = (item: Omit<CartItem, 'quantity'>) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    const product = products.find(p => p.id === id);
    if (delta > 0 && product && product.isAvailable === false) {
      return;
    }
    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i).filter(i => i.quantity > 0));
  };

  const clearCart = () => {
    setCart([]);
    sessionStorage.removeItem('sp_cart');
  };

  // Persist cart to localStorage and Firestore
  useEffect(() => {
    const cartString = JSON.stringify(cart);
    
    // 1. Local Persistence
    if (cart.length > 0) {
      sessionStorage.setItem('sp_cart', cartString);
    } else {
      sessionStorage.removeItem('sp_cart');
    }

    // 2. Cloud Persistence (Sync up)
    // Only sync if we have a user, profile is fully loaded (to avoid nuking with empty local cart), 
    // and the cart has actually changed since the last sync.
    if (uid && isProfileLoaded && !getIsQuotaExceeded()) {
      if (cartString !== lastSyncedCartRef.current) {
        console.log("StoreContext: Syncing cart UP to Firestore");
        lastSyncedCartRef.current = cartString;
        updateDoc(doc(db, 'users', uid), {
          cart: cart,
          lastActive: serverTimestamp()
        }).catch(err => {
          if (!err.message.includes('resource-exhausted')) {
            console.error("Cart sync up failed:", err);
          }
        });
      }
    }
  }, [cart, uid, isProfileLoaded]);

  const cartTotal = useMemo(() => cart.reduce((acc, item) => acc + (item.price * item.quantity), 0), [cart]);

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const addPaymentMethod = (method: Omit<PaymentMethod, 'id'>) => {
    const newMethod: PaymentMethod = {
      ...method,
      id: `pm-${Date.now()}`,
      isDefault: paymentMethods.length === 0 ? true : method.isDefault
    };
    
    if (newMethod.isDefault) {
      setPaymentMethods(prev => prev.map(pm => ({ ...pm, isDefault: false })).concat(newMethod));
    } else {
      setPaymentMethods(prev => [...prev, newMethod]);
    }
  };

  const removePaymentMethod = (id: string) => {
    setPaymentMethods(prev => {
      const filtered = prev.filter(pm => pm.id !== id);
      if (prev.find(pm => pm.id === id)?.isDefault && filtered.length > 0) {
        filtered[0].isDefault = true;
      }
      return filtered;
    });
  };

  const setDefaultPaymentMethod = (id: string) => {
    setPaymentMethods(prev => prev.map(pm => ({
      ...pm,
      isDefault: pm.id === id
    })));
  };

  const placeOrder = async (details: { 
    name: string; 
    phone: string; 
    room: string; 
    address?: string;
    paymentMethod: string; 
    pointDiscount: number; 
    pointsUsed: number;
    deliveryFee?: number;
    note?: string;
    paymentScreenshot?: string;
  }) => {
    const orderPhoneId = details.phone.replace(/[^0-9]/g, '');
    if (!orderPhoneId) return null;
    
    // Generate a strictly 8-digit numeric order ID
    const orderId = Math.floor(10000000 + Math.random() * 90000000).toString();
    const earnedPoints = Math.floor(cartTotal * 10);
    const { date: deliveryDate, isToday } = getDeliveryDate();
    
    const deliveryCost = details.deliveryFee || 0;

    const orderData = {
      id: orderId,
      uid: orderPhoneId,
      authUid: authUid,
      roomNumber: details.room,
      address: details.address || null,
      items: [...cart],
      total: cartTotal - details.pointDiscount + deliveryCost,
      pointDiscount: details.pointDiscount,
      pointsUsed: details.pointsUsed,
      deliveryFee: deliveryCost,
      earnedPoints: earnedPoints,
      status: 'pending',
      customerName: details.name,
      customerPhone: details.phone,
      paymentMethod: details.paymentMethod,
      paymentScreenshot: details.paymentScreenshot || null,
      deliveryDate,
      deliveryDay: isToday ? 'Today' : 'Tomorrow',
      note: details.note || null,
      createdAt: serverTimestamp(),
      timestamp: Date.now()
    };

    try {
      // 1. Update local state immediately for responsiveness
      if (!userPhone || userPhone !== details.phone) {
        setUserPhone(details.phone);
        localStorage.setItem('sp_user_phone', details.phone);
      }
      if (!userName || userName !== details.name) {
        setUserName(details.name);
        localStorage.setItem('sp_user_name', details.name);
      }
      if (!roomNumber || roomNumber !== details.room) {
        setRoomNumber(details.room);
        localStorage.setItem('sp_room', details.room);
      }

      // Check quota before starting batch
      if (getIsQuotaExceeded()) {
        throw new Error("Firebase Quota Exceeded: The daily limit for orders has been reached. Please try again later or contact support.");
      }
      
      if (isMaintenanceMode) {
        throw new Error("System is currently under maintenance. Please try again later.");
      }

      const batch = writeBatch(db);
      
      // 2. Update/Create User Profile
      const userDocRef = doc(db, 'users', orderPhoneId);
      const userUpdate: any = {
        uid: orderPhoneId,
        name: details.name,
        phone: details.phone,
        room: details.room,
        cart: [], // Clear cart in Firestore
        lastActive: serverTimestamp()
      };
      
      if (authUid) userUpdate.authUid = authUid;
      userUpdate.totalOrders = increment(1);
      if (details.pointsUsed > 0) {
        userUpdate.points = increment(-details.pointsUsed);
      }
      
      batch.set(userDocRef, userUpdate, { merge: true });

      // 3. Create Order
      const orderRef = doc(db, 'orders', orderId);
      batch.set(orderRef, orderData);

      // 4. Update Product Stock (Atomic in the same batch)
      const mergedCartItems = cart.reduce((acc, item) => {
        if (acc[item.id]) {
          acc[item.id].quantity += item.quantity;
        } else {
          acc[item.id] = { ...item };
        }
        return acc;
      }, {} as Record<string, CartItem>);

      Object.values(mergedCartItems).forEach((item: CartItem) => {
        const productRef = doc(db, 'products', item.id);
        batch.set(productRef, {
          stock: increment(-item.quantity)
        }, { merge: true });
      });

      // 5. BACKGROUND SYNC: We don't 'await' the commit to make the UI instant
      // Firestore will handle this write in the background/offline queue
      console.log("StoreContext: Committing order in background for instant UI response");
      batch.commit().catch(error => {
        console.error("Background Order Commit Failed:", error);
        handleFirestoreError(error, OperationType.WRITE, 'batch-order-bg');
        // We might want to notify the user if it's a critical error
        toast.error('Warning: Cloud sync delay. Please ensure you have a stable connection.');
      });

      // 6. IMMEDIATE UI UPDATES
      setCart([]);
      const newOrderForState: Order = {
        ...orderData,
        createdAt: Date.now()
      } as Order;
      setOrders(prev => [newOrderForState, ...prev]);

      const t = (key: string) => (translations[language] as any)[key] || key;
      addNotification({
        title: t('orderSuccessfulTitle'),
        message: t('orderReceivedMsg').replace('{{id}}', orderId),
        type: 'order'
      });

      return orderData;
    } catch (error: any) {
      handleFirestoreError(error, OperationType.WRITE, 'place-order');
      
      // Handle specific permission errors gracefully
      if (error?.message?.includes('permission') || error?.code === 'permission-denied') {
        throw new Error("Permission Denied: If you have an account, please log in. Otherwise, please check your network.");
      }
      
      throw error;
    }
  };

  const updateOrderStatus = async (id: string, status: Order['status']) => {
    if (getIsQuotaExceeded()) {
      toast.error('Daily limit reached. Cannot update order status.');
      return;
    }
    const order = adminOrders.find(o => o.id === id);
    if (!order) return;
    const oldStatus = order.status;
    
    const toastId = toast.loading(`Updating order status to ${status}...`);
    try {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
      setAdminOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
      await updateDoc(doc(db, 'orders', id), { status });
      toast.success(`Order status updated to ${status}`, { id: toastId });
      
      // Stock logic: Return stock if order is cancelled
      if (status === 'cancelled' && oldStatus !== 'cancelled') {
        for (const item of order.items) {
          const productRef = doc(db, 'products', item.id);
          await setDoc(productRef, {
            stock: increment(item.quantity)
          }, { merge: true });
        }
      }
      // Deduct stock if order was cancelled and is now being restored (rare but possible)
      else if (oldStatus === 'cancelled' && status !== 'cancelled') {
        for (const item of order.items) {
          const productRef = doc(db, 'products', item.id);
          await setDoc(productRef, {
            stock: increment(-item.quantity)
          }, { merge: true });
        }
      }

      // Points logic: Add earned points only when marked as 'delivered'
      const earnedPts = order.earnedPoints || 0;
      if (status === 'delivered' && oldStatus !== 'delivered' && order.uid && earnedPts > 0) {
        await setDoc(doc(db, 'users', order.uid), {
          points: increment(earnedPts)
        }, { merge: true });
        
        // Add point transaction record
        const transactionId = `TX-${Date.now()}`;
        await setDoc(doc(db, 'users', order.uid, 'pointTransactions', transactionId), {
          id: transactionId,
          uid: order.uid,
          authUid: authUid,
          type: 'earn',
          amount: earnedPts,
          description: `Order ${id} delivered`,
          createdAt: serverTimestamp()
        });
      } 
      // Revert points if order status changes FROM delivered to something else
      else if (oldStatus === 'delivered' && status !== 'delivered' && order.uid && earnedPts > 0) {
        await setDoc(doc(db, 'users', order.uid), {
          points: increment(-earnedPts)
        }, { merge: true });
        
        const transactionId = `TX-${Date.now()}`;
        await setDoc(doc(db, 'users', order.uid, 'pointTransactions', transactionId), {
          id: transactionId,
          uid: order.uid,
          authUid: authUid,
          type: 'deduct',
          amount: earnedPts,
          description: `Order ${id} points reverted`,
          createdAt: serverTimestamp()
        });
      }

      // Notify User (Simulated via a subcollection in users/{uid}/notifications)
      if (order.uid) {
        const t = (key: string) => (translations[language] as any)[key] || key;
        let title = '';
        let message = '';

        if (status === 'packing') {
          title = t('orderPackingTitle');
          message = t('orderPackingMsg').replace('{{id}}', id);
        } else if (status === 'delivered') {
          title = t('orderDeliveredTitle');
          message = t('orderDeliveredMsg').replace('{{id}}', id);
        } else if (status === 'cancelled') {
          title = t('orderCancelledTitle');
          message = t('orderCancelledMsg').replace('{{id}}', id);
        }

        if (title && message) {
          const notificationId = `NOTIF-${Date.now()}`;
          await setDoc(doc(db, 'users', order.uid, 'notifications', notificationId), {
            id: notificationId,
            title,
            message,
            authUid: authUid,
            type: 'order',
            status: 'unread',
            createdAt: serverTimestamp(),
            orderId: id
          });
        }
      }
      
      // Add status update notification
      const t = (key: string) => (translations[language] as any)[key] || key;
      const statusText = t(`status${status.charAt(0).toUpperCase() + status.slice(1)}`);
      addNotification({
        title: t('orderStatusTitle'),
        message: t('orderStatusMsg').replace('{{id}}', id).replace('{{status}}', statusText),
        type: 'order'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${id}`);
    }
  };

  const cancelOrder = async (id: string) => {
    if (getIsQuotaExceeded()) {
      toast.error('Daily limit reached. Cannot cancel order.');
      return;
    }
    const order = orders.find(o => o.id === id);
    if (!order || order.status === 'cancelled') return;

    try {
      await setDoc(doc(db, 'orders', id), { status: 'cancelled' }, { merge: true });
      
      // If order is cancelled:
      // 1. Refund points used
      if (order.pointsUsed > 0 && order.uid) {
        await setDoc(doc(db, 'users', order.uid), {
          points: increment(order.pointsUsed),
          lastActive: serverTimestamp()
        }, { merge: true });

        // Add refund transaction record
        const transactionId = `TX-REF-${Date.now()}`;
        await setDoc(doc(db, 'users', order.uid, 'pointTransactions', transactionId), {
          id: transactionId,
          uid: order.uid,
          type: 'refund',
          amount: order.pointsUsed,
          description: `Order ${id} cancelled - Points refunded`,
          createdAt: serverTimestamp()
        });
      }
      
      const t = (key: string) => (translations[language] as any)[key] || key;
      addNotification({
        title: t('orderCancelledTitle'),
        message: t('orderCancelledMsg').replace('{{id}}', id),
        type: 'order'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${id}`);
    }
  };

  const reorder = async (order: Order): Promise<{ success: boolean; message?: string }> => {
    try {
      const itemsToAdd: CartItem[] = [];
      const outOfStockItems: string[] = [];

      for (const item of order.items) {
        const product = products.find(p => p.id === item.id);
        if (product && product.stock >= item.quantity) {
          itemsToAdd.push({
            ...item,
            price: product.price // Use current price
          });
        } else {
          outOfStockItems.push(item.name);
        }
      }

      if (itemsToAdd.length === 0) {
        return { 
          success: false, 
          message: language === 'mm' ? 'ပစ္စည်းအားလုံး လက်ကျန်မရှိတော့ပါ။' : 'All items are currently out of stock.' 
        };
      }

      // Add items to cart
      setCart(prev => {
        const newCart = [...prev];
        itemsToAdd.forEach(item => {
          const existing = newCart.find(i => i.id === item.id);
          if (existing) {
            existing.quantity += item.quantity;
          } else {
            newCart.push(item);
          }
        });
        return newCart;
      });

      if (outOfStockItems.length > 0) {
        return { 
          success: true, 
          message: language === 'mm' 
            ? `${outOfStockItems.join(', ')} တို့မှာ လက်ကျန်မရှိတော့သဖြင့် ကျန်ရှိသောပစ္စည်းများကိုသာ Cart ထဲသို့ ထည့်ပေးထားပါသည်။` 
            : `Some items (${outOfStockItems.join(', ')}) are out of stock and were skipped.` 
        };
      }

      return { success: true };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'reorder');
      return { success: false, message: 'An error occurred while reordering.' };
    }
  };

  // Persist points to localStorage
  useEffect(() => {
    localStorage.setItem('sp_points', points.toString());
  }, [points]);

  const toggleFavorite = async (id: string) => {
    setFavorites(prev => {
      const nextFavorites = prev.includes(id) 
        ? prev.filter(fid => fid !== id) 
        : [...prev, id];
        
      const favString = JSON.stringify(nextFavorites);
      localStorage.setItem('sp_favorites', favString);
      return nextFavorites;
    });
  };

  const deleteProduct = useCallback(async (id: string) => {
    if (getIsQuotaExceeded()) {
      toast.error('Daily limit reached. Cannot delete product.');
      return;
    }
    // Optimistic delete from local state
    setProducts(prev => prev.filter(p => p.id !== id));
    
    try {
      await deleteDoc(doc(db, 'products', id));
      toast.success('Product deleted successfully');
      await logAudit('delete_product', 'product', `Deleted product ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
    }
  }, [logAudit]);

  const updateProductStock = async (productId: string, newStock: number) => {
    if (getIsQuotaExceeded()) {
      toast.error('Daily limit reached. Cannot update stock.');
      return;
    }
    try {
      await setDoc(doc(db, 'products', productId), { stock: newStock }, { merge: true });
      await logAudit('update_stock', 'product', `Updated stock for ${productId} to ${newStock}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `products/${productId}`);
    }
  };

  const addCoupon = async (coupon: Omit<Coupon, 'id'>) => {
    if (getIsQuotaExceeded()) {
      toast.error('Daily limit reached. Cannot add coupon.');
      return;
    }
    try {
      await addDoc(collection(db, 'coupons'), { ...coupon, usageCount: 0 });
      await logAudit('add_coupon', 'coupon', `Added coupon ${coupon.code}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'coupons');
    }
  };

  const updateCoupon = async (id: string, coupon: Partial<Coupon>) => {
    if (getIsQuotaExceeded()) {
      toast.error('Daily limit reached. Cannot update coupon.');
      return;
    }

    // Sanitize updates
    const cleanCoupon = Object.entries(coupon).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key as keyof Coupon] = value as any;
      }
      return acc;
    }, {} as any);

    try {
      await updateDoc(doc(db, 'coupons', id), cleanCoupon);
      await logAudit('update_coupon', 'coupon', `Updated coupon ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `coupons/${id}`);
    }
  };

  const deleteCoupon = async (id: string) => {
    if (getIsQuotaExceeded()) {
      toast.error('Daily limit reached. Cannot delete coupon.');
      return;
    }
    try {
      await deleteDoc(doc(db, 'coupons', id));
      await logAudit('delete_coupon', 'coupon', `Deleted coupon ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `coupons/${id}`);
    }
  };

  const refreshAllData = async () => {
    localStorage.removeItem('sp_cache_time_products');
    localStorage.removeItem('sp_cache_time_categories');
    localStorage.removeItem('sp_cache_time_coupons');
    localStorage.removeItem('sp_cache_time_banners');
    localStorage.removeItem('sp_cache_time_deals');
    localStorage.removeItem('sp_cache_time_bundles');
    
    // Trigger effects by navigating back to 'all' or simply re-fetching
    window.location.reload(); // Simplest way to re-trigger all mount effects
  };

  const sendBroadcast = async (notification: Omit<BroadcastNotification, 'id' | 'createdAt'>) => {
    if (getIsQuotaExceeded()) {
      toast.error('Daily limit reached. Cannot send broadcast.');
      return;
    }
    try {
      await addDoc(collection(db, 'broadcastNotifications'), {
        ...notification,
        createdAt: serverTimestamp(),
        timestamp: Date.now()
      });
      addNotification({
        title: notification.title,
        message: notification.message,
        type: 'offer',
      });
      await logAudit('send_broadcast', 'notification', `Sent broadcast: ${notification.title}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'broadcastNotifications');
    }
  };

  const addAdmin = async (admin: Omit<AdminUser, 'createdAt'>) => {
    if (getIsQuotaExceeded()) {
      toast.error('Daily limit reached. Cannot add admin.');
      return;
    }
    try {
      await setDoc(doc(db, 'admins', admin.uid), {
        ...admin,
        createdAt: serverTimestamp()
      });
      await logAudit('add_admin', 'admin', `Added admin ${admin.email}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `admins/${admin.uid}`);
    }
  };

  const createNewAdmin = async (email: string, password: string, name: string, role: AdminUser['role']) => {
    if (getIsQuotaExceeded()) {
      toast.error('Daily limit reached. Cannot create admin.');
      return;
    }
    try {
      const secondaryAuth = getSecondaryAuth();
      const userCredential = await createAuthUser(secondaryAuth, email, password);
      const uid = userCredential.user.uid;

      await setDoc(doc(db, 'admins', uid), {
        uid,
        email,
        name,
        role,
        createdAt: serverTimestamp()
      });
      
      await logAudit('create_admin', 'admin', `Created and added admin ${email}`);
      
      // Sign out from the secondary instance immediately to avoid session confusion
      await secondaryAuth.signOut();
      
      toast.success('Admin user created successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create admin user');
      console.error('Create Admin Error:', error);
    }
  };

  const updateAdminRole = async (uid: string, role: AdminUser['role']) => {
    if (getIsQuotaExceeded()) {
      toast.error('Daily limit reached. Cannot update admin role.');
      return;
    }
    try {
      await updateDoc(doc(db, 'admins', uid), { role });
      await logAudit('update_admin_role', 'admin', `Updated role for ${uid} to ${role}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `admins/${uid}`);
    }
  };

  const removeAdmin = async (uid: string) => {
    if (getIsQuotaExceeded()) {
      toast.error('Daily limit reached. Cannot remove admin.');
      return;
    }
    try {
      await deleteDoc(doc(db, 'admins', uid));
      await logAudit('remove_admin', 'admin', `Removed admin ${uid}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `admins/${uid}`);
    }
  };

  const updateUserPoints = async (uid: string, points: number) => {
    if (getIsQuotaExceeded()) {
      toast.error('Daily limit reached. Cannot update user points.');
      return;
    }
    try {
      await updateDoc(doc(db, 'users', uid), { points });
      await logAudit('update_user_points', 'user', `Updated points for user ${uid} to ${points}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const addProduct = useCallback(async (product: Omit<Product, 'id'>) => {
    if (getIsQuotaExceeded()) {
      toast.error('Daily limit reached. Cannot add product.');
      return;
    }
    
    // Sanitize updates to remove undefined values
    const cleanProduct = Object.entries(product).reduce((acc, [key, value]) => {
      if (value !== undefined) acc[key] = value;
      return acc;
    }, {} as any);

    let productId = (product.name || '').toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    
    // If name is non-latin (like Myanmar), the slug might be empty. Use a random ID in that case.
    if (!productId || productId.length < 2) {
      productId = `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    } else {
      // Add a small random suffix to avoid collisions even with same names
      productId = `${productId}-${Math.random().toString(36).substring(2, 5)}`;
    }
    
    const newProduct = { ...cleanProduct, id: productId };
    
    // Optimistic add
    setProducts(prev => [...prev, newProduct]);
    
    try {
      await setDoc(doc(db, 'products', productId), newProduct);
      await logAudit('add_product', 'product', `Added product ${product.name}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `products/${productId}`);
      // Revert if write fails
      setProducts(prev => prev.filter(p => p.id !== productId));
    }
  }, [logAudit]);

  const updateProduct = useCallback(async (id: string, updates: Partial<Product>) => {
    if (getIsQuotaExceeded()) {
      toast.error('Daily limit reached. Cannot update product.');
      return;
    }
    
    // Sanitize updates to remove undefined values
    const cleanUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key as keyof Product] = value as any;
      }
      return acc;
    }, {} as any);

    // Optimistic update
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...cleanUpdates } : p));

    try {
      await setDoc(doc(db, 'products', id), cleanUpdates, { merge: true });
      await logAudit('update_product', 'product', `Updated product ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `products/${id}`);
      // Revert if update fails
      // TODO: Fetch single doc to revert correctly? For now, we rely on onSnapshot to correct state later
    }
  }, [logAudit]);

  const addPromotionBanner = async (banner: Omit<PromotionBanner, 'id' | 'priority'>) => {
    if (getIsQuotaExceeded()) return;
    try {
      // Auto-calculate priority to make it appear first by default
      // Higher priority = earlier in the list
      const maxPriority = promotionBanners.length > 0 
        ? Math.max(...promotionBanners.map(b => b.priority || 0)) 
        : 0;

      await addDoc(collection(db, 'promotionBanners'), {
        ...banner,
        priority: maxPriority + 1
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'promotionBanners');
    }
  };

  const updatePromotionBanner = async (id: string, banner: Partial<PromotionBanner>) => {
    if (getIsQuotaExceeded()) return;
    
    // Sanitize updates
    const cleanBanner = Object.entries(banner).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key as keyof PromotionBanner] = value as any;
      }
      return acc;
    }, {} as any);

    try {
      await updateDoc(doc(db, 'promotionBanners', id), cleanBanner);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `promotionBanners/${id}`);
    }
  };

  const reorderPromotionBanners = async (reorderedBanners: PromotionBanner[]) => {
    // Update priorities locally
    const updatedBanners = reorderedBanners.map((banner, index) => ({
      ...banner,
      priority: reorderedBanners.length - index // Higher priority for earlier items in the list
    }));
    
    setPromotionBanners(updatedBanners);
    
    try {
      const { writeBatch, doc } = await import('firebase/firestore');
      const batch = writeBatch(db);
      updatedBanners.forEach(banner => {
        batch.update(doc(db, 'promotionBanners', banner.id), { priority: banner.priority });
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'promotionBanners/reorder');
    }
  };

  const deletePromotionBanner = async (id: string) => {
    if (getIsQuotaExceeded()) return;
    try {
      await deleteDoc(doc(db, 'promotionBanners', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `promotionBanners/${id}`);
    }
  };

  const addDeal = async (deal: Omit<Deal, 'id'>) => {
    if (getIsQuotaExceeded()) return;
    try {
      await addDoc(collection(db, 'deals'), deal);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'deals');
    }
  };

  const updateDeal = async (id: string, deal: Partial<Deal>) => {
    if (getIsQuotaExceeded()) return;
    
    // Sanitize updates
    const cleanDeal = Object.entries(deal).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key as keyof Deal] = value as any;
      }
      return acc;
    }, {} as any);
    
    try {
      await updateDoc(doc(db, 'deals', id), cleanDeal);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `deals/${id}`);
    }
  };

  const deleteDeal = async (id: string) => {
    if (getIsQuotaExceeded()) return;
    try {
      await deleteDoc(doc(db, 'deals', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `deals/${id}`);
    }
  };

  const addBundle = async (bundle: Omit<Bundle, 'id'>) => {
    if (getIsQuotaExceeded()) return;
    try {
      await addDoc(collection(db, 'bundles'), bundle);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'bundles');
    }
  };

  const updateBundle = async (id: string, bundle: Partial<Bundle>) => {
    if (getIsQuotaExceeded()) return;
    
    // Sanitize updates
    const cleanBundle = Object.entries(bundle).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key as keyof Bundle] = value as any;
      }
      return acc;
    }, {} as any);

    try {
      await updateDoc(doc(db, 'bundles', id), cleanBundle);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `bundles/${id}`);
    }
  };

  const deleteBundle = async (id: string) => {
    if (getIsQuotaExceeded()) return;
    try {
      await deleteDoc(doc(db, 'bundles', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `bundles/${id}`);
    }
  };

  const addAddress = async (address: Omit<Address, 'id'>) => {
    if (!uid) return;
    if (getIsQuotaExceeded()) {
      toast.error('Daily limit reached. Your changes will be saved locally but may not sync to the cloud until tomorrow.');
      return;
    }
    const addressId = `addr-${Date.now()}`;
    const newAddress = { ...address, id: addressId, authUid: authUid } as Address;
    
    // Optimistic Update
    const previousAddresses = [...addresses];
    let updatedAddresses = [...addresses];
    
    if (newAddress.isDefault) {
      updatedAddresses = updatedAddresses.map(a => ({ ...a, isDefault: false }));
    } else if (addresses.length === 0) {
      newAddress.isDefault = true;
    }
    
    setAddresses([...updatedAddresses, newAddress]);

    try {
      const batch = writeBatch(db);
      
      if (newAddress.isDefault) {
        previousAddresses.forEach(a => {
          if (a.isDefault) {
            batch.update(doc(db, 'users', uid, 'addresses', a.id), { isDefault: false });
          }
        });
      }

      batch.set(doc(db, 'users', uid, 'addresses', addressId), newAddress);
      await batch.commit();
      
      toast.success(translations[language === 'mm' ? 'mm' : 'en'].addressSaved || 'Address saved successfully');
    } catch (error: any) {
      setAddresses(previousAddresses); // Rollback
      
      const isPermissionError = error?.message?.includes('permission') || error?.code === 'permission-denied';
      const t = (key: string) => (translations[language] as any)[key] || key;
      
      if (isPermissionError) {
        toast.error(t('errorAddingAddress') + ': Permission Denied. If you have an account, please log in.');
      } else {
        toast.error(t('errorAddingAddress') || 'Failed to save address. Please try again.');
      }
      
      handleFirestoreError(error, OperationType.WRITE, `users/${uid}/addresses/${addressId}`);
    }
  };

  const updateAddress = async (id: string, address: Partial<Address>) => {
    if (!uid) return;
    if (getIsQuotaExceeded()) {
      toast.error('Daily limit reached. Your changes will be saved locally but may not sync to the cloud until tomorrow.');
      return;
    }
    
    // Optimistic Update
    const previousAddresses = [...addresses];
    let updatedAddresses = addresses.map(a => {
      if (a.id === id) return { ...a, ...address };
      if (address.isDefault && a.isDefault) return { ...a, isDefault: false };
      return a;
    });
    
    setAddresses(updatedAddresses);

    try {
      const batch = writeBatch(db);
      
      if (address.isDefault) {
        previousAddresses.forEach(a => {
          if (a.isDefault && a.id !== id) {
            batch.update(doc(db, 'users', uid, 'addresses', a.id), { isDefault: false });
          }
        });
      }
      
      batch.update(doc(db, 'users', uid, 'addresses', id), address);
      await batch.commit();
      
      toast.success(translations[language === 'mm' ? 'mm' : 'en'].addressUpdated || 'Address updated successfully');
    } catch (error: any) {
      setAddresses(previousAddresses); // Rollback
      
      const isPermissionError = error?.message?.includes('permission') || error?.code === 'permission-denied';
      const t = (key: string) => (translations[language] as any)[key] || key;
      
      if (isPermissionError) {
        toast.error(t('errorUpdatingAddress') + ': Permission Denied. If you have an account, please log in.');
      } else {
        toast.error(t('errorUpdatingAddress') || 'Failed to update address.');
      }
      
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}/addresses/${id}`);
    }
  };

  const removeAddress = async (id: string) => {
    if (!uid) return;
    if (getIsQuotaExceeded()) {
      toast.error('Daily limit reached. Your changes will be saved locally but may not sync to the cloud until tomorrow.');
      return;
    }
    
    // Optimistic Update
    const previousAddresses = [...addresses];
    const deletedAddress = addresses.find(a => a.id === id);
    let updatedAddresses = addresses.filter(a => a.id !== id);
    
    if (deletedAddress?.isDefault && updatedAddresses.length > 0) {
      updatedAddresses[0].isDefault = true;
    }
    
    setAddresses(updatedAddresses);
    if (selectedAddressId === id) {
      setSelectedAddressId(updatedAddresses.length > 0 ? updatedAddresses[0].id : null);
    }

    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, 'users', uid, 'addresses', id));
      
      if (deletedAddress?.isDefault && updatedAddresses.length > 0) {
        batch.update(doc(db, 'users', uid, 'addresses', updatedAddresses[0].id), { isDefault: true });
      }
      
      await batch.commit();
      toast.success(translations[language === 'mm' ? 'mm' : 'en'].addressDeleted || 'Address deleted successfully');
    } catch (error) {
      setAddresses(previousAddresses); // Rollback
      toast.error('Failed to delete address.');
      handleFirestoreError(error, OperationType.DELETE, `users/${uid}/addresses/${id}`);
    }
  };

  const setDefaultAddress = async (id: string) => {
    if (!uid) return;
    if (getIsQuotaExceeded()) {
      toast.error('Daily limit reached. Cannot set default address.');
      return;
    }

    const previousAddresses = [...addresses];
    const updatedAddresses = addresses.map(a => ({
      ...a,
      isDefault: a.id === id
    }));
    setAddresses(updatedAddresses);

    try {
      const batch = writeBatch(db);
      addresses.forEach(a => {
        if (a.isDefault && a.id !== id) {
          batch.update(doc(db, 'users', uid, 'addresses', a.id), { isDefault: false });
        }
        if (a.id === id && !a.isDefault) {
          batch.update(doc(db, 'users', uid, 'addresses', a.id), { isDefault: true });
        }
      });
      await batch.commit();
    } catch (error) {
      setAddresses(previousAddresses);
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}/addresses`);
    }
  };

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Google Sign In Error:', error);
      toast.error('Google Sign In Failed');
    }
  };

  const t = useCallback((key: string) => {
    if (!translations) return key;
    return translations[language]?.[key] || translations['en']?.[key] || key;
  }, [language]);

  const formatPrice = useCallback((price: number) => {
    const safePrice = Number(price) || 0;
    if (currency === 'RM') {
      return `RM ${safePrice.toFixed(2)}`;
    }
    return `${safePrice.toLocaleString()} Ks`;
  }, [currency]);

  const getCategoryName = useCallback((categoryId: string) => {
    const cat = (categories || []).find(c => c.id === categoryId || c.key === categoryId);
    if (!cat) return categoryId;
    
    if (language === 'my' && cat.nameMm) return cat.nameMm;
    if (language === 'ms' && cat.nameMs) return cat.nameMs;
    if (language === 'th' && cat.nameTh) return cat.nameTh;
    if (language === 'zh' && cat.nameZh) return cat.nameZh;
    if (cat.nameEn) return cat.nameEn;
    return cat.key ? t(cat.key) : cat.name;
  }, [categories, language, t]);

  const getMainName = useCallback((item: any) => {
    return item.name || item.title || '';
  }, []);

  const getSecondaryName = useCallback((item: any) => {
    const en = item.name || item.title || '';
    const mm = item.mmName || item.titleMm || '';
    const ms = item.msName || '';
    const th = item.thName || '';
    const zh = item.zhName || '';

    switch (language) {
      case 'en':
        return mm || en;
      case 'my':
      case 'mm':
        return mm || en;
      case 'th':
        return th || mm || en;
      case 'zh':
        return zh || mm || en;
      case 'ms':
        return ms || mm || en;
      default:
        return mm || en;
    }
  }, [language]);

  const getLocalizedName = useCallback((item: any) => {
    switch (language) {
      case 'ms':
        return item.msName || item.mmName;
      case 'th':
        return item.thName || item.mmName;
      case 'zh':
        return item.zhName || item.mmName;
      case 'en':
        return item.name || item.title || item.mmName;
      case 'my':
      default:
        return item.mmName;
    }
  }, [language]);

  const value = useMemo(() => ({
    cart, 
      addToCart, 
      updateQuantity, 
      clearCart,
      cartTotal, 
      userName,
      setUserName,
      userPhone,
      setUserPhone,
      roomNumber, 
      setRoomNumber, 
      orders,
      adminOrders,
      supportNumber,
      setSupportNumber,
      supportContacts,
      setSupportContacts,
      bankName,
      setBankName,
      bankAccountNumber,
      setBankAccountNumber,
      bankAccountName,
      setBankAccountName,
      userAvatar,
      setUserAvatar,
      userEmail,
      setUserEmail,
      userBirthday,
      setUserBirthday,
      updateUserProfile,
      placeOrder, 
      updateOrderStatus,
      cancelOrder,
      reorder,
      favorites,
      toggleFavorite,
      notifications,
      addNotification,
      markNotificationAsRead,
      clearNotifications,
      emailNotificationsEnabled,
      setEmailNotificationsEnabled,
      paymentMethods,
      addPaymentMethod,
      removePaymentMethod,
      setDefaultPaymentMethod,
      points,
      setPoints,
      language,
      setLanguage,
      currency,
      setCurrency,
      formatPrice,
      getCategoryName,
      getMainName,
      getSecondaryName,
      getLocalizedName,
      t,
      darkMode,
      setDarkMode,
    isDeliveryEnabled,
    setIsDeliveryEnabled,
    deliveryFee,
    setDeliveryFee,
    isLowStockAlertEnabled,
    setIsLowStockAlertEnabled,
    isMaintenanceMode,
    updateMaintenanceMode,
    cutoffTime,
    setCutoffTime,
    estimatedDeliveryTime,
    setEstimatedDeliveryTime,
    shopPhone,
    setShopPhone,
    shopEmail,
    setShopEmail,
    isBankEnabled,
    setIsBankEnabled,
    getDeliveryDate,
    logout,
    forceSync,
    isSyncing,
    isProfileLoaded,
    uid,
    authUid,
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    addresses,
    addAddress,
    updateAddress,
    removeAddress,
    setDefaultAddress,
    selectedAddressId,
    setSelectedAddressId,
    categories,
    updateCategory,
    addCategory,
    deleteCategory,
    promotionBanners,
    deals,
    bundles,
    addPromotionBanner,
    updatePromotionBanner,
    deletePromotionBanner,
    reorderPromotionBanners,
    addDeal,
    updateDeal,
    deleteDeal,
    addBundle,
    updateBundle,
    deleteBundle,
    updateProductStock,
    coupons,
    addCoupon,
    updateCoupon,
    deleteCoupon,
    auditLogs,
    logAudit,
    broadcastNotifications,
    sendBroadcast,
    admins,
    addAdmin,
    createNewAdmin,
    updateAdminRole,
    removeAdmin,
    users,
    updateUserPoints,
    isAdmin,
    isAuthLoading,
    isQuotaExceeded,
    resetQuotaExceeded,
    refreshAllData,
    signInWithGoogle,
    deviceId,
    sessions,
    revokeSession,
    isBlocked,
    blockMessage,
    totalOrders,
    serviceAreas,
    addServiceArea,
    updateServiceArea,
    deleteServiceArea,
    settings,
    updateSettings
  }), [
    cart,
    userName,
    userPhone,
    roomNumber,
    orders,
    adminOrders,
    supportNumber,
    supportContacts,
    bankName,
    bankAccountNumber,
    bankAccountName,
    userAvatar,
    userEmail,
    userBirthday,
    favorites,
    notifications,
    emailNotificationsEnabled,
    paymentMethods,
    points,
    language,
    currency,
    darkMode,
    isDeliveryEnabled,
    deliveryFee,
    isLowStockAlertEnabled,
    isMaintenanceMode,
    cutoffTime,
    estimatedDeliveryTime,
    shopPhone,
    shopEmail,
    isBankEnabled,
    isSyncing,
    isProfileLoaded,
    uid,
    authUid,
    products,
    addresses,
    selectedAddressId,
    categories,
    promotionBanners,
    deals,
    bundles,
    coupons,
    auditLogs,
    reorderPromotionBanners,
    broadcastNotifications,
    admins,
    users,
    isAdmin,
    isAuthLoading,
    isQuotaExceeded,
    deviceId,
    sessions,
    isBlocked,
    blockMessage,
    totalOrders,
    serviceAreas,
    settings,
    updateSettings,
    addProduct,
    updateProduct,
    deleteProduct,
    logAudit
  ]);

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within a StoreProvider');
  return context;
};
