import React, { useState, useEffect } from 'react';
import { Users, Bell, History, Plus, Edit2, Trash2, Mail, Phone, CheckCircle, XCircle } from 'lucide-react';
import { familyService, TrustedContact, HealthAlert } from '../api/family';
import { useAuth } from '../context/AuthContext';
import { authService } from '../api/auth';

export default function FamilyAlerts() {
  const { user, updateUser } = useAuth();
  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', relationship: '', contact_method: 'EMAIL', contact_value: '', status: 'ACTIVE' });

  // Preferences State (using user context)
  const [prefs, setPrefs] = useState({
    notification_email: user?.notification_email === 1,
    notification_sms: user?.notification_sms === 1,
    notification_push: user?.notification_push === 1,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [c, a] = await Promise.all([
        familyService.getContacts(),
        familyService.getAlerts()
      ]);
      setContacts(c);
      setAlerts(a);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await familyService.updateContact(editingId, formData);
      } else {
        await familyService.addContact(formData);
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ name: '', relationship: '', contact_method: 'EMAIL', contact_value: '', status: 'ACTIVE' });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (c: TrustedContact) => {
    setEditingId(c.id);
    setFormData({ name: c.name, relationship: c.relationship, contact_method: c.contact_method, contact_value: c.contact_value, status: c.status });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await familyService.deleteContact(id);
      setConfirmDeleteId(null);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStatus = async (c: TrustedContact) => {
    try {
      await familyService.updateContact(c.id, { ...c, status: c.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE' });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrefChange = async (key: keyof typeof prefs) => {
    const newPrefs = { ...prefs, [key]: !prefs[key] };
    setPrefs(newPrefs);
    try {
      if (user && updateUser) {
        const updated = await authService.updateProfile({
          ...user,
          notification_email: newPrefs.notification_email ? 1 : 0,
          notification_sms: newPrefs.notification_sms ? 1 : 0,
          notification_push: newPrefs.notification_push ? 1 : 0
        });
        updateUser(updated);
      }
    } catch (e) {
      console.error('Failed to update preferences', e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Family & Alerts</h1>
        <p className="mt-1 text-slate-500">Manage trusted contacts and control your health alert preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Trusted Contacts */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-500" />
                Trusted Contacts
              </h2>
              {!showForm && (
                <button 
                  onClick={() => { setEditingId(null); setFormData({ name: '', relationship: '', contact_method: 'EMAIL', contact_value: '', status: 'ACTIVE' }); setShowForm(true); }}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Contact
                </button>
              )}
            </div>

            {showForm && (
              <div className="p-6 border-b border-slate-200 bg-slate-50">
                <form onSubmit={handleSaveContact} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                      <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Relationship</label>
                      <input required type="text" value={formData.relationship} onChange={e => setFormData({...formData, relationship: e.target.value})} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Method</label>
                      <select value={formData.contact_method} onChange={e => setFormData({...formData, contact_method: e.target.value})} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <option value="EMAIL">Email</option>
                        <option value="SMS">SMS / Phone</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Contact Value</label>
                      <input required type="text" value={formData.contact_value} onChange={e => setFormData({...formData, contact_value: e.target.value})} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50">Cancel</button>
                    <button type="submit" className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">Save Contact</button>
                  </div>
                </form>
              </div>
            )}

            <div className="divide-y divide-slate-200">
              {loading ? (
                <div className="p-8 text-center text-slate-500 text-sm">Loading contacts...</div>
              ) : contacts.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">No trusted contacts added yet.</div>
              ) : (
                contacts.map(c => (
                  <div key={c.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${c.status === 'ACTIVE' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                        {c.contact_method === 'EMAIL' ? <Mail className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className={`text-sm font-bold ${c.status === 'ACTIVE' ? 'text-slate-900' : 'text-slate-500'}`}>{c.name}</h4>
                        <p className="text-xs text-slate-500">{c.relationship} • {c.contact_value}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleToggleStatus(c)} className={`text-xs px-2 py-1 rounded-md font-medium ${c.status === 'ACTIVE' ? 'text-emerald-700 bg-emerald-100 hover:bg-emerald-200' : 'text-slate-600 bg-slate-200 hover:bg-slate-300'}`}>
                        {c.status}
                      </button>
                      <button onClick={() => handleEdit(c)} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-indigo-50 transition-colors"><Edit2 className="w-4 h-4" /></button>
                      {confirmDeleteId === c.id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleDelete(c.id)} className="text-[10px] font-bold px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">Yes, delete</button>
                          <button onClick={() => setConfirmDeleteId(null)} className="text-[10px] font-bold px-2 py-1 bg-slate-200 text-slate-600 rounded hover:bg-slate-300">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDeleteId(c.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Alert History */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-500" />
                Alert History
              </h2>
            </div>
            <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-slate-500 text-sm">Loading history...</div>
              ) : alerts.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">No alerts have been generated.</div>
              ) : (
                alerts.map(a => (
                  <div key={a.id} className="p-5 flex gap-4">
                    <div className="mt-0.5">
                      {a.type === 'Important' ? <XCircle className="w-5 h-5 text-rose-500" /> :
                       a.type === 'Attention' ? <Bell className="w-5 h-5 text-amber-500" /> :
                       <CheckCircle className="w-5 h-5 text-blue-500" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{a.message}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">{a.source}</span>
                        <span>{new Date(a.created_at).toLocaleString()}</span>
                        {a.contact_name && <span className="text-indigo-600 font-medium">Shared with: {a.contact_name}</span>}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-500" />
                Preferences
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <p className="text-sm text-slate-600">Control how and when you receive health alerts. Data is never shared without your explicit consent.</p>
              
              <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative flex items-start mt-0.5">
                    <input type="checkbox" checked={prefs.notification_email} onChange={() => handlePrefChange('notification_email')} className="peer sr-only" />
                    <div className="h-5 w-5 rounded border border-slate-300 bg-white peer-checked:bg-indigo-600 peer-checked:border-indigo-600 flex items-center justify-center transition-colors">
                      <CheckCircle className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100" />
                    </div>
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-slate-900">Email Notifications</span>
                    <span className="block text-xs text-slate-500">Receive alerts directly in your inbox.</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative flex items-start mt-0.5">
                    <input type="checkbox" checked={prefs.notification_sms} onChange={() => handlePrefChange('notification_sms')} className="peer sr-only" />
                    <div className="h-5 w-5 rounded border border-slate-300 bg-white peer-checked:bg-indigo-600 peer-checked:border-indigo-600 flex items-center justify-center transition-colors">
                      <CheckCircle className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100" />
                    </div>
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-slate-900">SMS Alerts</span>
                    <span className="block text-xs text-slate-500">Get text messages for Important alerts.</span>
                  </div>
                </label>
                
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative flex items-start mt-0.5">
                    <input type="checkbox" checked={prefs.notification_push} onChange={() => handlePrefChange('notification_push')} className="peer sr-only" />
                    <div className="h-5 w-5 rounded border border-slate-300 bg-white peer-checked:bg-indigo-600 peer-checked:border-indigo-600 flex items-center justify-center transition-colors">
                      <CheckCircle className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100" />
                    </div>
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-slate-900">Push Notifications</span>
                    <span className="block text-xs text-slate-500">Receive alerts within the web browser.</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
