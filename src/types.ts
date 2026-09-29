export type Role = 'admin' | 'student';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
  department?: string; // e.g. "B.Tech CS - Sem 4"
  studentId?: string;
}

export interface UserAccount extends UserProfile {
  password: string; // Plain/stored password for mock authentication
}

export interface Room {
  id: string;
  name: string;
  capacity: number;
  building: string;
  floor: string;
  image: string;
  amenities: string[];
}

export interface Exam {
  id: string;
  courseCode: string;
  courseName: string;
  department: string;
  studentCount: number;
  examDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  roomId: string;
  createdAt: string;
}

export interface ToastNotification {
  id: string;
  type: 'error' | 'success' | 'warning' | 'info';
  title: string;
  message: string;
}
