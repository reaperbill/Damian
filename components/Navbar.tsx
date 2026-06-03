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
          <li><Link href="/#home" onClick={(e) => handleScroll(e, 'home')}>Home</Link></li>
          <li><Link href="/#about" onClick={(e) => handleScroll(e, 'about')}>About</Link></li>
          <li><Link href="/projects">Projects</Link></li>
          <li><Link href="/#contact" onClick={(e) => handleScroll(e, 'contact')}>Contact</Link></li>
        </ul>
      </div>
    </nav>
  );
}
