export const BackgroundBlobs = () => (
  <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-slate-50">
    <div className="absolute top-0 left-0 w-full h-96 bg-blue-600/5 rounded-b-[100px] transform -translate-y-24 scale-110" />
    <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
    <div className="absolute top-32 -left-32 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
    <div className="absolute -bottom-24 left-1/2 w-96 h-96 bg-sky-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />
  </div>
);
