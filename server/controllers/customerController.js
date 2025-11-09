import User from '../models/User.js';

// @desc    Get all customers with filtering and pagination
// @route   GET /api/customers
// @access  Private (Admin only)
export const getCustomers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '',
      workStatus = '',
      area = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { role: 'customer', isActive: true };
    
    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { area: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } }
      ];
    }

    // Work status filter
    if (workStatus && ['ongoing', 'completed', 'pending'].includes(workStatus)) {
      filter.workStatus = workStatus;
    }

    // Area filter
    if (area) {
      filter.area = { $regex: area, $options: 'i' };
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const customers = await User.find(filter)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-password');

    // Get total count for pagination
    const total = await User.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      message: 'Customers fetched successfully',
      customers,
      pagination: {
        current: parseInt(page),
        pages: totalPages,
        total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching customers',
      error: error.message
    });
  }
};

// @desc    Get customer statistics
// @route   GET /api/customers/stats
// @access  Private (Admin only)
export const getCustomerStats = async (req, res) => {
  try {
    const stats = await User.aggregate([
      { $match: { role: 'customer', isActive: true } },
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          totalOngoing: { $sum: { $cond: [{ $eq: ['$workStatus', 'ongoing'] }, 1, 0] } },
          totalCompleted: { $sum: { $cond: [{ $eq: ['$workStatus', 'completed'] }, 1, 0] } },
          totalPending: { $sum: { $cond: [{ $eq: ['$workStatus', 'pending'] }, 1, 0] } },
          totalRevenue: { $sum: '$paymentPaid' },
          totalDue: { $sum: '$paymentDue' },
          avgPayment: { $avg: '$paymentPaid' }
        }
      }
    ]);

    const areaStats = await User.aggregate([
      { $match: { role: 'customer', isActive: true } },
      {
        $group: {
          _id: '$area',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$paymentPaid' },
          totalDue: { $sum: '$paymentDue' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      stats: stats[0] || {
        totalCustomers: 0,
        totalOngoing: 0,
        totalCompleted: 0,
        totalPending: 0,
        totalRevenue: 0,
        totalDue: 0,
        avgPayment: 0
      },
      areaStats
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching statistics',
      error: error.message
    });
  }
};

// @desc    Create new customer
// @route   POST /api/customers
// @access  Private (Admin only)
export const createCustomer = async (req, res) => {
  try {
    const {
      name,
      username,
      password = 'default123',
      mobile,
      area,
      address,
      workStatus = 'pending',
      jobDetail = '',
      totalAmount = 0,
      paymentPaid = 0,
      paymentDue = 0,
      dueDate,
      completionStatus = 'Not Started',
      materials = [],
      housePhoto,
      ownerPhoto,
      paymentHistory = []
    } = req.body;

    // Validate required fields
    if (!name || !username || !mobile) {
      return res.status(400).json({
        success: false,
        message: 'Name, username, and mobile are required fields'
      });
    }

    // Check if username exists
    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }

    // Validate payment amounts
    if (totalAmount < 0 || paymentPaid < 0 || paymentDue < 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment amounts cannot be negative'
      });
    }

    // Process materials - handle both string and object formats, and parse if stringified
    let materialsArray = materials;
    
    console.log('Received materials type:', typeof materialsArray);
    console.log('Received materials value:', materialsArray);
    
    // If materials is a string, try to parse it
    if (typeof materialsArray === 'string') {
      try {
        // Remove any leading/trailing whitespace and newlines
        materialsArray = materialsArray.trim();
        // First try JSON.parse (for valid JSON)
        materialsArray = JSON.parse(materialsArray);
      } catch (e) {
        // If JSON.parse fails, try to parse as JavaScript array literal
        try {
          // Clean up the string - handle multiline arrays
          let cleaned = materialsArray
            .replace(/\n/g, '')  // Remove newlines
            .replace(/\r/g, '')  // Remove carriage returns
            .replace(/\s+/g, ' ')  // Normalize whitespace
            .trim();
          
          // Replace single quotes with double quotes for JSON compatibility
          cleaned = cleaned
            .replace(/'/g, '"')  // Replace single quotes with double quotes
            .replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":'); // Add quotes to object keys
          
          materialsArray = JSON.parse(cleaned);
        } catch (e2) {
          console.error('Error parsing materials string:', e2);
          console.error('Materials value:', materialsArray);
          materialsArray = [];
        }
      }
    }
    
    // Ensure it's an array
    if (!Array.isArray(materialsArray)) {
      console.warn('Materials is not an array after parsing. Type:', typeof materialsArray, 'Value:', materialsArray);
      materialsArray = [];
    }
    
    // Process materials - convert old format (strings) to new format (objects) if needed
    const processedMaterials = materialsArray
      .filter(m => m !== null && m !== undefined) // Filter out null/undefined
      .map((m, index) => {
        if (typeof m === 'string') {
          return { name: m.trim(), cost: null, purchasedByAdmin: false };
        }
        if (typeof m !== 'object') {
          console.warn(`Invalid material at index ${index}:`, m);
          return null;
        }
        // Ensure it's an object with required fields
        return {
          name: String(m.name || '').trim(),
          cost: (m.purchasedByAdmin && m.cost !== null && m.cost !== undefined && m.cost !== '') ? Number(m.cost) : null,
          purchasedByAdmin: Boolean(m.purchasedByAdmin)
        };
      })
      .filter(m => m !== null && m.name && m.name.trim() !== ''); // Remove invalid entries

    // Calculate materials total cost (separate from total amount)
    const materialsTotalCost = processedMaterials
      .filter(m => m.purchasedByAdmin && m.cost !== null && m.cost > 0)
      .reduce((sum, m) => sum + m.cost, 0);

    // Process payment history
    let processedPaymentHistory = [];
    if (paymentHistory && Array.isArray(paymentHistory) && paymentHistory.length > 0) {
      processedPaymentHistory = paymentHistory.map(payment => ({
        date: payment.date ? new Date(payment.date) : new Date(),
        amount: Number(payment.amount) || 0,
        description: payment.description || ''
      })).filter(payment => payment.amount > 0); // Only include payments with amount > 0
    }
    
    // Calculate paymentPaid from payment history if provided, otherwise use the provided value
    let calculatedPaymentPaid = paymentPaid;
    if (processedPaymentHistory.length > 0) {
      calculatedPaymentPaid = processedPaymentHistory.reduce((sum, payment) => sum + payment.amount, 0);
    }

    // Calculate total amount if not provided (NOT including materials cost)
    let calculatedTotalAmount = totalAmount;
    if (!totalAmount || totalAmount === 0) {
      calculatedTotalAmount = calculatedPaymentPaid + paymentDue;
    }

    // Process photos - convert base64 to Buffer
    let housePhotoBuffer = null;
    let ownerPhotoBuffer = null;
    
    if (housePhoto && typeof housePhoto === 'string') {
      try {
        // Remove data URL prefix if present (data:image/jpeg;base64,)
        const base64Data = housePhoto.includes(',') ? housePhoto.split(',')[1] : housePhoto;
        housePhotoBuffer = Buffer.from(base64Data, 'base64');
      } catch (error) {
        console.error('Error processing house photo:', error);
      }
    }
    
    if (ownerPhoto && typeof ownerPhoto === 'string') {
      try {
        // Remove data URL prefix if present (data:image/jpeg;base64,)
        const base64Data = ownerPhoto.includes(',') ? ownerPhoto.split(',')[1] : ownerPhoto;
        ownerPhotoBuffer = Buffer.from(base64Data, 'base64');
      } catch (error) {
        console.error('Error processing owner photo:', error);
      }
    }

    // Create customer
    const customer = new User({
      name,
      username: username.toLowerCase(),
      password,
      mobile,
      area: area || 'Not specified',
      address: address || 'Not specified',
      role: 'customer',
      workStatus,
      jobDetail,
      totalAmount: calculatedTotalAmount,
      paymentPaid: calculatedPaymentPaid,
      paymentDue,
      dueDate: dueDate || null,
      completionStatus,
      materials: processedMaterials,
      materialsTotalCost: materialsTotalCost,
      housePhoto: housePhotoBuffer,
      ownerPhoto: ownerPhotoBuffer,
      paymentHistory: processedPaymentHistory
    });

    await customer.save();

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      customer: customer.toJSON()
    });

  } catch (error) {
    console.error('Create customer error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating customer',
      error: error.message
    });
  }
};

// @desc    Get customer by ID
// @route   GET /api/customers/:id
// @access  Private
export const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findOne({ 
      _id: id, 
      isActive: true 
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check permissions
    if (req.user.role === 'customer' && req.user._id.toString() !== id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own profile.'
      });
    }

    res.json({
      success: true,
      message: 'User fetched successfully',
      user: user.toJSON()
    });

  } catch (error) {
    console.error('Get user error:', error);
    
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while fetching user',
      error: error.message
    });
  }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private
export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Find user
    const user = await User.findOne({ 
      _id: id, 
      isActive: true 
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check permissions
    if (req.user.role === 'customer' && req.user._id.toString() !== id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own profile.'
      });
    }

    // Define allowed fields based on role
    let allowedFields;
    if (req.user.role === 'admin') {
      allowedFields = [
        'name', 'mobile', 'area', 'address', 'workStatus', 'jobDetail',
        'totalAmount', 'paymentPaid', 'paymentDue', 'dueDate', 'completionStatus', 'materials', 'materialsTotalCost',
        'housePhoto', 'ownerPhoto', 'paymentHistory'
      ];
    } else {
      allowedFields = ['name', 'mobile', 'area', 'address'];
    }

    // Filter updates to only allowed fields
    const filteredUpdates = {};
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    // Ensure paymentHistory is always processed if present in request
    // This handles cases where paymentHistory might be sent but not in allowedFields initially
    if (updates.paymentHistory !== undefined && req.user.role === 'admin') {
      filteredUpdates.paymentHistory = updates.paymentHistory;
    }

    // Process materials if provided
    if (filteredUpdates.materials !== undefined) {
      let materialsArray = filteredUpdates.materials;
      
      console.log('Update - Received materials type:', typeof materialsArray);
      console.log('Update - Received materials value:', materialsArray);
      
      // If materials is a string, try to parse it
      if (typeof materialsArray === 'string') {
        try {
          materialsArray = materialsArray.trim();
          materialsArray = JSON.parse(materialsArray);
        } catch (e) {
          try {
            let cleaned = materialsArray
              .replace(/\n/g, '')
              .replace(/\r/g, '')
              .replace(/\s+/g, ' ')
              .trim()
              .replace(/'/g, '"')
              .replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');
            materialsArray = JSON.parse(cleaned);
          } catch (e2) {
            console.error('Error parsing materials string in update:', e2);
            materialsArray = [];
          }
        }
      }
      
      // Ensure it's an array
      if (!Array.isArray(materialsArray)) {
        console.warn('Update - Materials is not an array');
        materialsArray = [];
      }
      
      filteredUpdates.materials = materialsArray
        .filter(m => m !== null && m !== undefined)
        .map((m, index) => {
          if (typeof m === 'string') {
            return { name: m.trim(), cost: null, purchasedByAdmin: false };
          }
          if (typeof m !== 'object') {
            console.warn(`Update - Invalid material at index ${index}:`, m);
            return null;
          }
          return {
            name: String(m.name || '').trim(),
            cost: (m.purchasedByAdmin && m.cost !== null && m.cost !== undefined && m.cost !== '') ? Number(m.cost) : null,
            purchasedByAdmin: Boolean(m.purchasedByAdmin)
          };
        })
        .filter(m => m !== null && m.name && m.name.trim() !== '');
      
      // Calculate materials total cost (separate from total amount)
      filteredUpdates.materialsTotalCost = filteredUpdates.materials
        .filter(m => m.purchasedByAdmin && m.cost !== null && m.cost > 0)
        .reduce((sum, m) => sum + m.cost, 0);
    }

    // Process photos if provided - convert base64 to Buffer
    if (filteredUpdates.housePhoto !== undefined) {
      if (filteredUpdates.housePhoto && typeof filteredUpdates.housePhoto === 'string') {
        try {
          const base64Data = filteredUpdates.housePhoto.includes(',') 
            ? filteredUpdates.housePhoto.split(',')[1] 
            : filteredUpdates.housePhoto;
          filteredUpdates.housePhoto = Buffer.from(base64Data, 'base64');
        } catch (error) {
          console.error('Error processing house photo:', error);
          delete filteredUpdates.housePhoto;
        }
      } else if (filteredUpdates.housePhoto === null || filteredUpdates.housePhoto === '') {
        filteredUpdates.housePhoto = null;
      }
    }

    if (filteredUpdates.ownerPhoto !== undefined) {
      if (filteredUpdates.ownerPhoto && typeof filteredUpdates.ownerPhoto === 'string') {
        try {
          const base64Data = filteredUpdates.ownerPhoto.includes(',') 
            ? filteredUpdates.ownerPhoto.split(',')[1] 
            : filteredUpdates.ownerPhoto;
          filteredUpdates.ownerPhoto = Buffer.from(base64Data, 'base64');
        } catch (error) {
          console.error('Error processing owner photo:', error);
          delete filteredUpdates.ownerPhoto;
        }
      } else if (filteredUpdates.ownerPhoto === null || filteredUpdates.ownerPhoto === '') {
        filteredUpdates.ownerPhoto = null;
      }
    }

    // Process payment history if provided
    if (filteredUpdates.paymentHistory !== undefined) {
      if (filteredUpdates.paymentHistory && Array.isArray(filteredUpdates.paymentHistory)) {
        if (filteredUpdates.paymentHistory.length > 0) {
          // Process and validate payment history
          filteredUpdates.paymentHistory = filteredUpdates.paymentHistory
            .filter(payment => payment && payment.amount && Number(payment.amount) > 0) // Only valid payments
            .map(payment => ({
              date: payment.date ? new Date(payment.date) : new Date(),
              amount: Number(payment.amount) || 0,
              description: (payment.description || '').trim()
            }));
          
          // Calculate paymentPaid from payment history
          filteredUpdates.paymentPaid = filteredUpdates.paymentHistory.reduce((sum, payment) => sum + payment.amount, 0);
          
          // Recalculate paymentDue based on totalAmount and paymentPaid
          const totalAmount = filteredUpdates.totalAmount !== undefined ? filteredUpdates.totalAmount : user.totalAmount;
          filteredUpdates.paymentDue = Math.max(0, totalAmount - filteredUpdates.paymentPaid);
        } else {
          filteredUpdates.paymentHistory = [];
          filteredUpdates.paymentPaid = 0;
          // Recalculate paymentDue when no payments
          const totalAmount = filteredUpdates.totalAmount !== undefined ? filteredUpdates.totalAmount : user.totalAmount;
          filteredUpdates.paymentDue = totalAmount;
        }
      } else {
        filteredUpdates.paymentHistory = [];
        filteredUpdates.paymentPaid = 0;
        const totalAmount = filteredUpdates.totalAmount !== undefined ? filteredUpdates.totalAmount : user.totalAmount;
        filteredUpdates.paymentDue = totalAmount;
      }
    } else if (filteredUpdates.totalAmount !== undefined) {
      // If totalAmount changed but paymentHistory wasn't provided, recalculate paymentDue
      const paymentPaid = filteredUpdates.paymentPaid !== undefined ? filteredUpdates.paymentPaid : user.paymentPaid;
      filteredUpdates.paymentDue = Math.max(0, filteredUpdates.totalAmount - paymentPaid);
    }

    // Calculate total amount if not provided (NOT including materials cost)
    if (req.user.role === 'admin') {
      const finalPaymentPaid = filteredUpdates.paymentPaid !== undefined ? filteredUpdates.paymentPaid : user.paymentPaid;
      const finalPaymentDue = filteredUpdates.paymentDue !== undefined ? filteredUpdates.paymentDue : user.paymentDue;
      
      if (!filteredUpdates.totalAmount || filteredUpdates.totalAmount === 0) {
        // Total amount = Given Amount + Pending Amount (materials cost is separate)
        filteredUpdates.totalAmount = finalPaymentPaid + finalPaymentDue;
      }
    }

    // Validate payment amounts
    if (filteredUpdates.totalAmount !== undefined && filteredUpdates.totalAmount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Total amount cannot be negative'
      });
    }
    if (filteredUpdates.paymentPaid !== undefined && filteredUpdates.paymentPaid < 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment paid cannot be negative'
      });
    }
    if (filteredUpdates.paymentDue !== undefined && filteredUpdates.paymentDue < 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment due cannot be negative'
      });
    }

    // Debug: Log what we're updating
    console.log('Updating customer with:', {
      paymentHistory: filteredUpdates.paymentHistory?.length || 0,
      paymentPaid: filteredUpdates.paymentPaid,
      paymentDue: filteredUpdates.paymentDue,
      totalAmount: filteredUpdates.totalAmount
    });
    
    // Update user using $set to ensure all fields are updated properly
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: filteredUpdates },
      { new: true, runValidators: true }
    );
    
    // Debug: Verify the update
    console.log('Updated customer payment history:', updatedUser.paymentHistory?.length || 0);

    res.json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser.toJSON()
    });

  } catch (error) {
    console.error('Update user error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages
      });
    }

    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating user',
      error: error.message
    });
  }
};

// @desc    Add payment to customer
// @route   POST /api/customers/:id/payments
// @access  Private (Admin only)
export const addPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, description, date } = req.body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount is required and must be greater than 0'
      });
    }

    // Find customer
    const customer = await User.findOne({ 
      _id: id, 
      isActive: true,
      role: 'customer'
    });
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Create new payment entry
    const newPayment = {
      date: date ? new Date(date) : new Date(),
      amount: Number(amount),
      description: description || ''
    };

    // Add payment to history
    const updatedPaymentHistory = [...(customer.paymentHistory || []), newPayment];
    
    // Calculate new paymentPaid from all payments
    const newPaymentPaid = updatedPaymentHistory.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    
    // Calculate new paymentDue
    const totalAmount = customer.totalAmount || (customer.paymentPaid + customer.paymentDue);
    const newPaymentDue = Math.max(0, totalAmount - newPaymentPaid);

    // Update customer
    customer.paymentHistory = updatedPaymentHistory;
    customer.paymentPaid = newPaymentPaid;
    customer.paymentDue = newPaymentDue;

    await customer.save();

    res.json({
      success: true,
      message: 'Payment added successfully',
      customer: customer.toJSON(),
      payment: newPayment
    });

  } catch (error) {
    console.error('Add payment error:', error);
    
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while adding payment',
      error: error.message
    });
  }
};

// @desc    Delete customer (soft delete)
// @route   DELETE /api/customers/:id
// @access  Private (Admin only)
export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await User.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });

  } catch (error) {
    console.error('Delete customer error:', error);
    
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while deleting customer',
      error: error.message
    });
  }
};

// @desc    Get current user's jobs
// @route   GET /api/customers/me/jobs
// @access  Private (Customer only)
export const getMyJobs = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    // Format as jobs array (for customers, their profile is their job record)
    const jobs = [{
      ...user.toJSON(),
      jobId: user._id,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }];

    res.json({
      success: true,
      jobs,
      total: jobs.length
    });

  } catch (error) {
    console.error('Get user jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching jobs',
      error: error.message
    });
  }
};