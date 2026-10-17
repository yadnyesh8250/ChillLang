# ChillLang: A Multi-Phase Mini Programming Language & Compiler
## Academic Project Manual & Viva Examination Guide
**Subject:** Compiler Design (Sem 5)  
**Project Title:** ChillLang: Multi-Phase Mini Programming Language and Compiler  

---

## 1. Problem Statement, Aim & Objectives

### Problem Statement
Most modern industrial compilers (GCC, Clang, V8) are massive, monolithic systems with millions of lines of code. For students studying Compiler Design, it is challenging to grasp the step-by-step transformations that code undergoes across classical compiler phases.

### Aim
To design and implement **ChillLang**, a simplified, educational, multi-phase programming language and compiler adapted from the Nodeon architecture, demonstrating all classical phases of compiler construction with transparent, inspectable intermediate outputs.

### Objectives
1. **Lexical Analysis (Scanner):** Convert high-level ChillLang source code into a stream of categorized tokens.
2. **Syntax Analysis (Parser):** Verify grammatical correctness and construct an Abstract Syntax Tree (AST).
3. **Semantic Analysis:** Enforce scope rules, detect undeclared variables, catch duplicate declarations, and validate task signatures.
4. **Symbol Table:** Build a multi-level hierarchical symbol table tracking identifiers, data types, kinds, scopes, and references.
5. **Intermediate Code Generation (ICG):** Lower AST nodes into classical Three-Address Code (TAC) with temporaries and labels.
6. **Code Optimization:** Perform machine-independent optimizations on TAC, specifically Constant Folding and Algebraic Simplification.
7. **Target Code Generation:** Emit clean, executable JavaScript code.
8. **Interactive Compiler Studio:** Provide a professional dark-themed web interface for visualizing all compiler phases side-by-side.

---

## 2. ChillLang Language Specification & Grammar

### 2.1 Keyword & Syntax Mapping

| Feature | ChillLang Syntax | Equivalent JavaScript |
|:---|:---|:---|
| Variable Declaration | `make x = 10;` or `make x: Integer = 10;` | `let x = 10;` |
| Assignment | `x = x + 1;` | `x = x + 1;` |
| Conditional Statement | `check (x > 5) { ... } otherwise { ... }` | `if (x > 5) { ... } else { ... }` |
| Iterative Loop | `repeat (i < 10) { ... }` | `while (i < 10) { ... }` |
| Task (Function) | `task add(a, b) { give a + b; }` | `function add(a, b) { return a + b; }` |
| Return Statement | `give a + b;` | `return a + b;` |
| Output Statement | `say(x);` | `console.log(x);` |
| Comments | `// Single line` or `/* Multi line */` | `// Single line` |

### 2.2 Supported Data Types
- `Integer`: 64-bit integer numbers (e.g., `10`, `-42`)
- `decimal`: Floating-point numbers (e.g., `3.14`, `0.05`)
- `string`: String literals (`"hello"`, `'world'`)
- `boolean`: `true` or `false`

### 2.3 Context-Free Grammar (EBNF)
```ebnf
Program         ::= Statement*
Statement       ::= VarDecl | AssignStmt | CheckStmt | RepeatStmt | TaskDecl | GiveStmt | SayStmt | ExprStmt | Block
VarDecl         ::= "make" IDENTIFIER (":" TYPE)? ("=" Expression)? ";"
AssignStmt      ::= IDENTIFIER "=" Expression ";"
CheckStmt       ::= "check" "(" Expression ")" Block ("otherwise" (CheckStmt | Block))?
RepeatStmt      ::= "repeat" "(" Expression ")" Block
TaskDecl        ::= "task" IDENTIFIER "(" ParamList? ")" (":" TYPE)? Block
ParamList       ::= IDENTIFIER (":" TYPE)? ("," IDENTIFIER (":" TYPE)?)*
GiveStmt        ::= "give" Expression? ";"
SayStmt         ::= "say" "(" Expression ")" ";"
Block           ::= "{" Statement* "}"

Expression      ::= LogicalOr
LogicalOr       ::= LogicalAnd ("||" LogicalAnd)*
LogicalAnd      ::= Equality ("&&" Equality)*
Equality        ::= Relational (("==" | "!=") Relational)*
Relational      ::= Additive (("<" | "<=" | ">" | ">=") Additive)*
Additive        ::= Multiplicative (("+" | "-") Multiplicative)*
Multiplicative  ::= Unary (("*" | "/" | "%") Unary)*
Unary           ::= ("!" | "-" | "+") Unary | Primary
Primary         ::= INTEGER | DECIMAL | STRING | BOOLEAN | IDENTIFIER | CallExpr | "(" Expression ")"
CallExpr        ::= IDENTIFIER "(" (Expression ("," Expression)*)? ")"
```

---

## 3. Compiler Architecture & Phase Pipeline

```
 Source Code (ChillLang)
        │
        ▼
 Phase 1: Lexical Analysis ────────► Token Stream Table
        │                            (Keywords, Identifiers, Operators, Literals)
        ▼
 Phase 2 & 3: Syntax Analysis ─────► Abstract Syntax Tree (AST)
        │                            (Program, VarDecl, TaskDecl, Conditionals)
        ▼
 Phase 4 & 5: Semantic Analysis ───► Multi-Level Symbol Table & Error Diagnostics
        │                            (Undefined vars, Duplicate decls, Type warnings)
        ▼
 Phase 6: Intermediate Code Gen ───► Three-Address Code (TAC)
        │                            (Quadruples: t1, t2, ..., L1, L2, ...)
        ▼
 Phase 7: Code Optimization ───────► Optimized Three-Address Code
        │                            (Constant Folding, Algebraic Simplification)
        ▼
 Phase 8: Target Code Generation ──► Target JavaScript Code
        │
        ▼
 Phase 9: Sandboxed Execution ─────► Terminal Program Output
```

---

## 4. Detailed Compiler Phase Implementation

### Phase 1: Lexical Analysis (`chilllang/lexer.js`)
- **Algorithm:** Deterministic Finite Automaton (DFA) character scanner.
- **Role:** Scans characters sequentially, tracks line and column coordinates, ignores comments (`//`, `/* */`), and generates typed token objects `{ index, type, value, raw, line, column }`.
- **Error Handling:** Identifies unterminated string literals and invalid characters without terminating the scanner prematurely.

### Phase 2 & 3: Syntax Analysis (`chilllang/parser.js`)
- **Algorithm:** Recursive Descent Parsing with Operator Precedence.
- **Role:** Consumes the token stream, verifies grammar conformance, and synthesizes tree nodes representing statements and nested expressions.
- **Error Recovery:** Implements synchronization points (`synchronize()`) at statement boundaries and semicolons.

### Phase 4 & 5: Semantic Analysis & Symbol Table (`chilllang/semantic.js`, `chilllang/symbol-table.js`)
- **Data Structure:** Multi-level tree of hash maps (`Scope`) linked to parent scopes.
- **Checks Performed:**
  1. *Duplicate Declaration:* Checks `scope.hasLocal(name)` before insertion.
  2. *Undeclared Variable:* Traverses scope hierarchy; if null, reports undefined identifier.
  3. *Undeclared Assignment:* Prevents assignment to unmade symbols.
  4. *Task Arity & Scope:* Validates function parameters and disallows `give` outside tasks.

### Phase 6: Intermediate Code Generation (`chilllang/tac.js`)
- **Algorithm:** Syntax-Directed Translation (SDT).
- **Format:** Linear sequence of 3-address instructions (quadruples) using temporary variables (`t1, t2, ...`) and jump labels (`L1, L2, ...`).
- **Instruction Set:**
  - Copy: `x = t1`
  - Binary: `t1 = a + b`
  - Branch: `if_false t1 goto L1`, `goto L2`
  - Function: `param arg`, `t1 = call func, n`, `return t1`
  - Output: `say t1`

### Phase 7: Code Optimization (`chilllang/optimizer.js`)
- **Algorithm:** Iterative Fixed-Point Transformation passes.
- **Techniques Implemented:**
  1. **Constant Folding:** Evaluates constant arithmetic at compile time (e.g., `100 + 50 * 2` → `200`).
  2. **Algebraic Simplification:**
     - Addition Identity: `x + 0` → `x`, `0 + x` → `x`
     - Multiplication Identity: `x * 1` → `x`, `1 * x` → `x`
     - Multiplication by Zero: `x * 0` → `0`, `0 * x` → `0`
     - Subtraction: `x - 0` → `x`, `x - x` → `0`
     - Boolean Identities: `x && true` → `x`, `x && false` → `false`
  3. **Dead Temporary Elimination:** Drops intermediate temporary registers that are never referenced.

### Phase 8 & 9: Target Code Generation & Runtime (`chilllang/codegen.js`, `chilllang/executor.js`)
- **Target Language:** ECMAScript (JavaScript).
- **Execution:** Safely executed in a sandboxed `Function` wrapper capturing standard output via a mocked console buffer.

---

## 5. How to Run the Project

### 5.1 Interactive Web Studio (Recommended)
```bash
# Start the web server
node serve_playground.js

# Open in browser:
# http://localhost:3000/web/index.html
```

### 5.2 Terminal Multi-Phase Demo
```bash
# Run all demo programs in terminal with colored output
node demo_chilllang.js

# Or test a custom ChillLang file:
node demo_chilllang.js path/to/program.chill
```

### 5.3 Automated Vitest Test Suite
```bash
# Run the 18-test comprehensive test suite
npx vitest run tests/chilllang.test.ts
```

---

## 6. Viva Voce Questions & Answers

**Q1: What is Three-Address Code (TAC) and why is it used?**  
*A:* Three-Address Code is an intermediate representation where each instruction has at most three operands (typically two source operands and one result). It bridges the gap between high-level language ASTs and low-level target machine code, making machine-independent optimizations (like constant folding and loop optimizations) much simpler.

**Q2: What is the difference between Lexical Analysis and Syntax Analysis?**  
*A:* Lexical analysis converts a character stream into meaningful words called tokens without checking relationships between them. Syntax analysis checks if the arrangement of tokens follows the grammar rules of the language and builds an AST.

**Q3: How is a Symbol Table implemented in ChillLang?**  
*A:* It uses a scoped tree structure. Each scope (Global, Task, Block) maintains a hash map of symbol records. Lookups traverse from the current inner scope upwards to the parent scope, allowing local variable shadowing and preventing leakage.

**Q4: How does Constant Folding differ from Constant Propagation?**  
*A:* Constant Folding evaluates constant expressions at compile-time (e.g. `10 + 5` → `15`). Constant Propagation replaces variables with their known constant values downstream (e.g. if `a = 15`, then `b = a * 2` becomes `b = 15 * 2`, which can then be folded).

**Q5: Why does ChillLang target JavaScript instead of x86/Assembly?**  
*A:* JavaScript is a portable, ubiquitous high-level target language. It allows the compiler to run seamlessly in any browser or Node.js environment without requiring platform-specific assemblers, linkers, or machine architectures.
