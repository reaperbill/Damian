/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: isProd ? '/Damian' : '',
  output: 'export',
  images: { unoptimized: true },
};

module.exports = nextConfig;
