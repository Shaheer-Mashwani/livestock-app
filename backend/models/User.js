const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs'); // used to hash passwords

// Define the shape of a User document in MongoDB
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,               // no two users can have the same username
      lowercase: true,            // always saved as lowercase
      trim: true,                 // removes extra spaces
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [4, 'Password must be at least 4 characters'],
    },
    role: {
      type: String,
      // only these three values are allowed
      enum: ['operator', 'manager', 'viewer'],
      default: 'operator',
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
    },
  },
  {
    // automatically adds createdAt and updatedAt fields
    timestamps: true,
  }
);

// ── MIDDLEWARE: runs automatically BEFORE saving ──────────────
// This encrypts the password before it ever touches the database
// REPLACE WITH:
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// ── METHOD: compare passwords at login ───────────────────────
// We add a custom method to every User document
userSchema.methods.matchPassword = async function (enteredPassword) {
  // bcrypt.compare checks if entered password matches the stored hash
  return await bcrypt.compare(enteredPassword, this.password);
};

// Create the model from the schema and export it
// First argument 'User' becomes the collection name 'users' in MongoDB
module.exports = mongoose.model('User', userSchema);
