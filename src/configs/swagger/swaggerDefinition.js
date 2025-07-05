const swaggerSchemas = require("./swaggerSchemas");
const path = require("path");
/**
 * @typedef {Object} swaggerOptions - The options for generating the API documentation using swagger-jsdoc
 */
const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        /**
         * @property {Object} info - General information about the API
         */
        info: {
            title: "Positiveo API Documentation",
            description: "This is the API documentation for Positiveo API",
            version: "1.0.0",
        },

        /**
         * @property {Object} externalDocs - Additional external documentation related to the API
         */
        externalDocs: {
            url: "https://swagger.io",
            description: "Find more info here",
        },

        /**
         * @property {Object} components - Reusable components for the API
         */
        components: {
            /**
             * @property {Object} schemas - Defines the schema of the API, generated from the mongoose models using the mongoose-to-swagger package.
             */
            schemas: swaggerSchemas,
        },

        /**
         * @property {String} host - The host name of the API
         */
        host: "localhost",

        /**
         * @property {Array} schemes - The protocol schemes of the API
         */
        schemes: ["http"],
        /**
         * @property {Array} consumes - The media types that the API can consume
         */
        consumes: ["application/json"],

        /**
         * @property {Array} produces - The media types that the API can produce
         */
        produces: ["application/json"],
    },

    /**
     * @property {Array} apis - The routes of the application, used by swagger-jsdoc to generate the documentation
     */
    apis: [path.resolve(`${__dirname}/../../routes/api/*.js`)],
};

/**
 * This module exports the options for generating the APIdocumentation using swagger-jsdoc.
 * @module swaggerDefinition
 */
module.exports = swaggerOptions;
