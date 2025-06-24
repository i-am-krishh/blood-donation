import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, Droplets, UserPlus, ArrowRight, Phone, MapPin } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { cn } from '../../lib/utils';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    bloodType: '',
    location: '',
    role: 'donor'
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const roles = ['donor', 'camp_organizer'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
    
    // Validate form
    if (!formData.name || !formData.email || !formData.phoneNumber || !formData.password || 
        !formData.confirmPassword || !formData.bloodType || !formData.location) {
      setError('Please fill in all required fields');
      setIsSubmitting(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          password: formData.password,
          bloodType: formData.bloodType,
          location: formData.location,
          role: formData.role
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Handle successful registration (e.g., redirect to login)
      window.location.href = '/login';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
            <p className="text-gray-600">Join BloodConnect and start saving lives</p>
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
            className="space-y-5 relative z-10"
            variants={itemVariants}
          >
            <div className="space-y-4">
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="block w-full pl-10 px-4 py-3 text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 transition-colors duration-300"
                    placeholder="Full Name"
                    required
                  />
                </div>
              </div>
              
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
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
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    name="phoneNumber"
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className="block w-full pl-10 px-4 py-3 text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 transition-colors duration-300"
                    placeholder="Phone Number"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Droplets className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    name="bloodType"
                    id="bloodType"
                    value={formData.bloodType}
                    onChange={handleChange}
                    className="block w-full pl-10 px-4 py-3 text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 transition-colors duration-300"
                    required
                  >
                    <option value="">Select Blood Type</option>
                    {bloodTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="location"
                    id="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="block w-full pl-10 px-4 py-3 text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 transition-colors duration-300"
                    placeholder="Your Location"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    name="role"
                    id="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="block w-full pl-10 px-4 py-3 text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 transition-colors duration-300"
                    required
                  >
                    {roles.map(role => (
                      <option key={role} value={role}>{role.replace('_', ' ').toUpperCase()}</option>
                    ))}
                  </select>
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

              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    id="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-10 px-4 py-3 text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 transition-colors duration-300"
                    placeholder="Confirm Password"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 transition-colors duration-300"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                className={cn(
                  "w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition-colors duration-300 flex items-center justify-center gap-2",
                  isSubmitting && "opacity-50 cursor-not-allowed"
                )}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    <span>Create Account</span>
                  </>
                )}
              </Button>
            </div>

            <div className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-red-600 hover:text-red-700 font-semibold">
                Sign in <ArrowRight className="inline-block w-4 h-4 ml-1" />
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

export default Signup;