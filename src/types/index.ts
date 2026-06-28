// Core domain types for Bismillah Model School Management System.
// Backend-agnostic — when Supabase/Firebase is connected, only the data
// layer (src/data/mockData.ts) needs to change, not any component.

export type Role = 'admin' | 'teacher' | 'parent' | 'student';

export interface Student {
  id: string;
  rollNo: string;
  name: string;
  gender: 'Male' | 'Female';
  dob: string;
  classId: string;
  section: string;
  parentId: string;
  phone: string;
  email: string;
  address: string;
  admissionDate: string;
  status: 'Active' | 'Inactive' | 'Graduated';
  bloodGroup: string;
}

export interface Teacher {
  id: string;
  employeeId: string;
  name: string;
  gender: 'Male' | 'Female';
  email: string;
  phone: string;
  subjects: string[];
  classId?: string;
  qualification: string;
  joinDate: string;
  salary: number;
  status: 'Active' | 'On Leave' | 'Inactive';
}

export interface Parent {
  id: string;
  name: string;
  relation: 'Father' | 'Mother' | 'Guardian';
  phone: string;
  email: string;
  occupation: string;
  address: string;
  studentIds: string[];
}

export interface ClassInfo {
  id: string;
  name: string;
  level: string;
  sections: string[];
  classTeacherId?: string;
  room: string;
  capacity: number;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  classId: string;
  teacherId: string;
  fullMarks: number;
  passingMarks: number;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  classId: string;
  date: string;
  status: 'Present' | 'Absent' | 'Late' | 'Leave';
  markedBy: string;
}

export interface FeeInvoice {
  id: string;
  studentId: string;
  term: string;
  amount: number;
  paid: number;
  dueDate: string;
  status: 'Paid' | 'Partial' | 'Unpaid' | 'Overdue';
  method?: 'Cash' | 'Card' | 'Bank' | 'Online';
  paidDate?: string;
}

export interface ExamResult {
  id: string;
  studentId: string;
  examId: string;
  subjectId: string;
  marks: number;
  grade: string;
  remarks?: string;
}

export interface Exam {
  id: string;
  name: string;
  term: string;
  classId: string;
  startDate: string;
  endDate: string;
  status: 'Scheduled' | 'Ongoing' | 'Completed';
}

export interface TimetableSlot {
  id: string;
  classId: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  period: number;
  startTime: string;
  endTime: string;
  subjectId: string;
  teacherId: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  audience: 'All' | 'Teachers' | 'Parents' | 'Students';
  date: string;
  priority: 'Low' | 'Normal' | 'High';
  author: string;
}
