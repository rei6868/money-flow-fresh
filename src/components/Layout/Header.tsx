// src/components/Layout/Header.tsx
import React from "react";

const Header = () => {
  return (
    <header className="bg-[#1a1d2e] p-4 text-[#f3f4f6] flex justify-between items-center">
      <h1 className="text-xl font-bold">Money Flow</h1>
      <div>
        <p>User</p>
      </div>
    </header>
  );
};

export default Header;
