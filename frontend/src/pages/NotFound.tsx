import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { AlertTriangle, Home, ArrowLeft, Droplets } from 'lucide-react';

const NotFound = () => {
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

    // Remove the pulseVariants declaration entirely
    // const pulseVariants = { ... };

    // Floating blood drops animation
    const floatingDrops = Array.from({ length: 10 }, (_, i) => ({
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
                className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                <motion.div
                    className="text-center mb-12"
                    variants={itemVariants}
                >
                    <motion.div
                        className="inline-block mb-6"
                        animate={{
                            rotate: [0, 10, 0, -10, 0],
                            scale: [1, 1.1, 1]
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    >
                        <AlertTriangle className="text-red-600 w-24 h-24 mx-auto" />
                    </motion.div>

                    {/* Removed the inline style for the pulse animation */}
                    <motion.h1
                        className="text-6xl md:text-8xl font-bold text-gray-900 mb-4"
                        initial={{ scale: 1 }}
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
                    >
                        404
                    </motion.h1>


                    <motion.h2
                        className="text-2xl md:text-3xl font-semibold text-gray-800 mb-6"
                        variants={itemVariants}
                    >
                        Page Not Found
                    </motion.h2>

                    <motion.p
                        className="text-lg text-gray-600 max-w-2xl mx-auto mb-10"
                        variants={itemVariants}
                    >
                        Oops! The page you're looking for doesn't exist or has been moved.
                        Don't worry, you can find your way back to our blood donation community.
                    </motion.p>

                    <motion.div
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                        variants={itemVariants}
                    >
                        <Link to="/">
                            <motion.button
                                className="flex items-center justify-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg font-medium shadow-lg hover:bg-red-700 transition-colors duration-300"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Home className="w-5 h-5" />
                                Return Home
                            </motion.button>
                        </Link>

                        <button
                            onClick={() => window.history.back()}
                            className="flex items-center justify-center gap-2 bg-white text-gray-800 px-6 py-3 rounded-lg font-medium shadow-md border border-gray-200 hover:bg-gray-50 transition-colors duration-300"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Go Back
                        </button>
                    </motion.div>
                </motion.div>

                {/* Blood donation reminder */}
                <motion.div
                    className="mt-16 bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-red-100 shadow-lg"
                    variants={itemVariants}
                    whileHover={{ y: -5 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                >
                    <div className="flex items-center gap-4">
                        <div className="bg-red-100 p-3 rounded-full">
                            <Droplets className="text-red-600 w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Remember</h3>
                            <p className="text-gray-600">Your blood donation can save up to three lives. Schedule a donation today!</p>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default NotFound;