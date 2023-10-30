import path from "path";
import fs from "fs";
import util from "util";
import { rspack, RspackOptions, cleverMerge } from "../src";
import serializer from "jest-serializer-path";

expect.addSnapshotSerializer(serializer);

const project_dir_reg = new RegExp(
	path.join(__dirname, "..").replace(/\\/g, "\\\\"),
	"g"
);

const base = path.resolve(__dirname, "statsCases");
const outputBase = path.resolve(__dirname, "stats");
const tests = fs.readdirSync(base).filter(testName => {
	return (
		!testName.startsWith(".") &&
		(fs.existsSync(path.resolve(base, testName, "index.js")) ||
			fs.existsSync(path.resolve(base, testName, "webpack.config.js")))
	);
});

describe("StatsTestCases", () => {
	tests.forEach(testName => {
		it("should print correct stats for " + testName, async () => {
			const context = path.resolve(base, testName);
			const outputPath = path.resolve(base, testName, "dist");
			const configPath = path.resolve(base, testName, "webpack.config.js");
			let config = {};
			if (fs.existsSync(configPath)) {
				config = require(configPath);
			}
			let options: RspackOptions[] = (
				Array.isArray(config) ? config : [config]
			).map(c => {
				const result: RspackOptions = {
					target: "node",
					context,
					entry: {
						main: "./index"
					},
					output: {
						filename: "bundle.js"
					},
					...c
				};
				result.output!.path = outputPath;
				return result;
			});
			const stats = await util.promisify(rspack)(options);
			if (!stats) return expect(false);
			for (const option of options) {
				const statsOptions = option.stats ?? {
					all: true,
					timings: false,
					builtAt: false,
					version: false
				};
				let statsString = stats.toString(statsOptions);
				statsString = statsString
					.replace(/\u001b\[[0-9;]*m/g, "")
					.replace(/[.0-9]+(\s?ms)/g, "X$1") // replace xxxms with Xms so make timstamp stable in CI
					.replace(project_dir_reg, "<PROJECT_ROOT>")
					.replace(/\\/g, "/");
				expect(statsString).toMatchSnapshot();
			}
		});
	});
});
