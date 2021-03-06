const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CheckerPlugin } = require("awesome-typescript-loader");

///////////////////////////////////////
// Defaults
///////////////////////////////////////

const defaults = {
	mode : "development",
	context : __dirname,
	entry : {
		Tone : "./Tone/index.ts",
	},
	output : {
		path : path.resolve(__dirname, "build"),
		filename : "[name].js",
		library : "Tone",
		libraryTarget : "umd",
	},
	resolve : {
		extensions: ['.ts', '.js'],
		modules : [
			"node_modules",
			path.resolve(__dirname, "."),
			path.resolve(__dirname, "test")
		],
	},
	module: {
    rules: [
      {
        test: /\.ts?$/,
        loader: 'awesome-typescript-loader'
      }
    ]
  },
	devtool : "cheap-source-map",
};

///////////////////////////////////////
// Scratch
///////////////////////////////////////

const scratch = Object.assign({}, defaults, {
	entry : {
		scratch : "./scratch.js",
	},
	plugins : [
		new HtmlWebpackPlugin()
	],
});

///////////////////////////////////////
// Tests
///////////////////////////////////////

const test = Object.assign({}, defaults, {
	entry : {
		test : "./test/test.js",
	},
	plugins : [
		new CheckerPlugin(),
		new HtmlWebpackPlugin({
			filename : "test.html",
			template : "./test/index.html",
		})
	],
});

///////////////////////////////////////
// Production
///////////////////////////////////////

const production = Object.assign({}, defaults, {
	mode : "production",
	devtool : "source-map",
});

module.exports = env => {
	if (env.test){
		return test;
	} else if (env.production){
		return production;
	} else {
		return scratch;
	}
};
