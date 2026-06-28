import { useHashRoute } from '@/lib/router';
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

function App() {
  const { path, navigate } = useHashRoute();

  // Login page is standalone (no shell)
  if (path === '/login') {
    return <LoginPage onNavigate={navigate} />;
  }

  // Default to dashboard
  const currentPath = path === '/' ? '/dashboard' : path;

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

export default App;
