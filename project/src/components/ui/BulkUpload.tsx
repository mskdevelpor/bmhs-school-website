import { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, Download, CheckCircle2, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Card, Badge } from '@/components/ui/Card';

interface BulkUploadProps {
  open: boolean;
  onClose: () => void;
  onUpload: (data: Record<string, string>[]) => void;
  templateFields: { key: string; label: string; required?: boolean }[];
  entityName: string;
}

export function BulkUpload({ open, onClose, onUpload, templateFields, entityName }: BulkUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<Record<string, string>[]>([]);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload');
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File) {
    setError('');
    setFile(f);
    if (!f.name.endsWith('.csv')) {
      setError('Please upload a CSV file. You can save Excel as CSV.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter((l) => l.trim());
      if (lines.length < 2) { setError('File is empty or has no data rows.'); return; }
      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const rows: Record<string, string>[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => { row[h] = (values[idx] || '').trim(); });
        rows.push(row);
      }
      setParsed(rows);
      setStep('preview');
    };
    reader.readAsText(f);
  }

  function downloadTemplate() {
    const headers = templateFields.map((f) => f.label).join(',');
    const sampleRow = templateFields.map((f) => {
      if (f.key === 'name') return 'Ahmed Khan';
      if (f.key === 'rollNo') return '1-001';
      if (f.key === 'gender') return 'Male';
      if (f.key === 'dob') return '2015-05-15';
      if (f.key === 'classId') return 'Class 1';
      if (f.key === 'section') return 'A';
      if (f.key === 'phone') return '0300 1234567';
      if (f.key === 'email') return 'student@bmhs.edu.pk';
      if (f.key === 'address') return 'House 1, Madina Colony, Ellah Abad';
      if (f.key === 'parentName') return 'Khan Ahmed';
      if (f.key === 'parentPhone') return '0301 1234567';
      return '';
    }).join(',');
    const csv = `${headers}\n${sampleRow}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entityName.toLowerCase()}-template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function reset() {
    setFile(null); setParsed([]); setError(''); setStep('upload');
    if (inputRef.current) inputRef.current.value = '';
  }

  function handleClose() {
    reset();
    onClose();
  }

  function confirmUpload() {
    onUpload(parsed);
    setStep('done');
  }

  return (
    <Modal open={open} onClose={handleClose} title={`Bulk Upload ${entityName}`} subtitle="Upload multiple records via CSV file" size="lg"
      footer={
        step === 'upload' ? (
          <><button onClick={handleClose} className="btn-secondary">Cancel</button>
          <button onClick={downloadTemplate} className="btn-secondary"><Download size={16} /> Download Template</button></>
        ) : step === 'preview' ? (
          <><button onClick={reset} className="btn-secondary">Back</button>
          <button onClick={confirmUpload} className="btn-primary"><CheckCircle2 size={16} /> Import {parsed.length} Records</button></>
        ) : (
          <button onClick={handleClose} className="btn-primary">Done</button>
        )
      }>
      {step === 'upload' && (
        <div>
          <p className="text-sm text-slate-600 mb-4">
            Upload a CSV file with {entityName.toLowerCase()} data. Download the template to see the required format.
            You can create this in Excel and save as CSV.
          </p>
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
            className="border-2 border-dashed border-slate-300 rounded-2xl p-10 text-center cursor-pointer hover:border-brand-400 hover:bg-brand-50/30 transition-all"
          >
            <div className="inline-block p-4 rounded-2xl bg-slate-50 text-slate-400 mb-4"><UploadCloud size={32} /></div>
            <p className="text-sm font-medium text-slate-700">Click to browse or drag & drop CSV file here</p>
            <p className="text-xs text-slate-400 mt-1">Maximum 5,000 rows per upload</p>
          </div>
          <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
          <div className="mt-4 p-3 rounded-xl bg-blue-50 text-sm text-blue-700">
            <p className="font-medium mb-1">Required fields:</p>
            <p className="text-xs">{templateFields.map((f) => f.label + (f.required ? '*' : '')).join(', ')}</p>
          </div>
        </div>
      )}

      {step === 'preview' && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <FileSpreadsheet size={18} className="text-brand-600" />
            <span className="text-sm font-medium text-slate-700">{file?.name}</span>
            <Badge variant="brand">{parsed.length} rows</Badge>
          </div>
          <div className="overflow-x-auto scrollbar-thin max-h-80 rounded-xl border border-slate-200">
            <table className="w-full">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="table-header py-2 px-3">#</th>
                  {templateFields.map((f) => <th key={f.key} className="table-header py-2 px-3">{f.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {parsed.slice(0, 50).map((row, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    <td className="table-cell py-2 px-3 text-slate-400">{i + 1}</td>
                    {templateFields.map((f) => <td key={f.key} className="table-cell py-2 px-3">{row[f.key] || row[f.label.toLowerCase()] || '—'}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {parsed.length > 50 && <p className="mt-2 text-xs text-slate-400">Showing first 50 of {parsed.length} rows</p>}
        </div>
      )}

      {step === 'done' && (
        <div className="text-center py-8">
          <div className="inline-block p-4 rounded-2xl bg-brand-50 text-brand-600 mb-4"><CheckCircle2 size={40} /></div>
          <h3 className="text-lg font-bold font-display text-slate-900">Import Complete!</h3>
          <p className="mt-1 text-sm text-slate-500">{parsed.length} {entityName.toLowerCase()} records have been imported successfully.</p>
        </div>
      )}
    </Modal>
  );
}
