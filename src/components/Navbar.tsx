'use client';

import Link from 'next/link';

export default function Navbar() {
  return (
    <header className="w-full py-4 px-6 border-b border-gray-800 flex items-center justify-between bg-gray-950">
      <Link 
        href="/"
        className="text-xl font-medium text-white"
      >
        Portfolio
      </Link>
      
      <nav className="flex items-center">
        <Link 
          href="/projects"
          className="text-sm text-gray-400 hover:text-white px-3"
        >
          Projects
        </Link>
        <Link 
          href="/about"
          className="text-sm text-gray-400 hover:text-white px-3"
        >
          About
        </Link>
        <Link 
          href="/contact"
          className="text-sm text-gray-400 hover:text-white px-3"
        >
          Contact
        </Link>
      </nav>
    </header>
  );
} 