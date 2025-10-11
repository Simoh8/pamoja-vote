import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

const iconMap = {
  error: AlertCircle,
  success: CheckCircle,
  info: Info,
  warning: AlertTriangle,
};

const Alert = ({
  type = 'info',
  title,
  message,
  className = '',
  onDismiss,
  show = true,
  dismissible = true,
}) => {
  if (!show) return null;

  const Icon = iconMap[type] || Info;
  
  const variants = {
    error: 'bg-red-50 border-red-200 text-red-700',
    success: 'bg-green-50 border-green-200 text-green-700',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700',
  };

  const iconColors = {
    error: 'text-red-400',
    success: 'text-green-400',
    warning: 'text-yellow-400',
    info: 'text-blue-400',
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className={`rounded-lg border p-4 ${variants[type]} ${className}`}
          role="alert"
        >
          <div className="flex">
            <div className="flex-shrink-0">
              <Icon className={`h-5 w-5 ${iconColors[type]}`} aria-hidden="true" />
            </div>
            <div className="ml-3 flex-1">
              {title && (
                <h3 className="text-sm font-medium">
                  {title}
                </h3>
              )}
              {message && (
                <div className="mt-1.5 text-sm">
                  <p>{message}</p>
                </div>
              )}
            </div>
            {dismissible && (
              <div className="ml-4 flex-shrink-0">
                <button
                  type="button"
                  className="inline-flex rounded-md bg-transparent text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={onDismiss}
                >
                  <span className="sr-only">Dismiss</span>
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Alert;
