import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, MessageCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api';
import { Button, Input, Card, Alert, OtpInput } from '../components/ui';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
    },
  },
};

const formVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 }
};

const Login = () => {
  const [step, setStep] = useState('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
  }, [step]);

  useEffect(() => {
    if (step === 'otp' && resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer, step]);

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    let formatted = '';
    if (value.length > 0) {
      formatted = `+${value.substring(0, 3)}`;
      if (value.length > 3) {
        formatted += ` ${value.substring(3, 6)}`;
      }
      if (value.length > 6) {
        formatted += ` ${value.substring(6, 9)}`;
      }
      if (value.length > 9) {
        formatted += ` ${value.substring(9, 12)}`;
      }
    }
    setPhoneNumber(formatted);
  };

  const sendOTPMutation = useMutation({
    mutationFn: async (phone) => {
      const cleanPhone = phone.replace(/\s+/g, '');
      const result = await authAPI.sendOTP(cleanPhone);
      return result;
    },
    onMutate: () => {
      setLoading(true);
      setError('');
    },
    onSuccess: (data) => {
      setStep('otp');
      setResendTimer(30);

      if (import.meta.env.DEV && data?.otp) {
        setOtp(data.otp);
      }
    },
    onError: (error) => {
      setError(error.response?.data?.message || 'Failed to send OTP. Please try again.');
    },
    onSettled: () => {
      setLoading(false);
    },
  });

  const verifyOTPMutation = useMutation({
    mutationFn: ({ phone, otp }) => {
      const cleanPhone = phone.replace(/\s+/g, '');
      return authAPI.verifyOTP(cleanPhone, otp);
    },
    onMutate: () => {
      setLoading(true);
      setError('');
    },
    onSuccess: (data) => {
      const { user, access_token, refresh_token } = data;
      login(user, { access: access_token, refresh: refresh_token });
      navigate('/');
    },
    onError: (error) => {
      setError(error.response?.data?.message || 'Invalid OTP. Please try again.');
    },
    onSettled: () => {
      setLoading(false);
    },
  });

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;
    sendOTPMutation.mutate(phoneNumber);
  };

  const handleOTPSubmit = async (e) => {
    e?.preventDefault();
    if (!otp || otp.length < 6) return;
    verifyOTPMutation.mutate({ phone: phoneNumber, otp });
  };

  const handleResendOTP = () => {
    if (resendTimer > 0) return;
    sendOTPMutation.mutate(phoneNumber);
  };

  const handleBackToPhone = () => {
    setStep('phone');
    setOtp('');
    setError('');
  };

  const formatPhoneForDisplay = (phone) => {
    if (!phone) return '';
    const lastFour = phone.slice(-4);
    return `•••• ••• ${lastFour}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-white/30 backdrop-blur-sm"></div>
      
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="max-w-md w-full relative z-10"
      >
        {error && (
          <motion.div variants={itemVariants} className="mb-6">
            <Alert 
              type="error" 
              message={error}
              onDismiss={() => setError('')}
              dismissible
            />
          </motion.div>
        )}

        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-center text-white">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4"
              >
                <span className="text-3xl">🇰🇪</span>
              </motion.div>
              <motion.h1 
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="text-3xl font-bold mb-1"
              >
                PamojaVote
              </motion.h1>
              <motion.p 
                initial={{ y: -5, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-blue-100 text-sm"
              >
                {step === 'phone' 
                  ? 'Welcome back! Please sign in to continue.' 
                  : 'Enter the OTP sent to your phone'}
              </motion.p>
            </div>

            {/* Form Content - Simplified without complex animations */}
            <div className="p-6">
              <AnimatePresence mode="wait">
                {step === 'phone' ? (
                  <motion.div
                    key="phone-form"
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={formVariants}
                    transition={{ duration: 0.3 }}
                  >
                    <form onSubmit={handlePhoneSubmit} className="space-y-6">
                      <motion.div variants={itemVariants}>
                        <Input
                          id="phone"
                          label="Phone Number"
                          type="tel"
                          value={phoneNumber}
                          onChange={handlePhoneChange}
                          placeholder="+254 7XX XXX XXX"
                          startIcon={Phone}
                          required
                        />
                      </motion.div>

                      <motion.div variants={itemVariants} className="pt-2">
                        <Button 
                          type="submit" 
                          className="w-full"
                          loading={loading}
                          disabled={!phoneNumber.trim()}
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Send OTP
                        </Button>
                      </motion.div>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div
                    key="otp-form"
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={formVariants}
                    transition={{ duration: 0.3 }}
                  >
                    <form onSubmit={handleOTPSubmit} className="space-y-6">
                      <motion.div variants={itemVariants} className="text-center">
                        <p className="text-sm text-gray-600 mb-1">
                          We've sent a verification code to
                        </p>
                        <p className="font-medium text-gray-900">
                          {formatPhoneForDisplay(phoneNumber)}
                        </p>
                      </motion.div>

                      <motion.div variants={itemVariants}>
                        <div className="mb-4 text-sm font-medium text-gray-700 text-center">
                          Enter OTP
                        </div>
                        
                        {/* OTP Input with visible styling */}
                        <div className="flex justify-center p-2">
                          <OtpInput
                            value={otp}
                            onChange={setOtp}
                            onComplete={handleOTPSubmit}
                            length={6}
                            className="justify-center gap-2"
                            inputClassName="w-12 h-12 text-lg font-semibold border-2 border-blue-500 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-200"
                          />
                        </div>
                        
                        <div className="mt-6 text-center">
                          <button
                            type="button"
                            onClick={handleResendOTP}
                            disabled={resendTimer > 0 || loading}
                            className={`text-sm font-medium ${
                              resendTimer > 0 ? 'text-gray-400' : 'text-blue-600 hover:text-blue-800'
                            } transition-colors`}
                          >
                            {resendTimer > 0
                              ? `Resend OTP in ${resendTimer}s`
                              : "Didn't receive code? Resend"}
                          </button>
                        </div>
                      </motion.div>

                      <motion.div variants={itemVariants} className="space-y-3 pt-4">
                        <Button 
                          type="submit" 
                          className="w-full"
                          loading={loading}
                          disabled={otp.length < 6}
                        >
                          Verify & Continue
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="w-full text-sm"
                          onClick={handleBackToPhone}
                          disabled={loading}
                        >
                          <ArrowLeft className="h-4 w-4 mr-1" />
                          Back to phone number
                        </Button>
                      </motion.div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Debug Info */}
            {import.meta.env.DEV && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mx-4 mb-4 text-center"
              >
                <p className="text-xs text-yellow-800">
                  <span className="font-medium">Debug:</span> Step: {step} | OTP: {otp} | Length: {otp.length}
                </p>
              </motion.div>
            )}
          </Card>
        </motion.div>

        {/* Footer */}
        <motion.div 
          variants={itemVariants}
          className="mt-6 text-center text-xs text-gray-500"
        >
          <p>By continuing, you agree to our Terms of Service and Privacy Policy</p>
          <p className="mt-1">© {new Date().getFullYear()} PamojaVote. All rights reserved.</p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;