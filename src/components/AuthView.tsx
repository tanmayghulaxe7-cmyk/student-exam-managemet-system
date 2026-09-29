import React, { useState } from 'react';
import {
  Building,
  Shield,
  GraduationCap,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Role, UserAccount, UserProfile } from '../types';
import { DEPARTMENTS } from '../mockData';

interface AuthViewProps {
  accounts: UserAccount[];
  onLoginSuccess: (user: UserProfile) => void;
  onRegisterAccount: (newAccount: UserAccount) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  accounts,
  onLoginSuccess,
  onRegisterAccount
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [selectedRole, setSelectedRole] = useState<Role>('student');
  const [email, setEmail] = useState<string>('student@college.edu');
  const [password, setPassword] = useState<string>('student');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Registration form fields
  const [regName, setRegName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>('');
  const [regDepartment, setRegDepartment] = useState<string>(DEPARTMENTS[0]);
  const [regStudentId, setRegStudentId] = useState<string>('');

  // Status message
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Quick fill helper
  const handleQuickFill = (role: Role) => {
    setSelectedRole(role);
    setErrorMessage(null);
    setSuccessMessage(null);
    if (role === 'admin') {
      setEmail('admin@college.edu');
      setPassword('admin');
    } else {
      setEmail('student@college.edu');
      setPassword('student');
    }
  };

  // Direct 1-click Demo Login
  const handleInstantDemoLogin = (role: Role) => {
    setErrorMessage(null);
    const targetEmail = role === 'admin' ? 'admin@college.edu' : 'student@college.edu';
    const found = accounts.find(a => a.email.toLowerCase() === targetEmail.toLowerCase() && a.role === role);
    if (found) {
      const { password: _, ...profile } = found;
      onLoginSuccess(profile);
    } else {
      // Fallback
      onLoginSuccess({
        id: role === 'admin' ? 'demo-admin' : 'demo-student',
        name: role === 'admin' ? 'Dr. Arthur Vance (Dean of Exams)' : 'Alex Mercer (Student)',
        email: targetEmail,
        role,
        department: role === 'student' ? 'B.Tech CS - Sem 4' : undefined,
        studentId: role === 'student' ? 'CS2024-089' : undefined
      });
    }
  };

  // Submit Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setErrorMessage('Please provide both your Email ID and Password.');
      return;
    }

    // Check account in accounts list
    const account = accounts.find(a => a.email.toLowerCase() === cleanEmail);

    if (!account) {
      setErrorMessage(`No account found with Email ID "${cleanEmail}". Please check your email or register a new account.`);
      return;
    }

    if (account.role !== selectedRole) {
      setErrorMessage(
        `Role Mismatch: "${cleanEmail}" is registered as a ${account.role.toUpperCase()}, but you have "${selectedRole.toUpperCase()}" selected.`
      );
      return;
    }

    if (account.password !== cleanPassword) {
      setErrorMessage('Invalid Password. Please re-enter your password.');
      return;
    }

    // Authentication Success!
    const { password: _, ...userProfile } = account;
    onLoginSuccess(userProfile);
  };

  // Submit Registration
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = regEmail.trim().toLowerCase();
    const cleanName = regName.trim();
    const cleanPassword = regPassword.trim();

    if (!cleanName || !cleanEmail || !cleanPassword) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (cleanPassword.length < 4) {
      setErrorMessage('Password must be at least 4 characters long.');
      return;
    }

    if (cleanPassword !== regConfirmPassword.trim()) {
      setErrorMessage('Passwords do not match. Please confirm your password.');
      return;
    }

    // Check if email already exists
    const existing = accounts.find(a => a.email.toLowerCase() === cleanEmail);
    if (existing) {
      setErrorMessage(`An account is already registered with Email ID "${cleanEmail}". Please log in.`);
      return;
    }

    const newAccount: UserAccount = {
      id: `${selectedRole}-${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      password: cleanPassword,
      role: selectedRole,
      department: selectedRole === 'student' ? regDepartment : undefined,
      studentId: selectedRole === 'student' ? (regStudentId.trim() || `STU-${Date.now().toString().slice(-4)}`) : undefined
    };

    onRegisterAccount(newAccount);

    // Auto switch to login or auto sign in
    setSuccessMessage(`Account created successfully for ${cleanName}! Logging you in...`);
    setTimeout(() => {
      const { password: _, ...profile } = newAccount;
      onLoginSuccess(profile);
    }, 900);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 selection:bg-indigo-500 selection:text-white">
      {/* Brand Header */}
      <div className="text-center mb-6 max-w-md">
        <div className="inline-flex p-3 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 mb-3 shadow-lg shadow-indigo-600/10">
          <Building className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-1.5">
          EXAM<span className="text-indigo-400">SYNC</span> PORTAL
        </h1>
        <p className="text-slate-400 text-xs mt-1">
          College Examination Timetable & Room Allocation System
        </p>
      </div>

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl">
        {/* Instant 1-Click Demo Logins */}
        <div className="p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800 mb-5">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> 1-Click Demo Access
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handleInstantDemoLogin('student')}
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-500/50 text-emerald-300 font-semibold text-xs transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <GraduationCap className="w-4 h-4 text-emerald-400" />
              Student Demo
            </button>
            <button
              type="button"
              onClick={() => handleInstantDemoLogin('admin')}
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/70 border border-indigo-500/50 text-indigo-300 font-semibold text-xs transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <Shield className="w-4 h-4 text-indigo-400" />
              Admin Demo
            </button>
          </div>
        </div>

        {/* Tab Selector: Login vs Register */}
        <div className="grid grid-cols-2 bg-slate-950 p-1 rounded-2xl border border-slate-800 mb-5 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage(null);
            }}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              mode === 'login' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In with Email
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMessage(null);
            }}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              mode === 'register' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Register Account
          </button>
        </div>

        {/* Role Toggle: Student vs Admin */}
        <div className="mb-5">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Select Your Role
          </label>
          <div className="grid grid-cols-2 gap-2 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => {
                setSelectedRole('student');
                if (mode === 'login') {
                  setEmail('student@college.edu');
                  setPassword('student');
                }
              }}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                selectedRole === 'student'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              Student
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedRole('admin');
                if (mode === 'login') {
                  setEmail('admin@college.edu');
                  setPassword('admin');
                }
              }}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                selectedRole === 'admin'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-4 h-4" />
              Admin
            </button>
          </div>
        </div>

        {/* Error / Success Alerts */}
        {errorMessage && (
          <div className="p-3 mb-4 rounded-xl bg-rose-950/80 border border-rose-600/80 text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 mb-4 rounded-xl bg-emerald-950/80 border border-emerald-600/80 text-emerald-200 text-xs flex items-start gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{successMessage}</span>
          </div>
        )}

        {/* ======================= */}
        {/* LOGIN FORM              */}
        {/* ======================= */}
        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-3.5 text-xs">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-slate-300 font-medium">Email ID</label>
                <button
                  type="button"
                  onClick={() => handleQuickFill(selectedRole)}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 cursor-pointer"
                >
                  Fill Demo Email
                </button>
              </div>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="e.g. user@college.edu"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-slate-300 font-medium">Password</label>
                <span className="text-[10px] text-slate-500">
                  Demo Pass: <code className="text-slate-400">{selectedRole}</code>
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-10 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 active:scale-95 cursor-pointer text-sm"
            >
              Sign In as {selectedRole === 'admin' ? 'Exam Admin' : 'Student'}
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center pt-2">
              <span className="text-slate-500">Don't have an account yet? </span>
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer underline"
              >
                Register Here
              </button>
            </div>
          </form>
        ) : (
          /* ======================= */
          /* REGISTRATION FORM       */
          /* ======================= */
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  placeholder={selectedRole === 'admin' ? 'Dr. Elizabeth Clark' : 'Marcus Vance'}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">College Email ID</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  placeholder="e.g. yourname@college.edu"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {selectedRole === 'student' && (
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Class / Department</label>
                  <select
                    value={regDepartment}
                    onChange={e => setRegDepartment(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                  >
                    {DEPARTMENTS.map(d => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Student Roll / ID</label>
                  <input
                    type="text"
                    value={regStudentId}
                    onChange={e => setRegStudentId(e.target.value)}
                    placeholder="e.g. CS2026-104"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  placeholder="Min 4 chars"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Confirm Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={regConfirmPassword}
                  onChange={e => setRegConfirmPassword(e.target.value)}
                  placeholder="Repeat pass"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 active:scale-95 cursor-pointer text-sm"
            >
              Register & Sign In
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center pt-2">
              <span className="text-slate-500">Already have an account? </span>
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer underline"
              >
                Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
