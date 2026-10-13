import React, { useEffect, useState } from 'react';
import { Users, Bell, History, Plus, Edit2, Trash2, Mail, Phone, CheckCircle, XCircle, RefreshCw, AlertCircle, ShieldCheck } from 'lucide-react';
import { familyService, TrustedContact, HealthAlert } from '../api/family';
import { useAuth } from '../context/AuthContext';
import { authService } from '../api/auth';

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
  if (alert.delivery_channel === 'IN_APP' || alert.status === 'RECORDED') return 'Recorded in MediTrack';
  if (alert.status === 'DELIVERED') return 'Delivery unverified';
  return alert.status || 'Status unavailable';
}

function formatAlertDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleString();
}

export default function FamilyAlerts() {
  const { updateUser } = useAuth();
  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [contactsError, setContactsError] = useState('');
  const [alertsError, setAlertsError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ContactForm>(EMPTY_CONTACT);
  const [formErrors, setFormErrors] = useState<Partial<Record<ContactField, string>>>({});
  const [formError, setFormError] = useState('');
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [savingContactId, setSavingContactId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TrustedContact | null>(null);
  const [isDeletingContact, setIsDeletingContact] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackIsError, setFeedbackIsError] = useState(false);

  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [prefsError, setPrefsError] = useState('');
  const [savingPreference, setSavingPreference] = useState<PreferenceKey | null>(null);

  useEffect(() => {
    void loadContacts();
    void loadAlerts();
    void loadPreferences();
  }, []);

  const loadContacts = async () => {
    setContactsLoading(true);
    setContactsError('');
    try {
      const saved = await familyService.getContacts();
      setContacts(Array.isArray(saved) ? saved : []);
    } catch {
      setContactsError('Unable to load trusted contacts. Please try again.');
    } finally {
      setContactsLoading(false);
    }
  };

  const loadAlerts = async () => {
    setAlertsLoading(true);
    setAlertsError('');
    try {
      const saved = await familyService.getAlerts();
      setAlerts(Array.isArray(saved) ? saved : []);
    } catch {
      setAlertsError('Unable to load alert history. Please try again.');
    } finally {
      setAlertsLoading(false);
    }
  };

  const loadPreferences = async () => {
    setPrefsLoading(true);
    setPrefsError('');
    try {
      const profile = await authService.getProfile();
      setPrefs({
        notification_email: profile.notification_email === 1,
        notification_sms: profile.notification_sms === 1,
        notification_push: profile.notification_push === 1
      });
      updateUser(profile);
    } catch {
      setPrefsError('Unable to load your notification preferences. Please try again.');
    } finally {
      setPrefsLoading(false);
    }
  };

  const resetContactForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(EMPTY_CONTACT);
    setFormErrors({});
    setFormError('');
  };

  const openNewContactForm = () => {
    setEditingId(null);
    setFormData(EMPTY_CONTACT);
    setFormErrors({});
    setFormError('');
    setShowForm(true);
  };

  const handleSaveContact = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSavingContact) return;
    const errors = validateContact(formData);
    setFormErrors(errors);
    setFormError('');
    if (Object.keys(errors).length > 0) return;

    setIsSavingContact(true);
    setFeedback('');
    setFeedbackIsError(false);
    const payload: ContactForm = {
      ...formData,
      name: formData.name.trim(),
      relationship: formData.relationship.trim(),
      contact_value: formData.contact_method === 'EMAIL'
        ? formData.contact_value.trim().toLowerCase()
        : formData.contact_value.trim()
    };
    try {
      if (editingId !== null) {
        const saved = await familyService.updateContact(editingId, payload);
        setContacts(current => current.map(contact => contact.id === saved.id ? saved : contact));
        setFeedback('Trusted contact updated.');
      } else {
        const saved = await familyService.addContact(payload);
        setContacts(current => [saved, ...current.filter(contact => contact.id !== saved.id)]);
        setFeedback('Trusted contact added.');
      }
      resetContactForm();
    } catch (error: any) {
      setFormError(error?.message || 'Unable to save this contact. Please try again.');
      setFeedbackIsError(true);
    } finally {
      setIsSavingContact(false);
    }
  };

  const handleEdit = (contact: TrustedContact) => {
    setEditingId(contact.id);
    setFormData({
      name: contact.name,
      relationship: contact.relationship,
      contact_method: contact.contact_method === 'EMAIL' ? 'EMAIL' : 'SMS',
      contact_value: contact.contact_value,
      status: contact.status === 'ACTIVE' ? 'ACTIVE' : 'DISABLED'
    });
    setFormErrors({});
    setFormError('');
    setShowForm(true);
  };

  const handleDeleteContact = async () => {
    if (!deleteTarget || isDeletingContact) return;
    setIsDeletingContact(true);
    setFeedback('');
    setFeedbackIsError(false);
    try {
      const result = await familyService.deleteContact(deleteTarget.id);
      setContacts(current => current.map(contact => contact.id === result.contact.id ? result.contact : contact));
      setFeedback(`${deleteTarget.name} was deactivated. Existing alert history is retained.`);
      setDeleteTarget(null);
    } catch (error: any) {
      setFeedback(error?.message || 'Unable to deactivate this contact. Please try again.');
      setFeedbackIsError(true);
    } finally {
      setIsDeletingContact(false);
    }
  };

  const handleToggleStatus = async (contact: TrustedContact) => {
    if (savingContactId !== null) return;
    setSavingContactId(contact.id);
    setFeedback('');
    setFeedbackIsError(false);
    try {
      const nextStatus = contact.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
      const saved = await familyService.updateContact(contact.id, { status: nextStatus });
      setContacts(current => current.map(item => item.id === saved.id ? saved : item));
      setFeedback(`${contact.name} is now ${saved.status === 'ACTIVE' ? 'active' : 'inactive'}.`);
    } catch (error: any) {
      setFeedback(error?.message || 'Unable to update contact status. Please try again.');
      setFeedbackIsError(true);
    } finally {
      setSavingContactId(null);
    }
  };

  const handlePreferenceChange = async (key: PreferenceKey) => {
    if (!prefs || savingPreference) return;
    const previousPrefs = prefs;
    const nextValue = !previousPrefs[key];
    const nextPrefs = { ...previousPrefs, [key]: nextValue };
    setPrefs(nextPrefs);
    setPrefsError('');
    setSavingPreference(key);
    try {
      const savedProfile = await authService.updateProfile({ [key]: nextValue ? 1 : 0 });
      const savedPrefs = {
        notification_email: savedProfile.notification_email === 1,
        notification_sms: savedProfile.notification_sms === 1,
        notification_push: savedProfile.notification_push === 1
      };
      setPrefs(savedPrefs);
      updateUser(savedProfile);
    } catch (error: any) {
      setPrefs(previousPrefs);
      setPrefsError(error?.message || 'Could not save this preference. Your previous setting was restored.');
    } finally {
      setSavingPreference(null);
    }
  };

  const renderContactFieldError = (field: ContactField) => formErrors[field]
    ? <p className="mt-1 text-xs text-rose-600">{formErrors[field]}</p>
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Family &amp; Alerts</h1>
        <p className="mt-1 text-slate-500">Manage trusted contacts and control your health alert preferences.</p>
      </div>

      {feedback && (
        <div role={feedbackIsError ? 'alert' : 'status'} className={`flex items-start gap-2 rounded-lg border bg-white px-4 py-3 text-sm ${feedbackIsError ? 'border-rose-200 text-rose-700' : 'border-slate-200 text-slate-700'}`}>
          {feedbackIsError ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" /> : <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />}
          <span>{feedback}</span>
          <button type="button" onClick={() => setFeedback('')} className="ml-auto text-slate-400 hover:text-slate-700" aria-label="Dismiss message">×</button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-8">
        <div className="space-y-6 lg:col-span-2 lg:space-y-8">
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/50 px-5 py-4 sm:px-6 sm:py-5">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                <Users className="h-5 w-5 text-indigo-500" /> Trusted Contacts
              </h2>
              {!showForm && (
                <button type="button" onClick={openNewContactForm} className="inline-flex shrink-0 items-center rounded-md bg-indigo-600 px-3 py-2 text-xs font-medium text-white shadow-sm hover:bg-indigo-700">
                  <Plus className="mr-1 h-4 w-4" /> Add Contact
                </button>
              )}
            </div>

            {showForm && (
              <div className="border-b border-slate-200 bg-slate-50 p-5 sm:p-6">
                <form onSubmit={handleSaveContact} noValidate className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-800">{editingId === null ? 'Add trusted contact' : 'Edit trusted contact'}</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="contact-name" className="mb-1 block text-sm font-medium text-slate-700">Full Name</label>
                      <input id="contact-name" autoComplete="name" maxLength={100} value={formData.name} aria-invalid={!!formErrors.name} onChange={event => setFormData(current => ({ ...current, name: event.target.value }))} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      {renderContactFieldError('name')}
                    </div>
                    <div>
                      <label htmlFor="contact-relationship" className="mb-1 block text-sm font-medium text-slate-700">Relationship</label>
                      <input id="contact-relationship" maxLength={80} value={formData.relationship} aria-invalid={!!formErrors.relationship} onChange={event => setFormData(current => ({ ...current, relationship: event.target.value }))} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      {renderContactFieldError('relationship')}
                    </div>
                    <div>
                      <label htmlFor="contact-method" className="mb-1 block text-sm font-medium text-slate-700">Contact method</label>
                      <select id="contact-method" value={formData.contact_method} onChange={event => setFormData(current => ({ ...current, contact_method: event.target.value }))} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <option value="EMAIL">Email</option>
                        <option value="SMS">SMS / Phone</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="contact-value" className="mb-1 block text-sm font-medium text-slate-700">{formData.contact_method === 'EMAIL' ? 'Email Address' : 'Phone Number'}</label>
                      <input id="contact-value" type={formData.contact_method === 'EMAIL' ? 'email' : 'tel'} autoComplete={formData.contact_method === 'EMAIL' ? 'email' : 'tel'} maxLength={254} value={formData.contact_value} aria-invalid={!!formErrors.contact_value} onChange={event => setFormData(current => ({ ...current, contact_value: event.target.value }))} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      {renderContactFieldError('contact_value')}
                    </div>
                    {editingId !== null && (
                      <div className="sm:col-span-2">
                        <label htmlFor="contact-status" className="mb-1 block text-sm font-medium text-slate-700">Contact status</label>
                        <select id="contact-status" value={formData.status} onChange={event => setFormData(current => ({ ...current, status: event.target.value }))} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:max-w-xs">
                          <option value="ACTIVE">Active</option>
                          <option value="DISABLED">Inactive</option>
                        </select>
                      </div>
                    )}
                  </div>
                  {formError && <p role="alert" className="text-sm text-rose-700">{formError}</p>}
                  <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                    <button type="button" onClick={resetContactForm} disabled={isSavingContact} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancel</button>
                    <button type="submit" disabled={isSavingContact} className="inline-flex items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60">
                      {isSavingContact && <RefreshCw className="h-4 w-4 animate-spin" />}
                      {isSavingContact ? 'Saving…' : editingId === null ? 'Save Contact' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="divide-y divide-slate-200">
              {contactsLoading ? (
                <div className="space-y-3 p-5 sm:p-6" aria-label="Loading contacts">
                  {[1, 2].map(item => <div key={item} className="h-14 animate-pulse rounded-lg bg-slate-100" />)}
                </div>
              ) : contactsError ? (
                <div className="flex flex-col items-start gap-3 p-6 text-sm text-rose-700 sm:flex-row sm:items-center">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{contactsError}</span>
                  <button type="button" onClick={() => void loadContacts()} className="font-semibold underline sm:ml-auto">Retry</button>
                </div>
              ) : contacts.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">No trusted contacts added yet.</div>
              ) : contacts.map(contact => {
                const active = contact.status === 'ACTIVE';
                const isPhone = contact.contact_method !== 'EMAIL';
                return (
                  <div key={contact.id} className="flex flex-col gap-4 p-5 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${active ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                        {isPhone ? <Phone className="h-5 w-5" /> : <Mail className="h-5 w-5" />}
                      </div>
                      <div className="min-w-0">
                        <h3 className={`truncate text-sm font-bold ${active ? 'text-slate-900' : 'text-slate-500'}`}>{contact.name}</h3>
                        <p className="break-all text-xs text-slate-500">{contact.relationship} <span aria-hidden="true">·</span> {contact.contact_value}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pl-14 sm:pl-0">
                      <button type="button" onClick={() => void handleToggleStatus(contact)} disabled={savingContactId !== null} className={`rounded-md px-2 py-1 text-xs font-medium disabled:opacity-50 ${active ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`} aria-label={`Set ${contact.name} ${active ? 'inactive' : 'active'}`}>
                        {savingContactId === contact.id ? 'Saving…' : active ? 'Active' : 'Inactive'}
                      </button>
                      <button type="button" onClick={() => handleEdit(contact)} className="rounded-md p-2 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600" aria-label={`Edit ${contact.name}`}><Edit2 className="h-4 w-4" /></button>
                      <button type="button" onClick={() => setDeleteTarget(contact)} className="rounded-md p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600" aria-label={`Deactivate ${contact.name}`}><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50/50 px-5 py-4 sm:px-6 sm:py-5">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800"><History className="h-5 w-5 text-emerald-500" /> Alert History</h2>
            </div>
            <div className="max-h-[400px] divide-y divide-slate-100 overflow-y-auto">
              {alertsLoading ? (
                <div className="space-y-3 p-5 sm:p-6" aria-label="Loading alert history">
                  {[1, 2].map(item => <div key={item} className="h-16 animate-pulse rounded-lg bg-slate-100" />)}
                </div>
              ) : alertsError ? (
                <div className="flex flex-col items-start gap-3 p-6 text-sm text-rose-700 sm:flex-row sm:items-center">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{alertsError}</span>
                  <button type="button" onClick={() => void loadAlerts()} className="font-semibold underline sm:ml-auto">Retry</button>
                </div>
              ) : alerts.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">No alerts have been generated.</div>
              ) : alerts.map(alert => (
                <article key={alert.id} className="flex gap-4 p-5">
                  <div className="mt-0.5 shrink-0">
                    {alert.type?.toLowerCase().includes('critical') || alert.type?.toLowerCase().includes('important')
                      ? <XCircle className="h-5 w-5 text-rose-500" />
                      : alert.type?.toLowerCase().includes('attention')
                        ? <Bell className="h-5 w-5 text-amber-500" />
                        : <CheckCircle className="h-5 w-5 text-blue-500" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-slate-800">{getAlertTitle(alert)}</h3>
                    <p className="mt-1 break-words text-sm text-slate-600">{alert.message}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span>{formatAlertDate(alert.created_at)}</span>
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-600">{alert.delivery_channel === 'IN_APP' ? 'In-app' : alert.delivery_channel || 'Channel unavailable'}</span>
                      <span className="font-medium">{getAlertStatus(alert)}</span>
                      {alert.is_read !== undefined && <span>{alert.is_read ? 'Read' : 'Unread'}</span>}
                      {alert.source && <span>Source: {alert.source}</span>}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-6 lg:col-span-1">
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50/50 px-5 py-4 sm:px-6 sm:py-5">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800"><Bell className="h-5 w-5 text-amber-500" /> Preferences</h2>
            </div>
            <div className="space-y-5 p-5 sm:p-6">
              <p className="text-sm text-slate-600">Choose which notification channels you prefer. These settings are saved to your account.</p>

              {prefsLoading ? (
                <div className="space-y-4" aria-label="Loading notification preferences">
                  {[1, 2, 3].map(item => <div key={item} className="h-12 animate-pulse rounded-lg bg-slate-100" />)}
                </div>
              ) : prefsError && !prefs ? (
                <div className="space-y-3 rounded-lg border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
                  <p>{prefsError}</p>
                  <button type="button" onClick={() => void loadPreferences()} className="font-semibold underline">Retry</button>
                </div>
              ) : prefs && (
                <div className="space-y-5">
                  {PREFERENCE_OPTIONS.map(([key, title, description]) => (
                    <label key={key} className={`flex items-start gap-3 ${savingPreference ? 'cursor-wait opacity-70' : 'cursor-pointer'}`}>
                      <span className="relative mt-0.5 flex shrink-0 items-start">
                        <input type="checkbox" checked={prefs[key]} disabled={savingPreference !== null} onChange={() => void handlePreferenceChange(key)} className="peer sr-only" />
                        <span className="flex h-5 w-5 items-center justify-center rounded border border-slate-300 bg-white transition-colors peer-checked:border-indigo-600 peer-checked:bg-indigo-600 peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-500 peer-focus-visible:ring-offset-2">
                          <CheckCircle className="h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100" />
                        </span>
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-slate-900">{title}{savingPreference === key && <span className="ml-2 text-xs font-normal text-slate-500">Saving…</span>}</span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">{description}</span>
                      </span>
                    </label>
                  ))}
                  {prefsError && <p role="alert" className="text-sm text-rose-700">{prefsError}</p>}
                  <div className="flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                    <p>Preferences do not confirm delivery. No email, SMS, or browser push provider is configured in this app.</p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </aside>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget && !isDeletingContact) setDeleteTarget(null); }}>
          <div role="alertdialog" aria-modal="true" aria-labelledby="deactivate-contact-title" aria-describedby="deactivate-contact-description" className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 id="deactivate-contact-title" className="text-lg font-semibold text-slate-900">Deactivate trusted contact?</h2>
            <p id="deactivate-contact-description" className="mt-2 text-sm leading-relaxed text-slate-600">{deleteTarget.name} will be marked inactive and may no longer be eligible for future notifications. Existing alert history will be retained.</p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setDeleteTarget(null)} disabled={isDeletingContact} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancel</button>
              <button type="button" onClick={() => void handleDeleteContact()} disabled={isDeletingContact} className="inline-flex items-center justify-center gap-2 rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-60">
                {isDeletingContact && <RefreshCw className="h-4 w-4 animate-spin" />}{isDeletingContact ? 'Deactivating…' : 'Deactivate contact'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
