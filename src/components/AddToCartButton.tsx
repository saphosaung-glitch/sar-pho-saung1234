import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Check } from 'lucide-react';

interface AddToCartButtonProps {
  onClick: () => void;
  darkMode?: boolean;
  className?: string;
}

export const AddToCartButton: React.FC<AddToCartButtonProps> = ({ onClick, darkMode, className }) => {
  const [isAdded, setIsAdded] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 800);
  };

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={handleClick}
      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 shadow-sm relative overflow-hidden ${
        isAdded 
          ? 'bg-primary text-white' 
          : (darkMode 
              ? 'bg-surface-container-low text-primary hover:bg-primary hover:text-white' 
              : 'bg-surface-container-low text-primary hover:bg-primary hover:text-white')
      } ${className || ''}`}
    >
      <AnimatePresence mode="wait">
        {isAdded ? (
          <motion.div
            key="check"
            initial={{ scale: 0, opacity: 0, rotate: -45 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 800, damping: 25 }}
          >
            <Check size={14} strokeWidth={4} />
          </motion.div>
        ) : (
          <motion.div
            key="plus"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Plus size={14} strokeWidth={3} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};
