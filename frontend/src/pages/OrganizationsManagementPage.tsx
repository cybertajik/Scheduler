import React, { useEffect, useState } from 'react';
import { Building2, Plus, Globe, Shield, User, CheckCircle, AlertCircle, Calendar, Clock, Ban, Check, Trash2, Mail, Phone, MapPin, Sparkles, Inbox, RefreshCw, FileSpreadsheet, FileText, Edit3, Notebook } from 'lucide-react';
import { organizationService, onboardingService } from '../services/apiServices';
import { Organization, OnboardingApplication } from '../types';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { useLanguage } from '../context/LanguageContext';

export const OrganizationsManagementPage: React.FC = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'orgs' | 'applications' | 'system'>('orgs');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [applications, setApplications] = useState<OnboardingApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'success' | 'error'>('success');

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    domain: '',
    description: '',
    contact_email: '',
    contact_tel: '',
    address: '',
    billing_cycle: 'MONTHLY',
    require_employee_id: true,
    top_manager_email: '',
    top_manager_password: '',
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    domain: '',
    description: '',
    contact_email: '',
    contact_tel: '',
    address: '',
    billing_cycle: 'MONTHLY',
    require_employee_id: true,
    subscription_status: 'ACTIVE',
  });

  const [notesList, setNotesList] = useState<Array<{id: string; text: string; created_at: string}>>([]);
  const [newNoteText, setNewNoteText] = useState('');

  const loadData = async () => {
    try {
      const [orgsData, appsData] = await Promise.all([
        organizationService.getOrganizations(),
        onboardingService.getApplications().catch(() => []),
      ]);
      setOrganizations(orgsData);
      setApplications(appsData);
    } catch (err) {
      console.error('Failed to load SaaS management data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setMsg(text);
    setMsgType(type);
    setTimeout(() => setMsg(''), 5000);
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await organizationService.createOrganization(formData);
      setShowCreateModal(false);
      setFormData({
        name: '', slug: '', domain: '', description: '',
        contact_email: '', contact_tel: '', address: '', billing_cycle: 'MONTHLY',
        require_employee_id: true, top_manager_email: '', top_manager_password: '',
      });
      showNotification('New organization created successfully!');
      loadData();
    } catch (err: any) {
      showNotification(err.response?.data?.detail || 'Failed to create organization', 'error');
    }
  };

  const handleOpenEdit = (org: Organization) => {
    setSelectedOrg(org);
    setEditFormData({
      name: org.name || '',
      domain: org.domain || '',
      description: org.description || '',
      contact_email: org.contact_email || '',
      contact_tel: org.contact_tel || '',
      address: org.address || '',
      billing_cycle: org.billing_cycle || 'MONTHLY',
      require_employee_id: org.require_employee_id !== undefined ? org.require_employee_id : true,
      subscription_status: org.subscription_status || 'ACTIVE',
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg) return;
    setActionLoading(selectedOrg.id);
    try {
      await organizationService.updateOrganizationById(selectedOrg.id, editFormData);
      showNotification(`Organization '${selectedOrg.name}' updated successfully.`);
      setShowEditModal(false);
      await loadData();
    } catch (err: any) {
      showNotification(err.response?.data?.detail || 'Failed to update organization', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const parseNotes = (raw: string | undefined | null): Array<{id: string; text: string; created_at: string}> => {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
    // Legacy: plain text note — wrap into single entry
    if (raw.trim()) return [{ id: Date.now().toString(), text: raw.trim(), created_at: new Date().toISOString() }];
    return [];
  };

  const handleOpenNotes = (org: Organization) => {
    setSelectedOrg(org);
    setNotesList(parseNotes(org.admin_notes));
    setNewNoteText('');
    setShowNotesModal(true);
  };

  const handleAddNote = async () => {
    if (!selectedOrg || !newNoteText.trim()) return;
    const newNote = { id: Date.now().toString(), text: newNoteText.trim(), created_at: new Date().toISOString() };
    const updated = [...notesList, newNote];
    setNotesList(updated);
    setNewNoteText('');
    setActionLoading(selectedOrg.id);
    try {
      await organizationService.updateOrganizationById(selectedOrg.id, { admin_notes: JSON.stringify(updated) });
      showNotification(`Note added for '${selectedOrg.name}'.`);
      await loadData();
    } catch (err: any) {
      showNotification(err.response?.data?.detail || 'Failed to save note', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!selectedOrg) return;
    const updated = notesList.filter(n => n.id !== noteId);
    setNotesList(updated);
    setActionLoading(selectedOrg.id);
    try {
      await organizationService.updateOrganizationById(selectedOrg.id, { admin_notes: updated.length ? JSON.stringify(updated) : null });
      showNotification('Note deleted.');
      await loadData();
    } catch (err: any) {
      showNotification(err.response?.data?.detail || 'Failed to delete note', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleExtendGrace = async (orgId: string, days = 14) => {
    setActionLoading(orgId);
    try {
      await organizationService.extendGracePeriod(orgId, days);
      showNotification(`Grace period extended by ${days} days.`);
      await loadData();
    } catch (err: any) {
      showNotification(err.response?.data?.detail || 'Failed to extend grace period', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleSuspend = async (org: Organization) => {
    setActionLoading(org.id);
    try {
      if (org.subscription_status === 'SUSPENDED' || !org.active) {
        await organizationService.activateOrganization(org.id);
        showNotification(`Organization '${org.name}' reactivated.`);
      } else {
        await organizationService.suspendOrganization(org.id);
        showNotification(`Organization '${org.name}' suspended.`);
      }
      await loadData();
    } catch (err: any) {
      showNotification(err.response?.data?.detail || 'Failed to change subscription status', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteOrg = async (orgId: string, orgName: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete organization '${orgName}' and all its users?`)) return;
    setActionLoading(orgId);
    try {
      await organizationService.deleteOrganization(orgId);
      showNotification(`Organization '${orgName}' deleted.`);
      await loadData();
    } catch (err: any) {
      showNotification(err.response?.data?.detail || 'Failed to delete organization', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveApplication = async (appId: string) => {
    setActionLoading(appId);
    try {
      await onboardingService.approveApplication(appId);
      showNotification('Application approved! Organization and Top Manager account created.');
      await loadData();
    } catch (err: any) {
      showNotification(err.response?.data?.detail || 'Failed to approve application', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectApplication = async (appId: string) => {
    const reason = window.prompt('Enter rejection reason for applicant:', 'Does not meet organization criteria');
    if (reason === null) return;
    setActionLoading(appId);
    try {
      await onboardingService.rejectApplication(appId, reason);
      showNotification('Application rejected.');
      await loadData();
    } catch (err: any) {
      showNotification(err.response?.data?.detail || 'Failed to reject application', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <LoadingSpinner label="Loading Product Owner Control Panel..." />;

  const pendingApps = applications.filter(a => a.status === 'PENDING');

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/40 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs font-semibold text-blue-400 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" /> Product Owner Governance
              </span>
              {pendingApps.length > 0 && (
                <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs font-semibold text-amber-400 flex items-center gap-1.5 animate-pulse">
                  <Inbox className="w-3.5 h-3.5" /> {pendingApps.length} Pending Onboarding Request(s)
                </span>
              )}
            </div>
            <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">SaaS Subscribed Organizations</h1>
            <p className="text-sm text-slate-400 max-w-2xl">
              Provision new tenants, manage organization contact & billing cycles, extend grace periods, and audit platform subscriptions.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-2xl shadow-xl shadow-blue-600/20 hover:shadow-blue-500/30 transition-all flex items-center gap-2 text-sm self-start md:self-auto"
          >
            <Plus className="w-4 h-4" /> Provision Organization
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {msg && (
        <div className={`p-4 rounded-2xl border text-sm font-semibold flex items-center gap-3 ${
          msgType === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
          {msgType === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {msg}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 space-x-8">
        <button
          onClick={() => setActiveTab('orgs')}
          className={`pb-4 text-sm font-bold transition-all relative flex items-center gap-2 ${
            activeTab === 'orgs' ? 'text-blue-400 border-b-2 border-blue-500' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" /> Subscribed Organizations ({organizations.length})
        </button>

        <button
          onClick={() => setActiveTab('applications')}
          className={`pb-4 text-sm font-bold transition-all relative flex items-center gap-2 ${
            activeTab === 'applications' ? 'text-blue-400 border-b-2 border-blue-500' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Inbox className="w-4 h-4" /> Onboarding Applications Queue
          {pendingApps.length > 0 && (
            <span className="ml-1.5 px-2 py-0.5 bg-amber-500 text-slate-950 rounded-full text-xs font-extrabold">
              {pendingApps.length}
            </span>
          )}
        </button>
      </div>

      {/* ── TAB 1: Subscribed Organizations Grid ── */}
      {activeTab === 'orgs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {organizations.map((org) => {
            const isSuspended = org.subscription_status === 'SUSPENDED' || !org.active;
            const isGrace = org.subscription_status === 'GRACE_PERIOD';

            return (
              <div
                key={org.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 shadow-xl space-y-6 transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Title & Status */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                        {org.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                          <Globe className="w-3.5 h-3.5 text-blue-400" /> {org.domain || `${org.slug}.scheduler.local`}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        isSuspended
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : isGrace
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      }`}
                    >
                      {org.subscription_status || (org.active ? 'ACTIVE' : 'SUSPENDED')}
                    </span>
                  </div>

                  {/* Description / Notes */}
                  {org.description && (
                    <p className="text-xs text-slate-400 line-clamp-2">{org.description}</p>
                  )}

                  {/* Metadata Cards */}
                  <div className="grid grid-cols-1 gap-2 text-xs pt-2 border-t border-slate-800/80">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Billing Cycle:</span>
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-semibold">{org.billing_cycle || 'MONTHLY'}</span>
                    </div>

                    {org.contact_email && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Contact Email:</span>
                        <span className="text-slate-300 font-mono">{org.contact_email}</span>
                      </div>
                    )}

                    {org.contact_tel && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Tel:</span>
                        <span className="text-slate-300">{org.contact_tel}</span>
                      </div>
                    )}

                    {org.grace_period_until && (
                      <div className="flex items-center justify-between text-amber-400">
                        <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Grace Period Until:</span>
                        <span className="font-mono">{new Date(org.grace_period_until).toLocaleDateString()}</span>
                      </div>
                    )}

                    {org.admin_notes && (() => {
                      const parsedNotes = parseNotes(org.admin_notes);
                      if (parsedNotes.length === 0) return null;
                      return (
                        <div
                          onClick={() => handleOpenNotes(org)}
                          className="mt-2 p-2.5 bg-blue-950/30 hover:bg-blue-950/50 border border-blue-900/40 rounded-xl text-xs text-blue-300 cursor-pointer transition-colors space-y-1.5"
                          title="Click to manage Super Admin Internal Notes"
                        >
                          <div className="flex items-center justify-between">
                            <strong className="text-blue-400 font-semibold flex items-center gap-1.5">
                              <Notebook className="w-3.5 h-3.5" /> Super Admin Notes ({parsedNotes.length}):
                            </strong>
                            <span className="text-[10px] text-blue-400/80 hover:underline">View & Manage &rarr;</span>
                          </div>
                          <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                            {parsedNotes.map((note) => (
                              <div key={note.id} className="p-2 bg-slate-950/60 rounded-lg border border-blue-900/30 text-slate-200">
                                <p className="text-xs whitespace-pre-wrap break-words">{note.text}</p>
                                <p className="text-[9px] text-slate-500 font-mono mt-1">
                                  {new Date(note.created_at).toLocaleString()}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* SaaS Action Buttons */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                  {/* Left: Extend Grace */}
                  <button
                    onClick={() => handleExtendGrace(org.id, 14)}
                    disabled={actionLoading === org.id}
                    className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                  >
                    <Clock className="w-3.5 h-3.5" /> Extend Grace (+14d)
                  </button>

                  {/* Middle & Right: Notes (BETWEEN Grace Period & Suspend), Edit, Suspend, Delete */}
                  <div className="flex items-center gap-1.5">
                    {/* Notes Icon Button — Positioned BETWEEN Grace Period and Suspend */}
                    <button
                      onClick={() => handleOpenNotes(org)}
                      className="px-2.5 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                      title="Super Admin Internal Notes"
                    >
                      <Notebook className="w-3.5 h-3.5" /> Notes {org.admin_notes ? `(${parseNotes(org.admin_notes).length})` : ''}
                    </button>

                    {/* Edit Details Button */}
                    <button
                      onClick={() => handleOpenEdit(org)}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                      title="Edit Organization Details & Contact Info"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>

                    {/* Suspend / Activate Button */}
                    <button
                      onClick={() => handleToggleSuspend(org)}
                      disabled={actionLoading === org.id}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1 ${
                        isSuspended
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                      }`}
                    >
                      {isSuspended ? <Check className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                      {isSuspended ? 'Activate' : 'Suspend'}
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteOrg(org.id, org.name)}
                      disabled={actionLoading === org.id}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Delete Organization"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── TAB 2: Onboarding Applications Queue ── */}
      {activeTab === 'applications' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-100">Pending Onboarding Applicants</h3>
              <p className="text-xs text-slate-400 mt-0.5">Approve new organizations to auto-generate their tenant space and Top Manager account.</p>
            </div>
            <button
              onClick={() => loadData()}
              className="p-2 text-slate-400 hover:text-slate-200 bg-slate-800 rounded-xl transition-colors"
              title="Refresh queue"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {applications.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">No onboarding applications submitted yet.</div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <div key={app.id} className="p-5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h4 className="text-base font-bold text-slate-100">{app.org_name}</h4>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        app.status === 'APPROVED'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : app.status === 'REJECTED'
                          ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      }`}>
                        {app.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs text-slate-400 pt-1">
                      <div><strong className="text-slate-300">Contact:</strong> {app.contact_name}</div>
                      <div><strong className="text-slate-300">Email:</strong> {app.contact_email}</div>
                      <div><strong className="text-slate-300">Tel:</strong> {app.contact_tel}</div>
                      <div><strong className="text-slate-300">Est. Staff:</strong> {app.estimated_employees} employees</div>
                    </div>
                  </div>

                  {app.status === 'PENDING' && (
                    <div className="flex items-center gap-2 self-end md:self-center">
                      <button
                        onClick={() => handleRejectApplication(app.id)}
                        disabled={actionLoading === app.id}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-rose-400 border border-slate-700 rounded-xl text-xs font-semibold transition-colors"
                      >
                        Deny
                      </button>
                      <button
                        onClick={() => handleApproveApplication(app.id)}
                        disabled={actionLoading === app.id}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" /> Approve & Provision
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Edit Organization Details */}
      {showEditModal && selectedOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-blue-400" /> Edit Organization: {selectedOrg.name}
            </h2>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Organization Name</label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Billing Cycle</label>
                  <select
                    value={editFormData.billing_cycle}
                    onChange={(e) => setEditFormData({ ...editFormData, billing_cycle: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="MONTHLY">MONTHLY</option>
                    <option value="ANNUAL">ANNUAL</option>
                    <option value="QUARTERLY">QUARTERLY</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Subscription Status</label>
                  <select
                    value={editFormData.subscription_status}
                    onChange={(e) => setEditFormData({ ...editFormData, subscription_status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                    <option value="GRACE_PERIOD">GRACE_PERIOD</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={editFormData.contact_email}
                    onChange={(e) => setEditFormData({ ...editFormData, contact_email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Telephone</label>
                  <input
                    type="tel"
                    value={editFormData.contact_tel}
                    onChange={(e) => setEditFormData({ ...editFormData, contact_tel: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Address</label>
                <input
                  type="text"
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === selectedOrg.id}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Super Admin Internal Notes */}
      {showNotesModal && selectedOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-5 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Notebook className="w-5 h-5 text-blue-400" /> Admin Notes: {selectedOrg.name}
            </h2>
            <p className="text-xs text-slate-400">
              Private administrative notes regarding billing, support history, or contract terms.
            </p>

            {/* Existing Notes List */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {notesList.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs">No notes yet. Add the first note below.</div>
              ) : (
                notesList.map((note) => (
                  <div key={note.id} className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-start justify-between gap-3 group">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-200 whitespace-pre-wrap break-words">{note.text}</p>
                      <p className="text-[10px] text-slate-500 mt-1 font-mono">
                        {new Date(note.created_at).toLocaleString()}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteNote(note.id)}
                      className="px-2.5 py-1 text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg transition-colors flex-shrink-0 flex items-center gap-1.5"
                      title="Delete this note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add New Note Input */}
            <div className="flex items-end gap-2 pt-2 border-t border-slate-800">
              <textarea
                rows={2}
                placeholder="Write a new note..."
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddNote(); } }}
                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-mono leading-relaxed resize-none"
              />
              <button
                type="button"
                onClick={handleAddNote}
                disabled={!newNoteText.trim() || actionLoading === selectedOrg.id}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all"
              >
                Add
              </button>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowNotesModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Organization */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-100">Create New SaaS Organization</h2>
            <form onSubmit={handleCreateOrg} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Organization Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Health Corp"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Slug</label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Email</label>
                  <input
                    type="email"
                    placeholder="contact@org.com"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Telephone</label>
                  <input
                    type="tel"
                    placeholder="+1-555-0100"
                    value={formData.contact_tel}
                    onChange={(e) => setFormData({ ...formData, contact_tel: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all"
                >
                  Provision Tenant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
