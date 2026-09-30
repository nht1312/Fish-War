/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Internal packages ship TypeScript source; Next transpiles them.
  transpilePackages: ["@fishwar/game-core", "@fishwar/game-types"],
  // Linting and type-checking run as dedicated monorepo tasks, not during build.
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
};

export default nextConfig;
