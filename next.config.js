/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      { source: "/api/extract", destination: "http://localhost:8000/extract" },
      { source: "/api/extract-multi", destination: "http://localhost:8000/extract-multi" },
      { source: "/api/demo", destination: "http://localhost:8000/demo" },
    ];
  },
};
module.exports = nextConfig;
