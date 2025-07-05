
const bcrypt = require("bcrypt");
const AppLogger = require("../middlewares/logger/logger")

class Encrypter {
    constructor(saltRounds = 10) {
        this.saltRounds = saltRounds;
    }

    async hash(password) {
        try {
            const hashedPassword = await bcrypt.hashSync(password, 10);
            return hashedPassword;
        } catch (err) {
            AppLogger.error(err);
            throw err;
        }
    }
    // Method to verify a password against a hash
    async verify(inputPassword, storedHash) {
        try {
            const isMatch = await bcrypt.compareSync(inputPassword, storedHash);
            return isMatch;
        } catch (err) {
            AppLogger.error(err);
            throw err;
        }
    }
}

module.exports = Encrypter;
