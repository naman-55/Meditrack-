import React, { useState, useEffect } from 'react';
import { adminService } from '../../api/admin';
import { User } from '../../api/auth';
import { UsersRound, Search, Shield, Ban, CheckCircle } from 'lucide-react';
import { Skeleton } from '../../components/common/Skeleton';

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await adminService.getUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleStatus = async (user: User) => {
    const newStatus = user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    if (confirm(`Are you sure you want to ${newStatus.toLowerCase()} user ${user.email}?`)) {
      try {
        await adminService.updateUserStatus(user.id, newStatus);
        fetchUsers();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <UsersRound className="w-6 h-6 text-indigo-600" />
            User Management
          </h1>
          <p className="mt-1 text-slate-500 text-sm">View, search, and manage system users.</p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search users..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4">
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-32 rounded" />
                        <Skeleton className="h-3 w-44 rounded" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-6 w-16 rounded-md" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-6 w-20 rounded-md" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Skeleton className="h-7 w-24 rounded-lg ml-auto" />
                    </td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No users found.</td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 text-sm">{user.name || 'Unnamed User'}</span>
                        <span className="text-xs text-slate-500">{user.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                        {user.role === 'ADMIN' && <Shield className="w-3 h-3 mr-1" />}
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ${user.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {user.status === 'ACTIVE' ? <CheckCircle className="w-3 h-3 mr-1" /> : <Ban className="w-3 h-3 mr-1" />}
                        {user.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {user.role !== 'ADMIN' && (
                        <button 
                          onClick={() => toggleStatus(user)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${user.status === 'ACTIVE' ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                        >
                          {user.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
