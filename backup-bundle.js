const fs = require('fs');

const backupFile = () => {
  const distPath = './dist';
  const bundlePath = `${distPath}/bundle.js`;
  const backupPath = `${distPath}/bundle.js.bak`;

  if (fs.existsSync(bundlePath)) {
    fs.copyFileSync(bundlePath, backupPath);
    console.log(`Backup created: ${backupPath}`);
  } else {
    console.log(`Error: ${bundlePath} not found`);
  }
};

backupFile();