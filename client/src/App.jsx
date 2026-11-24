import { Route, Routes } from 'react-router';
import SiteHeader from './components/layout/SiteHeader.jsx';
import SiteFooter from './components/layout/SiteFooter.jsx';
import BrowsePage from './pages/BrowsePage.jsx';
import ListingPage from './pages/ListingPage.jsx';
import SavedPage from './pages/SavedPage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import MissingPage from './pages/MissingPage.jsx';

export default function App() {
  return (
    <div className="site">
      <SiteHeader />
      <div className="site-content">
        <Routes>
          <Route path="/" element={<BrowsePage />} />
          <Route path="/item/:id" element={<ListingPage />} />
          <Route path="/saved" element={<SavedPage />} />
          <Route path="/sign-in" element={<AuthPage mode="sign-in" />} />
          <Route path="/join" element={<AuthPage mode="join" />} />
          <Route path="*" element={<MissingPage />} />
        </Routes>
      </div>
      <SiteFooter />
    </div>
  );
}
