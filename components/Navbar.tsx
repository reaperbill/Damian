'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function Navbar() {
  const pathname = usePathname();
  const onHome = pathname === '/';

  function handleScroll(e: React.MouseEvent, id: string) {
    if (onHome) {
      e.preventDefault();
      scrollTo(id);
    }
  }

  return (
    <nav className="navbar">
      <div className="container">
        <Link href="/" className="logo">Damian Stevenson</Link>
        <ul className="nav-links">
          <li><a href="/#home" onClick={(e) => handleScroll(e, 'home')}>Home</a></li>
          <li><a href="/#about" onClick={(e) => handleScroll(e, 'about')}>About</a></li>
          <li><Link href="/projects">Projects</Link></li>
          <li><a href="/#contact" onClick={(e) => handleScroll(e, 'contact')}>Contact</a></li>
        </ul>
      </div>
    </nav>
  );
}
