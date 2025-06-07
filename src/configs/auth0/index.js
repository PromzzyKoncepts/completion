const { AuthenticationClient, ManagementClient } = require("auth0");
require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` });
const path = require("path");

require("dotenv").config({
    path: path.join(__dirname, `../envs/.env.${process.env.NODE_ENV}`),
});

const { AUTH0_DOMAIN, AUTH0_CLIENTID, AUTH0_CLIENT_SECRET } = process.env;

const authentication = new AuthenticationClient({
    domain: `${AUTH0_DOMAIN}`,
    clientId: `${AUTH0_CLIENTID}`,
    clientSecret: `${AUTH0_CLIENT_SECRET}`,
});

const management = new ManagementClient({
    domain: `${AUTH0_DOMAIN}`,
    clientId: `${AUTH0_CLIENTID}`,
    clientSecret: `${AUTH0_CLIENT_SECRET}`,
});

const deleteManagement = new ManagementClient({
    domain: `${AUTH0_DOMAIN}`,
    clientId: `${AUTH0_CLIENTID}`,
    clientSecret: `${AUTH0_CLIENT_SECRET}`,
    audience: `https://${AUTH0_DOMAIN}/api/v2/`,
    scope: "delete:users",
});

module.exports = { authentication, management, deleteManagement };
