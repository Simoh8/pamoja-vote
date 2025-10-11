import React, { useRef, useEffect, useState } from 'react';

const OtpInput = ({
  length = 6,
  value = '',
  onChange,
  onComplete,
  className = '',
  inputClassName = '',
  ...props
}) => {
  const [otp, setOtp] = useState(Array(length).fill(''));
  const inputRefs = useRef([]);

  useEffect(() => {
    if (value) {
      const newOtp = value.split('').slice(0, length);
      setOtp([...newOtp, ...Array(Math.max(0, length - newOtp.length)).fill('')]);
    } else {
      setOtp(Array(length).fill(''));
    }
  }, [value, length]);

  const handleChange = (e, index) => {
    const newValue = e.target.value;
    
    if (newValue !== '' && !/^\d$/.test(newValue)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = newValue;
    setOtp(newOtp);

    // Join the OTP and call onChange
    const otpString = newOtp.join('');
    if (onChange) {
      onChange(otpString);
    }

    // Move to next input or previous if backspace
    if (newValue !== '') {
      if (index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      } else if (index === length - 1) {
        // All digits filled, call onComplete if provided
        if (onComplete && otpString.length === length) {
          onComplete(otpString);
        }
      }
    } else if (index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === ' ' || e.key === 'Spacebar') {
      // Prevent space from scrolling the page
      e.preventDefault();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text/plain').replace(/\D/g, '');
    
    if (pasteData) {
      const newOtp = [...otp];
      let i = 0;
      
      // Start pasting from the current focused input
      const startIndex = inputRefs.current.findIndex((ref) => ref === document.activeElement);
      const startPos = startIndex >= 0 ? startIndex : 0;
      
      for (let j = startPos; j < length && i < pasteData.length; j++) {
        newOtp[j] = pasteData[i];
        i++;
      }
      
      setOtp(newOtp);
      
      // Move focus to the end of pasted content
      const newFocusIndex = Math.min(startPos + pasteData.length, length - 1);
      inputRefs.current[newFocusIndex]?.focus();
      
      // Call callbacks
      const otpString = newOtp.join('');
      if (onChange) {
        onChange(otpString);
      }
      if (onComplete && otpString.length === length) {
        onComplete(otpString);
      }
    }
  };

  return (
    <div className={`flex space-x-2 ${className}`}>
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={otp[index] || ''}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          className={`w-12 h-12 text-center text-2xl font-semibold rounded-lg border-2 ${
            otp[index] ? 'border-blue-500' : 'border-gray-300'
          } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${inputClassName}`}
          autoComplete="one-time-code"
          aria-label={`Digit ${index + 1} of ${length}`}
          {...props}
        />
      ))}
    </div>
  );
};

export default OtpInput;
