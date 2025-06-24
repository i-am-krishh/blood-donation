import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Calendar, MapPin, Clock, Users, Search, UserCheck } from 'lucide-react';
import { Button } from '../../components/ui/button';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useToast } from '../../components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

interface RegisteredDonor {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  bloodType: string;
  registrationDate: string;
  status: string;
}

interface Camp {
  _id: string;
  name: string;
  venue: string;
  date: string;
  time: string;
  capacity: number;
  registeredDonors: Array<{
    donor: string;
    status: string;
    registrationDate: string;
  }>;
  status: 'pending' | 'approved' | 'cancelled';
  description: string;
  requirements: string[];
  contactInfo: {
    phone: string;
    email: string;
  };
  location: {
    coordinates: [number, number];
  };
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
}

const ManageCamps = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [camps, setCamps] = useState<Camp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDonorsModal, setShowDonorsModal] = useState(false);
  const [selectedCamp, setSelectedCamp] = useState<string | null>(null);
  const [donors, setDonors] = useState<RegisteredDonor[]>([]);
  const [loadingDonors, setLoadingDonors] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'cancelled'>('all');
  
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
  });

  useEffect(() => {
    fetchCamps();
    // Cleanup function to reset state when component unmounts
    return () => {
      setCamps([]);
      setShowCreateModal(false);
      setError(null);
    };
  }, []);

  const fetchCamps = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch('/api/camps/organizer', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch camps');
      }

      const data = await response.json();
      // Ensure we have the correct data structure
      const formattedCamps = data.map((camp: any) => ({
        ...camp,
        registeredDonors: Array.isArray(camp.registeredDonors) ? camp.registeredDonors : []
      }));
      setCamps(formattedCamps);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load camps. Please try again later.';
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

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);

      // Basic validation
      if (!formData.name || !formData.venue || !formData.date || !formData.time) {
        throw new Error('Please fill in all required fields');
      }

      const response = await fetch('/api/camps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create camp');
      }

      // Reset form and close modal
      setFormData({
        name: '',
        venue: '',
        date: '',
        time: '',
        capacity: 50,
        description: '',
        requirements: ['Age between 18-65', 'Weight above 50kg', 'No recent surgeries'],
        contactPhone: '',
        contactEmail: '',
      });
      setShowCreateModal(false);
      toast({
        title: "Success",
        description: "Camp created successfully"
      });
      fetchCamps();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create camp. Please try again.';
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (campId: string) => {
    if (!window.confirm('Are you sure you want to delete this camp?')) return;

    try {
      setError(null);
      const response = await fetch(`/api/camps/${campId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete camp');
      }

      toast({
        title: "Success",
        description: "Camp deleted successfully"
      });
      fetchCamps();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete camp. Please try again.';
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage
      });
    }
  };

  const handleEdit = async (campId: string, updatedData: CampFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Check if camp has already started
      const campDate = new Date(`${updatedData.date} ${updatedData.time}`);
      if (campDate < new Date()) {
        throw new Error('Cannot edit a camp that has already started');
      }

      const response = await fetch(`/api/camps/${campId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updatedData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update camp');
      }

      toast({
        title: "Success",
        description: "Camp updated successfully"
      });
      setShowCreateModal(false);
      fetchCamps();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update camp. Please try again.';
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchDonors = async (campId: string) => {
    try {
      setLoadingDonors(true);
      const response = await fetch(`/api/camps/${campId}/registrations`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch donors');
      }

      const data = await response.json();
      setDonors(data.registrations || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch donors';
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage
      });
    } finally {
      setLoadingDonors(false);
    }
  };

  const handleViewDonors = (campId: string) => {
    setSelectedCamp(campId);
    setShowDonorsModal(true);
    fetchDonors(campId);
  };

  const filteredCamps = camps.filter(camp =>
    (statusFilter === 'all' || camp.status === statusFilter) &&
    (camp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    camp.venue.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 bg-white min-h-screen">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Manage Blood Donation Camps</h1>
          <Button
            onClick={() => {
              setFormData({
                name: '',
                venue: '',
                date: '',
                time: '',
                capacity: 50,
                description: '',
                requirements: ['Age between 18-65', 'Weight above 50kg', 'No recent surgeries'],
                contactPhone: '',
                contactEmail: '',
              });
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white"
          >
            <Plus className="w-4 h-4" />
            Create New Camp
          </Button>
        </div>
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
            <Button
              onClick={fetchCamps}
              className="mt-2 bg-red-600 hover:bg-red-700 text-white"
            >
              Retry
            </Button>
          </div>
        )}
      </div>

      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search camps..."
              className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex-shrink-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'approved' | 'cancelled')}
              className="w-full sm:w-40 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 text-sm text-gray-500">
          <div>
            <span className="font-medium">Total Camps:</span> {camps.length}
          </div>
          <div>
            <span className="font-medium">Pending:</span> {camps.filter(c => c.status === 'pending').length}
          </div>
          <div>
            <span className="font-medium">Approved:</span> {camps.filter(c => c.status === 'approved').length}
          </div>
          <div>
            <span className="font-medium">Cancelled:</span> {camps.filter(c => c.status === 'cancelled').length}
          </div>
        </div>
      </div>

      {filteredCamps.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No camps found. Create a new camp to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCamps.map((camp) => (
            <div key={camp._id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{camp.name}</h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    camp.status === 'approved' ? 'bg-green-100 text-green-800' :
                    camp.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {camp.status.charAt(0).toUpperCase() + camp.status.slice(1)}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-gray-500">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span className="text-sm">{camp.venue}</span>
                  </div>
                  <div className="flex items-center text-gray-500">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span className="text-sm">{new Date(camp.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center text-gray-500">
                    <Clock className="w-4 h-4 mr-2" />
                    <span className="text-sm">{camp.time}</span>
                  </div>
                  <div className="flex items-center text-gray-500">
                    <Users className="w-4 h-4 mr-2" />
                    <span className="text-sm">{camp.registeredDonors.length} / {camp.capacity} registered</span>
                  </div>
                </div>

                <div className="text-sm text-gray-500 mb-2">
                  <strong>Contact:</strong> {camp.contactInfo.phone}
                </div>
                <div className="text-sm text-gray-500 mb-4">
                  <strong>Email:</strong> {camp.contactInfo.email}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setFormData({
                        name: camp.name,
                        venue: camp.venue,
                        date: camp.date.split('T')[0],
                        time: camp.time,
                        capacity: camp.capacity,
                        description: camp.description,
                        requirements: camp.requirements,
                        contactPhone: camp.contactInfo.phone,
                        contactEmail: camp.contactInfo.email,
                        latitude: camp.location.coordinates[1],
                        longitude: camp.location.coordinates[0],
                      });
                      setShowCreateModal(true);
                    }}
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleViewDonors(camp._id)}
                  >
                    <UserCheck className="w-4 h-4 mr-1" />
                    View Donors
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleDelete(camp._id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {formData.name ? 'Edit Camp' : 'Create New Camp'}
            </h2>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Camp Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:ring-red-500 focus:border-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Venue</label>
                <input
                  type="text"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:ring-red-500 focus:border-red-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:ring-red-500 focus:border-red-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Time</label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:ring-red-500 focus:border-red-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Capacity</label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                  className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:ring-red-500 focus:border-red-500"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:ring-red-500 focus:border-red-500"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact Phone</label>
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:ring-red-500 focus:border-red-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact Email</label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:ring-red-500 focus:border-red-500"
                    required
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({
                      name: '',
                      venue: '',
                      date: '',
                      time: '',
                      capacity: 50,
                      description: '',
                      requirements: ['Age between 18-65', 'Weight above 50kg', 'No recent surgeries'],
                      contactPhone: '',
                      contactEmail: '',
                    });
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : formData.name ? 'Update Camp' : 'Create Camp'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Donors Modal */}
      {showDonorsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Registered Donors
            </h2>

            {loadingDonors ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : donors.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No donors registered yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Blood Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Registration Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {donors.map((donor) => (
                      <tr key={donor.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{donor.name}</div>
                          <div className="text-sm text-gray-500">{donor.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{donor.bloodType}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{donor.phoneNumber}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(donor.registrationDate).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            donor.status === 'donated' ? 'bg-green-100 text-green-800' :
                            donor.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {donor.status.charAt(0).toUpperCase() + donor.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDonorsModal(false);
                  setSelectedCamp(null);
                  setDonors([]);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCamps;