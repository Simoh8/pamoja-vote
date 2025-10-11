import React from 'react';

const Input = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  error = '',
  helperText = '',
  startIcon: StartIcon,
  endIcon: EndIcon,
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
      <div className="relative rounded-md shadow-sm">
        {StartIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <StartIcon className="h-5 w-5 text-gray-400" />
          </div>
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          className={`block w-full px-4 py-3 ${StartIcon ? 'pl-10' : 'pl-4'} ${
            EndIcon ? 'pr-10' : 'pr-4'
          } border ${
            error
              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
          } rounded-xl bg-white/50 backdrop-blur-sm placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200 ${className}`}
          placeholder={placeholder}
          {...props}
        />
        {EndIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <EndIcon className="h-5 w-5 text-gray-400" />
          </div>
        )}
      </div>
      {error ? (
        <p className="mt-1.5 text-sm text-red-600">{error}</p>
      ) : helperText ? (
        <p className="mt-1.5 text-sm text-gray-500">{helperText}</p>
      ) : null}
    </div>
  );
};

export default Input;
