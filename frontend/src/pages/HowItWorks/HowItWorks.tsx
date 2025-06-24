import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Droplets, 
  Heart, 
  Coffee, 
  Zap, 
  AlertCircle, 
  ArrowRight,
  User,
  Calendar,
  MapPin,
  Activity,
  ChevronDown,
  ChevronUp,
  Search,
  Info,
  Shield,
  Smile,
  ThumbsUp
} from 'lucide-react';

const HowItWorks = () => {
  const [activeTab, setActiveTab] = useState('process');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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

  const tabVariants = {
    inactive: { opacity: 0.7, y: 0 },
    active: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring', stiffness: 300, damping: 20 }
    }
  };

  const pulseVariants = {
    pulse: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: 'reverse' as const
      }
    }
  };

  // Donation process steps
  const steps = [
    {
      title: "Registration",
      description: "Complete a simple registration form with your basic information and medical history.",
      icon: <User />,
      color: "bg-blue-100 text-blue-600"
    },
    {
      title: "Appointment",
      description: "Schedule a convenient time for your blood donation at one of our centers.",
      icon: <Calendar />,
      color: "bg-purple-100 text-purple-600"
    },
    {
      title: "Arrival & Check-in",
      description: "Arrive at the donation center with a valid ID and check in with our staff.",
      icon: <MapPin />,
      color: "bg-yellow-100 text-yellow-600"
    },
    {
      title: "Health Screening",
      description: "Undergo a brief health check including temperature, blood pressure, and hemoglobin levels.",
      icon: <Activity />,
      color: "bg-green-100 text-green-600"
    },
    {
      title: "Donation Process",
      description: "The actual blood donation takes only 8-10 minutes, while you relax in a comfortable chair.",
      icon: <Droplets />,
      color: "bg-red-100 text-red-600"
    },
    {
      title: "Recovery & Refreshments",
      description: "Enjoy refreshments and take a short rest before leaving the donation center.",
      icon: <Coffee />,
      color: "bg-orange-100 text-orange-600"
    }
  ];

  // Benefits of blood donation
  const benefits = [
    {
      title: "Save Lives",
      description: "A single donation can save up to three lives, helping accident victims, surgical patients, and those with blood disorders.",
      icon: <Heart />,
      color: "from-red-500 to-red-600"
    },
    {
      title: "Free Health Check",
      description: "Each donation includes a mini health screening, checking your pulse, blood pressure, body temperature, and hemoglobin levels.",
      icon: <Activity />,
      color: "from-green-500 to-green-600"
    },
    {
      title: "Reduce Health Risks",
      description: "Regular blood donation can reduce the risk of heart attacks and lower the risk of cancer.",
      icon: <Shield />,
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "Mental Wellbeing",
      description: "The act of helping others by donating blood can improve your mental state and provide a sense of contribution.",
      icon: <Smile />,
      color: "from-yellow-500 to-yellow-600"
    },
    {
      title: "Calorie Burn",
      description: "Donating blood burns approximately 650 calories as your body works to replenish the blood supply.",
      icon: <Zap />,
      color: "from-purple-500 to-purple-600"
    },
    {
      title: "Blood Cell Renewal",
      description: "After donation, your body replaces the blood volume within 48 hours, stimulating the production of new blood cells.",
      icon: <ThumbsUp />,
      color: "from-orange-500 to-orange-600"
    }
  ];

  // FAQs about blood donation
  const faqs = [
    {
      question: "How often can I donate blood?",
      answer: "Most people can donate whole blood every 56 days (8 weeks). If you donate platelets, you can give every 7 days up to 24 times a year."
    },
    {
      question: "Is donating blood safe?",
      answer: "Yes, donating blood is very safe. All equipment used is sterile and disposed of after a single use, eliminating any risk of contracting diseases."
    },
    {
      question: "How long does it take to donate blood?",
      answer: "The entire process takes about an hour, though the actual blood donation only takes 8-10 minutes. The rest of the time is spent on registration, health screening, and recovery."
    },
    {
      question: "Does donating blood hurt?",
      answer: "Most donors report feeling only a brief pinch when the needle is inserted. The actual donation process is typically painless."
    },
    {
      question: "Who can donate blood?",
      answer: "Generally, anyone who is at least 17 years old, weighs at least 110 pounds, and is in good health can donate blood. However, specific eligibility criteria may vary."
    },
    {
      question: "What should I eat before donating blood?",
      answer: "It's recommended to have a healthy, iron-rich meal and plenty of fluids before donating. Avoid fatty foods, which can affect blood tests done on your donation."
    },
    {
      question: "Can I exercise after donating blood?",
      answer: "It's best to avoid strenuous physical activity or heavy lifting for at least 24 hours after donating blood. Light exercise is usually fine after a few hours of rest."
    },
    {
      question: "Will donating blood make me weak?",
      answer: "You might feel slightly tired or lightheaded immediately after donating, but most people recover quickly after resting and having refreshments. Your body replaces the fluid lost from donation within 24 hours."
    },
    {
      question: "Can I donate if I have a tattoo or piercing?",
      answer: "In most cases, you can donate blood after getting a tattoo or piercing, but you may need to wait 3-6 months depending on your location and the conditions under which you received them."
    },
    {
      question: "What happens to my blood after I donate?",
      answer: "After collection, your blood is tested, processed, and separated into components (red cells, platelets, plasma). These components are then distributed to hospitals for patients in need."
    }
  ];

  // Filter FAQs based on search term
  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Toggle FAQ expansion
  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <div className="pt-20 pb-16 bg-gradient-to-b from-white to-red-50 min-h-screen">
      {/* Floating blood drops background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute opacity-10"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              fontSize: `${Math.random() * 2 + 1}rem`
            }}
            animate={{
              y: [0, -15, 0],
              rotate: [0, 5, 0, -5, 0]
            }}
            transition={{
              duration: Math.random() * 5 + 5,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            <Droplets className="text-red-600" size={Math.random() * 30 + 20} />
          </motion.div>
        ))}
      </div>

      <motion.div 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Header Section */}
        <motion.div 
          className="text-center mb-16"
          variants={itemVariants}
        >
          <motion.div 
            className="inline-block mb-4"
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, 0, -5, 0]
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Droplets className="text-red-600 w-16 h-16 mx-auto" />
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">How Blood Donation Works</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Donating blood is a simple process that takes about an hour of your time but can save up to three lives.
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div 
          className="flex flex-wrap justify-center gap-2 md:gap-4 mb-12"
          variants={itemVariants}
        >
          {['process', 'benefits', 'faqs'].map((tab) => (
            <motion.button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-full font-medium text-sm md:text-base transition-all ${activeTab === tab ? 'bg-red-600 text-white shadow-md' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
              variants={tabVariants}
              animate={activeTab === tab ? 'active' : 'inactive'}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {tab === 'process' && 'Donation Process'}
              {tab === 'benefits' && 'Benefits'}
              {tab === 'faqs' && 'FAQs'}
            </motion.button>
          ))}
        </motion.div>

        {/* Content Sections */}
        <AnimatePresence mode="wait">
          {/* Process Section */}
          {activeTab === 'process' && (
            <motion.div 
              key="process"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="mb-20"
            >
              <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-50 rounded-full -mt-32 -mr-32 opacity-50"></div>
                
                <h2 className="text-3xl font-bold text-gray-900 mb-8 relative z-10">The Donation Process</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
                  {steps.map((step, index) => (
                    <motion.div 
                      key={index}
                      className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow duration-300"
                      whileHover={{ y: -5 }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ 
                        opacity: 1, 
                        y: 0,
                        transition: { delay: index * 0.1 }
                      }}
                    >
                      <div className={`${step.color} p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4`}>
                        {step.icon}
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                      <p className="text-gray-600">{step.description}</p>
                      
                      {index < steps.length - 1 && (
                        <div className="hidden md:block absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2">
                          <ArrowRight className="text-gray-300 w-6 h-6" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Timeline visualization for mobile */}
                <div className="md:hidden mt-12 relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-red-200"></div>
                  {steps.map((step, index) => (
                    <motion.div 
                      key={`timeline-${index}`}
                      className="ml-12 mb-8 relative"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ 
                        opacity: 1, 
                        x: 0,
                        transition: { delay: index * 0.1 }
                      }}
                    >
                      <div className="absolute -left-12 top-0 w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white">
                        {index + 1}
                      </div>
                      <h4 className="font-medium text-gray-900">{step.title}</h4>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Benefits Section */}
          {activeTab === 'benefits' && (
            <motion.div 
              key="benefits"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="mb-20"
            >
              <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl shadow-xl p-8 md:p-12 text-white relative overflow-hidden">
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full opacity-10 -mb-32 -ml-32"></div>
                
                <h2 className="text-3xl font-bold mb-8 relative z-10">Benefits of Donating Blood</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
                  {benefits.map((benefit, index) => (
                    <motion.div 
                      key={index}
                      className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
                      whileHover={{ scale: 1.03 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ 
                        opacity: 1, 
                        y: 0,
                        transition: { delay: index * 0.1 }
                      }}
                    >
                      <div className={`bg-gradient-to-r ${benefit.color} p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4`}>
                        {benefit.icon}
                      </div>
                      <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                      <p className="text-red-100">{benefit.description}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Call to action */}
                <motion.div 
                  className="mt-12 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { delay: 0.6 } }}
                  whileHover={{ scale: 1.02 }}
                >
                  <a 
                    href="#" 
                    className="inline-block bg-white text-red-600 font-bold px-8 py-4 rounded-full shadow-lg hover:bg-gray-50 transition-colors duration-300"
                  >
                    Schedule a Donation
                  </a>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* FAQs Section */}
          {activeTab === 'faqs' && (
            <motion.div 
              key="faqs"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="mb-20"
            >
              <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-64 h-64 bg-red-50 rounded-full -mt-32 -ml-32 opacity-50"></div>
                
                <h2 className="text-3xl font-bold text-gray-900 mb-6 relative z-10">Frequently Asked Questions</h2>
                
                {/* Search bar */}
                <div className="relative mb-8 max-w-2xl mx-auto">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-red-500 focus:border-red-500 transition-colors duration-300"
                    placeholder="Search questions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                {/* FAQ list */}
                <div className="space-y-4 relative z-10">
                  {filteredFaqs.length > 0 ? (
                    filteredFaqs.map((faq, index) => (
                      <motion.div 
                        key={index}
                        className="border border-gray-200 rounded-lg overflow-hidden"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ 
                          opacity: 1, 
                          y: 0,
                          transition: { delay: index * 0.05 }
                        }}
                      >
                        <button
                          className={`w-full text-left p-5 flex justify-between items-center ${expandedFaq === index ? 'bg-red-50' : 'bg-white hover:bg-gray-50'} transition-colors duration-300`}
                          onClick={() => toggleFaq(index)}
                        >
                          <span className="font-medium text-gray-900">{faq.question}</span>
                          {expandedFaq === index ? 
                            <ChevronUp className="h-5 w-5 text-red-500" /> : 
                            <ChevronDown className="h-5 w-5 text-gray-500" />}
                        </button>
                        
                        <AnimatePresence>
                          {expandedFaq === index && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden"
                            >
                              <div className="p-5 bg-white border-t border-gray-100">
                                <p className="text-gray-600">{faq.answer}</p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))
                  ) : (
                    <motion.div 
                      className="text-center py-10"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">No questions found matching your search.</p>
                      <button 
                        className="mt-4 text-red-600 hover:text-red-700 font-medium"
                        onClick={() => setSearchTerm('')}
                      >
                        Clear search
                      </button>
                    </motion.div>
                  )}
                </div>

                {/* Additional help */}
                <motion.div 
                  className="mt-12 bg-red-50 rounded-xl p-6 border border-red-100 relative z-10"
                  variants={pulseVariants}
                  animate="pulse"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-red-100 p-3 rounded-full">
                      <AlertCircle className="text-red-600 w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Still have questions?</h3>
                      <p className="text-gray-600">Contact our support team for more information about blood donation.</p>
                      <a 
                        href="/contact" 
                        className="inline-block mt-2 text-red-600 font-medium hover:text-red-700 transition-colors duration-300"
                      >
                        Contact Us
                      </a>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Eligibility Quick Check */}
        <motion.div 
          className="mt-16"
          variants={itemVariants}
        >
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl shadow-xl p-8 md:p-12 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full opacity-5 -mt-32 -mr-32"></div>
            
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Save Lives?</h2>
                <p className="text-gray-300 max-w-xl">
                  Every donation can save up to three lives. Check your eligibility and schedule your donation appointment today.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <motion.a 
                  href="#" 
                  className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-4 rounded-lg shadow-lg transition-colors duration-300 text-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Check Eligibility
                </motion.a>
                
                <motion.a 
                  href="#" 
                  className="bg-white hover:bg-gray-100 text-gray-900 font-bold px-8 py-4 rounded-lg shadow-lg transition-colors duration-300 text-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Find Donation Center
                </motion.a>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default HowItWorks;