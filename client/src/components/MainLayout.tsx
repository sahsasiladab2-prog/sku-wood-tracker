import { Link, useLocation } from "wouter";
import { Calculator, LayoutDashboard, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [location] = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/calculator", label: "Calculator", icon: Calculator },
    { path: "/tracker", label: "Tracker", icon: Trophy },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row font-body pb-20 md:pb-0">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-sidebar border-r-2 border-black p-4 flex-col gap-6 fixed h-full z-10">
        <div className="p-4 border-2 border-black bg-primary text-primary-foreground shadow-[4px_4px_0px_0px_#000000]">
          <h1 className="text-2xl font-heading font-bold uppercase tracking-tighter leading-none">
            SKU WOOD<br />TRACKER
          </h1>
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

        <div className="mt-auto p-4 border-2 border-black bg-white shadow-[4px_4px_0px_0px_#000000]">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-chart-1 border-2 border-black rounded-full flex items-center justify-center">
              <span className="font-bold text-lg">LV.5</span>
            </div>
            <div>
              <p className="font-bold text-sm">WOOD MASTER</p>
              <p className="text-xs text-muted-foreground">XP: 4.5k / 5k</p>
            </div>
          </div>
          <div className="w-full h-3 border-2 border-black bg-muted relative">
            <div className="absolute top-0 left-0 h-full bg-chart-4 w-[90%]"></div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden bg-primary border-b-2 border-black p-4 sticky top-0 z-20 flex justify-between items-center shadow-md">
        <h1 className="text-xl font-heading font-bold uppercase text-white tracking-tighter">
          SKU WOOD TRACKER
        </h1>
        <div className="w-8 h-8 bg-chart-1 border-2 border-black rounded-full flex items-center justify-center">
          <span className="font-bold text-xs">LV.5</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 md:ml-64 overflow-y-auto bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-black p-2 flex justify-around items-center z-30 shadow-[0px_-4px_10px_rgba(0,0,0,0.1)] pb-safe">
        {navItems.map((item) => {
          const isActive = location === item.path;
          return (
            <Link key={item.path} href={item.path}>
              <div className={cn(
                "flex flex-col items-center justify-center p-2 rounded-lg transition-all w-20",
                isActive ? "bg-accent text-accent-foreground border-2 border-black shadow-[2px_2px_0px_0px_#000000] translate-y-[-4px]" : "text-muted-foreground"
              )}>
                <item.icon className={cn("w-6 h-6", isActive && "stroke-[3px]")} />
                <span className="text-[10px] font-bold uppercase mt-1">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
