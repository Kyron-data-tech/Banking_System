const fs = require('fs');
let app = fs.readFileSync('frontend/src/App.tsx', 'utf8');

app = app.replace(
    /const ProtectedRoute = \(\{ children \}: \{ children: React.ReactNode \}\) => \{\r?\n\s*const \{ isAuthenticated \} = useAuth\(\);\r?\n\s*const \{ isSignedIn \} = useClerkAuth\(\);\r?\n\s*return \(isAuthenticated \|\| isSignedIn\) \? <>\w*\{children\}<\/> : <Navigate to="\/" replace \/>;\r?\n\};/,
    `const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {\n  const { isAuthenticated } = useAuth();\n  const { isSignedIn, isLoaded } = useClerkAuth();\n  if (!isLoaded) return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading auth state...</div>;\n  return (isAuthenticated || isSignedIn) ? <>{children}</> : <Navigate to="/" replace />;\n};`
);

fs.writeFileSync('frontend/src/App.tsx', app, 'utf8');
console.log("Forced update App.tsx");
