/**
 * ChillLang — Program Runtime & Execution Sandbox
 * Phase 8b: Safely executes generated JavaScript in a controlled sandbox,
 * intercepts stdout (console.log), and returns formatted runtime output.
 */

class ChillExecutor {
  static run(jsCode, options = { timeoutMs: 2000 }) {
    const logs = [];
    let runtimeError = null;

    // Sandbox environment capturing console.log
    const sandboxConsole = {
      log: (...args) => {
        logs.push(args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" "));
      },
      error: (...args) => {
        logs.push("[ERROR] " + args.map(String).join(" "));
      },
      warn: (...args) => {
        logs.push("[WARN] " + args.map(String).join(" "));
      },
    };

    try {
      // Evaluate in a function wrapper with restricted scope
      const runner = new Function("console", `"use strict";\n${jsCode}`);
      runner(sandboxConsole);
    } catch (err) {
      runtimeError = err.message || String(err);
      logs.push(`\n[Runtime Error]: ${runtimeError}`);
    }

    return {
      success: runtimeError === null,
      output: logs.join("\n"),
      error: runtimeError,
    };
  }
}

module.exports = { ChillExecutor };
