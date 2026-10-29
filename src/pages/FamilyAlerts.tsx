import React, { useEffect, useState } from 'react';
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
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  Send,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Info,
  Copy,
  Check,
  MessageSquare,
  Unlink
} from 'lucide-react';
import {
  familyService,
  TrustedContact,
  HealthAlert,
  HealthSummaryPayload,
  NotificationDeliveryRecord
} from '../api/family';
import {
  notificationService,
  NotificationChannelsStatus,
  SendTestPayload,
  TelegramLinkingResponse
} from '../api/notifications';
import { useAuth } from '../context/AuthContext';
import { authService } from '../api/auth';

interface ContactFormData {
  name: string;
  relationship: string;
  email: string;
  phone: string;
  email_enabled: boolean;
  telegram_enabled: boolean;
  status: 'ACTIVE' | 'DISABLED';
  consent_given: boolean;
}

const EMPTY_CONTACT: ContactFormData = {
  name: '',
  relationship: '',
  email: '',
  phone: '',
  email_enabled: true,
  telegram_enabled: true,
  status: 'ACTIVE',
  consent_given: true
};

export default function FamilyAlerts() {
  const { user, updateUser } = useAuth();
  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [channelStatus, setChannelStatus] = useState<NotificationChannelsStatus | null>(null);

  const [contactsLoading, setContactsLoading] = useState(true);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [channelsLoading, setChannelsLoading] = useState(true);

  const [contactsError, setContactsError] = useState('');
  const [alertsError, setAlertsError] = useState('');
  const [channelsError, setChannelsError] = useState('');

  // Contact Form State
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ContactFormData>(EMPTY_CONTACT);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [savingContactId, setSavingContactId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TrustedContact | null>(null);
  const [isDeletingContact, setIsDeletingContact] = useState(false);
  const [deletePermanent, setDeletePermanent] = useState(false);

  // Telegram Linking Modal State
  const [linkingContact, setLinkingContact] = useState<TrustedContact | null>(null);
  const [linkingData, setLinkingData] = useState<TelegramLinkingResponse | null>(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [disconnectingContactId, setDisconnectingContactId] = useState<number | null>(null);

  // Expanded Alert Summary state
  const [expandedAlertId, setExpandedAlertId] = useState<number | null>(null);
  const [acknowledgingId, setAcknowledgingId] = useState<number | null>(null);

  // Preference Toggling
  const [savingPreference, setSavingPreference] = useState<'email' | 'telegram' | null>(null);

  // Test Notification Modal
  const [showTestModal, setShowTestModal] = useState(false);
  const [testPayload, setTestPayload] = useState<SendTestPayload>({ channel: 'EMAIL' });
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    channel: string;
    provider?: string;
    providerMessageId?: string;
    status?: string;
    message: string;
    details?: any;
  } | null>(null);

  const [isConnectingGmail, setIsConnectingGmail] = useState(false);
  const [isDisconnectingGmail, setIsDisconnectingGmail] = useState(false);

  // Notification feedback banner
  const [feedback, setFeedback] = useState('');
  const [feedbackIsError, setFeedbackIsError] = useState(false);

  useEffect(() => {
    // Check for Google OAuth callback parameters
    const params = new URLSearchParams(window.location.search);
    if (params.get('gmail_connected') === 'true') {
      const email = params.get('email');
      setFeedback(`Gmail successfully connected: ${email || 'Authorized Account'}`);
      setFeedbackIsError(false);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get('gmail_error')) {
      setFeedback(params.get('gmail_error') || 'Failed to connect Gmail account');
      setFeedbackIsError(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const alertIdParam = params.get('alertId');
    if (alertIdParam && !isNaN(Number(alertIdParam))) {
      setExpandedAlertId(Number(alertIdParam));
    }

    void loadContacts();
    void loadAlerts();
    void loadChannels();
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

  const loadChannels = async () => {
    setChannelsLoading(true);
    setChannelsError('');
    try {
      const status = await notificationService.getChannelsStatus();
      setChannelStatus(status);
    } catch (err: any) {
      const msg = err?.message || err?.error;
      setChannelsError(typeof msg === 'string' && msg.length > 0 && !msg.startsWith('Unexpected') ? msg : 'Unable to verify delivery channels configuration.');
    } finally {
      setChannelsLoading(false);
    }
  };

  const handleConnectGmail = async () => {
    setIsConnectingGmail(true);
    try {
      const { url } = await notificationService.getGmailAuthUrl();
      window.location.href = url;
    } catch (err: any) {
      setFeedback(err.message || 'Unable to start Google OAuth flow. Check GOOGLE_CLIENT_ID configuration.');
      setFeedbackIsError(true);
      setIsConnectingGmail(false);
    }
  };

  const handleDisconnectGmail = async () => {
    if (!confirm('Are you sure you want to disconnect your Gmail account? Health alerts will not be emailed to trusted contacts until reconnected.')) {
      return;
    }
    setIsDisconnectingGmail(true);
    try {
      await notificationService.disconnectGmail();
      setFeedback('Gmail account successfully disconnected.');
      setFeedbackIsError(false);
      await loadChannels();
    } catch (err: any) {
      setFeedback(err.message || 'Failed to disconnect Gmail');
      setFeedbackIsError(true);
    } finally {
      setIsDisconnectingGmail(false);
    }
  };

  // Telegram Linking Workflow
  const handleOpenTelegramLinkModal = async (contact?: TrustedContact | null) => {
    const target: TrustedContact = contact || ({
      id: 0,
      user_id: user?.id || 0,
      name: user?.name ? `${user.name} (Personal Account)` : 'Personal Account',
      relationship: 'Account Owner',
      email: user?.email || '',
      phone: '',
      email_enabled: 1,
      sms_enabled: 0,
      telegram_enabled: 1,
      consent_status: 'GRANTED',
      status: 'ACTIVE',
      created_at: '',
      updated_at: ''
    } as TrustedContact);

    setLinkingContact(target);
    setLinkingData(null);
    setLinkCopied(false);
    setIsGeneratingLink(true);
    try {
      const data = await notificationService.getTelegramConnectLink(contact ? contact.id : undefined);
      setLinkingData(data);
    } catch (err: any) {
      setFeedback(err.message || 'Unable to generate Telegram connection link.');
      setFeedbackIsError(true);
      setLinkingContact(null);
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleCopyTelegramLink = () => {
    if (!linkingData?.deepLink) return;
    navigator.clipboard.writeText(linkingData.deepLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2500);
  };

  const handleDisconnectTelegramContact = async (contact: TrustedContact) => {
    if (!confirm(`Are you sure you want to disconnect Telegram for ${contact.name}? They will no longer receive Telegram alerts.`)) {
      return;
    }
    setDisconnectingContactId(contact.id);
    try {
      await notificationService.disconnectTelegram(contact.id);
      setFeedback(`Telegram disconnected for ${contact.name}.`);
      setFeedbackIsError(false);
      await loadContacts();
      await loadChannels();
    } catch (err: any) {
      setFeedback(err.message || 'Failed to disconnect Telegram.');
      setFeedbackIsError(true);
    } finally {
      setDisconnectingContactId(null);
    }
  };

  const handleToggleContactTelegram = async (contact: TrustedContact) => {
    const nextVal = contact.telegram_enabled === 1 ? 0 : 1;
    try {
      const saved = await familyService.updateContact(contact.id, {
        telegram_enabled: nextVal
      } as any);
      setContacts(current => current.map(c => (c.id === saved.id ? { ...c, telegram_enabled: nextVal } : c)));
      setFeedback(`Telegram alerts for ${contact.name} are now ${nextVal === 1 ? 'ON' : 'OFF'}.`);
      setFeedbackIsError(false);
    } catch (err: any) {
      setFeedback(err.message || 'Unable to update contact channel.');
      setFeedbackIsError(true);
    }
  };

  const handleToggleContactEmail = async (contact: TrustedContact) => {
    const nextVal = contact.email_enabled === 1 ? 0 : 1;
    try {
      const saved = await familyService.updateContact(contact.id, {
        email_enabled: nextVal
      } as any);
      setContacts(current => current.map(c => (c.id === saved.id ? { ...c, email_enabled: nextVal } : c)));
      setFeedback(`Email alerts for ${contact.name} are now ${nextVal === 1 ? 'ON' : 'OFF'}.`);
      setFeedbackIsError(false);
    } catch (err: any) {
      setFeedback(err.message || 'Unable to update contact channel.');
      setFeedbackIsError(true);
    }
  };

  const resetContactForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(EMPTY_CONTACT);
    setFormErrors({});
  };

  const openNewContactForm = () => {
    setEditingId(null);
    setFormData(EMPTY_CONTACT);
    setFormErrors({});
    setShowForm(true);
  };

  const handleEdit = (contact: TrustedContact) => {
    setEditingId(contact.id);
    const email = contact.email || (contact.contact_method === 'EMAIL' ? contact.contact_value : '');
    const phone = contact.phone || (contact.contact_method === 'SMS' ? contact.contact_value : '');
    setFormData({
      name: contact.name,
      relationship: contact.relationship,
      email: email || '',
      phone: phone || '',
      email_enabled: contact.email_enabled !== 0,
      telegram_enabled: contact.telegram_enabled !== 0,
      status: contact.status === 'ACTIVE' ? 'ACTIVE' : 'DISABLED',
      consent_given: contact.consent_status !== 'REVOKED'
    });
    setFormErrors({});
    setShowForm(true);
  };

  const validateContactForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Full name is required.';
    if (!formData.relationship.trim()) errors.relationship = 'Relationship is required.';

    const email = formData.email.trim();
    const phone = formData.phone.trim();

    if (email && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)) {
      errors.email = 'Enter a valid email address.';
    }

    if (phone) {
      const digits = phone.replace(/\D/g, '');
      if (digits.length < 7 || digits.length > 15) {
        errors.phone = 'Enter a valid phone number (7–15 digits).';
      }
    }

    if (!email && !phone) {
      errors.general = 'Provide at least an email address or contact value.';
    }

    if (formData.email_enabled && !email) {
      errors.email = 'Email required when email alerts are enabled.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveContact = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSavingContact) return;
    if (!validateContactForm()) return;

    setIsSavingContact(true);
    setFeedback('');
    setFeedbackIsError(false);

    const payload: any = {
      name: formData.name.trim(),
      relationship: formData.relationship.trim(),
      email: formData.email.trim() || null,
      phone: formData.phone.trim() || null,
      email_enabled: formData.email_enabled ? 1 : 0,
      telegram_enabled: formData.telegram_enabled ? 1 : 0,
      sms_enabled: 0,
      status: formData.status,
      consent_status: formData.consent_given ? 'GRANTED' : 'REVOKED',
      contact_method: formData.email.trim() ? 'EMAIL' : 'SMS',
      contact_value: formData.email.trim() || formData.phone.trim()
    };

    try {
      if (editingId !== null) {
        const saved = await familyService.updateContact(editingId, payload);
        setContacts(current => current.map(c => (c.id === saved.id ? saved : c)));
        setFeedback('Trusted contact updated successfully.');
      } else {
        const saved = await familyService.addContact(payload);
        setContacts(current => [saved, ...current.filter(c => c.id !== saved.id)]);
        setFeedback('New trusted contact added. Click "Connect Telegram" to link their Telegram chat.');
      }
      resetContactForm();
    } catch (error: any) {
      setFeedback(error?.message || 'Unable to save contact.');
      setFeedbackIsError(true);
    } finally {
      setIsSavingContact(false);
    }
  };

  const handleDeleteContact = async () => {
    if (!deleteTarget || isDeletingContact) return;
    setIsDeletingContact(true);
    setFeedback('');
    setFeedbackIsError(false);
    try {
      await familyService.deleteContact(deleteTarget.id, deletePermanent);
      if (deletePermanent) {
        setContacts(current => current.filter(c => c.id !== deleteTarget.id));
        setFeedback(`${deleteTarget.name} was permanently removed. Existing alert history is preserved.`);
      } else {
        setContacts(current =>
          current.map(c => (c.id === deleteTarget.id ? { ...c, status: 'DISABLED' as const } : c))
        );
        setFeedback(`${deleteTarget.name} was deactivated. Notifications will no longer be sent.`);
      }
      setDeleteTarget(null);
    } catch (error: any) {
      setFeedback(error?.message || 'Unable to delete contact.');
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
      setContacts(current => current.map(item => (item.id === saved.id ? saved : item)));
      setFeedback(`${contact.name} is now ${saved.status === 'ACTIVE' ? 'active' : 'inactive'}.`);
    } catch (error: any) {
      setFeedback(error?.message || 'Unable to update status.');
      setFeedbackIsError(true);
    } finally {
      setSavingContactId(null);
    }
  };

  const handleTogglePreference = async (key: 'notification_email' | 'notification_telegram') => {
    const channelKey = key === 'notification_email' ? 'email' : 'telegram';
    if (savingPreference) return;
    setSavingPreference(channelKey);
    setFeedback('');
    setFeedbackIsError(false);

    const currentValue = user ? (user as any)[key] !== 0 : true;
    const nextValue = currentValue ? 0 : 1;

    try {
      const updatedProfile = await authService.updateProfile({ [key]: nextValue } as any);
      updateUser(updatedProfile);
      await loadChannels();
      setFeedback(`${channelKey.toUpperCase()} notification preference updated.`);
    } catch (error: any) {
      setFeedback(error?.message || 'Could not update preference.');
      setFeedbackIsError(true);
    } finally {
      setSavingPreference(null);
    }
  };

  const handleSendTest = async () => {
    setIsSendingTest(true);
    setTestResult(null);
    try {
      const res = await notificationService.sendTestNotification(testPayload);
      setTestResult({
        success: true,
        channel: res.channel,
        provider: res.provider,
        providerMessageId: res.providerMessageId,
        status: res.status || 'ACCEPTED',
        message: res.message,
        details: res.details
      });
      await loadAlerts();
    } catch (err: any) {
      setTestResult({
        success: false,
        channel: testPayload.channel,
        message: err?.message || 'Test notification failed.'
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleAcknowledgeAlert = async (alertId: number) => {
    setAcknowledgingId(alertId);
    try {
      await familyService.acknowledgeAlert(alertId);
      setAlerts(current =>
        current.map(a =>
          a.id === alertId ? { ...a, acknowledged_at: new Date().toISOString(), acknowledged_by: user?.name || 'User' } : a
        )
      );
    } catch (err: any) {
      setFeedback(err?.message || 'Failed to acknowledge alert.');
      setFeedbackIsError(true);
    } finally {
      setAcknowledgingId(null);
    }
  };

  const parseSummaryJson = (summaryJson?: string | null): HealthSummaryPayload | null => {
    if (!summaryJson) return null;
    try {
      return JSON.parse(summaryJson);
    } catch {
      return null;
    }
  };

  const renderDeliveryBadge = (delivery: NotificationDeliveryRecord) => {
    const isSuccess = delivery.status === 'DELIVERED' || delivery.status === 'SENT' || delivery.status === 'ACCEPTED';
    const isFailed = delivery.status === 'FAILED';

    let colorClass = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    if (isSuccess) colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
    else if (isFailed) colorClass = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800';

    return (
      <span
        key={delivery.id}
        title={`${delivery.destination} (${delivery.provider || 'provider'})${delivery.error_message ? ': ' + delivery.error_message : ''}${delivery.provider_message_id ? ' | Msg ID: ' + delivery.provider_message_id : ''}`}
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorClass}`}
      >
        {delivery.channel === 'EMAIL' && <Mail className="w-3 h-3 text-rose-500" />}
        {delivery.channel === 'TELEGRAM' && <Send className="w-3 h-3 text-sky-500" />}
        {delivery.channel === 'SMS' && <Phone className="w-3 h-3 text-slate-400" />}
        {delivery.channel === 'PUSH' && <Bell className="w-3 h-3 text-amber-500" />}
        <span>{delivery.channel}: {delivery.status}</span>
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Family &amp; Alerts
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Real-time medical notification dispatch via official Gmail and Telegram channels for designated trusted contacts.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void handleOpenTelegramLinkModal(null)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-bold rounded-lg bg-sky-600 hover:bg-sky-700 text-white shadow-sm transition-colors cursor-pointer"
            title="Connect Telegram account to receive real-time health alerts"
          >
            <Send className="w-4 h-4" />
            Connect Telegram
          </button>
          <button
            type="button"
            onClick={() => {
              setTestPayload({ channel: 'EMAIL' });
              setTestResult(null);
              setShowTestModal(true);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Send Test Notification
          </button>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          role={feedbackIsError ? 'alert' : 'status'}
          className={`flex items-start gap-3 rounded-xl border p-4 text-sm transition-all shadow-sm ${
            feedbackIsError
              ? 'border-rose-200 bg-rose-50 text-rose-800 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-200'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-200'
          }`}
        >
          {feedbackIsError ? (
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
          ) : (
            <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
          )}
          <span className="flex-1 font-medium">{feedback}</span>
          <button
            type="button"
            onClick={() => setFeedback('')}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
          >
            &times;
          </button>
        </div>
      )}

      {/* Grid Layout: Main Columns (Contacts + Alert History) & Right Column (Channel Status & Preferences) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (2 cols on LG) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Section 1: Trusted Contacts */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-white">
                <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Trusted Contacts ({contacts.length})
              </h2>
              <button
                type="button"
                onClick={openNewContactForm}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Contact
              </button>
            </div>

            {/* Contact Creation / Edit Form Modal */}
            {showForm && (
              <div className="p-6 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
                  {editingId === null ? 'Add Trusted Contact' : 'Edit Trusted Contact'}
                </h3>
                <form onSubmit={handleSaveContact} className="space-y-4">
                  {formErrors.general && (
                    <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium">
                      {formErrors.general}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData(c => ({ ...c, name: e.target.value }))}
                        placeholder="e.g. Maria Martinez"
                        className="w-full text-sm rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                      {formErrors.name && <p className="text-xs text-rose-600 mt-1">{formErrors.name}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Relationship *
                      </label>
                      <input
                        type="text"
                        value={formData.relationship}
                        onChange={e => setFormData(c => ({ ...c, relationship: e.target.value }))}
                        placeholder="e.g. Spouse, Physician, Sibling"
                        className="w-full text-sm rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                      {formErrors.relationship && <p className="text-xs text-rose-600 mt-1">{formErrors.relationship}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Email Address (for Gmail Alerts)
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData(c => ({ ...c, email: e.target.value }))}
                        placeholder="contact@example.com"
                        className="w-full text-sm rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                      {formErrors.email && <p className="text-xs text-rose-600 mt-1">{formErrors.email}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Phone Number (Optional record)
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={e => setFormData(c => ({ ...c, phone: e.target.value }))}
                        placeholder="+1 (555) 000-0000"
                        className="w-full text-sm rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                      {formErrors.phone && <p className="text-xs text-rose-600 mt-1">{formErrors.phone}</p>}
                    </div>
                  </div>

                  {/* Channel Preferences for Contact */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.email_enabled}
                        onChange={e => setFormData(c => ({ ...c, email_enabled: e.target.checked }))}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                      />
                      <span>Receive Complete Email Summaries (Gmail)</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.telegram_enabled}
                        onChange={e => setFormData(c => ({ ...c, telegram_enabled: e.target.checked }))}
                        className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-4 h-4"
                      />
                      <span>Receive Urgent Telegram Bot Alerts</span>
                    </label>

                    <label className="sm:col-span-2 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={formData.consent_given}
                        onChange={e => setFormData(c => ({ ...c, consent_given: e.target.checked }))}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                      />
                      <span>Authorized contact consent is granted for emergency health alerts</span>
                    </label>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3">
                    <button
                      type="button"
                      onClick={resetContactForm}
                      disabled={isSavingContact}
                      className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingContact}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm disabled:opacity-60 cursor-pointer"
                    >
                      {isSavingContact && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                      {isSavingContact ? 'Saving…' : editingId === null ? 'Save Contact' : 'Update Contact'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Contacts List */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {contactsLoading ? (
                <div className="p-6 space-y-3">
                  {[1, 2].map(i => (
                    <div key={i} className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                  ))}
                </div>
              ) : contactsError ? (
                <div className="p-6 text-sm text-rose-600 dark:text-rose-400 flex items-center justify-between">
                  <span>{contactsError}</span>
                  <button type="button" onClick={() => void loadContacts()} className="font-bold underline cursor-pointer">
                    Retry
                  </button>
                </div>
              ) : contacts.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  No trusted contacts added yet. Click &quot;Add Contact&quot; to designate emergency contacts.
                </div>
              ) : (
                contacts.map(contact => {
                  const isActive = contact.status === 'ACTIVE';
                  const hasEmail = Boolean(contact.email || (contact.contact_method === 'EMAIL' && contact.contact_value));
                  const isTelegramLinked = Boolean(contact.telegram_chat_id);

                  return (
                    <div
                      key={contact.id}
                      className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                          }`}
                        >
                          {contact.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                              {contact.name}
                            </h3>
                            <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {contact.relationship}
                            </span>
                          </div>

                          {/* Contact Delivery Channels Statuses */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-1.5 text-xs">
                            {/* Gmail Email Channel Status */}
                            {hasEmail && (
                              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                <Mail className="w-3.5 h-3.5 text-rose-500" />
                                <span className="truncate max-w-[170px]">{contact.email || contact.contact_value}</span>
                                <button
                                  type="button"
                                  onClick={() => void handleToggleContactEmail(contact)}
                                  className={`px-1.5 py-0.5 rounded text-[11px] font-semibold cursor-pointer ${
                                    contact.email_enabled !== 0
                                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                      : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                                  }`}
                                  title="Toggle Email alerts"
                                >
                                  {contact.email_enabled !== 0 ? 'Email ON' : 'Email OFF'}
                                </button>
                              </div>
                            )}

                            {/* Telegram Bot Channel Status */}
                            <div className="flex items-center gap-1.5">
                              <Send className="w-3.5 h-3.5 text-sky-500" />
                              {isTelegramLinked ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                                    <Check className="w-3 h-3 text-sky-600" />
                                    Linked {contact.telegram_username ? `@${contact.telegram_username}` : `(ID: ${contact.telegram_chat_id})`}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => void handleToggleContactTelegram(contact)}
                                    className={`px-1.5 py-0.5 rounded text-[11px] font-semibold cursor-pointer ${
                                      contact.telegram_enabled !== 0
                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                        : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                                    }`}
                                    title="Toggle Telegram alerts for this contact"
                                  >
                                    {contact.telegram_enabled !== 0 ? 'Telegram ON' : 'Telegram OFF'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void handleDisconnectTelegramContact(contact)}
                                    disabled={disconnectingContactId === contact.id}
                                    className="p-1 rounded text-slate-400 hover:text-rose-600 cursor-pointer"
                                    title="Disconnect Telegram link"
                                  >
                                    <Unlink className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => void handleOpenTelegramLinkModal(contact)}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-sm transition-colors cursor-pointer"
                                  title="Connect Telegram Bot for this contact"
                                >
                                  <Send className="w-3 h-3" />
                                  Connect Telegram
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => void handleToggleStatus(contact)}
                          disabled={savingContactId === contact.id}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-200'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200'
                          }`}
                        >
                          {savingContactId === contact.id ? 'Updating…' : isActive ? 'Active' : 'Inactive'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleEdit(contact)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Edit Contact"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteTarget(contact)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Delete / Deactivate Contact"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Section 2: Consolidated Alert History */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-white">
                <History className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Alert History ({alerts.length})
              </h2>
              <button
                type="button"
                onClick={() => void loadAlerts()}
                disabled={alertsLoading}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${alertsLoading ? 'animate-spin' : ''}`} />
                Refresh History
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {alertsLoading ? (
                <div className="p-6 space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-20 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                  ))}
                </div>
              ) : alertsError ? (
                <div className="p-6 text-sm text-rose-600 dark:text-rose-400 flex items-center justify-between">
                  <span>{alertsError}</span>
                  <button type="button" onClick={() => void loadAlerts()} className="font-bold underline cursor-pointer">
                    Retry
                  </button>
                </div>
              ) : alerts.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  No health alerts recorded yet. Qualifying alerts from laboratory OCR and clinical risk assessment will appear here with delivery details.
                </div>
              ) : (
                alerts.map(alert => {
                  const summary = parseSummaryJson(alert.summary_json);
                  const isExpanded = expandedAlertId === alert.id;

                  const severityColor =
                    alert.severity === 'CRITICAL'
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-900'
                      : alert.severity === 'HIGH'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-900'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900';

                  return (
                    <article key={alert.id} className="p-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${severityColor}`}>
                              {alert.severity || 'MODERATE'}
                            </span>
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                              {alert.title || alert.type}
                            </h3>
                            <span className="text-xs text-slate-400 dark:text-slate-500">
                              • {new Date(alert.created_at).toLocaleString()}
                            </span>
                          </div>

                          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
                            {alert.message}
                          </p>

                          {/* Channel Delivery Statuses */}
                          <div className="flex flex-wrap items-center gap-2 mt-3">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                              Dispatches:
                            </span>
                            {alert.deliveries && alert.deliveries.length > 0 ? (
                              alert.deliveries.map(d => renderDeliveryBadge(d))
                            ) : (
                              <span className="text-xs text-slate-400 italic">In-app record (no external channel dispatched)</span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0 self-start">
                          {summary && (
                            <button
                              type="button"
                              onClick={() => setExpandedAlertId(isExpanded ? null : alert.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                            >
                              <span>{isExpanded ? 'Hide Summary' : 'View Full Summary'}</span>
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          )}

                          {!alert.acknowledged_at ? (
                            <button
                              type="button"
                              onClick={() => void handleAcknowledgeAlert(alert.id)}
                              disabled={acknowledgingId === alert.id}
                              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer"
                            >
                              {acknowledgingId === alert.id ? 'Saving…' : 'Acknowledge'}
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium">
                              Acknowledged
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Expandable Health Summary Details */}
                      {isExpanded && summary && (
                        <div className="mt-5 p-5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Clinical Reason &amp; Assessment
                            </h4>
                            <p className="mt-1 text-sm text-slate-800 dark:text-slate-200 font-medium">
                              {summary.mainReason}
                            </p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              {summary.explanation}
                            </p>
                          </div>

                          {/* Abnormal Findings Table */}
                          {summary.abnormalFindings && summary.abnormalFindings.length > 0 && (
                            <div>
                              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                                Clinically Relevant Findings ({summary.abnormalFindings.length})
                              </h4>
                              <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                                <table className="w-full text-xs text-left">
                                  <thead className="bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300">
                                    <tr>
                                      <th className="p-2.5 font-bold">Biomarker</th>
                                      <th className="p-2.5 font-bold">Measured Value</th>
                                      <th className="p-2.5 font-bold">Standard Reference</th>
                                      <th className="p-2.5 font-bold">Severity</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {summary.abnormalFindings.map((f, idx) => (
                                      <tr key={idx} className="bg-white dark:bg-slate-900">
                                        <td className="p-2.5 font-semibold text-slate-900 dark:text-white">{f.parameter}</td>
                                        <td className="p-2.5 font-bold text-slate-900 dark:text-white">{f.measuredValue} {f.unit}</td>
                                        <td className="p-2.5 text-slate-500">{f.referenceRange || 'Standard'}</td>
                                        <td className="p-2.5">
                                          <span className={`inline-block px-2 py-0.5 rounded font-bold ${
                                            f.status === 'Critical' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                          }`}>
                                            {f.status}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {/* Recommended Actions */}
                          {summary.recommendedActions && summary.recommendedActions.length > 0 && (
                            <div>
                              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                                Recommended Follow-up
                              </h4>
                              <ul className="list-disc list-inside text-xs text-slate-700 dark:text-slate-300 space-y-1">
                                {summary.recommendedActions.map((act, i) => (
                                  <li key={i}>{act}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
                            <strong>Medical Notice:</strong> {summary.disclaimer}
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Channels Configuration & Preferences */}
        <aside className="space-y-6">
          <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Bell className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  Channel Configuration
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Delivery channels and patient notification preferences.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void loadChannels()}
                disabled={channelsLoading}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 shrink-0 ml-2 cursor-pointer"
                title="Refresh channel status"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${channelsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {channelsLoading ? (
              <div className="space-y-4">
                {[1, 2].map(i => (
                  <div key={i} className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                ))}
              </div>
            ) : channelsError ? (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between gap-3">
                <span className="flex-1">{channelsError}</span>
                <button
                  type="button"
                  onClick={() => void loadChannels()}
                  disabled={channelsLoading}
                  className="px-2.5 py-1 rounded bg-rose-100 dark:bg-rose-900/60 font-bold hover:bg-rose-200 dark:hover:bg-rose-900 text-rose-800 dark:text-rose-200 shrink-0 inline-flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${channelsLoading ? 'animate-spin' : ''}`} />
                  Retry
                </button>
              </div>
            ) : channelStatus && (
              <div className="space-y-5">
                
                {/* 1. Gmail Delivery Channel Card (Active Channel) */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
                      <Mail className="w-4 h-4 text-rose-500" />
                      <span>Gmail Delivery (OAuth 2.0)</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={channelStatus.email.userEnabled}
                        disabled={savingPreference === 'email'}
                        onChange={() => void handleTogglePreference('notification_email')}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600" />
                    </label>
                  </div>

                  {channelStatus.email.connected ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/50">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Connected: {channelStatus.email.email}</span>
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Official Google Gmail API (<code>users.me.messages.send</code>) authorized to dispatch canonical health summaries to eligible trusted contacts.
                      </p>

                      {channelStatus.email.lastUsedAt && (
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                          Last active: {new Date(channelStatus.email.lastUsedAt).toLocaleString()}
                        </p>
                      )}

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setTestPayload({ channel: 'EMAIL' });
                            setTestResult(null);
                            setShowTestModal(true);
                          }}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          <Send className="w-3 h-3" />
                          Send Test Email
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDisconnectGmail()}
                          disabled={isDisconnectingGmail}
                          className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {isDisconnectingGmail ? 'Disconnecting…' : 'Disconnect'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="inline-flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900/40">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {channelStatus.email.status === 'EXPIRED' ? 'Authorization Expired' : 'Gmail Not Connected'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                        Connect your personal or clinic Google account to automatically dispatch health summary emails directly through Gmail.
                      </p>

                      {channelStatus.email.missingSetup && channelStatus.email.missingSetup.length > 0 && (
                        <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300">
                          {channelStatus.email.missingSetup[0]}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => void handleConnectGmail()}
                        disabled={isConnectingGmail}
                        className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-sm disabled:opacity-60 cursor-pointer"
                      >
                        {isConnectingGmail ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <ExternalLink className="w-3.5 h-3.5" />
                        )}
                        {isConnectingGmail ? 'Opening Google Login…' : 'Connect Gmail with Google'}
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. Telegram Bot Channel Card (Replaces SMS) */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
                      <Send className="w-4 h-4 text-sky-500" />
                      <span>Telegram Bot Channel</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={channelStatus.telegram.userEnabled}
                        disabled={savingPreference === 'telegram'}
                        onChange={() => void handleTogglePreference('notification_telegram')}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600" />
                    </label>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      {channelStatus.telegram.configured ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-2.5 py-1 rounded-lg border border-sky-200 dark:border-sky-800/50">
                          <CheckCircle className="w-3.5 h-3.5 text-sky-600" />
                          <span>Bot: @{channelStatus.telegram.botUsername || 'MediTrackAlertsBot'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-900/40">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Bot Not Configured</span>
                        </span>
                      )}
                      <span className="text-xs text-slate-500 font-semibold">
                        {channelStatus.telegram.linkedContactsCount} linked contact(s)
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Official Telegram Bot API sends verified urgent medical summaries directly to authorized linked contacts.
                    </p>

                    {channelStatus.telegram.missingSetup && channelStatus.telegram.missingSetup.length > 0 && (
                      <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300">
                        {channelStatus.telegram.missingSetup[0]}
                      </div>
                    )}

                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400">Patient Account:</span>
                        {channelStatus.telegram.userLinked ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800">
                            <Check className="w-3 h-3 text-sky-600" />
                            Linked {channelStatus.telegram.userUsername ? `@${channelStatus.telegram.userUsername}` : ''}
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                            Not Linked
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => void handleOpenTelegramLinkModal(null)}
                        className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-sky-600 hover:bg-sky-700 text-white transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                        title="Generate secure Telegram bot connection link"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Connect Telegram
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTestPayload({ channel: 'TELEGRAM' });
                          setTestResult(null);
                          setShowTestModal(true);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <Send className="w-3 h-3 text-sky-500" />
                        Send Test Telegram
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. SMS Channel Note (Decommissioned Notice) */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 text-xs text-slate-500 dark:text-slate-400 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>SMS Decommissioned:</strong> SMS has been replaced with the official Telegram Bot API for instant, secure delivery without carrier fees or truncation.
                  </span>
                </div>

              </div>
            )}

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                Notifications respect your consent and emergency contact configuration. Real delivery attempts are logged in the database outbox.
              </span>
            </div>
          </section>
        </aside>
      </div>

      {/* Telegram Contact Linking Modal */}
      {linkingContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-sky-500" />
                Connect Telegram for {linkingContact.name}
              </h3>
              <button
                type="button"
                onClick={() => setLinkingContact(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Because Telegram bots cannot initiate unsolicited conversations, <strong>{linkingContact.name}</strong> must open Telegram and start the bot once to authorize health alert delivery.
            </p>

            {isGeneratingLink ? (
              <div className="p-8 text-center space-y-3">
                <RefreshCw className="w-6 h-6 animate-spin text-sky-600 mx-auto" />
                <p className="text-xs text-slate-500">Generating secure single-use linking token…</p>
              </div>
            ) : linkingData ? (
              <div className="space-y-4">
                <div className="p-3.5 bg-sky-50 dark:bg-sky-950/40 rounded-xl border border-sky-200 dark:border-sky-800 space-y-2 text-xs">
                  <p className="font-bold text-sky-900 dark:text-sky-200">
                    Instructions for {linkingContact.name}:
                  </p>
                  <ol className="list-decimal list-inside text-sky-800 dark:text-sky-300 space-y-1">
                    <li>Open the link below on their phone or computer.</li>
                    <li>Telegram will open with <b>@{linkingData.botUsername}</b>.</li>
                    <li>Tap the <b>START</b> button to activate alerts.</li>
                  </ol>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Secure Linking Deep Link (Single-use, 15 min expiry)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={linkingData.deepLink}
                      className="w-full text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 p-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    />
                    <button
                      type="button"
                      onClick={handleCopyTelegramLink}
                      className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 shrink-0 cursor-pointer"
                      title="Copy Link"
                    >
                      {linkCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      <span>{linkCopied ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-slate-400">
                    Expires: {new Date(linkingData.expiresAt).toLocaleTimeString()}
                  </span>
                  <a
                    href={linkingData.deepLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-700 shadow-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open in Telegram
                  </a>
                </div>
              </div>
            ) : null}

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setLinkingContact(null);
                  void loadContacts();
                  void loadChannels();
                }}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Close &amp; Check Connection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Test Notification Modal */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-600" />
                Send Test Notification
              </h3>
              <button
                type="button"
                onClick={() => { setShowTestModal(false); setTestResult(null); }}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Dispatches a verified diagnostic notification through your configured delivery provider. Does not generate fake medical alerts.
            </p>

            {testResult && (
              <div className={`p-3.5 rounded-lg text-xs space-y-2 ${
                testResult.success
                  ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              }`}>
                <div className="flex items-center justify-between font-bold">
                  <span>{testResult.success ? '✓ Provider Accepted' : '✗ Dispatch Failed'}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-current font-mono">
                    {testResult.provider || testResult.channel}
                  </span>
                </div>
                <p className="leading-relaxed">{testResult.message}</p>
                {testResult.providerMessageId && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    Message ID: <b>{testResult.providerMessageId}</b>
                  </p>
                )}
                {!testResult.success && (testResult.status === 'NOT_LINKED' || testResult.message?.includes('not linked')) && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowTestModal(false);
                        const targetContact = testPayload.contactId ? contacts.find(c => c.id === testPayload.contactId) : null;
                        void handleOpenTelegramLinkModal(targetContact);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Connect Telegram Now
                    </button>
                  </div>
                )}
              </div>
            )}

            {(() => {
              const isTg = testPayload.channel === 'TELEGRAM';
              const isTgConfigured = Boolean(channelStatus?.telegram?.configured);
              const selContact = testPayload.contactId ? contacts.find(c => c.id === testPayload.contactId) : null;
              const isUnlinked = isTg && (
                selContact
                  ? !selContact.telegram_chat_id
                  : (!testPayload.destination && !channelStatus?.telegram?.userLinked)
              );
              const isSendDisabled = isSendingTest || (isTg && (!isTgConfigured || isUnlinked));

              return (
                <>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Notification Channel
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setTestPayload(p => ({ ...p, channel: 'EMAIL' }));
                            setTestResult(null);
                          }}
                          className={`p-2.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            testPayload.channel === 'EMAIL'
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                              : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <Mail className="w-4 h-4 text-rose-500" />
                          Gmail API (OAuth)
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setTestPayload(p => ({ ...p, channel: 'TELEGRAM' }));
                            setTestResult(null);
                          }}
                          className={`p-2.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            testPayload.channel === 'TELEGRAM'
                              ? 'border-sky-500 bg-sky-50 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300 ring-2 ring-sky-500/20'
                              : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <Send className="w-4 h-4 text-sky-500" />
                          Telegram Bot API
                        </button>
                      </div>
                    </div>

                    {/* Telegram Bot Not Configured Warning */}
                    {isTg && !isTgConfigured && (
                      <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-800 dark:text-rose-300 space-y-1">
                        <p className="font-bold flex items-center gap-1">
                          <AlertCircle className="w-4 h-4 text-rose-600" />
                          Telegram Bot Not Configured on Server
                        </p>
                        <p>
                          Set <code>TELEGRAM_BOT_TOKEN</code> in your server <code>.env</code> file. Create a bot using <b>@BotFather</b> on Telegram.
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Recipient (Trusted Contact or Direct)
                      </label>
                      <select
                        value={testPayload.contactId || ''}
                        onChange={e => {
                          const cid = e.target.value ? Number(e.target.value) : undefined;
                          setTestPayload(p => ({ ...p, contactId: cid, destination: undefined }));
                          setTestResult(null);
                        }}
                        className="w-full text-sm rounded-lg border border-slate-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        <option value="">
                          My Account ({user?.email || 'Self'}) {isTg ? (channelStatus?.telegram?.userLinked ? `(Telegram: @${channelStatus.telegram.userUsername || 'Linked'})` : '(Telegram: Not Linked)') : ''}
                        </option>
                        {contacts.map(c => {
                          const isLinked = Boolean(c.telegram_chat_id);
                          const labelExtra = isTg
                            ? (isLinked ? `(Telegram: @${c.telegram_username || 'Linked'})` : '(Telegram: Not Linked)')
                            : `(${c.relationship})`;
                          return (
                            <option key={c.id} value={c.id}>
                              {c.name} {labelExtra}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Contact Not Linked Warning with direct Connect Telegram Action */}
                    {isTg && isTgConfigured && selContact && !selContact.telegram_chat_id && (
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg text-xs text-amber-800 dark:text-amber-300 space-y-2">
                        <p className="font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          Contact &quot;{selContact.name}&quot; has not linked their Telegram account yet
                        </p>
                        <p>
                          Telegram bots cannot initiate messages until the contact opens the bot and clicks <b>Start</b> using an authorized connection link.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setShowTestModal(false);
                            void handleOpenTelegramLinkModal(selContact);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Connect Telegram for {selContact.name}
                        </button>
                      </div>
                    )}

                    {/* Personal Account Not Linked Warning */}
                    {isTg && isTgConfigured && !testPayload.contactId && !testPayload.destination && !channelStatus?.telegram?.userLinked && (
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg text-xs text-amber-800 dark:text-amber-300 space-y-2">
                        <p className="font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          Your personal account has not linked Telegram yet
                        </p>
                        <p>
                          Connect your personal Telegram account to receive verified health alerts directly on your phone.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setShowTestModal(false);
                            void handleOpenTelegramLinkModal(null);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Connect My Telegram
                        </button>
                      </div>
                    )}

                    {/* Override destination input */}
                    {!testPayload.contactId && (
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Override Destination (Optional)
                        </label>
                        <input
                          type="text"
                          value={testPayload.destination || ''}
                          onChange={e => {
                            setTestPayload(p => ({ ...p, destination: e.target.value }));
                            setTestResult(null);
                          }}
                          placeholder={testPayload.channel === 'EMAIL' ? 'test@example.com' : 'Telegram Chat ID (e.g. 12345678)'}
                          className="w-full text-sm rounded-lg border border-slate-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => { setShowTestModal(false); setTestResult(null); }}
                      className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleSendTest()}
                      disabled={isSendDisabled}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isSendingTest && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                      {isSendingTest
                        ? `Dispatching via ${isTg ? 'Telegram' : 'Gmail'}…`
                        : isTg && !isTgConfigured
                        ? 'Bot Not Configured'
                        : isTg && isUnlinked
                        ? 'Recipient Not Linked'
                        : `Send Test via ${isTg ? 'Telegram' : 'Gmail'}`}
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          role="presentation"
        >
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Deactivate or Delete {deleteTarget.name}?
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Deactivating will prevent future health notifications while preserving past alert records. Alternatively, you may permanently remove this contact.
            </p>

            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={deletePermanent}
                onChange={e => setDeletePermanent(e.target.checked)}
                className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 w-4 h-4"
              />
              <span className="text-rose-600 dark:text-rose-400 font-semibold">Permanently delete contact</span>
            </label>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeletingContact}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteContact()}
                disabled={isDeletingContact}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isDeletingContact && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                {isDeletingContact ? 'Processing…' : deletePermanent ? 'Delete Permanently' : 'Deactivate Contact'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
