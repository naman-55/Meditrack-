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
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              isActive 
                ? "bg-emerald-50 text-emerald-700" 
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
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-emerald-50 text-emerald-700" 
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

      {/* Support Card / User Profile */}
      <div className="p-4 mt-auto">
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-4">
          <h4 className="text-xs font-bold text-slate-800 mb-1">Need Help?</h4>
          <p className="text-[10px] text-slate-500 mb-3 leading-relaxed">Our support team is here to assist you.</p>
          <button className="w-full text-[11px] font-bold text-emerald-700 bg-emerald-100/50 hover:bg-emerald-100 py-2 rounded-lg transition-colors">
            Contact Support
          </button>
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
