import { describe, it, expect } from "vitest";
const chill = require("../chilllang/index.js");

describe("ChillLang Compiler Design Test Suite", () => {
  // ── 1. Lexical Analysis ──────────────────────────────────────────────────
  describe("Phase 1: Lexical Analysis", () => {
    it("tokenizes ChillLang keywords correctly", () => {
      const code = "make check otherwise repeat task give say";
      const { tokens, errors } = new chill.ChillLexer(code).tokenize();
      expect(errors).toHaveLength(0);
      const kws = tokens.filter((t) => t.type === "KEYWORD").map((t) => t.value);
      expect(kws).toEqual(["make", "check", "otherwise", "repeat", "task", "give", "say"]);
    });

    it("tokenizes types and literals", () => {
      const code = "make a: Integer = 42; make b: decimal = 3.14; make c: string = \"chill\"; make d: boolean = true;";
      const { tokens } = new chill.ChillLexer(code).tokenize();
      const types = tokens.filter((t) => t.type === "TYPE").map((t) => t.value);
      expect(types).toContain("Integer");
      expect(types).toContain("decimal");
      expect(types).toContain("string");
      expect(types).toContain("boolean");
    });

    it("ignores single-line and multi-line comments", () => {
      const code = "// Single line comment\nmake x = 10; /* Multi\nline\ncomment */ say(x);";
      const { tokens, errors } = new chill.ChillLexer(code).tokenize();
      expect(errors).toHaveLength(0);
      const identifiers = tokens.filter((t) => t.type === "IDENTIFIER").map((t) => t.value);
      expect(identifiers).toEqual(["x", "x"]);
    });

    it("reports lexical errors for unterminated string", () => {
      const code = 'make s = "unterminated;';
      const { errors } = new chill.ChillLexer(code).tokenize();
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].phase).toBe("Lexical");
    });
  });

  // ── 2 & 3. Syntax Analysis & AST ─────────────────────────────────────────
  describe("Phase 2 & 3: Syntax Analysis & AST", () => {
    it("parses variable declarations and assignments", () => {
      const code = "make x: Integer = 100; x = x + 5;";
      const res = chill.compile(code);
      expect(res.errors).toBeUndefined();
      expect(res.ast.body).toHaveLength(2);
      expect(res.ast.body[0].type).toBe("VariableDeclaration");
      expect(res.ast.body[0].name).toBe("x");
      expect(res.ast.body[1].type).toBe("AssignmentStatement");
      expect(res.ast.body[1].target).toBe("x");
    });

    it("parses conditional statements with check and otherwise", () => {
      const code = "check (x > 0) { say(1); } otherwise { say(0); }";
      const res = chill.compile(code);
      expect(res.ast.body[0].type).toBe("ConditionalStatement");
      expect(res.ast.body[0].consequent).toBeDefined();
      expect(res.ast.body[0].alternate).toBeDefined();
    });

    it("parses repeat loops and tasks", () => {
      const code = "task multiply(a, b) { give a * b; } repeat (i < 5) { i = i + 1; }";
      const res = chill.compile(code);
      expect(res.ast.body[0].type).toBe("TaskDeclaration");
      expect(res.ast.body[0].name).toBe("multiply");
      expect(res.ast.body[0].params).toHaveLength(2);
      expect(res.ast.body[1].type).toBe("RepeatStatement");
    });
  });

  // ── 4 & 5. Semantic Analysis & Symbol Table ──────────────────────────────
  describe("Phase 4 & 5: Semantic Analysis & Symbol Table", () => {
    it("populates symbol table with variables, parameters, and tasks", () => {
      const code = "make globalVal = 50; task compute(factor) { make localVal = 10; give factor * localVal; }";
      const res = chill.compile(code);
      const names = res.symbolTable.map((s) => s.name);
      expect(names).toContain("globalVal");
      expect(names).toContain("compute");
      expect(names).toContain("factor");
      expect(names).toContain("localVal");

      // Verify scope tracking
      const factorSym = res.symbolTable.find((s) => s.name === "factor");
      expect(factorSym.scope).toContain("task:compute");
    });

    it("detects duplicate variable declarations in same scope", () => {
      const code = "make x = 10; make x = 20;";
      const res = chill.compile(code);
      expect(res.success).toBe(false);
      const duplicateErr = res.diagnostics.find((d) => d.message.includes("Duplicate variable declaration"));
      expect(duplicateErr).toBeDefined();
    });

    it("detects undefined variable usage", () => {
      const code = "say(undeclaredVar);";
      const res = chill.compile(code);
      expect(res.success).toBe(false);
      const undefErr = res.diagnostics.find((d) => d.message.includes("Undefined identifier"));
      expect(undefErr).toBeDefined();
    });

    it("detects assignment to undeclared variable", () => {
      const code = "unmade = 42;";
      const res = chill.compile(code);
      expect(res.success).toBe(false);
      const assignErr = res.diagnostics.find((d) => d.message.includes("Cannot assign to undeclared"));
      expect(assignErr).toBeDefined();
    });

    it("detects 'give' statement outside of task", () => {
      const code = "give 10;";
      const res = chill.compile(code);
      expect(res.success).toBe(false);
      const giveErr = res.diagnostics.find((d) => d.message.includes("'give' statement must be inside"));
      expect(giveErr).toBeDefined();
    });
  });

  // ── 6. Intermediate Code Generation (TAC) ────────────────────────────────
  describe("Phase 6: Three-Address Code (TAC)", () => {
    it("generates temporaries and 3-address instructions for arithmetic", () => {
      const code = "make x = 10 + 20 * 3;";
      const res = chill.compile(code);
      expect(res.tac.length).toBeGreaterThan(0);
      const hasMultiply = res.tac.some((inst) => inst.op === "*");
      const hasAdd = res.tac.some((inst) => inst.op === "+");
      expect(hasMultiply).toBe(true);
      expect(hasAdd).toBe(true);
    });

    it("generates branch and label instructions for conditionals and loops", () => {
      const code = "check (a > b) { say(a); } repeat (x < 10) { x = x + 1; }";
      const res = chill.compile(code);
      const hasIfFalse = res.tac.some((inst) => inst.op === "if_false");
      const hasGoto = res.tac.some((inst) => inst.op === "goto");
      const hasLabel = res.tac.some((inst) => inst.op === "label");
      expect(hasIfFalse).toBe(true);
      expect(hasGoto).toBe(true);
      expect(hasLabel).toBe(true);
    });
  });

  // ── 7. Code Optimization ─────────────────────────────────────────────────
  describe("Phase 7: Code Optimization", () => {
    it("folds compile-time constants", () => {
      const code = "make a = 10 + 20; say(a);";
      const res = chill.compile(code);
      expect(res.optimizationStats.constantFolds).toBeGreaterThan(0);
      expect(res.optimizedTacText).toContain("a = 30");
    });

    it("applies algebraic simplifications", () => {
      const code = "make x = 100; make y = x * 1; make z = y + 0; make zero = z * 0; say(x); say(y); say(z); say(zero);";
      const res = chill.compile(code);
      expect(res.optimizedTacText).toContain("zero = 0");
      expect(res.optimizedTac.length).toBeLessThan(res.tac.length);
    });
  });

  // ── 8 & 9. Code Generation & Execution ───────────────────────────────────
  describe("Phase 8 & 9: Code Generation & Execution", () => {
    it("generates correct JavaScript and runs factorial program", () => {
      const code = `
task factorial(n: Integer): Integer {
  make res = 1;
  make i = 1;
  repeat (i <= n) {
    res = res * i;
    i = i + 1;
  }
  give res;
}
make ans = factorial(5);
say(ans);
`;
      const res = chill.compile(code, { run: true });
      expect(res.success).toBe(true);
      expect(res.js).toContain("function factorial(n)");
      expect(res.js).toContain("while ((i <= n))");
      expect(res.js).toContain("console.log(ans);");
      expect(res.execution.output.trim()).toBe("120");
    });

    it("executes multi-branch conditionals correctly", () => {
      const code = `
make x = 15;
check (x > 20) {
  say("big");
} otherwise check (x > 10) {
  say("medium");
} otherwise {
  say("small");
}
`;
      const res = chill.compile(code, { run: true });
      expect(res.success).toBe(true);
      expect(res.execution.output.trim()).toBe("medium");
    });
  });
});
