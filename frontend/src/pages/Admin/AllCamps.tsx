import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Calendar, MapPin, Clock, Users, Search, UserCheck, CheckCircle, XCircle, BarChart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaRegCalendarCheck, FaRegCalendarTimes, FaUsersCog } from 'react-icons/fa';
import { Button } from '../../components/ui/button';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useToast } from '../../components/ui/use-toast';
import { format } from 'date-fns';

interface Camp {
  _id: string;
  name: string;
  venue: string;
  date: string;
  time: string;
  capacity: number;
  description: string;
  requirements?: string;
  contactInfo: {
    phone: string;
    email: string;
  };
  location: {
    type: string;
    coordinates: number[];
  };
  organizer: {
    _id: string;
    name: string;
    email: string;
  };
  status: 'pending' | 'approved' | 'cancelled' | 'completed' | 'ongoing';
  actualDonors: string[];
  analytics: {
    totalRegistrations: number;
    actualDonors: number;
    registrationRate: number;
    donationRate: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface CampFormData {
  name: string;
  venue: string;
  date: string;
  time: string;
  capacity: number;
  description: string;
  requirements: string[];
  contactPhone: string;
  contactEmail: string;
  latitude?: number;
  longitude?: number;
  address: string;
  organizerId?: string;
}

const AllCamps = () => {
  const { toast } = useToast();
  const [camps, setCamps] = useState<Camp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [selectedCamp, setSelectedCamp] = useState<Camp | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'cancelled' | 'completed' | 'ongoing'>('all');
  const [dateFilter, setDateFilter] = useState('');
  const [organizers, setOrganizers] = useState<Array<{ _id: string; name: string; email: string }>>([]);
  
  const [formData, setFormData] = useState<CampFormData>({
    name: '',
    venue: '',
    date: '',
    time: '',
    capacity: 50,
    description: '',
    requirements: ['Age between 18-65', 'Weight above 50kg', 'No recent surgeries'],
    contactPhone: '',
    contactEmail: '',
    address: ''
  });

  // Fetch camps with query parameters
  const fetchCamps = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const queryParams = new URLSearchParams();
      if (statusFilter !== 'all') queryParams.append('status', statusFilter);
      if (searchTerm) queryParams.append('search', searchTerm);
      if (dateFilter) queryParams.append('startDate', dateFilter);

      console.log('Fetching camps with params:', queryParams.toString());
      
      const response = await fetch(`/api/camps/admin/all?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.message || `Failed to fetch camps: ${response.status}`);
      }

      const data = await response.json();
      console.log('Received camps data:', data);

      // Sort camps by date (newest first)
      const sortedCamps = data.sort((a: Camp, b: Camp) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setCamps(sortedCamps);
    } catch (err) {
      console.error('Error in fetchCamps:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load camps';
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCamps();
  }, [statusFilter, dateFilter, searchTerm]); // Added searchTerm to dependencies

  const fetchOrganizers = async () => {
    try {
      const response = await fetch('/api/users/organizers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch organizers');
      
      const data = await response.json();
      setOrganizers(data);
    } catch (error) {
      console.error('Error fetching organizers:', error);
    }
  };

  // Handle camp status update
  const handleStatusUpdate = async (campId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/camps/${campId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update status');
      }

      toast({
        title: "Success",
        description: `Camp status updated to ${newStatus}`
      });

      // Refresh camps list
      fetchCamps();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to update status'
      });
    }
  };

  const handleAssignOrganizer = async (campId: string, organizerId: string) => {
    try {
      const response = await fetch(`/api/camps/${campId}/assign-organizer`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ organizerId })
      });

      if (!response.ok) throw new Error('Failed to assign organizer');

      toast({
        title: "Success",
        description: "Organizer assigned successfully"
      });
      fetchCamps();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to assign organizer'
      });
    }
  };

  // Handle analytics view
  const handleViewAnalytics = (camp: Camp) => {
    setSelectedCamp(camp);
    setShowAnalyticsModal(true);
  };

  // Filter camps based on search term
  const filteredCamps = camps.filter(camp => {
    const matchesSearch = searchTerm === '' || 
      camp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      camp.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      camp.description.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center min-h-screen gap-4"
      >
        <XCircle className="w-16 h-16 text-red-500" />
        <h2 className="text-xl font-semibold text-gray-800">Error Loading Camps</h2>
        <p className="text-gray-600">{error}</p>
        <Button onClick={fetchCamps}>Try Again</Button>
      </motion.div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center mb-6"
      >
        <h1 className="text-3xl font-bold text-gray-900">All Blood Donation Camps</h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
      >
        <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total Camps</p>
            <h3 className="text-2xl font-bold">{camps.length}</h3>
          </div>
          <FaUsersCog className="w-8 h-8 text-blue-500" />
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Pending Approval</p>
            <h3 className="text-2xl font-bold">
              {camps.filter(camp => camp.status === 'pending').length}
            </h3>
          </div>
          <Clock className="w-8 h-8 text-yellow-500" />
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Active Camps</p>
            <h3 className="text-2xl font-bold">
              {camps.filter(camp => camp.status === 'approved' || camp.status === 'ongoing').length}
            </h3>
          </div>
          <FaRegCalendarCheck className="w-8 h-8 text-green-500" />
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Completed</p>
            <h3 className="text-2xl font-bold">
              {camps.filter(camp => camp.status === 'completed').length}
            </h3>
          </div>
          <FaRegCalendarTimes className="w-8 h-8 text-gray-500" />
        </div>
      </motion.div>

      <motion.div 
        className="bg-white rounded-lg shadow-lg p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search camps..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <select
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <input
            type="date"
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            placeholder="Filter by date"
          />
        </div>

        <AnimatePresence>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredCamps.map((camp) => (
              <motion.div
                key={camp._id}
                variants={itemVariants}
                className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">{camp.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      camp.status === 'approved' ? 'bg-green-100 text-green-800' :
                      camp.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      camp.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {camp.status.charAt(0).toUpperCase() + camp.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>{camp.venue}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>{format(new Date(camp.date), 'dd/MM/yyyy')}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>{camp.time}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Users className="w-4 h-4 mr-2" />
                      <span>{camp.analytics.totalRegistrations} / {camp.capacity} registered</span>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewAnalytics(camp)}
                      className="flex items-center gap-1"
                    >
                      <BarChart className="w-4 h-4" />
                      Analytics
                    </Button>
                    {camp.status === 'pending' && (
                      <>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleStatusUpdate(camp._id, 'approved')}
                          className="flex items-center gap-1"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleStatusUpdate(camp._id, 'cancelled')}
                          className="flex items-center gap-1"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Analytics Modal */}
      {showAnalyticsModal && selectedCamp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg p-6 max-w-2xl w-full"
          >
            <h2 className="text-2xl font-bold mb-4">Camp Analytics</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">Registration Rate</p>
                <p className="text-2xl font-bold">{selectedCamp.analytics.registrationRate.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Donation Rate</p>
                <p className="text-2xl font-bold">{selectedCamp.analytics.donationRate.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Registrations</p>
                <p className="text-2xl font-bold">{selectedCamp.analytics.totalRegistrations}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Actual Donors</p>
                <p className="text-2xl font-bold">{selectedCamp.analytics.actualDonors}</p>
              </div>
            </div>
            <Button onClick={() => setShowAnalyticsModal(false)}>Close</Button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AllCamps;