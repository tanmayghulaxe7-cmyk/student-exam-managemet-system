import { UserAccount, Room, Exam } from './types';

export const INITIAL_ACCOUNTS: UserAccount[] = [
  {
    id: 'admin-1',
    name: 'Dr. Arthur Vance (Dean of Exams)',
    email: 'admin@college.edu',
    password: 'admin',
    role: 'admin'
  },
  {
    id: 'student-1',
    name: 'Alex Mercer',
    email: 'student@college.edu',
    password: 'student',
    role: 'student',
    department: 'B.Tech CS - Sem 4',
    studentId: 'CS2024-089'
  },
  {
    id: 'student-2',
    name: 'Sarah Jenkins',
    email: 'sarah@college.edu',
    password: 'student',
    role: 'student',
    department: 'B.Tech IT - Sem 4',
    studentId: 'IT2024-042'
  }
];

export const ROOM_IMAGE_PRESETS = [
  {
    name: 'Modern Tiered Lecture Hall',
    url: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80',
    type: 'Auditorium'
  },
  {
    name: 'Spacious University Exam Hall',
    url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80',
    type: 'Exam Hall'
  },
  {
    name: 'Grand Campus Amphitheatre',
    url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
    type: 'Grand Hall'
  },
  {
    name: 'Advanced Computing Lab',
    url: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=80',
    type: 'Computer Lab'
  },
  {
    name: 'Academic Seminar Room',
    url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80',
    type: 'Classroom'
  }
];

export const INITIAL_ROOMS: Room[] = [
  {
    id: 'room-1',
    name: 'Hall A-101',
    capacity: 60,
    building: 'Main Academic Block',
    floor: 'Ground Floor, Wing A',
    image: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80',
    amenities: ['Air Conditioned', 'HD Projector', 'CCTV Monitored', 'Wheelchair Access']
  },
  {
    id: 'room-2',
    name: 'Auditorium 1',
    capacity: 150,
    building: 'Central Complex',
    floor: '2nd Floor',
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
    amenities: ['Acoustic Audio System', 'Dual Projectors', 'Air Conditioned', 'Tiered Desks']
  },
  {
    id: 'room-3',
    name: 'Science Wing 204',
    capacity: 45,
    building: 'Science & Technology Block',
    floor: '2nd Floor, West Wing',
    image: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80',
    amenities: ['Interactive Whiteboard', 'Individual Exam Desks', 'CCTV Monitored']
  },
  {
    id: 'room-4',
    name: 'Computer Lab 3',
    capacity: 40,
    building: 'IT & Computing Center',
    floor: '1st Floor',
    image: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=80',
    amenities: ['Workstations', 'High-Speed LAN', 'UPS Backup Power', 'Climate Control']
  }
];

export const INITIAL_EXAMS: Exam[] = [
  {
    id: 'exam-1',
    courseCode: 'CS101',
    courseName: 'Data Structures & Algorithms',
    department: 'B.Tech CS - Sem 4',
    studentCount: 52,
    examDate: '2026-10-15',
    startTime: '09:00',
    endTime: '12:00',
    roomId: 'room-1',
    createdAt: new Date().toISOString()
  },
  {
    id: 'exam-2',
    courseCode: 'MATH301',
    courseName: 'Discrete Mathematics & Graph Theory',
    department: 'B.Tech IT - Sem 4',
    studentCount: 120,
    examDate: '2026-10-15',
    startTime: '14:00',
    endTime: '17:00',
    roomId: 'room-2',
    createdAt: new Date().toISOString()
  },
  {
    id: 'exam-3',
    courseCode: 'DBMS202',
    courseName: 'Database Management Systems',
    department: 'B.Tech CS - Sem 4',
    studentCount: 42,
    examDate: '2026-10-18',
    startTime: '09:00',
    endTime: '12:00',
    roomId: 'room-3',
    createdAt: new Date().toISOString()
  },
  {
    id: 'exam-4',
    courseCode: 'NET401',
    courseName: 'Computer Networks & Security',
    department: 'B.Tech CS - Sem 6',
    studentCount: 38,
    examDate: '2026-10-20',
    startTime: '10:00',
    endTime: '13:00',
    roomId: 'room-4',
    createdAt: new Date().toISOString()
  }
];

export const DEPARTMENTS = [
  'B.Tech CS - Sem 4',
  'B.Tech CS - Sem 6',
  'B.Tech IT - Sem 4',
  'B.Tech IT - Sem 6',
  'B.Tech ECE - Sem 4',
  'BCA - Sem 2',
  'MCA - Sem 2'
];
