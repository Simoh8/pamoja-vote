import React from 'react';
import { motion } from 'framer-motion';

const Card = ({
  children,
  className = '',
  padding = 'p-6',
  hoverable = false,
  onClick,
  ...props
}) => {
  const baseStyles = 'rounded-2xl bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg overflow-hidden';
  const hoverStyles = hoverable ? 'hover:shadow-xl hover:border-white/30 transition-all duration-300' : '';
  
  const cardContent = (
    <div className={`${baseStyles} ${padding} ${hoverStyles} ${className}`} {...props}>
      {children}
    </div>
  );

  if (onClick) {
    return (
      <motion.div 
        whileHover={hoverable ? { y: -2 } : {}}
        whileTap={{ scale: 0.99 }}
        onClick={onClick}
        className="cursor-pointer"
      >
        {cardContent}
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {cardContent}
    </motion.div>
  );
};

Card.Header = ({ children, className = '' }) => (
  <div className={`border-b border-gray-100 pb-4 mb-4 ${className}`}>
    {children}
  </div>
);

Card.Body = ({ children, className = '' }) => (
  <div className={className}>
    {children}
  </div>
);

Card.Footer = ({ children, className = '' }) => (
  <div className={`border-t border-gray-100 pt-4 mt-4 ${className}`}>
    {children}
  </div>
);

export default Card;
