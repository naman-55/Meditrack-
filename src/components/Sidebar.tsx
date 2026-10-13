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
    <div className="h-full flex flex-col bg-white dark:bg-[#000000] border-r border-slate-100 dark:border-[#172536]">
      {/* Logo */}
      <div className="p-6 border-b border-slate-100 dark:border-[#172536] dark:bg-[#000000] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 dark:bg-[#062E2D] dark:border dark:border-[#075E56] flex items-center justify-center shrink-0 shadow-sm">
            <div className="w-4 h-4 border-2 border-white dark:border-[#00D6B0] rounded-sm"></div>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-[#F1F5FB] leading-tight">MediTrack</h1>
        </div>
        <p className="text-[10px] uppercase tracking-widest text-emerald-600 dark:text-[#00D6B0] font-bold mt-2">Health Insights v1.0</p>
      </div>

      {/* Scrollable Area */}
      <div className="flex-1 overflow-y-auto flex flex-col dark:bg-[#000000]">
        {/* Main Nav */}
        <nav className="p-4 space-y-1.5 flex-1 dark:bg-[#000000]">
        <div className="text-[11px] font-semibold text-slate-400 dark:text-[#8297B2] uppercase tracking-wider mb-2 ml-2">Navigation</div>
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all relative border",
              isActive 
                ? "bg-[#E6F7F3] text-[#00A884] border-[#00A884]/20 font-bold shadow-2xs dark:bg-[#062E2D] dark:text-[#00D6B0] dark:border-[#075E56] dark:shadow-sm dark:before:absolute dark:before:left-0 dark:before:top-2.5 dark:before:bottom-2.5 dark:before:w-1 dark:before:bg-[#00D6B0] dark:before:rounded-r" 
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-transparent dark:bg-[#000000] dark:text-[#B4C4D8] dark:hover:bg-[#101820] dark:hover:text-[#F1F5FB]"
            )}
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn("w-5 h-5 shrink-0 transition-colors", isActive ? "text-[#00A884] dark:text-[#00D6B0]" : "dark:text-[#94A9C2]")} />
                <span>{item.name}</span>
              </>
            )}
          </NavLink>
        ))}

        {user?.role === 'ADMIN' && (
          <>
            <div className="pt-6 text-[11px] font-semibold text-slate-400 dark:text-[#8297B2] uppercase tracking-wider mb-2 ml-2">
              Admin
            </div>
            
            {adminItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all relative border",
                  isActive 
                    ? "bg-[#E6F7F3] text-[#00A884] border-[#00A884]/20 font-bold shadow-2xs dark:bg-[#062E2D] dark:text-[#00D6B0] dark:border-[#075E56] dark:shadow-sm dark:before:absolute dark:before:left-0 dark:before:top-2.5 dark:before:bottom-2.5 dark:before:w-1 dark:before:bg-[#00D6B0] dark:before:rounded-r" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-transparent dark:bg-[#000000] dark:text-[#B4C4D8] dark:hover:bg-[#101820] dark:hover:text-[#F1F5FB]"
                )}
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={cn("w-5 h-5 shrink-0 transition-colors", isActive ? "text-[#00A884] dark:text-[#00D6B0]" : "dark:text-[#94A9C2]")} />
                    <span>{item.name}</span>
                  </>
                )}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* Better Health Brighter Tomorrow Card */}
      <div className="p-4 mt-auto dark:bg-[#000000]">
        <div className="bg-gradient-to-br from-emerald-50/80 to-teal-50/50 border border-emerald-100/80 dark:from-[#000000] dark:to-[#000000] dark:bg-[#000000] dark:border-[#172536] rounded-2xl p-3.5 text-center shadow-2xs">
          <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-emerald-100/70 text-[#00A884] dark:bg-[#062E2D] dark:border dark:border-[#075E56] dark:text-[#00D6B0] flex items-center justify-center">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
            </svg>
          </div>
          <p className="text-xs font-bold text-[#071B49] dark:text-[#F1F5FB] leading-tight">Better Health</p>
          <p className="text-[11px] font-semibold text-[#00A884] dark:text-[#00D6B0] leading-tight mt-1">Brighter Tomorrow.</p>
        </div>
      </div>
      </div>

      <div className="p-4 border-t border-slate-100 dark:border-[#172536] dark:bg-[#000000] shrink-0">
        <NavLink to="/profile" onClick={onClose} className={({ isActive }) => cn(
          "flex items-center gap-3 p-2.5 rounded-xl transition-colors border",
          isActive 
            ? "bg-emerald-50 border-emerald-100 dark:bg-[#062E2D] dark:border-[#075E56]" 
            : "bg-slate-50 hover:bg-slate-100 border-transparent dark:bg-[#000000] dark:hover:bg-[#101820] dark:border-[#172536]"
        )}>
          <div className="w-8 h-8 rounded-full bg-emerald-600 dark:bg-[#00D6B0] dark:text-[#000000] flex-shrink-0 flex items-center justify-center text-white font-medium text-sm">
             {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-bold truncate text-slate-700 dark:text-[#F1F5FB]">{user?.name || 'User'}</p>
            <p className="text-[10px] text-slate-500 dark:text-[#8297B2] truncate">{user?.role === 'ADMIN' ? 'System Administrator' : 'Patient'}</p>
          </div>
        </NavLink>
      </div>
    </div>
  );
}
