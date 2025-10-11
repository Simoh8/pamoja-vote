import { motion } from 'framer-motion';

const Card = ({ children, className = '', ...props }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`bg-white rounded-2xl shadow-md border p-6 ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default Card;
