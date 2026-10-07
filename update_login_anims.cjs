const fs = require('fs');
let login = fs.readFileSync('frontend/src/pages/Login.tsx', 'utf8');

login = login.replace(
    /className=\{\`flex-1 py-2\.5 text-sm font-bold rounded-lg transition-all \$\{persona === '[^']+' \? 'bg-white \r?\n?text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'\}\`/g,
    'className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 transform active:scale-95 ${persona === \'$1\' ? \'bg-white text-blue-600 shadow-md ring-1 ring-black/5 scale-105\' : \'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50\'}`'
);

// We need to fix the replace manually because of the regex group. Let's do it simply:
login = login.replace(/className=\{\`flex-1 py-2\.5 text-sm font-bold rounded-lg transition-all \$\{persona === 'USER' \? 'bg-white [^}]+}/g, "className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 transform active:scale-95 ${persona === 'USER' ? 'bg-white text-blue-600 shadow-md ring-1 ring-black/5 scale-105' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}");
login = login.replace(/className=\{\`flex-1 py-2\.5 text-sm font-bold rounded-lg transition-all \$\{persona === 'MERCHANT' \? 'bg-white [^}]+}/g, "className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 transform active:scale-95 ${persona === 'MERCHANT' ? 'bg-white text-blue-600 shadow-md ring-1 ring-black/5 scale-105' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}");
login = login.replace(/className=\{\`flex-1 py-2\.5 text-sm font-bold rounded-lg transition-all \$\{persona === 'EMPLOYEE' \? 'bg-white [^}]+}/g, "className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 transform active:scale-95 ${persona === 'EMPLOYEE' ? 'bg-white text-blue-600 shadow-md ring-1 ring-black/5 scale-105' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}");

fs.writeFileSync('frontend/src/pages/Login.tsx', login, 'utf8');
console.log("Updated Login buttons animations");
