import { motion } from 'framer-motion';

const Squad = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Squad</h1>
      <div className="text-center py-12">
        <p className="text-gray-600">Squad page - Coming soon!</p>
      </div>
    </motion.div>
  );
};

export default Squad;
