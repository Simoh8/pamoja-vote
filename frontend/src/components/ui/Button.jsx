import React from 'react';
import { motion } from 'framer-motion';

const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  fullWidth = false,
  ...props
}) => {
  const baseStyles = 'font-medium focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all duration-200 flex items-center justify-center border mx-auto';
  
  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-black hover:from-blue-700 hover:to-indigo-700 focus:ring-blue-500 border-transparent shadow-sm hover:shadow-md',
    secondary: 'bg-white text-black hover:bg-gray-50 focus:ring-gray-400 border-gray-300 shadow-sm hover:shadow',
    danger: 'bg-gradient-to-r from-red-600 to-red-700 text-black hover:from-red-700 hover:to-red-800 focus:ring-red-500 border-transparent shadow-sm hover:shadow-md',
    outline: 'bg-transparent text-black hover:bg-blue-50 focus:ring-blue-200 border-blue-600 hover:border-blue-700',
    ghost: 'bg-transparent text-black hover:bg-gray-100 focus:ring-gray-200 border-transparent',
  };

  const sizes = {
    sm: 'px-3 py-2 text-xs rounded-lg min-h-[36px]',
    md: 'px-4 py-2.5 text-sm rounded-xl min-h-[40px]',
    lg: 'px-5 py-3 text-base rounded-xl min-h-[44px]',
  };

  const loadingSpinnerSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4'
  };

  // Fill colors for different variants
  const fillColors = {
    primary: 'text-white',
    secondary: 'text-black',
    danger: 'text-black',
    outline: 'text-black',
    ghost: 'text-black'
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileTap={{ scale: disabled || loading ? 1 : 0.95 }}
      className={`
        ${baseStyles} 
        ${variants[variant]} 
        ${sizes[size]} 
        ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} 
        ${loading ? 'cursor-wait' : ''}
        ${fullWidth ? 'w-full' : 'w-3/5'}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <div className="flex items-center justify-center space-x-2">
          <div className={`animate-spin rounded-full border-2 border-current border-t-transparent ${loadingSpinnerSizes[size]} ${fillColors[variant]}`} />
          <span className={`${fillColors[variant]}`}>Processing...</span>
        </div>
      ) : (
        <span className={fillColors[variant]}>
          {children}
        </span>
      )}
    </motion.button>
  );
};

export default Button;