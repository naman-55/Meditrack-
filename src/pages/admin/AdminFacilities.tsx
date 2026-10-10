import React, { useState, useEffect } from 'react';
import { adminService } from '../../api/admin';
import { HealthcareFacility } from '../../api/facilities';
import { Building2, Plus, Edit2, ShieldCheck, Ban, CheckCircle } from 'lucide-react';

export default function AdminFacilities() {
  const [facilities, setFacilities] = useState<HealthcareFacility[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState<Partial<HealthcareFacility>>({
    name: '', specialties: '', address: '', city: '', phone: '', verification_status: 'PENDING', latitude: 0, longitude: 0
  });

  const fetchFacilities = async () => {
    setLoading(true);
    try {
      const data = await adminService.getFacilities();
      setFacilities(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await adminService.updateFacility(editingId, formData);
      } else {
        await adminService.addFacility(formData);
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ name: '', specialties: '', address: '', city: '', phone: '', verification_status: 'PENDING', latitude: 0, longitude: 0 });
      fetchFacilities();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (f: HealthcareFacility) => {
    setEditingId(f.id);
    setFormData(f);
    setShowForm(true);
  };

  const toggleVerification = async (f: HealthcareFacility) => {
    const newStatus = f.verification_status === 'VERIFIED' ? 'PENDING' : 'VERIFIED';
    try {
      await adminService.updateFacility(f.id, { ...f, verification_status: newStatus });
      fetchFacilities();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-emerald-600" />
            Healthcare Facilities
          </h1>
          <p className="mt-1 text-slate-500 text-sm">Manage, verify, and update facility records.</p>
        </div>
        {!showForm && (
          <button 
            onClick={() => { setEditingId(null); setFormData({ name: '', specialties: '', address: '', city: '', phone: '', verification_status: 'PENDING', latitude: 0, longitude: 0 }); setShowForm(true); }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Facility
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Facility Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                <input required type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                <input required type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Specialties (comma separated)</label>
                <input required type="text" value={formData.specialties} onChange={e => setFormData({...formData, specialties: e.target.value})} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <input required type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select value={formData.verification_status} onChange={e => setFormData({...formData, verification_status: e.target.value})} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                  <option value="PENDING">Pending</option>
                  <option value="VERIFIED">Verified</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Latitude</label>
                <input required type="number" step="any" value={formData.latitude} onChange={e => setFormData({...formData, latitude: parseFloat(e.target.value)})} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Longitude</label>
                <input required type="number" step="any" value={formData.longitude} onChange={e => setFormData({...formData, longitude: parseFloat(e.target.value)})} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50">Cancel</button>
              <button type="submit" className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700">Save Facility</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                <th className="px-6 py-4 font-medium">Facility</th>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium">Status & verification</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">Loading facilities...</td></tr>
              ) : facilities.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">No facilities found.</td></tr>
              ) : (
                facilities.map(f => (
                  <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 text-sm">{f.name}</span>
                        <span className="text-xs text-emerald-600 font-medium truncate max-w-xs">{f.specialties}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      <div>{f.address}, {f.city}</div>
                      <div className="mt-1 font-medium text-slate-700">{f.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-start gap-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${f.verification_status === 'VERIFIED' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                          {f.verification_status === 'VERIFIED' ? <ShieldCheck className="w-3 h-3 mr-1" /> : <Ban className="w-3 h-3 mr-1" />}
                          {f.verification_status}
                        </span>
                        {f.last_verified && <span className="text-[10px] text-slate-400">Verified: {new Date(f.last_verified).toLocaleDateString()}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => toggleVerification(f)} className={`p-1.5 rounded-md transition-colors ${f.verification_status === 'VERIFIED' ? 'text-amber-600 bg-amber-50 hover:bg-amber-100' : 'text-blue-600 bg-blue-50 hover:bg-blue-100'}`} title={f.verification_status === 'VERIFIED' ? 'Revoke Verification' : 'Verify Facility'}>
                          {f.verification_status === 'VERIFIED' ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                        <button onClick={() => handleEdit(f)} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-indigo-50 transition-colors"><Edit2 className="w-4 h-4" /></button>
                      </div>
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
