const fs = require('fs');
let dash = fs.readFileSync('frontend/src/pages/Dashboard.tsx', 'utf8');

dash = dash.replace(
    /<h2 className="text-4xl font-extrabold tracking-tight">[^1]*124,500<span className="text-lg text-blue-200">\.00<\/span><\/h2>/g,
    '<h2 className="text-4xl font-extrabold tracking-tight">?{currentBalance.toLocaleString(\'en-IN\')}<span className="text-lg text-blue-200">.00</span></h2>'
);

dash = dash.replace(
    /\{totalCollections\.toLocaleString\('en-IN'\)\}/g,
    '{totalCollections.toLocaleString(\'en-IN\')}' 
); // it's already there, wait.
// Let's check Merchant dashboard HTML.

fs.writeFileSync('frontend/src/pages/Dashboard.tsx', dash, 'utf8');
console.log("Fixed normal user balance variable");
