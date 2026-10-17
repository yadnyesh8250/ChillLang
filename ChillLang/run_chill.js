#!/usr/bin/env node
/**
 * ChillLang — CLI Compiler & Runner
 * Demonstrates the 7 core phases of compiler design:
 *   1. Lexical Analysis (Tokens)
 *   2. Syntax Analysis (AST)
 *   3. Semantic Analysis & Symbol Table
 *   4. Three Address Code (TAC)
 *   5. Code Optimization (Constant Folding & Algebraic Simplification)
 *   6. Target Code Generation (JavaScript)
 *   7. Program Execution
 */

const fs = require("fs");
const path = require("path");
const chill = require("./chilllang");

// ANSI color codes
const BOLD = "\x1b[1m";
const CYAN = "\x1b[36m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const MAGENTA = "\x1b[35m";
const BLUE = "\x1b[34m";
const RED = "\x1b[31m";
const RESET = "\x1b[0m";
const DIM = "\x1b[2m";

function printHeader(title) {
  const line = "━".repeat(70);
  console.log(`\n${CYAN}${BOLD}${line}${RESET}`);
  console.log(`${CYAN}${BOLD} ▶ ${title}${RESET}`);
  console.log(`${CYAN}${BOLD}${line}${RESET}`);
}

function runDemo(source, title = "ChillLang Demonstration Program") {
  console.log(`\n${BOLD}======================================================================${RESET}`);
  console.log(`${BOLD}${GREEN} 🧊 CHILLLANG COMPILER DESIGN PIPELINE: ${title} ${RESET}`);
  console.log(`${BOLD}======================================================================${RESET}`);

  printHeader("PHASE 0: SOURCE PROGRAM (ChillLang)");
  console.log(source.trim());

  const res = chill.compile(source, { run: true });

  // Phase 1: Lexical Analysis
  printHeader("PHASE 1: LEXICAL ANALYSIS (Tokens Stream)");
  console.log(`${DIM}Total Tokens Generated: ${res.tokens.length}${RESET}\n`);
  console.log(
    `${BOLD}${"#".padEnd(5)}${"TOKEN TYPE".padEnd(18)}${"VALUE".padEnd(25)}${"LOCATION"}${RESET}`
  );
  console.log("─".repeat(70));
  res.tokens.slice(0, 15).forEach((t, i) => {
    const val = JSON.stringify(t.value);
    console.log(
      `${String(i + 1).padEnd(5)}${YELLOW}${t.type.padEnd(18)}${RESET}${val.padEnd(25)}${DIM}${t.line}:${t.column}${RESET}`
    );
  });
  if (res.tokens.length > 15) {
    console.log(`${DIM}... and ${res.tokens.length - 15} more tokens.${RESET}`);
  }

  // Phase 2: Syntax Analysis
  printHeader("PHASE 2: SYNTAX ANALYSIS (Abstract Syntax Tree / AST)");
  console.log(`${DIM}Root Node:${RESET} ${GREEN}${res.ast.type}${RESET} (${res.ast.body.length} statement(s))\n`);
  res.ast.body.forEach((s, idx) => {
    let summary = s.type;
    if (s.type === "VariableDeclaration") summary = `make ${s.name} = ...`;
    else if (s.type === "ConditionalStatement") summary = `check (...) { ... }`;
    else if (s.type === "LoopStatement") summary = `repeat (...) { ... }`;
    else if (s.type === "FunctionDeclaration") summary = `task ${s.name}(${s.params.map(p => p.name).join(", ")})`;
    else if (s.type === "OutputStatement") summary = `say(...)`;
    console.log(`  ${BOLD}[Statement ${idx + 1}]${RESET} ${MAGENTA}${s.type.padEnd(24)}${RESET} ➔ ${summary}`);
  });

  // Phase 3: Semantic Analysis & Symbol Table
  printHeader("PHASE 3: SEMANTIC ANALYSIS & SYMBOL TABLE");
  if (res.diagnostics.length === 0) {
    console.log(`${GREEN}✓ Semantic Check Passed: 0 errors, 0 warnings. Scope & types validated.${RESET}\n`);
  } else {
    res.diagnostics.forEach((d) => {
      const color = d.severity === "error" ? RED : YELLOW;
      console.log(`  ${color}[${d.severity.toUpperCase()}]${RESET} Line ${d.line}:${d.column} — ${d.message}`);
    });
    console.log();
  }

  console.log(`${BOLD}Symbol Table:${RESET}`);
  console.log(
    `${BOLD}${"#".padEnd(4)}${"IDENTIFIER".padEnd(16)}${"KIND".padEnd(14)}${"TYPE".padEnd(12)}${"SCOPE"}${RESET}`
  );
  console.log("─".repeat(70));
  res.symbolTable.forEach((sym) => {
    console.log(
      `${String(sym.index).padEnd(4)}${CYAN}${sym.name.padEnd(16)}${RESET}${sym.kind.padEnd(14)}${sym.type.padEnd(12)}${sym.scope}`
    );
  });

  // Phase 4: Three Address Code
  printHeader("PHASE 4: THREE ADDRESS CODE (Intermediate Code Generation)");
  console.log(res.tacText.trim());

  // Phase 5: Code Optimization
  printHeader("PHASE 5: CODE OPTIMIZATION (Constant Folding & Simplification)");
  if (res.optimizationStats && res.optimizationStats.optimizationsApplied) {
    console.log(`${GREEN}Optimizations Applied:${RESET}`);
    res.optimizationStats.optimizationsApplied.forEach((opt) => console.log(`  • ${opt}`));
  }
  console.log(`\n${BOLD}Optimized TAC:${RESET}`);
  console.log(res.optimizedTacText.trim());

  // Phase 6: Target Code Generation
  printHeader("PHASE 6: TARGET CODE GENERATION (JavaScript Target)");
  console.log(`${BLUE}${res.js.trim()}${RESET}`);

  // Phase 7: Program Execution
  printHeader("PHASE 7: SAFE RUNTIME EXECUTION (Sandbox Output)");
  if (res.execution && res.execution.success) {
    console.log(`${GREEN}${BOLD}Program Output:${RESET}`);
    console.log(res.execution.output || "(no output)");
    console.log(`\n${GREEN}✓ Execution completed cleanly without runtime errors.${RESET}`);
  } else if (res.execution && res.execution.error) {
    console.log(`${RED}Runtime Error: ${res.execution.error}${RESET}`);
  }
}

// Check args
const args = process.argv.slice(2);
if (args.length > 0 && fs.existsSync(args[0])) {
  const code = fs.readFileSync(args[0], "utf8");
  runDemo(code, path.basename(args[0]));
} else {
  // Run Default Program
  const sampleCode = `
// ChillLang College Mini-Project Demonstration
task add(a, b) {
  give a + b;
}

make x = 10;
make y = 20 + 5 * 2; // Constant folding demonstration
make sum = add(x, y);

say("Result of x + y:");
say(sum);

check (sum > 25) {
  say("The sum is greater than 25! Chill vibes.");
} otherwise {
  say("Sum is small.");
}

make counter = 1;
repeat (counter <= 3) {
  say("Loop counter:");
  say(counter);
  counter = counter + 1;
}
`;
  runDemo(sampleCode, "Comprehensive Language Demonstration");
}
