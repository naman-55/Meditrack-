import React, { useState, useEffect } from 'react';
import { adminService, SpecialtyRule } from '../../api/admin';
import { Stethoscope, Plus, Edit2 } from 'lucide-react';

export default function AdminSpecialties() {
  const [rules, setRules] = useState<SpecialtyRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState<Partial<SpecialtyRule>>({
    domain: '', specialty: '', rule_reference: '', version: '1.0'
  });

  const fetchRules = async () => {
    setLoading(true);
    try {
      const data = await adminService.getSpecialtyRules();
      setRules(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await adminService.updateSpecialtyRule(editingId, formData);
      } else {
        await adminService.addSpecialtyRule(formData);
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ domain: '', specialty: '', rule_reference: '', version: '1.0' });
      fetchRules();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (r: SpecialtyRule) => {
    setEditingId(r.id);
    setFormData(r);
    setShowForm(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-blue-600" />
            Specialty Mappings
          </h1>
          <p className="mt-1 text-slate-500 text-sm">Manage clinical rules mapping conditions to specialties.</p>
        </div>
        {!showForm && (
          <button 
            onClick={() => { setEditingId(null); setFormData({ domain: '', specialty: '', rule_reference: '', version: '1.0' }); setShowForm(true); }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Rule
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Domain</label>
                <input required type="text" value={formData.domain} onChange={e => setFormData({...formData, domain: e.target.value})} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="e.g. Metabolic" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Target Specialty</label>
                <input required type="text" value={formData.specialty} onChange={e => setFormData({...formData, specialty: e.target.value})} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="e.g. Endocrinology" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Clinical Rule Reference</label>
                <input required type="text" value={formData.rule_reference} onChange={e => setFormData({...formData, rule_reference: e.target.value})} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Rule or guidelines mapping this domain" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Version</label>
                <input required type="text" value={formData.version} onChange={e => setFormData({...formData, version: e.target.value})} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50">Cancel</button>
              <button type="submit" className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">Save Rule</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                <th className="px-6 py-4 font-medium">Domain</th>
                <th className="px-6 py-4 font-medium">Specialty</th>
                <th className="px-6 py-4 font-medium">Reference</th>
                <th className="px-6 py-4 font-medium">Version</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Loading rules...</td></tr>
              ) : rules.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No specialty rules found.</td></tr>
              ) : (
                rules.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900 text-sm">{r.domain}</td>
                    <td className="px-6 py-4 text-blue-600 font-medium text-sm">{r.specialty}</td>
                    <td className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate">{r.rule_reference}</td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-500">v{r.version}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleEdit(r)} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-indigo-50 transition-colors"><Edit2 className="w-4 h-4" /></button>
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
