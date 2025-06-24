import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Toast, ToastOptions } from '../../components/ui/use-toast';
import { useToast } from '../../components/ui/use-toast';
import { Button } from '../../components/ui/button';
import { useUser } from '../../context/UserContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';

interface UserType {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface Camp {
  _id: string;
  name: string;
  location: string;
  date: string;
  time: string;
  capacity: number;
  registeredDonors: Array<{
    userId: string;
    status: string;
    registrationDate: string;
  }>;
  status: string;
  organizerName: string;
  description: string;
}

interface RegistrationResponse {
  message: string;
  registration: {
    campName: string;
    donorName: string;
    registrationDate: string;
    campDate: string;
    campTime: string;
    campLocation: string;
    status: string;
  };
}

const ToastDescription = ({ data }: { data: RegistrationResponse }) => (
  <div className="space-y-2">
    <p>{data.message}</p>
    <div className="text-sm text-gray-500">
      <p>📅 Date: {new Date(data.registration.campDate).toLocaleDateString()}</p>
      <p>⏰ Time: {data.registration.campTime}</p>
      <p>📍 Location: {data.registration.campLocation}</p>
    </div>
  </div>
);

export default function Camps() {
  const [camps, setCamps] = useState<Camp[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState<string | null>(null);
  const { user } = useUser() as { user: UserType | null };
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCamps();
  }, []);

  const fetchCamps = async () => {
    try {
      const response = await fetch('/api/camps');
      const data = await response.json();
      if (response.ok) {
        setCamps(data.camps.filter((camp: Camp) => camp.status === 'approved'));
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.message || 'Failed to fetch camps'
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Failed to connect to server'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (campId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    setRegistering(campId);
    try {
      const response = await fetch(`/api/camps/${campId}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data: RegistrationResponse = await response.json();

      if (response.ok) {
        toast({
          title: "Registration Successful! 🎉",
          description: <ToastDescription data={data} />
        });
        // Refresh camps list to update registration status
        fetchCamps();
      } else {
        toast({
          variant: "destructive",
          title: "Registration Failed",
          description: data.message
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Failed to connect to server'
      });
    } finally {
      setRegistering(null);
    }
  };

  const isUserRegistered = (camp: Camp) => {
    return camp.registeredDonors.some(donor => donor.userId === user?._id);
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen"><LoadingSpinner /></div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.h1 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-8"
      >
        Available Blood Donation Camps
      </motion.h1>
      
      <AnimatePresence>
        {camps.length === 0 ? (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-gray-600"
          >
            No upcoming camps available at the moment.
          </motion.p>
        ) : (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
          >
            {camps.map(camp => (
              <motion.div
                key={camp._id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-lg shadow-md p-6 transition-shadow hover:shadow-lg"
              >
                <h2 className="text-xl font-semibold mb-2">{camp.name}</h2>
                <p className="text-gray-600 mb-2">
                  <span className="font-medium">Location:</span> {camp.location}
                </p>
                <p className="text-gray-600 mb-2">
                  <span className="font-medium">Date:</span> {new Date(camp.date).toLocaleDateString()}
                </p>
                <p className="text-gray-600 mb-2">
                  <span className="font-medium">Time:</span> {camp.time}
                </p>
                <p className="text-gray-600 mb-2">
                  <span className="font-medium">Organizer:</span> {camp.organizerName}
                </p>
                <p className="text-gray-600 mb-4">
                  <span className="font-medium">Available Slots:</span>{' '}
                  {camp.capacity - camp.registeredDonors.length} of {camp.capacity}
                </p>
                {camp.description && (
                  <p className="text-gray-600 mb-4">
                    <span className="font-medium">Description:</span> {camp.description}
                  </p>
                )}
                
                <Button
                  className={`w-full transition-colors ${
                    isUserRegistered(camp) 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : camp.registeredDonors.length >= camp.capacity 
                      ? 'bg-gray-500 hover:bg-gray-600'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                  onClick={() => handleRegister(camp._id)}
                  disabled={
                    registering === camp._id || 
                    isUserRegistered(camp) || 
                    camp.registeredDonors.length >= camp.capacity
                  }
                >
                  {registering === camp._id ? (
                    <motion.div 
                      className="flex items-center justify-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <LoadingSpinner />
                      <span className="ml-2">Registering...</span>
                    </motion.div>
                  ) : isUserRegistered(camp) ? (
                    'Already Registered'
                  ) : camp.registeredDonors.length >= camp.capacity ? (
                    'Camp Full'
                  ) : (
                    'Register Now'
                  )}
                </Button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}