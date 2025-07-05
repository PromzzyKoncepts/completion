class AuthUtils {
    static getUserId(sub) {
        return sub.split("|")[1];
    }

    static getSocialShort(sub) {
        return sub.split("|")[0];
    }
}

module.exports = AuthUtils;
