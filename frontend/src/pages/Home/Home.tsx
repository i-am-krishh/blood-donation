import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { 
  Heart,  
  Shield, 
  Calendar, 
  MapPin, 
  ChevronDown, 
  Clock, 
  Phone, 
  ArrowRight,
  Users,
  Target,
  Zap,
  Star,
  Activity,
  Globe,
  Sparkles
} from 'lucide-react';

const Home = () => {
  // Remove this line:
  // const [isVisible, setIsVisible] = useState(false);
  
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [stats, setStats] = useState({
    lives: 0,
    donors: 0,
    locations: 0
  });

  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  useEffect(() => {
    // Remove this line:
    // setIsVisible(true);

    // Animate stats counter
    const animateStats = () => {
      const targets = { lives: 15420, donors: 8750, locations: 45 };
      const duration = 2000;
      const steps = 60;
      const stepTime = duration / steps;

      let current = { lives: 0, donors: 0, locations: 0 };
      const increment = {
        lives: targets.lives / steps,
        donors: targets.donors / steps,
        locations: targets.locations / steps
      };

      const timer = setInterval(() => {
        current.lives = Math.min(current.lives + increment.lives, targets.lives);
        current.donors = Math.min(current.donors + increment.donors, targets.donors);
        current.locations = Math.min(current.locations + increment.locations, targets.locations);

        setStats({
          lives: Math.floor(current.lives),
          donors: Math.floor(current.donors),
          locations: Math.floor(current.locations)
        });

        if (current.lives >= targets.lives) {
          clearInterval(timer);
        }
      }, stepTime);
    };

    setTimeout(animateStats, 1000);
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Regular Donor",
      text: "Donating blood has been one of the most rewarding experiences. Knowing I'm helping save lives gives me incredible purpose.",
      image: "👩‍⚕️",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "Emergency Recipient",
      text: "Blood donors saved my life after my accident. I can't thank the community enough. Now I donate regularly to pay it forward.",
      image: "👨‍💼",
      rating: 5
    },
    {
      name: "Dr. Emily Rodriguez",
      role: "Hematologist",
      text: "Every donation makes a real difference. In our hospital, we see daily how generous donors help patients recover and thrive.",
      image: "👩‍⚕️",
      rating: 5
    }
  ];

  const benefits = [
    {
      icon: Activity,
      title: "Health Check",
      description: "Free comprehensive health screening with every donation including blood pressure, pulse, and hemoglobin levels.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Star,
      title: "Recognition",
      description: "Join our exclusive donor rewards program and earn points for gifts, merchandise, and VIP events.",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Shield,
      title: "Safe Process",
      description: "All equipment is sterile and single-use. Our certified medical staff ensures your complete safety.",
      color: "from-green-500 to-emerald-500"
    }
  ];

  const impactStats = [
    {
      icon: Heart,
      label: "Lives Saved",
      value: stats.lives,
      suffix: "+",
      color: "text-red-500"
    },
    {
      icon: Users,
      label: "Active Donors",
      value: stats.donors,
      suffix: "+",
      color: "text-blue-500"
    },
    {
      icon: Globe,
      label: "Locations",
      value: stats.locations,
      suffix: "+",
      color: "text-green-500"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 overflow-hidden">
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-red-200 to-pink-200 rounded-full opacity-20 blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -150, 0],
            y: [0, 100, 0],
            rotate: [360, 180, 0]
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-blue-200 to-purple-200 rounded-full opacity-20 blur-3xl"
        />
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 pb-10">
        <motion.div 
          style={{ y, opacity }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full"
        >
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-center lg:text-left"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="inline-flex items-center px-4 py-2 bg-red-100 rounded-full text-red-600 font-medium mb-6"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Save Lives Today
              </motion.div>
              
              <motion.h1 
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="text-4xl sm:text-5xl lg:text-7xl font-bold text-gray-900 leading-tight mb-6"
              >
                Be a{' '}
                <motion.span 
                  className="text-red-600 relative inline-block"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  Hero
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 1, delay: 1.2 }}
                    className="absolute -bottom-2 left-0 h-1 bg-gradient-to-r from-red-600 to-pink-600 rounded-full"
                  />
                </motion.span>
              </motion.h1>
              
              <motion.p 
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed max-w-2xl"
              >
                Every 2 seconds someone needs blood. Your single donation can save up to 3 lives.
                Join our community of heroes making a real difference.
              </motion.p>

              <motion.div 
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 1 }}
                className="flex flex-col sm:flex-row gap-4 mb-12"
              >
                <motion.button 
                  whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(220, 38, 38, 0.3)" }}
                  whileTap={{ scale: 0.95 }}
                  className="group bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-4 rounded-full text-lg font-semibold shadow-xl flex items-center justify-center transition-all duration-300"
                >
                  <Calendar className="mr-2 h-5 w-5" />
                  Schedule Donation
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </motion.div>
                </motion.button>
                
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="group border-2 border-red-600 text-red-600 px-8 py-4 rounded-full text-lg font-semibold hover:bg-red-600 hover:text-white flex items-center justify-center transition-all duration-300"
                >
                  <MapPin className="mr-2 h-5 w-5" />
                  Find Location
                </motion.button>
              </motion.div>

              {/* Stats */}
              <motion.div 
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 1.2 }}
                className="grid grid-cols-3 gap-4 sm:gap-8 pt-8 border-t border-gray-200"
              >
                {impactStats.map((stat, index) => (
                  <motion.div 
                    key={index}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 1.4 + index * 0.1 }}
                    className="text-center"
                  >
                    <div className="flex items-center justify-center mb-2">
                      <stat.icon className={`h-6 w-6 ${stat.color} mr-2`} />
                    </div>
                    <motion.div 
                      className={`text-2xl sm:text-3xl font-bold ${stat.color}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 1.6 + index * 0.1 }}
                    >
                      {stat.value.toLocaleString()}{stat.suffix}
                    </motion.div>
                    <div className="text-sm sm:text-base text-gray-600">{stat.label}</div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right Content - Impact Card */}
            <motion.div
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative"
            >
              <motion.div
                animate={{ rotate: [0, 5, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-gradient-to-r from-red-600 to-pink-600 rounded-3xl opacity-20 blur-xl"
              />
              
              <motion.div 
                whileHover={{ 
                  rotate: 0,
                  scale: 1.02,
                  boxShadow: "0 25px 50px rgba(0, 0, 0, 0.15)"
                }}
                className="relative bg-white rounded-3xl shadow-2xl p-6 sm:p-8 transform -rotate-2 transition-all duration-500"
              >
                <div className="text-center">
                  <motion.div 
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, 10, 0]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-red-100 to-red-200 rounded-full mx-auto mb-6 flex items-center justify-center"
                  >
                    <Heart className="h-12 w-12 sm:h-16 sm:w-16 text-red-600" />
                  </motion.div>
                  
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Your Donation Impact</h3>
                  
                  <div className="space-y-4">
                    {[
                      { type: "Red Blood Cells", impact: "2 lives saved", icon: Target },
                      { type: "Platelets", impact: "1 life saved", icon: Zap },
                      { type: "Plasma", impact: "Multiple patients", icon: Activity }
                    ].map((item, index) => (
                      <motion.div 
                        key={index}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                        whileHover={{ scale: 1.02, x: 5 }}
                        className="flex items-center justify-between p-3 bg-red-50 rounded-lg cursor-pointer transition-all duration-200"
                      >
                        <div className="flex items-center">
                          <item.icon className="h-5 w-5 text-red-500 mr-3" />
                          <span className="font-semibold text-red-600">{item.impact}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <ChevronDown className="h-6 w-6 text-gray-400" />
        </motion.div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 sm:py-20 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Why Donate With Us?</h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              We make blood donation safe, rewarding, and convenient. Join thousands of donors who trust us with their generous gift.
            </p>
          </motion.div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {benefits.map((benefit, index) => (
              <motion.div 
                key={index}
                variants={itemVariants}
                whileHover={{ 
                  y: -10,
                  scale: 1.02,
                  boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)"
                }}
                className="group text-center p-6 sm:p-8 rounded-2xl bg-white border border-gray-100 hover:border-gray-200 transition-all duration-300 cursor-pointer"
              >
                <motion.div 
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                  className={`w-16 h-16 bg-gradient-to-br ${benefit.color} rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg`}
                >
                  <benefit.icon className="h-8 w-8 text-white" />
                </motion.div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{benefit.title}</h3>
                <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-gray-50 to-red-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Stories That Inspire</h2>
            <p className="text-lg sm:text-xl text-gray-600">Hear from our amazing donor community</p>
          </motion.div>

          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative bg-white rounded-2xl shadow-xl p-6 sm:p-8 md:p-12"
          >
            <AnimatePresence mode="wait">
              <motion.div 
                key={activeTestimonial}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <div className="text-4xl sm:text-6xl mb-6">{testimonials[activeTestimonial].image}</div>
                
                <div className="flex justify-center mb-4">
                  {[...Array(testimonials[activeTestimonial].rating)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3, delay: i * 0.1 }}
                    >
                      <Star className="h-5 w-5 text-yellow-400 fill-current" />
                    </motion.div>
                  ))}
                </div>
                
                <blockquote className="text-lg sm:text-xl text-gray-700 italic mb-6 leading-relaxed">
                  "{testimonials[activeTestimonial].text}"
                </blockquote>
                
                <div className="font-semibold text-gray-900 text-lg">{testimonials[activeTestimonial].name}</div>
                <div className="text-red-600 font-medium">{testimonials[activeTestimonial].role}</div>
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-center mt-8 space-x-2">
              {testimonials.map((_, index) => (
                <motion.button
                  key={index}
                  onClick={() => setActiveTestimonial(index)}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === activeTestimonial 
                      ? 'bg-red-600 scale-125' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Emergency CTA */}
      <section className="py-16 sm:py-20 bg-gradient-to-r from-red-600 to-red-700 relative overflow-hidden">
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-red-500 to-pink-500 opacity-30"
        />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <motion.h2 
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-3xl sm:text-4xl font-bold text-white mb-6"
            >
              🚨 Blood Shortage Alert!
            </motion.h2>
            
            <p className="text-lg sm:text-xl text-red-100 mb-8 leading-relaxed">
              We're experiencing critically low blood supplies. Your donation today could save a life tonight.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <motion.button 
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 20px 40px rgba(255, 255, 255, 0.3)"
                }}
                whileTap={{ scale: 0.95 }}
                className="group bg-white text-red-600 px-8 py-4 rounded-full text-lg font-semibold shadow-lg flex items-center justify-center transition-all duration-300"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Clock className="mr-2 h-5 w-5" />
                </motion.div>
                Donate Now - 15 Min
              </motion.button>
              
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group border-2 border-white text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-white hover:text-red-600 flex items-center justify-center transition-all duration-300"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Phone className="mr-2 h-5 w-5" />
                </motion.div>
                Call Emergency Line
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;