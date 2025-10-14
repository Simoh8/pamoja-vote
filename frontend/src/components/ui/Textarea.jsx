import React from 'react';

const Textarea = ({
  id,
  label,
  value,
  onChange,
  placeholder = '',
  error = '',
  helperText = '',
  rows = 4,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <textarea
          id={id}
          value={value}
          onChange={onChange}
          rows={rows}
          className={`block w-full px-4 py-3 border ${
            error
              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
          } rounded-xl bg-white/50 backdrop-blur-sm placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200 resize-none ${className}`}
          placeholder={placeholder}
          {...props}
        />
      </div>
      {error ? (
        <p className="mt-1.5 text-sm text-red-600">{error}</p>
      ) : helperText ? (
        <p className="mt-1.5 text-sm text-gray-500">{helperText}</p>
      ) : null}
    </div>
  );
};

export default Textarea;
