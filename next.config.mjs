/** @type {import('next').NextConfig} */
const nextConfig = {
  // 안드로이드 앱(Capacitor)에 넣기 위해 정적 HTML 로 내보낸다 → out/
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
