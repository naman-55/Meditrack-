import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Bell, 
  History, 
  Plus, 
  Edit2, 
  Trash2, 
  Mail, 
  Phone, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  ShieldAlert, 
  ExternalLink,
  Send,
  Info,
  Clock,
  RefreshCw,
  Eye,
  Check,
  AlertCircle
} from 'lucide-react';
import { familyService, TrustedContact, HealthAlert, NotificationDelivery } from '../api/family';
import { useAuth } from '../context/AuthContext';
import { AlertListSkeleton, TrustedContactSkeleton } from '../components/common/Skeleton';
import { authService } from '../api/auth';
import { useAlertNotifications } from '../context/AlertNotificationContext';
import { useNavigate } from 'react-router-dom';

type ContactForm = Pick<TrustedContact, 'name' | 'relationship' | 'contact_method' | 'contact_value' | 'status'>;
type ContactField = keyof ContactForm;
type PreferenceKey = 'notification_email' | 'notification_sms' | 'notification_push';
type NotificationPreferences = Record<PreferenceKey, boolean>;

const EMPTY_CONTACT: ContactForm = {
  name: '', relationship: '', contact_method: 'EMAIL', contact_value: '', status: 'ACTIVE'
};
const PREFERENCE_OPTIONS = [
  ['notification_email', 'Email Notifications', 'Email delivery is not configured; this stores your preference only.'],
  ['notification_sms', 'SMS Alerts', 'SMS delivery is not configured; this stores your preference only.'],
  ['notification_push', 'Push Notifications', 'Browser push is not configured; this stores your preference only.']
] as const;

function validateContact(form: ContactForm): Partial<Record<ContactField, string>> {
  const errors: Partial<Record<ContactField, string>> = {};
  const name = form.name.trim();
  const relationship = form.relationship.trim();
  const value = form.contact_value.trim();

  if (!name) errors.name = 'Enter the contact’s full name.';
  else if (name.length > 100) errors.name = 'Name must be 100 characters or fewer.';
  if (!relationship) errors.relationship = 'Enter the relationship.';
  else if (relationship.length > 80) errors.relationship = 'Relationship must be 80 characters or fewer.';

  if (form.contact_method === 'EMAIL') {
    if (!value) errors.contact_value = 'Enter an email address.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || value.length > 254) errors.contact_value = 'Enter a valid email address.';
  } else {
    const digits = value.replace(/\D/g, '');
    if (!value) errors.contact_value = 'Enter a phone number.';
    else if (!/^\+?[\d\s().-]+$/.test(value) || digits.length < 7 || digits.length > 15) errors.contact_value = 'Enter a valid phone number with 7 to 15 digits.';
  }

  return errors;
}

function getAlertTitle(alert: HealthAlert) {
  if (alert.type === 'REPORT_PROCESSED') return 'Report processing complete';
  return alert.type || 'Health notification';
}

function getAlertStatus(alert: HealthAlert) {
  if ((alert as any).delivery_channel === 'IN_APP' || alert.status === 'RECORDED') return 'Recorded in MediTrack';
  if (alert.status === 'DELIVERED') return 'Delivery unverified';
  return alert.status || 'Status unavailable';
}

function formatAlertDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleString();
}

export default function FamilyAlerts() {
  const { user, updateUser } = useAuth();
  const { refreshAlerts } = useAlertNotifications();
  const navigate = useNavigate();

  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [contactsError, setContactsError] = useState('');
  const [alertsError, setAlertsError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    relationship: 'Family Member', 
    contact_method: 'EMAIL', 
    contact_value: '', 
    status: 'ACTIVE' 
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Filter State
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH_PRIORITY' | 'WARNING' | 'INFORMATIONAL'>('ALL');

  // Test Emergency State
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    alert?: HealthAlert;
    deliveries?: NotificationDelivery[];
    message?: string;
  } | null>(null);

  // Audit Modal State
  const [selectedAuditAlert, setSelectedAuditAlert] = useState<HealthAlert | null>(null);

  const [prefs, setPrefs] = useState<NotificationPreferences>({
    notification_email: true,
    notification_sms: false,
    notification_push: true
  });
  const [prefsLoading, setPrefsLoading] = useState(false);
  const [prefsError, setPrefsError] = useState('');
  const [savingPreference, setSavingPreference] = useState<PreferenceKey | null>(null);

  const loading = contactsLoading || alertsLoading;

  const loadAlerts = async () => {
    setAlertsLoading(true);
    setAlertsError('');
    try {
      const a = await familyService.getAlerts();
      setAlerts(a);
    } catch (err) {
      console.error('Fetch alerts error in FamilyAlerts:', err);
      setAlertsError('Failed to load alerts');
    } finally {
      setAlertsLoading(false);
    }
  };

  const loadPreferences = async () => {
    setPrefsLoading(true);
    setPrefsError('');
    try {
      if (user) {
        setPrefs({
          notification_email: Boolean(user.notification_email ?? true),
          notification_sms: Boolean(user.notification_sms ?? false),
          notification_push: Boolean(user.notification_push ?? true)
        });
      }
    } finally {
      setPrefsLoading(false);
    }
  };

  const loadContacts = async () => {
    setContactsLoading(true);
    setContactsError('');
    try {
      const [c, a] = await Promise.all([
        familyService.getContacts(),
        familyService.getAlerts()
      ]);
      setContacts(c);
      setAlerts(a);
    } catch (err) {
      console.error('Fetch error in FamilyAlerts:', err);
    } finally {
      setContactsLoading(false);
    }
  };

  const fetchData = loadContacts;

  useEffect(() => {
    void loadContacts();
    void loadAlerts();
    void loadPreferences();
  }, []);

  const resetContactForm = () => {
    setFormData({ name: '', relationship: 'Family Member', contact_method: 'EMAIL', contact_value: '', status: 'ACTIVE' });
    setFormError(null);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validate email or phone
    const val = formData.contact_value.trim();
    if (formData.contact_method === 'EMAIL') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(val)) {
        setFormError('Please enter a valid email address (e.g. name@example.com).');
        return;
      }
    } else {
      // SMS phone check
      const digitsOnly = val.replace(/[^0-9]/g, '');
      if (digitsOnly.length < 7 || digitsOnly.length > 15) {
        setFormError('Please enter a valid phone number including country code (e.g. +14155552671 or +919876543210).');
        return;
      }
    }

    try {
      if (editingId) {
        await familyService.updateContact(editingId, formData);
      } else {
        await familyService.addContact(formData);
      }
      resetContactForm();
      await loadContacts();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save contact.');
    }
  };

  const handleEdit = (c: TrustedContact) => {
    setEditingId(c.id);
    setFormData({ 
      name: c.name, 
      relationship: c.relationship, 
      contact_method: c.contact_method, 
      contact_value: c.contact_value, 
      status: c.status 
    });
    setFormError(null);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await familyService.deleteContact(id);
      setContacts(prev => prev.filter(c => c.id !== id));
      setConfirmDeleteId(null);
    } catch (err) {
      console.error('Delete contact error:', err);
    }
  };

  const handleToggleStatus = async (c: TrustedContact) => {
    const newStatus = c.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const updated = await familyService.updateContact(c.id, { ...c, status: newStatus });
      setContacts(prev => prev.map(item => item.id === c.id ? updated : item));
    } catch (err) {
      console.error('Toggle status error:', err);
    }
  };

  const handlePrefChange = async (key: PreferenceKey) => {
    if (!prefs) return;
    const newVal = !prefs[key];
    setPrefs(prev => prev ? ({ ...prev, [key]: newVal }) : prev);
    setSavingPreference(key);
    try {
      await authService.updateProfile({ [key]: newVal ? 1 : 0 });
      if (updateUser) {
        updateUser({ [key]: newVal ? 1 : 0 } as any);
      }
    } catch (err) {
      console.error('Update preference error:', err);
    } finally {
      setSavingPreference(null);
    }
  };

  const handleTestEmergency = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      // Pick first active contact if available
      const activeContact = contacts.find(c => c.status === 'ACTIVE');
      const res = await familyService.sendTestEmergencyAlert(activeContact?.id);
      setTestResult({
        success: res.success,
        alert: res.alert,
        deliveries: res.deliveries
      });
      await loadContacts();
      refreshAlerts();
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Test emergency dispatch failed'
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Filtered alerts
  const filteredAlerts = alerts.filter(a => {
    if (severityFilter === 'ALL') return true;
    return (a.severity || 'WARNING') === severityFilter;
  });

  const activeContactsCount = contacts.filter(c => c.status === 'ACTIVE').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <ShieldAlert className="w-7 h-7 text-red-600" />
            <span>Emergency Contacts &amp; Real-Time Risk Alerts</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-[#8297B2]">
            Configure emergency dispatch recipients, inspect delivery statuses, and verify critical notification channels.
          </p>
        </div>

        <button
          onClick={handleTestEmergency}
          disabled={isTesting || activeContactsCount === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl shadow-sm transition-colors shrink-0"
          title="Send a real verification test across configured channels"
        >
          {isTesting ? (
            <>
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span>Dispatching Test...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Test Emergency Dispatch</span>
            </>
          )}
        </button>
      </div>

      {/* Missing Contact Warning Banner if needed */}
      {contacts.length === 0 && !loading && (
        <div className="p-4 bg-amber-50 dark:bg-[#201F1A] border-l-4 border-amber-500 rounded-r-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-[#F5B942] shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 dark:text-[#F5B942] space-y-1">
            <p className="font-bold">No Emergency Contact Configured</p>
            <p className="dark:text-[#D5C28F]">
              In the event that an uploaded laboratory report contains critical or panic-level health measurements, 
              MediTrack cannot notify an emergency contact until you add at least one active recipient with an email or phone number.
            </p>
          </div>
        </div>
      )}

      {/* Test Execution Result Banner */}
      {testResult && (
        <div className={`p-5 rounded-2xl border ${testResult.success ? 'bg-indigo-50/80 dark:bg-[#0B1B30] border-indigo-200 dark:border-[#1F3A55]' : 'bg-red-50/80 dark:bg-[#2A0E14] border-red-200 dark:border-[#5C1D24]'} space-y-3`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle className="w-5 h-5 text-indigo-600 dark:text-[#00D6B0] shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 dark:text-[#FF5368] shrink-0" />
              )}
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                {testResult.success ? '[TEST] Emergency Verification Dispatched' : 'Test Dispatch Failed'}
              </h4>
            </div>
            <button
              onClick={() => setTestResult(null)}
              className="text-slate-400 dark:text-[#8297B2] hover:text-slate-600 dark:hover:text-white text-xs font-bold"
            >
              Dismiss
            </button>
          </div>

          <p className="text-xs text-slate-600 dark:text-[#94A9C2]">
            {testResult.success 
              ? 'A verified test notification was generated and evaluated against your emergency policy. Review channel delivery results below:' 
              : testResult.message}
          </p>

          {testResult.deliveries && testResult.deliveries.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {testResult.deliveries.map((del, i) => {
                const isSent = del.delivery_status === 'SENT' || del.delivery_status === 'DELIVERED';
                return (
                  <div key={i} className="p-3 bg-white dark:bg-[#081729] rounded-xl border border-slate-200 dark:border-[#152A42] text-xs space-y-1 shadow-2xs">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-slate-800 dark:text-white">{del.channel} Dispatch:</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${isSent ? 'bg-emerald-100 dark:bg-[#062E2D] text-emerald-800 dark:text-[#00D6B0]' : 'bg-rose-100 dark:bg-[#2A0E14] text-rose-800 dark:text-[#FF5368]'}`}>
                        {del.delivery_status}
                      </span>
                    </div>
                    <div className="text-slate-500 dark:text-[#8297B2] text-[11px] truncate">Recipient: {del.recipient}</div>
                    {del.provider_message_id && (
                      <div className="text-[10px] text-slate-400 dark:text-[#647A96] font-mono">Provider ID: {del.provider_message_id}</div>
                    )}
                    {del.error_message && (
                      <div className="text-[11px] text-red-700 dark:text-[#FF5368] bg-red-50 dark:bg-[#3D141B] p-1.5 rounded mt-1 font-mono">
                        {del.error_message}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Trusted Contacts & Preferences */}
        <div className="lg:col-span-1 space-y-6">
          {/* Trusted Contacts Card */}
          <div className="bg-white dark:bg-[#081729] rounded-2xl border border-slate-200 dark:border-[#152A42] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-[#152A42] flex justify-between items-center bg-slate-50/70 dark:bg-[#0B1B30]">
              <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Emergency Contacts ({contacts.length})</span>
              </h2>
              {!showForm && (
                <button 
                  onClick={() => { 
                    setEditingId(null); 
                    setFormData({ name: '', relationship: 'Family Member', contact_method: 'EMAIL', contact_value: '', status: 'ACTIVE' }); 
                    setFormError(null);
                    setShowForm(true); 
                  }}
                  className="inline-flex items-center px-2.5 py-1 border border-transparent text-xs font-bold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add
                </button>
              )}
            </div>

            {/* Add / Edit Form */}
            {showForm && (
              <div className="p-4 border-b border-slate-200 dark:border-[#152A42] bg-slate-50 dark:bg-[#0B1B30]">
                <form onSubmit={handleSaveContact} className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-[#B4C4D8] uppercase tracking-wider">
                    {editingId ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
                  </h4>

                  {formError && (
                    <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs">
                      {formError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-[#B4C4D8] mb-1">Full Name</label>
                    <input 
                      required 
                      type="text" 
                      placeholder="e.g. Jane Doe"
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                      className="w-full rounded-lg border border-slate-300 dark:border-[#20364B] px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-[#00D6B0] bg-white dark:bg-[#0A1625] text-slate-900 dark:text-white" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-[#B4C4D8] mb-1">Relationship</label>
                    <select 
                      value={formData.relationship} 
                      onChange={e => setFormData({...formData, relationship: e.target.value})} 
                      className="w-full rounded-lg border border-slate-300 dark:border-[#20364B] px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-[#00D6B0] bg-white dark:bg-[#0A1625] text-slate-900 dark:text-white"
                    >
                      <option value="Spouse">Spouse</option>
                      <option value="Parent">Parent</option>
                      <option value="Child">Child</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Family Member">Family Member</option>
                      <option value="Physician">Physician</option>
                      <option value="Caregiver">Caregiver</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-[#B4C4D8] mb-1">Channel Method</label>
                    <select 
                      value={formData.contact_method} 
                      onChange={e => setFormData({...formData, contact_method: e.target.value})} 
                      className="w-full rounded-lg border border-slate-300 dark:border-[#20364B] px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-[#00D6B0] bg-white dark:bg-[#0A1625] text-slate-900 dark:text-white"
                    >
                      <option value="EMAIL">Email Address</option>
                      <option value="SMS">SMS / Mobile Phone (E.164)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-[#B4C4D8] mb-1">
                      {formData.contact_method === 'EMAIL' ? 'Email Address' : 'Mobile Phone Number'}
                    </label>
                    <input 
                      required 
                      type={formData.contact_method === 'EMAIL' ? 'email' : 'tel'} 
                      placeholder={formData.contact_method === 'EMAIL' ? 'contact@domain.com' : '+14155552671 or +919876543210'}
                      value={formData.contact_value} 
                      onChange={e => setFormData({...formData, contact_value: e.target.value})} 
                      className="w-full rounded-lg border border-slate-300 dark:border-[#20364B] px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-[#00D6B0] bg-white dark:bg-[#0A1625] text-slate-900 dark:text-white" 
                    />
                    <p className="text-[10px] text-slate-400 dark:text-[#647A96] mt-1">
                      {formData.contact_method === 'EMAIL' 
                        ? 'Critical alerts will be sent here in rich clinical format.' 
                        : 'Include country code (+1, +91, +44, etc.) for international SMS delivery.'}
                    </p>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setShowForm(false)} 
                      className="px-3 py-1.5 border border-slate-300 dark:border-[#20364B] text-xs font-medium rounded-lg text-slate-700 dark:text-[#B4C4D8] bg-white dark:bg-[#0A1625] hover:bg-slate-50 dark:hover:bg-[#102238]"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="px-3 py-1.5 border border-transparent text-xs font-bold rounded-lg text-white dark:text-[#050D18] bg-indigo-600 dark:bg-[#00D6B0] hover:bg-indigo-700 dark:hover:bg-[#00A88F]"
                    >
                      Save Contact
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Contact List */}
            <div className="divide-y divide-slate-100 dark:divide-[#152A42] max-h-[350px] overflow-y-auto">
              {loading ? (
                <TrustedContactSkeleton count={3} />
              ) : contacts.length === 0 ? (
                <div className="p-6 text-center text-slate-400 dark:text-[#647A96] text-xs">
                  No emergency contacts added yet. Click &quot;Add&quot; to configure.
                </div>
              ) : (
                contacts.map(c => {
                  const isActive = c.status === 'ACTIVE';
                  return (
                    <div key={c.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#162A3E] transition-colors">
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isActive ? 'bg-indigo-100 dark:bg-[#0B2254] text-indigo-600 dark:text-[#6BA1FF]' : 'bg-slate-100 dark:bg-[#152A42] text-slate-400'}`}>
                          {c.contact_method === 'EMAIL' ? <Mail className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <h4 className={`text-xs font-bold truncate ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-[#647A96]'}`}>
                            {c.name}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-[#8297B2] truncate">
                            {c.relationship} &middot; {c.contact_value}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button 
                          onClick={() => handleToggleStatus(c)} 
                          className={`text-[10px] px-2 py-0.5 rounded font-bold transition-colors ${isActive ? 'text-emerald-700 dark:text-[#00D6B0] bg-emerald-50 dark:bg-[#062E2D] hover:bg-emerald-100 dark:hover:bg-[#0A3D3B]' : 'text-slate-600 dark:text-[#8297B2] bg-slate-100 dark:bg-[#152A42] hover:bg-slate-200 dark:hover:bg-[#1E3B5E]'}`}
                        >
                          {c.status}
                        </button>
                        <button 
                          onClick={() => handleEdit(c)} 
                          className="p-1 text-slate-400 dark:text-[#647A96] hover:text-indigo-600 dark:hover:text-[#00D6B0] rounded hover:bg-slate-100 dark:hover:bg-[#152A42]"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {confirmDeleteId === c.id ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleDelete(c.id)} className="text-[10px] font-bold px-1.5 py-0.5 bg-red-600 text-white rounded">Del</button>
                            <button onClick={() => setConfirmDeleteId(null)} className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-200 dark:bg-[#152A42] text-slate-700 dark:text-[#B4C4D8] rounded">X</button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setConfirmDeleteId(c.id)} 
                            className="p-1 text-slate-400 dark:text-[#647A96] hover:text-red-600 dark:hover:text-[#FF5368] rounded hover:bg-slate-100 dark:hover:bg-[#152A42]"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Preferences Card */}
          <div className="bg-white dark:bg-[#081729] rounded-2xl border border-slate-200 dark:border-[#152A42] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-[#152A42] bg-slate-50/70 dark:bg-[#0B1B30]">
              <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-500" />
                <span>Emergency Alert Preferences</span>
              </h2>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-600 dark:text-[#94A9C2] leading-relaxed">
                Configure which external channels MediTrack uses to dispatch emergency health alerts when critical or urgent biomarkers are identified.
              </p>

              <div className="space-y-3 pt-1">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={Boolean(prefs?.notification_email)} 
                    onChange={() => handlePrefChange('notification_email')} 
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 dark:border-[#20364B] bg-white dark:bg-[#0A1625] text-indigo-600 focus:ring-indigo-500" 
                  />
                  <div>
                    <span className="block font-bold text-slate-900 dark:text-white">Email Emergency Alerts</span>
                    <span className="block text-[11px] text-slate-500 dark:text-[#8297B2]">
                      Dispatches detailed clinical alert emails to active contacts.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={Boolean(prefs?.notification_sms)} 
                    onChange={() => handlePrefChange('notification_sms')} 
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 dark:border-[#20364B] bg-white dark:bg-[#0A1625] text-indigo-600 focus:ring-indigo-500" 
                  />
                  <div>
                    <span className="block font-bold text-slate-900 dark:text-white">SMS Urgent Text Alerts</span>
                    <span className="block text-[11px] text-slate-500 dark:text-[#8297B2]">
                      Sends concise text messages for Critical findings.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={Boolean(prefs?.notification_push)} 
                    onChange={() => handlePrefChange('notification_push')} 
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 dark:border-[#20364B] bg-white dark:bg-[#0A1625] text-indigo-600 focus:ring-indigo-500" 
                  />
                  <div>
                    <span className="block font-bold text-slate-900 dark:text-white">In-App Floating Popups</span>
                    <span className="block text-[11px] text-slate-500 dark:text-[#8297B2]">
                      Displays instant real-time popups while MediTrack is open.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Health Risk Alerts & Notification Center */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-[#081729] rounded-2xl border border-slate-200 dark:border-[#152A42] shadow-sm overflow-hidden">
            {/* Top Toolbar */}
            <div className="p-5 border-b border-slate-200 dark:border-[#152A42] bg-slate-50/70 dark:bg-[#0B1B30] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-indigo-600 dark:text-[#6BA1FF]" />
                  <span>Notification Center &amp; Alert History</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-[#8297B2] mt-0.5">
                  Chronological record of clinical alerts, risk classifications, and external dispatches.
                </p>
              </div>

              {/* Severity Filter Tabs */}
              <div className="flex items-center gap-1 bg-white dark:bg-[#050E1A] p-1 rounded-xl border border-slate-200 dark:border-[#1F3A55] shadow-2xs text-[11px] font-bold">
                {(['ALL', 'CRITICAL', 'HIGH_PRIORITY', 'WARNING', 'INFORMATIONAL'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setSeverityFilter(tab)}
                    className={`px-2.5 py-1 rounded-lg transition-colors ${
                      severityFilter === tab 
                        ? 'bg-indigo-600 dark:bg-[#00D6B0] text-white dark:text-[#050D18]' 
                        : 'text-slate-600 dark:text-[#8297B2] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#102238]'
                    }`}
                  >
                    {tab === 'ALL' ? 'All' : tab === 'HIGH_PRIORITY' ? 'High' : tab === 'CRITICAL' ? 'Critical' : tab === 'WARNING' ? 'Warning' : 'Info'}
                  </button>
                ))}
              </div>
            </div>

            {/* Alert List */}
            <div className="divide-y divide-slate-100 dark:divide-[#152A42]">
              {loading ? (
                <AlertListSkeleton count={4} />
              ) : filteredAlerts.length === 0 ? (
                <div className="p-12 text-center text-slate-400 dark:text-[#647A96] text-sm space-y-1">
                  <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                  <p className="font-bold text-slate-700 dark:text-[#B4C4D8]">No alerts found</p>
                  <p className="text-xs text-slate-400 dark:text-[#647A96]">
                    {severityFilter === 'ALL' 
                      ? 'No clinical risk alerts have been generated for your account.' 
                      : `No ${severityFilter} alerts recorded.`}
                  </p>
                </div>
              ) : (
                filteredAlerts.map(alert => {
                  const sev = alert.severity || 'WARNING';
                  const isCrit = sev === 'CRITICAL';
                  const isHigh = sev === 'HIGH_PRIORITY';
                  const isWarn = sev === 'WARNING';

                  let badgeBg = 'bg-blue-100 dark:bg-[#0E2038] text-blue-800 dark:text-[#6BA1FF] border-blue-200 dark:border-[#1E3B5E]';
                  let iconBg = 'bg-blue-50 dark:bg-[#0B1B30] text-blue-600 dark:text-[#6BA1FF]';
                  let Icon = Info;

                  if (isCrit) {
                    badgeBg = 'bg-red-100 dark:bg-[#2A0E14] text-red-800 dark:text-[#FF5368] border-red-300 dark:border-[#5C1D24] font-black animate-pulse';
                    iconBg = 'bg-red-100 dark:bg-[#2A0E14] text-red-600 dark:text-[#FF5368]';
                    Icon = ShieldAlert;
                  } else if (isHigh) {
                    badgeBg = 'bg-amber-100 dark:bg-[#201F1A] text-amber-800 dark:text-[#F5B942] border-amber-300 dark:border-[#4D3B18]';
                    iconBg = 'bg-amber-100 dark:bg-[#201F1A] text-amber-600 dark:text-[#F5B942]';
                    Icon = AlertTriangle;
                  } else if (isWarn) {
                    badgeBg = 'bg-yellow-100 dark:bg-[#1C2014] text-yellow-800 dark:text-[#E2C332] border-yellow-200 dark:border-[#3D4018]';
                    iconBg = 'bg-yellow-100 dark:bg-[#1C2014] text-yellow-600 dark:text-[#E2C332]';
                    Icon = AlertCircle;
                  }

                  const deliveries = alert.deliveries || [];

                  return (
                    <div key={alert.id} className="p-5 hover:bg-slate-50/70 dark:hover:bg-[#162A3E] transition-colors space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className={`p-2.5 rounded-xl shrink-0 ${iconBg}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${badgeBg}`}>
                                {sev}
                              </span>
                              <span className="text-xs text-slate-400 dark:text-[#647A96]">
                                {new Date(alert.created_at).toLocaleString()}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                              {alert.title || alert.message}
                            </h4>
                          </div>
                        </div>

                        {/* Navigation / Action */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {alert.source_report_id && (
                            <button
                              onClick={() => navigate(`/reports?highlight=${alert.source_report_id}`)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 dark:text-[#00D6B0] dark:hover:text-[#52ffe2] dark:hover:bg-[#062E2D] rounded-lg transition-colors"
                            >
                              <span>Report #{alert.source_report_id}</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Clinical Measurement Strip */}
                      {alert.measured_value && (
                        <div className="bg-slate-50 dark:bg-[#0B1B30] p-2.5 rounded-xl border border-slate-200/70 dark:border-[#1F3A55] flex flex-wrap items-center gap-4 text-xs">
                          <div>
                            <span className="text-slate-500 dark:text-[#8297B2] font-medium">Parameter: </span>
                            <span className="font-bold text-slate-800 dark:text-white">{alert.parameter}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 dark:text-[#8297B2] font-medium">Observed: </span>
                            <span className={`px-2 py-0.5 rounded font-bold ${isCrit ? 'bg-red-100 dark:bg-[#2A0E14] text-red-900 dark:text-[#FF5368]' : isHigh ? 'bg-amber-100 dark:bg-[#201F1A] text-amber-900 dark:text-[#F5B942]' : 'bg-slate-200 dark:bg-[#152A42] text-slate-800 dark:text-[#B4C4D8]'}`}>
                              {alert.measured_value}
                            </span>
                          </div>
                          {alert.reference_range && (
                            <div>
                              <span className="text-slate-500 dark:text-[#8297B2] font-medium">Standard Reference: </span>
                              <span className="text-slate-700 dark:text-[#B4C4D8]">{alert.reference_range}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Alert Message */}
                      <p className="text-xs text-slate-600 dark:text-[#94A9C2] leading-relaxed">
                        {alert.message}
                      </p>

                      {/* External Deliveries Chips */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-[#152A42] text-[11px]">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-slate-400 dark:text-[#647A96] font-medium">Dispatch Status:</span>
                          {deliveries.length === 0 ? (
                            <span className="text-slate-400 dark:text-[#647A96] italic">In-app only (no emergency dispatch triggered)</span>
                          ) : (
                            deliveries.map((del, dIdx) => {
                              const isDelSent = del.delivery_status === 'SENT' || del.delivery_status === 'DELIVERED';
                              return (
                                <span
                                  key={dIdx}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold border ${
                                    isDelSent
                                      ? 'bg-emerald-50 dark:bg-[#062E2D] text-emerald-800 dark:text-[#00D6B0] border-emerald-200 dark:border-[#0E544C]'
                                      : 'bg-rose-50 dark:bg-[#2A0E14] text-rose-800 dark:text-[#FF5368] border-rose-200 dark:border-[#5C1D24]'
                                  }`}
                                >
                                  {del.channel}: {del.delivery_status}
                                </span>
                              );
                            })
                          )}
                        </div>

                        {deliveries.length > 0 && (
                          <button
                            onClick={() => setSelectedAuditAlert(alert)}
                            className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 dark:text-[#00D6B0] dark:hover:text-[#52ffe2] font-semibold"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Audit Trail</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Audit Trail Modal */}
      {selectedAuditAlert && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#081729] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-[#152A42] animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#152A42] pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-indigo-600 dark:text-[#6BA1FF]" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Delivery Audit Records</h3>
              </div>
              <button 
                onClick={() => setSelectedAuditAlert(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs font-bold"
              >
                Close
              </button>
            </div>

            <div className="space-y-1 text-xs">
              <p className="font-bold text-slate-800 dark:text-white">{selectedAuditAlert.title || selectedAuditAlert.message}</p>
              <p className="text-slate-500 dark:text-[#8297B2]">Alert ID: #{selectedAuditAlert.id} &middot; Created: {new Date(selectedAuditAlert.created_at).toLocaleString()}</p>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto">
              {(selectedAuditAlert.deliveries || []).map((d, idx) => (
                <div key={idx} className="p-3 bg-slate-50 dark:bg-[#0B1B30] rounded-xl border border-slate-200 dark:border-[#1F3A55] text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-white">{d.channel} Notification</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      d.delivery_status === 'SENT' || d.delivery_status === 'DELIVERED'
                        ? 'bg-emerald-100 dark:bg-[#062E2D] text-emerald-800 dark:text-[#00D6B0]'
                        : 'bg-rose-100 dark:bg-[#2A0E14] text-rose-800 dark:text-[#FF5368]'
                    }`}>
                      {d.delivery_status}
                    </span>
                  </div>
                  <div className="text-slate-600 dark:text-[#94A9C2] text-[11px]">Recipient: <span className="font-mono">{d.recipient}</span></div>
                  {d.provider_message_id && (
                    <div className="text-slate-500 dark:text-[#647A96] text-[10px] font-mono">Provider SID / Message ID: {d.provider_message_id}</div>
                  )}
                  {d.error_message && (
                    <div className="p-2 bg-red-100/60 dark:bg-[#2A0E14] rounded text-red-800 dark:text-[#FF5368] font-mono text-[10px] break-all">
                      {d.error_message}
                    </div>
                  )}
                  <div className="text-slate-400 dark:text-[#647A96] text-[10px]">Timestamp: {new Date(d.created_at).toLocaleString()}</div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedAuditAlert(null)}
                className="px-4 py-2 bg-slate-900 dark:bg-[#00D6B0] hover:bg-slate-800 dark:hover:bg-[#00A88F] text-white dark:text-[#050D18] text-xs font-bold rounded-xl"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
