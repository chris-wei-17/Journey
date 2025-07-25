// pages/_app.tsx
import "@/lib/fontawesome"; // adjust path as needed
import "@fortawesome/fontawesome-svg-core/styles.css"; // Prevent fontawesome from adding its CSS
import { config } from "@fortawesome/fontawesome-svg-core";
config.autoAddCss = false; // Tell Font Awesome to skip adding the CSS automatically

export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />;
}