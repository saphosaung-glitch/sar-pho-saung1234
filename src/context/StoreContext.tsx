import React, { createContext, useContext, useState, useMemo, useEffect, useRef } from 'react';
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
import { auth, db, handleFirestoreError, OperationType, getIsQuotaExceeded, onQuotaExceededChange, resetQuotaExceeded as resetQuota, signInAnonymously } from '../lib/firebase';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, setPersistence, browserLocalPersistence, signOut } from 'firebase/auth';
import { Address } from '../types';

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
  pointsUsed: number;
  earnedPoints: number;
  status: 'pending' | 'packing' | 'delivered' | 'cancelled';
  paymentMethod: string;
  address?: string;
  deliveryDate?: string;
  deliveryDay?: string;
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
  isActive: boolean;
  order: number;
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
  supportNumber: string;
  setSupportNumber: (num: string) => void;
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
  getMainName: (item: { name: string; mmName: string; msName?: string; thName?: string; zhName?: string }) => string;
  getSecondaryName: (item: { name: string; mmName: string; msName?: string; thName?: string; zhName?: string }) => string;
  getLocalizedName: (item: { mmName: string; msName?: string; thName?: string; zhName?: string }) => string;
  t: (key: string) => string;
  darkMode: boolean;
  setDarkMode: (enabled: boolean) => void;
  isDeliveryEnabled: boolean;
  setIsDeliveryEnabled: (enabled: boolean) => Promise<void>;
  isLowStockAlertEnabled: boolean;
  setIsLowStockAlertEnabled: (enabled: boolean) => Promise<void>;
  cutoffTime: string;
  setCutoffTime: (time: string) => Promise<void>;
  getDeliveryDate: () => { date: string; isToday: boolean };
  signInWithGoogle: () => Promise<void>;
  logout: () => void;
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
  addPromotionBanner: (banner: Omit<PromotionBanner, 'id'>) => Promise<void>;
  updatePromotionBanner: (id: string, banner: Partial<PromotionBanner>) => Promise<void>;
  deletePromotionBanner: (id: string) => Promise<void>;
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
  updateAdminRole: (uid: string, role: AdminUser['role']) => Promise<void>;
  removeAdmin: (uid: string) => Promise<void>;
  users: any[];
  updateUserPoints: (uid: string, points: number) => Promise<void>;
  isAdmin: boolean;
  isAuthLoading: boolean;
  isProfileLoaded: boolean;
  isQuotaExceeded: boolean;
  resetQuotaExceeded: () => void;
  sessions: Session[];
  revokeSession: (sessionId: string) => Promise<void>;
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
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('sp_cart');
    return saved ? JSON.parse(saved) : [];
  });

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
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('sp_orders');
    return saved ? JSON.parse(saved) : [];
  });
  const [estimatedDeliveryTime, setEstimatedDeliveryTimeState] = useState('8:00 AM - 10:00 AM');
  const [points, setPoints] = useState(() => {
    const saved = localStorage.getItem('sp_points');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [products, setProducts] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressIdState] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [promotionBanners, setPromotionBanners] = useState<PromotionBanner[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [broadcastNotifications, setBroadcastNotifications] = useState<BroadcastNotification[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(getIsQuotaExceeded());

  const resetQuotaExceeded = () => {
    resetQuota();
    setIsQuotaExceeded(false);
  };

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

  const lastSyncedCartRef = useRef<string>('');

  // Sync Cart with Firestore
  useEffect(() => {
    if (!uid) return;
    const userDocRef = doc(db, 'users', uid);
    
    // Always try to load from Firestore when UID is available
    const unsubscribe = onSnapshot(userDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.cart) {
          const cartString = JSON.stringify(data.cart);
          if (cartString !== lastSyncedCartRef.current) {
            lastSyncedCartRef.current = cartString;
            setCart(data.cart);
          }
        }
      }
    }, (error) => {
      console.error("Firestore cart sync error:", error);
    });

    return () => unsubscribe();
  }, [uid]);

  // Sync Cart changes to Firestore with debounce
  useEffect(() => {
    if (!uid || getIsQuotaExceeded()) return;
    
    const cartString = JSON.stringify(cart);
    if (cartString === lastSyncedCartRef.current) return;

    const timeoutId = setTimeout(async () => {
      try {
        await updateDoc(doc(db, 'users', uid), { 
          cart,
          lastUpdated: Date.now()
        });
        lastSyncedCartRef.current = cartString;
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${uid}/cart`);
      }
    }, 2000); // 2 second debounce

    return () => clearTimeout(timeoutId);
  }, [cart, uid]);

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

  // Persist points to localStorage
  useEffect(() => {
    localStorage.setItem('sp_points', points.toString());
  }, [points]);

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

  // Sync categories from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'categories'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Category[];
      setCategories(data.sort((a, b) => a.order - b.order));
    }, (error) => {
      console.error('Firestore categories sync error:', error);
    });
    return () => unsubscribe();
  }, [isAdmin]);

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    try {
      await updateDoc(doc(db, 'categories', id), updates);
      toast.success('Category updated');
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Failed to update category');
    }
  };

  const addCategory = async (category: Omit<Category, 'id'>) => {
    try {
      const id = category.key.toLowerCase().replace(/[^a-z0-9]/g, '-');
      await setDoc(doc(db, 'categories', id), { ...category, id });
      toast.success('Category added');
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error('Failed to add category');
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'categories', id));
      toast.success('Category deleted');
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    }
  };

  // Sync products from Firestore
  useEffect(() => {
    let isSeeding = false;
    const unsubscribe = onSnapshot(collection(db, 'products'), (querySnapshot) => {
      const productsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(productsData);
      
      // Auto-seed only if the collection is completely empty
      if (querySnapshot.empty && isAdmin && !isSeeding) {
        isSeeding = true;
        import('../lib/seed').then(({ seedDatabase }) => {
          seedDatabase().then(() => {
            isSeeding = false;
          }).catch(err => {
            console.error('Auto-seed failed:', err);
            isSeeding = false;
          });
        });
      }
    }, (error) => {
      console.error('Firestore products sync error:', error);
      // Don't throw to keep the app stable with cached data
    });
    return () => unsubscribe();
  }, [isAdmin]);

  // Sync Coupons from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'coupons'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Coupon[];
      setCoupons(data);
    }, (error) => {
      console.error('Firestore coupons sync error:', error);
    });
    return () => unsubscribe();
  }, []);

  // Sync Audit Logs from Firestore
  useEffect(() => {
    if (!authUid || !isAdmin) return;

    const q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AuditLog[];
      setAuditLogs(data);
    }, (error) => {
      console.error('Firestore auditLogs sync error:', error);
    });
    return () => unsubscribe();
  }, [authUid, isAdmin]);

  // Sync Broadcast Notifications from Firestore
  useEffect(() => {
    const q = query(collection(db, 'broadcastNotifications'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any as BroadcastNotification[];
      setBroadcastNotifications(data);
    }, (error) => {
      console.error('Firestore broadcastNotifications sync error:', error);
    });
    return () => unsubscribe();
  }, []);

  // Sync Admins from Firestore
  useEffect(() => {
    if (!authUid || !isAdmin) return;

    const unsubscribe = onSnapshot(collection(db, 'admins'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })) as any as AdminUser[];
      setAdmins(data);
    }, (error) => {
      console.error('Firestore admins sync error:', error);
    });
    return () => unsubscribe();
  }, [authUid, isAdmin]);

  // Sync All Users from Firestore (Admin only)
  useEffect(() => {
    if (!authUid || !isAdmin) return;

    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(data);
    }, (error) => {
      console.error('Firestore users sync error:', error);
    });
    return () => unsubscribe();
  }, [authUid, isAdmin]);

  // Sync Promotion Banners from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'promotionBanners'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PromotionBanner[];
      setPromotionBanners(data);
    }, (error) => {
      console.error('Firestore promotionBanners sync error:', error);
    });
    return () => unsubscribe();
  }, []);

  // Sync Deals from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'deals'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Deal[];
      setDeals(data);
    }, (error) => {
      console.error('Firestore deals sync error:', error);
    });
    return () => unsubscribe();
  }, []);

  // Sync Bundles from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'bundles'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Bundle[];
      setBundles(data);
    }, (error) => {
      console.error('Firestore bundles sync error:', error);
    });
    return () => unsubscribe();
  }, []);

  // Initialize Auth session
  useEffect(() => {
    // Set persistence to LOCAL to keep user logged in across sessions
    setPersistence(auth, browserLocalPersistence).catch(console.error);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthUid(user.uid);
        if (user.email) setUserEmail(user.email);
      } else {
        setAuthUid(null);
        setUserEmail('');
        // Sign in anonymously if no user is present to ensure we have a UID for Firestore rules
        signInAnonymously(auth).catch(err => {
          if (err.code === 'auth/admin-restricted-operation') {
            console.warn("Anonymous auth is disabled in Firebase Console. Please enable it to allow guest users to save data.");
          } else {
            console.error("Anonymous sign-in failed:", err);
          }
        });
      }
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Verify Admin Status
  useEffect(() => {
    if (!authUid) {
      setIsAdmin(false);
      return;
    }

    // Hardcoded check for initial setup/dev
    const hardcodedAdmins = ['saphosaung@gmail.com', 'yelwinaung9981@gmail.com'];
    if (userEmail && hardcodedAdmins.includes(userEmail)) {
      console.log("User email matches hardcoded admin list:", userEmail);
      setIsAdmin(true);
    }

    console.log("Setting up admin snapshot listener for UID:", authUid);
    const unsub = onSnapshot(doc(db, 'admins', authUid), (snap) => {
      if (snap.exists()) {
        console.log("Admin document found in Firestore for UID:", authUid);
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

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Google Sign-in error:", error);
    }
  };

  // Session tracking removed to prevent remote termination issues
  useEffect(() => {
    if (!uid) {
      setSessions([]);
      return;
    }
  }, [uid]);

  const revokeSession = async (sessionId: string) => {
    if (!uid) return;
    const t = (key: string) => (translations[language] as any)[key] || key;
    try {
      await deleteDoc(doc(db, 'users', uid, 'sessions', sessionId));
      toast.success(t('sessionRevoked'));
    } catch (error) {
      console.error("Error revoking session:", error);
      toast.error(t('failedToRevokeSession'));
    }
  };

  const logout = async () => {
    try {
      if (authUid && currentSessionId) {
        await deleteDoc(doc(db, 'users', authUid, 'sessions', currentSessionId)).catch(console.error);
      }
      await signOut(auth);
      setAuthUid(null);
      setUserName('');
      setUserPhone('');
      setRoomNumber('');
      setPoints(0);
      setUserAvatar('');
      setUserEmail('');
      setUserBirthday('');
      setOrders([]);
      setCart([]);
      setIsProfileLoaded(false);
      localStorage.clear();
      sessionStorage.clear();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

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

  // Sync User Profile with Firestore using Phone Number as ID
  useEffect(() => {
    if (!uid || !authUid) {
      if (uid && !authUid) {
        console.warn("Profile sync waiting for authUid...");
      }
      setIsProfileLoaded(true);
      return;
    }

    setIsProfileLoaded(false);
    const userDocRef = doc(db, 'users', uid);
    let unsubscribe: Unsubscribe | null = null;

    const setupSync = async () => {
      try {
        const docSnap = await getDoc(userDocRef);
        if (!docSnap.exists()) {
          // Create initial profile if it doesn't exist
          await setDoc(userDocRef, {
            uid: uid, // Use phone-based UID
            authUid: authUid || null, // Link to Firebase Auth UID if available
            name: userName,
            phone: userPhone,
            room: roomNumber,
            avatar: userAvatar,
            email: userEmail,
            birthday: userBirthday,
            points: 0,
            tier: 'Bronze',
            favorites: favorites,
            lastActive: serverTimestamp()
          }, { merge: true });
        } else {
          // Update last active and ensure authUid is linked if available
          const data = docSnap.data();
          const firestoreFavorites = data.favorites || [];
          // Merge local favorites with firestore favorites
          const mergedFavorites = Array.from(new Set([...firestoreFavorites, ...favorites]));
          
          const updateData: any = {
            favorites: mergedFavorites,
            name: userName || data.name // Auto-update name if a new one is provided
          };
          if (authUid) updateData.authUid = authUid;
          
          // Only update if favorites or authUid changed
          const hasChanges = JSON.stringify(mergedFavorites) !== JSON.stringify(firestoreFavorites) || (authUid && data.authUid !== authUid);
          if (hasChanges && !getIsQuotaExceeded()) {
            await updateDoc(userDocRef, updateData).catch(() => {});
          }
        }

        unsubscribe = onSnapshot(userDocRef, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setPoints(data.points || 0);
            // Sync back to local state from Firestore
            if (data.name) {
              setUserName(data.name);
              localStorage.setItem('sp_user_name', data.name);
            }
            if (data.phone) {
              setUserPhone(data.phone);
              localStorage.setItem('sp_user_phone', data.phone);
            }
            if (data.room) {
              setRoomNumber(data.room);
              localStorage.setItem('sp_room', data.room);
            }
            if (data.avatar) {
              setUserAvatar(data.avatar);
              localStorage.setItem('sp_user_avatar', data.avatar);
            }
            if (data.email) {
              setUserEmail(data.email);
              localStorage.setItem('sp_user_email', data.email);
            }
            if (data.birthday) {
              setUserBirthday(data.birthday);
              localStorage.setItem('sp_user_birthday', data.birthday);
            }
            if (data.favorites) {
              setFavorites(data.favorites);
            }
          }
          setIsProfileLoaded(true);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${uid}`);
          setIsProfileLoaded(true);
        });
      } catch (error) {
        console.error("Profile sync error:", error);
      }
    };

    setupSync();

    // Sync Addresses from Firestore
    const addressesRef = collection(db, 'users', uid, 'addresses');
    const unsubscribeAddresses = onSnapshot(addressesRef, (snapshot) => {
      const fetchedAddresses = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Address[];
      setAddresses(fetchedAddresses);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${uid}/addresses`);
    });

    return () => {
      if (unsubscribe) unsubscribe();
      unsubscribeAddresses();
    };
  }, [uid, authUid]);

  // Sync Orders from Firestore
  useEffect(() => {
    if (!uid) return;

    // If admin, show all orders. If user, show only their orders based on phone UID.
    let ordersQuery;
    if (isAdmin) {
      ordersQuery = query(collection(db, 'orders'));
    } else {
      ordersQuery = query(
        collection(db, 'orders'), 
        where('uid', '==', uid)
      );
    }

    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      const fetchedOrders = snapshot.docs.map(doc => {
        const data = doc.data();
        let createdAtMillis = Date.now();
        
        if (data.createdAt) {
          if (typeof data.createdAt.toMillis === 'function') {
            createdAtMillis = data.createdAt.toMillis();
          } else if (typeof data.createdAt === 'number') {
            createdAtMillis = data.createdAt;
          } else if (typeof data.createdAt === 'string') {
            createdAtMillis = new Date(data.createdAt).getTime();
          }
        } else if (data.timestamp) {
          createdAtMillis = data.timestamp;
        }

        return {
          ...data,
          id: doc.id,
          createdAt: createdAtMillis,
          timestamp: createdAtMillis
        };
      }) as Order[];
      
      setOrders(prevOrders => {
        // Keep local orders that don't have an authUid (guest orders)
        const guestOrders = prevOrders.filter(o => !o.authUid);
        // Merge and remove duplicates by ID
        const allOrders = [...fetchedOrders, ...guestOrders];
        const uniqueOrders = Array.from(new Map(allOrders.map(o => [o.id, o])).values());
        // Sort by timestamp descending (newest first) for the state
        return uniqueOrders.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    });

    return () => unsubscribe();
  }, [uid, authUid, isAdmin]);

  const [supportNumber, setSupportNumber] = useState(() => {
    return localStorage.getItem('sp_support_number') || '601128096366';
  });
  const [bankName, setBankName] = useState(() => {
    return localStorage.getItem('sp_bank_name') || 'Maybank';
  });
  const [bankAccountNumber, setBankAccountNumber] = useState(() => {
    return localStorage.getItem('sp_bank_acc_num') || '1234 5678 9012';
  });
  const [bankAccountName, setBankAccountName] = useState(() => {
    return localStorage.getItem('sp_bank_acc_name') || 'SAPHOSAUNG GROCERY';
  });
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('sp_favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('sp_notifications');
    return saved ? JSON.parse(saved) : [];
  });
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(() => {
    const saved = localStorage.getItem('sp_email_enabled');
    return saved === null ? true : saved === 'true';
  });
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(() => {
    const saved = localStorage.getItem('sp_payment_methods');
    return saved ? JSON.parse(saved) : [
      { id: 'pm-1', type: 'visa', last4: '4242', expiry: '12/26', cardHolder: 'SAPHOSAUNG', isDefault: true }
    ];
  });
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

  // Persist favorites to localStorage
  useEffect(() => {
    localStorage.setItem('sp_favorites', JSON.stringify(favorites));
  }, [favorites]);

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
  const [isLowStockAlertEnabled, setIsLowStockAlertEnabledState] = useState(true);
  const [cutoffTime, setCutoffTimeState] = useState('06:00');

  // Sync settings from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'delivery'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setIsDeliveryEnabledState(data.enabled ?? true);
        setIsLowStockAlertEnabledState(data.lowStockAlertsEnabled ?? true);
        setCutoffTimeState(data.cutoffTime ?? '06:00');
        setEstimatedDeliveryTimeState(data.estimatedDeliveryTime ?? '8:00 AM - 10:00 AM');
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/delivery');
    });
    return () => unsubscribe();
  }, []);

  const setIsDeliveryEnabled = async (enabled: boolean) => {
    if (!authUid) {
      console.error('Cannot update delivery settings: User not authenticated.');
      return;
    }
    try {
      await setDoc(doc(db, 'settings', 'delivery'), { enabled }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/delivery');
    }
  };

  const setIsLowStockAlertEnabled = async (enabled: boolean) => {
    if (!authUid) return;
    try {
      await setDoc(doc(db, 'settings', 'delivery'), { lowStockAlertsEnabled: enabled }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/delivery');
    }
  };

  const setCutoffTime = async (time: string) => {
    if (!authUid) return;
    try {
      await setDoc(doc(db, 'settings', 'delivery'), { cutoffTime: time }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/delivery');
    }
  };

  const setEstimatedDeliveryTime = async (time: string) => {
    if (!authUid) return;
    try {
      await setDoc(doc(db, 'settings', 'delivery'), { estimatedDeliveryTime: time }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/delivery');
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
    localStorage.removeItem('sp_cart');
  };

  // Persist cart to localStorage
  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem('sp_cart', JSON.stringify(cart));
    } else {
      localStorage.removeItem('sp_cart');
    }
  }, [cart]);

  const cartTotal = useMemo(() => cart.reduce((acc, item) => acc + (item.price * item.quantity), 0), [cart]);

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `NT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: Date.now(),
      read: false
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep last 50
  };

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
    pointsUsed: number 
  }) => {
    const orderPhoneId = details.phone.replace(/[^0-9]/g, '');
    if (!orderPhoneId) return null;
    
    // Generate a more unique order ID
    const orderId = `SP-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000)}`;
    const earnedPoints = Math.floor(cartTotal * 10);
    const { date: deliveryDate, isToday } = getDeliveryDate();
    
    const orderData = {
      id: orderId,
      uid: orderPhoneId,
      authUid: authUid,
      roomNumber: details.room,
      address: details.address || null,
      items: [...cart],
      total: cartTotal - details.pointDiscount,
      pointDiscount: details.pointDiscount,
      pointsUsed: details.pointsUsed,
      earnedPoints: earnedPoints,
      status: 'pending',
      customerName: details.name,
      customerPhone: details.phone,
      paymentMethod: details.paymentMethod,
      deliveryDate,
      deliveryDay: isToday ? 'Today' : 'Tomorrow',
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
      if (details.pointsUsed > 0) userUpdate.points = increment(-details.pointsUsed);
      
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
        batch.update(productRef, {
          stock: increment(-item.quantity)
        });
      });

      // Check quota before committing
      if (getIsQuotaExceeded()) {
        throw new Error("Firebase Quota Exceeded: The daily limit for orders has been reached. Please try again later or contact support.");
      }

      // Commit the batch - this is a single network request
      await batch.commit();

      // 5. Post-success UI updates
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
      console.error("Error placing order:", error);
      
      // Handle specific permission errors gracefully
      if (error?.message?.includes('permission') || error?.code === 'permission-denied') {
        throw new Error("Permission Denied: If you have an account, please log in. Otherwise, please check your network.");
      }
      
      throw error;
    }
  };

  const updateOrderStatus = async (id: string, status: Order['status']) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    const oldStatus = order.status;
    
    try {
      await updateDoc(doc(db, 'orders', id), { status });
      
      // Stock logic: Return stock if order is cancelled
      if (status === 'cancelled' && oldStatus !== 'cancelled') {
        for (const item of order.items) {
          const productRef = doc(db, 'products', item.id);
          await updateDoc(productRef, {
            stock: increment(item.quantity)
          });
        }
      }
      // Deduct stock if order was cancelled and is now being restored (rare but possible)
      else if (oldStatus === 'cancelled' && status !== 'cancelled') {
        for (const item of order.items) {
          const productRef = doc(db, 'products', item.id);
          await updateDoc(productRef, {
            stock: increment(-item.quantity)
          });
        }
      }

      // Points logic: Add earned points only when marked as 'delivered'
      if (status === 'delivered' && oldStatus !== 'delivered' && order.uid) {
        await updateDoc(doc(db, 'users', order.uid), {
          points: increment(order.earnedPoints)
        });
        
        // Add point transaction record
        const transactionId = `TX-${Date.now()}`;
        await setDoc(doc(db, 'users', order.uid, 'pointTransactions', transactionId), {
          id: transactionId,
          uid: order.uid,
          type: 'earn',
          amount: order.earnedPoints,
          description: `Order ${id} delivered`,
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
      console.error("Error updating order status:", error);
    }
  };

  const cancelOrder = async (id: string) => {
    const order = orders.find(o => o.id === id);
    if (!order || order.status === 'cancelled') return;

    try {
      await updateDoc(doc(db, 'orders', id), { status: 'cancelled' });
      
      // If order is cancelled:
      // 1. Refund points used
      if (order.pointsUsed > 0 && order.uid) {
        await updateDoc(doc(db, 'users', order.uid), {
          points: increment(order.pointsUsed)
        });

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
      console.error("Error cancelling order:", error);
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
      console.error("Error reordering:", error);
      return { success: false, message: 'An error occurred while reordering.' };
    }
  };

  const toggleFavorite = async (id: string) => {
    const newFavorites = favorites.includes(id) 
      ? favorites.filter(fid => fid !== id) 
      : [...favorites, id];
    
    setFavorites(newFavorites);
    
    if (uid) {
      try {
        await updateDoc(doc(db, 'users', uid), {
          favorites: newFavorites
        });
      } catch (error) {
        console.error("Error syncing favorites:", error);
        // Optional: Rollback if critical, but for favorites local is usually fine
      }
    }
  };

  const deleteProduct = async (id: string) => {
    // Optimistic delete from local state
    setProducts(prev => prev.filter(p => p.id !== id));
    
    try {
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'products', id));
    } catch (error) {
      console.error("Error deleting product:", error);
      // Re-sync will happen via onSnapshot
    }
  };

  const updateProductStock = async (productId: string, newStock: number) => {
    try {
      await updateDoc(doc(db, 'products', productId), { stock: newStock });
      await logAudit('update_stock', 'product', `Updated stock for ${productId} to ${newStock}`);
    } catch (error) {
      console.error("Error updating product stock:", error);
    }
  };

  const addCoupon = async (coupon: Omit<Coupon, 'id'>) => {
    try {
      await addDoc(collection(db, 'coupons'), { ...coupon, usageCount: 0 });
      await logAudit('add_coupon', 'coupon', `Added coupon ${coupon.code}`);
    } catch (error) {
      console.error("Error adding coupon:", error);
    }
  };

  const updateCoupon = async (id: string, coupon: Partial<Coupon>) => {
    try {
      await updateDoc(doc(db, 'coupons', id), coupon);
      await logAudit('update_coupon', 'coupon', `Updated coupon ${id}`);
    } catch (error) {
      console.error("Error updating coupon:", error);
    }
  };

  const deleteCoupon = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'coupons', id));
      await logAudit('delete_coupon', 'coupon', `Deleted coupon ${id}`);
    } catch (error) {
      console.error("Error deleting coupon:", error);
    }
  };

  const logAudit = async (action: string, target: string, details: string) => {
    // Audit logging disabled to save Firestore quota
    return;
  };

  const sendBroadcast = async (notification: Omit<BroadcastNotification, 'id' | 'createdAt'>) => {
    try {
      await addDoc(collection(db, 'broadcastNotifications'), {
        ...notification,
        createdAt: serverTimestamp(),
        timestamp: Date.now()
      });
      await logAudit('send_broadcast', 'notification', `Sent broadcast: ${notification.title}`);
    } catch (error) {
      console.error("Error sending broadcast:", error);
    }
  };

  const addAdmin = async (admin: Omit<AdminUser, 'createdAt'>) => {
    try {
      await setDoc(doc(db, 'admins', admin.uid), {
        ...admin,
        createdAt: serverTimestamp()
      });
      await logAudit('add_admin', 'admin', `Added admin ${admin.email}`);
    } catch (error) {
      console.error("Error adding admin:", error);
    }
  };

  const updateAdminRole = async (uid: string, role: AdminUser['role']) => {
    try {
      await updateDoc(doc(db, 'admins', uid), { role });
      await logAudit('update_admin_role', 'admin', `Updated role for ${uid} to ${role}`);
    } catch (error) {
      console.error("Error updating admin role:", error);
    }
  };

  const removeAdmin = async (uid: string) => {
    try {
      await deleteDoc(doc(db, 'admins', uid));
      await logAudit('remove_admin', 'admin', `Removed admin ${uid}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `admins/${uid}`);
    }
  };

  const updateUserPoints = async (uid: string, points: number) => {
    try {
      await updateDoc(doc(db, 'users', uid), { points });
      await logAudit('update_user_points', 'user', `Updated points for user ${uid} to ${points}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const addProduct = async (product: Omit<Product, 'id'>) => {
    const productId = product.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const newProduct = { ...product, id: productId };
    
    // Optimistic add
    setProducts(prev => [...prev, newProduct]);
    
    try {
      await setDoc(doc(db, 'products', productId), newProduct);
      await logAudit('add_product', 'product', `Added product ${product.name}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `products/${productId}`);
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      await updateDoc(doc(db, 'products', id), updates);
      await logAudit('update_product', 'product', `Updated product ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `products/${id}`);
    }
  };

  const addPromotionBanner = async (banner: Omit<PromotionBanner, 'id'>) => {
    try {
      await addDoc(collection(db, 'promotionBanners'), banner);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'promotionBanners');
    }
  };

  const updatePromotionBanner = async (id: string, banner: Partial<PromotionBanner>) => {
    try {
      await updateDoc(doc(db, 'promotionBanners', id), banner);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `promotionBanners/${id}`);
    }
  };

  const deletePromotionBanner = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'promotionBanners', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `promotionBanners/${id}`);
    }
  };

  const addDeal = async (deal: Omit<Deal, 'id'>) => {
    try {
      await addDoc(collection(db, 'deals'), deal);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'deals');
    }
  };

  const updateDeal = async (id: string, deal: Partial<Deal>) => {
    try {
      await updateDoc(doc(db, 'deals', id), deal);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `deals/${id}`);
    }
  };

  const deleteDeal = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'deals', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `deals/${id}`);
    }
  };

  const addBundle = async (bundle: Omit<Bundle, 'id'>) => {
    try {
      await addDoc(collection(db, 'bundles'), bundle);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'bundles');
    }
  };

  const updateBundle = async (id: string, bundle: Partial<Bundle>) => {
    try {
      await updateDoc(doc(db, 'bundles', id), bundle);
    } catch (error) {
      console.error("Error updating bundle:", error);
    }
  };

  const deleteBundle = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'bundles', id));
    } catch (error) {
      console.error("Error deleting bundle:", error);
    }
  };

  const addAddress = async (address: Omit<Address, 'id'>) => {
    if (!uid) return;
    const addressId = `addr-${Date.now()}`;
    const newAddress = { ...address, id: addressId } as Address;
    
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
      if (newAddress.isDefault) {
        const batch: any[] = [];
        previousAddresses.forEach(a => {
          if (a.isDefault) {
            batch.push(updateDoc(doc(db, 'users', uid, 'addresses', a.id), { isDefault: false }));
          }
        });
        await Promise.all(batch);
      }

      await setDoc(doc(db, 'users', uid, 'addresses', addressId), newAddress);
      toast.success(translations[language === 'mm' ? 'mm' : 'en'].addressSaved || 'Address saved successfully');
    } catch (error: any) {
      console.error("Error adding address:", error);
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
    
    // Optimistic Update
    const previousAddresses = [...addresses];
    let updatedAddresses = addresses.map(a => {
      if (a.id === id) return { ...a, ...address };
      if (address.isDefault && a.isDefault) return { ...a, isDefault: false };
      return a;
    });
    
    setAddresses(updatedAddresses);

    try {
      if (address.isDefault) {
        const batch: any[] = [];
        previousAddresses.forEach(a => {
          if (a.isDefault && a.id !== id) {
            batch.push(updateDoc(doc(db, 'users', uid, 'addresses', a.id), { isDefault: false }));
          }
        });
        await Promise.all(batch);
      }
      await updateDoc(doc(db, 'users', uid, 'addresses', id), address);
      toast.success(translations[language === 'mm' ? 'mm' : 'en'].addressUpdated || 'Address updated successfully');
    } catch (error: any) {
      console.error("Error updating address:", error);
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
      await deleteDoc(doc(db, 'users', uid, 'addresses', id));
      
      if (deletedAddress?.isDefault && updatedAddresses.length > 0) {
        await updateDoc(doc(db, 'users', uid, 'addresses', updatedAddresses[0].id), { isDefault: true });
      }
      toast.success(translations[language === 'mm' ? 'mm' : 'en'].addressDeleted || 'Address deleted successfully');
    } catch (error) {
      console.error("Error removing address:", error);
      setAddresses(previousAddresses); // Rollback
      toast.error('Failed to delete address.');
      handleFirestoreError(error, OperationType.DELETE, `users/${uid}/addresses/${id}`);
    }
  };

  const setDefaultAddress = async (id: string) => {
    if (!uid) return;
    try {
      const batch: any[] = [];
      addresses.forEach(a => {
        batch.push(updateDoc(doc(db, 'users', uid, 'addresses', a.id), { 
          isDefault: a.id === id 
        }));
      });
      await Promise.all(batch);
    } catch (error) {
      console.error("Error setting default address:", error);
    }
  };

  return (
    <StoreContext.Provider value={{ 
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
      supportNumber,
      setSupportNumber,
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
      formatPrice: (price: number) => {
        if (currency === 'RM') {
          return `RM ${price.toFixed(2)}`;
        }
        return `${price.toLocaleString()} Ks`;
      },
      getMainName: (item: { name: string; mmName: string; msName?: string; thName?: string; zhName?: string }) => {
        return item.name; // Always English as requested
      },
      getSecondaryName: (item: { name: string; mmName: string; msName?: string; thName?: string; zhName?: string }) => {
        // console.log('Current language:', language, 'Item:', item.name);
        switch (language) {
          case 'en':
            return item.mmName; // English selected -> Second is Myanmar
          case 'my':
            return item.mmName; // Myanmar selected -> Second is Myanmar (as per latest request)
          case 'th':
            return item.thName || item.mmName;
          case 'zh':
            return item.zhName || item.mmName;
          case 'ms':
            return item.msName || item.mmName;
          default:
            return item.mmName;
        }
      },
      getLocalizedName: (item: { mmName: string; msName?: string; thName?: string; zhName?: string }) => {
        switch (language) {
          case 'ms':
            return item.msName || item.mmName;
          case 'th':
            return item.thName || item.mmName;
          case 'zh':
            return item.zhName || item.mmName;
          case 'en':
          case 'my':
          default:
            return item.mmName;
        }
      },
      t: (key: string) => {
        if (!translations) return key;
        return translations[language]?.[key] || translations['en']?.[key] || key;
      },
      darkMode,
      setDarkMode,
      isDeliveryEnabled,
      setIsDeliveryEnabled,
      isLowStockAlertEnabled,
      setIsLowStockAlertEnabled,
      cutoffTime,
      setCutoffTime,
      estimatedDeliveryTime,
      setEstimatedDeliveryTime,
      getDeliveryDate,
      signInWithGoogle,
      logout,
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
      updateAdminRole,
      removeAdmin,
      users,
      updateUserPoints,
      isAdmin,
      isAuthLoading,
      isProfileLoaded,
      isQuotaExceeded,
      resetQuotaExceeded,
      sessions,
      revokeSession
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within a StoreProvider');
  return context;
};
