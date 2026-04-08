import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { disableNetwork } from 'firebase/firestore';

export const PRODUCTS = [
  { name: 'Fresh Atlantic Salmon', mmName: 'လတ်ဆတ်သော ဆယ်လ်မွန်ငါး', msName: 'Salmon Atlantik Segar', thName: 'ปลาแซลมอนแอตแลนติกสด', zhName: '新鲜大西洋鲑鱼', price: 35.00, unit: '1 kg', category: 'seafood', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=500' },
  { name: 'Tiger Prawns', mmName: 'ပုဇွန်ကျား', msName: 'Udang Harimau', thName: 'กุ้งลายเสือ', zhName: '老虎虾', price: 25.00, unit: '500 g', category: 'seafood', image: 'https://images.unsplash.com/photo-1565688534245-05d6b5be184a?w=500' },
  { name: 'Squid', mmName: 'ပြည်ကြီးငါး', msName: 'Sotong', thName: 'ปลาหมึก', zhName: '鱿鱼', price: 15.00, unit: '500 g', category: 'seafood', image: 'https://images.unsplash.com/photo-1599487488170-d11e9c23432e?w=500' },
  { name: 'Crab', mmName: 'ဂဏန်း', msName: 'Ketam', thName: 'ปู', zhName: '螃蟹', price: 20.00, unit: '1 kg', category: 'seafood', image: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=500' },
  { name: 'Clams', mmName: 'ခရု', msName: 'Kerang', thName: 'หอยลาย', zhName: '蛤蜊', price: 10.00, unit: '500 g', category: 'seafood', image: 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=500' },
  { name: 'Mussels', mmName: 'ကမာကောင်', msName: 'Kupang', thName: 'หอยแมลงภู่', zhName: '青口贝', price: 12.00, unit: '500 g', category: 'seafood', image: 'https://images.unsplash.com/photo-1580915411954-282cb1b0d780?w=500' },
  { name: 'Red Snapper', mmName: 'ငါးနီတူ', msName: 'Ikan Merah', thName: 'ปลากะพงแดง', zhName: '红鲷鱼', price: 18.00, unit: '1 kg', category: 'seafood', image: 'https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?w=500' },
  { name: 'Tuna', mmName: 'တူနာငါး', msName: 'Ikan Tuna', thName: 'ปลาทูน่า', zhName: '金枪鱼', price: 30.00, unit: '1 kg', category: 'seafood', image: 'https://images.unsplash.com/photo-1574784407217-e9455768516d?w=500' },
  { name: 'Lobster', mmName: 'ပုဇွန်လိပ်', msName: 'Udang Karang', thName: 'กุ้งมังกร', zhName: '龙虾', price: 50.00, unit: '1 pc', category: 'seafood', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500' },
  { name: 'Scallops', mmName: 'ခရုစိမ်း', msName: 'Kekapis', thName: 'หอยเชลล์', zhName: '扇贝', price: 22.00, unit: '500 g', category: 'seafood', image: 'https://images.unsplash.com/photo-1608039756065-412543940286?w=500' },
  
  { name: 'Ribeye Beef Steak', mmName: 'အမဲသား (Ribeye)', msName: 'Stik Daging Lembu Ribeye', thName: 'สเต็กเนื้อริบอาย', zhName: '肉眼牛排', price: 28.00, unit: '500 g', category: 'meat', image: 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=500' },
  { name: 'Chicken Breast', mmName: 'ကြက်ရင်အုံသား', msName: 'Dada Ayam', thName: 'อกไก่', zhName: '鸡胸肉', price: 8.00, unit: '1 kg', category: 'meat', image: 'https://images.unsplash.com/photo-1604644401437-657731753315?w=500' },
  { name: 'Lamb Chops', mmName: 'သိုးသား', msName: 'Tulang Rusuk Kambing', thName: 'ซี่โครงแกะ', zhName: '羊排', price: 35.00, unit: '500 g', category: 'meat', image: 'https://images.unsplash.com/photo-1603048297172-c92544798d5e?w=500' },
  { name: 'Pork Belly', mmName: 'ဝက်သားသုံးထပ်သား', msName: 'Perut Babi', thName: 'หมูสามชั้น', zhName: '五花肉', price: 12.00, unit: '1 kg', category: 'meat', image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=500' },
  { name: 'Ground Beef', mmName: 'အမဲသားအကြိတ်', msName: 'Daging Lembu Kisar', thName: 'เนื้อบด', zhName: '牛肉碎', price: 10.00, unit: '1 kg', category: 'meat', image: 'https://images.unsplash.com/photo-1588168333986-5078d3ae0276?w=500' },
  { name: 'Chicken Thighs', mmName: 'ကြက်ပေါင်သား', msName: 'Paha Ayam', thName: 'สะโพกไก่', zhName: '鸡腿肉', price: 7.00, unit: '1 kg', category: 'meat', image: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=500' },
  { name: 'Duck Breast', mmName: 'ဘဲရင်အုံသား', msName: 'Dada Itik', thName: 'อกเป็ด', zhName: '鸭胸肉', price: 20.00, unit: '500 g', category: 'meat', image: 'https://images.unsplash.com/photo-1598103434442-2b63456c2053?w=500' },
  { name: 'Bacon', mmName: 'ဝက်သားခြောက်', msName: 'Bakon', thName: 'เบคอน', zhName: '培根', price: 15.00, unit: '500 g', category: 'meat', image: 'https://images.unsplash.com/photo-1573682442545-207008779607?w=500' },
  { name: 'Beef Sirloin', mmName: 'အမဲသား (Sirloin)', msName: 'Daging Lembu Sirloin', thName: 'เนื้อสันนอก', zhName: '西冷牛肉', price: 25.00, unit: '500 g', category: 'meat', image: 'https://images.unsplash.com/photo-1558030006-450675383462?w=500' },
  { name: 'Chicken Wings', mmName: 'ကြက်တောင်ပံ', msName: 'Kepak Ayam', thName: 'ปีกไก่', zhName: '鸡翅', price: 6.00, unit: '1 kg', category: 'meat', image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab2545?w=500' },

  { name: 'Organic Broccoli', mmName: 'ပန်းဂေါ်ဖီစိမ်း', msName: 'Brokoli Organik', thName: 'บรอกโคลีออร์แกนิก', zhName: '有机西兰花', price: 4.50, unit: '1 pack', category: 'vegetables', image: 'https://images.unsplash.com/photo-1477322524344-644773289069?w=500' },
  { name: 'Vine-Ripened Tomatoes', mmName: 'ခရမ်းချဉ်သီး', msName: 'Tomato Masak Pokok', thName: 'มะเขือเทศ', zhName: '番茄', price: 1.50, unit: '500 g', category: 'vegetables', image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500' },
  { name: 'Carrots', mmName: 'မုန်လာဥနီ', msName: 'Lobak Merah', thName: 'แครอท', zhName: '胡萝卜', price: 1.00, unit: '1 kg', category: 'vegetables', image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=500' },
  { name: 'Spinach', mmName: 'ဟင်းနုနွယ်', msName: 'Bayam', thName: 'ผักโขม', zhName: '菠菜', price: 2.00, unit: '1 pack', category: 'vegetables', image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=500' },
  { name: 'Bell Peppers', mmName: 'ခရမ်းချဉ်သီးပွ', msName: 'Lada Benggala', thName: 'พริกหยวก', zhName: '灯笼椒', price: 3.00, unit: '3 pcs', category: 'vegetables', image: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=500' },
  { name: 'Cucumber', mmName: 'သခွားသီး', msName: 'Timun', thName: 'แตงกวา', zhName: '黄瓜', price: 1.20, unit: '1 kg', category: 'vegetables', image: 'https://images.unsplash.com/photo-1449300079323-02e204d9d3a6?w=500' },
  { name: 'Onions', mmName: 'ကြက်သွန်နီ', msName: 'Bawang Merah', thName: 'หัวหอม', zhName: '洋葱', price: 1.00, unit: '1 kg', category: 'vegetables', image: 'https://images.unsplash.com/photo-1580595964894-376994191c90?w=500' },
  { name: 'Potatoes', mmName: 'အာလူး', msName: 'Kentang', thName: 'มันฝรั่ง', zhName: '土豆', price: 1.50, unit: '1 kg', category: 'vegetables', image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba657?w=500' },
  { name: 'Lettuce', mmName: 'ဆလတ်ရွက်', msName: 'Daun Salad', thName: 'ผักกาดหอม', zhName: '生菜', price: 2.00, unit: '1 head', category: 'vegetables', image: 'https://images.unsplash.com/photo-1622206151226-18ca2c9abb4a?w=500' },
  { name: 'Cauliflower', mmName: 'ပန်းဂေါ်ဖီ', msName: 'Kubis Bunga', thName: 'กะหล่ำดอก', zhName: '花椰菜', price: 2.50, unit: '1 pc', category: 'vegetables', image: 'https://images.unsplash.com/photo-1614859322972-03107ea7d378?w=500' },
];;

export const seedDatabase = async () => {
  try {
    const productsCollection = collection(db, 'products');
    for (const product of PRODUCTS) {
      // Use a sanitized name as ID for consistent updates
      const productId = product.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      await setDoc(doc(productsCollection, productId), { ...product, id: productId });
    }
    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

export const seedSampleOrders = async () => {
  try {
    const ordersCollection = collection(db, 'orders');
    const sampleOrders = [
      {
        id: 'order_001',
        customerName: 'Aung Aung',
        roomNumber: '101',
        total: 50.00,
        status: 'delivered',
        customerPhone: '0912345678',
        paymentMethod: 'cash',
        createdAt: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(),
        items: [
          { id: 'fresh-atlantic-salmon', name: 'Fresh Atlantic Salmon', quantity: 2 },
          { id: 'tiger-prawns', name: 'Tiger Prawns', quantity: 3 },
          { id: 'onions', name: 'Onions', quantity: 5 }
        ]
      },
      {
        id: 'order_002',
        customerName: 'Ma Ma',
        roomNumber: '202',
        total: 30.00,
        status: 'delivered',
        customerPhone: '0987654321',
        paymentMethod: 'cash',
        createdAt: new Date(new Date().setDate(new Date().getDate() - 4)).toISOString(),
        items: [
          { id: 'ribeye-beef-steak', name: 'Ribeye Beef Steak', quantity: 2 },
          { id: 'organic-broccoli', name: 'Organic Broccoli', quantity: 2 },
          { id: 'potatoes', name: 'Potatoes', quantity: 3 }
        ]
      },
      {
        id: 'order_003',
        customerName: 'Kyaw Kyaw',
        roomNumber: '303',
        total: 25.00,
        status: 'delivered',
        customerPhone: '0911223344',
        paymentMethod: 'cash',
        createdAt: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString(),
        items: [
          { id: 'chicken-thighs', name: 'Chicken Thighs', quantity: 4 },
          { id: 'carrots', name: 'Carrots', quantity: 3 },
          { id: 'spinach', name: 'Spinach', quantity: 2 }
        ]
      },
      {
        id: 'order_004',
        customerName: 'Su Su',
        roomNumber: '404',
        total: 45.00,
        status: 'delivered',
        customerPhone: '0944556677',
        paymentMethod: 'cash',
        createdAt: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
        items: [
          { id: 'squid', name: 'Squid', quantity: 2 },
          { id: 'crab', name: 'Crab', quantity: 1 },
          { id: 'bell-peppers', name: 'Bell Peppers', quantity: 3 }
        ]
      },
      {
        id: 'order_005',
        customerName: 'Zaw Zaw',
        roomNumber: '505',
        total: 60.00,
        status: 'delivered',
        customerPhone: '0999887766',
        paymentMethod: 'cash',
        createdAt: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
        items: [
          { id: 'lobster', name: 'Lobster', quantity: 1 },
          { id: 'scallops', name: 'Scallops', quantity: 2 },
          { id: 'lettuce', name: 'Lettuce', quantity: 2 }
        ]
      },
      {
        id: 'order_006',
        customerName: 'Nilar',
        roomNumber: '606',
        total: 35.00,
        status: 'pending',
        customerPhone: '0977665544',
        paymentMethod: 'cash',
        createdAt: new Date().toISOString(),
        items: [
          { id: 'pork-belly', name: 'Pork Belly', quantity: 2 },
          { id: 'cucumber', name: 'Cucumber', quantity: 3 },
          { id: 'cauliflower', name: 'Cauliflower', quantity: 1 }
        ]
      }
    ];

    for (const order of sampleOrders) {
      await setDoc(doc(ordersCollection, order.id), order);
    }
    console.log('Sample orders seeded successfully!');
  } catch (error) {
    console.error('Error seeding sample orders:', error);
  }
};
