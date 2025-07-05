const { google } = require("googleapis");

/**
 * The OAuth2 scopes required to access the user's profile and email information.
 * @type {string[]}
 */
const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.V2_GOOGLE_CALLBACK_URL
);

/**
 * The OAuth2 scopes required to access the user's profile and email information.
 * @type {string[]}
 */
const scopes = [
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/userinfo.email",
];

/**
 * The URL to redirect the user to for Google sign-in.
 * @type {string}
 */
const authUrl = oAuth2Client.generateAuthUrl({
    // access_type: "offline",
    scope: scopes,
});

/**
 * The `google.oauth2` object used to access the Google OAuth2 API.
 * @type {import("googleapis").oauth2_v2.Oauth2}
 */
const oauth2 = google.oauth2({
    auth: oAuth2Client,
    version: "v2",
});

module.exports = { oAuth2Client, authUrl, oauth2 };
