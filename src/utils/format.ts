import chalk from "chalk";

/**
 * Print the devlog banner.
 */
export function printBanner(): void {
  console.log(
    chalk.cyan(
      [
        "╔═══════════════════════════════╗",
        "║   devlog — dev journal CLI    ║",
        "║   local-first  •  open source ║",
        "╚═══════════════════════════════╝",
      ].join("\n"),
    ),
  );
  console.log();
}

/**
 * Print a success message with a checkmark.
 */
export function printSuccess(message: string): void {
  console.log(chalk.green(`✓ ${message}`));
}

/**
 * Print an error message.
 */
export function printError(message: string): void {
  console.error(chalk.red(`✗ ${message}`));
}

/**
 * Print a dev summary with header and separator.
 */
export function printSummary(header: string, summary: string): void {
  console.log(chalk.bold(header));
  console.log(chalk.dim("─".repeat(40)));
  console.log(summary);
  console.log();
}
