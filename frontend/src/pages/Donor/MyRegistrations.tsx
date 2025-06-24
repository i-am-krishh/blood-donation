import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Clock, Users, Info } from 'lucide-react';
import { Button } from '../../components/ui/button';

interface Registration {
  id: string;
  campId: string;
  campName: string;
  venue: string;
  date: string;
  time: string;
  organizer: string;
  status: 'upcoming' | 'completed' | 'cancelled';
}

const MyRegistrations = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      const response = await fetch('/api/donor/registrations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch registrations');
      }

      const data = await response.json();
      setRegistrations(data.registrations);
      setIsLoading(false);
    } catch (err) {
      setError('Failed to load registrations. Please try again later.');
      setIsLoading(false);
    }
  };

  const handleViewDetails = (campId: string) => {
    navigate(`/camps/${campId}`);
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
        <Button onClick={fetchRegistrations}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Registrations</h1>
      
      {registrations.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <div className="text-gray-600 mb-4">You haven't registered for any camps yet.</div>
          <Button onClick={() => navigate('/donor/nearby-camps')}>
            Find Nearby Camps
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {registrations.map((registration) => (
            <div
              key={registration.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  {registration.campName}
                </h3>
                <span
                  className={`px-2 py-1 rounded text-sm ${
                    registration.status === 'upcoming'
                      ? 'bg-green-100 text-green-800'
                      : registration.status === 'completed'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {registration.status.charAt(0).toUpperCase() + registration.status.slice(1)}
                </span>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>{registration.venue}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>{new Date(registration.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>{registration.time}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Users className="w-4 h-4 mr-2" />
                  <span>Organizer: {registration.organizer}</span>
                </div>
              </div>

              <Button
                onClick={() => handleViewDetails(registration.campId)}
                className="w-full"
                variant="outline"
              >
                <Info className="w-4 h-4 mr-2" />
                View Details
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyRegistrations; 