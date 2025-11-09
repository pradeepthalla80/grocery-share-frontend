import { useState, useEffect } from 'react';
import { Users, Package, TrendingUp, Leaf, Award, Heart, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import { getImpactAnalytics, type AnalyticsData } from '../api/analytics';

export const Analytics = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AnalyticsData>({
    totalUsers: 0,
    totalItems: 0,
    totalRequests: 0,
    foodSavedLbs: 0,
    activeCommunities: 0,
    successfulShares: 0
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Call backend API endpoint
      // Uses fallback data if endpoint is not yet implemented
      const data = await getImpactAnalytics();
      setStats(data);
      
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      showToast('Failed to load analytics data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, label, value, sublabel, color }: {
    icon: any;
    label: string;
    value: string | number;
    sublabel?: string;
    color: string;
  }) => (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <TrendingUp className="h-5 w-5 text-green-500" />
      </div>
      <h3 className="text-3xl font-bold text-gray-900 mb-1">{value.toLocaleString()}</h3>
      <p className="text-gray-600 font-medium">{label}</p>
      {sublabel && (
        <p className="text-sm text-gray-500 mt-1">{sublabel}</p>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-6 flex items-center text-gray-600 hover:text-gray-900 transition"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/20 rounded-full">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Community Impact</h1>
              <p className="text-green-100 mt-1">See the difference we're making together</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={Users}
            label="Total Members"
            value={stats.totalUsers}
            sublabel="Growing community"
            color="bg-blue-500"
          />
          
          <StatCard
            icon={Package}
            label="Items Shared"
            value={stats.totalItems}
            sublabel="Available for pickup"
            color="bg-green-500"
          />
          
          <StatCard
            icon={Heart}
            label="Requests Fulfilled"
            value={stats.successfulShares}
            sublabel="Successful connections"
            color="bg-red-500"
          />
          
          <StatCard
            icon={Leaf}
            label="Food Saved"
            value={`${stats.foodSavedLbs} lbs`}
            sublabel="Prevented from waste"
            color="bg-emerald-500"
          />
          
          <StatCard
            icon={Award}
            label="Active Communities"
            value={stats.activeCommunities}
            sublabel="Neighborhoods participating"
            color="bg-purple-500"
          />
          
          <StatCard
            icon={Package}
            label="Open Requests"
            value={stats.totalRequests}
            sublabel="Waiting to be filled"
            color="bg-orange-500"
          />
        </div>

        {/* Impact Message */}
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <Leaf className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Together We're Making a Difference
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Every item shared helps reduce food waste, save money, and strengthen our community bonds. 
            Thank you for being part of the solution!
          </p>
          
          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-3xl font-bold text-green-600">100%</p>
                <p className="text-gray-600 mt-1">Free to Use</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-green-600">24/7</p>
                <p className="text-gray-600 mt-1">Always Available</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-green-600">Local</p>
                <p className="text-gray-600 mt-1">Your Neighborhood</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
