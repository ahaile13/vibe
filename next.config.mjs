/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Run `npm run typecheck` in CI; don't let a stray type nit block a deploy.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: { unoptimized: true },
};
export default nextConfig;
