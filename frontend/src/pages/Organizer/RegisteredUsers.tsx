import React, { useState, useEffect } from 'react';
import { Search, Filter, Phone, Mail, Calendar, MapPin, Clock, Users } from 'lucide-react';
import { Button } from '../../components/ui/button';

interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  bloodType: string;
  registrationDate: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

interface Camp {
  id: string;
  name: string;
  date: string;
  venue: string;
  time: string;
  registeredCount: number;
  capacity: number;
}

interface DonorRegistration {
  id: string;
  donorId: {
    id: string;
    name: string;
    email: string;
    phoneNumber: string;
    bloodType: string;
  };
  registrationDate: string;
  status: 'registered' | 'donated' | 'cancelled';
}

const RegisteredUsers = () => {
  const [camps, setCamps] = useState<Camp[]>([]);
  const [selectedCamp, setSelectedCamp] = useState<string>('');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [bloodTypeFilter, setBloodTypeFilter] = useState<string>('all');

  useEffect(() => {
    fetchCamps();
  }, []);

  useEffect(() => {
    if (selectedCamp) {
      fetchRegisteredUsers(selectedCamp);
    }
  }, [selectedCamp]);

  const fetchCamps = async () => {
    try {
      const response = await fetch('/api/camps/organizer', {  // Changed from /api/organizer/camps
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch camps');

      const data = await response.json();
      // Transform the data to match the Camp interface
      const formattedCamps = data.map(camp => ({
        id: camp._id,
        name: camp.name,
        date: camp.date,
        venue: camp.venue,
        time: camp.time,
        registeredCount: camp.registeredDonors?.length || 0,
        capacity: camp.capacity
      }));
      
      setCamps(formattedCamps);
      if (formattedCamps.length > 0) {
        setSelectedCamp(formattedCamps[0].id);
      }
      setIsLoading(false);
    } catch (err) {
      setError('Failed to load camps. Please try again later.');
      setIsLoading(false);
    }
  };

  const fetchRegisteredUsers = async (campId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/camps/${campId}/registrations`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
  
      if (!response.ok) throw new Error('Failed to fetch registrations');
      
      const registrations: DonorRegistration[] = await response.json();
      const formattedUsers = registrations.map(reg => {
        if (!reg.donorId.id) {
          console.error('Missing ID for registration:', reg);
        }
        return {
          id: reg.donorId.id,
          name: reg.donorId.name,
          email: reg.donorId.email,
          phoneNumber: reg.donorId.phoneNumber,
          bloodType: reg.donorId.bloodType,
          registrationDate: new Date(reg.registrationDate).toLocaleDateString(),
          status: reg.status
        };
      });
  
      setUsers(formattedUsers);
      setIsLoading(false);
    } catch (err) {
      setError('Failed to load registered users. Please try again later.');
      setIsLoading(false);
    }
  };

  // Update the users list rendering
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phoneNumber.includes(searchTerm);
      
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesBloodType = bloodTypeFilter === 'all' || user.bloodType === bloodTypeFilter;
  
    return matchesSearch && matchesStatus && matchesBloodType;
  });

  const selectedCampData = camps.find(camp => camp.id === selectedCamp);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Registered Users</h1>

      {/* Camp Selection */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Camp
          </label>
          <select
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            value={selectedCamp}
            onChange={(e) => setSelectedCamp(e.target.value)}
          >
            {camps.map((camp) => (
              <option key={camp.id} value={camp.id}>
                {camp.name} - {new Date(camp.date).toLocaleDateString('en-GB')}
              </option>
            ))}
          </select>
        </div>

        {selectedCampData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center text-gray-600">
              <Calendar className="w-4 h-4 mr-2" />
              <span>{new Date(selectedCampData.date).toLocaleDateString('en-GB')}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <MapPin className="w-4 h-4 mr-2" />
              <span>{selectedCampData.venue}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Clock className="w-4 h-4 mr-2" />
              <span>{selectedCampData.time}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Users className="w-4 h-4 mr-2" />
              <span>{selectedCampData.registeredCount}/{selectedCampData.capacity} Registered</span>
            </div>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Blood Type
              </label>
              <select
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                value={bloodTypeFilter}
                onChange={(e) => setBloodTypeFilter(e.target.value)}
              >
                <option value="all">All Blood Types</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      {/* Users List */}
      {filteredUsers.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <div className="text-gray-600">No registered users found.</div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  {user.name}
                </h3>
                <span
                  className={`px-2 py-1 rounded text-sm ${
                    user.status === 'confirmed'
                      ? 'bg-green-100 text-green-800'
                      : user.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-gray-600">
                  <Mail className="w-4 h-4 mr-2" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Phone className="w-4 h-4 mr-2" />
                  <span>{user.phoneNumber}</span>
                </div>
                <div className="text-gray-600">
                  Blood Type: {user.bloodType}
                </div>
                <div className="text-sm text-gray-500">
                  Registered: {new Date(user.registrationDate).toLocaleDateString('en-GB')}
                </div>
              </div>

              {user.status === 'pending' && (
                <div className="flex space-x-2">
                  <Button
                    onClick={() => handleStatusChange(user.id, 'confirmed')}
                    className="flex-1"
                  >
                    Confirm
                  </Button>
                  <Button
                    onClick={() => handleStatusChange(user.id, 'cancelled')}
                    variant="outline"
                    className="flex-1 text-red-600 hover:text-red-700"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RegisteredUsers;

const getStatusColor = (status: string) => {
  switch (status) {
    case 'registered':
      return 'bg-blue-100 text-blue-800';
    case 'donated':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};