import { Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';

export function ThemeToggle({ theme, toggleTheme }: { theme: 'light' | 'dark', toggleTheme: () => void }) {
  return (
    <button
      onClick={toggleTheme}
      className="fixed top-4 right-4 z-50 p-3 rounded-full glass hover:scale-110 transition-transform duration-200 text-foreground"
      aria-label="Alternar tema"
    >
      <motion.div
        initial={false}
        animate={{ rotate: theme === 'dark' ? 180 : 0 }}
        transition={{ duration: 0.3 }}
      >
        {theme === 'dark' ? <Moon size={24} /> : <Sun size={24} />}
      </motion.div>
    </button>
  );
}
