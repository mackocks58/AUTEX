import { useEffect, useState } from "react";

const BACKGROUND_IMAGES = [
  "https://images.unsplash.com/photo-1640340434855-6084b1f4901c?q=80&w=2000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1621761191319-c6fb62004040?q=80&w=2000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2000&auto=format&fit=crop",
];

export function GlobalFeatures() {
  const [bgIndex, setBgIndex] = useState(0);

  useEffect(() => {
    const bgInterval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % BACKGROUND_IMAGES.length);
    }, 6000);
    return () => clearInterval(bgInterval);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: -1,
        backgroundImage: `url(${BACKGROUND_IMAGES[bgIndex]})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        transition: "background-image 1.5s ease-in-out",
        opacity: 0.08,
        pointerEvents: "none",
      }}
    />
  );
}
