import React, { useState, useEffect } from 'react';
import { Search, Download, Droplet } from 'lucide-react';
import { Button } from '../../components/ui/button';
import LoadingSpinner from '../../components/LoadingSpinner';

interface Donation {
  _id: string;
  donorId: {
    name: string;
    email: string;
    bloodType: string;
  };
  campId: {
    name: string;
    location: string;
  };
  donationDate: string;
  units: number;
  status: 'pending' | 'verified' | 'rejected';
  verificationDate?: string;
  verifiedBy?: {
    name: string;
    email: string;
  };
  medicalNotes?: string;
}

const AllDonations = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [bloodTypeFilter, setBloodTypeFilter] = useState<string>('all');

  useEffect(() => {
    fetchDonations();
  }, []);

  const fetchDonations = async () => {
    try {
      const response = await fetch('/api/admin/donations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch donations');
      }

      const data = await response.json();
      setDonations(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load donations. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCertificate = async (donationId: string) => {
    try {
      const response = await fetch(`/api/admin/donations/${donationId}/certificate`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to download certificate');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `donation-certificate-${donationId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download certificate. Please try again.');
    }
  };

  const filteredDonations = donations.filter(donation => {
    const matchesSearch = donation.donorId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donation.campId.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || donation.status === statusFilter;
    const matchesBloodType = bloodTypeFilter === 'all' || donation.donorId.bloodType === bloodTypeFilter;
    return matchesSearch && matchesStatus && matchesBloodType;
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Donation Records</h1>
        <p className="text-gray-600">Track and manage blood donations</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search donations..."
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
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
        </select>
        <select
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDonations.map((donation) => (
          <div key={donation._id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{donation.donorId.name}</h3>
                  <div className="flex items-center text-gray-500 mt-1">
                    <Droplet className="w-4 h-4 mr-1" />
                    <span className="text-sm">{donation.donorId.bloodType}</span>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  donation.status === 'verified' ? 'bg-green-100 text-green-800' :
                  donation.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {donation.status.charAt(0).toUpperCase() + donation.status.slice(1)}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="text-sm text-gray-500">
                  <strong>Camp:</strong> {donation.campId.name}
                </div>
                <div className="text-sm text-gray-500">
                  <strong>Location:</strong> {donation.campId.location}
                </div>
                <div className="text-sm text-gray-500">
                  <strong>Date:</strong> {new Date(donation.donationDate).toLocaleDateString()}
                </div>
                <div className="text-sm text-gray-500">
                  <strong>Units:</strong> {donation.units}
                </div>
              </div>

              {donation.status === 'verified' && (
                <div className="mt-4">
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => handleDownloadCertificate(donation._id)}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download Certificate
                  </Button>
                </div>
              )}

              {donation.medicalNotes && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>Medical Notes:</strong> {donation.medicalNotes}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllDonations; 