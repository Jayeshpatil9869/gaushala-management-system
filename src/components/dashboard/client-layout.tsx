"use client"

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { Home, FileText, Activity, LogOut, PlusCircle } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { createClientBrowser } from '@/lib/supabase/client';

export default function ClientLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // This effect ensures hydration mismatch doesn't occur
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLogout = async () => {
    const supabase = createClientBrowser();
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  const navItems = [
    { href: "/dashboard", icon: <Home className="w-5 h-5" />, label: "Dashboard" },
    { href: "/dashboard/register", icon: <PlusCircle className="w-5 h-5" />, label: "Register" },
    { href: "/dashboard/reports", icon: <FileText className="w-5 h-5" />, label: "Reports" },
    { href: "/dashboard/logs", icon: <Activity className="w-5 h-5" />, label: "Logs" },
  ];

  const isActive = (path: string) => pathname === path;

  // Render a skeleton layout during SSR to prevent hydration mismatch
  const renderContent = () => (
    <div className="flex flex-col h-screen" style={{background: 'linear-gradient(135deg, #f7f7f7 0%, #dfe3ee 100%)'}}>
      {/* Top header for mobile */}
      <header className="lg:hidden bg-white/80 backdrop-blur-md shadow-lg p-4" style={{borderBottom: '1px solid #dfe3ee'}}>
        <Link href="/dashboard" className="flex items-center space-x-3">
          <h2 className="text-xl font-bold" style={{background: 'linear-gradient(90deg, #3b5998 0%, #8b9dc3 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>Gaushala</h2>
        </Link>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar for desktop */}
        <aside className="hidden lg:flex w-72 bg-white/90 backdrop-blur-md shadow-2xl flex-col" style={{borderRight: '1px solid #dfe3ee'}}>
          <div className="p-6" style={{borderBottom: '1px solid #dfe3ee'}}>
            <Link href="/dashboard" className="flex items-center space-x-3 group">
              <h2 className="text-2xl font-bold" style={{background: 'linear-gradient(90deg, #3b5998 0%, #8b9dc3 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>Gaushala</h2>
            </Link>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-3">
            {navItems.map((item) => (
              <Link 
                key={item.href}
                href={item.href} 
                className={`group flex items-center px-4 py-3 rounded-xl transition-all duration-200`}
                style={isActive(item.href) 
                  ? {background: 'linear-gradient(90deg, #3b5998 0%, #8b9dc3 100%)', color: 'white', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', transform: 'scale(1.05)'}
                  : {color: '#000000'}}
                onMouseEnter={(e) => {
                  if (!isActive(item.href)) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = '#dfe3ee';
                    (e.currentTarget as HTMLElement).style.color = '#3b5998';
                    (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(item.href)) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                    (e.currentTarget as HTMLElement).style.color = '#000000';
                    (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                  }
                }}
              >
                <span className="mr-4 transition-transform duration-200 group-hover:scale-110" style={{color: isActive(item.href) ? 'white' : '#666666'}}>{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>
          <div className="p-4 mt-auto" style={{borderTop: '1px solid #dfe3ee'}}>
            <button 
              onClick={handleLogout}
              className="group flex items-center w-full px-4 py-3 rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-md"
              style={{color: '#000000'}}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = '#fee2e2';
                (e.currentTarget as HTMLElement).style.color = '#dc2626';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                (e.currentTarget as HTMLElement).style.color = '#000000';
              }}
            >
              <LogOut className="w-5 h-5 mr-4 transition-colors duration-200" style={{color: '#666666'}} />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-auto pb-10">
          <main className="flex-1 pb-4">
            <div className="bg-white/80 backdrop-blur-sm p-4 md:p-6 " style={{border: '1px solid #dfe3ee'}}>
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Bottom navigation for mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md flex justify-around items-center shadow-2xl z-30" style={{borderTop: '1px solid #dfe3ee'}}>
        {navItems.map((item) => (
          <Link 
            key={item.href}
            href={item.href} 
            className="flex flex-col items-center py-1 px-3 rounded-sm transition-all duration-200"
            style={isActive(item.href) 
              ? {color: '#3b5998', backgroundColor: '#dfe3ee', transform: 'scale(1.1)'}
              : {color: '#666666'}}
            onMouseEnter={(e) => {
              if (!isActive(item.href)) {
                (e.currentTarget as HTMLElement).style.color = '#3b5998';
                (e.currentTarget as HTMLElement).style.backgroundColor = '#dfe3ee';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive(item.href)) {
                (e.currentTarget as HTMLElement).style.color = '#666666';
                (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
              }
            }}
          >
            <span className={`transition-transform duration-200 ${
              isActive(item.href) ? "scale-110" : "hover:scale-110"
            }`}>{item.icon}</span>
            <span className="text-xs mt-1 font-medium">{item.label}</span>
          </Link>
        ))}
        <button 
          onClick={handleLogout}
          className="flex flex-col items-center py-2 px-1 rounded-xl transition-all duration-200"
          style={{color: '#666666'}}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = '#dc2626';
            (e.currentTarget as HTMLElement).style.backgroundColor = '#fee2e2';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = '#666666';
            (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
          }}
        >
          <LogOut className="w-5 h-5 hover:scale-110 transition-transform duration-200" />
          <span className="text-xs mt-1 font-medium">Logout</span>
        </button>
      </nav>
    </div>
  );

  return renderContent();
} 