import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { User, Lock, LogIn, Eye, EyeOff, Droplets, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { cn } from '../../lib/utils';
import { useUser } from '../../context/UserContext';

interface LoginResponse {
  success: boolean;
  data?: {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      isApproved: boolean;
    };
    token: string;
  };
  message?: string;
}

const Login = () => {
  const navigate = useNavigate();
  const { setUser } = useUser();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      console.log('Sending login request with:', formData);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      let data;
      try {
        data = await response.json();
        console.log('Received response:', data);
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        throw new Error('Server error: Failed to get response from server. Please make sure the server is running.');
      }

      if (!response.ok) {
        throw new Error(data?.message || `Login failed: ${response.statusText}`);
      }

      if (!data.success) {
        throw new Error(data.message || 'Login failed: Invalid response from server');
      }

      if (!data.data?.user || !data.data?.token) {
        console.error('Invalid response structure:', data);
        throw new Error('Invalid response structure from server');
      }

      // Save token
      localStorage.setItem('token', data.data.token);
      
      // Set user in context
      const userData = {
        id: data.data.user.id,
        name: data.data.user.name,
        email: data.data.user.email,
        role: data.data.user.role,
        isApproved: data.data.user.isApproved
      };
      console.log('Setting user data:', userData);
      setUser(userData);
      
      // Check if user is approved
      if (!data.data.user.isApproved && data.data.user.role !== 'admin') {
        throw new Error('Your account is pending approval');
      }
      
      // Redirect based on role
      switch (data.data.user.role) {
        case 'donor':
          navigate('/donor/dashboard');
          break;
        case 'camp_organizer':
          navigate('/organizer/dashboard');
          break;
        case 'admin':
          navigate('/admin/dashboard');
          break;
        default:
          navigate('/');
      }
    } catch (err) {
      console.error('Login error details:', err);
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
      localStorage.removeItem('token'); // Clean up token if login failed
    } finally {
      setIsSubmitting(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-gray-600">Sign in to continue to BloodConnect</p>
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

          <motion.form 
            onSubmit={handleSubmit}
            className="space-y-6 relative z-10"
            variants={itemVariants}
          >
            <div className="space-y-4">
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full pl-10 px-4 py-3 text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 transition-colors duration-300"
                    placeholder="Email Address"
                    required
                  />
                </div>
              </div>
              
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    id="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-10 px-4 py-3 text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 transition-colors duration-300"
                    placeholder="Password"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 transition-colors duration-300"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded transition-colors duration-300"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>

              <Link
                to="/forgot-password"
                className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors duration-300"
              >
                Forgot password?
              </Link>
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
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5" />
                    <span>Sign In</span>
                  </>
                )}
              </Button>
            </div>

            <div className="text-center text-sm text-gray-600">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="font-medium text-red-600 hover:text-red-700 transition-colors duration-300 inline-flex items-center gap-1"
              >
                Sign up <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </motion.form>
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

export default Login;