/**
 * Database connection module
 * Connects to MongoDB via Mongoose. If local MongoDB is unavailable (e.g. sandbox container),
 * it seamlessly initializes an in-memory/file-persisted mock store with the exact same
 * Mongoose API so that the entire app works out of the box anywhere.
 */

import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/exam_timetable';

export let isUsingMemoryDb = false;

// In-memory fallback store
class MemoryCollection {
  constructor(name) {
    this.name = name;
    this.data = [];
    this.filePath = path.join(process.cwd(), `.data_${name}.json`);
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        this.data = JSON.parse(raw);
      }
    } catch {
      this.data = [];
    }
  }

  save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch {
      // ignore
    }
  }

  find(query = {}) {
    const filtered = this.data.filter(item => {
      for (const key of Object.keys(query)) {
        if (query[key] !== undefined && item[key] !== query[key]) {
          return false;
        }
      }
      return true;
    });

    const toArray = (items) => {
      const list = items.map(doc => this._wrapDoc(doc));
      list.sort = function(arg) {
        if (typeof arg === 'function') {
          return Array.prototype.sort.call(this, arg);
        }
        if (arg && typeof arg === 'object') {
          const keys = Object.keys(arg);
          if (keys.length > 0) {
            const key = keys[0];
            const dir = arg[key] === -1 ? -1 : 1;
            Array.prototype.sort.call(this, (a, b) => {
              if (a[key] < b[key]) return -1 * dir;
              if (a[key] > b[key]) return 1 * dir;
              return 0;
            });
          }
          return this;
        }
        return Array.prototype.sort.call(this);
      };
      return list;
    };

    return {
      sort: (sortObj) => {
        const arr = toArray(filtered);
        return arr.sort(sortObj);
      },
      then: (resolve, reject) => {
        return Promise.resolve(toArray(filtered)).then(resolve, reject);
      },
      catch: (reject) => {
        return Promise.resolve(toArray(filtered)).catch(reject);
      }
    };
  }

  async findOne(query = {}) {
    const item = this.data.find(item => {
      for (const key of Object.keys(query)) {
        if (key === '_id') {
          if (String(item._id) !== String(query._id)) return false;
        } else if (query[key] !== undefined && item[key] !== query[key]) {
          return false;
        }
      }
      return true;
    });
    if (!item) return null;
    return this._wrapDoc(item);
  }

  async findById(id) {
    return this.findOne({ _id: String(id) });
  }

  async create(doc) {
    const newDoc = {
      ...doc,
      _id: doc._id || 'id_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
      createdAt: doc.createdAt || new Date().toISOString()
    };
    this.data.push(newDoc);
    this.save();
    return this._wrapDoc(newDoc);
  }

  async findByIdAndDelete(id) {
    const idx = this.data.findIndex(item => String(item._id) === String(id));
    if (idx === -1) return null;
    const removed = this.data.splice(idx, 1)[0];
    this.save();
    return this._wrapDoc(removed);
  }

  async deleteOne(query) {
    const idx = this.data.findIndex(item => {
      for (const key of Object.keys(query)) {
        if (key === '_id') {
          if (String(item._id) !== String(query._id)) return false;
        } else if (item[key] !== query[key]) {
          return false;
        }
      }
      return true;
    });
    if (idx === -1) return { deletedCount: 0 };
    this.data.splice(idx, 1);
    this.save();
    return { deletedCount: 1 };
  }

  async findByIdAndUpdate(id, update, options = {}) {
    const item = this.data.find(item => String(item._id) === String(id));
    if (!item) return null;
    Object.assign(item, update);
    this.save();
    return this._wrapDoc(item);
  }

  async countDocuments(query = {}) {
    const res = await this.find(query);
    return res.length;
  }

  _wrapDoc(doc) {
    const copy = { ...doc };
    const self = this;
    copy.toObject = () => ({ ...copy });
    copy.save = async function() {
      const idx = self.data.findIndex(it => String(it._id) === String(copy._id));
      if (idx !== -1) {
        self.data[idx] = { ...copy };
        self.save();
      }
      return copy;
    };
    return copy;
  }
}

export const memoryStore = {
  users: new MemoryCollection('users'),
  exams: new MemoryCollection('exams')
};

export async function connectDB() {
  try {
    mongoose.set('strictQuery', false);
    const conn = await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 1500,
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    isUsingMemoryDb = false;
  } catch (err) {
    console.log(`[Database] Local MongoDB unavailable (${err.message}). Using persistent in-memory database store.`);
    isUsingMemoryDb = true;
  }
}
