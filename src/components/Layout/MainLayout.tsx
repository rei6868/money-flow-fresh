// src/components/Layout/MainLayout.tsx
import React from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen bg-[#0f1419] text-[#f3f4f6]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#0f1419] p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
