import { useEffect, useState } from "react";

// 뷰포트 크기 + isMobile(768 미만). resize 구독, SSR 시 width/height 0.

export function useWindowSize() {
  const [size, setSize] = useState({
    width: typeof window === "undefined" ? 0 : window.innerWidth,
    height: typeof window === "undefined" ? 0 : window.innerHeight,
  });

  useEffect(() => {
    const onResize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isMobile = size.width > 0 && size.width < 768;
  return { ...size, isMobile };
}
