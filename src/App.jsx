import NOXLandingPage from '../NOXLandingPage.jsx';
import AdminDashboard from './components/AdminDashboard';

export default function App() {
  const path = typeof window !== 'undefined' ? window.location.pathname : '/';
  if (path.startsWith('/admin')) return <AdminDashboard />;
  return <NOXLandingPage />;
}