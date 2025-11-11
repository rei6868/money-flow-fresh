// src/components/Layout/Sidebar.tsx
"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Sidebar = () => {
  const pathname = usePathname();
  const navItems = [
    { href: "/", label: "🏠 Dashboard" },
    { href: "/accounts", label: "💰 Accounts" },
    { href: "/transactions", label: "📊 Transactions" },
    { href: "/people", label: "👥 People" },
    { href: "/debt", label: "🏦 Debt" },
    { href: "/cashback", label: "💳 Cashback" },
    { href: "/settings", label: "⚙️ Settings" },
  ];

  return (
    <aside className="w-64 bg-[#1a1d2e] p-4 text-[#f3f4f6]">
      <nav>
        <ul>
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`block p-2 rounded ${
                  pathname === item.href ? "bg-[#3b82f6]" : ""
                }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
