import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../Layout/Sidebar';
import Header from '../Layout/Header';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    mobile: user?.mobile || '',
    area: user?.area || '',
    address: user?.address || ''
  });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const result = await updateProfile(formData);

    if (result.success) {
      setMessage('Profile updated successfully!');
      setIsEditing(false);
    } else {
      setMessage(result.message);
    }

    setLoading(false);
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      mobile: user?.mobile || '',
      area: user?.area || '',
      address: user?.address || ''
    });
    setIsEditing(false);
    setMessage('');
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header />

        <main className="p-6">
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
              <p className="text-gray-600 mt-2">Manage your account information</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              {message && (
                <div className={`mb-4 p-4 rounded-lg ${
                  message.includes('successfully')
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {message}
                </div>
              )}

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  {user?.ownerPhoto ? (
                    <img
                      src={user.ownerPhoto}
                      alt="Owner"
                      className="h-16 w-16 rounded-full object-cover border-2 border-blue-200"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-xl">
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                  <div className="ml-4">
                    <h2 className="text-xl font-semibold text-gray-900">{user?.name}</h2>
                    <p className="text-gray-600">@{user?.username}</p>
                    <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
                  </div>
                </div>

                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="btn-primary"
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="label">Full Name</label>
                      <input
                        type="text"
                        name="name"
                        className="input-field"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div>
                      <label className="label">Mobile Number</label>
                      <input
                        type="tel"
                        name="mobile"
                        className="input-field"
                        value={formData.mobile}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div>
                      <label className="label">Area</label>
                      <input
                        type="text"
                        name="area"
                        className="input-field"
                        value={formData.area}
                        onChange={handleChange}
                      />
                    </div>

                    <div>
                      <label className="label">Address</label>
                      <input
                        type="text"
                        name="address"
                        className="input-field"
                        value={formData.address}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="label">Full Name</label>
                      <p className="text-gray-900">{user?.name}</p>
                    </div>

                    <div>
                      <label className="label">Username</label>
                      <p className="text-gray-900">@{user?.username}</p>
                    </div>

                    <div>
                      <label className="label">Mobile Number</label>
                      <p className="text-gray-900">{user?.mobile}</p>
                    </div>

                    <div>
                      <label className="label">Role</label>
                      <p className="text-gray-900 capitalize">{user?.role}</p>
                    </div>

                    <div>
                      <label className="label">Area</label>
                      <p className="text-gray-900">{user?.area || 'Not specified'}</p>
                    </div>

                    <div>
                      <label className="label">Address</label>
                      <p className="text-gray-900">{user?.address || 'Not specified'}</p>
                    </div>
                  </div>

                  {user?.role === 'customer' && (
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Job Information</h3>
                      
                      {/* Photos Section */}
                      {(user?.housePhoto || user?.ownerPhoto) && (
                        <div className="mb-6">
                          <h4 className="text-md font-medium text-gray-700 mb-3">Identification Photos</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {user.housePhoto && (
                              <div>
                                <label className="label text-sm">House Photo</label>
                                <img
                                  src={user.housePhoto}
                                  alt="House"
                                  className="w-full h-64 object-cover rounded-lg border border-gray-300 mt-2"
                                />
                              </div>
                            )}
                            {user.ownerPhoto && (
                              <div>
                                <label className="label text-sm">Owner Photo</label>
                                <img
                                  src={user.ownerPhoto}
                                  alt="Owner"
                                  className="w-full h-64 object-cover rounded-lg border border-gray-300 mt-2"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="label">Work Status</label>
                          <p className="text-gray-900 capitalize">{user?.workStatus || 'Pending'}</p>
                        </div>

                        <div>
                          <label className="label">Completion Status</label>
                          <p className="text-gray-900">{user?.completionStatus || 'Not Started'}</p>
                        </div>

                        <div>
                          <label className="label">Payment Paid</label>
                          <p className="text-gray-900">₹{user?.paymentPaid || 0}</p>
                        </div>

                        <div>
                          <label className="label">Payment Due</label>
                          <p className="text-gray-900">₹{user?.paymentDue || 0}</p>
                        </div>

                        {user?.paymentHistory && user.paymentHistory.length > 0 && (
                          <div className="md:col-span-2">
                            <label className="label">Payment History</label>
                            <div className="mt-2 space-y-2">
                              {user.paymentHistory.map((payment, index) => (
                                <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">
                                        ₹{payment.amount.toLocaleString()}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {new Date(payment.date).toLocaleDateString()}
                                      </p>
                                    </div>
                                    {payment.description && (
                                      <p className="text-xs text-gray-600">{payment.description}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {user?.jobDetail && (
                          <div className="md:col-span-2">
                            <label className="label">Job Details</label>
                            <p className="text-gray-900">{user.jobDetail}</p>
                          </div>
                        )}

                        {user?.materials && user.materials.length > 0 && (
                          <div className="md:col-span-2">
                            <label className="label">Materials Used</label>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {user.materials.map((material, index) => {
                                const materialName = typeof material === 'string' ? material : material.name;
                                const materialCost = typeof material === 'object' ? material.cost : null;
                                const purchasedByAdmin = typeof material === 'object' ? material.purchasedByAdmin : false;
                                return (
                                  <span
                                    key={index}
                                    className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                                  >
                                    {materialName}
                                    {purchasedByAdmin && materialCost !== null && (
                                      <span className="ml-1 text-xs">(₹{materialCost.toLocaleString()})</span>
                                    )}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;
