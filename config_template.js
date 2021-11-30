const path = require("path");

// Use this template to create config.js
// 1. Create a copy of this file
// 2. Rename the copy to config.js
// 3. Change the config object so it fits your needs

const config = {
  ssl: {
    enabled: true, // set to false for http
    secure: true, // set to false for self-signed certificates
    key: path.resolve(__dirname, "./security/key.pem"), // may be nullish if enabled is false
    cert: path.resolve(__dirname, "./security/cert.pem"), // may be nullish if enabled is false
  },
};

module.exports = config;
