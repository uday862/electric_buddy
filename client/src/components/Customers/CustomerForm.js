import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeftIcon, PhotoIcon } from '@heroicons/react/24/outline';
import Sidebar from '../Layout/Sidebar';
import Header from '../Layout/Header';
import ToastContainer from '../Common/ToastContainer';
import { useToast } from '../../hooks/useToast';

const CustomerForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    mobile: '',
    area: '',
    address: '',
    workStatus: 'pending',
    jobDetail: '',
    totalAmount: 0,
    paymentPaid: 0,
    paymentDue: 0,
    dueDate: '',
    completionStatus: 'Not Started',
    materials: [],
    paymentHistory: []
  });

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEditing);
  const [materialInput, setMaterialInput] = useState({
    name: '',
    cost: '',
    purchasedByAdmin: false
  });
  const [housePhoto, setHousePhoto] = useState(null);
  const [ownerPhoto, setOwnerPhoto] = useState(null);
  const [housePhotoPreview, setHousePhotoPreview] = useState(null);
  const [ownerPhotoPreview, setOwnerPhotoPreview] = useState(null);
  const { toasts, showSuccess, showError, removeToast } = useToast();

  const fetchCustomer = useCallback(async () => {
    try {
      const response = await axios.get(`/customers/${id}`);
      const customer = response.data.user;
      // Convert materials from old format (strings) to new format (objects) if needed
      const materials = (customer.materials || []).map(m => 
        typeof m === 'string' 
          ? { name: m, cost: null, purchasedByAdmin: false }
          : { name: m.name, cost: m.cost || null, purchasedByAdmin: m.purchasedByAdmin || false }
      );
      // Format payment history dates for date inputs
      const formattedPaymentHistory = (customer.paymentHistory || []).map(payment => ({
        date: payment.date ? (typeof payment.date === 'string' 
          ? payment.date.split('T')[0] 
          : new Date(payment.date).toISOString().split('T')[0]) 
          : new Date().toISOString().split('T')[0],
        amount: payment.amount || 0,
        description: payment.description || ''
      }));

      setFormData({
        name: customer.name || '',
        username: customer.username || '',
        password: '', // Don't populate password for editing
        mobile: customer.mobile || '',
        area: customer.area || '',
        address: customer.address || '',
        workStatus: customer.workStatus || 'pending',
        jobDetail: customer.jobDetail || '',
        totalAmount: customer.totalAmount || 0,
        paymentPaid: customer.paymentPaid || 0,
        paymentDue: customer.paymentDue || 0,
        dueDate: customer.dueDate ? customer.dueDate.split('T')[0] : '',
        completionStatus: customer.completionStatus || 'Not Started',
        materials: materials,
        paymentHistory: formattedPaymentHistory
      });
      
      // Set photo previews if photos exist
      if (customer.housePhoto) {
        setHousePhotoPreview(customer.housePhoto);
      }
      if (customer.ownerPhoto) {
        setOwnerPhotoPreview(customer.ownerPhoto);
      }
    } catch (error) {
      console.error('Error fetching customer:', error);
      alert('Failed to load customer data');
      navigate('/customers');
    } finally {
      setFetchLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    if (isEditing) {
      fetchCustomer();
    }
  }, [isEditing, fetchCustomer]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : (name.includes('payment') || name === 'totalAmount' || name === 'mobile' ? (value === '' ? '' : Number(value)) : value);
    
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: newValue
      };
      
      // Auto-update pending amount when totalAmount changes
      if (name === 'totalAmount') {
        const totalPaid = prev.paymentHistory.reduce((sum, payment) => sum + (payment.amount || 0), 0);
        const pending = (newValue || 0) - totalPaid;
        updated.paymentDue = pending > 0 ? pending : 0;
      }
      
      return updated;
    });
  };

  const handleMaterialInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setMaterialInput(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'cost' ? (value === '' ? '' : Number(value)) : value)
    }));
  };

  const handleAddMaterial = () => {
    if (materialInput.name.trim()) {
      const materialExists = formData.materials.some(m => m.name.toLowerCase() === materialInput.name.trim().toLowerCase());
      if (!materialExists) {
        const newMaterial = {
          name: materialInput.name.trim(),
          cost: materialInput.purchasedByAdmin && materialInput.cost !== '' ? Number(materialInput.cost) : null,
          purchasedByAdmin: materialInput.purchasedByAdmin
        };
        setFormData(prev => ({
          ...prev,
          materials: [...prev.materials, newMaterial]
        }));
        setMaterialInput({ name: '', cost: '', purchasedByAdmin: false });
      } else {
        alert('Material already exists');
      }
    }
  };

  const handleRemoveMaterial = (index) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateMaterial = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.map((m, i) => 
        i === index 
          ? { ...m, [field]: field === 'cost' ? (value === '' ? null : Number(value)) : (field === 'purchasedByAdmin' ? value : value) }
          : m
      )
    }));
  };

  const handlePhotoChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showError('Please select a valid image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showError('Image size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        if (type === 'house') {
          setHousePhoto(base64String);
          setHousePhotoPreview(base64String);
        } else {
          setOwnerPhoto(base64String);
          setOwnerPhotoPreview(base64String);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = (type) => {
    if (type === 'house') {
      setHousePhoto(null);
      setHousePhotoPreview(null);
    } else {
      setOwnerPhoto(null);
      setOwnerPhotoPreview(null);
    }
  };


  // Calculate total paid from payment history
  const calculatePaymentPaid = () => {
    return formData.paymentHistory.reduce((sum, payment) => sum + (payment.amount || 0), 0);
  };

  // Calculate pending amount: Total Amount - Total Paid
  const calculatePaymentDue = () => {
    const totalPaid = calculatePaymentPaid();
    const totalAmount = formData.totalAmount || 0;
    const pending = totalAmount - totalPaid;
    return pending > 0 ? pending : 0; // Don't show negative
  };

  // Check if fully paid
  const isFullyPaid = () => {
    const totalPaid = calculatePaymentPaid();
    const totalAmount = formData.totalAmount || 0;
    return totalAmount > 0 && totalPaid >= totalAmount;
  };

  // Calculate materials total cost separately
  const calculateMaterialsCost = () => {
    return formData.materials
      .filter(m => m.purchasedByAdmin && m.cost !== null && m.cost > 0)
      .reduce((sum, m) => sum + m.cost, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = { ...formData };
      
      // Ensure materials is an array of objects - clean and validate
      if (submitData.materials && Array.isArray(submitData.materials)) {
        submitData.materials = submitData.materials
          .filter(m => m && (m.name || typeof m === 'string')) // Filter out invalid entries
          .map(m => {
            // Handle both object and string formats
            if (typeof m === 'string') {
              return { name: m, cost: null, purchasedByAdmin: false };
            }
            return {
              name: String(m.name || ''),
              cost: (m.purchasedByAdmin && m.cost !== null && m.cost !== undefined && m.cost !== '') ? Number(m.cost) : null,
              purchasedByAdmin: Boolean(m.purchasedByAdmin)
            };
          })
          .filter(m => m.name && m.name.trim() !== ''); // Remove empty names
      } else {
        submitData.materials = [];
      }
      
      // Debug: Log materials before sending
      console.log('Materials being sent:', submitData.materials);
      console.log('Materials type:', Array.isArray(submitData.materials) ? 'Array' : typeof submitData.materials);
      
      // Use calculated values
      submitData.paymentPaid = calculatePaymentPaid();
      submitData.paymentDue = calculatePaymentDue();
      
      // Calculate materials total cost separately
      submitData.materialsTotalCost = calculateMaterialsCost();
      
      // Format payment history properly for backend - ensure all payments are included
      const processedPaymentHistory = (formData.paymentHistory || [])
        .filter(payment => payment && payment.amount && Number(payment.amount) > 0) // Only valid payments with amount > 0
        .map(payment => {
          // Ensure date is in ISO string format (YYYY-MM-DD) for backend to parse
          let dateStr = '';
          if (payment.date) {
            if (typeof payment.date === 'string') {
              // If it's already a string, ensure it's in YYYY-MM-DD format
              dateStr = payment.date.split('T')[0];
            } else if (payment.date instanceof Date) {
              // If it's a Date object, convert to ISO string
              dateStr = payment.date.toISOString().split('T')[0];
            } else {
              // Try to parse as date
              dateStr = new Date(payment.date).toISOString().split('T')[0];
            }
          } else {
            dateStr = new Date().toISOString().split('T')[0];
          }
          
          return {
            date: dateStr, // Backend will convert this to Date object
            amount: Number(payment.amount) || 0,
            description: (payment.description || '').trim()
          };
        });
      
      // Always include paymentHistory in submitData - backend expects this array
      submitData.paymentHistory = processedPaymentHistory;
      
      // Debug: Log payment history being sent
      console.log('Payment history being sent:', processedPaymentHistory);
      console.log('Payment history count:', processedPaymentHistory.length);
      
      // Add photos to submit data
      if (housePhoto) {
        submitData.housePhoto = housePhoto;
      }
      if (ownerPhoto) {
        submitData.ownerPhoto = ownerPhoto;
      }
      
      if (!isEditing) {
        submitData.password = submitData.password || 'default123';
      } else {
        delete submitData.password; // Don't update password if editing
      }

      if (isEditing) {
        const response = await axios.put(`/customers/${id}`, submitData);
        
        showSuccess('Customer updated successfully!');
        // Refresh customer data to get updated payment history - use the response data directly
        if (response.data && response.data.user) {
          const customer = response.data.user;
          // Format payment history dates for date inputs
          const formattedPaymentHistory = (customer.paymentHistory || []).map(payment => ({
            date: payment.date ? (typeof payment.date === 'string' 
              ? payment.date.split('T')[0] 
              : new Date(payment.date).toISOString().split('T')[0]) 
              : new Date().toISOString().split('T')[0],
            amount: payment.amount || 0,
            description: payment.description || ''
          }));
          
          // Update form data with the response
          setFormData(prev => ({
            ...prev,
            totalAmount: customer.totalAmount || prev.totalAmount,
            paymentPaid: customer.paymentPaid || 0,
            paymentDue: customer.paymentDue || 0,
            paymentHistory: formattedPaymentHistory
          }));
        } else {
          // Fallback to fetching if response doesn't have user data
          setTimeout(async () => {
            await fetchCustomer();
          }, 500);
        }
      } else {
        await axios.post('/customers', submitData);
        showSuccess('Customer created successfully!');
        // Navigate after a short delay to show the success message
        setTimeout(() => {
          navigate('/customers');
        }, 1500);
      }
    } catch (error) {
      console.error('Error saving customer:', error);
      showError(error.response?.data?.message || 'Failed to save customer');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
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
        <ToastContainer toasts={toasts} removeToast={removeToast} />

        <main className="p-6">
          <div className="mb-6">
            <button
              onClick={() => navigate('/customers')}
              className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Customers
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditing ? 'Edit Customer' : 'Add New Customer'}
            </h1>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="input-field"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="label">Username *</label>
                  <input
                    type="text"
                    name="username"
                    required
                    className="input-field"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="johndoe"
                    disabled={isEditing}
                  />
                  {isEditing && (
                    <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
                  )}
                </div>

                {!isEditing && (
                  <div>
                    <label className="label">Password</label>
                    <input
                      type="password"
                      name="password"
                      className="input-field"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Leave empty for default password"
                    />
                    <p className="text-xs text-gray-500 mt-1">Default: default123</p>
                  </div>
                )}

                <div>
                  <label className="label">Mobile Number *</label>
                  <input
                    type="tel"
                    name="mobile"
                    required
                    className="input-field"
                    value={formData.mobile}
                    onChange={handleChange}
                    placeholder="9876543210"
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
                    placeholder="Downtown"
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
                    placeholder="123 Main Street"
                  />
                </div>
              </div>

              {/* Work Information */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Work Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="label">Work Status</label>
                    <select
                      name="workStatus"
                      className="input-field"
                      value={formData.workStatus}
                      onChange={handleChange}
                    >
                      <option value="pending">Pending</option>
                      <option value="ongoing">Ongoing</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  <div>
                    <label className="label">Completion Status</label>
                    <input
                      type="text"
                      name="completionStatus"
                      className="input-field"
                      value={formData.completionStatus}
                      onChange={handleChange}
                      placeholder="In Progress"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="label">Job Details</label>
                    <textarea
                      name="jobDetail"
                      rows={3}
                      className="input-field"
                      value={formData.jobDetail}
                      onChange={handleChange}
                      placeholder="Describe the electrical work to be done..."
                    />
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="border-t pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Payment Information</h3>
                  <div className="text-sm">
                    <span className="text-gray-600">Total Paid: </span>
                    <span className="font-bold text-green-600">₹{calculatePaymentPaid().toLocaleString()}</span>
                  </div>
                </div>

                {/* Payment History List - Read Only */}
                {formData.paymentHistory.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-md font-medium text-gray-700 mb-2">Payment History (View Only)</h4>
                    <p className="text-xs text-gray-500 mb-3">
                      To add new payments, use the "Add Payment" feature in the customer detail page.
                    </p>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {formData.paymentHistory.map((payment, index) => (
                        <div key={index} className="flex items-center gap-4 p-3 bg-white border border-gray-200 rounded-lg">
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <span className="text-xs text-gray-500">Date</span>
                              <p className="text-sm font-medium text-gray-900">
                                {new Date(payment.date).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">Amount</span>
                              <p className="text-sm font-bold text-green-600">₹{payment.amount.toLocaleString()}</p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">Description</span>
                              <p className="text-sm text-gray-900">{payment.description || 'No description'}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Payment Status Alert */}
                {isFullyPaid() && (
                  <div className="mt-4 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <svg className="h-6 w-6 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-lg font-bold text-green-800">✅ Payment Complete!</p>
                        <p className="text-sm text-green-700">Total amount of ₹{formData.totalAmount.toLocaleString()} has been fully paid.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Summary Fields */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-4">
                  <div>
                    <label className="label">Total Amount (₹) *</label>
                    <input
                      type="number"
                      name="totalAmount"
                      min="0"
                      className="input-field"
                      value={formData.totalAmount}
                      onChange={handleChange}
                      placeholder="12000"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Total job cost (e.g., 12,000)
                    </p>
                  </div>

                  <div>
                    <label className="label">Total Paid (₹)</label>
                    <div className={`input-field font-semibold ${
                      isFullyPaid() 
                        ? 'bg-green-100 text-green-700 border-green-300' 
                        : 'bg-blue-50 text-blue-700'
                    }`}>
                      ₹{calculatePaymentPaid().toLocaleString()}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Sum of all payments
                    </p>
                  </div>

                  <div>
                    <label className="label">Pending Amount (₹)</label>
                    <div className={`input-field font-semibold ${
                      calculatePaymentDue() === 0 
                        ? 'bg-green-50 text-green-700' 
                        : 'bg-red-50 text-red-700'
                    }`}>
                      ₹{calculatePaymentDue().toLocaleString()}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Auto: Total - Paid
                    </p>
                  </div>

                  <div>
                    <label className="label">Due Date</label>
                    <input
                      type="date"
                      name="dueDate"
                      className="input-field"
                      value={formData.dueDate}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* Photo Upload Section */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Photos for Identification</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* House Photo */}
                  <div>
                    <label className="label">House Photo</label>
                    <div className="mt-2">
                      {housePhotoPreview ? (
                        <div className="relative">
                          <img
                            src={housePhotoPreview}
                            alt="House preview"
                            className="w-full h-48 object-cover rounded-lg border border-gray-300"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto('house')}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <PhotoIcon className="w-10 h-10 mb-3 text-gray-400" />
                            <p className="mb-2 text-sm text-gray-500">
                              <span className="font-semibold">Click to upload</span> house photo
                            </p>
                            <p className="text-xs text-gray-500">PNG, JPG or JPEG (MAX. 5MB)</p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => handlePhotoChange(e, 'house')}
                          />
                        </label>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Upload a photo of the house for easy identification</p>
                  </div>

                  {/* Owner Photo */}
                  <div>
                    <label className="label">Owner Photo</label>
                    <div className="mt-2">
                      {ownerPhotoPreview ? (
                        <div className="relative">
                          <img
                            src={ownerPhotoPreview}
                            alt="Owner preview"
                            className="w-full h-48 object-cover rounded-lg border border-gray-300"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto('owner')}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <PhotoIcon className="w-10 h-10 mb-3 text-gray-400" />
                            <p className="mb-2 text-sm text-gray-500">
                              <span className="font-semibold">Click to upload</span> owner photo
                            </p>
                            <p className="text-xs text-gray-500">PNG, JPG or JPEG (MAX. 5MB)</p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => handlePhotoChange(e, 'owner')}
                          />
                        </label>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Upload a photo of the owner for easy identification</p>
                  </div>
                </div>
              </div>

              {/* Materials */}
              <div className="border-t pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Materials Used</h3>
                  <div className="text-sm">
                    <span className="text-gray-600">Materials Cost: </span>
                    <span className="font-bold text-green-600">₹{calculateMaterialsCost().toLocaleString()}</span>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <label className="label text-sm">Material Name</label>
                      <input
                        type="text"
                        name="name"
                        className="input-field"
                        value={materialInput.name}
                        onChange={handleMaterialInputChange}
                        placeholder="e.g., Wire, Switch"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddMaterial())}
                      />
                    </div>
                    <div>
                      <label className="label text-sm">Cost (₹)</label>
                      <input
                        type="number"
                        name="cost"
                        min="0"
                        className="input-field"
                        value={materialInput.cost}
                        onChange={handleMaterialInputChange}
                        placeholder="0"
                        disabled={!materialInput.purchasedByAdmin}
                      />
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="purchasedByAdmin"
                          checked={materialInput.purchasedByAdmin}
                          onChange={handleMaterialInputChange}
                          className="mr-2 w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-sm text-gray-700">Purchased by Admin</span>
                      </label>
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={handleAddMaterial}
                        className="btn-primary w-full"
                      >
                        Add Material
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {formData.materials.map((material, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 bg-white border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <span className="font-medium text-gray-900">{material.name}</span>
                        {material.purchasedByAdmin && material.cost !== null && (
                          <span className="ml-2 text-sm text-gray-600">(₹{material.cost.toLocaleString()})</span>
                        )}
                        {material.purchasedByAdmin && (
                          <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Admin Purchase</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          className="input-field w-24 text-sm"
                          value={material.cost === null ? '' : material.cost}
                          onChange={(e) => handleUpdateMaterial(index, 'cost', e.target.value)}
                          placeholder="Cost"
                          disabled={!material.purchasedByAdmin}
                        />
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={material.purchasedByAdmin}
                            onChange={(e) => handleUpdateMaterial(index, 'purchasedByAdmin', e.target.checked)}
                            className="mr-1 w-4 h-4 text-blue-600 rounded"
                          />
                          <span className="text-xs text-gray-600">Admin</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => handleRemoveMaterial(index)}
                          className="text-red-600 hover:text-red-800 text-lg font-bold"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                  {formData.materials.length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-4">No materials added yet</p>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => navigate('/customers')}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (isEditing ? 'Update Customer' : 'Create Customer')}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CustomerForm;
