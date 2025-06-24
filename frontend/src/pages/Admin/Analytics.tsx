import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Calendar, Users, Droplet, MapPin, Activity, Award, Clock } from 'lucide-react';
import { Button } from '../../components/ui/button';
import LoadingSpinner from '../../components/LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../components/ui/use-toast';

interface AnalyticsData {
  totalDonors: number;
  totalOrganizers: number;
  totalDonations: number;
  totalCamps: number;
  bloodTypeDistribution: {
    type: string;
    count: number;
  }[];
  monthlyDonations: {
    month: string;
    donations: number;
  }[];
  campStatistics: {
    status: string;
    count: number;
  }[];
  recentActivity: {
    id: string;
    type: 'donation' | 'camp' | 'registration';
    description: string;
    date: string;
  }[];
}

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#14b8a6', '#0ea5e9', '#6366f1'];

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5,
      when: "beforeChildren",
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5 }
  }
};

const Analytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`/api/admin/analytics?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch analytics');
      }

      const data = await response.json();
      
      // Transform data to ensure all required fields exist
      const transformedData: AnalyticsData = {
        totalDonors: data.totalDonors || 0,
        totalOrganizers: data.totalOrganizers || 0,
        totalDonations: data.totalDonations || 0,
        totalCamps: data.totalCamps || 0,
        bloodTypeDistribution: data.bloodTypeDistribution || [],
        monthlyDonations: data.monthlyDonations || [],
        campStatistics: data.campStatistics || [],
        recentActivity: data.recentActivity || []
      };

      setAnalytics(transformedData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load analytics';
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (err) {
      return 'Invalid Date';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <LoadingSpinner />
        </motion.div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto px-4 py-8"
      >
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center">
          <Activity className="w-5 h-5 mr-2" />
          {error || 'Failed to load analytics'}
        </div>
        <Button 
          onClick={fetchAnalytics}
          className="mt-4"
        >
          Retry
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="container mx-auto px-4 py-8"
    >
      {/* Header Section */}
      <motion.div 
        variants={itemVariants}
        className="flex flex-col md:flex-row md:items-center justify-between mb-6"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">Track and analyze blood donation metrics</p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Button
            variant={timeRange === 'week' ? 'default' : 'outline'}
            onClick={() => setTimeRange('week')}
            className="transition-all duration-200 hover:scale-105"
          >
            <Clock className="w-4 h-4 mr-1" />
            Week
          </Button>
          <Button
            variant={timeRange === 'month' ? 'default' : 'outline'}
            onClick={() => setTimeRange('month')}
            className="transition-all duration-200 hover:scale-105"
          >
            <Calendar className="w-4 h-4 mr-1" />
            Month
          </Button>
          <Button
            variant={timeRange === 'year' ? 'default' : 'outline'}
            onClick={() => setTimeRange('year')}
            className="transition-all duration-200 hover:scale-105"
          >
            <Activity className="w-4 h-4 mr-1" />
            Year
          </Button>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Donors</p>
              <p className="text-2xl font-semibold text-gray-900">{analytics.totalDonors}</p>
            </div>
            <Users className="w-8 h-8 text-red-500" />
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Donations</p>
              <p className="text-2xl font-semibold text-gray-900">{analytics.totalDonations}</p>
            </div>
            <Droplet className="w-8 h-8 text-blue-500" />
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Camps</p>
              <p className="text-2xl font-semibold text-gray-900">{analytics.totalCamps}</p>
            </div>
            <MapPin className="w-8 h-8 text-green-500" />
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Camp Organizers</p>
              <p className="text-2xl font-semibold text-gray-900">{analytics.totalOrganizers}</p>
            </div>
            <Award className="w-8 h-8 text-purple-500" />
          </div>
        </motion.div>
      </motion.div>

      {/* Charts Section */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
      >
        {/* Blood Type Distribution */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Blood Type Distribution</h2>
          <div className="w-full h-[300px]">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={analytics.bloodTypeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="type"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {analytics.bloodTypeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Monthly Trend */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trend</h2>
          <div className="w-full h-[300px]">
            <ResponsiveContainer>
              <AreaChart
                data={analytics.monthlyDonations}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="colorDonations" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="donations" 
                  stroke="#ef4444" 
                  fillOpacity={1} 
                  fill="url(#colorDonations)" 
                  name="Donations"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Camp Statistics */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Camp Statistics</h2>
          <div className="w-full h-[300px]">
            <ResponsiveContainer>
              <BarChart
                data={analytics.campStatistics}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#0ea5e9" name="Camps" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4 max-h-[300px] overflow-y-auto">
            <AnimatePresence>
              {analytics.recentActivity.map((activity) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-shrink-0">
                    {activity.type === 'donation' ? (
                      <Droplet className="w-5 h-5 text-red-600" />
                    ) : activity.type === 'camp' ? (
                      <MapPin className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Users className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(activity.date)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default Analytics; 