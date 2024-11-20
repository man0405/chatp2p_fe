// craco.config.js
const path = require("path");
const DotEnv = require("dotenv");
const webpack = require("webpack");

const ENV = process.env.DEPLOY_ENV || "dev";
const result = DotEnv.config({ path: `./.env.${ENV}` });

if (result.error) {
	throw result.error;
}

const env = DotEnv.config({ path: `./.env.${ENV}` }).parsed;
const envLocal = DotEnv.config({ path: "./.env.local" }).parsed || {};

const envKeys = Object.keys(env).reduce((prev, next) => {
	// first we search for each key inside of .env.local, because of precedence
	prev[`process.env.${next.trim()}`] = envLocal[next]
		? JSON.stringify(envLocal[next].trim())
		: JSON.stringify(env[next].trim());

	return prev;
}, {});

console.log(`
	key: ${ENV.toLocaleUpperCase()},
	value: ${process.env.REACT_APP_DEPLOY_ENV},
	accumulator: ${envKeys}
  `);

module.exports = {
	webpack: {
		alias: {
			"@": path.resolve(__dirname, "src"),
		},
		plugins: [new webpack.DefinePlugin(envKeys)],
	},
};
