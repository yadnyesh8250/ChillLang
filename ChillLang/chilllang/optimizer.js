/**
 * ChillLang — Intermediate Code Optimizer
 * Phase 7: Applies classical compiler optimization passes:
 *   1. Constant Folding (evaluates constant operations at compile-time)
 *   2. Algebraic Simplification (eliminates identities like x+0, x*1, x*0)
 *   3. Copy / Constant Propagation
 *   4. Dead Code / Redundant Temporary Elimination
 */

const { TACInstruction } = require("./tac");

class ChillOptimizer {
  constructor(instructions = []) {
    this.originalInstructions = instructions;
    this.stats = {
      constantFolds: 0,
      algebraicSimplifications: 0,
      instructionsBefore: instructions.length,
      instructionsAfter: 0,
      optimizationsApplied: [],
    };
  }

  optimize() {
    let current = [...this.originalInstructions];
    let changed = true;
    let iteration = 0;
    const MAX_PASSES = 5;

    while (changed && iteration < MAX_PASSES) {
      iteration++;
      const beforeCount = this.stats.constantFolds + this.stats.algebraicSimplifications;

      // Pass 1: Constant Folding & Algebraic Simplification with Propagation
      current = this.runFoldingAndAlgebraicPass(current);

      // Pass 2: Dead Temporary Elimination
      current = this.eliminateDeadTemporaries(current);

      const afterCount = this.stats.constantFolds + this.stats.algebraicSimplifications;
      changed = afterCount > beforeCount;
    }

    this.stats.instructionsAfter = current.length;

    return {
      instructions: current,
      text: this.toFormattedText(current),
      quadruples: current.map((inst, idx) => ({
        index: idx + 1,
        op: inst.op,
        arg1: inst.arg1 ?? "-",
        arg2: inst.arg2 ?? "-",
        result: inst.result ?? (inst.op === "label" ? inst.label : "-"),
        text: inst.toString(),
      })),
      stats: this.stats,
    };
  }

  runFoldingAndAlgebraicPass(instructions) {
    const constMap = new Map(); // var/temp -> constant literal string (e.g. "10", "true")
    const optimized = [];

    for (let i = 0; i < instructions.length; i++) {
      const inst = instructions[i];

      // Reset known values at labels or branches to maintain conservative correctness
      if (inst.op === "label" || inst.op === "goto" || inst.op === "if_false" || inst.op === "if_true" || inst.op === "call") {
        if (inst.op === "label") {
          // Keep loop/jump isolation
          constMap.clear();
        }
        optimized.push(inst);
        continue;
      }

      // Check simple assignment: result = arg1
      if (inst.op === "=") {
        let val = inst.arg1;
        if (constMap.has(val)) {
          val = constMap.get(val);
        }

        if (this.isLiteral(val)) {
          constMap.set(inst.result, val);
        }

        optimized.push(new TACInstruction({
          op: "=",
          arg1: val,
          result: inst.result,
          line: inst.line,
        }));
        continue;
      }

      // Binary operation: result = arg1 op arg2
      if (["+", "-", "*", "/", "%", "==", "!=", "<", "<=", ">", ">=", "&&", "||"].includes(inst.op)) {
        let left = inst.arg1;
        let right = inst.arg2;

        // Propagate known constant values
        if (constMap.has(left)) left = constMap.get(left);
        if (constMap.has(right)) right = constMap.get(right);

        // 1. Constant Folding: Both operands are literal constants
        if (this.isLiteral(left) && this.isLiteral(right)) {
          const folded = this.evalBinary(inst.op, this.parseLiteral(left), this.parseLiteral(right));
          if (folded !== null) {
            const litStr = typeof folded === "string" ? JSON.stringify(folded) : String(folded);
            constMap.set(inst.result, litStr);
            this.stats.constantFolds++;
            this.stats.optimizationsApplied.push(`Constant fold: ${inst.result} = ${left} ${inst.op} ${right} -> ${litStr}`);
            optimized.push(new TACInstruction({
              op: "=",
              arg1: litStr,
              result: inst.result,
              line: inst.line,
            }));
            continue;
          }
        }

        // 2. Algebraic Simplification: Identity and Zero rules
        const simplified = this.simplifyAlgebraic(inst.op, left, right);
        if (simplified !== null) {
          this.stats.algebraicSimplifications++;
          this.stats.optimizationsApplied.push(
            `Algebraic simplification: ${inst.result} = ${left} ${inst.op} ${right} -> ${simplified}`
          );

          if (this.isLiteral(simplified)) {
            constMap.set(inst.result, simplified);
          }

          optimized.push(new TACInstruction({
            op: "=",
            arg1: simplified,
            result: inst.result,
            line: inst.line,
          }));
          continue;
        }

        // Otherwise keep instruction with propagated operands
        optimized.push(new TACInstruction({
          op: inst.op,
          arg1: left,
          arg2: right,
          result: inst.result,
          line: inst.line,
        }));
        continue;
      }

      // Unary operations: result = op arg1
      if (inst.op === "neg" || inst.op === "not") {
        let arg = inst.arg1;
        if (constMap.has(arg)) arg = constMap.get(arg);

        if (this.isLiteral(arg)) {
          const val = this.parseLiteral(arg);
          const folded = inst.op === "neg" ? -val : !val;
          const litStr = String(folded);
          constMap.set(inst.result, litStr);
          this.stats.constantFolds++;
          this.stats.optimizationsApplied.push(`Constant fold: ${inst.result} = ${inst.op} ${arg} -> ${litStr}`);
          optimized.push(new TACInstruction({
            op: "=",
            arg1: litStr,
            result: inst.result,
            line: inst.line,
          }));
          continue;
        }

        optimized.push(new TACInstruction({
          op: inst.op,
          arg1: arg,
          result: inst.result,
          line: inst.line,
        }));
        continue;
      }

      // Other instructions (say, return, param)
      if (inst.op === "say" || inst.op === "return" || inst.op === "param") {
        let arg = inst.arg1;
        if (constMap.has(arg)) arg = constMap.get(arg);
        optimized.push(new TACInstruction({
          op: inst.op,
          arg1: arg,
          arg2: inst.arg2,
          result: inst.result,
          line: inst.line,
        }));
        continue;
      }

      optimized.push(inst);
    }

    return optimized;
  }

  simplifyAlgebraic(op, left, right) {
    const leftIsZero = left === "0";
    const rightIsZero = right === "0";
    const leftIsOne = left === "1";
    const rightIsOne = right === "1";

    // Addition: x + 0 -> x, 0 + x -> x
    if (op === "+") {
      if (rightIsZero) return left;
      if (leftIsZero) return right;
    }

    // Subtraction: x - 0 -> x, x - x -> 0
    if (op === "-") {
      if (rightIsZero) return left;
      if (left === right) return "0";
    }

    // Multiplication: x * 1 -> x, 1 * x -> x, x * 0 -> 0, 0 * x -> 0
    if (op === "*") {
      if (rightIsOne) return left;
      if (leftIsOne) return right;
      if (rightIsZero || leftIsZero) return "0";
    }

    // Division: x / 1 -> x
    if (op === "/") {
      if (rightIsOne) return left;
    }

    // Boolean Logic:
    // x && true -> x, true && x -> x
    // x && false -> false, false && x -> false
    if (op === "&&") {
      if (right === "true") return left;
      if (left === "true") return right;
      if (right === "false" || left === "false") return "false";
    }

    // x || false -> x, false || x -> x
    // x || true -> true, true || x -> true
    if (op === "||") {
      if (right === "false") return left;
      if (left === "false") return right;
      if (right === "true" || left === "true") return "true";
    }

    return null;
  }

  eliminateDeadTemporaries(instructions) {
    // Collect all referenced variables and temporaries across operands
    const usedVars = new Set();
    for (const inst of instructions) {
      if (inst.arg1 && !this.isLiteral(inst.arg1)) usedVars.add(inst.arg1);
      if (inst.arg2 && !this.isLiteral(inst.arg2)) usedVars.add(inst.arg2);
    }

    // Remove temporary assignments (t1 = ...) that are NEVER used anywhere
    return instructions.filter((inst) => {
      if (inst.op === "=" && inst.result && inst.result.startsWith("t")) {
        const isUsed = usedVars.has(inst.result);
        return isUsed;
      }
      return true;
    });
  }

  isLiteral(str) {
    if (typeof str !== "string") return false;
    if (str === "true" || str === "false" || str === "null") return true;
    if (/^-?\d+(\.\d+)?$/.test(str)) return true;
    if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) return true;
    return false;
  }

  parseLiteral(str) {
    if (str === "true") return true;
    if (str === "false") return false;
    if (str === "null") return null;
    if (/^-?\d+(\.\d+)?$/.test(str)) return parseFloat(str);
    if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
      return str.slice(1, -1);
    }
    return str;
  }

  evalBinary(op, a, b) {
    switch (op) {
      case "+": return typeof a === "string" || typeof b === "string" ? `${a}${b}` : a + b;
      case "-": return a - b;
      case "*": return a * b;
      case "/": return b !== 0 ? a / b : null;
      case "%": return b !== 0 ? a % b : null;
      case "==": return a === b;
      case "!=": return a !== b;
      case "<": return a < b;
      case "<=": return a <= b;
      case ">": return a > b;
      case ">=": return a >= b;
      case "&&": return Boolean(a && b);
      case "||": return Boolean(a || b);
      default: return null;
    }
  }

  toFormattedText(instructions) {
    return instructions.map((inst, index) => {
      const lineNum = String(index + 1).padStart(3, " ");
      if (inst.op === "label") {
        return `\n${lineNum} | ${inst.toString()}`;
      }
      return `${lineNum} |   ${inst.toString()}`;
    }).join("\n").trim();
  }
}

module.exports = { ChillOptimizer };
