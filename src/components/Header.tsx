"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpenText, Bookmark, BrainCircuit } from 'lucide-react';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/', label: '오늘의 이야기', icon: BookOpenText },
  { href: '/vocabulary', label: '나의 단어장', icon: Bookmark },
  { href: '/quiz', label: '퀴즈', icon: BrainCircuit },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex items-center">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="h-6 w-6 text-primary">
              <rect width="256" height="256" fill="none"></rect>
              <path d="M48,216a23.9,23.9,0,0,1,24-24H208V32H72A23.9,23.9,0,0,0,48,56Z" opacity="0.2" fill="currentColor"></path>
              <path d="M48,216a23.9,23.9,0,0,1,24-24H208V32H72a24,24,0,0,0-24,24V216" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></path>
              <polyline points="208 64 72 64 72 40" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></polyline>
            </svg>
            <span className="font-bold font-headline text-lg">Cuento Diario</span>
          </Link>
        </div>
        <nav className="flex items-center space-x-2 sm:space-x-6 text-sm font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'transition-colors hover:text-primary p-2 rounded-md',
                pathname === link.href ? 'text-primary bg-accent/50' : 'text-muted-foreground'
              )}
            >
              <div className="flex items-center gap-2">
                <link.icon className="h-5 w-5" />
                <span className='hidden sm:inline'>{link.label}</span>
              </div>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
