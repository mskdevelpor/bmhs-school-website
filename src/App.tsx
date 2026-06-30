import { useHashRoute } from '@/lib/router';
import { AuthProvider, useAuth } from '@/lib/auth';
import { AppShell } from '@/components/layout/AppShell';
import { Dashboard } from '@/pages/Dashboard';
import { StudentsPage } from '@/pages/StudentsPage';
import { TeachersPage } from '@/pages/TeachersPage';
import { ParentsPage } from '@/pages/ParentsPage';
import { AttendancePage } from '@/pages/AttendancePage';
import { FeesPage } from '@/pages/FeesPage';
import { ResultsPage } from '@/pages/ResultsPage';
import { ClassesPage } from '@/pages/ClassesPage';
import { TimetablePage } from '@/pages/TimetablePage';
import { AnnouncementsPage } from '@/pages/AnnouncementsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { LoginPage } from '@/pages/LoginPage';
import { ShieldAlert } from 'lucide-react';

function AppContent() {
  const { path, navigate } = useHashRoute();
  const { user, canAccess, logout } = useAuth();

  if (path === '/login' || !user) {
    return <LoginPage onNavigate={navigate} />;
  }

  const currentPath = path === '/' ? '/dashboard' : path;

  if (!canAccess(currentPath)) {
    return (
      <AppShell currentPath="/dashboard" onNavigate={navigate}>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ShieldAlert size={48} className="text-rose-500 mb-4" />
          <h2 className="text-xl font-bold text-slate-800">Access Denied</h2>
          <p className="text-slate-500 mt-2 max-w-sm">Aapke role ({user.role}) ko is page ka access nahi hai. Admin se contact karein.</p>
          <button onClick={() => { logout(); navigate('/login'); }} className="btn-primary mt-6">Back to Login</button>
        </div>
      </AppShell>
    );
  }

  function renderPage() {
    switch (currentPath) {
      case '/dashboard': return <Dashboard onNavigate={navigate} />;
      case '/students': return <StudentsPage />;
      case '/teachers': return <TeachersPage />;
      case '/parents': return <ParentsPage />;
      case '/attendance': return <AttendancePage />;
      case '/fees': return <FeesPage />;
      case '/results': return <ResultsPage />;
      case '/classes': return <ClassesPage />;
      case '/timetable': return <TimetablePage />;
      case '/announcements': return <AnnouncementsPage />;
      case '/settings': return <SettingsPage />;
      default: return <Dashboard onNavigate={navigate} />;
    }
  }

  return (
    <AppShell currentPath={currentPath} onNavigate={navigate}>
      {renderPage()}
    </AppShell>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
