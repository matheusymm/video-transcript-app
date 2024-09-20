import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

const Header = () => {
  return (
    <header className="primary py-4 bg-secondary">
      <div className="container flex items-center">
        <Link href="/" passHref>
          <Image
            src="/liven.png"
            alt='Liven Logo'
            width={110}
            height={110}
            className="ml-8 cursor-pointer"
          />
        </Link>
        <h1 className="text-4xl font-bold text-customGreen ml-8">Transcription App</h1>
      </div>
    </header>
  );
};

export default Header;