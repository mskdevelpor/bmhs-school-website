import { useState } from 'react';
import { CalendarDays, Clock, BookOpen } from 'lucide-react';
import { Card, Badge, SectionHeader } from '@/components/ui/Card';
import { Select } from '@/components/ui/Common';
import { timetable, classes, getSubjectById, getTeacherById, SCHOOL } from '@/data/mockData';
import { cn } from '@/lib/utils';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
const periodTimes = ['08:00 - 08:45', '08:45 - 09:30', '09:30 - 10:15', '10:15 - 11:00', '11:00 - 11:45', '11:45 - 12:30'];

export function TimetablePage() {
  const [classId, setClassId] = useState(classes[0].id);

  const classTimetable = timetable.filter((t) => t.classId === classId);

  return (
    <div className="space-y-5">
      <SectionHeader title="Timetable" subtitle={`Weekly schedule • Session ${SCHOOL.currentSession}`}
        action={<Select value={classId} onChange={setClassId} options={classes.map((c) => ({ value: c.id, label: c.name }))} className="w-40" />} />

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays size={20} className="text-brand-600" />
          <h3 className="font-semibold text-slate-900">{classes.find((c) => c.id === classId)?.name} — Weekly Timetable</h3>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr>
                <th className="table-header py-3 px-3 w-32">Period</th>
                {days.map((d) => <th key={d} className="table-header py-3 px-3 text-center">{d.slice(0, 3)}</th>)}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5, 6].map((period, pi) => (
                <tr key={period} className="border-b border-slate-50">
                  <td className="py-2 px-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-700">Period {period}</span>
                      <span className="text-xs text-slate-400 flex items-center gap-1"><Clock size={10} /> {periodTimes[pi]}</span>
                    </div>
                  </td>
                  {days.map((day) => {
                    const slot = classTimetable.find((t) => t.day === day && t.period === period);
                    const subject = slot ? getSubjectById(slot.subjectId) : null;
                    const teacher = slot ? getTeacherById(slot.teacherId) : null;
                    return (
                      <td key={day} className="py-2 px-1.5">
                        {subject ? (
                          <div className={cn('p-2.5 rounded-xl text-center transition-all hover:scale-105 cursor-default',
                            'bg-brand-50 border border-brand-100')}>
                            <p className="text-sm font-semibold text-brand-700">{subject.name}</p>
                            <p className="text-xs text-brand-600 mt-0.5">{teacher?.name.split(' ').slice(-1)[0]}</p>
                          </div>
                        ) : (
                          <div className="p-2.5 rounded-xl text-center bg-slate-50 border border-slate-100">
                            <p className="text-xs text-slate-400">Free</p>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Legend */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={16} className="text-slate-500" />
          <h4 className="text-sm font-semibold text-slate-700">Subjects Legend</h4>
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from(new Set(classTimetable.map((t) => t.subjectId))).map((sid) => {
            const subject = getSubjectById(sid);
            if (!subject) return null;
            return <Badge key={sid} variant="brand">{subject.name} ({subject.code})</Badge>;
          })}
        </div>
      </Card>
    </div>
  );
}
