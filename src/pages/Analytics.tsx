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
    <div className="bg-white rounded-lg shadow-md p-2 hover:shadow-lg transition">
      <div className="flex items-center justify-between mb-1">
        <div className={`p-1.5 rounded-full ${color}`}>
          <Icon className="h-3 w-3 text-white" />
        </div>
        <TrendingUp className="h-3 w-3 text-green-500" />
      </div>
      <h3 className="text-lg font-bold text-gray-900">{value.toLocaleString()}</h3>
      <p className="text-xs text-gray-600 font-medium">{label}</p>
      {sublabel && (
        <p className="text-xs text-gray-500">{sublabel}</p>
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
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-6 flex items-center text-gray-600 hover:text-gray-900 transition"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-lg shadow-lg p-2 mb-3">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-white/20 rounded-full">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Community Impact</h1>
              <p className="text-green-100 text-xs">See the difference we're making together</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-1.5 mb-3">
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
        <div className="bg-white rounded-lg shadow-md p-4 text-center">
          <Leaf className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <h2 className="text-base font-bold text-gray-900 mb-2">
            Together We're Making a Difference
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-sm">
            Every item shared helps reduce food waste and strengthen community bonds.
          </p>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-lg font-bold text-green-600">100%</p>
                <p className="text-xs text-gray-600">Free</p>
              </div>
              <div>
                <p className="text-lg font-bold text-green-600">24/7</p>
                <p className="text-xs text-gray-600">Available</p>
              </div>
              <div>
                <p className="text-lg font-bold text-green-600">Local</p>
                <p className="text-xs text-gray-600">Nearby</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
