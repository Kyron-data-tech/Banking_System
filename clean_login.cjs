const fs = require('fs');
let login = fs.readFileSync('frontend/src/pages/Login.tsx', 'utf8');

const regexToRemove = /\{\/\* Decorative background shapes \*\/\}[\s\S]*?animation-delay-4000" \/>/g;
login = login.replace(regexToRemove, '');
login = login.replace('min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden', 'min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative z-10 animate-fade-in');

fs.writeFileSync('frontend/src/pages/Login.tsx', login, 'utf8');
console.log("Cleaned Login.tsx");
