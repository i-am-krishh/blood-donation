import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { useToast } from './ui/use-toast';

interface EditCampModalProps {
  camp: Camp | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

interface Camp {
  _id: string;
  name: string;
  venue: string;
  date: string;
  time: string;
  capacity: number;
  description: string;
  requirements: string[];
  contactInfo: {
    phone: string;
    email: string;
  };
}

const EditCampModal: React.FC<EditCampModalProps> = ({ camp, isOpen, onClose, onUpdate }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<Camp>>({});
  const [loading, setLoading] = useState(false);
  const [requirements, setRequirements] = useState<string>('');

  useEffect(() => {
    if (camp) {
      setFormData({
        name: camp.name,
        venue: camp.venue,
        date: camp.date.split('T')[0], // Format date for input
        time: camp.time,
        capacity: camp.capacity,
        description: camp.description,
        requirements: camp.requirements,
        contactInfo: {
          phone: camp.contactInfo?.phone || '',
          email: camp.contactInfo?.email || ''
        }
      });
      setRequirements(camp.requirements?.join(', ') || '');
    }
  }, [camp]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!camp) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/admin/camps/${camp._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...formData,
          requirements: requirements.split(',').map(req => req.trim()).filter(req => req),
          contactPhone: formData.contactInfo?.phone,
          contactEmail: formData.contactInfo?.email
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update camp');
      }

      toast({
        title: "Success",
        description: "Camp updated successfully",
      });
      onUpdate();
      onClose();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to update camp',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <motion.h2
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="text-2xl font-semibold text-gray-900"
              >
                Edit Camp
              </motion.h2>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={24} />
              </motion.button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-shadow"
                  required
                />
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <label className="block text-sm font-medium text-gray-700 mb-2">Venue</label>
                <input
                  type="text"
                  value={formData.venue || ''}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-shadow"
                  required
                />
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={formData.date || ''}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-shadow"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                  <input
                    type="time"
                    value={formData.time || ''}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-shadow"
                    required
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <label className="block text-sm font-medium text-gray-700 mb-2">Capacity</label>
                <input
                  type="number"
                  value={formData.capacity || ''}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                  className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-shadow"
                  min="1"
                  required
                />
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-shadow"
                  rows={3}
                  required
                />
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <label className="block text-sm font-medium text-gray-700 mb-2">Requirements (comma-separated)</label>
                <input
                  type="text"
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-shadow"
                  placeholder="Age 18+, Good health, etc."
                />
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Phone</label>
                <input
                  type="tel"
                  value={formData.contactInfo?.phone || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    contactInfo: {
                      phone: e.target.value,
                      email: formData.contactInfo?.email || ''
                    }
                  })}
                  className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-shadow"
                  required
                />
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
                <input
                  type="email"
                  value={formData.contactInfo?.email || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    contactInfo: {
                      email: e.target.value,
                      phone: formData.contactInfo?.phone || ''
                    }
                  })}
                  className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-shadow"
                  required
                />
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="flex justify-end space-x-3 pt-6"
              >
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="mr-2"
                        >
                          ⭮
                        </motion.span>
                        Updating...
                      </span>
                    ) : (
                      'Update Camp'
                    )}
                  </Button>
                </motion.div>
              </motion.div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EditCampModal; 