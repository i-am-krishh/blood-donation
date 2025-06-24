import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, History, PlusCircle, MapPin, Clock, Edit, Trash, CheckSquare, List } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Link, useNavigate } from 'react-router-dom';

interface Camp {
  _id: string;
  name: string;
  venue: string;
  date: string;
  time: string;
  capacity: number;
  registeredDonors: number;
  status: 'pending' | 'approved' | 'cancelled' | 'completed';
  description: string;
  location: string;
  registeredUsers: number;
}

const OrganizerDashboard = () => {
  const navigate = useNavigate();
  const [camps, setCamps] = useState<Camp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    fetchCamps();
  }, []);

  const fetchCamps = async () => {
    try {
      const response = await fetch('/api/camps/organizer', {  // Changed from organizer-camps to organizer
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch camps');
      const data = await response.json();
      setCamps(data.map((camp: {
        _id: string;
        name: string;
        venue: string;
        date: string;
        time: string;
        capacity: number;
        registeredDonors: { length: number };
        status: Camp['status'];
        description: string;
        location: string;
      }) => ({
        _id: camp._id,
        name: camp.name,
        venue: camp.venue,
        date: camp.date,
        time: camp.time,
        capacity: camp.capacity,
        registeredDonors: camp.registeredDonors?.length || 0,
        status: camp.status,
        description: camp.description,
        location: camp.location,
        registeredUsers: camp.registeredDonors?.length || 0
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch camps');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCamp = async (campData: any) => {
    try {
      const response = await fetch('/api/camps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(campData)
      });

      if (!response.ok) throw new Error('Failed to create camp');
      
      fetchCamps(); // Refresh camps list
      setShowCreateModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create camp');
    }
  };

  const handleCancelCamp = async (campId: string) => {
    try {
      const response = await fetch(`/api/camps/${campId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: 'cancelled' })
      });

      if (!response.ok) throw new Error('Failed to cancel camp');
      fetchCamps(); // Refresh the camps list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel camp');
    }
  };

  // Quick action buttons component
  const QuickActions = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Link to="/organizer/manage-camps" className="block">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-xl shadow-md p-6 cursor-pointer border border-transparent hover:border-red-200"
          onClick={(e) => {
            // Prevent the default Link behavior
            e.preventDefault();
            // Use navigate instead of Link to ensure clean navigation
            navigate('/organizer/manage-camps');
          }}
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-red-100 rounded-full">
              <Calendar className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Manage Camps</p>
              <p className="text-2xl font-bold text-gray-900">{camps.length} Camps</p>
            </div>
          </div>
        </motion.div>
      </Link>
      
      <Link to="/organizer/registered-users" className="block">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-xl shadow-md p-6 cursor-pointer border border-transparent hover:border-red-200"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-red-100 rounded-full">
              <Users className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Registered Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {camps.reduce((sum, camp) => sum + camp.registeredUsers, 0)} Users
              </p>
            </div>
          </div>
        </motion.div>
      </Link>

      <Link to="/organizer/verify-donations" className="block">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-xl shadow-md p-6 cursor-pointer border border-transparent hover:border-red-200"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-red-100 rounded-full">
              <CheckSquare className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Verify Donations</p>
              <p className="text-2xl font-bold text-gray-900">Manage</p>
            </div>
          </div>
        </motion.div>
      </Link>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const upcomingCamps = camps.filter(camp => {
    const campDate = new Date(camp.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return campDate >= today && camp.status !== 'cancelled';
  });

  const pastCamps = camps.filter(camp => {
    const campDate = new Date(camp.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return campDate < today || camp.status === 'cancelled';
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Organizer Dashboard</h1>
            <p className="text-gray-600">Manage your blood donation camps and activities</p>
          </div>
          <div className="flex space-x-4">
            <Button
              onClick={() => navigate('/organizer/verify-donations')}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <CheckSquare className="w-5 h-5" />
              <span>Verify Donations</span>
            </Button>
            <Button
              onClick={() => navigate('/organizer/manage-camps')}
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Create New Camp</span>
            </Button>
          </div>
        </div>

        <QuickActions />

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex space-x-1 p-4">
              <Button
                variant={activeTab === 'upcoming' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('upcoming')}
                className="flex items-center space-x-2"
              >
                <Calendar className="w-4 h-4" />
                <span>Upcoming Camps</span>
              </Button>
              <Button
                variant={activeTab === 'past' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('past')}
                className="flex items-center space-x-2"
              >
                <History className="w-4 h-4" />
                <span>Past Camps</span>
              </Button>
            </div>
          </div>

          <div className="p-4">
            <div className="space-y-4">
              {(activeTab === 'upcoming' ? upcomingCamps : pastCamps).map((camp) => (
                <div
                  key={camp._id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{camp.name}</h3>
                      <div className="mt-1 space-y-1">
                        <div className="flex items-center text-gray-600">
                          <MapPin className="w-4 h-4 mr-2" />
                          <span>{camp.venue}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Clock className="w-4 h-4 mr-2" />
                          <span>{new Date(camp.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Users className="w-4 h-4 mr-2" />
                          <span>{camp.registeredUsers} Registrations</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center space-x-1"
                        onClick={() => navigate(`/organizer/manage-camps?edit=${camp._id}`)}
                      >
                        <Edit className="w-4 h-4" />
                        <span>Edit</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                        onClick={() => handleCancelCamp(camp._id)}
                      >
                        <Trash className="w-4 h-4" />
                        <span>Cancel</span>
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      camp.status === 'approved' ? 'bg-green-100 text-green-800' :
                      camp.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      camp.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {camp.status.charAt(0).toUpperCase() + camp.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Create Camp Modal would go here */}
    </div>
  );
};

export default OrganizerDashboard;