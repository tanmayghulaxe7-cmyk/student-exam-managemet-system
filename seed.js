import bcrypt from 'bcryptjs';
import { User } from './models/User.js';
import { Exam } from './models/Exam.js';

export async function seedInitialData() {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      return;
    }

    console.log('[Seed] Seeding initial test accounts and sample examinations...');

    // Hash passwords
    const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
    const studentPasswordHash = await bcrypt.hash('Student@123', 10);

    // 1. Admin account
    await User.create({
      name: 'Admin',
      email: 'admin@gmail.com',
      password: adminPasswordHash,
      role: 'admin',
      year: null,
      section: null,
      createdAt: new Date()
    });

    // 2. Student A (3rd Year, Section A)
    await User.create({
      name: 'Student A',
      email: 'studentA@gmail.com',
      password: studentPasswordHash,
      role: 'student',
      year: '3rd Year',
      section: 'A',
      createdAt: new Date()
    });

    // 3. Student B (3rd Year, Section B)
    await User.create({
      name: 'Student B',
      email: 'studentB@gmail.com',
      password: studentPasswordHash,
      role: 'student',
      year: '3rd Year',
      section: 'B',
      createdAt: new Date()
    });

    // 4. Sample Exams matching prompt examples
    const sampleExams = [
      {
        subject: 'Java',
        year: '3rd Year',
        section: 'A',
        examDate: '2026-10-10',
        examTime: '10:00 AM',
        createdAt: new Date()
      },
      {
        subject: 'DBMS',
        year: '3rd Year',
        section: 'A',
        examDate: '2026-10-12',
        examTime: '10:00 AM',
        createdAt: new Date()
      },
      {
        subject: 'Operating System',
        year: '3rd Year',
        section: 'B',
        examDate: '2026-10-14',
        examTime: '02:00 PM',
        createdAt: new Date()
      },
      {
        subject: 'Computer Networks',
        year: '3rd Year',
        section: 'B',
        examDate: '2026-10-16',
        examTime: '10:00 AM',
        createdAt: new Date()
      },
      {
        subject: 'Computer Network',
        year: '2nd Year',
        section: 'A',
        examDate: '2026-10-18',
        examTime: '10:00 AM',
        createdAt: new Date()
      }
    ];

    for (const ex of sampleExams) {
      await Exam.create(ex);
    }

    console.log('[Seed] Seeding completed successfully.');
  } catch (err) {
    console.error('[Seed] Error seeding data:', err);
  }
}
