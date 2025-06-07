const admin = require("firebase-admin");
const serviceAccount = require("../configs/firebase/serviceAccountkey.json");  // Adjust the path

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
