import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, MapPin, Clock, User, Droplet, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';

interface Donation {
  id: string;
  userId: string;
  userName: string;
  bloodType: string;
  units: number;
  donationDate: string;
  campId: string;
  campName: string;
  status: 'pending' | 'verified' | 'rejected';
  notes?: string;
  hemoglobinLevel?: number;
  bloodPressure?: string;
  weight?: number;
}

interface Camp {
  id: string;
  name: string;
  date: string;
  venue: string;
  time: string;
}

interface VerificationFormData {
  status: 'verified' | 'rejected';
  notes: string;
  hemoglobinLevel: number;
  bloodPressure: string;
  weight: number;
  units: number;
}

const VerifyDonations = () => {
  const [camps, setCamps] = useState<Camp[]>([]);
  const [selectedCamp, setSelectedCamp] = useState<string>('');
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [bloodTypeFilter, setBloodTypeFilter] = useState<string>('all');
  const [notes, setNotes] = useState<{ [key: string]: string }>({});
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [formData, setFormData] = useState<VerificationFormData>({
    status: 'verified',
    notes: '',
    hemoglobinLevel: 12,
    bloodPressure: '120/80',
    weight: 60,
    units: 1
  });

  useEffect(() => {
    fetchCamps();
  }, []);

  useEffect(() => {
    if (selectedCamp) {
      fetchDonations(selectedCamp);
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
      const formattedCamps = data.map((camp: any) => ({
        id: camp._id,
        name: camp.name,
        date: camp.date,
        venue: camp.venue,
        time: camp.time
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

  const fetchDonations = async (campId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/camps/${campId}/registrations`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch registered donors');
      }

      const { registrations } = await response.json();
      
      // Transform the response data to match the Donation interface
      const formattedDonations = registrations.map((registration: any) => ({
        id: registration.id,
        userId: registration.id, // Using the donor's ID
        userName: registration.name || 'Unknown User',
        bloodType: registration.bloodType || 'Not Specified',
        units: 0,
        donationDate: registration.registrationDate,
        campId: campId,
        campName: selectedCampData?.name || '',
        status: registration.status || 'pending',
        notes: registration.notes || ''
      }));

      setDonations(formattedDonations);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load registered donors. Please try again later.');
      setDonations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (donationId: string, newStatus: 'verified' | 'rejected') => {
    try {
      const response = await fetch(`/api/donations/${donationId}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          status: newStatus,
          notes: notes[donationId] || ''
        })
      });

      if (!response.ok) throw new Error('Failed to update status');

      // Refresh the donations list
      fetchDonations(selectedCamp);
      // Clear notes for this donation
      setNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[donationId];
        return newNotes;
      });
    } catch (err) {
      setError('Failed to update donation status. Please try again.');
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDonation) return;

    try {
      const response = await fetch(`/api/camps/${selectedCamp}/registrations/${selectedDonation.userId}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          status: formData.status,
          notes: formData.notes,
          donationDetails: {
            hemoglobinLevel: formData.hemoglobinLevel,
            bloodPressure: formData.bloodPressure,
            weight: formData.weight,
            units: formData.units
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to verify donation');
      }

      // Refresh the donations list
      await fetchDonations(selectedCamp);

      // Reset form and close modal
      setFormData({
        status: 'verified',
        notes: '',
        hemoglobinLevel: 12,
        bloodPressure: '120/80',
        weight: 60,
        units: 1
      });
      setShowVerificationModal(false);
      setSelectedDonation(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify donation. Please try again.');
    }
  };

  const filteredDonations = donations.filter(donation => {
    const matchesSearch = 
      donation.userName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || donation.status === statusFilter;
    const matchesBloodType = bloodTypeFilter === 'all' || donation.bloodType === bloodTypeFilter;

    return matchesSearch && matchesStatus && matchesBloodType;
  });

  const selectedCampData = camps.find(camp => camp.id === selectedCamp);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'text-green-600';
      case 'rejected':
        return 'text-red-600';
      default:
        return 'text-yellow-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

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
            value={selectedCamp}
            onChange={(e) => setSelectedCamp(e.target.value)}
          >
            {camps.map((camp) => (
              <option key={camp.id} value={camp.id}>
                {camp.name} - {new Date(camp.date).toLocaleDateString()}
              </option>
            ))}
          </select>
        </div>

        {selectedCampData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center text-gray-600">
              <Calendar className="w-4 h-4 mr-2" />
              <span>{new Date(selectedCampData.date).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <MapPin className="w-4 h-4 mr-2" />
              <span>{selectedCampData.venue}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Clock className="w-4 h-4 mr-2" />
              <span>{selectedCampData.time}</span>
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
              placeholder="Search by donor name..."
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
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
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

      {/* Donations List */}
      {filteredDonations.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <div className="text-gray-600">No donations found.</div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Donor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Camp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Blood Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDonations.map((donation) => (
                <tr key={donation.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{donation.userName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{donation.campName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{donation.bloodType}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(donation.donationDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm flex items-center ${getStatusColor(donation.status)}`}>
                      {getStatusIcon(donation.status)}
                      <span className="ml-2 capitalize">{donation.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {donation.status === 'pending' && (
                      <Button
                        onClick={() => {
                          setSelectedDonation(donation);
                          setShowVerificationModal(true);
                        }}
                        className="flex items-center gap-2"
                      >
                        <Droplet className="w-4 h-4" />
                        Mark as Donated
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Verification Modal */}
      {showVerificationModal && selectedDonation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
            <h2 className="text-xl font-semibold mb-4">Verify Donation</h2>
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Donor: <span className="font-medium">{selectedDonation.userName}</span>
              </p>
              <p className="text-sm text-gray-600">
                Camp: <span className="font-medium">{selectedDonation.campName}</span>
              </p>
              <p className="text-sm text-gray-600">
                Blood Type: <span className="font-medium">{selectedDonation.bloodType}</span>
              </p>
            </div>
            <form onSubmit={handleVerificationSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <select
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'verified' | 'rejected' })}
                >
                  <option value="verified">Verified</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hemoglobin Level (g/dL) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    value={formData.hemoglobinLevel}
                    onChange={(e) => setFormData({ ...formData, hemoglobinLevel: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Blood Pressure *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="120/80"
                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    value={formData.bloodPressure}
                    onChange={(e) => setFormData({ ...formData, bloodPressure: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Weight (kg) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Units of Blood *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="2"
                    required
                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    value={formData.units}
                    onChange={(e) => setFormData({ ...formData, units: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Add any additional notes about the donation..."
                />
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowVerificationModal(false);
                    setSelectedDonation(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Submit Verification
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerifyDonations;