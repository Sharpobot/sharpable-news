/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Prevent webpack from trying to resolve Windows directory junctions
    // (git worktrees inside .claude/) which causes EISDIR on readlink
    config.resolve.symlinks = false
    return config
  },
}

export default nextConfig
