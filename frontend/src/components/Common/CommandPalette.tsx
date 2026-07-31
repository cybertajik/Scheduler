import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutDashboard,
  Calendar,
  Users,
  Clock,
  ShieldAlert,
  Boxes,
  Activity,
  FileText,
  UserCheck,
  FileSpreadsheet,
  UserCog,
  Sliders,
  Building2,
  Cpu,
  Download,
  Sun,
  Moon,
  ArrowRight,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CommandItem {
  id: string;
  title: string;
  category: 'Navigation' | 'Actions' | 'Settings' | string;
  path?: string;
  icon: any;
  action?: () => void;
  keywords?: string[];
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const commands: CommandItem[] = [
    // Navigation
    { id: 'nav-dashboard', title: 'Dashboard', category: 'Navigation', path: '/', icon: LayoutDashboard, keywords: ['home', 'overview', 'main'] },
    { id: 'nav-portal', title: 'My Self-Service Portal', category: 'Navigation', path: '/my-portal', icon: UserCheck, keywords: ['employee', 'vacation', 'swap', 'myself'] },
    { id: 'nav-schedules', title: 'Schedule Editor & Rosters', category: 'Navigation', path: '/schedules', icon: Calendar, keywords: ['shifts', 'roster', 'calendar'] },
    { id: 'nav-sandbox', title: 'Scenario Sandbox Planning', category: 'Navigation', path: '/sandbox', icon: Boxes, keywords: ['simulation', 'scenario', 'whatif'] },
    { id: 'nav-workers', title: 'Employees & Workers Directory', category: 'Navigation', path: '/workers', icon: Users, keywords: ['staff', 'roster', 'people'] },
    { id: 'nav-shift-types', title: 'Shift Types & Definitions', category: 'Navigation', path: '/shift-types', icon: Clock, keywords: ['shifts', 'timing', 'hours'] },
    { id: 'nav-rules', title: 'Rules & Constraint Engine', category: 'Navigation', path: '/rules', icon: ShieldAlert, keywords: ['constraints', 'overtime', 'rest'] },
    { id: 'nav-analytics', title: 'Operational Dashboard & Analytics', category: 'Navigation', path: '/analytics', icon: Activity, keywords: ['analytics', 'metrics', 'reports'] },
    { id: 'nav-audit-log', title: 'Audit Trail & Event Logs', category: 'Navigation', path: '/audit-log', icon: FileText, keywords: ['events', 'history', 'logs'] },
    { id: 'nav-import-export', title: 'Data Import / Export Manager', category: 'Navigation', path: '/import-export', icon: FileSpreadsheet, keywords: ['excel', 'csv', 'bulk'] },
    { id: 'nav-users', title: 'User Account Management', category: 'Navigation', path: '/users', icon: UserCog, keywords: ['permissions', 'roles', 'users'] },
    ...(isSuperAdmin
      ? [
          { id: 'nav-orgs', title: 'Organizations Management', category: 'Navigation', path: '/organizations', icon: Building2, keywords: ['tenant', 'companies'] },
          { id: 'nav-status', title: 'System Health & Probes', category: 'Navigation', path: '/system-status', icon: Activity, keywords: ['health', 'database', 'redis'] },
        ]
      : [{ id: 'nav-settings', title: 'Organization Settings', category: 'Navigation', path: '/organization-settings', icon: Sliders, keywords: ['config', 'rules'] }]),

    // Quick Actions
    { id: 'act-theme', title: `Switch Theme to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`, category: 'Actions', icon: theme === 'dark' ? Sun : Moon, action: () => toggleTheme(), keywords: ['theme', 'dark', 'light'] },
  ];

  const filteredCommands = commands.filter(cmd => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    const titleMatch = cmd.title.toLowerCase().includes(q);
    const keywordMatch = cmd.keywords?.some(k => k.toLowerCase().includes(q));
    return titleMatch || keywordMatch;
  });

  const handleSelect = useCallback(
    (cmd: CommandItem) => {
      onClose();
      if (cmd.path) {
        navigate(cmd.path);
      } else if (cmd.action) {
        cmd.action();
      }
    },
    [navigate, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredCommands.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = filteredCommands[selectedIndex];
        if (selected) handleSelect(selected);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, handleSelect, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-start justify-center pt-20 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden text-slate-100 divide-y divide-slate-800/80">
        {/* Search Input Field */}
        <div className="flex items-center gap-3 px-4 py-3.5 bg-slate-950">
          <Search className="w-5 h-5 text-indigo-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search page (e.g., 'schedules', 'workers', 'sandbox')..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          <button onClick={onClose} className="text-slate-500 hover:text-white text-xs px-1.5 py-0.5 border border-slate-800 rounded">
            ESC
          </button>
        </div>

        {/* Command List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No matching commands or pages found.
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={() => handleSelect(cmd)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`px-3.5 py-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                    isSelected ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-indigo-400'}`} />
                    <span className="text-xs font-semibold">{cmd.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded ${isSelected ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-800 text-slate-400'}`}>
                      {cmd.category}
                    </span>
                    <ArrowRight className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-600'}`} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Command Palette Footer */}
        <div className="px-4 py-2 bg-slate-950 text-[10px] text-slate-500 flex items-center justify-between font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span>Enterprise Quick Command</span>
        </div>
      </div>
    </div>
  );
};
