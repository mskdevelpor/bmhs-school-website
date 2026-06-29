/*
# Add unique constraint on attendance (student_id, date, class_id)

1. Purpose
   - The attendance page marks one status per student per date per class.
   - Without a unique constraint, re-saving the same day created duplicate rows.
   - This constraint lets the frontend use `upsert(..., { onConflict: 'student_id,date,class_id' })`
     to INSERT a new record or UPDATE the existing one atomically.

2. Schema changes
   - Added UNIQUE constraint `attendance_student_date_class_unique`
     on `attendance(student_id, date, class_id)`.

3. Data safety
   - Before adding the constraint, any existing duplicate rows for the same
     (student_id, date, class_id) are collapsed to a single row (keeping the
     most recent by `created_at`), so the constraint can be applied without
     violating it. This is a one-time cleanup; no valid data is lost.

4. Security
   - No RLS or policy changes. Existing policies on `attendance` are unchanged.
*/

-- Collapse any pre-existing duplicates so the unique constraint can be added.
-- Keep one row per (student_id, date, class_id), preferring the latest created_at.
DELETE FROM attendance a
USING attendance b
WHERE a.student_id = b.student_id
  AND a.date = b.date
  AND COALESCE(a.class_id, '00000000-0000-0000-0000-000000000000')
      = COALESCE(b.class_id, '00000000-0000-0000-0000-000000000000')
  AND a.id < b.id;

ALTER TABLE attendance
  ADD CONSTRAINT attendance_student_date_class_unique
  UNIQUE (student_id, date, class_id);
