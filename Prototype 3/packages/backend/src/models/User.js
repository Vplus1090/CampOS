import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// ─── Sub-Schemas ────────────────────────────────────────────────────────────────

const parentContactSchema = new mongoose.Schema(
  {
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
  },
  { _id: false }
);

const studentProfileSchema = new mongoose.Schema(
  {
    enrollmentId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    grade: { type: String, trim: true },           // e.g., "1st Year"
    branch: { type: String, trim: true },           // e.g., "Computer Science"
    section: { type: String, trim: true },          // e.g., "A"
    hostel: { type: String, trim: true },
    roomNumber: { type: String, trim: true },
    parentContact: { type: parentContactSchema },
    dateOfBirth: { type: Date },
  },
  { _id: false }
);

const educatorProfileSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    department: { type: String, trim: true },       // e.g., "Computer Science"
    subjects: [{ type: String, trim: true }],
    designation: { type: String, trim: true },      // e.g., "Professor"
    officeLocation: { type: String, trim: true },
    qualification: { type: String, trim: true },    // e.g., "PhD"
  },
  { _id: false }
);

const refreshTokenSchema = new mongoose.Schema(
  {
    token: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// ─── User Schema ────────────────────────────────────────────────────────────────

const userSchema = new mongoose.Schema(
  {
    // Auth fields
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // excluded from queries by default
    },
    role: {
      type: String,
      enum: {
        values: ['student', 'educator', 'admin', 'canteen_admin', 'super_admin'],
        message: '{VALUE} is not a valid role',
      },
      required: [true, 'Role is required'],
    },

    // Account state
    isEmailVerified: { type: Boolean, default: false },
    isSuspended: { type: Boolean, default: false },
    mustChangePassword: { type: Boolean, default: true },
    refreshTokens: [refreshTokenSchema],

    // Shared profile
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    phone: { type: String, trim: true },
    avatar: { type: String }, // URL

    // Role-specific profiles
    studentProfile: { type: studentProfileSchema },
    educatorProfile: { type: educatorProfileSchema },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtual: fullName ──────────────────────────────────────────────────────────

userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// ─── Indexes ────────────────────────────────────────────────────────────────────

userSchema.index({ role: 1 });

// ─── Pre-save: Hash Password ───────────────────────────────────────────────────

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// ─── Instance Methods ───────────────────────────────────────────────────────────

/**
 * Compare a candidate password against the hashed password.
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Return a safe version of the user object (no password, no refresh tokens).
 */
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshTokens;
  delete obj.__v;
  return obj;
};

/**
 * Remove expired refresh tokens from the array.
 */
userSchema.methods.cleanExpiredTokens = function () {
  const now = new Date();
  this.refreshTokens = this.refreshTokens.filter(
    (rt) => rt.expiresAt > now
  );
};

/**
 * Invalidate all refresh tokens (e.g., on suspension).
 */
userSchema.methods.invalidateAllTokens = function () {
  this.refreshTokens = [];
};

// ─── Export ─────────────────────────────────────────────────────────────────────

const User = mongoose.model('User', userSchema);

export default User;
