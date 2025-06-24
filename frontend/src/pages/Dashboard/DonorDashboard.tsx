import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Droplet, Calendar, Award, Download, Eye } from 'lucide-react';
import { Button } from '../../components/ui/button';
import LoadingSpinner from '../../components/LoadingSpinner';

interface Donation {
  _id: string;
  date: string;
  camp: {
    name: string;
    location: string;
  };
  bloodType: string;
  units: number;
  status: 'pending' | 'completed' | 'cancelled';
  certificate?: {
    _id: string;
    url: string;
  };
}

interface DonationStats {
  totalDonations: number;
  totalUnits: number;
  certificatesCount: number;
  lastDonation: string | null;
}

const DonorDashboard = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [stats, setStats] = useState<DonationStats>({
    totalDonations: 0,
    totalUnits: 0,
    certificatesCount: 0,
    lastDonation: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'donations' | 'certificates'>('donations');
  const [selectedCertificate, setSelectedCertificate] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetchDonations(),
      fetchStats()
    ]).finally(() => setIsLoading(false));
  }, []);

  const fetchDonations = async () => {
    try {
      const response = await fetch('/api/donations/my-donations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch donations');
      }
      
      const data = await response.json();
      setDonations(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch donations');
      setDonations([]);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/donations/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch statistics');
      }
      
      const data = await response.json();
      setStats(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch statistics');
    }
  };

  const downloadCertificate = async (certificateId: string) => {
    try {
      const response = await fetch(`/api/certificates/${certificateId}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to download certificate');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate-${certificateId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download certificate');
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Donor Dashboard</h1>
          <p className="text-gray-600">Track your donations and certificates</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-red-100 rounded-full">
                <Droplet className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Donations</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDonations}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-red-100 rounded-full">
                <Calendar className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Units</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUnits}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-red-100 rounded-full">
                <Award className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Certificates</p>
                <p className="text-2xl font-bold text-gray-900">{stats.certificatesCount}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex space-x-1 p-4">
              <Button
                variant={activeTab === 'donations' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('donations')}
                className="flex items-center space-x-2"
              >
                <Droplet className="w-4 h-4" />
                <span>Donations History</span>
              </Button>
              <Button
                variant={activeTab === 'certificates' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('certificates')}
                className="flex items-center space-x-2"
              >
                <Award className="w-4 h-4" />
                <span>Certificates</span>
              </Button>
            </div>
          </div>

          <div className="p-4">
            {activeTab === 'donations' ? (
              <div className="overflow-x-auto">
                {donations.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No donations found
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Camp</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Blood Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Units</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Certificate</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {donations.map((donation) => (
                        <tr key={donation._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {new Date(donation.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{donation.camp.name}</div>
                              <div className="text-sm text-gray-500">{donation.camp.location}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">{donation.bloodType}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{donation.units}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              donation.status === 'completed' ? 'bg-green-100 text-green-800' :
                              donation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {donation.status.charAt(0).toUpperCase() + donation.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {donation.certificate && donation.status === 'completed' && (
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-blue-600 hover:text-blue-700"
                                  onClick={() => setSelectedCertificate(donation.certificate?.url || null)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-green-600 hover:text-green-700"
                                  onClick={() => donation.certificate && downloadCertificate(donation.certificate._id)}
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {donations
                  .filter(d => d.certificate && d.status === 'completed')
                  .map((donation) => (
                    <div key={donation._id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm text-gray-500">
                            {new Date(donation.date).toLocaleDateString()}
                          </p>
                          <h3 className="text-lg font-semibold mt-1">{donation.camp.name}</h3>
                          <p className="text-sm text-gray-600">{donation.camp.location}</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-blue-600 hover:text-blue-700"
                            onClick={() => setSelectedCertificate(donation.certificate?.url || null)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600 hover:text-green-700"
                            onClick={() => donation.certificate && downloadCertificate(donation.certificate._id)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Certificate Preview Modal */}
      {selectedCertificate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Certificate Preview</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCertificate(null)}
              >
                ×
              </Button>
            </div>
            <div className="p-4">
              <iframe
                src={selectedCertificate}
                className="w-full h-[70vh]"
                title="Certificate Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonorDashboard; 