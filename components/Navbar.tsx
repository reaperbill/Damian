'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const onHome = pathname === '/';

  function handleNav(e: React.MouseEvent, id: string) {
    e.preventDefault();
    if (onHome) {
      scrollTo(id);
    } else {
      router.push(`/#${id}`);
    }
  }

  return (
    <nav className="navbar">
      <div className="container">
        <Link href="/" className="logo">Damian Stevenson</Link>
        <ul className="nav-links">
          <li><Link href="/#home" onClick={(e) => handleNav(e, 'home')}>Home</Link></li>
          <li><Link href="/#about" onClick={(e) => handleNav(e, 'about')}>About</Link></li>
          <li><Link href="/#projects" onClick={(e) => handleNav(e, 'projects')}>Projects</Link></li>
          <li><Link href="/#contact" onClick={(e) => handleNav(e, 'contact')}>Contact</Link></li>
        </ul>
      </div>
    </nav>
  );
}
