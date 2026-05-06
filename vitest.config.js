"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_path_1 = __importDefault(require("node:path"));
const config_1 = require("vitest/config");
exports.default = (0, config_1.defineConfig)({
    test: {
        environment: "node",
        include: ["src/**/*.test.ts"],
        passWithNoTests: false,
    },
    resolve: {
        alias: {
            "@core": node_path_1.default.resolve(__dirname, "src/core"),
            "@modules": node_path_1.default.resolve(__dirname, "src/modules"),
            "@shared": node_path_1.default.resolve(__dirname, "src/shared"),
            "@infrastructure": node_path_1.default.resolve(__dirname, "src/infrastructure"),
        },
    },
});
