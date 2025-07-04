const SftpClient = require('ssh2-sftp-client');
const path = require('path');
const fs = require('fs');

// Set up SFTP client
const sftp = new SftpClient();

// Set up connection options
const options = {
    host: '45.79.25.138',
    port: 22,
    username: 'root',
    password: 'AstroPlanetSoup'
};

// Set up remote directory path
const remotePath = '/var/lib/docker/volumes/webcam.carifenzel.cf';

// Set up local directory path
const localPath = path.resolve(__dirname, 'dist');

// Check if remote directory exists
let directoryExists = false;

sftp.connect(options)
    .then(() => {
        return sftp.exists(remotePath);
    })
    .then((exists) => {
        directoryExists = exists;
    })
    .then(() => {
        return sftp.end();
    })
    .then(() => {
        if (directoryExists) {
            console.log(`Remote directory ${remotePath} already exists`);
        } else {
            console.log(`Remote directory ${remotePath} does not exist`);

            return sftp.connect(options)
                .then(() => {
                    console.log('Connected to SFTP server');

                    return sftp.mkdir(remotePath, true);
                })
                .then(() => {
                    console.log(`Created remote directory: ${remotePath}`);

                    return sftp.end();
                })
                .then(() => {
                    console.log('Disconnected from SFTP server');
                })
                .catch((err) => {
                    console.error(`Error: ${err.message}`);
                    sftp.end();
                });
        }
    })
    .then(() => {
        return sftp.connect(options);
    })
    .then(() => {
        console.log('Connected to SFTP server');

        return sftp.uploadDir(localPath, remotePath);
    })
    .then(() => {
        console.log(`Uploaded local directory ${localPath} to remote directory ${remotePath}`);

        return sftp.end();
    })
    .then(() => {
        console.log('Disconnected from SFTP server');
    })
    .catch((err) => {
        console.error(`Error: ${err.message}`);
        sftp.end();
    });