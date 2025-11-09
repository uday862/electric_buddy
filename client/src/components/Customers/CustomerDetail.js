import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeftIcon, PencilIcon, PlusIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import Sidebar from '../Layout/Sidebar';
import Header from '../Layout/Header';

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingPayment, setAddingPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const fetchCustomer = async () => {
    try {
      const response = await axios.get(`/customers/${id}`);
      setCustomer(response.data.user);
    } catch (error) {
      console.error('Error fetching customer:', error);
      alert('Failed to load customer details');
      navigate('/customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomer();
  }, [id, navigate]);

  const handleAddPayment = async (e) => {
    e.preventDefault();
    if (!paymentForm.amount || paymentForm.amount <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    setAddingPayment(true);
    try {
      const response = await axios.post(`/customers/${id}/payments`, {
        amount: Number(paymentForm.amount),
        description: paymentForm.description,
        date: paymentForm.date
      });

      // Update customer data with new payment
      setCustomer(response.data.customer);
      
      // Reset form
      setPaymentForm({
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
      setShowPaymentForm(false);
      
      // Show success message
      const paymentAmount = Number(paymentForm.amount);
      const newTotalPaid = response.data.customer.paymentPaid || 0;
      const newPending = response.data.customer.paymentDue || 0;
      
      if (newPending === 0) {
        alert(`🎉 Payment Complete! Payment of ₹${paymentAmount.toLocaleString()} added. Total amount fully paid!`);
      } else {
        alert(`✅ Payment of ₹${paymentAmount.toLocaleString()} added successfully!\n\nTotal Paid: ₹${newTotalPaid.toLocaleString()}\nPending: ₹${newPending.toLocaleString()}`);
      }
    } catch (error) {
      console.error('Error adding payment:', error);
      alert(error.response?.data?.message || 'Failed to add payment');
    } finally {
      setAddingPayment(false);
    }
  };

  const handlePaymentFormChange = (e) => {
    const { name, value } = e.target;
    setPaymentForm(prev => ({
      ...prev,
      [name]: name === 'amount' ? (value === '' ? '' : value) : value
    }));
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'status-pending',
      ongoing: 'status-ongoing',
      completed: 'status-completed'
    };

    return (
      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${statusClasses[status] || 'status-pending'}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1) || 'Pending'}
      </span>
    );
  };

  const getPaymentStatus = (paid, due) => {
    if (due === 0) return <span className="payment-paid">Paid</span>;
    if (paid === 0) return <span className="payment-unpaid">Unpaid</span>;
    return <span className="payment-partial">Partial</span>;
  };

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

  if (!customer) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="flex-1 ml-64">
          <Header />
          <div className="p-6">
            <p>Customer not found</p>
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
          <div className="mb-6">
            <button
              onClick={() => navigate('/customers')}
              className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Customers
            </button>
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900">Customer Details</h1>
              <div className="flex space-x-3">
                <Link
                  to={`/chat/${id}`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700"
                >
                  <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
                  Chat
                </Link>
                <Link
                  to={`/customers/${id}/edit`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
                >
                  <PencilIcon className="h-5 w-5 mr-2" />
                  Edit Customer
                </Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Full Name</label>
                    <p className="text-lg text-gray-900 mt-1">{customer.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Username</label>
                    <p className="text-lg text-gray-900 mt-1">@{customer.username || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Mobile Number</label>
                    <p className="text-lg text-gray-900 mt-1">{customer.mobile || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Area</label>
                    <p className="text-lg text-gray-900 mt-1">{customer.area || 'N/A'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-500">Address</label>
                    <p className="text-lg text-gray-900 mt-1">{customer.address || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Photos Section */}
              {(customer.housePhoto || customer.ownerPhoto) && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Identification Photos</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {customer.housePhoto && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">House Photo</label>
                        <img
                          src={customer.housePhoto}
                          alt="House"
                          className="w-full h-64 object-cover rounded-lg border border-gray-300 mt-2"
                        />
                      </div>
                    )}
                    {customer.ownerPhoto && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Owner Photo</label>
                        <img
                          src={customer.ownerPhoto}
                          alt="Owner"
                          className="w-full h-64 object-cover rounded-lg border border-gray-300 mt-2"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Work Information */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Work Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Work Status</label>
                    <div className="mt-2">
                      {getStatusBadge(customer.workStatus)}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Completion Status</label>
                    <p className="text-lg text-gray-900 mt-1">
                      {customer.completionStatus || 'Not Started'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Job Details</label>
                    <p className="text-lg text-gray-900 mt-1 whitespace-pre-wrap">
                      {customer.jobDetail || 'No job details provided'}
                    </p>
                  </div>
                  {customer.materials && customer.materials.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Materials Used</label>
                      <div className="space-y-2 mt-2">
                        {customer.materials.map((material, index) => {
                          const materialName = typeof material === 'string' ? material : material.name;
                          const materialCost = typeof material === 'object' ? material.cost : null;
                          const purchasedByAdmin = typeof material === 'object' ? material.purchasedByAdmin : false;
                          return (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm text-gray-900">{materialName}</span>
                              <div className="flex items-center gap-2">
                                {purchasedByAdmin && materialCost !== null && (
                                  <span className="text-sm font-medium text-gray-700">₹{materialCost.toLocaleString()}</span>
                                )}
                                {purchasedByAdmin && (
                                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Admin Purchase</span>
                                )}
                                {!purchasedByAdmin && (
                                  <span className="text-xs text-gray-500">Customer Provided</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {customer.materials.some(m => typeof m === 'object' && m.purchasedByAdmin && m.cost !== null) && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium text-gray-700">Materials Cost (Admin):</span>
                            <span className="text-sm font-bold text-gray-900">
                              ₹{customer.materials
                                .filter(m => typeof m === 'object' && m.purchasedByAdmin && m.cost !== null)
                                .reduce((sum, m) => sum + m.cost, 0)
                                .toLocaleString()}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar Information */}
            <div className="space-y-6">
              {/* Payment Information */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Payment Information</h2>
                  <button
                    onClick={() => setShowPaymentForm(!showPaymentForm)}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg"
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Payment
                  </button>
                </div>

                {/* Add Payment Form */}
                {showPaymentForm && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Payment</h3>
                    <form onSubmit={handleAddPayment} className="space-y-4">
                      <div>
                        <label className="label text-sm">Payment Amount (₹) *</label>
                        <input
                          type="number"
                          name="amount"
                          required
                          min="0.01"
                          step="0.01"
                          className="input-field"
                          value={paymentForm.amount}
                          onChange={handlePaymentFormChange}
                          placeholder="Enter amount"
                        />
                      </div>
                      <div>
                        <label className="label text-sm">Payment Date</label>
                        <input
                          type="date"
                          name="date"
                          className="input-field"
                          value={paymentForm.date}
                          onChange={handlePaymentFormChange}
                        />
                      </div>
                      <div>
                        <label className="label text-sm">Description (Optional)</label>
                        <textarea
                          name="description"
                          rows={2}
                          className="input-field"
                          value={paymentForm.description}
                          onChange={handlePaymentFormChange}
                          placeholder="Payment description or notes"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={addingPayment}
                          className="btn-primary flex-1 disabled:opacity-50"
                        >
                          {addingPayment ? 'Adding...' : 'Add Payment'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowPaymentForm(false);
                            setPaymentForm({
                              amount: '',
                              description: '',
                              date: new Date().toISOString().split('T')[0]
                            });
                          }}
                          className="btn-secondary"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Total Amount</label>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      ₹{(customer.totalAmount || (customer.paymentPaid || 0) + (customer.paymentDue || 0)).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">(Given + Pending)</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Given Amount</label>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                      ₹{(customer.paymentPaid || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Pending Amount</label>
                    <p className="text-2xl font-bold text-red-600 mt-1">
                      ₹{(customer.paymentDue || 0).toLocaleString()}
                    </p>
                  </div>
                  {customer.paymentHistory && customer.paymentHistory.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Payment History ({customer.paymentHistory.length})</label>
                      <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                        {[...customer.paymentHistory]
                          .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort by date, newest first
                          .map((payment, index) => (
                          <div key={index} className="p-2 bg-gray-50 rounded border border-gray-200">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">
                                  ₹{Number(payment.amount || 0).toLocaleString()}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {payment.date ? new Date(payment.date).toLocaleDateString() : 'N/A'}
                                </p>
                              </div>
                              {payment.description && (
                                <p className="text-xs text-gray-600 text-right max-w-[150px]">{payment.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-500">Materials Cost</label>
                    <p className="text-2xl font-bold text-blue-600 mt-1">
                      ₹{(customer.materialsTotalCost || customer.materials?.filter(m => typeof m === 'object' && m.purchasedByAdmin && m.cost !== null).reduce((sum, m) => sum + m.cost, 0) || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">(Separate from total)</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Payment Status</label>
                    <div className="mt-2">
                      {getPaymentStatus(customer.paymentPaid || 0, customer.paymentDue || 0)}
                    </div>
                  </div>
                  {customer.dueDate && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Due Date</label>
                      <p className="text-lg text-gray-900 mt-1">
                        {new Date(customer.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Account Information */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Account Created</label>
                    <p className="text-lg text-gray-900 mt-1">
                      {customer.createdAt
                        ? new Date(customer.createdAt).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Last Updated</label>
                    <p className="text-lg text-gray-900 mt-1">
                      {customer.updatedAt
                        ? new Date(customer.updatedAt).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CustomerDetail;

