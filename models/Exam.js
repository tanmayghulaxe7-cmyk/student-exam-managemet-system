import mongoose from 'mongoose';
import { isUsingMemoryDb, memoryStore } from '../db.js';

const examSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
  },
  year: {
    type: String,
    required: [true, 'Year is required'],
    enum: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
  },
  section: {
    type: String,
    required: [true, 'Section is required'],
    enum: ['A', 'B', 'C'],
  },
  examDate: {
    type: String,
    required: [true, 'Exam date is required'],
  },
  examTime: {
    type: String,
    required: [true, 'Exam time is required'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const MongooseExamModel = mongoose.models.Exam || mongoose.model('Exam', examSchema);

// Universal Exam accessor supporting both real MongoDB and in-memory store
export const Exam = {
  schema: examSchema,
  async find(query = {}) {
    if (!isUsingMemoryDb && mongoose.connection.readyState === 1) {
      return await MongooseExamModel.find(query).sort({ examDate: 1, examTime: 1 });
    }
    return await memoryStore.exams.find(query);
  },
  async findOne(query) {
    if (!isUsingMemoryDb && mongoose.connection.readyState === 1) {
      return await MongooseExamModel.findOne(query);
    }
    return await memoryStore.exams.findOne(query);
  },
  async findById(id) {
    if (!isUsingMemoryDb && mongoose.connection.readyState === 1) {
      return await MongooseExamModel.findById(id);
    }
    return await memoryStore.exams.findById(id);
  },
  async create(doc) {
    if (!isUsingMemoryDb && mongoose.connection.readyState === 1) {
      return await MongooseExamModel.create(doc);
    }
    return await memoryStore.exams.create(doc);
  },
  async findByIdAndDelete(id) {
    if (!isUsingMemoryDb && mongoose.connection.readyState === 1) {
      return await MongooseExamModel.findByIdAndDelete(id);
    }
    return await memoryStore.exams.findByIdAndDelete(id);
  },
  async deleteOne(query) {
    if (!isUsingMemoryDb && mongoose.connection.readyState === 1) {
      return await MongooseExamModel.deleteOne(query);
    }
    return await memoryStore.exams.deleteOne(query);
  },
  async countDocuments(query) {
    if (!isUsingMemoryDb && mongoose.connection.readyState === 1) {
      return await MongooseExamModel.countDocuments(query);
    }
    return await memoryStore.exams.countDocuments(query);
  }
};

export default Exam;
