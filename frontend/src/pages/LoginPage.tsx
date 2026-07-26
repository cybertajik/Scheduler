import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CalendarCheck, Lock, Mail, AlertCircle, Shield } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Admin123!');
    setError('');
    setLoading(true);
    try {
      await login(demoEmail, 'Admin123!');
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none -top-40 -left-40"></div>
      <div className="absolute w-[400px] h-[400px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none -bottom-40 -right-40"></div>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400 mb-3 shadow-inner">
            <CalendarCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-100">Staff Scheduler</h2>
          <p className="text-sm text-slate-400 mt-1">CP-SAT Optimization & Scheduling Platform</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center space-x-3 text-rose-300 text-sm">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Email Address / Username
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@scheduler.internal"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/25 hover:shadow-blue-500/35 transition-all disabled:opacity-50 text-sm flex items-center justify-center space-x-2"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                <span>Sign In to System</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Sign In Section */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <p className="text-xs text-slate-500 text-center font-medium mb-3">Quick Demo Sign-In</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleDemoLogin('admin@scheduler.internal')}
              className="px-3 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs text-slate-300 transition-colors font-medium text-center"
            >
              Admin Demo
            </button>
            <button
              onClick={() => handleDemoLogin('scheduler@scheduler.internal')}
              className="px-3 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs text-slate-300 transition-colors font-medium text-center"
            >
              Scheduler Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
