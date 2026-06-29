import { useState, useMemo, useEffect, useCallback } from 'react';
import { ClipboardList, Eye, Download, Award, TrendingUp, BookOpen, CheckCircle2, AlertCircle, Trash2, Pencil, Plus } from 'lucide-react';
import { Card, Badge, SectionHeader, StatCard } from '@/components/ui/Card';
import { Avatar, Select, EmptyState } from '@/components/ui/Common';
import { Modal } from '@/components/ui/Modal';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { supabase } from '@/lib/supabase';
import { formatDate, cn } from '@/lib/utils';

// ---- Types ----
// DB row shape (snake_case) coming from the `results` table.
interface ResultRow {
  id: string;
  student_id: string;
  class_id: string | null;
  subject: string;
  term: string;
  total_marks: number;
  obtained_marks: number;
  grade: string | null;
  exam_date: string | null;
}

interface StudentRow {
  id: string;
  name: string;
  roll_no: string;
  class_id: string | null;
}

interface ClassRow {
  id: string;
  name: string;
}

// Frontend-facing shape (camelCase) used by the UI.
interface ResultRecord {
  id: string;
  studentId: string;
  classId: string | null;
  subject: string;
  term: string;
  totalMarks: number;
  obtainedMarks: number;
  grade: string;
  examDate: string | null;
}

interface Student {
  id: string;
  name: string;
  rollNo: string;
  classId: string | null;
}

interface ClassInfo {
  id: string;
  name: string;
}

// Per-student summary aggregated across their result rows.
interface StudentSummary {
  student: Student;
  results: ResultRecord[];
  totalMarks: number;
  maxMarks: number;
  percentage: number;
  passed: boolean;
  grade: string;
}

const gradeVariant: Record<string, 'success' | 'warning' | 'danger' | 'neutral' | 'info'> = {
  'A+': 'success', A: 'success', B: 'info', C: 'neutral', D: 'warning', E: 'warning', F: 'danger',
};

const TERMS = ['Term 1', 'Term 2', 'Term 3', 'Annual'];
const PASSING_PERCENT = 33;

function calcGrade(percentage: number): string {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  if (percentage >= 33) return 'E';
  return 'F';
}

// ---- Mappers (snake_case -> camelCase) ----
function mapResult(r: ResultRow): ResultRecord {
  return {
    id: r.id,
    studentId: r.student_id,
    classId: r.class_id,
    subject: r.subject,
    term: r.term,
    totalMarks: Number(r.total_marks),
    obtainedMarks: Number(r.obtained_marks),
    grade: r.grade || calcGrade(Number(r.total_marks) > 0 ? (Number(r.obtained_marks) / Number(r.total_marks)) * 100 : 0),
    examDate: r.exam_date,
  };
}

function mapStudent(r: StudentRow): Student {
  return { id: r.id, name: r.name, rollNo: r.roll_no, classId: r.class_id };
}

function mapClass(r: ClassRow): ClassInfo {
  return { id: r.id, name: r.name };
}

export function ResultsPage() {
  const [termFilter, setTermFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ResultRecord | null>(null);

  const [results, setResults] = useState<ResultRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getStudentById = useCallback((id: string) => students.find((s) => s.id === id), [students]);
  const getClassById = useCallback((id: string | null) => classes.find((c) => c.id === id), [classes]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [resultsRes, studentsRes, classesRes] = await Promise.all([
        supabase.from('results').select('id, student_id, class_id, subject, term, total_marks, obtained_marks, grade, exam_date'),
        supabase.from('students').select('id, name, roll_no, class_id'),
        supabase.from('classes').select('id, name'),
      ]);

      if (resultsRes.error) throw resultsRes.error;
      if (studentsRes.error) throw studentsRes.error;
      if (classesRes.error) throw classesRes.error;

      setResults((resultsRes.data as ResultRow[]).map(mapResult));
      setStudents((studentsRes.data as StudentRow[]).map(mapStudent));
      setClasses((classesRes.data as ClassRow[]).map(mapClass));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load results data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Build per-student results summary, filtered by term and class.
  const studentSummaries = useMemo<StudentSummary[]>(() => {
    const filtered = results.filter((r) => {
      const matchTerm = !termFilter || r.term === termFilter;
      const student = getStudentById(r.studentId);
      const matchClass = !classFilter || (student?.classId ?? null) === classFilter;
      return matchTerm && matchClass;
    });

    const byStudent = new Map<string, ResultRecord[]>();
    for (const r of filtered) {
      const arr = byStudent.get(r.studentId) || [];
      arr.push(r);
      byStudent.set(r.studentId, arr);
    }

    const summaries: StudentSummary[] = [];
    for (const [studentId, studentResults] of byStudent) {
      const student = getStudentById(studentId);
      if (!student) continue;
      const totalMarks = studentResults.reduce((sum, r) => sum + r.obtainedMarks, 0);
      const maxMarks = studentResults.reduce((sum, r) => sum + r.totalMarks, 0);
      const percentage = maxMarks > 0 ? Math.round((totalMarks / maxMarks) * 100) : 0;
      const passed = studentResults.length > 0 && studentResults.every((r) => r.totalMarks > 0 && (r.obtainedMarks / r.totalMarks) * 100 >= PASSING_PERCENT);
      summaries.push({ student, results: studentResults, totalMarks, maxMarks, percentage, passed, grade: calcGrade(percentage) });
    }
    return summaries.sort((a, b) => b.percentage - a.percentage);
  }, [results, termFilter, classFilter, getStudentById]);

  const avgScore = studentSummaries.length > 0 ? Math.round(studentSummaries.reduce((s, i) => s + i.percentage, 0) / studentSummaries.length) : 0;
  const topScorer = studentSummaries[0];
  const passRate = studentSummaries.length > 0 ? Math.round((studentSummaries.filter((i) => i.passed).length / studentSummaries.length) * 100) : 0;
  const totalExams = new Set(results.map((r) => r.term)).size;

  async function handleDelete(id: string) {
    if (!confirm('Delete this result record? This cannot be undone.')) return;
    const { error: delError } = await supabase.from('results').delete().eq('id', id);
    if (delError) {
      setError(delError.message);
      return;
    }
    await fetchData();
  }

  function openEdit(record: ResultRecord) {
    setEditing(record);
    setShowForm(true);
  }

  function openAdd() {
    setEditing(null);
    setShowForm(true);
  }

  const columns: Column<StudentSummary>[] = [
    { key: 'rank', header: 'Rank', render: (r) => { const idx = studentSummaries.findIndex((s) => s.student.id === r.student.id); return <span className="font-bold text-slate-400">{idx + 1}</span>; } },
    { key: 'name', header: 'Student', sortable: true, sortValue: (r) => r.student.name, render: (r) => (
      <div className="flex items-center gap-3"><Avatar name={r.student.name} size="sm" /><div><p className="font-medium text-slate-800">{r.student.name}</p><p className="text-xs text-slate-500">{r.student.rollNo}</p></div></div>) },
    { key: 'class', header: 'Class', render: (r) => <span className="text-slate-600">{getClassById(r.student.classId)?.name || '—'}</span> },
    { key: 'total', header: 'Total Marks', sortable: true, sortValue: (r) => r.totalMarks, render: (r) => <span className="font-medium text-slate-800">{r.totalMarks}/{r.maxMarks}</span> },
    { key: 'percentage', header: 'Percentage', sortable: true, sortValue: (r) => r.percentage, render: (r) => <span className="font-bold text-brand-600">{r.percentage}%</span> },
    { key: 'grade', header: 'Grade', render: (r) => <Badge variant={gradeVariant[r.grade] || 'neutral'}>{r.grade}</Badge> },
    { key: 'status', header: 'Status', render: (r) => <Badge variant={r.passed ? 'success' : 'danger'}>{r.passed ? 'Pass' : 'Fail'}</Badge> },
    { key: 'actions', header: '', className: 'text-right', render: (r) => (
      <button onClick={(e) => { e.stopPropagation(); setSelectedStudent(r.student); }} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"><Eye size={16} /></button>) },
  ];

  return (
    <div className="space-y-5">
      <SectionHeader title="Results & Exams" subtitle="Track student performance and grades"
        action={<><button className="btn-secondary"><Download size={16} /> Export Results</button><button onClick={openAdd} className="btn-primary"><Plus size={16} /> Add Result</button></>} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Average Score" value={`${avgScore}%`} icon={<TrendingUp size={22} />} color="brand" />
        <StatCard label="Pass Rate" value={`${passRate}%`} icon={<CheckCircle2 size={22} />} color="brand" />
        <StatCard label="Top Scorer" value={topScorer ? `${topScorer.percentage}%` : '—'} icon={<Award size={22} />} color="amber" />
        <StatCard label="Total Exams" value={totalExams} icon={<ClipboardList size={22} />} color="blue" />
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={termFilter} onChange={setTermFilter} placeholder="All Terms" options={TERMS.map((t) => ({ value: t, label: t }))} className="sm:w-56" />
          <Select value={classFilter} onChange={setClassFilter} placeholder="All Classes" options={classes.map((c) => ({ value: c.id, label: c.name }))} className="sm:w-40" />
        </div>
      </Card>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-rose-50 text-rose-700 text-sm">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-rose-500 hover:text-rose-700">Dismiss</button>
        </div>
      )}

      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
            <span className="ml-3 text-sm">Loading results...</span>
          </div>
        ) : (
          <DataTable columns={columns as Column<unknown>[]} data={studentSummaries as unknown[]} rowKey={(r) => (r as { student: Student }).student.id} onRowClick={(r) => setSelectedStudent((r as { student: Student }).student)}
            emptyState={<EmptyState icon={<ClipboardList size={28} />} title="No results found" description="Try selecting a different term or class, or add a new result." />} />
        )}
      </Card>

      {selectedStudent && <ReportCard student={selectedStudent} termFilter={termFilter} students={students} classes={classes} results={results} onClose={() => setSelectedStudent(null)} onEdit={openEdit} onDelete={handleDelete} />}
      {showForm && <ResultForm editing={editing} students={students} classes={classes} onClose={() => { setShowForm(false); setEditing(null); }} onSaved={fetchData} />}
    </div>
  );
}

function ReportCard({ student, termFilter, results, classes, onClose, onEdit, onDelete }: {
  student: Student;
  termFilter: string;
  students: Student[];
  classes: ClassInfo[];
  results: ResultRecord[];
  onClose: () => void;
  onEdit: (record: ResultRecord) => void;
  onDelete: (id: string) => void;
}) {
  const cls = classes.find((c) => c.id === student.classId);
  const studentResults = results.filter((r) => r.studentId === student.id && (!termFilter || r.term === termFilter));
  const totalMarks = studentResults.reduce((s, r) => s + r.obtainedMarks, 0);
  const maxMarks = studentResults.reduce((s, r) => s + r.totalMarks, 0);
  const percentage = maxMarks > 0 ? Math.round((totalMarks / maxMarks) * 100) : 0;
  const grade = calcGrade(percentage);
  const passed = studentResults.length > 0 && studentResults.every((r) => r.totalMarks > 0 && (r.obtainedMarks / r.totalMarks) * 100 >= PASSING_PERCENT);

  return (
    <Modal open onClose={onClose} title="Report Card" subtitle={`${student.name} • ${cls?.name || '—'}`} size="lg"
      footer={<><button onClick={onClose} className="btn-secondary">Close</button><button className="btn-primary"><Download size={16} /> Download</button></>}>
      <div className="text-center pb-5 border-b border-slate-100">
        <div className="inline-block p-4 rounded-2xl bg-brand-50 mb-3"><Award size={32} className="text-brand-600" /></div>
        <h3 className="text-xl font-bold font-display text-slate-900">{student.name}</h3>
        <p className="text-sm text-slate-500">{student.rollNo} • {cls?.name || '—'}</p>
        <div className="mt-3 flex items-center justify-center gap-4">
          <div><p className="text-3xl font-bold font-display text-brand-600">{percentage}%</p><p className="text-xs text-slate-500">Percentage</p></div>
          <div className="w-px h-10 bg-slate-200" />
          <div><p className="text-3xl font-bold font-display text-slate-900">{grade}</p><p className="text-xs text-slate-500">Grade</p></div>
          <div className="w-px h-10 bg-slate-200" />
          <div><Badge variant={passed ? 'success' : 'danger'}>{passed ? 'PASSED' : 'FAILED'}</Badge></div>
        </div>
      </div>

      <div className="py-5">
        <h4 className="font-semibold text-slate-900 mb-3">Subject-wise Results</h4>
        <div className="space-y-2">
          {studentResults.map((r) => {
            const isPass = r.totalMarks > 0 && (r.obtainedMarks / r.totalMarks) * 100 >= PASSING_PERCENT;
            return (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white text-slate-500"><BookOpen size={16} /></div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{r.subject}</p>
                    <p className="text-xs text-slate-500">Term: {r.term}{r.examDate ? ` • ${formatDate(r.examDate)}` : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn('text-sm font-semibold', isPass ? 'text-slate-800' : 'text-rose-600')}>{r.obtainedMarks}/{r.totalMarks}</span>
                  <Badge variant={gradeVariant[r.grade] || 'neutral'}>{r.grade}</Badge>
                  <button onClick={() => onEdit(r)} className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors" title="Edit"><Pencil size={14} /></button>
                  <button onClick={() => onDelete(r.id)} className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors" title="Delete"><Trash2 size={14} /></button>
                </div>
              </div>
            );
          })}
          {studentResults.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No results recorded for this student.</p>}
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Total Marks</span>
          <span className="font-bold text-slate-900">{totalMarks} / {maxMarks}</span>
        </div>
      </div>
    </Modal>
  );
}

function ResultForm({ editing, students, classes, onClose, onSaved }: {
  editing: ResultRecord | null;
  students: Student[];
  classes: ClassInfo[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [studentId, setStudentId] = useState<string>(editing?.studentId || '');
  const [classId, setClassId] = useState<string>(editing?.classId || '');
  const [subject, setSubject] = useState<string>(editing?.subject || '');
  const [term, setTerm] = useState<string>(editing?.term || TERMS[0]);
  const [totalMarks, setTotalMarks] = useState<string>(editing ? String(editing.totalMarks) : '100');
  const [obtainedMarks, setObtainedMarks] = useState<string>(editing ? String(editing.obtainedMarks) : '');
  const [examDate, setExamDate] = useState<string>(editing?.examDate || '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // When a student is chosen, default the class to that student's class.
  useEffect(() => {
    if (studentId) {
      const s = students.find((st) => st.id === studentId);
      if (s?.classId && !classId) setClassId(s.classId);
    }
  }, [studentId, students, classId]);

  async function handleSave() {
    if (!studentId) { setErr('Select a student'); return; }
    if (!subject.trim()) { setErr('Enter a subject'); return; }
    const total = Number(totalMarks);
    const obtained = Number(obtainedMarks);
    if (!total || total <= 0) { setErr('Enter valid total marks'); return; }
    if (isNaN(obtained) || obtained < 0) { setErr('Enter valid obtained marks'); return; }
    if (obtained > total) { setErr('Obtained marks cannot exceed total marks'); return; }

    const percentage = (obtained / total) * 100;
    const grade = calcGrade(percentage);

    const payload = {
      student_id: studentId,
      class_id: classId || null,
      subject: subject.trim(),
      term,
      total_marks: total,
      obtained_marks: obtained,
      grade,
      exam_date: examDate || null,
    };

    setSaving(true);
    setErr(null);
    let res;
    if (editing) {
      res = await supabase.from('results').update(payload).eq('id', editing.id);
    } else {
      res = await supabase.from('results').insert(payload);
    }
    setSaving(false);
    if (res.error) { setErr(res.error.message); return; }
    await onSaved();
    onClose();
  }

  return (
    <Modal open onClose={onClose} title={editing ? 'Edit Result' : 'Add Result'} size="md"
      footer={<><button onClick={onClose} className="btn-secondary">Cancel</button><button onClick={handleSave} disabled={saving} className="btn-primary"><CheckCircle2 size={16} /> {saving ? 'Saving...' : 'Save'}</button></>}>
      <div className="space-y-4">
        {err && <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 text-rose-700 text-sm"><AlertCircle size={16} /><span>{err}</span></div>}
        <div>
          <label className="label">Student</label>
          <select className="input" value={studentId} onChange={(e) => setStudentId(e.target.value)} disabled={!!editing}>
            <option value="">Choose student...</option>
            {students.map((s) => {
              const cls = classes.find((c) => c.id === s.classId);
              return <option key={s.id} value={s.id}>{s.name} ({s.rollNo}){cls ? ` • ${cls.name}` : ''}</option>;
            })}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Class</label>
            <select className="input" value={classId} onChange={(e) => setClassId(e.target.value)}>
              <option value="">—</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div><label className="label">Term</label>
            <select className="input" value={term} onChange={(e) => setTerm(e.target.value)}>{TERMS.map((t) => <option key={t} value={t}>{t}</option>)}</select>
          </div>
        </div>
        <div><label className="label">Subject</label><input type="text" className="input" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Mathematics" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Total Marks</label><input type="number" className="input" value={totalMarks} onChange={(e) => setTotalMarks(e.target.value)} placeholder="100" /></div>
          <div><label className="label">Obtained Marks</label><input type="number" className="input" value={obtainedMarks} onChange={(e) => setObtainedMarks(e.target.value)} placeholder="0" /></div>
        </div>
        <div><label className="label">Exam Date</label><input type="date" className="input" value={examDate} onChange={(e) => setExamDate(e.target.value)} /></div>
      </div>
    </Modal>
  );
}
