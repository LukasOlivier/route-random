import Image from "next/image";
import MapWrapper from "./components/MapWrapper";
import Sidebar from "./components/Sidebar";

export default function Home() {
  return (
    <main>
      <div className="flex min-h-screen w-full flex-row">
        <Sidebar />
        <MapWrapper />
      </div>
    </main>
  );
}
