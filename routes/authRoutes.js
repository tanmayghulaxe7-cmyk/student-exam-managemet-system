import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { JWT_SECRET } from '../middleware/authMiddleware.js';

const router = express.Router();

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, confirmPassword, role, year, section } = req.body;

    // Validate presence of basic required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Please provide all required fields (Name, Email, Password, Role)' });
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    // Validate email format
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return res.status(400).json({ error: 'Please provide a valid email address' });
    }

    // Role check
    if (!['admin', 'student'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role selected. Must be Admin or Student' });
    }

    // Password length validation
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Password confirmation check if provided
    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({ error: 'Password and Confirm Password do not match' });
    }

    // Student specific validations
    let userYear = null;
    let userSection = null;

    if (role === 'student') {
      const validYears = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
      const validSections = ['A', 'B', 'C'];

      if (!year || !validYears.includes(year)) {
        return res.status(400).json({ error: 'Student year is required (1st Year, 2nd Year, 3rd Year, 4th Year)' });
      }
      if (!section || !validSections.includes(section)) {
        return res.status(400).json({ error: 'Student section is required (A, B, or C)' });
      }

      userYear = year;
      userSection = section;
    }

    // Check duplicate email
    const existingUser = await User.findOne({ email: trimmedEmail });
    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email address already exists' });
    }

    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user in database
    const newUser = await User.create({
      name: trimmedName,
      email: trimmedEmail,
      password: hashedPassword,
      role,
      year: userYear,
      section: userSection,
      createdAt: new Date()
    });

    // Return created user WITHOUT password
    return res.status(201).json({
      message: 'Registration successful! You can now log in.',
      user: {
        id: newUser._id || newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        year: newUser.year,
        section: newUser.section
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Please enter Email, Password, and select your Role' });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Find user by email
    const user = await User.findOne({ email: trimmedEmail });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials: User not found' });
    }

    // Role check
    if (user.role !== role) {
      return res.status(401).json({ error: `Account registered as '${user.role}', but you selected '${role}'` });
    }

    // Verify password with bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials: Incorrect password' });
    }

    // Generate JWT token (expires in 24 hours)
    const tokenPayload = {
      id: user._id || user.id,
      email: user.email,
      role: user.role,
      year: user.year,
      section: user.section
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        year: user.year,
        section: user.section
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error during login' });
  }
});

export default router;
