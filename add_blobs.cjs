const fs = require('fs');
let app = fs.readFileSync('frontend/src/App.tsx', 'utf8');

if (!app.includes("BackgroundBlobs")) {
    app = app.replace(
        "import Login from './pages/Login';",
        "import Login from './pages/Login';\nimport { BackgroundBlobs } from './components/BackgroundBlobs';"
    );
    app = app.replace(
        "<AuthProvider>",
        "<AuthProvider>\n      <BackgroundBlobs />"
    );
    fs.writeFileSync('frontend/src/App.tsx', app, 'utf8');
    console.log("Updated App.tsx with BackgroundBlobs");
}
