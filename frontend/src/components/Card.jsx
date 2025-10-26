import { motion } from 'framer-motion';

const Card = ({ children, className = '', flatOnMobile = false, ...props }) => {
  return (
    <motion.div
      whileHover={{ scale: flatOnMobile ? 1 : 1.02 }}
      whileTap={{ scale: flatOnMobile ? 1 : 0.99 }}
      className={`
        bg-white rounded-xl sm:rounded-2xl 
        shadow-sm sm:shadow-md 
        border border-gray-200/80 
        p-4 sm:p-6 
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default Card;