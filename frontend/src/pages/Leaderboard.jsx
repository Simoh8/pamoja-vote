import { motion } from 'framer-motion';

const Leaderboard = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Leaderboard</h1>
      <div className="text-center py-12">
        <p className="text-gray-600">Leaderboard page - Coming soon!</p>
      </div>
    </motion.div>
  );
};

export default Leaderboard;
