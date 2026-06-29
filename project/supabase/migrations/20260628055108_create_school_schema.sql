/*
# Bismillah Model High School — Complete Database Schema

## Overview
Creates the full schema for a school management system supporting ~2000 students.
Single-tenant: admin manages all data, no per-user ownership isolation.
All tables use `TO anon, authenticated` policies so the frontend anon-key client can read/write.

## New Tables
1. **classes** — School classes (Nursery, Play, Prep, Class 1-10)
2. **students** — Student records (up to 2000+)
3. **parents** — Parent/guardian records linked to students
4. **teachers** — Teaching staff
5. **attendance** — Daily attendance per student
6. **fees** — Fee records per student per term
7. **results** — Exam results per student per subject
8. **announcements** — School announcements/messages
9. **messages** — Direct messages from admin to students/parents/teachers
10. **timetable** — Class timetables
11. **settings** — School settings (key-value)

## Security
- RLS enabled on all tables.
- All policies use `TO anon, authenticated` with `USING (true)` / `WITH CHECK (true)` — this is a single-tenant admin-managed app where data is intentionally shared.
- No user_id columns, no auth.uid() checks.

## Notes
- All tables have created_at/updated_at timestamps.
- Foreign keys enforce referential integrity.
- Indexes on frequently-queried columns (class_id, roll_no, date, etc.).
*/

-- Classes table
CREATE TABLE IF NOT EXISTS classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  level text NOT NULL DEFAULT 'Primary',
  sections text[] NOT NULL DEFAULT ARRAY[]::text[],
  class_teacher_id uuid,
  room text,
  capacity int NOT NULL DEFAULT 30,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_classes" ON classes;
CREATE POLICY "anon_crud_classes" ON classes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_classes" ON classes;
CREATE POLICY "anon_insert_classes" ON classes FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_classes" ON classes;
CREATE POLICY "anon_update_classes" ON classes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_classes" ON classes;
CREATE POLICY "anon_delete_classes" ON classes FOR DELETE TO anon, authenticated USING (true);

-- Parents table (created before students for FK)
CREATE TABLE IF NOT EXISTS parents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  email text,
  occupation text,
  address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_parents" ON parents;
CREATE POLICY "anon_crud_parents" ON parents FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_parents" ON parents;
CREATE POLICY "anon_insert_parents" ON parents FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_parents" ON parents;
CREATE POLICY "anon_update_parents" ON parents FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_parents" ON parents;
CREATE POLICY "anon_delete_parents" ON parents FOR DELETE TO anon, authenticated USING (true);

-- Students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  roll_no text NOT NULL,
  name text NOT NULL,
  gender text DEFAULT 'Male',
  dob date,
  class_id uuid REFERENCES classes(id) ON DELETE SET NULL,
  section text DEFAULT 'A',
  phone text,
  email text,
  address text,
  parent_id uuid REFERENCES parents(id) ON DELETE SET NULL,
  parent_name text,
  parent_phone text,
  admission_date date DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'Active',
  photo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_students" ON students;
CREATE POLICY "anon_crud_students" ON students FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_students" ON students;
CREATE POLICY "anon_insert_students" ON students FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_students" ON students;
CREATE POLICY "anon_update_students" ON students FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_students" ON students;
CREATE POLICY "anon_delete_students" ON students FOR DELETE TO anon, authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_students_class_id ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_students_roll_no ON students(roll_no);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);

-- Teachers table
CREATE TABLE IF NOT EXISTS teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  gender text DEFAULT 'Male',
  phone text,
  email text,
  address text,
  qualification text,
  subjects text[] DEFAULT ARRAY[]::text[],
  class_id uuid REFERENCES classes(id) ON DELETE SET NULL,
  join_date date DEFAULT CURRENT_DATE,
  salary numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'Active',
  photo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_teachers" ON teachers;
CREATE POLICY "anon_crud_teachers" ON teachers FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_teachers" ON teachers;
CREATE POLICY "anon_insert_teachers" ON teachers FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_teachers" ON teachers;
CREATE POLICY "anon_update_teachers" ON teachers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_teachers" ON teachers;
CREATE POLICY "anon_delete_teachers" ON teachers FOR DELETE TO anon, authenticated USING (true);

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id uuid REFERENCES classes(id) ON DELETE SET NULL,
  date date NOT NULL,
  status text NOT NULL DEFAULT 'Present',
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_attendance" ON attendance;
CREATE POLICY "anon_crud_attendance" ON attendance FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_attendance" ON attendance;
CREATE POLICY "anon_insert_attendance" ON attendance FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_attendance" ON attendance;
CREATE POLICY "anon_update_attendance" ON attendance FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_attendance" ON attendance;
CREATE POLICY "anon_delete_attendance" ON attendance FOR DELETE TO anon, authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_class_date ON attendance(class_id, date);

-- Fees table
CREATE TABLE IF NOT EXISTS fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  term text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  paid_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Unpaid',
  due_date date,
  paid_date date,
  method text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE fees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_fees" ON fees;
CREATE POLICY "anon_crud_fees" ON fees FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_fees" ON fees;
CREATE POLICY "anon_insert_fees" ON fees FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_fees" ON fees;
CREATE POLICY "anon_update_fees" ON fees FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_fees" ON fees;
CREATE POLICY "anon_delete_fees" ON fees FOR DELETE TO anon, authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_fees_student_id ON fees(student_id);
CREATE INDEX IF NOT EXISTS idx_fees_status ON fees(status);

-- Results table
CREATE TABLE IF NOT EXISTS results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id uuid REFERENCES classes(id) ON DELETE SET NULL,
  subject text NOT NULL,
  term text NOT NULL,
  total_marks numeric NOT NULL DEFAULT 100,
  obtained_marks numeric NOT NULL DEFAULT 0,
  grade text,
  exam_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_results" ON results;
CREATE POLICY "anon_crud_results" ON results FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_results" ON results;
CREATE POLICY "anon_insert_results" ON results FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_results" ON results;
CREATE POLICY "anon_update_results" ON results FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_results" ON results;
CREATE POLICY "anon_delete_results" ON results FOR DELETE TO anon, authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_results_student_id ON results(student_id);
CREATE INDEX IF NOT EXISTS idx_results_class_id ON results(class_id);

-- Announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL DEFAULT 'General',
  audience text NOT NULL DEFAULT 'All',
  priority text NOT NULL DEFAULT 'Normal',
  status text NOT NULL DEFAULT 'Active',
  date date NOT NULL DEFAULT CURRENT_DATE,
  expiry_date date,
  created_by text DEFAULT 'Admin',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_announcements" ON announcements;
CREATE POLICY "anon_crud_announcements" ON announcements FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_announcements" ON announcements;
CREATE POLICY "anon_insert_announcements" ON announcements FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_announcements" ON announcements;
CREATE POLICY "anon_update_announcements" ON announcements FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_announcements" ON announcements;
CREATE POLICY "anon_delete_announcements" ON announcements FOR DELETE TO anon, authenticated USING (true);

-- Messages table (admin to students/parents/teachers)
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender text NOT NULL DEFAULT 'Admin',
  recipient_type text NOT NULL DEFAULT 'All',
  recipient_id uuid,
  recipient_class_id uuid REFERENCES classes(id) ON DELETE SET NULL,
  subject text,
  body text NOT NULL,
  channel text NOT NULL DEFAULT 'In-App',
  status text NOT NULL DEFAULT 'Sent',
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_messages" ON messages;
CREATE POLICY "anon_crud_messages" ON messages FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_messages" ON messages;
CREATE POLICY "anon_insert_messages" ON messages FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_messages" ON messages;
CREATE POLICY "anon_update_messages" ON messages FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_messages" ON messages;
CREATE POLICY "anon_delete_messages" ON messages FOR DELETE TO anon, authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_type, recipient_id);

-- Timetable table
CREATE TABLE IF NOT EXISTS timetable (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  day text NOT NULL,
  period int NOT NULL,
  subject text NOT NULL,
  teacher_id uuid REFERENCES teachers(id) ON DELETE SET NULL,
  start_time text,
  end_time text,
  room text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE timetable ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_timetable" ON timetable;
CREATE POLICY "anon_crud_timetable" ON timetable FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_timetable" ON timetable;
CREATE POLICY "anon_insert_timetable" ON timetable FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_timetable" ON timetable;
CREATE POLICY "anon_update_timetable" ON timetable FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_timetable" ON timetable;
CREATE POLICY "anon_delete_timetable" ON timetable FOR DELETE TO anon, authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_timetable_class_day ON timetable(class_id, day);

-- Settings table (key-value store for school config)
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_settings" ON settings;
CREATE POLICY "anon_crud_settings" ON settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_settings" ON settings;
CREATE POLICY "anon_insert_settings" ON settings FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_settings" ON settings;
CREATE POLICY "anon_update_settings" ON settings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_settings" ON settings;
CREATE POLICY "anon_delete_settings" ON settings FOR DELETE TO anon, authenticated USING (true);

-- Insert default classes (Nursery, Play, Prep, Class 1-10)
INSERT INTO classes (name, level, sections, room, capacity, sort_order) VALUES
  ('Nursery', 'Pre-Primary', ARRAY['A'], 'G-01', 25, 0),
  ('Play Group', 'Pre-Primary', ARRAY['A'], 'G-02', 25, 1),
  ('Prep', 'Pre-Primary', ARRAY['A', 'B'], 'G-03', 30, 2),
  ('Class 1', 'Primary', ARRAY['A', 'B'], 'G-04', 30, 3),
  ('Class 2', 'Primary', ARRAY['A', 'B'], '1-01', 30, 4),
  ('Class 3', 'Primary', ARRAY['A', 'B'], '1-02', 30, 5),
  ('Class 4', 'Primary', ARRAY['A'], '1-03', 30, 6),
  ('Class 5', 'Primary', ARRAY['A'], '2-01', 30, 7),
  ('Class 6', 'Middle', ARRAY['A', 'B'], '2-02', 35, 8),
  ('Class 7', 'Middle', ARRAY['A', 'B'], '2-03', 35, 9),
  ('Class 8', 'Middle', ARRAY['A', 'B'], '3-01', 35, 10),
  ('Class 9', 'High', ARRAY['A', 'B'], '3-02', 40, 11),
  ('Class 10', 'High', ARRAY['A', 'B'], '3-03', 40, 12)
ON CONFLICT DO NOTHING;

-- Insert default school settings
INSERT INTO settings (key, value) VALUES
  ('school_name', 'Bismillah Model High School'),
  ('school_short_name', 'BMHS'),
  ('school_address', 'Madina Colony Ellah Abad'),
  ('school_phone', '0300 7575178'),
  ('school_email', 'bismillahmodelhighschool@gmail.com'),
  ('school_website', 'www.bmhs.edu.pk'),
  ('school_principal', 'Shakeel Ahmad Faisal'),
  ('school_established', '2005'),
  ('school_affiliation', 'Punjab Education Foundation (PEF)'),
  ('academic_year_start_month', '3')
ON CONFLICT (key) DO NOTHING;
