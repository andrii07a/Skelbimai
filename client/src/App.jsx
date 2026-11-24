import { Route, Routes } from 'react-router';
import NavBar from './components/NavBar.jsx';
import HomePage from './pages/HomePage.jsx';
import AdPage from './pages/AdPage.jsx';
import FavoritesPage from './pages/FavoritesPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

export default function App() {
  return (
    <>
      <NavBar />
      <main className="container py-4">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/ads/:id" element={<AdPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <footer className="container pb-4 text-center text-muted small">
        Classifieds · school project · <a href="/admin">Admin area</a>
      </footer>
    </>
  );
}
