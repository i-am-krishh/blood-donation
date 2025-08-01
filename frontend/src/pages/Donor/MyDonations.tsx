import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Award, Download, Clock } from 'lucide-react';
import { Button } from '../../components/ui/button';

interface Donation {
  _id: string;
  date: string;
  camp: {
    name: string;
    location: string;
  };
  bloodType: string;
  units: number;
  status: string;
  certificate?: {
    _id: string;
    url: string;
  };
}

const MyDonations = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDonations();
  }, []);

  const fetchDonations = async () => {
    try {
      const response = await fetch('/api/donations/my-donations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch donations');
      }

      const data = await response.json();
      setDonations(data);
      setIsLoading(false);
    } catch (err) {
      setError('Failed to load donations. Please try again later.');
      setIsLoading(false);
    }
  };

  const downloadCertificate = async (certificateUrl: string) => {
    try {
      window.open(certificateUrl, '_blank');
    } catch (err) {
      setError('Failed to download certificate. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <div className="text-red-600 mb-4">{error}</div>
        <Button onClick={fetchDonations}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Donations</h1>

      {donations.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <div className="text-gray-600 mb-4">You haven't made any donations yet.</div>
          <Button onClick={() => window.location.href = '/donor/nearby-camps'}>
            Find Donation Camps
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {donations.map((donation) => (
            <div
              key={donation._id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  {donation.camp.name}
                </h3>
                <span className={`px-2 py-1 rounded text-sm ${getStatusColor(donation.status)}`}>
                  {donation.status === 'completed' ? 'Completed' : donation.status.charAt(0).toUpperCase() + donation.status.slice(1)}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>{donation.camp.location}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>{new Date(donation.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Award className="w-4 h-4 mr-2" />
                  <span>Blood Type: {donation.bloodType}</span>
                </div>
                <div className="text-gray-600">
                  Units Donated: {donation.units}
                </div>
              </div>

              {donation.status === 'completed' && donation.certificate && (
                <Button
                  onClick={() => downloadCertificate(donation.certificate!.url)}
                  className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white transition-colors duration-200"
                  variant="outline"
                >
                  <Download className="w-4 h-4" />
                  Download Certificate
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Stats Section */}
      {donations.length > 0 && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Total Donations</h3>
            <p className="text-3xl font-bold text-red-600">
              {donations.length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Total Units</h3>
            <p className="text-3xl font-bold text-red-600">
              {donations.reduce((total, donation) => total + donation.units, 0)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Last Donation</h3>
            <p className="text-3xl font-bold text-red-600">
              {donations.length > 0
                ? new Date(donations[0].date).toLocaleDateString()
                : 'N/A'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyDonations;