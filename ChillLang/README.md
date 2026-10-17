# 🧊 ChillLang — Multi-Phase Compiler & Vintage Studio

**ChillLang** is a full-featured educational programming language and multi-phase compiler pipeline built for Semester 5 Compiler Design. It implements all 7 classical compiler construction phases—from Lexical Analysis to Code Optimization and Multi-Target Code Generation—paired with an interactive, vintage-styled terminal compiler studio.

---

## 🌟 Key Features

- **7-Phase Classical Compiler Pipeline**:
  1. **Lexical Analysis (Scanner)**: Tokenization with line/column tracking.
  2. **Syntax Analysis (Parser)**: Recursive-descent AST construction.
  3. **Semantic Analysis**: Static type validation, undeclared variable checking, and scope rules.
  4. **Symbol Table**: Multi-level hierarchical symbol resolution.
  5. **Intermediate Code Generation (ICG)**: Three-Address Code (TAC) generation with temporaries ($t_0, t_1$) and conditional branch labels.
  6. **Optimization Engine**: Constant folding, algebraic reduction, loop-invariant code motion, and dead-code elimination across `-O0`, `-O1`, `-O2`, and `-O3`.
  7. **Target Code Generation**: Emits clean **JavaScript (ES2024)**, **WebAssembly (WASM-MVP text format)**, **LLVM-IR**, and **ChillVM Bytecode**.
- **Interactive Vintage Compiler Studio**:
  - CRT / Amber-Phosphor retro aesthetic with scanline effects.
  - Live two-layer syntax highlighted editor.
  - Multi-file tab system with in-memory project management.
  - Real-time compiler inspection panels for Tokens, AST, Semantic Errors, Symbol Table, TAC, and Execution Output.
  - 10+ built-in test algorithms (Fibonacci, Factorial, Grading System, Prime Finder, Matrix Math, and more).

---

## 🚀 Quick Start

### 1. Requirements
- **Node.js 18+**
- **npm**

### 2. Installation
```bash
npm install
```

### 3. Run the Interactive Compiler Studio (Web UI)
```bash
node serve_playground.js
```
Open your browser at: **`http://localhost:3000/web/index.html`**

### 4. Run ChillLang Programs via CLI
```bash
# Run a specific ChillLang file through all 7 compiler stages
node run_chill.js examples/chilllang/01_factorial.chill

# Or run the comprehensive test suite
npm test
```

---

## 📖 ChillLang Syntax Overview

| Feature | ChillLang Syntax | Equivalent JavaScript |
|:---|:---|:---|
| **Variable Declaration** | `make x = 10;` or `make x: Integer = 10;` | `let x = 10;` |
| **Assignment** | `x = x + 1;` | `x = x + 1;` |
| **Conditional Statement** | `check (x > 5) { ... } otherwise { ... }` | `if (x > 5) { ... } else { ... }` |
| **Loop** | `repeat (i < 10) { ... }` | `while (i < 10) { ... }` |
| **Task (Function)** | `task add(a, b) { give a + b; }` | `function add(a, b) { return a + b; }` |
| **Return** | `give a + b;` | `return a + b;` |
| **Console Output** | `say(x);` | `console.log(x);` |
| **Comments** | `// Single line` or `/* Multi line */` | `// Single line` |

### Sample Program
```chill
// Factorial calculator in ChillLang
task factorial(n: Integer) {
  check (n <= 1) {
    give 1;
  }
  give n * factorial(n - 1);
}

make result = factorial(5);
say("Factorial of 5 is: " + result);
```

---

## 🏗️ Compiler Architecture

```
ChillLang Source Code (.chill)
       │
       ▼
 [1. Lexer / Scanner] ─────────▶ Token Stream
       │
       ▼
 [2. Parser] ──────────────────▶ Abstract Syntax Tree (AST)
       │
       ▼
 [3. Semantic Analyzer] ───────▶ Verified AST + Diagnostics
       │
       ▼
 [4. Symbol Table Builder] ────▶ Hierarchical Scoped Symbol Table
       │
       ▼
 [5. ICG / TAC Lowering] ──────▶ Three-Address Code (TAC)
       │
       ▼
 [6. Optimization Engine] ─────▶ Optimized TAC (-O0 to -O3)
       │
       ▼
 [7. Multi-Target Emitter] ────▶ JavaScript | WASM | LLVM-IR | ChillVM
```

---

## 📚 Documentation & Manual
For full academic details, context-free grammar (EBNF), viva examination questions, and test scenarios, refer to:
- **[CHILLLANG_MANUAL.md](CHILLLANG_MANUAL.md)**

---

## 📄 License
MIT License
