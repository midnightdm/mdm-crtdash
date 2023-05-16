const fs = require('fs');

const restoreFile = () => {
  const distPath = './dist';
  const bundlePath = `${distPath}/bundle.js`;
  const backupPath = `${distPath}/bundle.js.bak`;

  if (fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, bundlePath);
    console.log(`File restored: ${bundlePath}`);
  } else {
    console.log(`Error: ${backupPath} not found`);
  }
};

restoreFile();
