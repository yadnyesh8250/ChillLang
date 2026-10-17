/**
 * ChillLang — Syntax Analyzer & AST Builder
 * Phase 2 & 3: Checks grammar according to ChillLang specification
 * and produces a clean Abstract Syntax Tree (AST).
 */

const { TokenType } = require("./tokens");

class ChillParser {
  constructor(tokens = []) {
    // Filter out comment tokens for parsing
    this.tokens = tokens.filter((t) => t.type !== TokenType.COMMENT);
    this.pos = 0;
    this.errors = [];
  }

  parse() {
    this.pos = 0;
    this.errors = [];
    const body = [];

    while (!this.isAtEnd()) {
      // Skip redundant standalone semicolons
      if (this.matchDelimiter(";")) continue;
      try {
        const stmt = this.parseStatement();
        if (stmt) body.push(stmt);
      } catch (err) {
        this.errors.push({
          phase: "Syntax",
          line: this.peek()?.line || 1,
          column: this.peek()?.column || 1,
          message: err.message,
        });
        this.synchronize();
      }
    }

    return {
      ast: {
        type: "Program",
        body,
        loc: {
          start: body[0]?.loc?.start || { line: 1, column: 1 },
          end: body[body.length - 1]?.loc?.end || { line: 1, column: 1 },
        },
      },
      errors: this.errors,
    };
  }

  // ── Statements ─────────────────────────────────────────────────────────────

  parseStatement() {
    const token = this.peek();
    if (!token || token.type === TokenType.EOF) return null;

    if (token.type === TokenType.KEYWORD) {
      switch (token.value) {
        case "make":
          return this.parseMakeDeclaration();
        case "check":
          return this.parseCheckStatement();
        case "repeat":
          return this.parseRepeatStatement();
        case "task":
          return this.parseTaskDeclaration();
        case "give":
          return this.parseGiveStatement();
        case "say":
          return this.parseSayStatement();
      }
    }

    if (token.type === TokenType.DELIMITER && token.value === "{") {
      return this.parseBlock();
    }

    // Otherwise, check for assignment or expression statement
    return this.parseAssignmentOrExpression();
  }

  parseMakeDeclaration() {
    const kwToken = this.consumeKeyword("make");
    const nameToken = this.consumeIdentifier("Expected variable name after 'make'");

    let explicitType = null;
    if (this.matchDelimiter(":")) {
      const typeToken = this.advance();
      if (typeToken.type === TokenType.TYPE || typeToken.type === TokenType.IDENTIFIER) {
        explicitType = typeToken.value;
      } else {
        throw new Error(`Expected type name after ':', got '${typeToken.raw}'`);
      }
    }

    let initializer = null;
    if (this.matchOperator("=")) {
      initializer = this.parseExpression();
    }

    this.matchDelimiter(";"); // optional / flexible semicolon

    return {
      type: "VariableDeclaration",
      name: nameToken.value,
      dataType: explicitType,
      value: initializer,
      loc: {
        start: { line: kwToken.line, column: kwToken.column },
        end: { line: this.previous()?.line || kwToken.line, column: this.previous()?.column || kwToken.column },
      },
    };
  }

  parseCheckStatement() {
    const kw = this.consumeKeyword("check");
    let hasParen = false;
    if (this.matchDelimiter("(")) {
      hasParen = true;
    }
    const condition = this.parseExpression();
    if (hasParen) {
      this.consumeDelimiter(")", "Expected ')' after check condition");
    }

    const consequent = this.parseBlock();
    let alternate = null;

    if (this.checkKeyword("otherwise")) {
      this.advance();
      if (this.checkKeyword("check")) {
        alternate = this.parseCheckStatement();
      } else {
        alternate = this.parseBlock();
      }
    }

    return {
      type: "ConditionalStatement",
      condition,
      consequent,
      alternate,
      loc: {
        start: { line: kw.line, column: kw.column },
        end: { line: this.previous()?.line || kw.line, column: this.previous()?.column || kw.column },
      },
    };
  }

  parseRepeatStatement() {
    const kw = this.consumeKeyword("repeat");
    let hasParen = false;
    if (this.matchDelimiter("(")) {
      hasParen = true;
    }
    const condition = this.parseExpression();
    if (hasParen) {
      this.consumeDelimiter(")", "Expected ')' after repeat condition");
    }

    const body = this.parseBlock();

    return {
      type: "RepeatStatement",
      condition,
      body,
      loc: {
        start: { line: kw.line, column: kw.column },
        end: { line: this.previous()?.line || kw.line, column: this.previous()?.column || kw.column },
      },
    };
  }

  parseTaskDeclaration() {
    const kw = this.consumeKeyword("task");
    const nameToken = this.consumeIdentifier("Expected task name after 'task'");
    this.consumeDelimiter("(", "Expected '(' after task name");

    const params = [];
    if (!this.checkDelimiter(")")) {
      do {
        const paramName = this.consumeIdentifier("Expected parameter name");
        let paramType = null;
        if (this.matchDelimiter(":")) {
          const typeToken = this.advance();
          if (typeToken.type === TokenType.TYPE || typeToken.type === TokenType.IDENTIFIER) {
            paramType = typeToken.value;
          }
        }
        params.push({ name: paramName.value, dataType: paramType });
      } while (this.matchDelimiter(","));
    }
    this.consumeDelimiter(")", "Expected ')' after parameters");

    let returnType = null;
    if (this.matchDelimiter(":")) {
      const typeToken = this.advance();
      if (typeToken.type === TokenType.TYPE || typeToken.type === TokenType.IDENTIFIER) {
        returnType = typeToken.value;
      }
    }

    const body = this.parseBlock();

    return {
      type: "TaskDeclaration",
      name: nameToken.value,
      params,
      returnType,
      body,
      loc: {
        start: { line: kw.line, column: kw.column },
        end: { line: this.previous()?.line || kw.line, column: this.previous()?.column || kw.column },
      },
    };
  }

  parseGiveStatement() {
    const kw = this.consumeKeyword("give");
    let value = null;
    if (!this.checkDelimiter(";") && !this.checkDelimiter("}") && !this.isAtEnd()) {
      value = this.parseExpression();
    }
    this.matchDelimiter(";");

    return {
      type: "GiveStatement",
      value,
      loc: {
        start: { line: kw.line, column: kw.column },
        end: { line: this.previous()?.line || kw.line, column: this.previous()?.column || kw.column },
      },
    };
  }

  parseSayStatement() {
    const kw = this.consumeKeyword("say");
    let hasParen = false;
    if (this.matchDelimiter("(")) {
      hasParen = true;
    }
    const argument = this.parseExpression();
    if (hasParen) {
      this.consumeDelimiter(")", "Expected ')' after say argument");
    }
    this.matchDelimiter(";");

    return {
      type: "SayStatement",
      argument,
      loc: {
        start: { line: kw.line, column: kw.column },
        end: { line: this.previous()?.line || kw.line, column: this.previous()?.column || kw.column },
      },
    };
  }

  parseBlock() {
    const openBrace = this.consumeDelimiter("{", "Expected '{' to start block");
    const statements = [];
    while (!this.checkDelimiter("}") && !this.isAtEnd()) {
      if (this.matchDelimiter(";")) continue;
      const stmt = this.parseStatement();
      if (stmt) statements.push(stmt);
    }
    const closeBrace = this.consumeDelimiter("}", "Expected '}' to close block");

    return {
      type: "Block",
      body: statements,
      loc: {
        start: { line: openBrace.line, column: openBrace.column },
        end: { line: closeBrace.line, column: closeBrace.column },
      },
    };
  }

  parseAssignmentOrExpression() {
    const startTok = this.peek();
    const expr = this.parseExpression();

    // Check if it's an assignment: ident = expr
    if (expr.type === "Identifier" && this.matchOperator("=")) {
      const value = this.parseExpression();
      this.matchDelimiter(";");
      return {
        type: "AssignmentStatement",
        target: expr.name,
        value,
        loc: {
          start: expr.loc.start,
          end: { line: this.previous()?.line || expr.loc.end.line, column: this.previous()?.column || expr.loc.end.column },
        },
      };
    }

    this.matchDelimiter(";");
    return {
      type: "ExpressionStatement",
      expression: expr,
      loc: {
        start: expr.loc.start,
        end: { line: this.previous()?.line || expr.loc.end.line, column: this.previous()?.column || expr.loc.end.column },
      },
    };
  }

  // ── Expressions ────────────────────────────────────────────────────────────

  parseExpression() {
    return this.parseLogicalOr();
  }

  parseLogicalOr() {
    let left = this.parseLogicalAnd();
    while (this.matchOperator("||")) {
      const op = this.previous();
      const right = this.parseLogicalAnd();
      left = {
        type: "BinaryExpression",
        operator: op.value,
        left,
        right,
        loc: { start: left.loc.start, end: right.loc.end },
      };
    }
    return left;
  }

  parseLogicalAnd() {
    let left = this.parseEquality();
    while (this.matchOperator("&&")) {
      const op = this.previous();
      const right = this.parseEquality();
      left = {
        type: "BinaryExpression",
        operator: op.value,
        left,
        right,
        loc: { start: left.loc.start, end: right.loc.end },
      };
    }
    return left;
  }

  parseEquality() {
    let left = this.parseComparison();
    while (this.matchAnyOperator("==", "!=")) {
      const op = this.previous();
      const right = this.parseComparison();
      left = {
        type: "BinaryExpression",
        operator: op.value,
        left,
        right,
        loc: { start: left.loc.start, end: right.loc.end },
      };
    }
    return left;
  }

  parseComparison() {
    let left = this.parseAdditive();
    while (this.matchAnyOperator("<", "<=", ">", ">=")) {
      const op = this.previous();
      const right = this.parseAdditive();
      left = {
        type: "BinaryExpression",
        operator: op.value,
        left,
        right,
        loc: { start: left.loc.start, end: right.loc.end },
      };
    }
    return left;
  }

  parseAdditive() {
    let left = this.parseMultiplicative();
    while (this.matchAnyOperator("+", "-")) {
      const op = this.previous();
      const right = this.parseMultiplicative();
      left = {
        type: "BinaryExpression",
        operator: op.value,
        left,
        right,
        loc: { start: left.loc.start, end: right.loc.end },
      };
    }
    return left;
  }

  parseMultiplicative() {
    let left = this.parseUnary();
    while (this.matchAnyOperator("*", "/", "%")) {
      const op = this.previous();
      const right = this.parseUnary();
      left = {
        type: "BinaryExpression",
        operator: op.value,
        left,
        right,
        loc: { start: left.loc.start, end: right.loc.end },
      };
    }
    return left;
  }

  parseUnary() {
    if (this.matchAnyOperator("!", "-", "+")) {
      const op = this.previous();
      const right = this.parseUnary();
      return {
        type: "UnaryExpression",
        operator: op.value,
        argument: right,
        loc: {
          start: { line: op.line, column: op.column },
          end: right.loc.end,
        },
      };
    }
    return this.parsePrimary();
  }

  parsePrimary() {
    const token = this.peek();
    if (!token || token.type === TokenType.EOF) {
      throw new Error("Unexpected end of input");
    }

    // Parenthesized expression: ( expr )
    if (this.matchDelimiter("(")) {
      const openParen = this.previous();
      const expr = this.parseExpression();
      const closeParen = this.consumeDelimiter(")", "Expected ')' after expression");
      return {
        ...expr,
        loc: {
          start: { line: openParen.line, column: openParen.column },
          end: { line: closeParen.line, column: closeParen.column },
        },
      };
    }

    // Literals
    if (token.type === TokenType.INTEGER || token.type === TokenType.DECIMAL) {
      this.advance();
      return {
        type: "Literal",
        dataType: token.type === TokenType.INTEGER ? "Integer" : "decimal",
        value: token.value,
        raw: token.raw,
        loc: {
          start: { line: token.line, column: token.column },
          end: { line: token.line, column: token.column + token.raw.length },
        },
      };
    }

    if (token.type === TokenType.STRING) {
      this.advance();
      return {
        type: "Literal",
        dataType: "string",
        value: token.value,
        raw: token.raw,
        loc: {
          start: { line: token.line, column: token.column },
          end: { line: token.line, column: token.column + token.raw.length },
        },
      };
    }

    if (token.type === TokenType.BOOLEAN) {
      this.advance();
      return {
        type: "Literal",
        dataType: "boolean",
        value: token.value,
        raw: token.raw,
        loc: {
          start: { line: token.line, column: token.column },
          end: { line: token.line, column: token.column + token.raw.length },
        },
      };
    }

    // Identifier or Task Call
    if (token.type === TokenType.IDENTIFIER) {
      this.advance();
      // Check if it's a function/task call: ident(args...)
      if (this.matchDelimiter("(")) {
        const args = [];
        if (!this.checkDelimiter(")")) {
          do {
            args.push(this.parseExpression());
          } while (this.matchDelimiter(","));
        }
        const closeParen = this.consumeDelimiter(")", "Expected ')' after function arguments");
        return {
          type: "CallExpression",
          callee: token.value,
          arguments: args,
          loc: {
            start: { line: token.line, column: token.column },
            end: { line: closeParen.line, column: closeParen.column },
          },
        };
      }

      return {
        type: "Identifier",
        name: token.value,
        loc: {
          start: { line: token.line, column: token.column },
          end: { line: token.line, column: token.column + token.raw.length },
        },
      };
    }

    throw new Error(`Unexpected token '${token.raw}' (${token.type}) at line ${token.line}, column ${token.column}`);
  }

  // ── Helper Methods ─────────────────────────────────────────────────────────

  peek(offset = 0) {
    const idx = this.pos + offset;
    return idx < this.tokens.length ? this.tokens[idx] : this.tokens[this.tokens.length - 1];
  }

  previous() {
    return this.pos > 0 ? this.tokens[this.pos - 1] : null;
  }

  isAtEnd() {
    const tok = this.peek();
    return !tok || tok.type === TokenType.EOF;
  }

  advance() {
    if (!this.isAtEnd()) this.pos++;
    return this.previous();
  }

  checkKeyword(kw) {
    const tok = this.peek();
    return tok && tok.type === TokenType.KEYWORD && tok.value === kw;
  }

  checkDelimiter(d) {
    const tok = this.peek();
    return tok && tok.type === TokenType.DELIMITER && tok.value === d;
  }

  matchKeyword(kw) {
    if (this.checkKeyword(kw)) {
      this.advance();
      return true;
    }
    return false;
  }

  matchDelimiter(d) {
    if (this.checkDelimiter(d)) {
      this.advance();
      return true;
    }
    return false;
  }

  matchOperator(op) {
    const tok = this.peek();
    if (tok && tok.type === TokenType.OPERATOR && tok.value === op) {
      this.advance();
      return true;
    }
    return false;
  }

  matchAnyOperator(...ops) {
    const tok = this.peek();
    if (tok && tok.type === TokenType.OPERATOR && ops.includes(tok.value)) {
      this.advance();
      return true;
    }
    return false;
  }

  consumeKeyword(kw, errMsg) {
    if (this.checkKeyword(kw)) return this.advance();
    throw new Error(errMsg || `Expected keyword '${kw}', got '${this.peek()?.raw}'`);
  }

  consumeDelimiter(d, errMsg) {
    if (this.checkDelimiter(d)) return this.advance();
    throw new Error(errMsg || `Expected delimiter '${d}', got '${this.peek()?.raw}'`);
  }

  consumeOperator(op, errMsg) {
    if (this.matchOperator(op)) return this.previous();
    throw new Error(errMsg || `Expected operator '${op}', got '${this.peek()?.raw}'`);
  }

  consumeIdentifier(errMsg) {
    const tok = this.peek();
    if (tok && tok.type === TokenType.IDENTIFIER) return this.advance();
    throw new Error(errMsg || `Expected identifier, got '${tok?.raw}'`);
  }

  synchronize() {
    this.advance();
    while (!this.isAtEnd()) {
      if (this.previous()?.value === ";") return;
      const next = this.peek();
      if (next.type === TokenType.KEYWORD && ["make", "check", "repeat", "task", "give", "say"].includes(next.value)) {
        return;
      }
      this.advance();
    }
  }
}

module.exports = { ChillParser };
