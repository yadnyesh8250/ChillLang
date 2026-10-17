#!/usr/bin/env node
/**
 * ============================================================================
 * CHILLLANG COMPILER: MULTI-PHASE COMPILER PIPELINE DEMO
 * ============================================================================
 * Academic demonstration script showing all classical compiler phases:
 *   Phase 1: Lexical Analysis (Tokens)
 *   Phase 2: Syntax Analysis & AST Construction
 *   Phase 3: Semantic Analysis & Scope Diagnostics
 *   Phase 4: Multi-Level Symbol Table
 *   Phase 5: Intermediate Code Generation (Three-Address Code - TAC)
 *   Phase 6: Code Optimization (Constant Folding & Algebraic Simplification)
 *   Phase 7: Target Code Generation (JavaScript)
 *   Phase 8: Sandboxed Execution & Output
 * ============================================================================
 */

const fs = require("fs");
const path = require("path");
const chill = require("./chilllang/index.js");

// ANSI terminal colors
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
  const line = "━".repeat(74);
  console.log(`\n${CYAN}${BOLD}${line}${RESET}`);
  console.log(`${CYAN}${BOLD} ▶ ${title}${RESET}`);
  console.log(`${CYAN}${BOLD}${line}${RESET}`);
}

function runDemo(sourceCode, programName = "Sample Program") {
  console.log(`\n${BOLD}==========================================================================${RESET}`);
  console.log(`${BOLD}${GREEN} CHILLLANG COMPILER PIPELINE: ${programName} ${RESET}`);
  console.log(`${BOLD}==========================================================================${RESET}`);

  // 0. SOURCE CODE
  printHeader("PHASE 0: SOURCE CODE (ChillLang High-Level Language)");
  console.log(sourceCode.trim());

  const result = chill.compile(sourceCode, { run: true });

  // 1. LEXICAL ANALYSIS
  printHeader(`PHASE 1: LEXICAL ANALYSIS (Total Tokens: ${result.tokens.length})`);
  console.log(
    `${BOLD}${"#".padEnd(5)}${"TYPE".padEnd(16)}${"VALUE / LEXEME".padEnd(24)}${"LOCATION"}${RESET}`
  );
  console.log("─".repeat(70));
  result.tokens.slice(0, 16).forEach((t) => {
    const val = JSON.stringify(t.value);
    console.log(
      `${String(t.index).padEnd(5)}${YELLOW}${t.type.padEnd(16)}${RESET}${val.padEnd(24)}${DIM}Line ${t.line}:${t.column}${RESET}`
    );
  });
  if (result.tokens.length > 16) {
    console.log(`${DIM}... and ${result.tokens.length - 16} more tokens.${RESET}`);
  }

  // 2. SYNTAX ANALYSIS & AST
  printHeader(`PHASE 2 & 3: SYNTAX ANALYSIS & AST (Root: Program, ${result.ast.body.length} Statement(s))`);
  result.ast.body.forEach((stmt, idx) => {
    let detail = "";
    if (stmt.type === "VariableDeclaration") {
      detail = `Variable '${stmt.name}' (type: ${stmt.dataType || "inferred"})`;
    } else if (stmt.type === "TaskDeclaration") {
      detail = `Task '${stmt.name}' (params: ${stmt.params.map((p) => p.name).join(", ") || "none"})`;
    } else if (stmt.type === "ConditionalStatement") {
      detail = `Check/Otherwise conditional statement`;
    } else if (stmt.type === "RepeatStatement") {
      detail = `Repeat loop statement`;
    } else if (stmt.type === "SayStatement") {
      detail = `Say output statement`;
    } else {
      detail = stmt.type;
    }
    console.log(`  ${BOLD}[Stmt ${idx + 1}]${RESET} ${MAGENTA}${stmt.type.padEnd(24)}${RESET} ➔ ${detail}`);
  });

  // 3. SEMANTIC ANALYSIS & SYMBOL TABLE
  printHeader("PHASE 4 & 5: SEMANTIC ANALYSIS & SYMBOL TABLE");
  if (result.diagnostics.length === 0) {
    console.log(`${GREEN}✓ Semantic Validation Passed: 0 errors, 0 warnings. Scopes and bindings valid.${RESET}\n`);
  } else {
    console.log(`${RED}Semantic Diagnostics (${result.diagnostics.length}):${RESET}\n`);
    result.diagnostics.forEach((d, i) => {
      console.log(`  [${i + 1}] [${d.phase || "Semantic"}] Line ${d.line}:${d.column} - ${d.message}`);
    });
    console.log();
  }

  console.log(`${BOLD}${"#".padEnd(5)}${"SYMBOL".padEnd(14)}${"TYPE".padEnd(22)}${"KIND".padEnd(14)}${"SCOPE"}${RESET}`);
  console.log("─".repeat(70));
  result.symbolTable.forEach((s) => {
    console.log(
      `${String(s.index).padEnd(5)}${CYAN}${s.name.padEnd(14)}${RESET}${s.type.padEnd(22)}${YELLOW}${s.kind.padEnd(14)}${RESET}${DIM}${s.scope}${RESET}`
    );
  });

  // 4. INTERMEDIATE CODE GENERATION (TAC)
  printHeader(`PHASE 6: INTERMEDIATE CODE GENERATION (Three-Address Code - TAC: ${result.tac.length} instrs)`);
  console.log(result.tacText);

  // 5. CODE OPTIMIZATION
  printHeader(`PHASE 7: CODE OPTIMIZATION (Optimized TAC: ${result.optimizedTac.length} instrs)`);
  console.log(
    `${DIM}Optimization Stats: ${result.optimizationStats.constantFolds} constant folds, ${result.optimizationStats.algebraicSimplifications} algebraic simplifications (${result.optimizationStats.instructionsBefore} -> ${result.optimizationStats.instructionsAfter} instrs)${RESET}\n`
  );
  console.log(result.optimizedTacText);

  // 6. TARGET CODE GENERATION
  printHeader("PHASE 8: TARGET CODE GENERATION (JavaScript Target)");
  console.log(`${BLUE}${result.js}${RESET}`);

  // 7. PROGRAM EXECUTION
  printHeader("PHASE 9: PROGRAM EXECUTION RUNTIME (Sandboxed Output)");
  if (result.execution && result.execution.success) {
    console.log(`${GREEN}${BOLD}${result.execution.output}${RESET}`);
    console.log(`\n${GREEN}✓ Program executed cleanly without runtime errors! (${result.elapsedTimeMs}ms compilation)${RESET}`);
  } else if (result.execution) {
    console.log(`${RED}Runtime error: ${result.execution.error}${RESET}`);
  }
}

// Sample ChillLang Programs
const DEMOS = {
  factorial: `
// 1. Recursive / Iterative Task & Loops
task factorial(n: Integer): Integer {
  make result = 1;
  make i = 1;
  repeat (i <= n) {
    result = result * i;
    i = i + 1;
  }
  give result;
}

make num = 5;
make fact = factorial(num);
say(fact);
`,

  optimization: `
// 2. Constant Folding & Algebraic Simplification Demo
make basePrice = 100 + 50 * 2; // Constant folding: 100 + 100 = 200
make discount = basePrice * 0;  // Algebraic simplification: x * 0 = 0
make finalPrice = basePrice + 0; // Algebraic simplification: x + 0 = x
check (finalPrice > 150) {
  say(finalPrice);
} otherwise {
  say(0);
}
`,

  semantics: `
// 3. Conditionals, Functions & Output
make score = 85;
task getGrade(s: Integer): string {
  check (s >= 90) {
    give "A";
  } otherwise check (s >= 80) {
    give "B";
  } otherwise {
    give "C";
  }
}

say(getGrade(score));
`
};

const args = process.argv.slice(2);
if (args.length > 0 && fs.existsSync(args[0])) {
  const filePath = args[0];
  const content = fs.readFileSync(filePath, "utf8");
  runDemo(content, path.basename(filePath));
} else {
  console.log(`${BOLD}${CYAN}Welcome to ChillLang: A Multi-Phase Mini Programming Language & Compiler${RESET}`);
  console.log(`${DIM}Designed for College Compiler Design Project Demonstration${RESET}`);

  runDemo(DEMOS.factorial, "1. Factorial Task & Loops (task, repeat, say)");
  runDemo(DEMOS.optimization, "2. Constant Folding & Algebraic Simplification (TAC Optimization)");
  runDemo(DEMOS.semantics, "3. Multi-Branch Conditionals & Functions (check/otherwise, give)");
}
