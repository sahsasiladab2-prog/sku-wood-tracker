import { Link, useLocation } from "wouter";
import { Calculator, LayoutDashboard, Trophy, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [location] = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/calculator", label: "Calculator", icon: Calculator },
    { path: "/tracker", label: "SKU Tracker", icon: Trophy },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row font-body">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-sidebar border-b-2 md:border-b-0 md:border-r-2 border-black p-4 flex flex-col gap-6">
        <div className="p-4 border-2 border-black bg-primary text-primary-foreground shadow-[4px_4px_0px_0px_#000000]">
          <h1 className="text-2xl font-heading font-bold uppercase tracking-tighter">
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
              <p className="text-xs text-muted-foreground">XP: 4,500 / 5,000</p>
            </div>
          </div>
          <div className="w-full h-3 border-2 border-black bg-muted relative">
            <div className="absolute top-0 left-0 h-full bg-chart-4 w-[90%]"></div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
