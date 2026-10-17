/**
 * ChillLang — Target Code Generator (JavaScript)
 * Phase 8: Translates ChillLang AST into clean, idiomatic JavaScript.
 */

class ChillJSGenerator {
  constructor(ast) {
    this.ast = ast;
    this.indent = 0;
  }

  generate() {
    if (!this.ast || !Array.isArray(this.ast.body)) return "";
    const lines = [];

    for (const stmt of this.ast.body) {
      lines.push(this.generateStatement(stmt));
    }

    return lines.join("\n\n").trim();
  }

  getIndent() {
    return "  ".repeat(this.indent);
  }

  generateStatement(stmt) {
    if (!stmt) return "";
    const prefix = this.getIndent();

    switch (stmt.type) {
      case "VariableDeclaration": {
        const val = stmt.value ? this.generateExpression(stmt.value) : "null";
        return `${prefix}let ${stmt.name} = ${val};`;
      }

      case "AssignmentStatement": {
        const val = this.generateExpression(stmt.value);
        return `${prefix}${stmt.target} = ${val};`;
      }

      case "SayStatement": {
        const arg = stmt.argument ? this.generateExpression(stmt.argument) : "";
        return `${prefix}console.log(${arg});`;
      }

      case "ConditionalStatement": {
        const cond = this.generateExpression(stmt.condition);
        let out = `${prefix}if (${cond}) {\n`;
        this.indent++;
        out += this.generateBlockStatements(stmt.consequent);
        this.indent--;
        out += `\n${prefix}}`;

        if (stmt.alternate) {
          if (stmt.alternate.type === "ConditionalStatement") {
            out += ` else ${this.generateStatement(stmt.alternate).trim()}`;
          } else {
            out += ` else {\n`;
            this.indent++;
            out += this.generateBlockStatements(stmt.alternate);
            this.indent--;
            out += `\n${prefix}}`;
          }
        }
        return out;
      }

      case "RepeatStatement": {
        const cond = this.generateExpression(stmt.condition);
        let out = `${prefix}while (${cond}) {\n`;
        this.indent++;
        out += this.generateBlockStatements(stmt.body);
        this.indent--;
        out += `\n${prefix}}`;
        return out;
      }

      case "TaskDeclaration": {
        const params = stmt.params.map((p) => p.name).join(", ");
        let out = `${prefix}function ${stmt.name}(${params}) {\n`;
        this.indent++;
        out += this.generateBlockStatements(stmt.body);
        this.indent--;
        out += `\n${prefix}}`;
        return out;
      }

      case "GiveStatement": {
        const val = stmt.value ? ` ${this.generateExpression(stmt.value)}` : "";
        return `${prefix}return${val};`;
      }

      case "ExpressionStatement": {
        return `${prefix}${this.generateExpression(stmt.expression)};`;
      }

      case "Block": {
        let out = `${prefix}{\n`;
        this.indent++;
        out += this.generateBlockStatements(stmt);
        this.indent--;
        out += `\n${prefix}}`;
        return out;
      }

      default:
        return `${prefix}/* unhandled statement: ${stmt.type} */`;
    }
  }

  generateBlockStatements(block) {
    if (!block || !Array.isArray(block.body)) return "";
    return block.body.map((s) => this.generateStatement(s)).join("\n");
  }

  generateExpression(expr) {
    if (!expr) return "null";

    switch (expr.type) {
      case "Literal":
        return typeof expr.value === "string" ? JSON.stringify(expr.value) : String(expr.value);

      case "Identifier":
        return expr.name;

      case "BinaryExpression": {
        const left = this.generateExpression(expr.left);
        const right = this.generateExpression(expr.right);
        return `(${left} ${expr.operator} ${right})`;
      }

      case "UnaryExpression": {
        const arg = this.generateExpression(expr.argument);
        return `(${expr.operator}${arg})`;
      }

      case "CallExpression": {
        const args = expr.arguments.map((a) => this.generateExpression(a)).join(", ");
        return `${expr.callee}(${args})`;
      }

      default:
        return "null";
    }
  }
}

module.exports = { ChillJSGenerator };
