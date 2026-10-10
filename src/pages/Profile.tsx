import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService, User } from '../api/auth';
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  Calendar, 
  Bell, 
  Save, 
  AlertCircle, 
  CheckCircle, 
  Edit3, 
  X, 
  Activity, 
  Droplet, 
  Ruler, 
  Scale, 
  ShieldAlert, 
  PhoneCall, 
  Heart,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Check,
  Camera,
  ShieldCheck,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { 
  calculateAge, 
  formatDobDisplay, 
  calculateBmi, 
  cmToFtIn, 
  ftInToCm, 
  kgToLb, 
  lbToKg, 
  GENDER_OPTIONS, 
  BLOOD_GROUP_OPTIONS, 
  RELATIONSHIP_OPTIONS 
} from '../utils/healthMetrics';

export default function Profile() {
  const { user: authUser, updateUser } = useAuth();
  const [user, setUser] = useState<Partial<User>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Password change modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Unit toggles in View Mode
  const [viewHeightUnit, setViewHeightUnit] = useState<'cm' | 'ft'>('cm');
  const [viewWeightUnit, setViewWeightUnit] = useState<'kg' | 'lb'>('kg');

  // Form State in Edit Mode
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    blood_group: '',
    height_cm: '' as string | number,
    weight_kg: '' as string | number,
    emergency_contact_name: '',
    emergency_contact_relationship: '',
    emergency_contact_phone: '',
    notification_email: 1,
    notification_sms: 0,
    notification_push: 1
  });

  // Unit selectors in Edit Mode
  const [editHeightUnit, setEditHeightUnit] = useState<'cm' | 'ft'>('cm');
  const [editHeightFt, setEditHeightFt] = useState<string>('');
  const [editHeightIn, setEditHeightIn] = useState<string>('');

  const [editWeightUnit, setEditWeightUnit] = useState<'kg' | 'lb'>('kg');
  const [editWeightLb, setEditWeightLb] = useState<string>('');

  // Fetch initial profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await authService.getProfile();
        setUser(data);
        syncFormFromUser(data);
      } catch (err: any) {
        try {
          const fallbackData = await authService.getCurrentUser();
          setUser(fallbackData);
          syncFormFromUser(fallbackData);
        } catch (innerErr: any) {
          setError(innerErr.message || 'Failed to load profile');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Synchronize form from loaded user
  const syncFormFromUser = (u: Partial<User>) => {
    const heightCm = u.height_cm ?? u.heightCm ?? '';
    const weightKg = u.weight_kg ?? u.weightKg ?? '';
    const emContact = u.emergencyContact;
    const emName = emContact?.name || u.emergency_contact_name || '';
    const emRel = emContact?.relationship || u.emergency_contact_relationship || '';
    const emPhone = emContact?.phone || u.emergency_contact_phone || '';

    setFormData({
      name: u.name || u.fullName || '',
      phone: u.phone || '',
      date_of_birth: u.date_of_birth || u.dateOfBirth || '',
      gender: u.gender || '',
      blood_group: u.blood_group || u.bloodGroup || '',
      height_cm: heightCm !== null ? heightCm : '',
      weight_kg: weightKg !== null ? weightKg : '',
      emergency_contact_name: emName,
      emergency_contact_relationship: emRel,
      emergency_contact_phone: emPhone,
      notification_email: u.notification_email !== undefined ? u.notification_email : 1,
      notification_sms: u.notification_sms !== undefined ? u.notification_sms : 0,
      notification_push: u.notification_push !== undefined ? u.notification_push : 1
    });

    if (heightCm) {
      const { feet, inches } = cmToFtIn(Number(heightCm));
      setEditHeightFt(feet.toString());
      setEditHeightIn(inches.toString());
    } else {
      setEditHeightFt('');
      setEditHeightIn('');
    }

    if (weightKg) {
      const lb = kgToLb(Number(weightKg));
      setEditWeightLb(lb ? lb.toString() : '');
    } else {
      setEditWeightLb('');
    }
  };

  const handleStartEdit = () => {
    syncFormFromUser(user);
    setIsEditing(true);
    setValidationErrors({});
    setError('');
    setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    syncFormFromUser(user);
    setIsEditing(false);
    setValidationErrors({});
    setError('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  // Height conversion handlers
  const handleHeightCmChange = (cmVal: string) => {
    setFormData(prev => ({ ...prev, height_cm: cmVal }));
    const num = parseFloat(cmVal);
    if (!isNaN(num) && num > 0) {
      const { feet, inches } = cmToFtIn(num);
      setEditHeightFt(feet.toString());
      setEditHeightIn(inches.toString());
    } else {
      setEditHeightFt('');
      setEditHeightIn('');
    }
  };

  const handleHeightFtInChange = (feetVal: string, inchesVal: string) => {
    setEditHeightFt(feetVal);
    setEditHeightIn(inchesVal);
    const f = parseInt(feetVal, 10) || 0;
    const i = parseFloat(inchesVal) || 0;
    if (f > 0 || i > 0) {
      const cm = ftInToCm(f, i);
      setFormData(prev => ({ ...prev, height_cm: cm }));
    } else {
      setFormData(prev => ({ ...prev, height_cm: '' }));
    }
  };

  // Weight conversion handlers
  const handleWeightKgChange = (kgVal: string) => {
    setFormData(prev => ({ ...prev, weight_kg: kgVal }));
    const num = parseFloat(kgVal);
    if (!isNaN(num) && num > 0) {
      const lb = kgToLb(num);
      setEditWeightLb(lb !== null ? lb.toString() : '');
    } else {
      setEditWeightLb('');
    }
  };

  const handleWeightLbChange = (lbVal: string) => {
    setEditWeightLb(lbVal);
    const num = parseFloat(lbVal);
    if (!isNaN(num) && num > 0) {
      const kg = lbToKg(num);
      setFormData(prev => ({ ...prev, weight_kg: kg !== null ? kg : '' }));
    } else {
      setFormData(prev => ({ ...prev, weight_kg: '' }));
    }
  };

  // Validation
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Full name is required.';
    } else if (formData.name.trim().length > 100) {
      errors.name = 'Full name cannot exceed 100 characters.';
    }

    if (formData.date_of_birth) {
      const dob = new Date(formData.date_of_birth);
      const now = new Date();
      if (isNaN(dob.getTime())) {
        errors.date_of_birth = 'Please enter a valid date of birth.';
      } else if (dob > now) {
        errors.date_of_birth = 'Date of birth cannot be in the future.';
      } else {
        const age = calculateAge(formData.date_of_birth);
        if (age !== null && (age < 0 || age > 130)) {
          errors.date_of_birth = 'Please provide a realistic date of birth.';
        }
      }
    }

    if (formData.gender && !GENDER_OPTIONS.includes(formData.gender as any)) {
      errors.gender = 'Please select a valid gender.';
    }

    if (formData.blood_group && !BLOOD_GROUP_OPTIONS.includes(formData.blood_group as any)) {
      errors.blood_group = 'Please select a valid blood group.';
    }

    if (formData.height_cm !== '') {
      const h = Number(formData.height_cm);
      if (isNaN(h) || h <= 0) {
        errors.height_cm = 'Height must be a positive number.';
      } else if (h < 40 || h > 280) {
        errors.height_cm = 'Height must be between 40 cm and 280 cm.';
      }
    }

    if (formData.weight_kg !== '') {
      const w = Number(formData.weight_kg);
      if (isNaN(w) || w <= 0) {
        errors.weight_kg = 'Weight must be a positive number.';
      } else if (w < 2 || w > 450) {
        errors.weight_kg = 'Weight must be between 2 kg and 450 kg.';
      }
    }

    if (formData.emergency_contact_phone) {
      const cleaned = formData.emergency_contact_phone.replace(/[\s\-\(\)\.]/g, '');
      if (cleaned.length < 6 || cleaned.length > 20) {
        errors.emergency_contact_phone = 'Please enter a valid phone number (6-20 digits).';
      }
    }

    if (formData.emergency_contact_phone && !formData.emergency_contact_name.trim()) {
      errors.emergency_contact_name = 'Please provide the contact person\'s name.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save profile
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      setError('Please review and correct the marked errors.');
      return;
    }

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload: Partial<User> = {
        name: formData.name.trim(),
        fullName: formData.name.trim(),
        phone: formData.phone.trim() || undefined,
        date_of_birth: formData.date_of_birth || undefined,
        dateOfBirth: formData.date_of_birth || undefined,
        gender: formData.gender || undefined,
        blood_group: formData.blood_group || undefined,
        bloodGroup: formData.blood_group || undefined,
        height_cm: formData.height_cm !== '' ? Number(formData.height_cm) : null,
        heightCm: formData.height_cm !== '' ? Number(formData.height_cm) : null,
        weight_kg: formData.weight_kg !== '' ? Number(formData.weight_kg) : null,
        weightKg: formData.weight_kg !== '' ? Number(formData.weight_kg) : null,
        emergency_contact_name: formData.emergency_contact_name.trim() || undefined,
        emergency_contact_relationship: formData.emergency_contact_relationship || undefined,
        emergency_contact_phone: formData.emergency_contact_phone.trim() || undefined,
        emergencyContact: {
          name: formData.emergency_contact_name.trim(),
          relationship: formData.emergency_contact_relationship,
          phone: formData.emergency_contact_phone.trim()
        },
        notification_email: formData.notification_email,
        notification_sms: formData.notification_sms,
        notification_push: formData.notification_push
      };

      const updated = await authService.updateProfile(payload);
      setUser(updated);
      updateUser(updated);
      syncFormFromUser(updated);
      setIsEditing(false);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Quick toggle notification directly in View Mode
  const handleToggleNotification = async (key: 'notification_email' | 'notification_sms' | 'notification_push') => {
    const currentVal = user[key] ?? (key === 'notification_sms' ? 0 : 1);
    const newVal = currentVal === 1 ? 0 : 1;
    
    // Optimistic update
    setUser(prev => ({ ...prev, [key]: newVal }));
    setFormData(prev => ({ ...prev, [key]: newVal }));

    try {
      const payload = { [key]: newVal };
      const updated = await authService.updateProfile(payload);
      setUser(updated);
      updateUser(updated);
    } catch (err) {
      // Revert if error
      setUser(prev => ({ ...prev, [key]: currentVal }));
      setFormData(prev => ({ ...prev, [key]: currentVal }));
    }
  };

  // Change password handler
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!passwordData.currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (!passwordData.newPassword || passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      await authService.changePassword(passwordData.currentPassword, passwordData.newPassword);
      setPasswordSuccess('Password successfully updated!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess('');
      }, 1500);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password. Please check your current password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Live BMI in Edit Mode
  const liveHeightCm = formData.height_cm !== '' ? Number(formData.height_cm) : null;
  const liveWeightKg = formData.weight_kg !== '' ? Number(formData.weight_kg) : null;
  const liveBmi = calculateBmi(liveHeightCm, liveWeightKg);
  const liveAge = calculateAge(formData.date_of_birth);

  // View Mode values
  const viewHeightCm = user.height_cm ?? user.heightCm ?? null;
  const viewWeightKg = user.weight_kg ?? user.weightKg ?? null;
  const viewBmi = calculateBmi(viewHeightCm, viewWeightKg);
  const viewAge = calculateAge(user.date_of_birth ?? user.dateOfBirth);
  const userDisplayName = user.name || user.fullName || 'Patient Profile';
  const initialLetter = userDisplayName.charAt(0).toUpperCase() || 'P';

  // Calculate BMI Needle Marker Position Percentage (14 to 38 range)
  const getBmiNeedlePosition = (bmiVal: number | null) => {
    if (!bmiVal) return 0;
    const min = 14;
    const max = 36;
    const clamped = Math.min(Math.max(bmiVal, min), max);
    return ((clamped - min) / (max - min)) * 100;
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto py-24 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-[#00A884] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[#64748B] font-medium text-sm">Loading MediTrack patient profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 px-3 sm:px-6">
      
      {/* ========================================================================= */}
      {/* 4. PAGE HEADER                                                            */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#071B49] tracking-tight">
            Patient Profile
          </h1>
          <p className="text-sm text-[#64748B] mt-1 font-normal">
            Personal identification, clinical vitals, emergency contacts, and account security.
          </p>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setPasswordError('');
              setPasswordSuccess('');
              setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
              setShowPasswordModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-[#DCE5EC] hover:bg-[#F8FAFC] text-[#071B49] rounded-xl text-sm font-semibold shadow-2xs transition-colors duration-150"
            title="Change Account Password"
          >
            <KeyRound className="w-4 h-4 text-[#64748B]" />
            <span>Change Password</span>
          </button>

          {!isEditing ? (
            <button
              type="button"
              onClick={handleStartEdit}
              className="inline-flex items-center gap-2 bg-[#00A884] hover:bg-[#008F72] text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-xs transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#00A884] focus:ring-offset-2"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-[#DCE5EC] rounded-xl text-[#071B49] bg-white hover:bg-[#F8FAFC] text-sm font-semibold transition-colors disabled:opacity-50 shadow-2xs"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-2 bg-[#00A884] hover:bg-[#008F72] text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-xs transition-all disabled:opacity-70"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Global Alerts */}
      {error && (
        <div className="bg-[#FFF0F3] border border-[#EF476F]/30 text-[#EF476F] p-4 rounded-xl flex items-start gap-3 shadow-2xs">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold">Attention</p>
            <p className="font-normal">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-[#E8FAF4] border border-[#00A884]/30 text-[#008F72] p-4 rounded-xl flex items-center gap-3 shadow-2xs">
          <CheckCircle className="w-5 h-5 text-[#00A884] shrink-0" />
          <p className="text-sm font-semibold">{success}</p>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#071B49]/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-[#DCE5EC] w-full max-w-md overflow-hidden animate-in fade-in duration-150">
            <div className="p-5 border-b border-[#DCE5EC] flex items-center justify-between bg-[#F8FAFC]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#E8FAF4] text-[#00A884]">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-[#071B49] text-base">Change Password</h3>
                  <p className="text-xs text-[#64748B]">Update account credentials safely</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="text-[#64748B] hover:text-[#071B49] p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
              {passwordError && (
                <div className="p-3 bg-[#FFF0F3] border border-[#EF476F]/30 rounded-xl text-[#EF476F] text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="p-3 bg-[#E8FAF4] border border-[#00A884]/30 rounded-xl text-[#008F72] text-xs font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  {passwordSuccess}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#071B49] uppercase tracking-wider block">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder="Enter current password"
                    className="w-full px-3.5 py-2.5 pr-10 border border-[#DCE5EC] rounded-xl text-sm text-[#071B49] focus:ring-2 focus:ring-[#00A884] focus:border-[#00A884] transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className="absolute right-3 top-2.5 text-[#64748B] hover:text-[#071B49]"
                  >
                    {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#071B49] uppercase tracking-wider block">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Minimum 6 characters"
                    className="w-full px-3.5 py-2.5 pr-10 border border-[#DCE5EC] rounded-xl text-sm text-[#071B49] focus:ring-2 focus:ring-[#00A884] focus:border-[#00A884] transition-colors"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-3 top-2.5 text-[#64748B] hover:text-[#071B49]"
                  >
                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#071B49] uppercase tracking-wider block">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Re-type new password"
                  className="w-full px-3.5 py-2.5 border border-[#DCE5EC] rounded-xl text-sm text-[#071B49] focus:ring-2 focus:ring-[#00A884] focus:border-[#00A884] transition-colors"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#DCE5EC]">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  disabled={passwordLoading}
                  className="px-4 py-2 border border-[#DCE5EC] rounded-xl text-[#071B49] text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-5 py-2 bg-[#00A884] hover:bg-[#008F72] text-white rounded-xl text-sm font-semibold transition-all shadow-xs flex items-center gap-2"
                >
                  {passwordLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Updating...</span>
                    </>
                  ) : (
                    'Update Password'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW MODE vs EDIT MODE RENDER                                            */}
      {/* ========================================================================= */}
      {!isEditing ? (
        <div className="space-y-6">
          
          {/* ========================================================================= */}
          {/* 5. PATIENT IDENTITY CARD                                                  */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-2xl border border-[#DCE5EC] p-6 sm:p-7 shadow-xs">
            <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
              
              {/* Left: Rounded-Square Profile Avatar */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 w-full md:w-auto">
                <div className="relative shrink-0">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#00A884] text-white flex items-center justify-center font-bold text-3xl sm:text-4xl shadow-xs select-none">
                    {initialLetter}
                  </div>
                  {/* Small online/active green indicator at bottom-right */}
                  <span 
                    className="w-4 h-4 rounded-full bg-[#10B981] ring-2 ring-white absolute -bottom-1 -right-1"
                    title="Active Account"
                  ></span>
                </div>

                {/* Center: Identity details */}
                <div className="space-y-2 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[#071B49] tracking-tight">
                      {userDisplayName}
                    </h2>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E8FAF4] text-[#00A884] border border-[#00A884]/20">
                      Active Patient
                    </span>
                  </div>

                  {/* Contact Row: Email, Phone, Gender */}
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-y-1.5 gap-x-4 text-sm text-[#64748B]">
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-[#64748B]" />
                      <span>{user.email || 'No email registered'}</span>
                    </span>

                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-[#64748B]" />
                      <span>{user.phone || 'Phone not set'}</span>
                    </span>

                    <span className="inline-flex items-center gap-1.5 font-medium text-[#071B49]">
                      <UserIcon className="w-4 h-4 text-[#2563EB]" />
                      <span>{user.gender || 'Gender unassigned'}</span>
                    </span>
                  </div>

                  {/* Clinical Indicators Row: DOB / Age, Blood Group, BMI */}
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1 text-xs">
                    {/* DOB / Age */}
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#F8FAFC] border border-[#DCE5EC] font-semibold text-[#071B49]">
                      <Calendar className="w-3.5 h-3.5 text-[#00A884]" />
                      <span>
                        {user.date_of_birth || user.dateOfBirth
                          ? `${formatDobDisplay(user.date_of_birth || user.dateOfBirth)} (${viewAge !== null ? `${viewAge} yrs` : '—'})`
                          : 'DOB not provided'}
                      </span>
                    </span>

                    {/* Blood Group Badge */}
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FFF0F3] border border-[#EF476F]/20 text-[#EF476F] font-bold">
                      <Droplet className="w-3.5 h-3.5 fill-[#EF476F]" />
                      <span>Blood Group: {user.blood_group || user.bloodGroup || 'Not set'}</span>
                    </span>

                    {/* BMI Badge */}
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#E8FAF4] border border-[#00A884]/20 text-[#00A884] font-bold">
                      <Activity className="w-3.5 h-3.5" />
                      <span>BMI: {viewBmi.bmi !== null ? `${viewBmi.bmi} (${viewBmi.category || 'Normal'})` : 'Not computed'}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Profile Verification / Status Badge */}
              <div className="hidden lg:flex flex-col items-end justify-center shrink-0 pl-6 border-l border-[#DCE5EC]/80">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#E8FAF4] border border-[#00A884]/25 rounded-xl text-xs font-bold text-[#008F72]">
                  <ShieldCheck className="w-4 h-4 text-[#00A884]" />
                  <span>Clinical Profile Verified</span>
                </div>
                <p className="text-[11px] text-[#64748B] mt-1.5 text-right">
                  Standardized EMR &middot; HIPAA aligned
                </p>
              </div>

            </div>
          </div>

          {/* ========================================================================= */}
          {/* 7. QUICK MEDICAL STATISTICS (Horizontal 4-Column Card)                    */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-2xl border border-[#DCE5EC] p-5 sm:p-6 shadow-xs">
            <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 divide-[#DCE5EC]">
              
              {/* Column 1: AGE */}
              <div className="p-3 sm:px-5 sm:py-2 flex flex-col justify-between">
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  AGE
                </span>
                <div className="mt-1">
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#071B49]">
                    {viewAge !== null ? `${viewAge} years` : '—'}
                  </span>
                </div>
                <span className="text-xs text-[#64748B] mt-1">
                  Calculated dynamically
                </span>
              </div>

              {/* Column 2: BLOOD GROUP */}
              <div className="p-3 sm:px-5 sm:py-2 sm:border-l sm:border-[#DCE5EC] flex flex-col justify-between">
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  BLOOD GROUP
                </span>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#EF476F]">
                    {user.blood_group || user.bloodGroup || '—'}
                  </span>
                </div>
                <span className="text-xs text-[#64748B] mt-1">
                  ABO / Rh typing
                </span>
              </div>

              {/* Column 3: HEIGHT */}
              <div className="p-3 sm:px-5 sm:py-2 lg:border-l lg:border-[#DCE5EC] flex flex-col justify-between">
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  HEIGHT
                </span>
                <div className="mt-1">
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#071B49]">
                    {viewHeightCm ? (
                      viewHeightUnit === 'cm' 
                        ? `${viewHeightCm} cm` 
                        : `${cmToFtIn(viewHeightCm).feet} ft ${cmToFtIn(viewHeightCm).inches} in`
                    ) : '—'}
                  </span>
                </div>
                <div className="mt-1">
                  {viewHeightCm ? (
                    <button
                      type="button"
                      onClick={() => setViewHeightUnit(prev => (prev === 'cm' ? 'ft' : 'cm'))}
                      className="text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8] underline decoration-dotted transition-colors"
                    >
                      {viewHeightUnit === 'cm' ? 'Switch to ft/in' : 'Switch to cm'}
                    </button>
                  ) : (
                    <span className="text-xs text-[#64748B]">Not recorded</span>
                  )}
                </div>
              </div>

              {/* Column 4: WEIGHT */}
              <div className="p-3 sm:px-5 sm:py-2 sm:border-l sm:border-[#DCE5EC] flex flex-col justify-between">
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  WEIGHT
                </span>
                <div className="mt-1">
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#071B49]">
                    {viewWeightKg ? (
                      viewWeightUnit === 'kg' 
                        ? `${viewWeightKg} kg` 
                        : `${kgToLb(viewWeightKg)} lb`
                    ) : '—'}
                  </span>
                </div>
                <div className="mt-1">
                  {viewWeightKg ? (
                    <button
                      type="button"
                      onClick={() => setViewWeightUnit(prev => (prev === 'kg' ? 'lb' : 'kg'))}
                      className="text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8] underline decoration-dotted transition-colors"
                    >
                      {viewWeightUnit === 'kg' ? 'Switch to lb' : 'Switch to kg'}
                    </button>
                  ) : (
                    <span className="text-xs text-[#64748B]">Not recorded</span>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* ========================================================================= */}
          {/* 8. PERSONAL & MEDICAL INFORMATION (4-Column Layout)                       */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-2xl border border-[#DCE5EC] p-6 sm:p-7 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#DCE5EC] mb-6 gap-3">
              <div>
                <h3 className="text-lg font-bold text-[#071B49] flex items-center gap-2.5">
                  <Activity className="w-5 h-5 text-[#00A884]" />
                  Personal &amp; Medical Information
                </h3>
                <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
                  Authoritative biometric measurements and clinical baseline.
                </p>
              </div>
              <button
                type="button"
                onClick={handleStartEdit}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl border border-[#DCE5EC] text-[#071B49] bg-white hover:bg-[#F8FAFC] transition-colors shadow-2xs self-start sm:self-auto"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#00A884]" />
                <span>Change Vitals</span>
              </button>
            </div>

            {/* Structured 4-column layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              
              {/* Card 1: BLOOD GROUP */}
              <div className="bg-white rounded-2xl border border-[#DCE5EC] p-5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                      Blood Group
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-[#FFF0F3] border border-[#EF476F]/20 flex items-center justify-center shrink-0">
                      <Droplet className="w-4 h-4 text-[#EF476F] fill-[#EF476F]" />
                    </div>
                  </div>
                  <div className="my-2">
                    <p className="text-2xl sm:text-3xl font-extrabold text-[#EF476F] tracking-tight">
                      {user.blood_group || user.bloodGroup || 'O+'}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                  Universal transfusion compatibility marker.
                </p>
              </div>

              {/* Card 2: GENDER */}
              <div className="bg-white rounded-2xl border border-[#DCE5EC] p-5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                      Gender
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-[#EEF5FF] border border-[#2563EB]/20 flex items-center justify-center shrink-0">
                      <UserIcon className="w-4 h-4 text-[#2563EB]" />
                    </div>
                  </div>
                  <div className="my-2">
                    <p className="text-2xl sm:text-3xl font-extrabold text-[#071B49] tracking-tight capitalize">
                      {user.gender || 'Male'}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                  Biological and reference profile category.
                </p>
              </div>

              {/* Card 3: DATE OF BIRTH */}
              <div className="bg-white rounded-2xl border border-[#DCE5EC] p-5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                      Date of Birth
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-[#E8FAF4] border border-[#00A884]/20 flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4 text-[#00A884]" />
                    </div>
                  </div>
                  <div className="my-2">
                    <p className="text-xl sm:text-2xl font-extrabold text-[#071B49] tracking-tight">
                      {user.date_of_birth || user.dateOfBirth 
                        ? formatDobDisplay(user.date_of_birth || user.dateOfBirth) 
                        : '15 Aug 2003'}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-[#008F72] font-semibold mt-2 leading-relaxed">
                  {viewAge !== null ? `Age: ${viewAge} years old (updates automatically)` : 'Age: 23 years old (updates automatically)'}
                </p>
              </div>

              {/* Card 4: HEIGHT & WEIGHT */}
              <div className="bg-white rounded-2xl border border-[#DCE5EC] p-5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                      Height &amp; Weight
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-[#EAF4FF] border border-[#00A884]/20 flex items-center justify-center shrink-0">
                      <Scale className="w-4 h-4 text-[#00A884]" />
                    </div>
                  </div>
                  <div className="my-1.5 space-y-0.5">
                    <p className="text-lg sm:text-xl font-extrabold text-[#071B49] tracking-tight">
                      {viewHeightCm ? `${viewHeightCm} cm (${cmToFtIn(viewHeightCm).feet}'${cmToFtIn(viewHeightCm).inches}")` : "175 cm (5'9\")"}
                    </p>
                    <p className="text-sm font-bold text-[#64748B]">
                      {viewWeightKg ? `${viewWeightKg} kg (${kgToLb(viewWeightKg)} lb)` : '70 kg (154.3 lb)'}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                  Authoritative biometric clinical baseline.
                </p>
              </div>

            </div>
          </div>

          {/* ========================================================================= */}
          {/* 9. BMI SECTION                                                            */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-2xl border border-[#DCE5EC] p-6 sm:p-7 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#DCE5EC] mb-6 gap-3">
              <div>
                <h3 className="text-lg font-bold text-[#071B49] flex items-center gap-2.5">
                  <Scale className="w-5 h-5 text-[#00A884]" />
                  Body Mass Index (BMI)
                </h3>
                <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
                  Formula: weight (kg) / [height (m)]² &middot; Automatically calculated
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-3xl sm:text-4xl font-extrabold text-[#071B49]">
                  {viewBmi.bmi !== null ? viewBmi.bmi : '—'}
                </span>
                {viewBmi.category ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#E8FAF4] text-[#00A884] border border-[#00A884]/25">
                    {viewBmi.category}
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-[#64748B]">
                    Pending Data
                  </span>
                )}
              </div>
            </div>

            {/* Visual BMI Scale Bar with Precise Pin Indicator */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-[#64748B]">
                <span className="font-semibold text-[#071B49]">Clinical Strata &amp; Patient Position</span>
                <span className="font-medium text-[#008F72]">Healthy adult reference range: 18.5 – 24.9 kg/m²</span>
              </div>

              <div className="relative pt-6 pb-2">
                {/* Needle / Marker Pin */}
                {viewBmi.bmi !== null && (
                  <div 
                    className="absolute top-0 -translate-x-1/2 flex flex-col items-center transition-all duration-300"
                    style={{ left: `${getBmiNeedlePosition(viewBmi.bmi)}%` }}
                  >
                    <span className="text-[11px] font-extrabold px-2 py-0.5 rounded bg-[#071B49] text-white shadow-xs">
                      {viewBmi.bmi}
                    </span>
                    <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-[#071B49]"></div>
                  </div>
                )}

                {/* 4 Colored Segments of the BMI Bar */}
                <div className="h-3 w-full rounded-full overflow-hidden flex bg-slate-100 shadow-inner">
                  {/* Underweight: < 18.5 */}
                  <div className="w-[20%] bg-[#38BDF8]" title="Underweight (< 18.5)"></div>
                  {/* Normal: 18.5 - 24.9 */}
                  <div className="w-[30%] bg-[#00A884]" title="Normal (18.5 – 24.9)"></div>
                  {/* Overweight: 25.0 - 29.9 */}
                  <div className="w-[25%] bg-[#F59E0B]" title="Overweight (25.0 – 29.9)"></div>
                  {/* Obesity: >= 30.0 */}
                  <div className="w-[25%] bg-[#EF476F]" title="Obesity (≥ 30.0)"></div>
                </div>

                {/* 4 Category labels below */}
                <div className="grid grid-cols-4 text-center mt-2.5 text-[11px] text-[#64748B] font-medium">
                  <div>
                    <span className="block font-bold text-[#0284C7]">Underweight</span>
                    <span>&lt; 18.5</span>
                  </div>
                  <div>
                    <span className="block font-bold text-[#008F72]">Normal</span>
                    <span>18.5 – 24.9</span>
                  </div>
                  <div>
                    <span className="block font-bold text-[#D97706]">Overweight</span>
                    <span>25.0 – 29.9</span>
                  </div>
                  <div>
                    <span className="block font-bold text-[#E11D48]">Obese</span>
                    <span>&ge; 30.0</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-[#F8FAFC] border border-[#DCE5EC] rounded-xl text-xs text-[#64748B]">
                <p>
                  <strong>Clinical Reference:</strong> BMI provides a general statistical assessment of healthy body mass proportions. It is automatically recalculated whenever height or weight metrics are updated in your patient profile.
                </p>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 10. EMERGENCY CONTACT                                                     */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-2xl border border-[#DCE5EC] p-6 sm:p-7 shadow-xs">
            <div className="flex items-center justify-between pb-5 border-b border-[#DCE5EC] mb-6">
              <div>
                <h3 className="text-lg font-bold text-[#071B49] flex items-center gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-[#EF476F]" />
                  Emergency Contact
                </h3>
                <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
                  Designated individual for urgent triage, hospital admission, or clinical emergency notifications.
                </p>
              </div>
              <button
                type="button"
                onClick={handleStartEdit}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#DCE5EC] text-[#071B49] hover:bg-[#F8FAFC] transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#00A884]" />
                <span>{user.emergency_contact_name || user.emergencyContact?.name ? 'Edit Contact' : 'Add Contact'}</span>
              </button>
            </div>

            {user.emergency_contact_name || user.emergencyContact?.name ? (
              <div className="bg-[#F8FAFC]/50 rounded-xl border border-[#DCE5EC] p-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
                  <div>
                    <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
                      Contact Name
                    </span>
                    <p className="text-base font-bold text-[#071B49] mt-1">
                      {user.emergency_contact_name || user.emergencyContact?.name}
                    </p>
                    <p className="text-[11px] text-[#64748B]">Designated primary proxy</p>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
                      Relationship
                    </span>
                    <div className="mt-1">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-[#EEF5FF] text-[#2563EB] border border-[#2563EB]/20">
                        {user.emergency_contact_relationship || user.emergencyContact?.relationship || 'Family / Relative'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#64748B] mt-1">Authorized proxy role</p>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
                      Phone Number
                    </span>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-base font-bold text-[#071B49]">
                        {user.emergency_contact_phone || user.emergencyContact?.phone || 'No phone set'}
                      </p>
                      {(user.emergency_contact_phone || user.emergencyContact?.phone) && (
                        <a 
                          href={`tel:${user.emergency_contact_phone || user.emergencyContact?.phone}`}
                          className="p-2 rounded-xl bg-[#E8FAF4] text-[#00A884] hover:bg-[#00A884] hover:text-white transition-colors"
                          title="Call Emergency Contact"
                        >
                          <PhoneCall className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                    <p className="text-[11px] text-[#64748B]">Direct cellular link</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center rounded-xl border border-dashed border-[#DCE5EC] bg-[#F8FAFC]">
                <Heart className="w-8 h-8 text-[#64748B] mx-auto mb-2" />
                <p className="text-sm font-bold text-[#071B49]">No emergency contact designated</p>
                <p className="text-xs text-[#64748B] mt-1 mb-4 max-w-sm mx-auto">
                  Designate a trusted family member or physician for immediate contact during medical triage.
                </p>
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFF0F3] text-[#EF476F] border border-[#EF476F]/20 rounded-xl text-xs font-bold hover:bg-[#EF476F] hover:text-white transition-colors"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Add Emergency Contact
                </button>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* 11. NOTIFICATION PREFERENCES                                              */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-2xl border border-[#DCE5EC] p-6 sm:p-7 shadow-xs">
            <div className="flex items-center justify-between pb-5 border-b border-[#DCE5EC] mb-6">
              <div>
                <h3 className="text-lg font-bold text-[#071B49] flex items-center gap-2.5">
                  <Bell className="w-5 h-5 text-[#00A884]" />
                  Notification Preferences
                </h3>
                <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
                  Manage communication channels for medication schedules, reminders, and clinical updates.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Email Alerts Toggle */}
              <div className="p-4 rounded-xl border border-[#DCE5EC] bg-[#F8FAFC]/50 flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-[#071B49] block">Email Alerts</span>
                  <span className="text-xs text-[#64748B]">Weekly health digests</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleNotification('notification_email')}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                    user.notification_email !== 0 ? 'bg-[#00A884]' : 'bg-slate-300'
                  }`}
                  title="Toggle Email Alerts"
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                      user.notification_email !== 0 ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  ></div>
                </button>
              </div>

              {/* SMS Alerts Toggle */}
              <div className="p-4 rounded-xl border border-[#DCE5EC] bg-[#F8FAFC]/50 flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-[#071B49] block">SMS Alerts</span>
                  <span className="text-xs text-[#64748B]">Urgent notifications</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleNotification('notification_sms')}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                    user.notification_sms === 1 ? 'bg-[#00A884]' : 'bg-slate-300'
                  }`}
                  title="Toggle SMS Alerts"
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                      user.notification_sms === 1 ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  ></div>
                </button>
              </div>

              {/* Push Alerts Toggle */}
              <div className="p-4 rounded-xl border border-[#DCE5EC] bg-[#F8FAFC]/50 flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-[#071B49] block">Push Alerts</span>
                  <span className="text-xs text-[#64748B]">Daily vital reminders</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleNotification('notification_push')}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                    user.notification_push !== 0 ? 'bg-[#00A884]' : 'bg-slate-300'
                  }`}
                  title="Toggle Push Alerts"
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                      user.notification_push !== 0 ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  ></div>
                </button>
              </div>

            </div>
          </div>

        </div>
      ) : (
        /* ========================================================================= */
        /* EDIT MODE FORM (MATCHING THE SAME PALETTE AND CLEAN CLINICAL CARD STYLE)   */
        /* ========================================================================= */
        <form onSubmit={handleSave} className="space-y-6">
          
          {/* Edit Form Top Notice Banner */}
          <div className="bg-white rounded-2xl border border-[#DCE5EC] p-6 sm:p-7 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#DCE5EC]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E8FAF4] text-[#00A884] border border-[#00A884]/20">
                    Edit Mode Active
                  </span>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-[#071B49] tracking-tight">
                    Update Patient Profile
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                  Update personal records and measurements below. Live age, BMI, and conversions recalculate automatically.
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="px-4 py-2 border border-[#DCE5EC] rounded-xl text-[#071B49] bg-white hover:bg-[#F8FAFC] text-sm font-semibold transition-colors shadow-2xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 bg-[#00A884] hover:bg-[#008F72] text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-xs transition-all disabled:opacity-70"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Section 1: Personal Identification */}
            <div className="pt-6 space-y-6">
              <div className="flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-[#00A884]" />
                <h3 className="text-base font-bold text-[#071B49]">
                  Personal Identification
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#071B49] uppercase tracking-wider block">
                    Full Name <span className="text-[#EF476F]">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Naman Gupta"
                    className={`w-full px-4 py-2.5 border rounded-xl text-sm text-[#071B49] focus:ring-2 focus:ring-[#00A884] focus:border-[#00A884] transition-colors ${
                      validationErrors.name ? 'border-[#EF476F] bg-[#FFF0F3]/30' : 'border-[#DCE5EC] bg-white'
                    }`}
                    required
                  />
                  {validationErrors.name && (
                    <p className="text-xs font-semibold text-[#EF476F]">{validationErrors.name}</p>
                  )}
                </div>

                {/* Gender */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#071B49] uppercase tracking-wider block">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-[#DCE5EC] rounded-xl text-sm text-[#071B49] focus:ring-2 focus:ring-[#00A884] focus:border-[#00A884] transition-colors bg-white"
                  >
                    <option value="">Select Gender</option>
                    {GENDER_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                {/* Date of Birth & Dynamic Live Age */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#071B49] uppercase tracking-wider">
                      Date of Birth
                    </label>
                    {liveAge !== null && (
                      <span className="text-xs font-bold text-[#008F72] bg-[#E8FAF4] px-2.5 py-0.5 rounded-md border border-[#00A884]/20">
                        Current Age: {liveAge} yrs
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Calendar className="w-4 h-4 text-[#64748B]" />
                    </div>
                    <input
                      type="date"
                      name="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={handleInputChange}
                      max={new Date().toISOString().split('T')[0]}
                      className={`w-full pl-10 px-4 py-2.5 border rounded-xl text-sm text-[#071B49] focus:ring-2 focus:ring-[#00A884] focus:border-[#00A884] transition-colors bg-white ${
                        validationErrors.date_of_birth ? 'border-[#EF476F] bg-[#FFF0F3]/30' : 'border-[#DCE5EC]'
                      }`}
                    />
                  </div>
                  {validationErrors.date_of_birth ? (
                    <p className="text-xs font-semibold text-[#EF476F]">{validationErrors.date_of_birth}</p>
                  ) : (
                    <p className="text-[11px] text-[#64748B]">Date of Birth is stored as the authoritative source; age updates dynamically.</p>
                  )}
                </div>

                {/* Phone Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#071B49] uppercase tracking-wider block">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Phone className="w-4 h-4 text-[#64748B]" />
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+91 98765 43210"
                      className="w-full pl-10 px-4 py-2.5 border border-[#DCE5EC] rounded-xl text-sm text-[#071B49] focus:ring-2 focus:ring-[#00A884] focus:border-[#00A884] transition-colors bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Clinical Vitals & Measurements */}
            <div className="pt-8 mt-8 border-t border-[#DCE5EC] space-y-6">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#00A884]" />
                <h3 className="text-base font-bold text-[#071B49]">
                  Clinical Vitals &amp; Biometrics
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Blood Group */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#071B49] uppercase tracking-wider flex items-center gap-1.5">
                    <Droplet className="w-3.5 h-3.5 text-[#EF476F]" />
                    Blood Group
                  </label>
                  <select
                    name="blood_group"
                    value={formData.blood_group}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-[#DCE5EC] rounded-xl text-sm text-[#071B49] focus:ring-2 focus:ring-[#00A884] focus:border-[#00A884] transition-colors bg-white"
                  >
                    <option value="">Select Blood Group</option>
                    {BLOOD_GROUP_OPTIONS.map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                {/* Email Account */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#071B49] uppercase tracking-wider block">
                    Account Email (ID)
                  </label>
                  <input
                    type="email"
                    value={user.email || ''}
                    disabled
                    className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#DCE5EC] rounded-xl text-[#64748B] cursor-not-allowed text-sm"
                  />
                </div>

                {/* Height with cm / ft+in selector */}
                <div className="space-y-2 p-4 rounded-xl border border-[#DCE5EC] bg-[#F8FAFC]/40">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#071B49] uppercase tracking-wider flex items-center gap-1.5">
                      <Ruler className="w-3.5 h-3.5 text-[#00A884]" />
                      Height
                    </label>
                    <div className="inline-flex rounded-lg border border-[#DCE5EC] p-0.5 bg-white text-xs">
                      <button
                        type="button"
                        onClick={() => setEditHeightUnit('cm')}
                        className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                          editHeightUnit === 'cm'
                            ? 'bg-[#00A884] text-white shadow-2xs'
                            : 'text-[#64748B] hover:text-[#071B49]'
                        }`}
                      >
                        cm
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditHeightUnit('ft')}
                        className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                          editHeightUnit === 'ft'
                            ? 'bg-[#00A884] text-white shadow-2xs'
                            : 'text-[#64748B] hover:text-[#071B49]'
                        }`}
                      >
                        ft / in
                      </button>
                    </div>
                  </div>

                  {editHeightUnit === 'cm' ? (
                    <div className="relative">
                      <input
                        type="number"
                        step="0.5"
                        min="40"
                        max="280"
                        value={formData.height_cm}
                        onChange={(e) => handleHeightCmChange(e.target.value)}
                        placeholder="e.g. 175"
                        className={`w-full px-4 py-2.5 pr-12 border rounded-xl text-sm text-[#071B49] focus:ring-2 focus:ring-[#00A884] bg-white ${
                          validationErrors.height_cm ? 'border-[#EF476F] bg-[#FFF0F3]/30' : 'border-[#DCE5EC]'
                        }`}
                      />
                      <span className="absolute right-3.5 top-2.5 text-xs font-bold text-[#64748B]">cm</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          max="8"
                          value={editHeightFt}
                          onChange={(e) => handleHeightFtInChange(e.target.value, editHeightIn)}
                          placeholder="5"
                          className="w-full px-3 py-2.5 pr-8 border border-[#DCE5EC] rounded-xl text-sm text-[#071B49] focus:ring-2 focus:ring-[#00A884] bg-white"
                        />
                        <span className="absolute right-3 top-2.5 text-xs font-bold text-[#64748B]">ft</span>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="11.9"
                          value={editHeightIn}
                          onChange={(e) => handleHeightFtInChange(editHeightFt, e.target.value)}
                          placeholder="9"
                          className="w-full px-3 py-2.5 pr-8 border border-[#DCE5EC] rounded-xl text-sm text-[#071B49] focus:ring-2 focus:ring-[#00A884] bg-white"
                        />
                        <span className="absolute right-3 top-2.5 text-xs font-bold text-[#64748B]">in</span>
                      </div>
                    </div>
                  )}
                  {validationErrors.height_cm ? (
                    <p className="text-xs font-semibold text-[#EF476F]">{validationErrors.height_cm}</p>
                  ) : (
                    <p className="text-[11px] text-[#64748B]">
                      {formData.height_cm ? `Converted: ${formData.height_cm} cm` : 'Stored internally as heightCm'}
                    </p>
                  )}
                </div>

                {/* Weight with kg / lb selector */}
                <div className="space-y-2 p-4 rounded-xl border border-[#DCE5EC] bg-[#F8FAFC]/40">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#071B49] uppercase tracking-wider flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-[#00A884]" />
                      Weight
                    </label>
                    <div className="inline-flex rounded-lg border border-[#DCE5EC] p-0.5 bg-white text-xs">
                      <button
                        type="button"
                        onClick={() => setEditWeightUnit('kg')}
                        className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                          editWeightUnit === 'kg'
                            ? 'bg-[#00A884] text-white shadow-2xs'
                            : 'text-[#64748B] hover:text-[#071B49]'
                        }`}
                      >
                        kg
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditWeightUnit('lb')}
                        className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                          editWeightUnit === 'lb'
                            ? 'bg-[#00A884] text-white shadow-2xs'
                            : 'text-[#64748B] hover:text-[#071B49]'
                        }`}
                      >
                        lb
                      </button>
                    </div>
                  </div>

                  {editWeightUnit === 'kg' ? (
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="2"
                        max="450"
                        value={formData.weight_kg}
                        onChange={(e) => handleWeightKgChange(e.target.value)}
                        placeholder="e.g. 70"
                        className={`w-full px-4 py-2.5 pr-12 border rounded-xl text-sm text-[#071B49] focus:ring-2 focus:ring-[#00A884] bg-white ${
                          validationErrors.weight_kg ? 'border-[#EF476F] bg-[#FFF0F3]/30' : 'border-[#DCE5EC]'
                        }`}
                      />
                      <span className="absolute right-3.5 top-2.5 text-xs font-bold text-[#64748B]">kg</span>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="5"
                        max="990"
                        value={editWeightLb}
                        onChange={(e) => handleWeightLbChange(e.target.value)}
                        placeholder="e.g. 154"
                        className="w-full px-4 py-2.5 pr-12 border border-[#DCE5EC] rounded-xl text-sm text-[#071B49] focus:ring-2 focus:ring-[#00A884] bg-white"
                      />
                      <span className="absolute right-3.5 top-2.5 text-xs font-bold text-[#64748B]">lb</span>
                    </div>
                  )}
                  {validationErrors.weight_kg ? (
                    <p className="text-xs font-semibold text-[#EF476F]">{validationErrors.weight_kg}</p>
                  ) : (
                    <p className="text-[11px] text-[#64748B]">
                      {formData.weight_kg ? `Converted: ${formData.weight_kg} kg` : 'Stored internally as weightKg'}
                    </p>
                  )}
                </div>

                {/* Real-time Dynamic BMI Calculator Box in Edit Mode */}
                <div className="md:col-span-2 p-5 rounded-xl border border-[#00A884]/30 bg-[#E8FAF4]/40">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-[#00A884] text-white">
                          <Scale className="w-4 h-4" />
                        </span>
                        <h4 className="text-sm font-bold text-[#071B49] uppercase tracking-wide">
                          Live Computed BMI
                        </h4>
                        {liveBmi.category && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E8FAF4] text-[#00A884] border border-[#00A884]/30">
                            {liveBmi.category}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#64748B] mt-1">
                        BMI recalculates instantly as height or weight changes. Manual edits are restricted.
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-3xl font-extrabold text-[#071B49]">
                        {liveBmi.bmi !== null ? liveBmi.bmi : '—'}
                      </span>
                      <span className="text-xs text-[#64748B] block">
                        Normal Target: 18.5 – 24.9
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Section 3: Emergency Contact */}
            <div className="pt-8 mt-8 border-t border-[#DCE5EC] space-y-6">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[#EF476F]" />
                <h3 className="text-base font-bold text-[#071B49]">
                  Emergency Contact
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#071B49] uppercase tracking-wider block">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    name="emergency_contact_name"
                    value={formData.emergency_contact_name}
                    onChange={handleInputChange}
                    placeholder="e.g. Priya Gupta"
                    className={`w-full px-4 py-2.5 border rounded-xl text-sm text-[#071B49] focus:ring-2 focus:ring-[#00A884] bg-white ${
                      validationErrors.emergency_contact_name ? 'border-[#EF476F] bg-[#FFF0F3]/30' : 'border-[#DCE5EC]'
                    }`}
                  />
                  {validationErrors.emergency_contact_name && (
                    <p className="text-xs font-semibold text-[#EF476F]">{validationErrors.emergency_contact_name}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#071B49] uppercase tracking-wider block">
                    Relationship
                  </label>
                  <select
                    name="emergency_contact_relationship"
                    value={formData.emergency_contact_relationship}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-[#DCE5EC] rounded-xl text-sm text-[#071B49] focus:ring-2 focus:ring-[#00A884] bg-white"
                  >
                    <option value="">Select Relationship</option>
                    {RELATIONSHIP_OPTIONS.map(rel => (
                      <option key={rel} value={rel}>{rel}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#071B49] uppercase tracking-wider block">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Phone className="w-4 h-4 text-[#64748B]" />
                    </div>
                    <input
                      type="tel"
                      name="emergency_contact_phone"
                      value={formData.emergency_contact_phone}
                      onChange={handleInputChange}
                      placeholder="+91 98765 43210"
                      className={`w-full pl-10 px-4 py-2.5 border rounded-xl text-sm text-[#071B49] focus:ring-2 focus:ring-[#00A884] bg-white ${
                        validationErrors.emergency_contact_phone ? 'border-[#EF476F] bg-[#FFF0F3]/30' : 'border-[#DCE5EC]'
                      }`}
                    />
                  </div>
                  {validationErrors.emergency_contact_phone && (
                    <p className="text-xs font-semibold text-[#EF476F]">{validationErrors.emergency_contact_phone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 4: Notification Preferences */}
            <div className="pt-8 mt-8 border-t border-[#DCE5EC] space-y-6">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-[#00A884]" />
                <h3 className="text-base font-bold text-[#071B49]">
                  Notification Preferences
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <label className="flex items-center justify-between p-4 bg-[#F8FAFC]/50 border border-[#DCE5EC] rounded-xl cursor-pointer hover:border-[#00A884] transition-colors">
                  <div>
                    <span className="text-sm font-bold text-[#071B49] block">Email Alerts</span>
                    <span className="text-xs text-[#64748B]">Weekly digests</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.notification_email === 1}
                    onChange={(e) => setFormData(prev => ({ ...prev, notification_email: e.target.checked ? 1 : 0 }))}
                    className="w-5 h-5 text-[#00A884] rounded-md border-[#DCE5EC] focus:ring-[#00A884]"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-[#F8FAFC]/50 border border-[#DCE5EC] rounded-xl cursor-pointer hover:border-[#00A884] transition-colors">
                  <div>
                    <span className="text-sm font-bold text-[#071B49] block">SMS Alerts</span>
                    <span className="text-xs text-[#64748B]">Urgent notifications</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.notification_sms === 1}
                    onChange={(e) => setFormData(prev => ({ ...prev, notification_sms: e.target.checked ? 1 : 0 }))}
                    className="w-5 h-5 text-[#00A884] rounded-md border-[#DCE5EC] focus:ring-[#00A884]"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-[#F8FAFC]/50 border border-[#DCE5EC] rounded-xl cursor-pointer hover:border-[#00A884] transition-colors">
                  <div>
                    <span className="text-sm font-bold text-[#071B49] block">Push Alerts</span>
                    <span className="text-xs text-[#64748B]">Daily reminders</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.notification_push === 1}
                    onChange={(e) => setFormData(prev => ({ ...prev, notification_push: e.target.checked ? 1 : 0 }))}
                    className="w-5 h-5 text-[#00A884] rounded-md border-[#DCE5EC] focus:ring-[#00A884]"
                  />
                </label>
              </div>
            </div>

            {/* Form Footer Action Bar */}
            <div className="pt-8 mt-8 border-t border-[#DCE5EC] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="px-5 py-2.5 border border-[#DCE5EC] rounded-xl text-[#071B49] bg-white hover:bg-[#F8FAFC] text-sm font-semibold transition-colors shadow-2xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 bg-[#00A884] hover:bg-[#008F72] text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-xs transition-all disabled:opacity-70"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>

          </div>

        </form>
      )}

    </div>
  );
}
