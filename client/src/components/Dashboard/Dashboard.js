import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import {
  UsersIcon,
  CurrencyDollarIcon,
  WrenchScrewdriverIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import Sidebar from '../Layout/Sidebar';
import Header from '../Layout/Header';

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (isAdmin) {
          const response = await axios.get('/customers/stats');
          setStats(response.data.stats);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [isAdmin]);

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="flex-1 ml-64">
          <Header />
          <div className="p-6 flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header />

        <main className="p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-gray-600 mt-2">
              Here's what's happening with your {isAdmin ? 'business' : 'jobs'} today.
            </p>
          </div>

          {isAdmin && stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div
                onClick={() => navigate('/customers')}
                className="cursor-pointer transform hover:scale-105 transition-transform"
              >
                <StatCard
                  title="Total Customers"
                  value={stats.totalCustomers}
                  icon={UsersIcon}
                  color="bg-blue-500"
                />
              </div>
              <div
                onClick={() => navigate('/customers')}
                className="cursor-pointer transform hover:scale-105 transition-transform"
              >
                <StatCard
                  title="Ongoing Jobs"
                  value={stats.totalOngoing}
                  icon={WrenchScrewdriverIcon}
                  color="bg-yellow-500"
                />
              </div>
              <div
                onClick={() => navigate('/customers')}
                className="cursor-pointer transform hover:scale-105 transition-transform"
              >
                <StatCard
                  title="Completed Jobs"
                  value={stats.totalCompleted}
                  icon={CheckCircleIcon}
                  color="bg-green-500"
                />
              </div>
              <StatCard
                title="Total Revenue"
                value={`₹${stats.totalRevenue?.toLocaleString() || 0}`}
                icon={CurrencyDollarIcon}
                color="bg-purple-500"
              />
            </div>
          )}

          {!isAdmin && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <ClockIcon className="h-8 w-8 text-yellow-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Work Status</p>
                    <p className="text-lg font-semibold text-gray-900 capitalize">
                      {user?.workStatus || 'Pending'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <CurrencyDollarIcon className="h-8 w-8 text-green-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Payment Paid</p>
                    <p className="text-lg font-semibold text-gray-900">
                      ₹{user?.paymentPaid || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Payment Due</p>
                    <p className="text-lg font-semibold text-gray-900">
                      ₹{user?.paymentDue || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recent Activity or Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {isAdmin ? 'Quick Actions' : 'Your Job Details'}
            </h2>

            {isAdmin ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  onClick={() => navigate('/customers/new')}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
                >
                  <UsersIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-600">Add New Customer</p>
                </button>

                <button
                  onClick={() => navigate('/customers')}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors cursor-pointer"
                >
                  <WrenchScrewdriverIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-600">View All Customers</p>
                </button>

                <button
                  onClick={() => navigate('/customers')}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors cursor-pointer"
                >
                  <CurrencyDollarIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-600">View Customers</p>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-medium text-gray-900">Job Status</h3>
                  <p className="text-sm text-gray-600 capitalize">
                    {user?.completionStatus || 'Not Started'}
                  </p>
                </div>

                {user?.jobDetail && (
                  <div className="border-l-4 border-green-500 pl-4">
                    <h3 className="font-medium text-gray-900">Job Details</h3>
                    <p className="text-sm text-gray-600">{user.jobDetail}</p>
                  </div>
                )}

                {user?.materials && user.materials.length > 0 && (
                  <div className="border-l-4 border-purple-500 pl-4">
                    <h3 className="font-medium text-gray-900">Materials Used</h3>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {user.materials.map((material, index) => {
                        const materialName = typeof material === 'string' ? material : material.name;
                        const materialCost = typeof material === 'object' ? material.cost : null;
                        const purchasedByAdmin = typeof material === 'object' ? material.purchasedByAdmin : false;
                        return (
                          <span
                            key={index}
                            className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full"
                          >
                            {materialName}
                            {purchasedByAdmin && materialCost !== null && (
                              <span className="ml-1">(₹{materialCost.toLocaleString()})</span>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
