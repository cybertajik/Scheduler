import React, { useEffect, useState } from 'react';
import { UserCog, Plus, UserX, UserCheck, Shield, Trash2, AlertTriangle } from 'lucide-react';
import { userService } from '../services/apiServices';
import { User, UserRole } from '../types';
import { StatusBadge } from '../components/Common/StatusBadge';
import { Modal } from '../components/Common/Modal';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { ErrorBanner } from '../components/Common/ErrorBanner';
import { useAuth } from '../context/AuthContext';

export const UsersManagementPage: React.FC = () => {
  const { user: currentUser, isManager, isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const defaultRole: UserRole = 'EMPLOYEE';

  const [formData, setFormData] = useState<{
    username: string;
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role: UserRole;
  }>({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: defaultRole,
  });

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch user accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await userService.createUser(formData);
      setIsModalOpen(false);
      setFormData({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        role: defaultRole,
      });
      loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create user account');
    }
  };

  const handleToggleActive = async (targetUser: User) => {
    try {
      if (targetUser.active) {
        await userService.deactivateUser(targetUser.id);
      } else {
        await userService.activateUser(targetUser.id);
      }
      loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update user status');
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await userService.deleteUser(userToDelete.id);
      setUserToDelete(null);
      loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete user account');
    }
  };

  const isAdminRole = (role: string) => ['SUPER_ADMIN', 'ORG_ADMIN', 'ADMIN'].includes(role);

  const getActionPermissions = (targetUser: User) => {
    const isSelf = currentUser?.id === targetUser.id;
    const isTargetAdmin = isAdminRole(targetUser.role);
    const isTargetManager = targetUser.role === 'MANAGER';

    if (isTargetAdmin && isSelf) {
      return {
        canDeactivate: false,
        canDelete: false,
        reason: 'Admin cannot deactivate or delete their own account',
      };
    }

    if (isManager) {
      if (isTargetAdmin || isTargetManager) {
        return {
          canDeactivate: false,
          canDelete: false,
          reason: 'Managers can only deactivate or delete Schedulers and Employees',
        };
      }
    }

    return {
      canDeactivate: true,
      canDelete: true,
      reason: '',
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">User Accounts Management</h1>
          <p className="text-sm text-slate-400 mt-1">Manage platform accounts, roles, and user permissions</p>
        </div>
        <button
          onClick={() => {
            setFormData({
              username: '',
              email: '',
              password: '',
              first_name: '',
              last_name: '',
              role: isManager ? 'EMPLOYEE' : 'EMPLOYEE',
            });
            setIsModalOpen(true);
          }}
          className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create User</span>
        </button>
      </div>

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      {loading ? (
        <LoadingSpinner label="Fetching user directory..." />
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/60 text-xs uppercase text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Username</th>
                  <th className="px-6 py-4">Full Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Assigned Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((targetUser) => {
                  const { canDeactivate, canDelete, reason } = getActionPermissions(targetUser);

                  return (
                    <tr key={targetUser.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-100">
                        {targetUser.username}
                        {currentUser?.id === targetUser.id && (
                          <span className="ml-2 text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/30">You</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-200">{targetUser.first_name} {targetUser.last_name}</td>
                      <td className="px-6 py-4 text-slate-400 text-xs">{targetUser.email}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={targetUser.role} type="role" />
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={targetUser.active ? 'Active' : 'Inactive'} type="boolean" />
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {/* Deactivate / Activate Button */}
                        <button
                          onClick={() => handleToggleActive(targetUser)}
                          disabled={!canDeactivate}
                          className={`p-1.5 rounded-lg transition-colors ${
                            !canDeactivate
                              ? 'text-slate-600 cursor-not-allowed opacity-40'
                              : targetUser.active
                              ? 'text-slate-400 hover:text-amber-400 hover:bg-amber-500/10'
                              : 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10'
                          }`}
                          title={!canDeactivate ? reason : targetUser.active ? 'Deactivate User Account' : 'Activate User Account'}
                        >
                          {targetUser.active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>

                        {/* Delete User Button */}
                        <button
                          onClick={() => setUserToDelete(targetUser)}
                          disabled={!canDelete}
                          className={`p-1.5 rounded-lg transition-colors ${
                            !canDelete
                              ? 'text-slate-600 cursor-not-allowed opacity-40'
                              : 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10'
                          }`}
                          title={!canDelete ? reason : 'Delete User Account'}
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
      )}

      {/* Create User Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create User Account">
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Username</label>
            <input
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Min 8 chars, 1 upper, 1 special..."
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">First Name</label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Last Name</label>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm"
            >
              {!isManager && <option value="ADMIN">ADMIN</option>}
              {!isManager && <option value="MANAGER">MANAGER</option>}
              <option value="SCHEDULER">SCHEDULER</option>
              <option value="EMPLOYEE">EMPLOYEE</option>
            </select>
          </div>

          <div className="pt-4 flex justify-end space-x-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-500 shadow-lg shadow-blue-600/20"
            >
              Create User Account
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <Modal isOpen={!!userToDelete} onClose={() => setUserToDelete(null)} title="Delete User Account">
          <div className="space-y-4">
            <div className="flex items-center space-x-3 text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <p className="text-sm font-medium">
                Are you sure you want to permanently delete user account <strong className="text-slate-100 font-mono">{userToDelete.username}</strong> ({userToDelete.email})?
              </p>
            </div>
            <p className="text-xs text-slate-400">
              This action is permanent and cannot be undone. All associated session tokens and metadata will be permanently removed.
            </p>
            <div className="pt-4 flex justify-end space-x-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-semibold hover:bg-rose-500 shadow-lg shadow-rose-600/20"
              >
                Permanently Delete User
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

