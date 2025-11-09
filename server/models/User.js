import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    lowercase: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [50, 'Username cannot exceed 50 characters']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  mobile: {
    type: String,
    required: [true, 'Mobile number is required'],
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit mobile number']
  },
  area: {
    type: String,
    required: false,
    trim: true,
    default: 'Not specified',
    maxlength: [100, 'Area cannot exceed 100 characters']
  },
  address: {
    type: String,
    required: false,
    trim: true,
    default: 'Not specified',
    maxlength: [500, 'Address cannot exceed 500 characters']
  },
  role: {
    type: String,
    enum: ['admin', 'customer'],
    default: 'customer'
  },
  workStatus: {
    type: String,
    enum: ['ongoing', 'completed', 'pending'],
    default: 'pending'
  },
  jobDetail: {
    type: String,
    default: '',
    maxlength: [1000, 'Job details cannot exceed 1000 characters']
  },
  totalAmount: {
    type: Number,
    default: 0,
    min: [0, 'Total amount cannot be negative']
  },
  paymentPaid: {
    type: Number,
    default: 0,
    min: [0, 'Payment paid cannot be negative']
  },
  paymentDue: {
    type: Number,
    default: 0,
    min: [0, 'Payment due cannot be negative']
  },
  paymentHistory: [{
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Payment amount cannot be negative']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: ''
    }
  }],
  dueDate: {
    type: Date
  },
  completionStatus: {
    type: String,
    default: 'Not Started',
    maxlength: [100, 'Completion status cannot exceed 100 characters']
  },
  materials: [{
    name: {
      type: String,
      required: [true, 'Material name is required'],
      trim: true,
      maxlength: [100, 'Material name cannot exceed 100 characters']
    },
    cost: {
      type: Number,
      default: null,
      min: [0, 'Material cost cannot be negative']
    },
    purchasedByAdmin: {
      type: Boolean,
      default: false
    }
  }],
  materialsTotalCost: {
    type: Number,
    default: 0,
    min: [0, 'Materials total cost cannot be negative']
  },
  housePhoto: {
    type: Buffer,
    default: null
  },
  ownerPhoto: {
    type: Buffer,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better query performance
userSchema.index({ username: 1 });
userSchema.index({ role: 1 });
userSchema.index({ workStatus: 1 });
userSchema.index({ area: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const saltRounds = 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Transform output to remove password and convert photos to base64
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  
  // Convert Buffer photos to base64 data URLs
  if (user.housePhoto) {
    user.housePhoto = `data:image/jpeg;base64,${user.housePhoto.toString('base64')}`;
  }
  if (user.ownerPhoto) {
    user.ownerPhoto = `data:image/jpeg;base64,${user.ownerPhoto.toString('base64')}`;
  }
  
  // Format payment history dates to ISO strings for proper JSON serialization
  if (user.paymentHistory && Array.isArray(user.paymentHistory)) {
    user.paymentHistory = user.paymentHistory.map(payment => ({
      ...payment,
      date: payment.date ? (payment.date instanceof Date ? payment.date.toISOString() : payment.date) : new Date().toISOString()
    }));
  }
  
  return user;
};

// Static method to find active users
userSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

// Virtual for calculated total amount (if not explicitly set)
userSchema.virtual('calculatedTotalAmount').get(function() {
  if (this.totalAmount && this.totalAmount > 0) {
    return this.totalAmount;
  }
  // Calculate: paymentPaid + paymentDue (materials cost is separate)
  return this.paymentPaid + this.paymentDue;
});

// Virtual for calculated materials total cost
userSchema.virtual('calculatedMaterialsCost').get(function() {
  if (this.materialsTotalCost && this.materialsTotalCost > 0) {
    return this.materialsTotalCost;
  }
  // Calculate from materials array
  return this.materials
    .filter(m => m.purchasedByAdmin && m.cost !== null && m.cost > 0)
    .reduce((sum, m) => sum + m.cost, 0);
});

// Virtual for payment status
userSchema.virtual('paymentStatus').get(function() {
  if (this.paymentDue === 0) return 'paid';
  if (this.paymentPaid === 0) return 'unpaid';
  return 'partial';
});

// Virtual for calculated payment paid from history
userSchema.virtual('calculatedPaymentPaid').get(function() {
  if (this.paymentHistory && this.paymentHistory.length > 0) {
    return this.paymentHistory.reduce((sum, payment) => sum + (payment.amount || 0), 0);
  }
  return this.paymentPaid || 0;
});

export default mongoose.model('User', userSchema);