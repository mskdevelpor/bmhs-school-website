import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get existing classes
    const { data: classes, error: classErr } = await supabase
      .from("classes")
      .select("id, name, sections, capacity")
      .order("sort_order");
    if (classErr) throw classErr;

    const firstNames = ["Ahmed", "Ali", "Hassan", "Hussain", "Bilal", "Usman", "Zain", "Omar", "Hamza", "Ayesha", "Fatima", "Zainab", "Maryam", "Hira", "Sana", "Aisha", "Khadija", "Sara", "Anum", "Nida", "Asad", "Faisal", "Imran", "Kamran", "Nadeem", "Sajid", "Tariq", "Waseem", "Yasir", "Zubair", "Amna", "Bushra", "Gul", "Kiran", "Mahnoor", "Naila", "Rabia", "Saima", "Tania", "Uzma"];
    const lastNames = ["Khan", "Ahmed", "Malik", "Sheikh", "Butt", "Chaudhry", "Rana", "Tariq", "Iqbal", "Aslam", "Hussain", "Akram", "Nadeem", "Raza", "Saleem", "Yousaf", "Bashir", "Latif", "Majeed", "Rashid", "Shahid", "Waris", "Zahoor", "Anwar", "Din", "Ghulam", "Habib", "Iqbal", "Javed", "Kashif"];

    const students: Record<string, any>[] = [];
    const parents: Record<string, any>[] = [];
    let rollCounter = 1;

    for (const cls of classes) {
      const sections = cls.sections || ["A"];
      for (const section of sections) {
        const count = Math.min(cls.capacity || 30, 30);
        for (let i = 0; i < count; i++) {
          const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
          const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
          const gender = ["Ahmed", "Ali", "Hassan", "Bilal", "Usman", "Zain", "Omar", "Hamza", "Asad", "Faisal", "Imran", "Kamran", "Nadeem", "Sajid", "Tariq", "Waseem", "Yasir", "Zubair"].includes(fn) ? "Male" : "Female";
          const rollNo = `${cls.name.replace(" ", "")}-${section}-${String(rollCounter).padStart(4, "0")}`;
          rollCounter++;

          // Create parent
          const parentName = `${["Muhammad", "Abdul", "Ghulam", "Muhammad", "Malik", "Chaudhry"][Math.floor(Math.random() * 6)]} ${ln}`;
          const parentPhone = `0300${Math.floor(1000000 + Math.random() * 8999999)}`;
          const parentId = crypto.randomUUID();

          parents.push({
            id: parentId,
            name: parentName,
            phone: parentPhone,
            occupation: ["Business", "Teacher", "Farmer", "Government", "Private Job", "Labour"][Math.floor(Math.random() * 6)],
            address: "Madina Colony Ellah Abad",
          });

          students.push({
            roll_no: rollNo,
            name: `${fn} ${ln}`,
            gender,
            class_id: cls.id,
            section,
            phone: `0300${Math.floor(1000000 + Math.random() * 8999999)}`,
            address: "Madina Colony Ellah Abad",
            parent_id: parentId,
            parent_name: parentName,
            parent_phone: parentPhone,
            admission_date: new Date(2020 + Math.floor(Math.random() * 5), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split("T")[0],
            status: "Active",
          });
        }
      }
    }

    // Insert parents first
    const { error: parentInsertErr } = await supabase.from("parents").insert(parents);
    if (parentInsertErr) throw parentInsertErr;

    // Insert students in batches of 500
    for (let i = 0; i < students.length; i += 500) {
      const batch = students.slice(i, i + 500);
      const { error: studentErr } = await supabase.from("students").insert(batch);
      if (studentErr) throw studentErr;
    }

    // Seed teachers
    const teacherNames = ["Muhammad Asif Khan", "Sadia Sheikh", "Tariq Mahmood", "Nasreen Akhtar", "Imran Butt", "Rukhsana Bibi", "Faisal Raza", "Amber Malik", "Kashif Rana", "Shazia Parveen", "Nadeem Iqbal", "Farah Deeba", "Waseem Akram", "Saima Nadeem", "Zahid Yousaf", "Robina Ashraf"];
    const subjects = ["Mathematics", "English", "Urdu", "Science", "Islamiat", "Pakistan Studies", "Computer", "Social Studies", "Physics", "Chemistry", "Biology"];
    const teachers: Record<string, any>[] = teacherNames.map((name, i) => ({
      name,
      gender: i % 2 === 0 ? "Male" : "Female",
      phone: `0300${Math.floor(1000000 + Math.random() * 8999999)}`,
      email: `teacher${i + 1}@bmhs.edu.pk`,
      qualification: ["M.A", "M.Sc", "B.A", "B.Sc", "M.Ed", "B.Ed"][Math.floor(Math.random() * 6)],
      subjects: [subjects[i % subjects.length], subjects[(i + 1) % subjects.length]],
      class_id: classes[i % classes.length]?.id,
      join_date: new Date(2018 + Math.floor(Math.random() * 6), Math.floor(Math.random() * 12), 1).toISOString().split("T")[0],
      salary: 25000 + Math.floor(Math.random() * 30000),
      status: "Active",
    }));

    const { error: teacherErr } = await supabase.from("teachers").insert(teachers);
    if (teacherErr) throw teacherErr;

    // Seed some fees for each student (current term)
    const { data: allStudents } = await supabase.from("students").select("id, class_id");
    const fees: Record<string, any>[] = [];
    for (const s of (allStudents || [])) {
      fees.push({
        student_id: s.id,
        term: "Term 1 2026",
        amount: 500 + Math.floor(Math.random() * 1500),
        paid_amount: Math.random() > 0.4 ? 500 + Math.floor(Math.random() * 1500) : 0,
        status: Math.random() > 0.4 ? "Paid" : "Unpaid",
        due_date: new Date(2026, 8, 30).toISOString().split("T")[0],
      });
    }
    for (let i = 0; i < fees.length; i += 500) {
      const { error: feeErr } = await supabase.from("fees").insert(fees.slice(i, i + 500));
      if (feeErr) throw feeErr;
    }

    // Seed announcements
    const announcements = [
      { title: "School Reopening", content: "School will reopen on March 1, 2026 after winter break. All students must attend.", category: "Academic", priority: "High" },
      { title: "Parent-Teacher Meeting", content: "PTM scheduled for Saturday, March 15, 2026 from 9 AM to 1 PM.", category: "Event", priority: "Normal" },
      { title: "Fee Submission Reminder", content: "Last date for Term 1 fee submission is March 31, 2026.", category: "Fee", priority: "High" },
      { title: "Annual Sports Day", content: "Annual sports day will be held on March 20, 2026. All classes participate.", category: "Event", priority: "Normal" },
      { title: "PEF Inspection", content: "PEF inspection team visiting on March 25, 2026. Ensure cleanliness and discipline.", category: "Academic", priority: "High" },
    ];
    const { error: annErr } = await supabase.from("announcements").insert(announcements);
    if (annErr) throw annErr;

    return new Response(
      JSON.stringify({
        success: true,
        students: students.length,
        parents: parents.length,
        teachers: teachers.length,
        fees: fees.length,
        announcements: announcements.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
