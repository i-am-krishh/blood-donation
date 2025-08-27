import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, LogOut, User, Settings, Activity, Droplet, FileText, PlusCircle, Users, CheckSquare, Layout, MapPin, Calendar, Award, BarChart, List } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { useUser } from '../context/UserContext';
import { LogOut, Menu, User, Bell } from "lucide-react"

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const UserAvatar = () => {
  const { user } = useUser();
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };
  
  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center space-x-2 hover:text-red-600"
      >
        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
          <span className="text-sm font-medium text-red-600">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </span>
        </div>
        <ChevronDown className="w-4 h-4" />
      </button>
      
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
          <Link to={`/${user?.role}/dashboard`} className="block px-4 py-2 hover:bg-gray-100">
            Dashboard
          </Link>
          <button 
            onClick={handleLogout} 
            className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
          >
            <div className="flex items-center">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user } = useUser();
  const isAuthenticated = !!user;
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  // Get dashboard route based on user role
  const getDashboardRoute = () => {
    if (!user) return "/";
    switch (user.role) {
      case 'admin':
        return "/admin/dashboard";
      case 'camp_organizer':
        return "/organizer/dashboard";
      case 'donor':
      default:
        return "/donor/dashboard";
    }
  };

  // Get navigation items based on user role
  const getNavItems = (): NavItem[] => {
    if (!isAuthenticated || !user) {
      return [
        { path: "/", label: "Home", icon: <Layout className="w-4 h-4" /> },
        { path: "/camps", label: "Camps", icon: <Calendar className="w-4 h-4" /> },
        { path: "/how-it-works", label: "How It Works", icon: <FileText className="w-4 h-4" /> },
        { path: "/contact", label: "Contact", icon: <User className="w-4 h-4" /> }
      ];
    }

    switch (user.role) {
      case 'donor':
        return [
          { path: "/donor/dashboard", label: "Dashboard", icon: <Layout className="w-4 h-4" /> },
          { path: "/donor/registrations", label: "My Registrations", icon: <List className="w-4 h-4" /> },
          { path: "/donor/nearby-camps", label: "Nearby Camps", icon: <MapPin className="w-4 h-4" /> },
          { path: "/donor/donations", label: "My Donations", icon: <Droplet className="w-4 h-4" /> }
        ];
      case 'camp_organizer':
        return [
          { path: "/organizer/dashboard", label: "Dashboard", icon: <Layout className="w-4 h-4" /> },
          { path: "/organizer/manage-camps", label: "Manage Camps", icon: <Calendar className="w-4 h-4" /> },
          { path: "/organizer/registered-users", label: "Registered Users", icon: <Users className="w-4 h-4" /> },
          { path: "/organizer/verify-donations", label: "Verify Donations", icon: <CheckSquare className="w-4 h-4" /> }
        ];
      case 'admin':
        return [
          { path: "/admin/dashboard", label: "Dashboard", icon: <Layout className="w-4 h-4" /> },
          { path: "/admin/camps", label: "All Camps", icon: <Calendar className="w-4 h-4" /> },
          { path: "/admin/users", label: "All Users", icon: <Users className="w-4 h-4" /> },
          { path: "/admin/donations", label: "All Donations", icon: <Droplet className="w-4 h-4" /> },
          { path: "/admin/analytics", label: "Analytics", icon: <BarChart className="w-4 h-4" /> }
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-md fixed top-0 w-full z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to={isAuthenticated ? getDashboardRoute() : "/"} className="flex items-center">
              <div className="text-red-600">
                <Droplet className="w-8 h-8 text-red-600" />
              </div>
              <span className="ml-2 text-xl font-bold text-red-600">
                BloodConnect
              </span>
            </Link>

            {/* Desktop Navigation Items */}
            <div className="hidden md:flex md:ml-10">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                    isActive(item.path)
                      ? 'text-red-600 bg-red-50'
                      : 'text-gray-700 hover:text-red-600 hover:bg-red-50'
                  }`}
                >
                  {item.icon}
                  <span className="ml-2">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Desktop Right Menu */}
          <div className="hidden md:flex md:items-center md:space-x-6">
            {!user ? (
              <div className="flex items-center space-x-2">
                <Link to="/login">
                  <Button variant="outline">Sign In</Button>
                </Link>
                <Link to="/signup">
                  <Button>Sign Up</Button>
                </Link>
              </div>
            ) : (
              <UserAvatar />
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            {user && <UserAvatar />}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="ml-2 p-2 rounded-md text-gray-700 hover:text-red-600 hover:bg-red-50"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden border-t border-gray-200">
          <div className="pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-2 text-base font-medium ${
                  isActive(item.path)
                    ? 'text-red-600 bg-red-50'
                    : 'text-gray-700 hover:text-red-600 hover:bg-red-50'
                }`}
                onClick={() => setIsOpen(false)}
              >
                {item.icon}
                <span className="ml-2">{item.label}</span>
              </Link>
            ))}
            {!user && (
              <div className="px-4 py-3 space-y-2">
                <Link
                  to="/login"
                  className="block w-full"
                  onClick={() => setIsOpen(false)}
                >
                  <Button variant="outline" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link
                  to="/signup"
                  className="block w-full"
                  onClick={() => setIsOpen(false)}
                >
                  <Button className="w-full">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
