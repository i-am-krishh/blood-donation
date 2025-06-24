import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Clock, Users, Search, Filter, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import LoadingSpinner from '../../components/LoadingSpinner';
import { toast } from '../../components/ui/use-toast';

interface Camp {
  _id: string;
  name: string;
  venue: string;
  date: string;
  time: string;
  organizer: {
    name: string;
    email: string;
  };
  capacity: number;
  registeredDonors: Array<{
    donor: {
      _id: string;
      name: string;
      email: string;
      bloodType: string;
    };
    registrationDate: string;
    status: 'pending' | 'confirmed' | 'cancelled';
    donationStatus: 'not_donated' | 'donated' | 'no_show';
  }>;
  distance?: number;
  status: 'pending' | 'approved' | 'cancelled' | 'completed';
  description: string;
  requirements: string[];
  contactInfo: {
    phone: string;
    email: string;
  };
  location: {
    type: string;
    coordinates: [number, number];
  };
}

const NearbyCamps = () => {
  // Add getCampStatus function at the component level, not inside the JSX
  const getCampStatus = (camp: Camp) => {
    const campDate = new Date(camp.date);
    const today = new Date();
    
    if (campDate < today) {
      return { label: 'Completed', className: 'bg-gray-500 text-white' };
    }
    return { label: 'Upcoming', className: 'bg-green-500 text-white' };
  };

  const [camps, setCamps] = useState<Camp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    fetchCamps();
  }, [userLocation]);

  const getUserLocation = () => {
    setIsLocationLoading(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setIsLocationLoading(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setError("Could not get your location. Please try again.");
          setIsLocationLoading(false);
        }
      );
    } else {
      setError("Geolocation is not supported by your browser");
      setIsLocationLoading(false);
    }
  };

  const fetchCamps = async () => {
    try {
      let url = '/api/camps';
      
      // Only use nearby endpoint if we have location
      if (userLocation) {
        url = `/api/camps/nearby?latitude=${userLocation.latitude}&longitude=${userLocation.longitude}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch camps');
      }

      const data = await response.json();
      setCamps(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching camps:', err);
      setError(err instanceof Error ? err.message : 'Failed to load camps. Please try again later.');
      setCamps([]); // Reset camps on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (campId: string) => {
    try {
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Please log in to register for camps');
      }

      const response = await fetch(`/api/donor/register-camp/${campId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to register');
      }

      // Show success message
      toast({
        title: "Success",
        description: "Successfully registered for the camp",
        variant: "default",
      });

      // Refresh camps list
      await fetchCamps();
      
      // Navigate to registrations page
      navigate('/donor/registrations');
    } catch (err) {
      console.error('Registration error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to register for camp';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const filteredCamps = camps.filter(camp => {
    const matchesSearch = camp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         camp.venue.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = !location || camp.venue.toLowerCase().includes(location.toLowerCase());
    const campDate = new Date(camp.date);
    const matchesDate = (!dateRange.start || campDate >= new Date(dateRange.start)) &&
                       (!dateRange.end || campDate <= new Date(dateRange.end));
    
    return matchesSearch && matchesLocation && matchesDate;
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">Nearby Blood Donation Camps</h1>
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search camps..."
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
          <Button
            variant="outline"
            onClick={getUserLocation}
            disabled={isLocationLoading}
          >
            {isLocationLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <MapPin className="w-4 h-4 mr-2" />
            )}
            {userLocation ? 'Update Location' : 'Use My Location'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {showFilters && (
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                placeholder="Filter by location..."
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>
          </div>
        </div>
      )}

      {filteredCamps.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <div className="text-gray-600 mb-4">No camps found matching your criteria.</div>
          <Button onClick={() => {
            setSearchTerm('');
            setLocation('');
            setDateRange({ start: '', end: '' });
          }}>
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCamps.map((camp) => {
            const registeredCount = camp.registeredDonors.length;
            const isFull = registeredCount >= camp.capacity;
            return (
              <div
                key={camp._id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">{camp.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs ${getCampStatus(camp).className}`}>
                    {getCampStatus(camp).label}
                  </span>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>{camp.venue}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>{new Date(camp.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>{camp.time}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    <span>
                      {registeredCount}/{camp.capacity} Registered
                    </span>
                  </div>
                  {camp.distance && (
                    <div className="text-sm text-gray-500">
                      {(camp.distance / 1000).toFixed(1)} km away
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => handleRegister(camp._id)}
                  className="w-full"
                  disabled={isFull || camp.status !== 'approved' || new Date(camp.date) < new Date()}
                >
                  {camp.status !== 'approved' ? 'Not Available' :
                   isFull ? 'Camp Full' : 
                   'Register Now'}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NearbyCamps;