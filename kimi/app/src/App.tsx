import { Routes, Route } from 'react-router';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';

export default function App() {
  return (
    <main className="relative bg-bg-dark min-h-screen">
      <div className="texture-overlay" />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </main>
  );
}
