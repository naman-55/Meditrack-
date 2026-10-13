import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  FileText, 
  Activity, 
  TrendingUp, 
  ShieldAlert, 
  LineChart, 
  MapPin, 
  Users, 
  User as UserIcon,
  UsersRound,
  Building2,
  Stethoscope,
  TerminalSquare, ShieldCheck,
  Headset,
  HeartPulse,
  Settings
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  onClose?: () => void;
}

const navItems = [
  { name: 'Dashboard', path: '/', icon: Home },
  { name: 'Reports', path: '/reports', icon: FileText },
  { name: 'Timeline', path: '/timeline', icon: Activity },
  { name: 'Trends', path: '/trends', icon: TrendingUp },
  { name: 'Risk Assessment', path: '/risk-assessment', icon: ShieldAlert },
  { name: 'Future Outlook', path: '/future-outlook', icon: LineChart },
  { name: 'Care Near Me', path: '/care-near-me', icon: MapPin },
  { name: 'Specialty Guidance', path: '/specialty-guidance', icon: Stethoscope },
  { name: 'Family & Alerts', path: '/family-alerts', icon: Users },
  { name: 'Settings', path: '/settings', icon: Settings },
];

const adminItems = [
  { name: 'Users', path: '/admin/users', icon: UsersRound },
  { name: 'Hospitals', path: '/admin/hospitals', icon: Building2 },
  { name: 'Specialties', path: '/admin/specialties', icon: Stethoscope },
  { name: 'System Logs', path: '/admin/system-logs', icon: TerminalSquare },
  { name: 'Validation', path: '/admin/software-validation', icon: ShieldCheck },
];

export default function Sidebar({ onClose }: SidebarProps) {
  const { user } = useAuth();
  
  return (
    <div className="h-full flex flex-col bg-white">
      {/* Logo */}
      <div className="p-6 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
            <div className="w-4 h-4 border-2 border-white rounded-sm"></div>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 leading-tight">MediTrack</h1>
        </div>
        <p className="text-[10px] uppercase tracking-widest text-emerald-600 font-bold mt-2">Health Insights v1.0</p>
      </div>

      {/* Scrollable Area */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        {/* Main Nav */}
        <nav className="p-4 space-y-1 flex-1">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 ml-2">Navigation</div>
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all",
              isActive 
                ? "bg-[#E6F7F3] text-[#00A884] shadow-2xs font-bold" 
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.name}
          </NavLink>
        ))}

        {user?.role === 'ADMIN' && (
          <>
            <div className="pt-6 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 ml-2">
              Admin
            </div>
            
            {adminItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all",
                  isActive 
                    ? "bg-[#E6F7F3] text-[#00A884] shadow-2xs font-bold" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* Better Health Brighter Tomorrow Card */}
      <div className="p-4 mt-auto">
        <div className="bg-gradient-to-br from-emerald-50/80 to-teal-50/50 border border-emerald-100/80 rounded-2xl p-3.5 text-center shadow-2xs">
          <div className="w-10 h-10 mx-auto mb-1.5 rounded-xl bg-emerald-100/70 text-[#00A884] flex items-center justify-center">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
            </svg>
          </div>
          <p className="text-xs font-bold text-[#071B49] leading-tight">Better Health</p>
          <p className="text-[11px] font-semibold text-[#00A884] leading-tight mt-0.5">Brighter Tomorrow</p>
        </div>
      </div>
      </div>

      <div className="p-4 border-t border-slate-100 shrink-0">
        <NavLink to="/profile" onClick={onClose} className={({ isActive }) => cn(
          "flex items-center gap-3 p-2 rounded-lg transition-colors",
          isActive ? "bg-emerald-50 border border-emerald-100" : "bg-slate-50 hover:bg-slate-100 border border-transparent"
        )}>
          <div className="w-8 h-8 rounded-full bg-emerald-600 flex-shrink-0 flex items-center justify-center text-white font-medium text-sm">
             {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-bold truncate text-slate-700">{user?.name || 'User'}</p>
            <p className="text-[10px] text-slate-500 truncate">{user?.role === 'ADMIN' ? 'System Administrator' : 'Patient'}</p>
          </div>
        </NavLink>
      </div>
    </div>
  );
}
