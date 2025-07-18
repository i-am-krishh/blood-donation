import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Calendar, MapPin, Clock, Users, Search, UserCheck, CheckCircle, XCircle, BarChart, Send } from 'lucide-react';
import { Button } from '../../components/ui/button';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useToast } from '../../components/ui/use-toast';
import EditCampModal from '../../components/EditCampModal';

interface Camp {
  _id: string;
  name: string;
  venue: string;
  date: string;
  time: string;
  capacity: number;
  status: 'pending' | 'approved' | 'cancelled' | 'completed' | 'ongoing';
  description: string;
  contactInfo: {
    phone: string;
    email: string;
  };
  location: {
    coordinates: [number, number];
    address: string;
    directions?: string;
  };
  analytics: {
    totalRegistrations: number;
    actualDonors: number;
    noShows: number;
    averageRating: number;
    registrationRate: number;
    donationRate: number;
  };
}

interface DonorRegistration {
  _id: string;
  donorId: {
    _id: string;
    name: string;
    bloodType: string;
    phoneNumber: string;
  };
  status: 'registered' | 'donated' | 'cancelled';
  registrationDate: string;
}

const ManageCamps = () => {
  const { toast } = useToast();
  const [camps, setCamps] = useState<Camp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCamp, setSelectedCamp] = useState<Camp | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'cancelled' | 'completed' | 'ongoing'>('all');
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationData, setNotificationData] = useState({
    type: 'announcement',
    message: '',
    sendTo: 'all'
  });

  // Move these hooks inside the component
  // Replace the campRegistrations state with:
  const [campRegistrations, setCampRegistrations] = useState<Map<string, DonorRegistration[]>>(new Map());

  // Update the fetchCampRegistrations function
  const fetchCampRegistrations = async (campId: string) => {
    try {
      const response = await fetch(`/api/camps/${campId}/registrations`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch registrations');
      const data = await response.json();
      setCampRegistrations(prev => new Map(prev).set(campId, data.registrations));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load registrations",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchCamps();
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
      setCamps(data);
    } catch (err) {
      console.error('Error fetching camps:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load camps';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false); // Make sure this runs even if there's an error
    }
  };

  const handleCreateCamp = async (campData: Partial<Camp>) => {
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

      toast({
        title: "Success",
        description: "Camp created successfully"
      });
      fetchCamps();
      setShowCreateModal(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to create camp'
      });
    }
  };

  const handleUpdateCamp = async (campId: string, campData: Partial<Camp>) => {
    try {
      const response = await fetch(`/api/camps/${campId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(campData)
      });

      if (!response.ok) throw new Error('Failed to update camp');

      toast({
        title: "Success",
        description: "Camp updated successfully"
      });
      fetchCamps();
      setShowEditModal(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to update camp'
      });
    }
  };

  const handleDeleteCamp = async (campId: string) => {
    if (!window.confirm('Are you sure you want to delete this camp?')) return;

    try {
      const response = await fetch(`/api/camps/${campId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete camp');
      }

      toast({
        title: "Success",
        description: data.message || "Camp deleted successfully"
      });

      fetchCamps();
    } catch (error) {
      console.error('Error deleting camp:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to delete camp'
      });
    }
  };

  const handleUpdateDonorStatus = async (campId: string, donorId: string, status: string, donationStatus: string) => {
    try {
      const response = await fetch(`/api/camps/${campId}/donors/${donorId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status, donationStatus })
      });

      if (!response.ok) throw new Error('Failed to update status');

      toast({
        title: "Success",
        description: "Donor status updated successfully",
      });

      // Refresh camp data
      await fetchCamps();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update donor status",
        variant: "destructive"
      });
    }
  };

  const handleSendNotification = async (campId: string) => {
    try {
      const response = await fetch(`/api/camps/${campId}/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(notificationData)
      });

      if (!response.ok) throw new Error('Failed to send notification');

      toast({
        title: "Success",
        description: "Notification sent successfully"
      });
      setShowNotificationModal(false);
      setNotificationData({
        type: 'announcement',
        message: '',
        sendTo: 'all'
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to send notification'
      });
    }
  };

  const handleDownloadReport = async (campId: string, type: 'attendance' | 'certificates') => {
    try {
      const endpoint = type === 'attendance' ? 'attendance-report' : 'attendance-report';
      const response = await fetch(`/api/camps/${campId}/${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error(`Failed to download ${type} report`);

      // Handle the report data...
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to download ${type} report`,
        variant: "destructive"
      });
    }
  };

  const filteredCamps = camps.filter(camp => {
    const matchesStatus = statusFilter === 'all' || camp.status === statusFilter;
    const matchesSearch = camp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      camp.venue.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Manage Your Blood Donation Camps</h1>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create New Camp
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search camps..."
              className="pl-10 pr-4 py-2 w-full border rounded-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
          <div>
            <span className="font-medium">Total Camps:</span> {camps?.length || 0}
          </div>
          <div>
            <span className="font-medium">Pending Approval:</span> {camps?.filter(c => c.status === 'pending')?.length || 0}
          </div>
          <div>
            <span className="font-medium">Active Camps:</span> {camps?.filter(c => c.status === 'approved' || c.status === 'ongoing')?.length || 0}
          </div>
          <div>
            <span className="font-medium">Completed:</span> {camps?.filter(c => c.status === 'completed')?.length || 0}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCamps.map((camp) => (
          <div key={camp._id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{camp.name}</h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${camp.status === 'approved' ? 'bg-green-100 text-green-800' :
                    camp.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      camp.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                        camp.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
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
                  <span className="text-sm">{camp.registeredDonors?.length || 0} / {camp.capacity} registered</span>
                </div>
              </div>

              {camp.analytics && (
                // In the camp card JSX, remove the registered donors section and keep only:
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">Analytics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p>Registration Rate:</p>
                      <p>{camp.analytics.registrationRate.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p>Donation Rate:</p>
                      <p>{camp.analytics.donationRate.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 space-y-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setSelectedCamp(camp);
                      setShowEditModal(true);
                    }}
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>

                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleDeleteCamp(camp._id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setSelectedCamp(camp);
                    setShowNotificationModal(true);
                  }}
                >
                  <Send className="w-4 h-4 mr-1" />
                  Send Notification
                </Button>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleDownloadReport(camp._id, 'attendance')}
                  >
                    Attendance Report
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleDownloadReport(camp._id, 'certificates')}
                  >
                    Certificates
                  </Button>
                </div>
              </div>

              {/* {(camp.registeredDonors?.length || 0) > 0 && (
                <div className="mt-4 border-t pt-4">
                  <h4 className="font-medium text-gray-700 mb-2">Registered Donors</h4>
                  <div className="space-y-2">
                    {camp.registeredDonors?.map((registration) => (
                      <div key={registration.donor?._id || 'unknown'} className="flex items-center justify-between text-sm">
                        <div>
                          <div className="font-medium">{registration.donor?.name || 'Unknown Donor'}</div>
                          <div className="text-gray-500">
                            {registration.donor?.bloodType || 'N/A'} • {registration.donor?.phoneNumber || 'N/A'}
                          </div>
                        </div>
                        <select
                          value={registration.donationStatus || 'not_donated'}
                          onChange={(e) => handleUpdateDonorStatus(
                            camp._id,
                            registration.donor?._id || '',
                            e.target.value === 'donated' ? 'attended' : registration.status,
                            e.target.value
                          )}
                          className="px-2 py-1 border rounded text-sm"
                        >
                          <option value="not_donated">Not Donated</option>
                          <option value="donated">Donated</option>
                          <option value="no_show">No Show</option>
                          <option value="deferred">Deferred</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )} */}
            </div>
          </div>
        ))}
      </div>

      {showCreateModal && (
        <EditCampModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onUpdate={handleCreateCamp}
          camp={null}
        />
      )}

      {showEditModal && selectedCamp && (
        <EditCampModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedCamp(null);
          }}
          onUpdate={(data) => handleUpdateCamp(selectedCamp._id, data)}
          camp={selectedCamp}
        />
      )}

      {showNotificationModal && selectedCamp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Send Notification</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select
                  value={notificationData.type}
                  onChange={(e) => setNotificationData(prev => ({ ...prev, type: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 border rounded-lg"
                >
                  <option value="announcement">Announcement</option>
                  <option value="reminder">Reminder</option>
                  <option value="update">Update</option>
                  <option value="cancellation">Cancellation</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Send To</label>
                <select
                  value={notificationData.sendTo}
                  onChange={(e) => setNotificationData(prev => ({ ...prev, sendTo: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 border rounded-lg"
                >
                  <option value="all">All Donors</option>
                  <option value="pending">Pending Donors</option>
                  <option value="confirmed">Confirmed Donors</option>
                  <option value="attended">Attended Donors</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Message</label>
                <textarea
                  value={notificationData.message}
                  onChange={(e) => setNotificationData(prev => ({ ...prev, message: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 border rounded-lg"
                  rows={4}
                  placeholder="Enter your message here..."
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowNotificationModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleSendNotification(selectedCamp._id)}
                  disabled={!notificationData.message.trim()}
                >
                  Send
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCamps;