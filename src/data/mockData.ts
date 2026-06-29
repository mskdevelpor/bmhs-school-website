// Mock data layer for Bismillah Model School Management System.
// Replace with Supabase/Firebase API calls when backend is connected.
// Component code does not need to change.

import type {
  Student, Teacher, Parent, ClassInfo, Subject, AttendanceRecord,
  FeeInvoice, ExamResult, Exam, TimetableSlot, Announcement,
} from '@/types';

// Auto-calculates current academic session based on month.
// Academic year starts in April (Pakistan standard). Before April = previous year's session.
// e.g. Jan-Mar 2026 → "2025–2026", Apr-Dec 2026 → "2026–2027"
function getCurrentSession(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0 = January
  // If before April (month < 3), we're still in the previous academic year
  const startYear = month < 3 ? year - 1 : year;
  return `${startYear}–${startYear + 1}`;
}

// Auto-calculates current term based on month.
// Term 1: Apr–Sep, Term 2: Oct–Mar
function getCurrentTerm(): string {
  const month = new Date().getMonth();
  return month >= 3 && month <= 8 ? 'Term 1' : 'Term 2';
}

export const SCHOOL = {
  name: 'Bismillah Model High School',
  shortName: 'BMHS',
  tagline: 'Knowledge with Faith • Character with Wisdom',
  address: 'Madina Colony Ellah Abad',
  phone: '0300 7575178',
  email: 'bismillahmodelhighschool@gmail.com',
  website: 'www.bmhs.edu.pk',
  principal: 'Shakeel Ahmad Faisal',
  principalPhone: '0300 7575178',
  established: 2005,
  affiliation: 'Punjab Education Foundation (PEF)',
  currentSession: getCurrentSession(),
  currentTerm: getCurrentTerm(),
};

export const classes: ClassInfo[] = [
  { id: 'c0', name: 'Nursery', level: 'Pre-Primary', sections: ['A'], classTeacherId: 't1', room: 'G-01', capacity: 25, sortOrder: 0 },
  { id: 'c0a', name: 'Play Group', level: 'Pre-Primary', sections: ['A'], classTeacherId: 't2', room: 'G-02', capacity: 25, sortOrder: 1 },
  { id: 'c0b', name: 'Prep', level: 'Pre-Primary', sections: ['A', 'B'], classTeacherId: 't3', room: 'G-03', capacity: 30, sortOrder: 2 },
  { id: 'c1', name: 'Class 1', level: 'Primary', sections: ['A', 'B'], classTeacherId: 't4', room: 'G-04', capacity: 30, sortOrder: 3 },
  { id: 'c2', name: 'Class 2', level: 'Primary', sections: ['A', 'B'], classTeacherId: 't5', room: '1-01', capacity: 30, sortOrder: 4 },
  { id: 'c3', name: 'Class 3', level: 'Primary', sections: ['A', 'B'], classTeacherId: 't6', room: '1-02', capacity: 30, sortOrder: 5 },
  { id: 'c4', name: 'Class 4', level: 'Primary', sections: ['A'], classTeacherId: 't7', room: '1-03', capacity: 30, sortOrder: 6 },
  { id: 'c5', name: 'Class 5', level: 'Primary', sections: ['A'], classTeacherId: 't8', room: '2-01', capacity: 30, sortOrder: 7 },
  { id: 'c6', name: 'Class 6', level: 'Middle', sections: ['A', 'B'], classTeacherId: 't1', room: '2-02', capacity: 35, sortOrder: 8 },
  { id: 'c7', name: 'Class 7', level: 'Middle', sections: ['A', 'B'], classTeacherId: 't2', room: '2-03', capacity: 35, sortOrder: 9 },
  { id: 'c8', name: 'Class 8', level: 'Middle', sections: ['A', 'B'], classTeacherId: 't3', room: '3-01', capacity: 35, sortOrder: 10 },
  { id: 'c9', name: 'Class 9', level: 'High', sections: ['A', 'B'], classTeacherId: 't4', room: '3-02', capacity: 40, sortOrder: 11 },
  { id: 'c10', name: 'Class 10', level: 'High', sections: ['A', 'B'], classTeacherId: 't5', room: '3-03', capacity: 40, sortOrder: 12 },
];

export const subjects: Subject[] = [
  { id: 's1', name: 'Quran', code: 'QRN', classId: 'c1', teacherId: 't1', fullMarks: 100, passingMarks: 33 },
  { id: 's2', name: 'Urdu', code: 'URD', classId: 'c1', teacherId: 't2', fullMarks: 100, passingMarks: 33 },
  { id: 's3', name: 'English', code: 'ENG', classId: 'c1', teacherId: 't3', fullMarks: 100, passingMarks: 33 },
  { id: 's4', name: 'Mathematics', code: 'MTH', classId: 'c1', teacherId: 't4', fullMarks: 100, passingMarks: 33 },
  { id: 's5', name: 'Islamiat', code: 'ISL', classId: 'c1', teacherId: 't5', fullMarks: 100, passingMarks: 33 },
  { id: 's6', name: 'Science', code: 'SCI', classId: 'c1', teacherId: 't6', fullMarks: 100, passingMarks: 33 },
  { id: 's7', name: 'Social Studies', code: 'SOC', classId: 'c1', teacherId: 't7', fullMarks: 100, passingMarks: 33 },
  { id: 's8', name: 'Computer', code: 'CMP', classId: 'c1', teacherId: 't8', fullMarks: 100, passingMarks: 33 },
];

const firstNames = ['Ahmed', 'Ayesha', 'Bilal', 'Fatima', 'Hamza', 'Hira', 'Usman', 'Zainab', 'Ali', 'Maryam', 'Hassan', 'Sana', 'Omar', 'Aisha', 'Khadija', 'Talha', 'Anum', 'Saad', 'Rabia', 'Noor'];
const lastNames = ['Khan', 'Ahmed', 'Malik', 'Sheikh', 'Raza', 'Iqbal', 'Butt', 'Chaudhry', 'Tariq', 'Yousaf', 'Aslam', 'Naseer', 'Akram', 'Sultan'];
const teacherNames = [
  { name: 'Qari Abdul Rahman', subjects: ['Quran', 'Islamiat'], qualification: 'MA Islamic Studies' },
  { name: 'Ms. Ayesha Khan', subjects: ['Urdu'], qualification: 'MA Urdu' },
  { name: 'Ms. Nadia Sheikh', subjects: ['English'], qualification: 'MA English' },
  { name: 'Mr. Imran Yousaf', subjects: ['Mathematics'], qualification: 'MSc Mathematics' },
  { name: 'Mr. Faisal Ahmed', subjects: ['Islamiat'], qualification: 'MA Islamic Studies' },
  { name: 'Ms. Hina Raza', subjects: ['Science'], qualification: 'MSc Biology' },
  { name: 'Mr. Adnan Butt', subjects: ['Social Studies'], qualification: 'MA Political Science' },
  { name: 'Mr. Kamran Malik', subjects: ['Computer'], qualification: 'BS Computer Science' },
];

function pick<T>(arr: T[], i: number): T { return arr[i % arr.length]; }
function rand(seed: number, max: number): number { return Math.floor((seed * 9301 + 49297) % 233280 / 233280 * max); }

export const teachers: Teacher[] = teacherNames.map((t, i) => ({
  id: `t${i + 1}`,
  employeeId: `EMP-${String(i + 1).padStart(3, '0')}`,
  name: t.name,
  gender: t.name.startsWith('Ms.') ? 'Female' : 'Male',
  email: t.name.toLowerCase().replace(/[^a-z]/g, '.').replace(/\.+/g, '.') + '@bmhs.edu.pk',
  phone: `0300 ${String(1000000 + i * 11111).slice(0, 7)}`,
  subjects: t.subjects,
  classId: i < 8 ? `c${i + 1}` : undefined,
  qualification: t.qualification,
  joinDate: `20${15 + i}-0${(i % 9) + 1}-1${i % 9}`,
  salary: 35000 + i * 4000,
  status: i % 7 === 0 ? 'On Leave' : 'Active',
}));

export const parents: Parent[] = Array.from({ length: 15 }, (_, i) => ({
  id: `p${i + 1}`,
  name: `${pick(firstNames, i + 3)} ${pick(lastNames, i + 2)}`,
  relation: i % 3 === 2 ? 'Guardian' : i % 2 === 0 ? 'Father' : 'Mother',
  phone: `0301 ${String(2000000 + i * 12345).slice(0, 7)}`,
  email: `parent${i + 1}@example.com`,
  occupation: pick(['Engineer', 'Doctor', 'Teacher', 'Businessman', 'Accountant', 'Shopkeeper', 'Driver', 'Government Officer'], i),
  address: `House ${10 + i}, Madina Colony, Ellah Abad`,
  studentIds: [`st${i * 2 + 1}`, `st${i * 2 + 2}`],
}));

export const students: Student[] = Array.from({ length: 48 }, (_, i) => {
  const classIdx = i % 8;
  const cls = classes[classIdx];
  return {
    id: `st${i + 1}`,
    rollNo: `${classIdx + 1}-${String(i + 1).padStart(3, '0')}`,
    name: `${pick(firstNames, i)} ${pick(lastNames, i + 1)}`,
    gender: i % 2 === 0 ? 'Male' : 'Female',
    dob: `20${10 + (i % 8)}-0${(i % 12) + 1}-${String((i % 28) + 1).padStart(2, '0')}`,
    classId: cls.id,
    section: pick(cls.sections, i),
    parentId: `p${(i % 15) + 1}`,
    parentName: `${pick(firstNames, i + 3)} ${pick(lastNames, i + 2)}`,
    parentPhone: `0301 ${String(2000000 + i * 12345).slice(0, 7)}`,
    phone: `0302 ${String(3000000 + i * 54321).slice(0, 7)}`,
    email: `student${i + 1}@bmhs.edu.pk`,
    address: `House ${20 + i}, Madina Colony, Ellah Abad`,
    admissionDate: `20${20 + (i % 5)}-0${(i % 9) + 1}-1${i % 9}`,
    status: i % 16 === 0 ? 'Inactive' : 'Active',
    photoUrl: null,
  };
});

const today = new Date();
function dateStr(offset: number): string {
  const d = new Date(today);
  d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0];
}

export const attendance: AttendanceRecord[] = (() => {
  const records: AttendanceRecord[] = [];
  students.slice(0, 24).forEach((s, si) => {
    for (let d = 0; d < 7; d++) {
      const status = rand(si * 7 + d, 10) < 1 ? 'Absent' : rand(si * 7 + d, 10) < 2 ? 'Late' : 'Present';
      records.push({ id: `a${si * 7 + d}`, studentId: s.id, classId: s.classId, date: dateStr(-d), status: status as AttendanceRecord['status'], markedBy: 't1' });
    }
  });
  return records;
})();

export const feeInvoices: FeeInvoice[] = students.map((s, i) => {
  const amount = 2500 + (i % 5) * 500;
  const paid = i % 4 === 0 ? 0 : i % 4 === 1 ? Math.floor(amount / 2) : amount;
  const status: FeeInvoice['status'] = paid === 0 ? (i % 5 === 0 ? 'Overdue' : 'Unpaid') : paid < amount ? 'Partial' : 'Paid';
  return {
    id: `f${i + 1}`, studentId: s.id, term: 'Term 2', amount, paid,
    dueDate: dateStr(rand(i, 20) - 10), status,
    method: paid > 0 ? pick(['Cash', 'Bank', 'Online'], i) : undefined,
    paidDate: paid > 0 ? dateStr(-rand(i, 15)) : undefined,
  };
});

export const exams: Exam[] = [
  { id: 'e1', name: 'First Term Exam', term: 'Term 1', classId: 'c1', startDate: '2025-09-01', endDate: '2025-09-10', status: 'Completed' },
  { id: 'e2', name: 'Mid Term Exam', term: 'Term 2', classId: 'c1', startDate: '2025-12-01', endDate: '2025-12-10', status: 'Completed' },
  { id: 'e3', name: 'Final Term Exam', term: 'Term 2', classId: 'c1', startDate: '2026-02-15', endDate: '2026-02-25', status: 'Scheduled' },
];

function gradeFor(marks: number): string {
  if (marks >= 90) return 'A+';
  if (marks >= 80) return 'A';
  if (marks >= 70) return 'B';
  if (marks >= 60) return 'C';
  if (marks >= 50) return 'D';
  if (marks >= 33) return 'E';
  return 'F';
}

export const examResults: ExamResult[] = (() => {
  const results: ExamResult[] = [];
  students.slice(0, 24).forEach((s, si) => {
    subjects.slice(0, 6).forEach((sub, sj) => {
      const marks = 40 + rand(si * 6 + sj, 60);
      results.push({ id: `r${si * 6 + sj}`, studentId: s.id, examId: 'e2', subjectId: sub.id, marks, grade: gradeFor(marks), remarks: marks >= 90 ? 'Excellent' : marks >= 60 ? 'Good' : marks >= 33 ? 'Pass' : 'Needs Improvement' });
    });
  });
  return results;
})();

export const timetable: TimetableSlot[] = (() => {
  const days: TimetableSlot['day'][] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const slots: TimetableSlot[] = [];
  const times = ['08:00', '08:45', '09:30', '10:15', '11:00', '11:45', '12:30'];
  days.forEach((day, di) => {
    for (let p = 0; p < 6; p++) {
      slots.push({ id: `tt${di * 6 + p}`, classId: 'c1', day, period: p + 1, startTime: times[p], endTime: times[p + 1] || '13:15', subjectId: `s${(p + di) % 8 + 1}`, teacherId: `t${(p + di) % 8 + 1}` });
    }
  });
  return slots;
})();

export const announcements: Announcement[] = [
  { id: 'n1', title: 'Mid Term Results Announced', content: 'Mid term examination results have been published. Parents can view results in the portal.', audience: 'All', date: dateStr(-1), priority: 'High', category: 'Academic', status: 'Active', createdBy: 'Principal Office', createdAt: new Date().toISOString() },
  { id: 'n2', title: 'Parent-Teacher Meeting', content: 'PTM scheduled for Saturday 10:00 AM. All parents are requested to attend.', audience: 'Parents', date: dateStr(-3), priority: 'Normal', category: 'Event', status: 'Active', createdBy: 'Administration', createdAt: new Date().toISOString() },
  { id: 'n3', title: 'Winter Break', content: 'School will remain closed for winter break from Dec 23 to Jan 3. Classes resume Jan 6.', audience: 'All', date: dateStr(-5), priority: 'Normal', category: 'Holiday', status: 'Active', createdBy: 'Principal Office', createdAt: new Date().toISOString() },
  { id: 'n4', title: 'Quran Competition', content: 'Annual Quran recitation competition on Feb 20. Register with your Quran teacher.', audience: 'Students', date: dateStr(-7), priority: 'Low', category: 'Event', status: 'Active', createdBy: 'Islamic Studies Dept', createdAt: new Date().toISOString() },
  { id: 'n5', title: 'Staff Meeting', content: 'Mandatory staff meeting on Friday 2:00 PM in the staff room.', audience: 'Teachers', date: dateStr(-2), priority: 'Normal', category: 'Staff', status: 'Active', createdBy: 'Principal', createdAt: new Date().toISOString() },
];

export function getStudentById(id: string): Student | undefined { return students.find(s => s.id === id); }
export function getTeacherById(id: string): Teacher | undefined { return teachers.find(t => t.id === id); }
export function getClassById(id: string): ClassInfo | undefined { return classes.find(c => c.id === id); }
export function getSubjectById(id: string): Subject | undefined { return subjects.find(s => s.id === id); }
export function getParentById(id: string): Parent | undefined { return parents.find(p => p.id === id); }
export function getStudentsByClass(classId: string): Student[] { return students.filter(s => s.classId === classId); }
export function getResultsByStudent(studentId: string): ExamResult[] { return examResults.filter(r => r.studentId === studentId); }
export function getFeesByStudent(studentId: string): FeeInvoice[] { return feeInvoices.filter(f => f.studentId === studentId); }
export function getAttendanceByStudent(studentId: string): AttendanceRecord[] { return attendance.filter(a => a.studentId === studentId); }
export function calcGrade(marks: number): string { return gradeFor(marks); }
