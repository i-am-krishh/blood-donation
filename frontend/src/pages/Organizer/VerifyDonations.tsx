import React, { useState, useEffect } from 'react';
import { Search, Filter, Phone, Mail, Calendar, MapPin, Clock, Users } from 'lucide-react';
import { Button } from '../../components/ui/button';

interface Camp {
  _id: string;
  name: string;
  date: string;
  venue: string;
  time: string;
  registeredCount: number;
  capacity: number;
}

interface Donor {
  _id: string;
  name: string;
  email: string;
  phone: string;
  bloodType: string;
}

interface Registration {
  _id: string;
  donorId: Donor;
  status: 'registered' | 'donated' | 'cancelled';
  registrationDate: string;
}

const VerifyDonations = () => {
  // State management
  const [camps, setCamps] = useState<Camp[]>([]);
  const [selectedCampId, setSelectedCampId] = useState('');
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'registered' | 'donated' | 'cancelled'>('all');
  const [bloodTypeFilter, setBloodTypeFilter] = useState<string>('all');

  useEffect(() => {
    fetchCamps();
  }, []);

  useEffect(() => {
    if (selectedCampId) {
      fetchRegistrations(selectedCampId);
    }
  }, [selectedCampId]);

  const fetchCamps = async () => {
    try {
      const response = await fetch('/api/camps/organizer', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch camps');

      const data = await response.json();
      setCamps(data);
      if (data.length > 0) {
        setSelectedCampId(data[0]._id);
      }
    } catch (err) {
      setError('Failed to load camps');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRegistrations = async (campId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/camps/${campId}/registrations`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch registrations');

      const data = await response.json();
      setRegistrations(data);
    } catch (err) {
      setError('Failed to load registrations');
      setRegistrations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDonationConfirm = async (registration: Registration) => {
    try {
      // 1. Start verification process
      const verifyResponse = await fetch(
        `/api/verification/start/${registration.donorId._id}/${selectedCampId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        throw new Error(errorData.message || 'Failed to start verification process');
      }
      const verificationData = await verifyResponse.json();

      // 2. Complete donation verification
      const completeResponse = await fetch(
        `/api/verification/${verificationData.verificationId}/complete`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            status: 'completed',
            donationDate: new Date().toISOString(),
            bloodType: registration.donorId.bloodType,
            quantity: 1
          })
        }
      );

      if (!completeResponse.ok) {
        const errorData = await completeResponse.json();
        throw new Error(errorData.message || 'Failed to complete donation verification');
      }

      // 3. Generate certificate
      const certificateResponse = await fetch('/api/certificates/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          donorId: registration.donorId._id,
          campId: selectedCampId,
          donationDate: new Date().toISOString(),
          bloodType: registration.donorId.bloodType
        })
      });

      if (!certificateResponse.ok) {
        console.error('Failed to generate certificate');
      }

      // Refresh registrations list
      await fetchRegistrations(selectedCampId);
    } catch (err) {
      console.error('Donation verification error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process donation');
    }
  };

  const filteredRegistrations = registrations?.filter(registration => {
    const matchesSearch = registration.donorId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registration.donorId.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registration.donorId.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || registration.status === statusFilter;
    const matchesBloodType = bloodTypeFilter === 'all' || registration.donorId.bloodType === bloodTypeFilter;
    return matchesSearch && matchesStatus && matchesBloodType;
  }) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const selectedCampData = camps.find(camp => camp._id === selectedCampId);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Verify Donations</h1>

      {/* Camp Selection */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Camp
          </label>
          <select
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            value={selectedCampId}
            onChange={(e) => setSelectedCampId(e.target.value)}
          >
            {camps.map((camp) => (
              <option key={camp._id} value={camp._id}>
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
            className="flex items-center gap-2"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4" />
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
                onChange={(e) => setStatusFilter(e.target.value as any)}
              >
                <option value="all">All</option>
                <option value="registered">Registered</option>
                <option value="donated">Donated</option>
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
                <option value="all">All</option>
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

      {/* Registrations List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRegistrations.map((registration) => (
          <div key={registration._id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-800">{registration.donorId.name}</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                registration.status === 'donated' ? 'bg-green-100 text-green-800' :
                registration.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {registration.status.charAt(0).toUpperCase() + registration.status.slice(1)}
              </span>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                {registration.donorId.email}
              </div>
              <div className="flex items-center">
                <Phone className="w-4 h-4 mr-2" />
                {registration.donorId.phone}
              </div>
              <div className="flex items-center">
                <span className="font-medium mr-2">Blood Type:</span>
                {registration.donorId.bloodType}
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                {new Date(registration.registrationDate).toLocaleDateString('en-GB')}
              </div>
            </div>
            {registration.status === 'registered' && (
              <Button
                className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white"
                onClick={() => handleDonationConfirm(registration)}
              >
                Confirm Donation
              </Button>
            )}
          </div>
        ))}
      </div>

      {filteredRegistrations.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No registered donors found.
        </div>
      )}
    </div>
  );
};

export default VerifyDonations;