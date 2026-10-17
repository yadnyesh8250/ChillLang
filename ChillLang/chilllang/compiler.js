/**
 * ChillLang — Multi-Phase Compiler Orchestrator
 * Integrates all 7 classical phases into a cohesive compiler pipeline:
 *   Phase 1: Lexical Analysis (Tokens)
 *   Phase 2: Syntax Analysis (Parser)
 *   Phase 3: AST Construction
 *   Phase 4: Semantic Analysis & Diagnostics
 *   Phase 5: Symbol Table Management
 *   Phase 6: Intermediate Code Generation (TAC)
 *   Phase 7: Code Optimization (Constant Folding & Algebraic Simplification)
 *   Phase 8: Target Code Generation (JavaScript)
 *   Phase 9: Execution Sandbox
 */

const { ChillLexer } = require("./lexer");
const { ChillParser } = require("./parser");
const { ChillSemanticAnalyzer } = require("./semantic");
const { ChillTACGenerator } = require("./tac");
const { ChillOptimizer } = require("./optimizer");
const { ChillJSGenerator } = require("./codegen");
const { ChillExecutor } = require("./executor");

class ChillCompiler {
  static compile(sourceCode = "", options = { run: false }) {
    const startTime = Date.now();
    const allDiagnostics = [];

    // ── Phase 1: Lexical Analysis ──────────────────────────────────────────
    const lexer = new ChillLexer(sourceCode);
    const { tokens, errors: lexErrors } = lexer.tokenize();
    for (const e of lexErrors) {
      allDiagnostics.push({ ...e, phase: "Lexical", severity: "error" });
    }

    // ── Phase 2 & 3: Syntax Analysis & AST Construction ────────────────────
    const parser = new ChillParser(tokens);
    const { ast, errors: parseErrors } = parser.parse();
    for (const e of parseErrors) {
      allDiagnostics.push({ ...e, phase: "Syntax", severity: "error" });
    }

    // ── Phase 4 & 5: Semantic Analysis & Symbol Table ──────────────────────
    const semanticAnalyzer = new ChillSemanticAnalyzer(ast);
    const { symbolTable, errors: semErrors, warnings: semWarnings } = semanticAnalyzer.analyze();
    for (const e of semErrors) {
      allDiagnostics.push({ ...e, phase: "Semantic", severity: "error" });
    }
    for (const w of semWarnings) {
      allDiagnostics.push({ ...w, phase: "Semantic", severity: "warning" });
    }

    // ── Phase 6: Intermediate Code Generation (Three-Address Code) ─────────
    const tacGenerator = new ChillTACGenerator(ast);
    const tacResult = tacGenerator.generate();

    // ── Phase 7: Code Optimization ─────────────────────────────────────────
    const optimizer = new ChillOptimizer(tacResult.instructions);
    const optResult = optimizer.optimize();

    // ── Phase 8: Target Code Generation (JavaScript) ───────────────────────
    const jsGenerator = new ChillJSGenerator(ast);
    const jsCode = jsGenerator.generate();

    const elapsedTime = Date.now() - startTime;
    const hasFatalErrors = allDiagnostics.some((d) => d.severity === "error");

    // Optional execution
    let executionResult = null;
    if (options.run && !hasFatalErrors) {
      executionResult = ChillExecutor.run(jsCode);
    }

    return {
      success: !hasFatalErrors,
      elapsedTimeMs: elapsedTime,
      // Phase outputs
      tokens,
      ast,
      symbolTable,
      diagnostics: allDiagnostics,
      // Intermediate Code
      tac: tacResult.instructions,
      tacText: tacResult.text,
      tacQuadruples: tacResult.quadruples,
      // Optimized Intermediate Code
      optimizedTac: optResult.instructions,
      optimizedTacText: optResult.text,
      optimizedTacQuadruples: optResult.quadruples,
      optimizationStats: optResult.stats,
      // Target Code
      js: jsCode,
      // Execution
      execution: executionResult,
      run: () => ChillExecutor.run(jsCode),
    };
  }
}

module.exports = { ChillCompiler };
