import express from 'express';
import { Exam } from '../models/Exam.js';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * GET /api/exams
 * Admin: returns ALL exams
 * Student: returns ONLY exams matching the logged-in student's Year and Section
 * Security: Year/Section are strictly extracted from authenticated JWT, never from user query/body.
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { role, year, section } = req.user;

    let exams = [];

    if (role === 'admin') {
      // Admin sees all exams
      exams = await Exam.find({});
    } else if (role === 'student') {
      // Student receives ONLY exams for their specific year and section
      if (!year || !section) {
        return res.status(400).json({ error: 'Student profile lacks Year or Section information' });
      }

      exams = await Exam.find({ year, section });
    } else {
      return res.status(403).json({ error: 'Unauthorized role' });
    }

    // Sort by examDate ascending, then examTime
    const sorted = Array.from(exams).sort((a, b) => {
      const dateA = new Date(a.examDate).getTime() || 0;
      const dateB = new Date(b.examDate).getTime() || 0;
      if (dateA !== dateB) return dateA - dateB;
      return String(a.examTime).localeCompare(String(b.examTime));
    });

    return res.status(200).json({
      count: sorted.length,
      userRole: role,
      filterApplied: role === 'student' ? { year, section } : null,
      exams: sorted
    });
  } catch (error) {
    console.error('Fetch exams error:', error);
    return res.status(500).json({ error: 'Internal server error while retrieving exams' });
  }
});

/**
 * POST /api/exams
 * Only Admin can add exams.
 * Returns 403 if Student or unauthenticated user tries.
 */
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { subject, year, section, examDate, examTime } = req.body;

    if (!subject || !year || !section || !examDate || !examTime) {
      return res.status(400).json({
        error: 'All exam fields are required (Subject, Year, Section, Exam Date, Exam Time)'
      });
    }

    const validYears = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
    const validSections = ['A', 'B', 'C'];

    if (!validYears.includes(year)) {
      return res.status(400).json({ error: 'Invalid year specified' });
    }
    if (!validSections.includes(section)) {
      return res.status(400).json({ error: 'Invalid section specified' });
    }

    const newExam = await Exam.create({
      subject: subject.trim(),
      year,
      section,
      examDate: examDate.trim(),
      examTime: examTime.trim(),
      createdAt: new Date()
    });

    return res.status(201).json({
      message: 'Exam added successfully',
      exam: newExam
    });
  } catch (error) {
    console.error('Create exam error:', error);
    return res.status(500).json({ error: 'Internal server error while creating exam' });
  }
});

/**
 * DELETE /api/exams/:id
 * Only Admin can delete exams.
 * Returns 403 if Student tries.
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Exam ID is required' });
    }

    const existingExam = await Exam.findById(id);
    if (!existingExam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    await Exam.findByIdAndDelete(id);

    return res.status(200).json({
      message: 'Exam deleted successfully',
      deletedId: id
    });
  } catch (error) {
    console.error('Delete exam error:', error);
    return res.status(500).json({ error: 'Internal server error while deleting exam' });
  }
});

export default router;
