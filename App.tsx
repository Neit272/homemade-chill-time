import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { ErrorBoundary } from './components/ErrorBoundary';

const Home = React.lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const Catalog = React.lazy(() => import('./pages/Catalog').then(m => ({ default: m.Catalog })));
const Details = React.lazy(() => import('./pages/Details').then(m => ({ default: m.Details })));
const WatchRead = React.lazy(() => import('./pages/WatchRead').then(m => ({ default: m.WatchRead })));
const Search = React.lazy(() => import('./pages/Search').then(m => ({ default: m.Search })));
const CategoryPage = React.lazy(() => import('./pages/CategoryPage').then(m => ({ default: m.CategoryPage })));
const CountryPage = React.lazy(() => import('./pages/CountryPage').then(m => ({ default: m.CountryPage })));
const YearPage = React.lazy(() => import('./pages/YearPage').then(m => ({ default: m.YearPage })));
const Favorites = React.lazy(() => import('./pages/Favorites').then(m => ({ default: m.Favorites })));
const HistoryPage = React.lazy(() => import('./pages/History').then(m => ({ default: m.HistoryPage })));
const NotFound = React.lazy(() => import('./pages/NotFound').then(m => ({ default: m.NotFound })));

const Loader = () => (
    <div className="flex h-screen items-center justify-center bg-[#0b0a15]">
        <div className="w-8 h-8 border-2 border-purple-500 rounded-full animate-spin border-t-transparent" />
    </div>
);

const Layout = ({ children }: { children?: React.ReactNode }) => {
    const location = useLocation();
    const isImmersive = location.pathname.startsWith('/watch');

    return (
        <div className="flex min-h-screen bg-[#0b0a15] text-slate-100 font-sans selection:bg-purple-500/30 overflow-x-hidden">
            {!isImmersive && <Sidebar />}
            
            <main className={`flex-1 transition-all duration-300 w-full min-w-0 ${!isImmersive ? 'md:ml-64 pb-24 md:pb-0' : ''}`}>
                {children}
            </main>

            {!isImmersive && <MobileNav />}
        </div>
    );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
      <Layout>
        <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/x" element={<Home key="alt" />} />
          <Route path="/search" element={<Search />} />
          
          <Route path="/movies" element={<Catalog type="phim-le" title="Phim Lẻ" />} />
          <Route path="/series" element={<Catalog type="phim-bo" title="Phim Bộ" />} />
          <Route path="/cartoons" element={<Catalog type="hoat-hinh" title="Phim Hoạt Hình" />} />
          <Route path="/new-movies" element={<Catalog type="phim-moi" title="Phim" />} />
          
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/country/:slug" element={<CountryPage />} />
          <Route path="/year/:year" element={<YearPage />} />
          
          <Route path="/comics" element={<Catalog type="truyen-tranh" title="Truyện" />} />
          <Route path="/comic-category/:slug" element={<CategoryPage isComic={true} />} />
          
          <Route path="/details/:id" element={<Details />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/watch/:id" element={<WatchRead />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </Layout>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default App;