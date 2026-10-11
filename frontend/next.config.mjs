const nextConfig = {
  allowedDevOrigins: [
    "10.148.224.205",
  ],
};

if (process.env.EXPORT_BUILD === 'true') {
  nextConfig.output = 'export';
} else {
  const backendUrl = process.env.BACKEND_INTERNAL_URL || 'http://localhost:8000';
  nextConfig.rewrites = async () => {
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  };
}

export default nextConfig;
