// scripts/validate-commit-msg.js
const fs = require("fs");
const path = require("path");

const msgPath = process.argv[2];
if (!msgPath) {
  console.error("Error: No commit message file path provided.");
  process.exit(1);
}

const resolvedPath = path.resolve(msgPath);
if (!fs.existsSync(resolvedPath)) {
  console.error(`Error: Commit message file does not exist at: ${resolvedPath}`);
  process.exit(1);
}

const commitMsg = fs.readFileSync(resolvedPath, "utf8");

// Clean comments (lines starting with #) and trim
const lines = commitMsg
  .split("\n")
  .map((line) => line.trim())
  .filter((line) => !line.startsWith("#"));

const cleanedMsg = lines.join("\n").trim();

if (!cleanedMsg) {
  console.error("Error: Commit message cannot be empty.");
  process.exit(1);
}

// Allow auto-generated git merge/revert messages
if (
  cleanedMsg.startsWith("Merge branch") ||
  cleanedMsg.startsWith("Merge pull request") ||
  cleanedMsg.startsWith("Revert ")
) {
  process.exit(0);
}

// Conventional Commits regex pattern (with relaxed spacing around the colon)
// Format: type(scope)?: description
// Examples: feat : add user validation, fix(auth):correct password, chore: install husky
const conventionalPattern =
  /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert|config)(?:\([a-zA-Z0-9_\-\/]+\))?(!)?\s*:\s*.+/;

// Square bracket prefix style (e.g. [feat] add user, [fix](auth): correct description, [docs] - update README)
const bracketPattern =
  /^\[(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert|config)\](?:\([a-zA-Z0-9_\-\/]+\))?(!)?\s*[:\-]?\s*.+/;

const firstLine = lines[0] || "";

const isValid = conventionalPattern.test(firstLine) || bracketPattern.test(firstLine);

if (!isValid) {
  console.error("\n=======================================================");
  console.error("❌ INVALID COMMIT MESSAGE FORMAT");
  console.error("=======================================================");
  console.error(`Your commit message first line: "${firstLine}"`);
  console.error("\nPlease structure your commit message using one of these styles:");
  console.error("  1. Conventional Commits:  <type>(<scope>)?: <subject>");
  console.error("  2. Square Brackets style: [<type>](<scope>)?:? <subject>");
  console.error("\nAllowed types:");
  console.error("  feat     - A new feature");
  console.error("  fix      - A bug fix");
  console.error("  docs     - Documentation changes");
  console.error("  style    - Formatting, semicolons, etc. (no business code changes)");
  console.error("  refactor - Code changes that neither fix a bug nor add a feature");
  console.error("  perf     - Performance improvement");
  console.error("  test     - Adding or correcting tests");
  console.error("  build    - Build system, tooling, or external dependencies");
  console.error("  ci       - CI configuration files and scripts");
  console.error("  chore    - Housekeeping tasks (maintenance, package updates, etc.)");
  console.error("  revert   - Reverting a previous commit");
  console.error("\nExamples:");
  console.error("  feat(vent) : add support boolean for therapy suggestion");
  console.error("  [feat] add support boolean for therapy suggestion");
  console.error("  [fix](auth) - correct password hash comparison");
  console.error("  chore: install husky and prettier devDependencies");
  console.error("=======================================================\n");
  process.exit(1);
}

// Optional check: subject line length should be <= 72 characters
if (firstLine.length > 72) {
  console.warn(
    `⚠️ Warning: Commit message subject line is longer than 72 characters (${firstLine.length} chars).`
  );
}

process.exit(0);
