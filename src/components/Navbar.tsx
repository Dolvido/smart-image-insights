'use client';

import Link from 'next/link';

export default function Navbar() {
  return (
    <header className="w-full py-4 px-6 border-b border-gray-800 flex items-center justify-between bg-gray-950">
      <Link 
        href="https://lukepayne.web.app"
        className="text-xl font-medium text-white"
        target="_blank"
        rel="noopener noreferrer"
      >
        Portfolio
      </Link>
      
      <nav className="flex items-center">
        <Link 
          href="https://lukepayne.web.app/projects"
          className="text-sm text-gray-400 hover:text-white px-3"
          target="_blank"
          rel="noopener noreferrer"
        >
          Projects
        </Link>
        <Link 
          href="https://lukepayne.web.app/about"
          className="text-sm text-gray-400 hover:text-white px-3"
          target="_blank"
          rel="noopener noreferrer"
        >
          About
        </Link>
        <Link 
          href="https://lukepayne.web.app/contact"
          className="text-sm text-gray-400 hover:text-white px-3"
          target="_blank"
          rel="noopener noreferrer"
        >
          Contact
        </Link>
      </nav>
    </header>
  );
} 