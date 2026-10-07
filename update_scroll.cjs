const fs = require('fs');
let dash = fs.readFileSync('frontend/src/pages/Dashboard.tsx', 'utf8');

dash = dash.replace(
    'min-h-[100vh] md:min-h-[85vh]',
    'h-[100dvh] md:h-[85vh]'
);

fs.writeFileSync('frontend/src/pages/Dashboard.tsx', dash, 'utf8');
console.log("Updated container to fixed height for internal scrolling");
