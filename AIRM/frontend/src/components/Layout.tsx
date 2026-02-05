import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Notifications } from './Notifications';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear auth tokens and user data
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');

    // Redirect to auth page
    navigate('/auth');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar onLogout={handleLogout} />
      <main className="flex-1 overflow-auto flex flex-col relative">
        <div className="absolute top-4 right-6 z-50">
          <Notifications />
        </div>
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}