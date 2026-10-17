/**
 * ChillLang — Intermediate Code Generation (Three-Address Code - TAC)
 * Phase 6: Traverses the AST and emits classical Three-Address Code
 * using temporaries (t1, t2, ...) and labels (L1, L2, ...).
 */

class TACInstruction {
  constructor({ op, arg1 = null, arg2 = null, result = null, label = null, comment = null, line = null }) {
    this.op = op;         // "+", "-", "*", "/", "%", "=", "label", "goto", "if_false", "if_true", "param", "call", "return", "say"
    this.arg1 = arg1;     // first operand / condition / target
    this.arg2 = arg2;     // second operand / arg count
    this.result = result; // target temporary or variable
    this.label = label;   // label string if op is "label"
    this.comment = comment;
    this.line = line;
  }

  toString() {
    switch (this.op) {
      case "label":
        return `${this.label}:`;
      case "=":
        return `${this.result} = ${this.arg1}`;
      case "+":
      case "-":
      case "*":
      case "/":
      case "%":
      case "==":
      case "!=":
      case "<":
      case "<=":
      case ">":
      case ">=":
      case "&&":
      case "||":
        return `${this.result} = ${this.arg1} ${this.op} ${this.arg2}`;
      case "neg":
        return `${this.result} = -${this.arg1}`;
      case "not":
        return `${this.result} = !${this.arg1}`;
      case "goto":
        return `goto ${this.arg1}`;
      case "if_false":
        return `if_false ${this.arg1} goto ${this.result}`;
      case "if_true":
        return `if ${this.arg1} goto ${this.result}`;
      case "param":
        return `param ${this.arg1}`;
      case "call":
        if (this.result) {
          return `${this.result} = call ${this.arg1}, ${this.arg2}`;
        }
        return `call ${this.arg1}, ${this.arg2}`;
      case "return":
        return this.arg1 !== null ? `return ${this.arg1}` : `return`;
      case "say":
        return `say ${this.arg1}`;
      default:
        return `${this.op} ${this.arg1 || ""} ${this.arg2 || ""} -> ${this.result || ""}`.trim();
    }
  }
}

class ChillTACGenerator {
  constructor(ast) {
    this.ast = ast;
    this.instructions = [];
    this.tempCount = 0;
    this.labelCount = 0;
  }

  newTemp() {
    this.tempCount++;
    return `t${this.tempCount}`;
  }

  newLabel(prefix = "L") {
    this.labelCount++;
    return `${prefix}${this.labelCount}`;
  }

  emit(instructionData) {
    const inst = new TACInstruction(instructionData);
    this.instructions.push(inst);
    return inst;
  }

  emitLabel(labelName) {
    return this.emit({ op: "label", label: labelName });
  }

  generate() {
    this.instructions = [];
    this.tempCount = 0;
    this.labelCount = 0;

    if (this.ast && Array.isArray(this.ast.body)) {
      for (const stmt of this.ast.body) {
        this.generateStatement(stmt);
      }
    }

    return {
      instructions: this.instructions,
      text: this.toFormattedText(),
      quadruples: this.toQuadruples(),
    };
  }

  generateStatement(stmt) {
    if (!stmt) return;

    switch (stmt.type) {
      case "VariableDeclaration": {
        if (stmt.value) {
          const valTemp = this.generateExpression(stmt.value);
          this.emit({ op: "=", arg1: valTemp, result: stmt.name, line: stmt.loc?.start?.line });
        } else {
          this.emit({ op: "=", arg1: "null", result: stmt.name, line: stmt.loc?.start?.line });
        }
        break;
      }

      case "AssignmentStatement": {
        const valTemp = this.generateExpression(stmt.value);
        this.emit({ op: "=", arg1: valTemp, result: stmt.target, line: stmt.loc?.start?.line });
        break;
      }

      case "SayStatement": {
        const argTemp = this.generateExpression(stmt.argument);
        this.emit({ op: "say", arg1: argTemp, line: stmt.loc?.start?.line });
        break;
      }

      case "ConditionalStatement": {
        const condTemp = this.generateExpression(stmt.condition);
        const elseLabel = stmt.alternate ? this.newLabel("ELSE") : null;
        const endLabel = this.newLabel("END_IF");

        // if_false condTemp goto elseLabel (or endLabel if no else)
        this.emit({
          op: "if_false",
          arg1: condTemp,
          result: elseLabel || endLabel,
          line: stmt.loc?.start?.line,
        });

        // Consequent body
        this.generateBlock(stmt.consequent);

        if (stmt.alternate) {
          this.emit({ op: "goto", arg1: endLabel });
          this.emitLabel(elseLabel);
          if (stmt.alternate.type === "ConditionalStatement") {
            this.generateStatement(stmt.alternate);
          } else {
            this.generateBlock(stmt.alternate);
          }
        }

        this.emitLabel(endLabel);
        break;
      }

      case "RepeatStatement": {
        const startLabel = this.newLabel("LOOP_START");
        const endLabel = this.newLabel("LOOP_END");

        this.emitLabel(startLabel);
        const condTemp = this.generateExpression(stmt.condition);
        this.emit({
          op: "if_false",
          arg1: condTemp,
          result: endLabel,
          line: stmt.loc?.start?.line,
        });

        this.generateBlock(stmt.body);
        this.emit({ op: "goto", arg1: startLabel });
        this.emitLabel(endLabel);
        break;
      }

      case "TaskDeclaration": {
        const funcLabel = `TASK_${stmt.name}`;
        const endFuncLabel = `END_TASK_${stmt.name}`;

        this.emit({ op: "goto", arg1: endFuncLabel }); // Jump over function definition at top level
        this.emitLabel(funcLabel);

        // Function parameters are bound
        for (let i = 0; i < stmt.params.length; i++) {
          this.emit({ op: "=", arg1: `param_${i + 1}`, result: stmt.params[i].name });
        }

        this.generateBlock(stmt.body);

        // Default return if not provided
        this.emit({ op: "return", arg1: "null" });
        this.emitLabel(endFuncLabel);
        break;
      }

      case "GiveStatement": {
        const val = stmt.value ? this.generateExpression(stmt.value) : "null";
        this.emit({ op: "return", arg1: val, line: stmt.loc?.start?.line });
        break;
      }

      case "ExpressionStatement": {
        this.generateExpression(stmt.expression);
        break;
      }

      case "Block": {
        this.generateBlock(stmt);
        break;
      }

      default:
        break;
    }
  }

  generateBlock(block) {
    if (!block || !Array.isArray(block.body)) return;
    for (const stmt of block.body) {
      this.generateStatement(stmt);
    }
  }

  generateExpression(expr) {
    if (!expr) return "null";

    switch (expr.type) {
      case "Literal": {
        const temp = this.newTemp();
        const literalValue = typeof expr.value === "string" ? JSON.stringify(expr.value) : String(expr.value);
        this.emit({ op: "=", arg1: literalValue, result: temp });
        return temp;
      }

      case "Identifier": {
        return expr.name;
      }

      case "BinaryExpression": {
        const leftTemp = this.generateExpression(expr.left);
        const rightTemp = this.generateExpression(expr.right);
        const resTemp = this.newTemp();
        this.emit({
          op: expr.operator,
          arg1: leftTemp,
          arg2: rightTemp,
          result: resTemp,
        });
        return resTemp;
      }

      case "UnaryExpression": {
        const argTemp = this.generateExpression(expr.argument);
        const resTemp = this.newTemp();
        const op = expr.operator === "-" ? "neg" : expr.operator === "!" ? "not" : expr.operator;
        this.emit({
          op,
          arg1: argTemp,
          result: resTemp,
        });
        return resTemp;
      }

      case "CallExpression": {
        const argTemps = expr.arguments.map((arg) => this.generateExpression(arg));
        for (const a of argTemps) {
          this.emit({ op: "param", arg1: a });
        }
        const resTemp = this.newTemp();
        this.emit({
          op: "call",
          arg1: expr.callee,
          arg2: String(argTemps.length),
          result: resTemp,
        });
        return resTemp;
      }

      default:
        return "null";
    }
  }

  toFormattedText() {
    return this.instructions.map((inst, index) => {
      const lineNum = String(index + 1).padStart(3, " ");
      if (inst.op === "label") {
        return `\n${lineNum} | ${inst.toString()}`;
      }
      return `${lineNum} |   ${inst.toString()}`;
    }).join("\n").trim();
  }

  toQuadruples() {
    return this.instructions.map((inst, idx) => ({
      index: idx + 1,
      op: inst.op,
      arg1: inst.arg1 ?? "-",
      arg2: inst.arg2 ?? "-",
      result: inst.result ?? (inst.op === "label" ? inst.label : "-"),
      text: inst.toString(),
    }));
  }
}

module.exports = {
  TACInstruction,
  ChillTACGenerator,
};
