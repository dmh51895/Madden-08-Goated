/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Cloudflare Pages: static export. Drop this block if you want server features later.
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
};
export default nextConfig;
