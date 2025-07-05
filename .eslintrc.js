module.exports = {
    env: {
        node: true,
        commonjs: true,
        es2021: true,
    },
    extends: ["eslint:recommended", "prettier"],
    overrides: [],
    parserOptions: {
        ecmaVersion: "latest",
    },
    rules: {
        quotes: [
            "error",
            "double",
            { avoidEscape: true, allowTemplateLiterals: false },
        ],
        "no-unused-vars": ["warn", { argsIgnorePattern: "req|res|next|val" }],
        "no-console": "warn",
        "no-var": "warn",
        "prefer-const": "warn",
    },
};
