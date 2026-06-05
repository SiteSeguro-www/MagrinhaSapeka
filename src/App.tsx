import { useState, useEffect, useRef } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useNotification } from './hooks/useNotification';
import { useTheme } from './hooks/useTheme';
import { ThemeToggle } from './components/ThemeToggle';
import { NotificationModal } from './components/NotificationModal';
import { Footer } from './components/Footer';

// Pages
import { Home } from './pages/Home';
import { Terms } from './pages/Terms';
import { Privacy } from './pages/Privacy';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { FAQ } from './pages/FAQ';
import { Admin } from './pages/Admin';

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const { isUnlocked, permissionState, requestPermission } = useNotification();
  const [modalOpen, setModalOpen] = useState(false);
  const reminderRef = useRef<number | null>(null);

  const handleActivate = async () => {
    setModalOpen(false);
    const granted = await requestPermission();
    if (granted) {
      // Clear reminder if granted
      if (reminderRef.current) {
        clearInterval(reminderRef.current);
        reminderRef.current = null;
      }
    } else {
      // Setup reminder interval if denied
      setupReminder();
    }
  };

  const setupReminder = () => {
    if (reminderRef.current) clearInterval(reminderRef.current);
    if (!isUnlocked) {
      reminderRef.current = window.setInterval(() => {
        setModalOpen(true);
      }, 10000);
    }
  };

  useEffect(() => {
    if (!isUnlocked && permissionState === 'denied') {
      setupReminder();
    }
    return () => {
      if (reminderRef.current) clearInterval(reminderRef.current);
    };
  }, [isUnlocked, permissionState]);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 flex flex-col">
      <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
      
      <main className="flex-1">
        <Routes>
          <Route path="/" element={
            <Home 
              isUnlocked={isUnlocked} 
              onActivate={handleActivate} 
              onMediaClick={() => setModalOpen(true)} 
            />
          } />
          <Route path="/termos" element={<Terms />} />
          <Route path="/privacidade" element={<Privacy />} />
          <Route path="/sobre" element={<About />} />
          <Route path="/contato" element={<Contact />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>

      <Footer />

      <NotificationModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        onRequestPermission={handleActivate}
      />
    </div>
  );
}
