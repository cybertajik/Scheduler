import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, User, Mail, Phone, MapPin, Globe, Users, CheckCircle2, ArrowLeft, Send, Sparkles } from 'lucide-react';
import { onboardingService } from '../services/apiServices';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    org_name: '',
    contact_name: '',
    contact_email: '',
    contact_tel: '',
    address: '',
    requested_domain: '',
    estimated_employees: 15,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await onboardingService.submitApplication({
        ...formData,
        estimated_employees: Number(formData.estimated_employees) || 10,
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit onboarding application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs font-semibold text-blue-400 mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Staff Scheduler SaaS Enterprise
          </div>
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight sm:text-4xl">
            Register Your Organization
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Submit your membership application. Our Product Owner team will review and set up your dedicated workspace domain.
          </p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
          {submitted ? (
            <div className="text-center py-10 space-y-6">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto text-emerald-400 shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-100">Application Submitted Successfully!</h3>
                <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
                  Thank you for applying for <span className="text-slate-200 font-semibold">{formData.org_name}</span>. The Product Owner team will review your details and send confirmation to <span className="text-blue-400 font-mono">{formData.contact_email}</span>.
                </p>
              </div>
              <div className="pt-4">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-blue-600/20"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Login
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Org Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-400" /> Organization Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Health Corp"
                    value={formData.org_name}
                    onChange={e => setFormData({ ...formData, org_name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Point of Contact Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-400" /> Point of Contact (Name) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Connor"
                    value={formData.contact_name}
                    onChange={e => setFormData({ ...formData, contact_name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Contact Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-400" /> Contact Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. sarah@acmehealth.com"
                    value={formData.contact_email}
                    onChange={e => setFormData({ ...formData, contact_email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                {/* Contact Tel */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-blue-400" /> Telephone / Mobile *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +1-555-0199"
                    value={formData.contact_tel}
                    onChange={e => setFormData({ ...formData, contact_tel: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Estimated Employees */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-400" /> Estimated Employees
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.estimated_employees}
                    onChange={e => setFormData({ ...formData, estimated_employees: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Address */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-400" /> Office / Corporate Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 500 Enterprise Way, Suite 400, NY"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Requested Domain */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-400" /> Requested Custom Domain / Subdomain
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. acmehealth.scheduler.local or acme.com"
                    value={formData.requested_domain}
                    onChange={e => setFormData({ ...formData, requested_domain: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-slate-800">
                <Link
                  to="/login"
                  className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Return to Login
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Submit Application
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
