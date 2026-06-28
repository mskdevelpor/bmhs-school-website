import { useState } from 'react';
import { BookOpen, Plus, Users, GraduationCap, Eye, CheckCircle2 } from 'lucide-react';
import { Card, Badge, SectionHeader } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Common';
import { Modal } from '@/components/ui/Modal';
import { classes, subjects, teachers, getStudentsByClass, getTeacherById, SCHOOL } from '@/data/mockData';

export function ClassesPage() {
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const cls = selectedClass ? classes.find((c) => c.id === selectedClass) : null;
  const classStudents = cls ? getStudentsByClass(cls.id) : [];
  const classSubjects = subjects.filter((s) => s.classId === cls?.id);
  const classTeacher = cls?.classTeacherId ? getTeacherById(cls.classTeacherId) : null;

  return (
    <div className="space-y-5">
      <SectionHeader title="Classes & Subjects" subtitle={`${classes.length} classes • ${subjects.length} subjects`}
        action={<button onClick={() => setShowForm(true)} className="btn-primary"><Plus size={16} /> Add Class</button>} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {classes.map((c) => {
          const studentCount = getStudentsByClass(c.id).length;
          const teacher = c.classTeacherId ? getTeacherById(c.classTeacherId) : null;
          return (
            <Card key={c.id} hover className="p-5 cursor-pointer" >
              <div onClick={() => setSelectedClass(c.id)}>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-brand-50 text-brand-600"><BookOpen size={20} /></div>
                  <Badge variant="brand">{c.level}</Badge>
                </div>
                <h3 className="font-bold font-display text-slate-900">{c.name}</h3>
                <p className="text-sm text-slate-500 mt-0.5">Room {c.room} • Capacity {c.capacity}</p>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-slate-600"><Users size={14} /> {studentCount} students</span>
                  {teacher && <span className="flex items-center gap-1.5 text-slate-600"><GraduationCap size={14} /> {teacher.name.split(' ').slice(-1)[0]}</span>}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Class detail modal */}
      {cls && (
        <Modal open onClose={() => setSelectedClass(null)} title={cls.name} subtitle={`Room ${cls.room} • Sections: ${cls.sections.join(', ')}`} size="lg"
          footer={<button onClick={() => setSelectedClass(null)} className="btn-secondary">Close</button>}>
          {classTeacher && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 mb-5">
              <Avatar name={classTeacher.name} size="md" />
              <div><p className="font-medium text-slate-800">{classTeacher.name}</p><p className="text-sm text-slate-500">Class Teacher • {classTeacher.qualification}</p></div>
            </div>
          )}

          <h4 className="font-semibold text-slate-900 mb-3">Subjects ({classSubjects.length})</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
            {classSubjects.length > 0 ? classSubjects.map((s) => {
              const teacher = getTeacherById(s.teacherId);
              return (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                  <div><p className="text-sm font-medium text-slate-800">{s.name}</p><p className="text-xs text-slate-500">{s.code} • {teacher?.name || 'Unassigned'}</p></div>
                  <Badge variant="neutral">{s.fullMarks} marks</Badge>
                </div>
              );
            }) : <p className="text-sm text-slate-500">No subjects assigned yet.</p>}
          </div>

          <h4 className="font-semibold text-slate-900 mb-3">Students ({classStudents.length})</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {classStudents.slice(0, 10).map((s) => (
              <div key={s.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
                <Avatar name={s.name} size="sm" />
                <div><p className="text-sm font-medium text-slate-800">{s.name}</p><p className="text-xs text-slate-500">{s.rollNo}</p></div>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {showForm && (
        <Modal open onClose={() => setShowForm(false)} title="Add New Class" subtitle="Create a new class" size="md"
          footer={<><button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button><button onClick={() => setShowForm(false)} className="btn-primary"><CheckCircle2 size={16} /> Add Class</button></>}>
          <div className="space-y-4">
            <div><label className="label">Class Name</label><input className="input" placeholder="e.g. Class 9" /></div>
            <div><label className="label">Level</label><select className="input"><option>Primary</option><option>Middle</option><option>Secondary</option></select></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Room</label><input className="input" placeholder="e.g. 3-01" /></div>
              <div><label className="label">Capacity</label><input type="number" className="input" placeholder="30" /></div>
            </div>
            <div><label className="label">Class Teacher</label><select className="input"><option value="">Select teacher...</option>{teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
            <div><label className="label">Sections (comma separated)</label><input className="input" placeholder="A, B" /></div>
          </div>
        </Modal>
      )}
    </div>
  );
}
