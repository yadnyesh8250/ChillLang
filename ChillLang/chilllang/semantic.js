/**
 * ChillLang — Semantic Analyzer
 * Phase 4: Validates scopes, symbol bindings, types, and reports semantic diagnostics.
 */

const { SymbolTableManager } = require("./symbol-table");

class ChillSemanticAnalyzer {
  constructor(ast) {
    this.ast = ast;
    this.symbols = new SymbolTableManager();
    this.errors = [];
    this.warnings = [];
    this.currentTask = null; // tracks enclosing task
    this.taskSignatures = new Map(); // taskName -> { paramsCount, paramTypes, returnType }
  }

  analyze() {
    this.errors = [];
    this.warnings = [];

    // Pre-pass: register all top-level task signatures for forward references
    if (this.ast && Array.isArray(this.ast.body)) {
      for (const stmt of this.ast.body) {
        if (stmt.type === "TaskDeclaration") {
          this.taskSignatures.set(stmt.name, {
            paramsCount: stmt.params.length,
            params: stmt.params,
            returnType: stmt.returnType || "any",
            line: stmt.loc?.start?.line || 1,
          });
          this.symbols.insert({
            name: stmt.name,
            type: `task(${stmt.params.map((p) => p.dataType || "any").join(", ")}) -> ${stmt.returnType || "any"}`,
            kind: "task",
            line: stmt.loc?.start?.line || 1,
            column: stmt.loc?.start?.column || 1,
            initialized: true,
          });
        }
      }

      // Main analysis pass
      for (const stmt of this.ast.body) {
        this.visitStatement(stmt);
      }
    }

    return {
      symbolTable: this.symbols.toTableData(),
      errors: this.errors,
      warnings: this.warnings,
      diagnostics: [
        ...this.errors.map((e) => ({ ...e, severity: "error" })),
        ...this.warnings.map((w) => ({ ...w, severity: "warning" })),
      ],
    };
  }

  visitStatement(stmt) {
    if (!stmt) return;

    switch (stmt.type) {
      case "VariableDeclaration":
        this.visitVariableDeclaration(stmt);
        break;
      case "AssignmentStatement":
        this.visitAssignmentStatement(stmt);
        break;
      case "ConditionalStatement":
        this.visitConditionalStatement(stmt);
        break;
      case "RepeatStatement":
        this.visitRepeatStatement(stmt);
        break;
      case "TaskDeclaration":
        this.visitTaskDeclaration(stmt);
        break;
      case "GiveStatement":
        this.visitGiveStatement(stmt);
        break;
      case "SayStatement":
        this.visitSayStatement(stmt);
        break;
      case "ExpressionStatement":
        this.inferExpressionType(stmt.expression);
        break;
      case "Block":
        this.visitBlock(stmt);
        break;
      default:
        break;
    }
  }

  visitVariableDeclaration(stmt) {
    const name = stmt.name;
    const line = stmt.loc?.start?.line || 1;
    const col = stmt.loc?.start?.column || 1;

    // Check duplicate declaration in same scope
    if (this.symbols.lookupLocal(name)) {
      this.errors.push({
        phase: "Semantic",
        line,
        column: col,
        message: `Duplicate variable declaration: '${name}' is already declared in current scope`,
      });
      return;
    }

    let inferredType = "any";
    if (stmt.value) {
      inferredType = this.inferExpressionType(stmt.value);
    }

    const declaredType = stmt.dataType || inferredType || "any";

    // Check type compatibility if explicit type given
    if (stmt.dataType && stmt.value && inferredType !== "any") {
      if (!this.areTypesCompatible(stmt.dataType, inferredType)) {
        this.warnings.push({
          phase: "Semantic",
          line,
          column: col,
          message: `Type mismatch in variable '${name}': declared as '${stmt.dataType}' but assigned '${inferredType}'`,
        });
      }
    }

    this.symbols.insert({
      name,
      type: declaredType,
      kind: "variable",
      line,
      column: col,
      initialized: stmt.value !== null,
    });
  }

  visitAssignmentStatement(stmt) {
    const name = stmt.target;
    const line = stmt.loc?.start?.line || 1;
    const col = stmt.loc?.start?.column || 1;

    const symbol = this.symbols.lookup(name);
    if (!symbol) {
      this.errors.push({
        phase: "Semantic",
        line,
        column: col,
        message: `Cannot assign to undeclared variable '${name}'`,
      });
    } else {
      symbol.references++;
      symbol.initialized = true;
    }

    const valType = this.inferExpressionType(stmt.value);
    if (symbol && symbol.type !== "any" && valType !== "any") {
      if (!this.areTypesCompatible(symbol.type, valType)) {
        this.warnings.push({
          phase: "Semantic",
          line,
          column: col,
          message: `Type mismatch in assignment to '${name}': expected '${symbol.type}', got '${valType}'`,
        });
      }
    }
  }

  visitConditionalStatement(stmt) {
    const condType = this.inferExpressionType(stmt.condition);
    if (condType !== "boolean" && condType !== "any") {
      this.warnings.push({
        phase: "Semantic",
        line: stmt.condition?.loc?.start?.line || 1,
        column: stmt.condition?.loc?.start?.column || 1,
        message: `Condition in 'check' statement should evaluate to boolean, got '${condType}'`,
      });
    }

    this.visitBlock(stmt.consequent);

    if (stmt.alternate) {
      if (stmt.alternate.type === "ConditionalStatement") {
        this.visitConditionalStatement(stmt.alternate);
      } else {
        this.visitBlock(stmt.alternate);
      }
    }
  }

  visitRepeatStatement(stmt) {
    const condType = this.inferExpressionType(stmt.condition);
    if (condType !== "boolean" && condType !== "any") {
      this.warnings.push({
        phase: "Semantic",
        line: stmt.condition?.loc?.start?.line || 1,
        column: stmt.condition?.loc?.start?.column || 1,
        message: `Loop condition in 'repeat' should evaluate to boolean, got '${condType}'`,
      });
    }

    this.visitBlock(stmt.body);
  }

  visitTaskDeclaration(stmt) {
    const prevTask = this.currentTask;
    this.currentTask = stmt;

    this.symbols.enterScope(`task:${stmt.name}`);

    // Insert task parameters into task scope
    for (const param of stmt.params) {
      const line = stmt.loc?.start?.line || 1;
      const col = stmt.loc?.start?.column || 1;
      if (this.symbols.lookupLocal(param.name)) {
        this.errors.push({
          phase: "Semantic",
          line,
          column: col,
          message: `Duplicate parameter name '${param.name}' in task '${stmt.name}'`,
        });
      } else {
        this.symbols.insert({
          name: param.name,
          type: param.dataType || "any",
          kind: "parameter",
          line,
          column: col,
          initialized: true,
        });
      }
    }

    // Process body block statements within the task's scope
    if (stmt.body && Array.isArray(stmt.body.body)) {
      for (const s of stmt.body.body) {
        this.visitStatement(s);
      }
    }

    this.symbols.exitScope();
    this.currentTask = prevTask;
  }

  visitGiveStatement(stmt) {
    const line = stmt.loc?.start?.line || 1;
    const col = stmt.loc?.start?.column || 1;

    if (!this.currentTask) {
      this.errors.push({
        phase: "Semantic",
        line,
        column: col,
        message: `'give' statement must be inside a task declaration`,
      });
      return;
    }

    if (stmt.value) {
      const returnValType = this.inferExpressionType(stmt.value);
      if (this.currentTask.returnType && returnValType !== "any") {
        if (!this.areTypesCompatible(this.currentTask.returnType, returnValType)) {
          this.warnings.push({
            phase: "Semantic",
            line,
            column: col,
            message: `Task '${this.currentTask.name}' declared return type '${this.currentTask.returnType}', but gives '${returnValType}'`,
          });
        }
      }
    }
  }

  visitSayStatement(stmt) {
    if (stmt.argument) {
      this.inferExpressionType(stmt.argument);
    }
  }

  visitBlock(block) {
    if (!block) return;
    this.symbols.enterScope("block");
    if (Array.isArray(block.body)) {
      for (const stmt of block.body) {
        this.visitStatement(stmt);
      }
    }
    this.symbols.exitScope();
  }

  inferExpressionType(expr) {
    if (!expr) return "any";

    switch (expr.type) {
      case "Literal":
        return expr.dataType || "any";

      case "Identifier": {
        const symbol = this.symbols.lookup(expr.name);
        if (!symbol) {
          this.errors.push({
            phase: "Semantic",
            line: expr.loc?.start?.line || 1,
            column: expr.loc?.start?.column || 1,
            message: `Undefined identifier '${expr.name}': variable used before declaration`,
          });
          return "any";
        }
        symbol.references++;
        return symbol.type;
      }

      case "BinaryExpression": {
        const leftType = this.inferExpressionType(expr.left);
        const rightType = this.inferExpressionType(expr.right);
        const op = expr.operator;

        if (["+", "-", "*", "/", "%"].includes(op)) {
          if (op === "+" && (leftType === "string" || rightType === "string")) {
            return "string"; // String concatenation
          }
          return "Integer";
        }

        if (["==", "!=", "<", "<=", ">", ">=", "&&", "||"].includes(op)) {
          return "boolean";
        }

        return "any";
      }

      case "UnaryExpression": {
        const argType = this.inferExpressionType(expr.argument);
        if (expr.operator === "!") return "boolean";
        if (expr.operator === "-" || expr.operator === "+") return argType === "decimal" ? "decimal" : "Integer";
        return "any";
      }

      case "CallExpression": {
        const callee = expr.callee;
        const line = expr.loc?.start?.line || 1;
        const col = expr.loc?.start?.column || 1;

        const sig = this.taskSignatures.get(callee);
        const symbol = this.symbols.lookup(callee);

        if (!sig && !symbol) {
          this.errors.push({
            phase: "Semantic",
            line,
            column: col,
            message: `Undefined task '${callee}': function called before definition`,
          });
        } else if (sig) {
          if (expr.arguments.length !== sig.paramsCount) {
            this.warnings.push({
              phase: "Semantic",
              line,
              column: col,
              message: `Task '${callee}' expects ${sig.paramsCount} argument(s), but called with ${expr.arguments.length}`,
            });
          }
        }

        for (const arg of expr.arguments) {
          this.inferExpressionType(arg);
        }

        return sig?.returnType || "any";
      }

      default:
        return "any";
    }
  }

  areTypesCompatible(expected, actual) {
    if (!expected || !actual) return true;
    if (expected === "any" || actual === "any") return true;

    const normExp = expected.toLowerCase();
    const normAct = actual.toLowerCase();

    if (normExp === normAct) return true;
    if ((normExp === "integer" || normExp === "int") && (normAct === "integer" || normAct === "int")) return true;
    if ((normExp === "decimal" || normExp === "float") && (normAct === "decimal" || normAct === "float")) return true;
    if ((normExp === "decimal" || normExp === "float") && (normAct === "integer" || normAct === "int")) return true; // int promotes to decimal
    if (normExp === "boolean" && normAct === "bool") return true;
    if (normExp === "bool" && normAct === "boolean") return true;

    return false;
  }
}

module.exports = { ChillSemanticAnalyzer };
