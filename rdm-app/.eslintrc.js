// assets/.eslintrc.js
module.exports = {
    root: true,

    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },

    env: {
        browser: true,
        es6: true,
        node: true,
    },

    extends: [
        "eslint:recommended",
        "plugin:prettier/recommended",
    ],

    rules: {
        // 👇 downgrade Prettier from error → warning
        "prettier/prettier": "warn",
    },
};
