import React, { useState, useEffect } from 'react';
import { Search, Calendar, MapPin, Users, CheckCircle, XCircle, Edit, Trash2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  status: 'pending' | 'approved' | 'cancelled';
  capacity: number;
  registeredDonors: {
    length: number;
  };
  organizer: {
    name: string;
    email: string;
  };
  description: string;
  requirements: string[];
  contactInfo: {
    phone: string;
    email: string;
  };
}

const AllCamps = () => {
  const { toast } = useToast();
  const [camps, setCamps] = useState<Camp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCamp, setSelectedCamp] = useState<Camp | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    fetchCamps();
  }, []);

  const fetchCamps = async () => {
    try {
      const response = await fetch('/api/admin/camps', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch camps');
      }

      const data = await response.json();
      // Sort camps by date and time (closest first)
      const sortedCamps = data.sort((a: Camp, b: Camp) => {
        const dateA = new Date(`${a.date} ${a.time}`);
        const dateB = new Date(`${b.date} ${b.time}`);
        return dateA.getTime() - dateB.getTime();
      });
      setCamps(sortedCamps);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load camps');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (campId: string, newStatus: Camp['status']) => {
    try {
      const response = await fetch(`/api/admin/camps/${campId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update camp status');
      }

      const updatedCamp = await response.json();
      setCamps(camps.map(camp =>
        camp._id === campId ? updatedCamp : camp
      ));
      toast({
        title: "Success",
        description: `Camp status updated to ${newStatus}`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to update camp status',
        variant: "destructive"
      });
    }
  };

  const handleDeleteCamp = async (campId: string) => {
    try {
      const response = await fetch(`/api/admin/camps/${campId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete camp');
      }

      setCamps(camps.filter(camp => camp._id !== campId));
      setDeleteConfirmId(null);
      toast({
        title: "Success",
        description: "Camp deleted successfully"
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to delete camp',
        variant: "destructive"
      });
    }
  };

  const canEditCamp = (camp: Camp) => {
    // Allow editing for all future camps and camps happening today
    const campDateTime = new Date(`${camp.date} ${camp.time}`);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for fair comparison
    return campDateTime >= today;
  };

  const handleEditClick = (camp: Camp) => {
    setSelectedCamp(camp);
    setShowEditModal(true);
  };

  const handleEditClose = () => {
    setSelectedCamp(null);
    setShowEditModal(false);
  };

  const handleCampUpdate = () => {
    fetchCamps(); // Refresh the camps list
  };

  const filteredCamps = camps.filter(camp => {
    const matchesSearch = camp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      camp.venue.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || camp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-gray-900">Camp Management</h1>
        <p className="text-gray-600">Monitor and manage blood donation camps</p>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center"
        >
          <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          <p className="text-red-600">{error}</p>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-6 flex flex-col md:flex-row gap-4"
      >
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search camps..."
            className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <AnimatePresence>
          {filteredCamps.map((camp) => (
            <motion.div
              key={camp._id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{camp.name}</h3>
                    <div className="flex items-center text-gray-500 mt-1">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span className="text-sm">{camp.venue}</span>
                    </div>
                  </div>
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
                    <Calendar className="w-4 h-4 mr-2" />
                    <span className="text-sm">
                      {new Date(camp.date).toLocaleDateString()} at {camp.time}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-500">
                    <Users className="w-4 h-4 mr-2" />
                    <span className="text-sm">
                      {camp.registeredDonors?.length || 0} / {camp.capacity} registered
                    </span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="text-sm text-gray-500 mb-2">
                    <strong>Organizer:</strong> {camp.organizer?.name || 'Not assigned'}
                  </div>
                  <div className="text-sm text-gray-500 mb-2">
                    <strong>Contact:</strong> {camp.contactInfo?.phone || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-500">
                    <strong>Email:</strong> {camp.contactInfo?.email || 'N/A'}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {camp.status === 'pending' && (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex-1"
                    >
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => handleStatusChange(camp._id, 'approved')}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                    </motion.div>
                  )}
                  
                  {camp.status !== 'cancelled' && (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex-1"
                    >
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full"
                        onClick={() => handleStatusChange(camp._id, 'cancelled')}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                    </motion.div>
                  )}

                  {canEditCamp(camp) && (
                    <div className="flex gap-2 w-full mt-2">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex-1"
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(camp)}
                          className="w-full flex items-center justify-center gap-1"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </Button>
                      </motion.div>

                      {deleteConfirmId === camp._id ? (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex gap-2 flex-1"
                        >
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteCamp(camp._id)}
                            className="flex-1"
                          >
                            Confirm
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteConfirmId(null)}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </motion.div>
                      ) : (
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex-1"
                        >
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeleteConfirmId(camp._id)}
                            className="w-full flex items-center justify-center gap-1"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </Button>
                        </motion.div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      <EditCampModal
        camp={selectedCamp}
        isOpen={showEditModal}
        onClose={handleEditClose}
        onUpdate={handleCampUpdate}
      />
    </div>
  );
};

export default AllCamps;