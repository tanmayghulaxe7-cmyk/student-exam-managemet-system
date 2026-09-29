import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Shield,
  GraduationCap,
  Building,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  Trash2,
  Edit3,
  Search,
  Printer,
  LogOut,
  User,
  Key,
  Layers,
  Grid,
  List,
  Sparkles,
  X
} from 'lucide-react';
import { Role, UserAccount, UserProfile, Room, Exam, ToastNotification } from './types';
import {
  INITIAL_ACCOUNTS,
  INITIAL_ROOMS,
  INITIAL_EXAMS,
  DEPARTMENTS,
  ROOM_IMAGE_PRESETS
} from './mockData';
import { AuthView } from './components/AuthView';

export default function App() {
  // ------------------------------------------
  // STATE PERSISTENCE (LocalStorage)
  // ------------------------------------------
  const [accounts, setAccounts] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('college_timetable_accounts');
    return saved ? JSON.parse(saved) : INITIAL_ACCOUNTS;
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('college_timetable_user');
    return saved ? JSON.parse(saved) : {
      id: 'admin-1',
      name: 'Dr. Arthur Vance (Dean of Exams)',
      email: 'admin@college.edu',
      role: 'admin'
    };
  });

  const [rooms, setRooms] = useState<Room[]>(() => {
    const saved = localStorage.getItem('college_timetable_rooms');
    return saved ? JSON.parse(saved) : INITIAL_ROOMS;
  });

  const [exams, setExams] = useState<Exam[]>(() => {
    const saved = localStorage.getItem('college_timetable_exams');
    return saved ? JSON.parse(saved) : INITIAL_EXAMS;
  });

  // Active Navigation & View States
  const [adminTab, setAdminTab] = useState<'rooms' | 'schedule' | 'timetable' | 'matrix'>('timetable');
  const [studentDepartment, setStudentDepartment] = useState<string>('B.Tech CS - Sem 4');
  const [timetableSearch, setTimetableSearch] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [matrixDate, setMatrixDate] = useState<string>('2026-10-15');

  // Modal Controls
  const [showAddRoomModal, setShowAddRoomModal] = useState<boolean>(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [examToDelete, setExamToDelete] = useState<Exam | null>(null);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem('college_timetable_accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('college_timetable_user', JSON.stringify(currentUser));
      if (currentUser.department) {
        setStudentDepartment(currentUser.department);
      }
    } else {
      localStorage.removeItem('college_timetable_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('college_timetable_rooms', JSON.stringify(rooms));
  }, [rooms]);

  useEffect(() => {
    localStorage.setItem('college_timetable_exams', JSON.stringify(exams));
  }, [exams]);

  // Toast Helper
  const showToast = (type: 'error' | 'success' | 'warning' | 'info', title: string, message: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5500);
  };

  // ------------------------------------------
  // AUTHENTICATION HANDLERS
  // ------------------------------------------
  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    if (user.role === 'student' && user.department) {
      setStudentDepartment(user.department);
    }
    showToast('success', `Signed In as ${user.role.toUpperCase()}`, `Welcome, ${user.name}!`);
  };

  const handleRegisterAccount = (newAccount: UserAccount) => {
    setAccounts(prev => [...prev, newAccount]);
    showToast('success', 'Account Registered', `Account for ${newAccount.email} created.`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    showToast('info', 'Signed Out', 'You have been logged out of the portal.');
  };

  // Quick switch role
  const handleQuickSwitchRole = (role: Role) => {
    const targetEmail = role === 'admin' ? 'admin@college.edu' : 'student@college.edu';
    const found = accounts.find(a => a.email.toLowerCase() === targetEmail.toLowerCase() && a.role === role);
    if (found) {
      const { password: _, ...profile } = found;
      setCurrentUser(profile);
      if (profile.department) setStudentDepartment(profile.department);
      showToast('info', 'Switched View', `Active as ${role.toUpperCase()}`);
    }
  };

  // ------------------------------------------
  // STRICT EXAM VALIDATION LOGIC
  // ------------------------------------------
  const validateAndScheduleExam = (examData: Omit<Exam, 'id' | 'createdAt'>): boolean => {
    const targetRoom = rooms.find(r => r.id === examData.roomId);

    if (!targetRoom) {
      showToast('error', 'Invalid Room', 'The selected examination room does not exist.');
      return false;
    }

    // 1. CAPACITY VERIFICATION
    if (examData.studentCount > targetRoom.capacity) {
      showToast(
        'error',
        'Capacity Overflow Error',
        `Selected room '${targetRoom.name}' capacity (${targetRoom.capacity}) is smaller than student count (${examData.studentCount})! Please select a larger hall.`
      );
      return false;
    }

    // Time validation (End must be after Start)
    if (examData.startTime >= examData.endTime) {
      showToast('error', 'Invalid Time Range', 'Exam End Time must be strictly later than Start Time.');
      return false;
    }

    // 2. OVERLAPPING ROOM BOOKING PREVENTION
    // Same room + same date + time overlap: (newStart < existingEnd) && (newEnd > existingStart)
    const conflictingExam = exams.find(existing => {
      if (existing.roomId !== examData.roomId) return false;
      if (existing.examDate !== examData.examDate) return false;

      // Time overlap calculation
      const hasOverlap = (examData.startTime < existing.endTime) && (examData.endTime > existing.startTime);
      return hasOverlap;
    });

    if (conflictingExam) {
      showToast(
        'error',
        'Room Booking Clash Error',
        `Error: '${targetRoom.name}' is already booked for '${conflictingExam.courseCode} - ${conflictingExam.courseName}' during this time slot (${conflictingExam.startTime} - ${conflictingExam.endTime}) on ${examData.examDate}!`
      );
      return false;
    }

    // All validations passed!
    const newExam: Exam = {
      ...examData,
      id: 'exam-' + Date.now(),
      createdAt: new Date().toISOString()
    };

    setExams(prev => [newExam, ...prev]);
    showToast(
      'success',
      'Examination Scheduled',
      `${examData.courseCode} has been successfully assigned to ${targetRoom.name} on ${examData.examDate}.`
    );
    return true;
  };

  // ------------------------------------------
  // ROOM MANAGEMENT HANDLERS
  // ------------------------------------------
  const handleSaveRoom = (roomData: Omit<Room, 'id'>, existingId?: string) => {
    if (existingId) {
      setRooms(prev => prev.map(r => r.id === existingId ? { ...roomData, id: existingId } : r));
      showToast('success', 'Room Updated', `Room details for '${roomData.name}' saved.`);
    } else {
      const newRoom: Room = {
        ...roomData,
        id: 'room-' + Date.now()
      };
      setRooms(prev => [...prev, newRoom]);
      showToast('success', 'Room Added', `Examination Hall '${roomData.name}' added with capacity of ${roomData.capacity}.`);
    }
    setShowAddRoomModal(false);
    setEditingRoom(null);
  };

  const handleDeleteRoom = (roomId: string) => {
    const linkedExams = exams.filter(e => e.roomId === roomId);
    if (linkedExams.length > 0) {
      showToast(
        'warning',
        'Cannot Delete Room',
        `This room has ${linkedExams.length} active scheduled examinations. Cancel or reassign those exams first.`
      );
      setRoomToDelete(null);
      return;
    }

    setRooms(prev => prev.filter(r => r.id !== roomId));
    showToast('success', 'Room Deleted', 'Examination hall removed from system.');
    setRoomToDelete(null);
  };

  const handleDeleteExam = (examId: string) => {
    setExams(prev => prev.filter(e => e.id !== examId));
    showToast('success', 'Exam Cancelled', 'Examination has been removed from timetable.');
    setExamToDelete(null);
  };

  // ------------------------------------------
  // FILTERED DATA
  // ------------------------------------------
  const filteredExams = useMemo(() => {
    return exams.filter(exam => {
      const matchesSearch =
        exam.courseCode.toLowerCase().includes(timetableSearch.toLowerCase()) ||
        exam.courseName.toLowerCase().includes(timetableSearch.toLowerCase()) ||
        exam.department.toLowerCase().includes(timetableSearch.toLowerCase());

      const matchesDept = departmentFilter === 'ALL' || exam.department === departmentFilter;

      return matchesSearch && matchesDept;
    });
  }, [exams, timetableSearch, departmentFilter]);

  const studentExams = useMemo(() => {
    return exams
      .filter(e => e.department.toLowerCase() === studentDepartment.toLowerCase())
      .sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime());
  }, [exams, studentDepartment]);

  // If user is not logged in, show Auth Screen
  if (!currentUser) {
    return (
      <AuthView
        accounts={accounts}
        onLoginSuccess={handleLoginSuccess}
        onRegisterAccount={handleRegisterAccount}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* ------------------------------------------ */}
      {/* GLOBAL TOAST ALERTS                        */}
      {/* ------------------------------------------ */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`p-4 rounded-xl shadow-2xl border backdrop-blur-md transition-all flex items-start gap-3 pointer-events-auto ${
              toast.type === 'error'
                ? 'bg-rose-950/95 border-rose-500 text-rose-100'
                : toast.type === 'success'
                ? 'bg-emerald-950/95 border-emerald-500 text-emerald-100'
                : 'bg-indigo-950/95 border-indigo-500 text-indigo-100'
            }`}
          >
            {toast.type === 'error' ? (
              <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            ) : toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="font-semibold text-sm">{toast.title}</div>
              <div className="text-xs opacity-90 mt-0.5 leading-relaxed">{toast.message}</div>
            </div>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* ------------------------------------------ */}
      {/* NAVBAR                                     */}
      {/* ------------------------------------------ */}
      <header className="sticky top-0 z-40 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-600/30">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                EXAM<span className="text-indigo-400">SYNC</span>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                    currentUser.role === 'admin'
                      ? 'bg-indigo-950 text-indigo-300 border-indigo-700'
                      : 'bg-emerald-950 text-emerald-300 border-emerald-700'
                  }`}
                >
                  {currentUser.role}
                </span>
              </span>
              <p className="text-[11px] text-slate-400 hidden sm:block">Room Allocation & Conflict-Free Scheduling</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Role Switcher */}
            <div className="hidden md:flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-xs">
              <button
                onClick={() => handleQuickSwitchRole('admin')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  currentUser.role === 'admin' ? 'bg-indigo-600 text-white shadow-sm font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Admin View
              </button>
              <button
                onClick={() => handleQuickSwitchRole('student')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  currentUser.role === 'student' ? 'bg-emerald-600 text-white shadow-sm font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Student View
              </button>
            </div>

            {/* Profile trigger */}
            <button
              onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-xs text-slate-200 transition-all cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <div className="text-left hidden sm:block">
                <span className="block max-w-[120px] truncate font-bold text-white leading-tight">{currentUser.name}</span>
                <span className="block max-w-[120px] truncate text-[10px] text-slate-400">{currentUser.email}</span>
              </div>
            </button>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              title="Sign Out / Switch Account"
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-slate-800/80 hover:bg-rose-950/60 hover:border-rose-700/60 border border-slate-700/80 text-slate-300 hover:text-rose-300 transition-all cursor-pointer text-xs font-semibold"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* ------------------------------------------ */}
      {/* MAIN CONTAINER                             */}
      {/* ------------------------------------------ */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {currentUser.role === 'admin' ? (
          /* ======================================================= */
          /* ADMIN PORTAL                                            */
          /* ======================================================= */
          <div className="space-y-6">
            {/* Top Stat Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">Exam Halls</span>
                  <Building className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-2xl font-black text-white mt-2">{rooms.length}</div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Total Capacity:{' '}
                  <span className="text-slate-200 font-semibold">
                    {rooms.reduce((acc, r) => acc + r.capacity, 0)} Seats
                  </span>
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">Scheduled Exams</span>
                  <Calendar className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-white mt-2">{exams.length}</div>
                <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3 h-3" /> All Validated & Conflict-Free
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">Students Enrolled</span>
                  <Users className="w-4 h-4 text-sky-400" />
                </div>
                <div className="text-2xl font-black text-white mt-2">
                  {exams.reduce((acc, e) => acc + e.studentCount, 0)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Across {DEPARTMENTS.length} Academic Cohorts</div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">Overlap Protection</span>
                  <Shield className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-sm font-bold text-indigo-400 mt-2 flex items-center gap-1.5">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Active Shield
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Strict Capacity & Overlap Rule Enforced</div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
              <button
                onClick={() => setAdminTab('timetable')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs tracking-wide transition-all cursor-pointer ${
                  adminTab === 'timetable'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Calendar className="w-4 h-4" />
                Timetable & Schedule
                <span className="px-1.5 py-0.5 rounded-full bg-slate-950/40 text-[10px]">{exams.length}</span>
              </button>

              <button
                onClick={() => setAdminTab('rooms')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs tracking-wide transition-all cursor-pointer ${
                  adminTab === 'rooms'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Building className="w-4 h-4" />
                Manage Rooms
                <span className="px-1.5 py-0.5 rounded-full bg-slate-950/40 text-[10px]">{rooms.length}</span>
              </button>

              <button
                onClick={() => setAdminTab('schedule')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs tracking-wide transition-all cursor-pointer ${
                  adminTab === 'schedule'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Plus className="w-4 h-4" />
                Schedule Exam & Allocate Room
              </button>

              <button
                onClick={() => setAdminTab('matrix')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs tracking-wide transition-all cursor-pointer ${
                  adminTab === 'matrix'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Layers className="w-4 h-4" />
                Conflict Visual Matrix
              </button>
            </div>

            {/* TAB CONTENT: TIMETABLE & SCHEDULE */}
            {adminTab === 'timetable' && (
              <div className="space-y-4">
                {/* Control bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Search by course code, name, or class..."
                        value={timetableSearch}
                        onChange={e => setTimetableSearch(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <select
                      value={departmentFilter}
                      onChange={e => setDepartmentFilter(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="ALL">All Departments</option>
                      {DEPARTMENTS.map(d => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <div className="flex items-center bg-slate-950 rounded-xl p-1 border border-slate-800">
                      <button
                        onClick={() => setViewMode('table')}
                        className={`p-1.5 rounded-lg cursor-pointer ${
                          viewMode === 'table' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'
                        }`}
                        title="Table View"
                      >
                        <List className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`p-1.5 rounded-lg cursor-pointer ${
                          viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'
                        }`}
                        title="Grid View"
                      >
                        <Grid className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      onClick={() => setAdminTab('schedule')}
                      className="flex items-center gap-1.5 py-2 px-3.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      Schedule Exam
                    </button>
                  </div>
                </div>

                {filteredExams.length === 0 ? (
                  <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800/80">
                    <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-white">No Examinations Found</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      No exams match your search or filter. Try resetting filters or schedule a new exam.
                    </p>
                  </div>
                ) : viewMode === 'table' ? (
                  /* TABLE VIEW */
                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                            <th className="py-3 px-4 font-semibold">Course & Code</th>
                            <th className="py-3 px-4 font-semibold">Class / Department</th>
                            <th className="py-3 px-4 font-semibold">Date & Time Slot</th>
                            <th className="py-3 px-4 font-semibold">Allocated Room</th>
                            <th className="py-3 px-4 font-semibold">Capacity Ratio</th>
                            <th className="py-3 px-4 font-semibold text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {filteredExams.map(exam => {
                            const room = rooms.find(r => r.id === exam.roomId);
                            const utilization = room ? Math.round((exam.studentCount / room.capacity) * 100) : 0;
                            return (
                              <tr key={exam.id} className="hover:bg-slate-800/40 transition-colors">
                                <td className="py-3.5 px-4">
                                  <div className="font-bold text-white text-sm">{exam.courseCode}</div>
                                  <div className="text-slate-400 text-xs">{exam.courseName}</div>
                                </td>

                                <td className="py-3.5 px-4">
                                  <span className="inline-block px-2.5 py-1 rounded-md bg-indigo-950/60 text-indigo-300 border border-indigo-800/60 font-medium">
                                    {exam.department}
                                  </span>
                                </td>

                                <td className="py-3.5 px-4">
                                  <div className="font-medium text-slate-200 flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                    {exam.examDate}
                                  </div>
                                  <div className="text-slate-400 flex items-center gap-1.5 mt-0.5">
                                    <Clock className="w-3 h-3 text-slate-500" />
                                    {exam.startTime} – {exam.endTime}
                                  </div>
                                </td>

                                <td className="py-3.5 px-4">
                                  {room ? (
                                    <div className="flex items-center gap-2.5">
                                      <img
                                        src={room.image}
                                        alt={room.name}
                                        className="w-10 h-8 rounded-md object-cover border border-slate-700 shrink-0"
                                      />
                                      <div>
                                        <div className="font-semibold text-white">{room.name}</div>
                                        <div className="text-[11px] text-slate-400">{room.building}</div>
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-rose-400">Room Deleted</span>
                                  )}
                                </td>

                                <td className="py-3.5 px-4 min-w-[140px]">
                                  <div className="flex items-center justify-between text-[11px] mb-1">
                                    <span className="text-slate-300 font-medium">
                                      {exam.studentCount} / {room?.capacity || 0} seats
                                    </span>
                                    <span
                                      className={`font-semibold ${
                                        utilization > 90
                                          ? 'text-amber-400'
                                          : utilization > 60
                                          ? 'text-emerald-400'
                                          : 'text-indigo-400'
                                      }`}
                                    >
                                      {utilization}%
                                    </span>
                                  </div>
                                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        utilization > 90
                                          ? 'bg-amber-400'
                                          : utilization > 60
                                          ? 'bg-emerald-400'
                                          : 'bg-indigo-400'
                                      }`}
                                      style={{ width: `${Math.min(utilization, 100)}%` }}
                                    ></div>
                                  </div>
                                </td>

                                <td className="py-3.5 px-4 text-right">
                                  <button
                                    onClick={() => setExamToDelete(exam)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                                    title="Cancel Examination"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  /* GRID VIEW */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredExams.map(exam => {
                      const room = rooms.find(r => r.id === exam.roomId);
                      const utilization = room ? Math.round((exam.studentCount / room.capacity) * 100) : 0;
                      return (
                        <div
                          key={exam.id}
                          className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:border-slate-700 transition-all"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800 font-mono text-xs font-bold">
                                {exam.courseCode}
                              </span>
                              <button
                                onClick={() => setExamToDelete(exam)}
                                className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <h4 className="text-sm font-bold text-white mt-2 leading-snug">{exam.courseName}</h4>
                            <p className="text-xs text-slate-400 mt-0.5">{exam.department}</p>

                            <div className="mt-4 p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-400 flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Date:
                                </span>
                                <span className="font-semibold text-white">{exam.examDate}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-400 flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-indigo-400" /> Time:
                                </span>
                                <span className="font-semibold text-white">
                                  {exam.startTime} - {exam.endTime}
                                </span>
                              </div>
                            </div>

                            {room && (
                              <div className="mt-3 flex items-center gap-3">
                                <img
                                  src={room.image}
                                  alt={room.name}
                                  className="w-12 h-12 rounded-xl object-cover border border-slate-700 shrink-0"
                                />
                                <div>
                                  <div className="text-xs font-bold text-white">{room.name}</div>
                                  <div className="text-[11px] text-slate-400">{room.building}</div>
                                  <div className="text-[10px] text-indigo-400">{room.floor}</div>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-800">
                            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                              <span>Occupancy Utilization</span>
                              <span className="font-semibold text-slate-200">
                                {exam.studentCount} / {room?.capacity || 0} ({utilization}%)
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  utilization > 90 ? 'bg-amber-400' : 'bg-emerald-400'
                                }`}
                                style={{ width: `${Math.min(utilization, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: MANAGE ROOMS */}
            {adminTab === 'rooms' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-white">Examination Halls & Auditoriums</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Configure seating capacities, facilities, and classroom images to guarantee conflict-free room allocation.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingRoom(null);
                      setShowAddRoomModal(true);
                    }}
                    className="flex items-center gap-2 py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-indigo-600/25 active:scale-95 cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    Add New Room
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {rooms.map(room => {
                    const scheduledExamsCount = exams.filter(e => e.roomId === room.id).length;
                    return (
                      <div
                        key={room.id}
                        className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col group hover:border-slate-700 transition-all"
                      >
                        <div className="relative h-44 w-full bg-slate-950 overflow-hidden">
                          <img
                            src={room.image}
                            alt={room.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
                          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                            <span className="px-3 py-1 rounded-lg bg-slate-900/90 border border-slate-700 text-xs font-extrabold text-white backdrop-blur-md">
                              {room.name}
                            </span>
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-950/90 border border-emerald-500/80 text-emerald-300 text-xs font-bold backdrop-blur-md flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" />
                              {room.capacity} Seats
                            </span>
                          </div>
                        </div>

                        <div className="p-4 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-300">
                              <Building className="w-3.5 h-3.5 text-indigo-400" />
                              <span className="font-medium">{room.building}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-500" />
                              <span>{room.floor}</span>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {room.amenities.map(am => (
                                <span
                                  key={am}
                                  className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700/60"
                                >
                                  {am}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
                            <span className="text-[11px] text-slate-400">
                              <strong className="text-slate-200">{scheduledExamsCount}</strong> Active Exams
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setEditingRoom(room);
                                  setShowAddRoomModal(true);
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 cursor-pointer"
                                title="Edit Room Details"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setRoomToDelete(room)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 cursor-pointer"
                                title="Delete Room"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB CONTENT: SCHEDULE EXAMS FORM */}
            {adminTab === 'schedule' && (
              <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
                <div className="border-b border-slate-800 pb-4 mb-6">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-400" />
                    Schedule Examination & Assign Room
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    System strictly verifies seating capacity against student count and checks for overlapping bookings in the same hall.
                  </p>
                </div>

                <form
                  onSubmit={e => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const courseCode = (form.elements.namedItem('courseCode') as HTMLInputElement).value.trim();
                    const courseName = (form.elements.namedItem('courseName') as HTMLInputElement).value.trim();
                    const department = (form.elements.namedItem('department') as HTMLSelectElement).value;
                    const studentCount = parseInt((form.elements.namedItem('studentCount') as HTMLInputElement).value, 10);
                    const examDate = (form.elements.namedItem('examDate') as HTMLInputElement).value;
                    const startTime = (form.elements.namedItem('startTime') as HTMLInputElement).value;
                    const endTime = (form.elements.namedItem('endTime') as HTMLInputElement).value;
                    const roomId = (form.elements.namedItem('roomId') as HTMLSelectElement).value;

                    const success = validateAndScheduleExam({
                      courseCode,
                      courseName,
                      department,
                      studentCount,
                      examDate,
                      startTime,
                      endTime,
                      roomId
                    });

                    if (success) {
                      setAdminTab('timetable');
                    }
                  }}
                  className="space-y-4 text-xs"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Course Code</label>
                      <input
                        type="text"
                        name="courseCode"
                        placeholder="e.g. CS201, ECE304"
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Course Name</label>
                      <input
                        type="text"
                        name="courseName"
                        placeholder="e.g. Operating Systems"
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Department & Semester</label>
                      <select
                        name="department"
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                      >
                        {DEPARTMENTS.map(d => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">
                        Registered Students Count
                      </label>
                      <input
                        type="number"
                        name="studentCount"
                        min="1"
                        max="500"
                        defaultValue="45"
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Exam Date</label>
                      <input
                        type="date"
                        name="examDate"
                        defaultValue="2026-10-25"
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Start Time</label>
                      <input
                        type="time"
                        name="startTime"
                        defaultValue="09:00"
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">End Time</label>
                      <input
                        type="time"
                        name="endTime"
                        defaultValue="12:00"
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Assign Room (Check Seating Capacity)
                    </label>
                    <select
                      name="roomId"
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                    >
                      {rooms.map(room => (
                        <option key={room.id} value={room.id}>
                          {room.name} — Capacity: {room.capacity} seats ({room.building})
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5 text-indigo-400" />
                      Rule 1: Registered Students &le; Room Capacity. Rule 2: No double-booking on same date/time.
                    </p>
                  </div>

                  <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setAdminTab('timetable')}
                      className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-lg shadow-indigo-600/30 active:scale-95 cursor-pointer"
                    >
                      Verify & Schedule Exam
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB CONTENT: CONFLICT VISUAL MATRIX */}
            {adminTab === 'matrix' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-400" />
                      Room Booking Clash & Conflict Matrix
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Visual inspection grid showing all rooms vs. hourly time slots for the chosen date.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Select Date:</span>
                    <input
                      type="date"
                      value={matrixDate}
                      onChange={e => setMatrixDate(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Matrix Grid */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 overflow-x-auto">
                  <div className="min-w-[700px]">
                    <div className="grid grid-cols-7 border-b border-slate-800 pb-3 text-center text-xs font-semibold text-slate-400">
                      <div className="text-left font-bold text-slate-200">Room / Hall</div>
                      <div>08:00 - 10:00</div>
                      <div>10:00 - 12:00</div>
                      <div>12:00 - 14:00</div>
                      <div>14:00 - 16:00</div>
                      <div>16:00 - 18:00</div>
                      <div>18:00 - 20:00</div>
                    </div>

                    <div className="divide-y divide-slate-800/60">
                      {rooms.map(room => {
                        const roomDayExams = exams.filter(
                          e => e.roomId === room.id && e.examDate === matrixDate
                        );

                        return (
                          <div key={room.id} className="grid grid-cols-7 py-4 items-center text-xs">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={room.image}
                                alt={room.name}
                                className="w-8 h-8 rounded-lg object-cover border border-slate-700 shrink-0"
                              />
                              <div>
                                <div className="font-bold text-white text-xs">{room.name}</div>
                                <div className="text-[10px] text-slate-400">{room.capacity} seats</div>
                              </div>
                            </div>

                            <SlotBox exams={roomDayExams} start="08:00" end="10:00" />
                            <SlotBox exams={roomDayExams} start="10:00" end="12:00" />
                            <SlotBox exams={roomDayExams} start="12:00" end="14:00" />
                            <SlotBox exams={roomDayExams} start="14:00" end="16:00" />
                            <SlotBox exams={roomDayExams} start="16:00" end="18:00" />
                            <SlotBox exams={roomDayExams} start="18:00" end="20:00" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl flex items-center justify-between text-xs text-emerald-300">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <span className="font-bold block">100% Conflict-Free Scheduling Certified</span>
                      <span className="text-[11px] opacity-80">
                        Zero double-booked rooms. All exams adhere to physical hall limits.
                      </span>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-emerald-900/60 rounded-lg text-emerald-200 font-mono text-[11px]">
                    Matrix Date: {matrixDate}
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ======================================================= */
          /* STUDENT PORTAL                                          */
          /* ======================================================= */
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 border border-indigo-800/40 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-semibold mb-2">
                    <GraduationCap className="w-3.5 h-3.5" /> Official Student Examination Schedule
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tight">
                    Welcome back, {currentUser.name}
                  </h2>
                  <p className="text-xs text-slate-300 mt-1 max-w-lg">
                    Below is your personalized schedule. Verify exam hall assignments, reporting floor, and start times in advance.
                  </p>
                  <p className="text-[11px] text-indigo-300 mt-1">
                    Logged in as: <span className="font-mono">{currentUser.email}</span>
                  </p>
                </div>

                {/* Cohort Selector */}
                <div className="bg-slate-950/70 backdrop-blur-md p-3 rounded-2xl border border-slate-700/60 flex flex-col gap-1.5 shrink-0">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Your Registered Cohort
                  </label>
                  <select
                    value={studentDepartment}
                    onChange={e => setStudentDepartment(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-indigo-400"
                  >
                    {DEPARTMENTS.map(d => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Examination Timetable</h3>
                <p className="text-xs text-slate-400">
                  Showing {studentExams.length} scheduled exam{studentExams.length === 1 ? '' : 's'} for{' '}
                  <strong className="text-slate-200">{studentDepartment}</strong>
                </p>
              </div>

              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors shadow-sm cursor-pointer"
              >
                <Printer className="w-4 h-4 text-indigo-400" />
                Print / Save Timetable
              </button>
            </div>

            {/* Student Exam Cards List */}
            {studentExams.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-slate-800">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <h4 className="text-base font-bold text-white">No Exams Scheduled</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  There are currently no examinations scheduled for {studentDepartment}. Select another cohort or check back later.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {studentExams.map((exam, idx) => {
                  const room = rooms.find(r => r.id === exam.roomId);
                  return (
                    <div
                      key={exam.id}
                      className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col hover:border-slate-700 transition-all"
                    >
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <span className="px-2.5 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono text-xs font-extrabold">
                                {exam.courseCode}
                              </span>
                              <span className="ml-2 text-xs font-semibold text-slate-400">Paper #{idx + 1}</span>
                            </div>
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold uppercase">
                              Confirmed
                            </span>
                          </div>

                          <h4 className="text-base font-bold text-white mt-2 leading-tight">
                            {exam.courseName}
                          </h4>

                          <div className="mt-4 grid grid-cols-2 gap-2 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                            <div>
                              <span className="text-slate-500 block text-[10px] uppercase font-bold">Exam Date</span>
                              <span className="text-white font-semibold flex items-center gap-1.5 mt-0.5">
                                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                                {exam.examDate}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[10px] uppercase font-bold">Time Window</span>
                              <span className="text-white font-semibold flex items-center gap-1.5 mt-0.5">
                                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                                {exam.startTime} – {exam.endTime}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Room Location & Preview */}
                        {room && (
                          <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center gap-3.5">
                            <img
                              src={room.image}
                              alt={room.name}
                              className="w-16 h-14 rounded-xl object-cover border border-slate-700 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block">
                                Assigned Exam Hall
                              </span>
                              <div className="font-extrabold text-sm text-white truncate">{room.name}</div>
                              <div className="text-xs text-slate-400 truncate flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                                {room.building} &bull; {room.floor}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="bg-slate-950/80 px-5 py-2.5 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Candidate Seating Guaranteed</span>
                        <span className="text-slate-300 font-medium">Room Cap: {room?.capacity || 0}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ------------------------------------------ */}
      {/* MODAL: ADD / EDIT ROOM                     */}
      {/* ------------------------------------------ */}
      {showAddRoomModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building className="w-4 h-4 text-indigo-400" />
                {editingRoom ? 'Edit Examination Hall' : 'Add New Examination Hall'}
              </h3>
              <button
                onClick={() => {
                  setShowAddRoomModal(false);
                  setEditingRoom(null);
                }}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                const form = e.currentTarget;
                const name = (form.elements.namedItem('roomName') as HTMLInputElement).value.trim();
                const capacity = parseInt((form.elements.namedItem('capacity') as HTMLInputElement).value, 10);
                const building = (form.elements.namedItem('building') as HTMLInputElement).value.trim();
                const floor = (form.elements.namedItem('floor') as HTMLInputElement).value.trim();
                const image = (form.elements.namedItem('image') as HTMLInputElement).value.trim();
                const amenitiesStr = (form.elements.namedItem('amenities') as HTMLInputElement).value.trim();
                const amenities = amenitiesStr ? amenitiesStr.split(',').map(s => s.trim()) : ['Air Conditioned', 'CCTV'];

                handleSaveRoom({ name, capacity, building, floor, image, amenities }, editingRoom?.id);
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="block text-slate-300 font-medium mb-1">Room Name / Code</label>
                <input
                  type="text"
                  name="roomName"
                  defaultValue={editingRoom?.name || ''}
                  placeholder="e.g. Hall A-101, Auditorium 2"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Seating Capacity</label>
                  <input
                    type="number"
                    name="capacity"
                    min="10"
                    max="1000"
                    defaultValue={editingRoom?.capacity || 60}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Building</label>
                  <input
                    type="text"
                    name="building"
                    defaultValue={editingRoom?.building || ''}
                    placeholder="e.g. Main Block"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Floor / Wing Details</label>
                <input
                  type="text"
                  name="floor"
                  defaultValue={editingRoom?.floor || ''}
                  placeholder="e.g. 1st Floor, East Wing"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Classroom Image URL</label>
                <input
                  type="url"
                  id="roomImageInput"
                  name="image"
                  defaultValue={editingRoom?.image || ROOM_IMAGE_PRESETS[0].url}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                />

                <div className="mt-2">
                  <span className="text-[10px] text-slate-400 block mb-1">Or choose preset:</span>
                  <div className="grid grid-cols-5 gap-1.5">
                    {ROOM_IMAGE_PRESETS.map((preset, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          const input = document.getElementById('roomImageInput') as HTMLInputElement;
                          if (input) input.value = preset.url;
                        }}
                        className="group relative h-10 rounded-lg overflow-hidden border border-slate-700 hover:border-indigo-400 cursor-pointer"
                        title={preset.name}
                      >
                        <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                        <span className="absolute inset-0 bg-slate-950/40 text-[9px] text-white flex items-center justify-center font-bold">
                          #{i + 1}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Amenities / Features (Comma-separated)
                </label>
                <input
                  type="text"
                  name="amenities"
                  defaultValue={editingRoom?.amenities.join(', ') || 'Air Conditioned, CCTV, Projector'}
                  placeholder="Air Conditioned, CCTV, Smart Board, Audio System"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddRoomModal(false);
                    setEditingRoom(null);
                  }}
                  className="px-3.5 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-md shadow-indigo-600/25 cursor-pointer"
                >
                  {editingRoom ? 'Save Changes' : 'Create Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------ */}
      {/* MODAL: DELETE EXAM CONFIRMATION            */}
      {/* ------------------------------------------ */}
      {examToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in-95 text-xs">
            <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-2xl text-rose-400 w-fit mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Cancel Examination?</h3>
            <p className="text-slate-400 mt-1.5 leading-relaxed">
              Are you sure you want to cancel the scheduled exam for{' '}
              <strong className="text-slate-200">
                {examToDelete.courseCode} ({examToDelete.courseName})
              </strong>{' '}
              on {examToDelete.examDate}? This room will become available immediately.
            </p>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setExamToDelete(null)}
                className="px-3.5 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 cursor-pointer"
              >
                Keep Exam
              </button>
              <button
                onClick={() => handleDeleteExam(examToDelete.id)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold cursor-pointer shadow-md shadow-rose-600/25"
              >
                Yes, Cancel Exam
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------ */}
      {/* MODAL: DELETE ROOM CONFIRMATION            */}
      {/* ------------------------------------------ */}
      {roomToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in-95 text-xs">
            <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-2xl text-rose-400 w-fit mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Delete Examination Hall?</h3>
            <p className="text-slate-400 mt-1.5 leading-relaxed">
              Are you sure you want to remove <strong className="text-slate-200">{roomToDelete.name}</strong> from
              the system? Rooms with scheduled exams cannot be deleted.
            </p>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setRoomToDelete(null)}
                className="px-3.5 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteRoom(roomToDelete.id)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold cursor-pointer shadow-md shadow-rose-600/25"
              >
                Delete Room
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------ */}
      {/* MODAL: USER PROFILE & SETTINGS             */}
      {/* ------------------------------------------ */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-400" />
                My Account Profile
              </h3>
              <button onClick={() => setShowProfileModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                const form = e.currentTarget;
                const name = (form.elements.namedItem('userName') as HTMLInputElement).value.trim();
                const department = (form.elements.namedItem('userDept') as HTMLSelectElement)?.value;
                const newPassword = (form.elements.namedItem('newPassword') as HTMLInputElement)?.value.trim();

                setCurrentUser(prev => prev ? { ...prev, name, department: department || prev.department } : null);

                // If password changed, update in accounts list
                if (newPassword) {
                  setAccounts(prev => prev.map(a => a.id === currentUser.id ? { ...a, name, password: newPassword, department: department || a.department } : a));
                } else {
                  setAccounts(prev => prev.map(a => a.id === currentUser.id ? { ...a, name, department: department || a.department } : a));
                }

                showToast('success', 'Profile Updated', 'Your profile details have been saved.');
                setShowProfileModal(false);
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="block text-slate-400 mb-1">Account Role</label>
                <input
                  type="text"
                  disabled
                  value={currentUser.role.toUpperCase()}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-slate-400 font-bold uppercase text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={currentUser.email}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-slate-400 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  name="userName"
                  defaultValue={currentUser.name}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              {currentUser.role === 'student' && (
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Enrolled Department / Cohort</label>
                  <select
                    name="userDept"
                    defaultValue={currentUser.department || 'B.Tech CS - Sem 4'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-xs"
                  >
                    {DEPARTMENTS.map(d => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-medium mb-1">Change Password (Optional)</label>
                <input
                  type="password"
                  name="newPassword"
                  placeholder="Leave empty to keep current password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-xs font-mono"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="px-3.5 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold cursor-pointer shadow-md shadow-indigo-600/25"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------ */}
      {/* FOOTER                                     */}
      {/* ------------------------------------------ */}
      <footer className="border-t border-slate-800/80 bg-slate-900/40 py-6 text-center text-xs text-slate-500">
        <p>&copy; 2026 College Examination & Room Allocation Management System. All rights reserved.</p>
        <p className="text-[11px] text-slate-600 mt-1">
          Strict Capacity Verification &bull; Time-Interval Overlap Prevention &bull; Room Visual Matrix
        </p>
      </footer>
    </div>
  );
}

// ==========================================
// SUB-COMPONENT: MATRIX SLOT BOX
// ==========================================
function SlotBox({ exams, start, end }: { exams: Exam[]; start: string; end: string }) {
  const matchingExam = exams.find(e => (start < e.endTime) && (end > e.startTime));

  if (!matchingExam) {
    return (
      <div className="h-14 m-1 rounded-xl bg-slate-950/40 border border-slate-800/40 flex items-center justify-center text-[10px] text-slate-600 hover:bg-slate-900/60 transition-colors">
        Available
      </div>
    );
  }

  return (
    <div className="h-14 m-1 p-1.5 rounded-xl bg-indigo-950/80 border border-indigo-700/80 flex flex-col justify-between overflow-hidden shadow-sm hover:scale-[1.02] transition-transform">
      <div className="flex items-center justify-between">
        <span className="font-mono font-bold text-[10px] text-indigo-300 truncate">
          {matchingExam.courseCode}
        </span>
        <span className="text-[9px] text-slate-400">
          {matchingExam.studentCount} sts
        </span>
      </div>
      <div className="text-[9px] text-slate-300 truncate font-medium">
        {matchingExam.courseName}
      </div>
      <div className="text-[8px] text-indigo-400 font-mono">
        {matchingExam.startTime}-{matchingExam.endTime}
      </div>
    </div>
  );
}
