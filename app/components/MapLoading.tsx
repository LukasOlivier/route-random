import Image from "next/image";

export default function MapLoading() {
  return (
    <div className="h-full w-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center">
      {/* Logo with animation */}
      <div className="flex flex-col items-center ">
        <div className="relative mb-8">
          <Image
            src="/logo-route-random.png"
            alt="Route Random Logo"
            width={120}
            height={120}
            className="drop-shadow-2xl animate-pulse animated-fade-in"
            priority
          />
        </div>

        {/* App title */}
        <h1 className="text-3xl font-bold text-white mb-2 animated-fade-in">
          Route Random
        </h1>

        {/* Loading text */}
        <p className="text-gray-300 text-lg animated-fade-in">
          Loading your adventure...
        </p>
      </div>

      {/* Loading dots animation */}
      <div className="flex space-x-2 mt-8">
        <div className="w-3 h-3 bg-blue-500 rounded-full "></div>
        <div
          className="w-3 h-3 bg-blue-500 rounded-full "
          style={{ animationDelay: "0.1s" }}
        ></div>
        <div
          className="w-3 h-3 bg-blue-500 rounded-full "
          style={{ animationDelay: "0.2s" }}
        ></div>
      </div>
    </div>
  );
}
