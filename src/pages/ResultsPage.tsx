import { useState, useMemo } from 'react';
import { ClipboardList, Eye, Download, Award, TrendingUp, BookOpen, CheckCircle2 } from 'lucide-react';
import { Card, Badge, SectionHeader, StatCard } from '@/components/ui/Card';
import { Avatar, Select, EmptyState } from '@/components/ui/Common';
import { Modal } from '@/components/ui/Modal';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { exams, examResults, students, getStudentById, getClassById, getSubjectById, calcGrade, SCHOOL } from '@/data/mockData';
import type { ExamResult, Student } from '@/types';
import { cn } from '@/lib/utils';

const gradeVariant: Record<string, 'success' | 'warning' | 'danger' | 'neutral' | 'info'> = {
  'A+': 'success', A: 'success', B: 'info', C: 'neutral', D: 'warning', E: 'warning', F: 'danger',
};

export function ResultsPage() {
  const [examId, setExamId] = useState(exams[0].id);
  const [classFilter, setClassFilter] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Build student results summary
  const studentSummaries = useMemo(() => {
    return students.slice(0, 24).map((s) => {
      const results = examResults.filter((r) => r.studentId === s.id && r.examId === examId);
      const totalMarks = results.reduce((sum, r) => sum + r.marks, 0);
      const maxMarks = results.reduce((sum, r) => sum + (getSubjectById(r.subjectId)?.fullMarks || 100), 0);
      const percentage = maxMarks > 0 ? Math.round((totalMarks / maxMarks) * 100) : 0;
      const passed = results.every((r) => r.marks >= (getSubjectById(r.subjectId)?.passingMarks || 33));
      return { student: s, results, totalMarks, maxMarks, percentage, passed, grade: calcGrade(percentage) };
    }).filter((item) => !classFilter || item.student.classId === classFilter);
  }, [examId, classFilter]);

  const avgScore = studentSummaries.length > 0 ? Math.round(studentSummaries.reduce((s, i) => s + i.percentage, 0) / studentSummaries.length) : 0;
  const topScorer = studentSummaries.sort((a, b) => b.percentage - a.percentage)[0];
  const passRate = studentSummaries.length > 0 ? Math.round((studentSummaries.filter((i) => i.passed).length / studentSummaries.length) * 100) : 0;

  const columns: Column<typeof studentSummaries[0]>[] = [
    { key: 'rank', header: 'Rank', render: (r) => { const idx = studentSummaries.findIndex((s) => s.student.id === r.student.id); return <span className="font-bold text-slate-400">{idx + 1}</span>; } },
    { key: 'name', header: 'Student', sortable: true, sortValue: (r) => r.student.name, render: (r) => (
      <div className="flex items-center gap-3"><Avatar name={r.student.name} size="sm" /><div><p className="font-medium text-slate-800">{r.student.name}</p><p className="text-xs text-slate-500">{r.student.rollNo}</p></div></div>) },
    { key: 'class', header: 'Class', render: (r) => <span className="text-slate-600">{getClassById(r.student.classId)?.name}</span> },
    { key: 'total', header: 'Total Marks', sortable: true, sortValue: (r) => r.totalMarks, render: (r) => <span className="font-medium text-slate-800">{r.totalMarks}/{r.maxMarks}</span> },
    { key: 'percentage', header: 'Percentage', sortable: true, sortValue: (r) => r.percentage, render: (r) => <span className="font-bold text-brand-600">{r.percentage}%</span> },
    { key: 'grade', header: 'Grade', render: (r) => <Badge variant={gradeVariant[r.grade] || 'neutral'}>{r.grade}</Badge> },
    { key: 'status', header: 'Status', render: (r) => <Badge variant={r.passed ? 'success' : 'danger'}>{r.passed ? 'Pass' : 'Fail'}</Badge> },
    { key: 'actions', header: '', className: 'text-right', render: (r) => (
      <button onClick={(e) => { e.stopPropagation(); setSelectedStudent(r.student); }} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"><Eye size={16} /></button>) },
  ];

  return (
    <div className="space-y-5">
      <SectionHeader title="Results & Exams" subtitle={`${SCHOOL.currentTerm} • Session ${SCHOOL.currentSession}`}
        action={<button className="btn-secondary"><Download size={16} /> Export Results</button>} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Average Score" value={`${avgScore}%`} icon={<TrendingUp size={22} />} color="brand" />
        <StatCard label="Pass Rate" value={`${passRate}%`} icon={<CheckCircle2 size={22} />} color="brand" />
        <StatCard label="Top Scorer" value={topScorer ? `${topScorer.percentage}%` : '—'} icon={<Award size={22} />} color="amber" />
        <StatCard label="Total Exams" value={exams.length} icon={<ClipboardList size={22} />} color="blue" />
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={examId} onChange={setExamId} options={exams.map((e) => ({ value: e.id, label: e.name }))} className="sm:w-56" />
          <Select value={classFilter} onChange={setClassFilter} placeholder="All Classes" options={Array.from(new Set(students.map((s) => s.classId))).map((id) => ({ value: id, label: getClassById(id)?.name || id }))} className="sm:w-40" />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <DataTable columns={columns as Column<unknown>[]} data={studentSummaries as unknown[]} rowKey={(r) => (r as { student: Student }).student.id} onRowClick={(r) => setSelectedStudent((r as { student: Student }).student)}
          emptyState={<EmptyState icon={<ClipboardList size={28} />} title="No results found" description="Try selecting a different exam or class." />} />
      </Card>

      {selectedStudent && <ReportCard student={selectedStudent} examId={examId} onClose={() => setSelectedStudent(null)} />}
    </div>
  );
}

function ReportCard({ student, examId, onClose }: { student: Student; examId: string; onClose: () => void }) {
  const cls = getClassById(student.classId);
  const results = examResults.filter((r) => r.studentId === student.id && r.examId === examId);
  const totalMarks = results.reduce((s, r) => s + r.marks, 0);
  const maxMarks = results.reduce((s, r) => s + (getSubjectById(r.subjectId)?.fullMarks || 100), 0);
  const percentage = maxMarks > 0 ? Math.round((totalMarks / maxMarks) * 100) : 0;
  const grade = calcGrade(percentage);
  const passed = results.every((r) => r.marks >= (getSubjectById(r.subjectId)?.passingMarks || 33));

  return (
    <Modal open onClose={onClose} title="Report Card" subtitle={`${student.name} • ${cls?.name}`} size="lg"
      footer={<><button onClick={onClose} className="btn-secondary">Close</button><button className="btn-primary"><Download size={16} /> Download</button></>}>
      <div className="text-center pb-5 border-b border-slate-100">
        <div className="inline-block p-4 rounded-2xl bg-brand-50 mb-3"><Award size={32} className="text-brand-600" /></div>
        <h3 className="text-xl font-bold font-display text-slate-900">{student.name}</h3>
        <p className="text-sm text-slate-500">{student.rollNo} • {cls?.name} • Section {student.section}</p>
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
          {results.map((r) => {
            const subject = getSubjectById(r.subjectId);
            const passMark = subject?.passingMarks || 33;
            const isPass = r.marks >= passMark;
            return (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white text-slate-500"><BookOpen size={16} /></div>
                  <div><p className="text-sm font-medium text-slate-800">{subject?.name || `Subject ${r.subjectId}`}</p><p className="text-xs text-slate-500">Passing: {passMark}</p></div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn('text-sm font-semibold', isPass ? 'text-slate-800' : 'text-rose-600')}>{r.marks}/{subject?.fullMarks || 100}</span>
                  <Badge variant={gradeVariant[r.grade] || 'neutral'}>{r.grade}</Badge>
                </div>
              </div>
            );
          })}
          {results.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No results recorded for this exam.</p>}
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Total Marks</span>
          <span className="font-bold text-slate-900">{totalMarks} / {maxMarks}</span>
        </div>
        {results[0]?.remarks && <p className="mt-2 text-sm text-slate-600">Remarks: {results[0].remarks}</p>}
      </div>
    </Modal>
  );
}
