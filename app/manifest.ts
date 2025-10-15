import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Route Random - Free Running Route Generator",
    short_name: "Route Random",
    description:
      "Route Random is a free running route generator that creates random circular routes for runners and walkers. Generate custom running routes based on your desired distance and starting location anywhere in the world.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    orientation: "portrait",
    lang: "en",
    dir: "ltr",
    id: "route-random",
    categories: ["utilities", "fitness", "health"],
    icons: [
      {
        src: "/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [
      {
        src: "/screenshot-desktop.png",
        sizes: "2475x1502",
        type: "image/png",
        form_factor: "wide",
        label: "Route generation interface",
      },
      {
        src: "/screenshot-mobile.png",
        sizes: "1442x3094",
        type: "image/png",
        form_factor: "narrow",
        label: "Mobile route generation",
      },
    ],
  };
}
