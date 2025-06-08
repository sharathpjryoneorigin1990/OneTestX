import React from "react";
import { FileText, List, Play, BarChart2, Settings } from "lucide-react";

const nav = [
  { label: "Dashboard", icon: <FileText />, href: "/test-dashboard" },
  { label: "Test Suites", icon: <List />, href: "/test-suites" },
  { label: "Runs", icon: <Play />, href: "/test-runs" },
  { label: "Reports", icon: <BarChart2 />, href: "/test-reports" },
  { label: "Settings", icon: <Settings />, href: "/settings" },
];

export default function Sidebar() {
  return (
    <aside className="bg-black border-r border-gray-800 h-screen w-56 flex flex-col py-6 px-3">
      <div className="mb-8 text-xl font-bold text-white tracking-wide pl-2">QA Panel</div>
      <nav className="flex-1">
        {nav.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2 rounded text-gray-300 hover:bg-gray-800 hover:text-white transition mb-1"
          >
            <span className="w-5 h-5">{item.icon}</span>
            <span>{item.label}</span>
          </a>
        ))}
      </nav>
    </aside>
  );
}
