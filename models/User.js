import mongoose from 'mongoose';
import { isUsingMemoryDb, memoryStore } from '../db.js';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
  },
  role: {
    type: String,
    enum: ['admin', 'student'],
    required: [true, 'Role is required'],
  },
  year: {
    type: String,
    enum: ['1st Year', '2nd Year', '3rd Year', '4th Year', null, ''],
    default: null,
  },
  section: {
    type: String,
    enum: ['A', 'B', 'C', null, ''],
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const MongooseUserModel = mongoose.models.User || mongoose.model('User', userSchema);

// Universal User accessor supporting both real MongoDB and in-memory store
export const User = {
  schema: userSchema,
  async findOne(query) {
    if (!isUsingMemoryDb && mongoose.connection.readyState === 1) {
      return await MongooseUserModel.findOne(query);
    }
    return await memoryStore.users.findOne(query);
  },
  async findById(id) {
    if (!isUsingMemoryDb && mongoose.connection.readyState === 1) {
      return await MongooseUserModel.findById(id);
    }
    return await memoryStore.users.findById(id);
  },
  async find(query) {
    if (!isUsingMemoryDb && mongoose.connection.readyState === 1) {
      return await MongooseUserModel.find(query);
    }
    return await memoryStore.users.find(query);
  },
  async create(doc) {
    if (!isUsingMemoryDb && mongoose.connection.readyState === 1) {
      return await MongooseUserModel.create(doc);
    }
    return await memoryStore.users.create(doc);
  },
  async findByIdAndUpdate(id, update, options) {
    if (!isUsingMemoryDb && mongoose.connection.readyState === 1) {
      return await MongooseUserModel.findByIdAndUpdate(id, update, options);
    }
    return await memoryStore.users.findByIdAndUpdate(id, update, options);
  },
  async findByIdAndDelete(id) {
    if (!isUsingMemoryDb && mongoose.connection.readyState === 1) {
      return await MongooseUserModel.findByIdAndDelete(id);
    }
    return await memoryStore.users.findByIdAndDelete(id);
  },
  async countDocuments(query) {
    if (!isUsingMemoryDb && mongoose.connection.readyState === 1) {
      return await MongooseUserModel.countDocuments(query);
    }
    return await memoryStore.users.countDocuments(query);
  }
};

export default User;
