import { Link, useLocation } from "wouter";
import { Calculator, LayoutDashboard, Trophy, Upload, LogIn, LogOut, User, Factory, ClipboardList, Warehouse, Users, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/_core/hooks/useAuth";
import { useProjects } from "@/contexts/ProjectContext";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [location] = useLocation();
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const { hasPendingMigration, migrateFromLocalStorage, isLoading: projectsLoading } = useProjects();

  const navItems = [
    { path: "/", label: "โรงงาน", icon: Factory },
    { path: "/production", label: "การผลิต", icon: ClipboardList },
    { path: "/inventory", label: "สต็อก", icon: Warehouse },
    { path: "/workers", label: "พนักงาน", icon: Users },
    { path: "/calculator", label: "คำนวณ", icon: Calculator },
    { path: "/tracker", label: "SKU", icon: Trophy },
    { path: "/dashboard", label: "วิเคราะห์", icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row font-body pb-20 md:pb-0">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-sidebar border-r-2 border-black p-4 flex-col gap-6 fixed h-full z-10">
        <div className="p-4 border-2 border-black bg-primary text-primary-foreground shadow-[4px_4px_0px_0px_#000000]">
          <h1 className="text-2xl font-heading font-bold uppercase tracking-tighter leading-none">
            FURNITURE<br />FACTORY
          </h1>
          <p className="text-[10px] text-primary-foreground/70 uppercase mt-1 tracking-wider">Management System</p>
        </div>

        <nav className="flex flex-col gap-2 flex-1">
          {navItems.map((item) => {
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <div
                  className={cn(
                    "flex items-center gap-3 p-3 border-2 border-black font-bold uppercase transition-all cursor-pointer",
                    isActive
                      ? "bg-accent text-accent-foreground shadow-[4px_4px_0px_0px_#000000] translate-x-[-2px] translate-y-[-2px]"
                      : "bg-white hover:bg-muted hover:shadow-[2px_2px_0px_0px_#000000]"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="mt-auto space-y-3">
          {/* Migration Banner */}
          {isAuthenticated && hasPendingMigration && (
            <div className="p-3 border-2 border-orange-500 bg-orange-50 shadow-[2px_2px_0px_0px_#f97316]">
              <p className="text-xs font-bold text-orange-700 mb-2">📦 พบข้อมูลเก่าในเครื่อง</p>
              <Button
                size="sm"
                className="w-full neo-button bg-orange-500 text-white hover:bg-orange-600 text-xs"
                onClick={migrateFromLocalStorage}
                disabled={projectsLoading}
              >
                <Upload className="w-3 h-3 mr-1" />
                ย้ายข้อมูลขึ้นระบบ
              </Button>
            </div>
          )}

          {/* Auth Status */}
          <div className="p-4 border-2 border-black bg-white shadow-[4px_4px_0px_0px_#000000]">
            {authLoading ? (
              <div className="text-center text-sm text-muted-foreground">กำลังโหลด...</div>
            ) : isAuthenticated ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-chart-4 border-2 border-black rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{user?.name || "User"}</p>
                    <p className="text-xs text-muted-foreground">☁️ ข้อมูลปลอดภัย</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-2 border-black text-xs"
                  onClick={() => logout()}
                >
                  <LogOut className="w-3 h-3 mr-1" />
                  ออกจากระบบ
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-center text-muted-foreground">
                  เข้าสู่ระบบเพื่อบันทึกข้อมูลอย่างปลอดภัย
                </p>
                <Button
                  className="w-full neo-button bg-chart-3 text-white hover:bg-blue-700 text-xs"
                  onClick={() => window.location.href = getLoginUrl()}
                >
                  <LogIn className="w-3 h-3 mr-1" />
                  เข้าสู่ระบบ
                </Button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden bg-primary border-b-2 border-black p-4 sticky top-0 z-20 flex justify-between items-center shadow-md">
        <h1 className="text-xl font-heading font-bold uppercase text-white tracking-tighter">
          FURNITURE FACTORY
        </h1>
        {authLoading ? (
          <div className="w-8 h-8 bg-gray-300 border-2 border-black rounded-full animate-pulse" />
        ) : isAuthenticated ? (
          <div className="w-8 h-8 bg-chart-4 border-2 border-black rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
        ) : (
          <Button
            size="sm"
            className="neo-button bg-chart-3 text-white hover:bg-blue-700 text-xs px-2 py-1 h-8"
            onClick={() => window.location.href = getLoginUrl()}
          >
            <LogIn className="w-3 h-3 mr-1" />
            Login
          </Button>
        )}
      </header>

      {/* Migration Banner for Mobile */}
      {isAuthenticated && hasPendingMigration && (
        <div className="md:hidden bg-orange-50 border-b-2 border-orange-500 p-3 flex items-center justify-between">
          <p className="text-xs font-bold text-orange-700">📦 พบข้อมูลเก่าในเครื่อง</p>
          <Button
            size="sm"
            className="neo-button bg-orange-500 text-white hover:bg-orange-600 text-xs h-7 px-2"
            onClick={migrateFromLocalStorage}
            disabled={projectsLoading}
          >
            <Upload className="w-3 h-3 mr-1" />
            ย้ายข้อมูล
          </Button>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 md:ml-64 overflow-y-auto bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation - show 5 key items */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-black p-2 flex justify-around items-center z-30 shadow-[0px_-4px_10px_rgba(0,0,0,0.1)] pb-safe">
        {navItems.filter(item => ["/", "/production", "/inventory", "/calculator", "/tracker"].includes(item.path)).map((item) => {
          const isActive = location === item.path;
          return (
            <Link key={item.path} href={item.path}>
              <div className={cn(
                "flex flex-col items-center justify-center p-1.5 rounded-lg transition-all w-16",
                isActive ? "bg-accent text-accent-foreground border-2 border-black shadow-[2px_2px_0px_0px_#000000] translate-y-[-4px]" : "text-muted-foreground"
              )}>
                <item.icon className={cn("w-5 h-5", isActive && "stroke-[3px]")} />
                <span className="text-[9px] font-bold uppercase mt-0.5">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
