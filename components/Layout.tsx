// components/Layout.tsx
import Header from './Header'; // Assuming your nav/header is in Header.tsx
import Footer from './components/Footer'; // Assuming your footer is here, adjust path if needed

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header /> {/* This is where the navigation should be rendered ONCE */}
      <main className="flex-grow">
        {children} {/* This is where the content from index.tsx (and other pages) is injected */}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;