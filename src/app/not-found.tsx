export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0A0F1E] px-4 text-center">
      <h2 className="text-2xl font-semibold text-white">Page Not Found</h2>
      <p className="mt-2 text-[15px] text-white/70">The page you're looking for doesn't exist or has been moved.</p>
      <a href="/" className="mt-4 text-[15px] text-indigo-400 hover:text-indigo-300">
        Return Home
      </a>
    </div>
  );
} 