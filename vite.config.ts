import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { services } from "./src/data/services";

// Contract 02: noscript 링크 목록은 services.ts에서 빌드 시 생성한다.
function noscriptLinks(): Plugin {
  return {
    name: "lsl-noscript-links",
    transformIndexHtml(html) {
      const items = services
        .map((s) => `<li><a href="${s.link}">${s.title.en} · ${s.title.ko}</a></li>`)
        .join("\n        ");
      return html.replace("<!--NOSCRIPT_LINKS-->", items);
    },
  };
}

export default defineConfig({
  plugins: [react(), noscriptLinks()],
});
