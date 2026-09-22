import type { CapacitorConfig } from "@capacitor/cli";

// 안드로이드 앱 설정. webDir 은 `npm run build` 결과(정적 export)
const config: CapacitorConfig = {
  appId: "kr.wolgye.talent",
  appName: "월계 재능나눔",
  webDir: "out",
};

export default config;
