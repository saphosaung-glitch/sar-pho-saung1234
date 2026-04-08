import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
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
  Unsubscribe
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Address } from '../types';

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
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  roomNumber: string;
  items: CartItem[];
  total: number;
  pointDiscount: number;
  pointsUsed: number;
  earnedPoints: number;
  status: 'pending' | 'packing' | 'delivered' | 'cancelled';
  paymentMethod: string;
  timestamp: number;
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
  favorites: string[];
  toggleFavorite: (id: string) => void;
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
  emailNotificationsEnabled: boolean;
  setEmailNotificationsEnabled: (enabled: boolean) => void;
  twoFactorEnabled: boolean;
  setTwoFactorEnabled: (enabled: boolean) => void;
  biometricEnabled: boolean;
  setBiometricEnabled: (enabled: boolean) => void;
  dataSharingEnabled: boolean;
  setDataSharingEnabled: (enabled: boolean) => void;
  stealthModeEnabled: boolean;
  setStealthModeEnabled: (enabled: boolean) => void;
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
  cutoffTime: string;
  setCutoffTime: (time: string) => Promise<void>;
  getDeliveryDate: () => { date: string; isToday: boolean };
  signInWithGoogle: () => Promise<void>;
  logout: () => void;
  uid: string | null;
  authUid: string | null;
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addresses: Address[];
  addAddress: (address: Omit<Address, 'id'>) => Promise<void>;
  updateAddress: (id: string, address: Partial<Address>) => Promise<void>;
  removeAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;
  selectedAddressId: string | null;
  setSelectedAddressId: (id: string | null) => void;
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
  const [cart, setCart] = useState<CartItem[]>([]);
  const [authUid, setAuthUid] = useState<string | null>(null);
  const [userName, setUserName] = useState(() => {
    return localStorage.getItem('sp_user_name') || '';
  });
  const [userPhone, setUserPhone] = useState(() => {
    return localStorage.getItem('sp_user_phone') || '';
  });
  const [userAvatar, setUserAvatar] = useState(() => {
    return localStorage.getItem('sp_user_avatar') || '';
  });
  const [userEmail, setUserEmail] = useState(() => {
    return localStorage.getItem('sp_user_email') || '';
  });
  const [userBirthday, setUserBirthday] = useState(() => {
    return localStorage.getItem('sp_user_birthday') || '';
  });
  const [roomNumber, setRoomNumber] = useState(() => {
    return localStorage.getItem('sp_room') || '';
  });
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('sp_orders');
    return saved ? JSON.parse(saved) : [];
  });
  const [estimatedDeliveryTime, setEstimatedDeliveryTimeState] = useState(() => {
    return localStorage.getItem('sp_estimated_delivery') || '8:00 AM - 10:00 AM';
  });
  const [points, setPoints] = useState(() => {
    const saved = localStorage.getItem('sp_points');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [products, setProducts] = useState<any[]>(() => {
    const saved = localStorage.getItem('sp_products');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [addresses, setAddresses] = useState<Address[]>(() => {
    const saved = localStorage.getItem('sp_addresses');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedAddressId, setSelectedAddressIdState] = useState<string | null>(() => {
    return localStorage.getItem('sp_selected_address_id');
  });
  const [promotionBanners, setPromotionBanners] = useState<PromotionBanner[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);

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

  // Sync products from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'products'), (querySnapshot) => {
      const productsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(productsData);
      
      // Auto-seed if empty or outdated version
      const SEED_VERSION = '1.0.1'; // Increment this to force re-seed
      const currentSeed = localStorage.getItem('sp_seed_version');
      const isAdmin = localStorage.getItem('isAdmin') === 'true';
      
      if ((querySnapshot.empty || currentSeed !== SEED_VERSION) && isAdmin) {
        import('../lib/seed').then(({ seedDatabase }) => {
          seedDatabase().then(() => {
            localStorage.setItem('sp_seed_version', SEED_VERSION);
          }).catch(err => {
            console.error('Auto-seed failed:', err);
          });
        });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
    });
    return () => unsubscribe();
  }, []);

  // Sync Promotion Banners from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'promotionBanners'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PromotionBanner[];
      setPromotionBanners(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'promotionBanners');
    });
    return () => unsubscribe();
  }, []);

  // Sync Deals from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'deals'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Deal[];
      setDeals(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'deals');
    });
    return () => unsubscribe();
  }, []);

  // Sync Bundles from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'bundles'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Bundle[];
      setBundles(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'bundles');
    });
    return () => unsubscribe();
  }, []);

  // Initialize Auth session
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthUid(user.uid);
      } else {
        setAuthUid(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // UID for data is derived from phone number for persistence across devices
  const uid = useMemo(() => {
    if (!userPhone) return null;
    return userPhone.replace(/[^0-9]/g, '');
  }, [userPhone]);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Google Sign-in error:", error);
    }
  };

  const logout = () => {
    setUserName('');
    setUserPhone('');
    setRoomNumber('');
    setPoints(0);
    setUserAvatar('');
    setUserEmail('');
    setUserBirthday('');
    setOrders([]);
    localStorage.removeItem('sp_user_name');
    localStorage.removeItem('sp_user_phone');
    localStorage.removeItem('sp_room');
    localStorage.removeItem('sp_user_avatar');
    localStorage.removeItem('sp_user_email');
    localStorage.removeItem('sp_user_birthday');
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
      await updateDoc(userDocRef, {
        ...profile,
        lastActive: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating profile in Firestore:", error);
    }
  };

  // Sync User Profile with Firestore using Phone Number as ID
  useEffect(() => {
    if (!uid) return;

    const userDocRef = doc(db, 'users', uid);
    let unsubscribe: Unsubscribe | null = null;

    const setupSync = async () => {
      try {
        const docSnap = await getDoc(userDocRef);
        if (!docSnap.exists()) {
          // Create initial profile if it doesn't exist
          await setDoc(userDocRef, {
            uid: uid, // Use phone-based UID
            name: userName,
            phone: userPhone,
            room: roomNumber,
            avatar: userAvatar,
            email: userEmail,
            birthday: userBirthday,
            points: 0,
            tier: 'Bronze',
            lastActive: serverTimestamp()
          }, { merge: true });
        } else {
          // Update last active
          await updateDoc(userDocRef, {
            lastActive: serverTimestamp()
          }).catch(() => {});
        }

        unsubscribe = onSnapshot(userDocRef, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setPoints(data.points || 0);
            // Sync back to local if empty
            if (!userName && data.name) setUserName(data.name);
            if (!roomNumber && data.room) setRoomNumber(data.room);
            if (!userAvatar && data.avatar) setUserAvatar(data.avatar);
            if (!userEmail && data.email) setUserEmail(data.email);
            if (!userBirthday && data.birthday) setUserBirthday(data.birthday);
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${uid}`);
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
  }, [uid]);

  // Sync Orders from Firestore
  useEffect(() => {
    if (!uid) return;

    // If admin, show all orders. If user, show only their orders.
    // For simplicity in this context, we'll check if the user is an admin via localStorage
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    
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
        return {
          ...data,
          id: doc.id,
          timestamp: data.createdAt?.toMillis() || data.timestamp || Date.now()
        };
      }) as Order[];
      
      // Sort by timestamp descending (newest first) for the state
      const sortedOrders = fetchedOrders.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      setOrders(sortedOrders);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    });

    return () => unsubscribe();
  }, [uid]);

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
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(() => {
    const saved = localStorage.getItem('sp_2fa_enabled');
    return saved === 'true';
  });
  const [biometricEnabled, setBiometricEnabled] = useState(() => {
    const saved = localStorage.getItem('sp_biometric_enabled');
    return saved === null ? true : saved === 'true';
  });
  const [dataSharingEnabled, setDataSharingEnabled] = useState(() => {
    const saved = localStorage.getItem('sp_data_sharing_enabled');
    return saved === null ? true : saved === 'true';
  });
  const [stealthModeEnabled, setStealthModeEnabled] = useState(() => {
    const saved = localStorage.getItem('sp_stealth_mode_enabled');
    return saved === 'true';
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
  const [isDeliveryEnabled, setIsDeliveryEnabledState] = useState(true);
  const [cutoffTime, setCutoffTimeState] = useState('06:00');

  // Sync settings from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'delivery'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setIsDeliveryEnabledState(data.enabled ?? true);
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

  useEffect(() => {
    localStorage.setItem('sp_user_name', userName);
  }, [userName]);

  useEffect(() => {
    localStorage.setItem('sp_user_avatar', userAvatar);
  }, [userAvatar]);

  useEffect(() => {
    localStorage.setItem('sp_user_email', userEmail);
  }, [userEmail]);

  useEffect(() => {
    localStorage.setItem('sp_user_birthday', userBirthday);
  }, [userBirthday]);

  useEffect(() => {
    localStorage.setItem('sp_user_phone', userPhone);
  }, [userPhone]);

  useEffect(() => {
    localStorage.setItem('sp_room', roomNumber);
  }, [roomNumber]);

  useEffect(() => {
    localStorage.setItem('sp_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('sp_points', points.toString());
  }, [points]);

  useEffect(() => {
    localStorage.setItem('sp_support_number', supportNumber);
  }, [supportNumber]);

  useEffect(() => {
    localStorage.setItem('sp_bank_name', bankName);
  }, [bankName]);

  useEffect(() => {
    localStorage.setItem('sp_bank_acc_num', bankAccountNumber);
  }, [bankAccountNumber]);

  useEffect(() => {
    localStorage.setItem('sp_bank_acc_name', bankAccountName);
  }, [bankAccountName]);

  useEffect(() => {
    localStorage.setItem('sp_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('sp_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('sp_email_enabled', emailNotificationsEnabled.toString());
  }, [emailNotificationsEnabled]);

  useEffect(() => {
    localStorage.setItem('sp_2fa_enabled', twoFactorEnabled.toString());
  }, [twoFactorEnabled]);

  useEffect(() => {
    localStorage.setItem('sp_biometric_enabled', biometricEnabled.toString());
  }, [biometricEnabled]);

  useEffect(() => {
    localStorage.setItem('sp_data_sharing_enabled', dataSharingEnabled.toString());
  }, [dataSharingEnabled]);

  useEffect(() => {
    localStorage.setItem('sp_stealth_mode_enabled', stealthModeEnabled.toString());
  }, [stealthModeEnabled]);

  useEffect(() => {
    localStorage.setItem('sp_payment_methods', JSON.stringify(paymentMethods));
  }, [paymentMethods]);

  useEffect(() => {
    console.log('StoreContext: Language state changed to:', language);
    localStorage.setItem('sp_language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('sp_currency', currency);
  }, [currency]);

  useEffect(() => {
    localStorage.setItem('sp_dark_mode', darkMode.toString());
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const addToCart = (item: Omit<CartItem, 'quantity'>) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i).filter(i => i.quantity > 0));
  };

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
    
    const orderId = `SP-${Math.floor(Math.random() * 9000) + 1000}`;
    const earnedPoints = Math.floor(cartTotal * 10);
    const { date: deliveryDate, isToday } = getDeliveryDate();
    
    const orderData = {
      id: orderId,
      uid: orderPhoneId,
      roomNumber: details.room,
      address: details.address,
      items: [...cart], // Clone cart
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
      // Update local state if not set or changed
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

      const userDocRef = doc(db, 'users', orderPhoneId);
      await setDoc(userDocRef, {
        uid: orderPhoneId,
        name: details.name,
        phone: details.phone,
        room: details.room,
        lastActive: serverTimestamp()
      }, { merge: true });

      await setDoc(doc(db, 'orders', orderId), orderData);
      
      if (details.pointsUsed > 0) {
        await updateDoc(userDocRef, {
          points: increment(-details.pointsUsed)
        });
      }

      // Immediate UI updates
      setCart([]);
      const t = (key: string) => (translations[language] as any)[key] || key;
      addNotification({
        title: t('orderSuccessfulTitle'),
        message: t('orderReceivedMsg').replace('{{id}}', orderId),
        type: 'order'
      });

      return orderData;
    } catch (error) {
      console.error("Error placing order:", error);
      return null;
    }
  };

  const updateOrderStatus = async (id: string, status: Order['status']) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    const oldStatus = order.status;
    
    try {
      await updateDoc(doc(db, 'orders', id), { status });
      
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

  const addProduct = async (product: Omit<Product, 'id'>) => {
    const productId = product.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const newProduct = { ...product, id: productId };
    
    // Optimistic add
    setProducts(prev => [...prev, newProduct]);
    
    try {
      await setDoc(doc(db, 'products', productId), newProduct);
    } catch (error) {
      console.error("Error adding product:", error);
      // Re-sync will happen via onSnapshot
    }
  };

  const addPromotionBanner = async (banner: Omit<PromotionBanner, 'id'>) => {
    try {
      await addDoc(collection(db, 'promotionBanners'), banner);
    } catch (error) {
      console.error("Error adding promotion banner:", error);
    }
  };

  const updatePromotionBanner = async (id: string, banner: Partial<PromotionBanner>) => {
    try {
      await updateDoc(doc(db, 'promotionBanners', id), banner);
    } catch (error) {
      console.error("Error updating promotion banner:", error);
    }
  };

  const deletePromotionBanner = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'promotionBanners', id));
    } catch (error) {
      console.error("Error deleting promotion banner:", error);
    }
  };

  const addDeal = async (deal: Omit<Deal, 'id'>) => {
    try {
      await addDoc(collection(db, 'deals'), deal);
    } catch (error) {
      console.error("Error adding deal:", error);
    }
  };

  const updateDeal = async (id: string, deal: Partial<Deal>) => {
    try {
      await updateDoc(doc(db, 'deals', id), deal);
    } catch (error) {
      console.error("Error updating deal:", error);
    }
  };

  const deleteDeal = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'deals', id));
    } catch (error) {
      console.error("Error deleting deal:", error);
    }
  };

  const addBundle = async (bundle: Omit<Bundle, 'id'>) => {
    try {
      await addDoc(collection(db, 'bundles'), bundle);
    } catch (error) {
      console.error("Error adding bundle:", error);
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
    } catch (error) {
      console.error("Error adding address:", error);
      setAddresses(previousAddresses); // Rollback
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
    } catch (error) {
      console.error("Error updating address:", error);
      setAddresses(previousAddresses); // Rollback
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
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'users', uid, 'addresses', id));
      
      if (deletedAddress?.isDefault && updatedAddresses.length > 0) {
        await updateDoc(doc(db, 'users', uid, 'addresses', updatedAddresses[0].id), { isDefault: true });
      }
    } catch (error) {
      console.error("Error removing address:", error);
      setAddresses(previousAddresses); // Rollback
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
      favorites,
      toggleFavorite,
      notifications,
      addNotification,
      markNotificationAsRead,
      clearNotifications,
      emailNotificationsEnabled,
      setEmailNotificationsEnabled,
      twoFactorEnabled,
      setTwoFactorEnabled,
      biometricEnabled,
      setBiometricEnabled,
      dataSharingEnabled,
      setDataSharingEnabled,
      stealthModeEnabled,
      setStealthModeEnabled,
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
      deleteProduct,
      addresses,
      addAddress,
      updateAddress,
      removeAddress,
      setDefaultAddress,
      selectedAddressId,
      setSelectedAddressId,
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
      deleteBundle
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
