#!/usr/bin/env node
/**
 * ============================================================================
 * COMPILER DESIGN MINI PROJECT: NODEON COMPILER PIPELINE DEMO
 * ============================================================================
 * This script demonstrates the core phases of compiler design:
 *   Phase 1: Lexical Analysis (Scanner / Lexer -> Token Stream)
 *   Phase 2: Syntax Analysis (Parser -> Abstract Syntax Tree / AST)
 *   Phase 3: Semantic Analysis (Type Checker & Symbol / Scope Validation)
 *   Phase 4: Target Code Generation (AST -> JavaScript Target Code)
 *   Phase 5: Target Code Execution (Runtime evaluation & Output)
 * ============================================================================
 */

const fs = require("fs");
const path = require("path");
const { Lexer, compileToAST, typeCheck, compile } = require("./dist/nodeon-compiler.cjs");

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
  const line = "━".repeat(70);
  console.log(`\n${CYAN}${BOLD}${line}${RESET}`);
  console.log(`${CYAN}${BOLD} ▶ ${title}${RESET}`);
  console.log(`${CYAN}${BOLD}${line}${RESET}`);
}

function runCompilerPipeline(sourceCode, programName = "Sample Program") {
  console.log(`\n${BOLD}======================================================================${RESET}`);
  console.log(`${BOLD}${GREEN} COMPILER DESIGN PIPELINE EXECUTION: ${programName} ${RESET}`);
  console.log(`${BOLD}======================================================================${RESET}`);

  // 0. SOURCE CODE
  printHeader("PHASE 0: SOURCE PROGRAM (High-Level Nodeon Code)");
  console.log(sourceCode.trim());

  // 1. LEXICAL ANALYSIS (LEXER / SCANNER)
  printHeader("PHASE 1: LEXICAL ANALYSIS (Scanner -> Tokens)");
  const lexer = new Lexer(sourceCode);
  const tokens = lexer.tokenize();
  console.log(`${DIM}Total Tokens Generated: ${tokens.length}${RESET}\n`);

  console.log(
    `${BOLD}${"INDEX".padEnd(8)}${"TOKEN TYPE".padEnd(20)}${"VALUE".padEnd(24)}${"LOCATION (Line:Col)"}${RESET}`
  );
  console.log("─".repeat(70));
  tokens.slice(0, 15).forEach((t, i) => {
    const val = JSON.stringify(t.value);
    console.log(
      `${String(i + 1).padEnd(8)}${YELLOW}${t.type.padEnd(20)}${RESET}${val.padEnd(24)}${DIM}${t.loc.line}:${t.loc.column}${RESET}`
    );
  });
  if (tokens.length > 15) {
    console.log(`${DIM}... and ${tokens.length - 15} more tokens.${RESET}`);
  }

  // 2. SYNTAX ANALYSIS (PARSER -> AST)
  printHeader("PHASE 2: SYNTAX ANALYSIS (Parsing -> Abstract Syntax Tree)");
  const ast = compileToAST(sourceCode);
  console.log(`${DIM}Root Node:${RESET} ${GREEN}${ast.type}${RESET} (${ast.body.length} top-level statement(s))\n`);
  
  ast.body.forEach((stmt, idx) => {
    const summary = stmt.type === "FunctionDeclaration"
      ? `Function '${stmt.name?.name}' (params: ${stmt.params.map(p => p.name).join(", ") || "none"})`
      : stmt.type === "VariableDeclaration"
      ? `Variable '${stmt.name?.name}' [${stmt.kind}]`
      : stmt.type;
    console.log(`  ${BOLD}[Statement ${idx + 1}]${RESET} ${MAGENTA}${stmt.type}${RESET} ➔ ${summary}`);
  });

  console.log(`\n${DIM}Detailed AST Structure (First Node Sample):${RESET}`);
  console.log(JSON.stringify(ast.body[0], null, 2).split("\n").slice(0, 20).join("\n") + "\n  ...");

  // 3. SEMANTIC ANALYSIS (TYPE CHECKING)
  printHeader("PHASE 3: SEMANTIC ANALYSIS (Type Checking & Scope Validation)");
  const diagnostics = typeCheck(ast);
  if (!diagnostics || diagnostics.length === 0) {
    console.log(`${GREEN}✓ Semantic Check Passed: 0 errors, 0 warnings. Symbol bindings & types validated.${RESET}`);
  } else {
    console.log(`${RED}Semantic Diagnostics Found (${diagnostics.length}):${RESET}`);
    diagnostics.forEach((d, i) => {
      console.log(`  [${i + 1}] ${d.source || "TypeChecker"}: ${d.message}`);
    });
  }

  // 4. CODE GENERATION (TARGET CODE EMISSION)
  printHeader("PHASE 4: CODE GENERATION (AST -> Target JavaScript)");
  const compileResult = compile(sourceCode);
  console.log(`${BLUE}${compileResult.js.trim()}${RESET}`);

  // 5. RUNTIME EXECUTION
  printHeader("PHASE 5: RUNTIME EXECUTION (Running Target Program)");
  try {
    eval(compileResult.js);
    console.log(`\n${GREEN}${BOLD}✓ Execution completed successfully!${RESET}`);
  } catch (err) {
    console.log(`${RED}Runtime error during execution: ${err.message}${RESET}`);
  }
}

// Default demonstration programs
const DEMO_PROGRAMS = {
  factorial: `
// Recursive Factorial Calculation
fn factorial(n: number): number {
  if n <= 1 {
    return 1
  }
  return n * factorial(n - 1)
}

const inputNumber = 6
const result = factorial(inputNumber)
print("Computed factorial of {inputNumber} = {result}")
`,

  fibonacci: `
// Iterative Fibonacci with Loop & Ranges
fn fibonacci(n: number) {
  let a = 0
  let b = 1
  for i in 0..n {
    print("Fib({i}) = {a}")
    let next = a + b
    a = b
    b = next
  }
}

print("Fibonacci Sequence up to 7:")
fibonacci(7)
`,

  oop: `
// Object-Oriented Class & Method Synthesis
class Calculator {
  #prefix = "Result"

  fn add(a: number, b: number): number {
    a + b
  }

  fn display(val: number) {
    print("{this.#prefix}: {val}")
  }
}

const calc = new Calculator()
const sum = calc.add(25, 17)
calc.display(sum)
`
};

// Check if a file argument was passed
const args = process.argv.slice(2);
if (args.length > 0 && fs.existsSync(args[0])) {
  const filePath = args[0];
  const fileContent = fs.readFileSync(filePath, "utf8");
  runCompilerPipeline(fileContent, path.basename(filePath));
} else {
  // Run all demonstration programs
  console.log(`${BOLD}${CYAN}Welcome to the Compiler Design Project Demonstration${RESET}`);
  console.log(`${DIM}Language: Nodeon | Target: JavaScript | Phases: Lexer, Parser, TypeCheck, CodeGen, Runtime${RESET}`);

  runCompilerPipeline(DEMO_PROGRAMS.factorial, "1. Recursive Factorial (Functions, Conditionals, Types)");
  runCompilerPipeline(DEMO_PROGRAMS.fibonacci, "2. Fibonacci Sequence (Loops, String Interpolation, Scope)");
  runCompilerPipeline(DEMO_PROGRAMS.oop, "3. Calculator Class (OOP Constructs, Method Emission, Classes)");
}
