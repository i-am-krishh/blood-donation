import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Droplets, Send, CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { cn } from '../../lib/utils';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Validate form
    if (!email) {
      setError('Please enter your email address');
      setIsSubmitting(false);
      return;
    }
    
    // Simulate password reset process
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      // Handle password reset logic here
      console.log('Password reset requested for:', email);
    }, 1500);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100
      }
    }
  };

  // Floating blood drops animation
  const floatingDrops = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 30 + 20,
    duration: Math.random() * 5 + 5
  }));

  return (
    <div className="min-h-screen pt-20 pb-16 bg-gradient-to-b from-white to-red-50 flex items-center justify-center relative overflow-hidden">
      {/* Floating blood drops background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {floatingDrops.map((drop) => (
          <motion.div
            key={drop.id}
            className="absolute opacity-10"
            style={{
              top: `${drop.y}%`,
              left: `${drop.x}%`,
            }}
            animate={{
              y: [0, -15, 0],
              rotate: [0, 5, 0, -5, 0]
            }}
            transition={{
              duration: drop.duration,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            <Droplets className="text-red-600" size={drop.size} />
          </motion.div>
        ))}
      </div>

      <motion.div 
        className="max-w-md w-full mx-auto px-4 sm:px-6 relative z-10"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div 
          className="bg-white rounded-2xl shadow-xl p-8 relative overflow-hidden"
          variants={itemVariants}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-100 rounded-bl-full -mt-8 -mr-8 opacity-50"></div>
          
          <motion.div 
            className="text-center mb-8 relative z-10"
            variants={itemVariants}
          >
            <motion.div 
              className="inline-block mb-4"
              animate={{ 
                scale: [1, 1.05, 1],
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Droplets className="text-red-600 w-16 h-16 mx-auto" />
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password</h1>
            <p className="text-gray-600">{isSubmitted ? 'Reset link sent!' : 'Enter your email to reset your password'}</p>
          </motion.div>

          {error && (
            <motion.div 
              className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 500 }}
            >
              {error}
            </motion.div>
          )}

          {!isSubmitted ? (
            <motion.form 
              onSubmit={handleSubmit}
              className="space-y-6 relative z-10"
              variants={itemVariants}
            >
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={email}
                    onChange={handleChange}
                    className="block w-full pl-10 px-4 py-3 text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 transition-colors duration-300"
                    placeholder="Email Address"
                    required
                  />
                </div>
              </div>

              <div>
                <Button
                  type="submit"
                  className={cn(
                    "w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium shadow-lg transition-all duration-300 flex items-center justify-center gap-2",
                    isSubmitting && "opacity-70 cursor-not-allowed"
                  )}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      <span>Send Reset Link</span>
                    </>
                  )}
                </Button>
              </div>

              <div className="text-center text-sm text-gray-600">
                <Link
                  to="/login"
                  className="font-medium text-red-600 hover:text-red-700 transition-colors duration-300 inline-flex items-center gap-1"
                >
                  <ArrowLeft className="h-3 w-3" /> Back to Login
                </Link>
              </div>
            </motion.form>
          ) : (
            <motion.div
              className="space-y-6 relative z-10 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4"
              >
                <CheckCircle className="text-green-600 w-8 h-8" />
              </motion.div>
              
              <p className="text-gray-700 mb-4">
                We've sent a password reset link to <span className="font-semibold">{email}</span>. Please check your inbox and follow the instructions to reset your password.
              </p>
              
              <p className="text-sm text-gray-500 mb-6">
                If you don't receive an email within a few minutes, please check your spam folder or try again.
              </p>
              
              <div>
                <Button
                  type="button"
                  onClick={() => {
                    setIsSubmitted(false);
                    setEmail('');
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-lg font-medium shadow-lg transition-all duration-300 inline-flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span>Try Again</span>
                </Button>
              </div>
            </motion.div>
          )}
        </motion.div>

        <motion.div 
          className="mt-8 text-center text-sm text-gray-500"
          variants={itemVariants}
        >
          &copy; {new Date().getFullYear()} <span className="text-red-600">BloodConnect</span>. All rights reserved.
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;