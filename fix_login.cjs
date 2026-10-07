const fs = require('fs');
let login = fs.readFileSync('frontend/src/pages/Login.tsx', 'utf8');

login = login.replace(/persona === '\$1' \? 'bg-white text-blue-600/g, "persona === 'USER' ? 'bg-white text-blue-600");
// But wait, they are 3 buttons.
// Button 1: Normal User (USER)
// Button 2: Merchant (MERCHANT)
// Button 3: Bank Employee (EMPLOYEE)

// Since all 3 became $1, I need to replace them sequentially.
let count = 0;
login = login.replace(/persona === '\$1'/g, (match) => {
    count++;
    if(count === 1) return "persona === 'USER'";
    if(count === 2) return "persona === 'MERCHANT'";
    if(count === 3) return "persona === 'EMPLOYEE'";
    return match;
});

fs.writeFileSync('frontend/src/pages/Login.tsx', login, 'utf8');
console.log("Fixed Login $1 errors");
