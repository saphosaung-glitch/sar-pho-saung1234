import React, { useState, useMemo, useEffect } from 'react';
import { 
  Package, Plus, Search, X, Settings, 
  Trash2, 
  RefreshCw, Save, Image as ImageIcon, 
  Sparkles, CheckCircle2, Clock, 
  AlertTriangle, Eye, ChevronRight,
  Filter, ArrowUpDown, Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import { Product } from '../../context/StoreContext';
import { CATEGORIES } from '../../constants';
import { uploadProductImage } from '../../services/uploadService';
import { translateProductName } from '../../services/translationService';

interface ProductsTabProps {
  products: Product[];
  categories: any[];
  addProduct: (p: any) => Promise<void>;
  updateProduct: (id: string, p: any) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  darkMode: boolean;
  t: (key: string) => string;
  language: string;
  formatPrice: (price: number) => string;
  globalSearch?: string;
}

function AddProductModal({ 
  isOpen, 
  onClose, 
  addProduct, 
  updateProduct,
  product,
  categories, 
  darkMode, 
  t 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  addProduct: (p: any) => Promise<void>, 
  updateProduct?: (id: string, p: any) => Promise<void>,
  product?: Product | null,
  categories: any[], 
  darkMode: boolean, 
  t: (key: string) => string 
}) {
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Saving...');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    salePrice: '',
    category: 'meat',
    unit: '1 kg',
    image: '',
    stock: '100',
    description: '',
    sku: '',
    weight: '',
    status: 'published' as 'published' | 'draft',
    mmName: '',
    thName: '',
    zhName: '',
    msName: ''
  });
  const [showUrlInput, setShowUrlInput] = useState(true);

  // Update form data when product prop changes
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        price: product.price?.toString() || '',
        salePrice: product.salePrice?.toString() || '',
        category: product.category || categories[0]?.id || 'meat',
        unit: product.unit || '1 kg',
        image: product.image || '',
        stock: product.stock?.toString() || '100',
        description: product.description || '',
        sku: product.sku || '',
        weight: product.weight || '',
        status: product.status || 'published',
        mmName: product.mmName || '',
        thName: product.thName || '',
        zhName: product.zhName || '',
        msName: product.msName || ''
      });
    } else {
      setFormData({
        name: '', price: '', salePrice: '', category: categories[0]?.id || 'meat',
        unit: '1 kg', image: '', stock: '100', description: '', sku: '',
        weight: '', status: 'published', mmName: '', thName: '', zhName: '', msName: ''
      });
    }
  }, [product, categories]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const url = await uploadProductImage(file, (progress) => {
        setUploadProgress(Math.round(progress));
      });
      setFormData(prev => ({ ...prev, image: url }));
      toast.success('Image uploaded successfully');
      setShowUrlInput(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload image');
      setShowUrlInput(true);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      toast.error('Please fill in required fields');
      return;
    }
    
    setLoading(true);
    setLoadingText('Saving product...');
    try {
      const productData = {
        ...formData,
        price: Number(formData.price),
        stock: Number(formData.stock),
        salePrice: formData.salePrice ? Number(formData.salePrice) : undefined,
      };

      if (product && updateProduct) {
        await updateProduct(product.id, productData);
        toast.success('Product updated successfully!');
      } else {
        await addProduct(productData);
        toast.success('Product added successfully!');
      }
      
      onClose();
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Failed to save product.");
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = `w-full px-4 py-3 rounded-xl border font-bold transition-all outline-none text-sm ${
    darkMode 
      ? 'bg-white/5 border-white/10 focus:border-primary/50 text-on-surface' 
      : 'bg-gray-50 border-gray-100 focus:bg-white focus:border-emerald-300 text-emerald-950'
  }`;

  const labelClasses = `text-[10px] font-black uppercase tracking-widest mb-1.5 block ${
    darkMode ? 'text-on-surface-variant/40' : 'text-gray-400'
  }`;

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] animate-in fade-in duration-300" />
        <Dialog.Content className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl max-h-[95vh] overflow-hidden rounded-[2.5rem] shadow-2xl z-[101] animate-in zoom-in-95 duration-300 ${darkMode ? 'bg-[#161818] border border-white/5' : 'bg-white'}`}>
          <div className="p-8 overflow-y-auto max-h-[92vh] no-scrollbar">
            <div className="flex items-center justify-between mb-6">
              <div>
                <Dialog.Title className="text-2xl font-black tracking-tight">{product ? 'Edit Product' : 'Add Product'}</Dialog.Title>
                <Dialog.Description className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
                  {product ? 'Modify current listing' : 'Create a new premium product listing'}
                </Dialog.Description>
              </div>
              <Dialog.Close className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                <X size={20} />
              </Dialog.Close>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <Tabs.Root defaultValue="general" className="space-y-6">
                <Tabs.List className="flex gap-2 p-1.5 rounded-[1.5rem] bg-black/5 dark:bg-white/5">
                  {['general', 'pricing', 'translations', 'advanced'].map(tab => (
                    <Tabs.Trigger 
                      key={tab} 
                      value={tab}
                      className="flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 data-[state=active]:shadow-sm data-[state=active]:text-primary"
                    >
                      {tab}
                    </Tabs.Trigger>
                  ))}
                </Tabs.List>

                <Tabs.Content value="general" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className={labelClasses}>Product Name (English)</label>
                      <input 
                        type="text" 
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        placeholder="e.g. Premium Fuji Apple"
                        className={inputClasses}
                        required
                      />
                    </div>
                    <div>
                      <label className={labelClasses}>Category</label>
                      <select 
                        value={formData.category}
                        onChange={e => setFormData({...formData, category: e.target.value})}
                        className={inputClasses}
                      >
                        {categories.filter(c => c.id !== 'all').map(category => (
                          <option key={category.id} value={category.id}>
                            {category.nameEn || category.name || t(category.key)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelClasses}>Unit</label>
                      <input 
                        type="text" 
                        value={formData.unit}
                        onChange={e => setFormData({...formData, unit: e.target.value})}
                        placeholder="e.g. 1 kg"
                        className={inputClasses}
                        required
                      />
                    </div>
                    <div className="col-span-2">
                       <div className="flex items-center justify-between mb-2">
                        <label className={labelClasses}>Product Image</label>
                        <button 
                          type="button"
                          onClick={() => setShowUrlInput(!showUrlInput)}
                          className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                        >
                          {showUrlInput ? 'Switch to Upload' : 'Switch to URL'}
                        </button>
                      </div>
                      
                      {showUrlInput ? (
                        <div className="space-y-3">
                          <input 
                            type="url"
                            value={formData.image}
                            onChange={e => setFormData({...formData, image: e.target.value})}
                            placeholder="https://images.unsplash.com/..."
                            className={inputClasses}
                          />
                        </div>
                      ) : (
                        <div className="flex gap-4">
                          <div className={`flex-grow relative border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-6 transition-all ${
                            uploading ? 'opacity-50 pointer-events-none' : ''
                          } ${
                            darkMode ? 'border-white/10 hover:border-primary/50' : 'border-gray-200 hover:border-emerald-400'
                          }`}>
                            {formData.image ? (
                              <div className="relative w-full h-32 rounded-xl overflow-hidden group">
                                <img src={formData.image} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <button 
                                    type="button"
                                    onClick={() => setFormData({...formData, image: ''})}
                                    className="p-2 bg-rose-500 text-white rounded-full hover:scale-110 transition-transform"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                                  <ImageIcon className="text-primary" size={24} />
                                </div>
                                <p className="text-xs font-bold text-center">
                                  {uploading ? 'Uploading...' : 'Drop image here or click to browse'}
                                </p>
                              </>
                            )}
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              disabled={uploading}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Tabs.Content>

                <Tabs.Content value="pricing" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClasses}>Regular Price</label>
                      <input 
                        type="number" 
                        value={formData.price}
                        onChange={e => setFormData({...formData, price: e.target.value})}
                        placeholder="0.00"
                        className={inputClasses}
                        required
                      />
                    </div>
                    <div>
                      <label className={labelClasses}>Sale Price (Optional)</label>
                      <input 
                        type="number" 
                        value={formData.salePrice}
                        onChange={e => setFormData({...formData, salePrice: e.target.value})}
                        placeholder="0.00"
                        className={inputClasses}
                      />
                    </div>
                    <div>
                      <label className={labelClasses}>Stock Quantity</label>
                      <input 
                        type="number" 
                        value={formData.stock}
                        onChange={e => setFormData({...formData, stock: e.target.value})}
                        className={inputClasses}
                        required
                      />
                    </div>
                    <div>
                      <label className={labelClasses}>Status</label>
                      <select 
                        value={formData.status}
                        onChange={e => setFormData({...formData, status: e.target.value as any})}
                        className={inputClasses}
                      >
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                      </select>
                    </div>
                  </div>
                </Tabs.Content>

                <Tabs.Content value="translations" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClasses}>Myanmar (Burmese)</label>
                      <input 
                        type="text" 
                        value={formData.mmName}
                        onChange={e => setFormData({...formData, mmName: e.target.value})}
                        className={inputClasses}
                      />
                    </div>
                    <div>
                      <label className={labelClasses}>Chinese</label>
                      <input 
                        type="text" 
                        value={formData.zhName}
                        onChange={e => setFormData({...formData, zhName: e.target.value})}
                        className={inputClasses}
                      />
                    </div>
                    <div>
                      <label className={labelClasses}>Thai</label>
                      <input 
                        type="text" 
                        value={formData.thName}
                        onChange={e => setFormData({...formData, thName: e.target.value})}
                        className={inputClasses}
                      />
                    </div>
                    <div>
                      <label className={labelClasses}>Malay</label>
                      <input 
                        type="text" 
                        value={formData.msName}
                        onChange={e => setFormData({...formData, msName: e.target.value})}
                        className={inputClasses}
                      />
                    </div>
                  </div>
                </Tabs.Content>

                <Tabs.Content value="advanced" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClasses}>SKU / Barcode</label>
                      <input 
                        type="text" 
                        value={formData.sku}
                        onChange={e => setFormData({...formData, sku: e.target.value})}
                        className={inputClasses}
                      />
                    </div>
                    <div>
                      <label className={labelClasses}>Weight</label>
                      <input 
                        type="text" 
                        value={formData.weight}
                        onChange={e => setFormData({...formData, weight: e.target.value})}
                        className={inputClasses}
                      />
                    </div>
                    <div className="col-span-2">
                       <label className={labelClasses}>Description</label>
                      <textarea 
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                        className={`${inputClasses} h-24 resize-none`}
                      />
                    </div>
                  </div>
                </Tabs.Content>
              </Tabs.Root>

              <div className="pt-4 flex gap-4">
                <button 
                  type="button"
                  onClick={onClose}
                  className={`flex-1 py-4 rounded-xl font-black text-xs uppercase tracking-widest border transition-all ${darkMode ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-white border-gray-100 hover:bg-gray-50'}`}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={loading || uploading}
                  className={`flex-[2] py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2 ${loading ? 'opacity-50' : 'hover:scale-[1.02] active:scale-[0.98]'} ${darkMode ? 'bg-primary text-surface' : 'bg-emerald-600 text-white'}`}
                >
                  {loading ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                  {loading ? loadingText : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default function ProductsTab({ 
  products, 
  categories, 
  addProduct, 
  updateProduct, 
  deleteProduct, 
  darkMode, 
  t, 
  language,
  formatPrice, 
  globalSearch 
}: ProductsTabProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Product, direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });

  const stats = useMemo(() => {
    return {
      total: products.length,
      published: products.filter(p => p.status === 'published').length,
      draft: products.filter(p => p.status === 'draft').length,
      lowStock: products.filter(p => p.stock <= 5).length
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = products.filter(p => {
      const s = globalSearch?.toLowerCase() || '';
      const matchesSearch = (p.name?.toLowerCase() || '').includes(s) || 
                           (p.mmName?.toLowerCase() || '').includes(s) ||
                           (p.sku?.toLowerCase() || '').includes(s);
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });

    result = [...result].sort((a: any, b: any) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [products, selectedCategory, statusFilter, globalSearch, sortConfig]);

  const handleSort = (key: keyof Product) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Summary Stats - Matches Order Tab Style */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {[
          { label: 'Total Products', value: stats.total, icon: Package, color: 'text-blue-500', sub: 'Active in catalog' },
          { label: 'Published', value: stats.published, icon: CheckCircle2, color: 'text-emerald-500', sub: 'Visible to users' },
          { label: 'Drafts', value: stats.draft, icon: Clock, color: 'text-amber-500', sub: 'Waiting for review' },
          { label: 'Low Stock', value: stats.lowStock, icon: AlertTriangle, color: 'text-rose-500', sub: 'Action required' }
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`p-4 rounded-2xl border relative overflow-hidden group ${
              darkMode ? 'bg-surface-container-high/40 border-white/5 shadow-2xl' : 'bg-white border-gray-100 shadow-sm'
            }`}
          >
            <div className={`absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 rounded-full blur-3xl opacity-5 transition-opacity group-hover:opacity-10 ${stat.color.replace('text-', 'bg-')}`} />
            <div className="relative z-10 flex flex-col gap-1.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${darkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div>
                <p className={`text-[9px] font-black uppercase tracking-widest mb-0.5 ${darkMode ? 'text-on-surface-variant/40' : 'text-gray-400'}`}>{stat.label}</p>
                <p className="text-xl font-black tracking-tight">{stat.value}</p>
                <p className="text-[9px] font-bold opacity-30 mt-0.5 uppercase tracking-wider">{stat.sub}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/5 p-4 rounded-[2rem] border border-white/5 backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-black/5 dark:bg-white/5">
            <Filter size={14} className="ml-2 opacity-40" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer pr-4"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.nameEn || cat.name || t(cat.key)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-black/5 dark:bg-white/5">
            {['all', 'published', 'draft'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s as any)}
                className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  statusFilter === s ? 'bg-primary text-surface shadow-lg' : 'text-on-surface/40 hover:text-on-surface'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={() => { setEditingProduct(null); setIsAdding(true); }}
          className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all ${
            darkMode ? 'bg-primary text-surface hover:bg-primary/90' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xl shadow-emerald-500/20'
          }`}
        >
          <Plus size={16} />
          Add New Product
        </button>
      </div>

      {/* Simple List View - More Compact/Modern than Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-6 mb-2">
          <h3 className="text-[10px] font-black uppercase tracking-widest opacity-40">Records: {filteredProducts.length}</h3>
          <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest opacity-40">
            <button onClick={() => handleSort('price')} className="flex items-center gap-1 hover:text-primary">
              Price <ArrowUpDown size={10} />
            </button>
            <button onClick={() => handleSort('stock')} className="flex items-center gap-1 hover:text-primary">
              Stock <ArrowUpDown size={10} />
            </button>
          </div>
        </div>

        <div className="grid gap-2">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product, i) => (
              <motion.div 
                key={`${product.id}-${i}`}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.01 }}
                className={`group px-5 py-4 rounded-[1.5rem] border flex items-center justify-between gap-4 transition-all duration-300 cursor-pointer ${
                  darkMode ? 'bg-surface-container/40 border-white/5 hover:bg-surface-container shadow-sm' : 'bg-white border-gray-100 hover:shadow-xl shadow-sm'
                }`}
                onClick={() => setEditingProduct(product)}
              >
                <div className="flex items-center gap-4 min-w-0 flex-grow">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/5 bg-white/5 shrink-0">
                    <img src={product.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[9px] font-black uppercase tracking-widest ${product.status === 'published' ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {product.status || 'published'}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-white/10" />
                      <span className="text-[9px] font-bold opacity-30 truncate">
                        {categories.find(c => c.id === product.category)?.name || product.category}
                      </span>
                    </div>
                    <motion.h4 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="font-black text-sm tracking-tight truncate max-w-[200px] sm:max-w-md">
                      {product.name || 'Unnamed Product'}
                    </motion.h4>
                    <motion.p 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="text-[10px] font-bold opacity-40 truncate">
                      {product.mmName || product.name || '---'}
                    </motion.p>
                  </div>
                </div>

                <div className="flex items-center gap-6 sm:gap-10">
                  <div className="hidden sm:flex flex-col items-center justify-center bg-black/5 dark:bg-white/5 px-3 py-1 rounded-xl">
                      <p className="text-[9px] font-black uppercase tracking-tight text-on-surface/30">Stock</p>
                      <p className={`text-xs font-black tabular-nums ${product.stock <= 5 ? 'text-rose-500' : ''}`}>
                        {product.stock} <span className="text-[9px] font-bold opacity-40">{product.unit}</span>
                      </p>
                  </div>

                  <div className="text-right whitespace-nowrap min-w-[100px]">
                    <div className="flex flex-col items-end">
                      <p className={`text-sm font-black tracking-tighter ${product.salePrice ? 'text-rose-500' : ''}`}>
                        {formatPrice(product.salePrice || product.price)}
                      </p>
                      {product.salePrice && (
                        <p className="text-[9px] opacity-30 line-through font-bold">
                          {formatPrice(product.price)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-on-surface/40">
                        {product.isAvailable !== false ? 'Available' : 'Sold Out'}
                      </span>
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          const newStatus = product.isAvailable === false;
                          toast.promise(updateProduct(product.id, { isAvailable: newStatus }), {
                            loading: 'Updating...',
                            success: `Product is now ${newStatus ? 'Available' : 'Sold Out'}`,
                            error: 'Failed to update status'
                          });
                        }}
                        className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ${
                          product.isAvailable !== false ? 'bg-emerald-500' : 'bg-gray-300'
                        }`}
                      >
                        <motion.div 
                          className="w-4 h-4 bg-white rounded-full shadow-sm"
                          animate={{ x: product.isAvailable !== false ? 18 : 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      </motion.button>
                    </div>
                    <motion.button 
                      whileHover={{ scale: 1.2, backgroundColor: 'rgba(244, 63, 94, 0.1)' }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        toast(language === 'mm' ? 'ပစ္စည်းကို ဖျက်မှာ သေချာပါသလား?' : `Delete ${product.name}?`, {
                          action: {
                            label: language === 'mm' ? 'ဖျက်မည်' : 'Delete',
                            onClick: () => {
                              toast.promise(deleteProduct(product.id), {
                                loading: 'Deleting...',
                                success: 'Product deleted',
                                error: 'Failed'
                              });
                            }
                          },
                          cancel: {
                            label: 'Cancel'
                          }
                        });
                      }}
                      className="p-3 rounded-xl text-rose-500 transition-colors relative z-20"
                      title="Delete Product"
                    >
                      <Trash2 size={18} />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}

            {filteredProducts.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-20 text-center rounded-[3rem] border-2 border-dashed border-white/5 opacity-30"
              >
                <Package size={48} className="mx-auto mb-4 opacity-20" />
                <h3 className="text-lg font-black uppercase tracking-widest">No Products Found</h3>
                <p className="text-xs font-bold mt-1">Try adjusting your filters or search query</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Modal */}
      <AddProductModal 
        isOpen={isAdding || !!editingProduct} 
        onClose={() => { setIsAdding(false); setEditingProduct(null); }} 
        addProduct={addProduct} 
        updateProduct={updateProduct}
        product={editingProduct}
        categories={categories} 
        darkMode={darkMode} 
        t={t} 
      />
    </div>
  );
}
