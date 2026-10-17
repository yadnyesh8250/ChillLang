var ChillLang = (() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // chilllang/tokens.js
  var require_tokens = __commonJS({
    "chilllang/tokens.js"(exports, module) {
      var TokenType = {
        // Keywords
        KEYWORD: "KEYWORD",
        TYPE: "TYPE",
        // Identifiers & Literals
        IDENTIFIER: "IDENTIFIER",
        INTEGER: "INTEGER",
        DECIMAL: "DECIMAL",
        STRING: "STRING",
        BOOLEAN: "BOOLEAN",
        // Operators
        OPERATOR: "OPERATOR",
        // Delimiters
        DELIMITER: "DELIMITER",
        // Special
        COMMENT: "COMMENT",
        EOF: "EOF",
        ERROR: "ERROR"
      };
      var KEYWORDS = /* @__PURE__ */ new Set([
        "make",
        // Variable declaration: make x = 10;
        "check",
        // Conditional: check (x > 5) { }
        "otherwise",
        // Else branch: otherwise { }
        "repeat",
        // Loop: repeat (x < 10) { }
        "task",
        // Function: task add(a, b) { }
        "give",
        // Return: give a + b;
        "say",
        // Output: say(x);
        "true",
        "false",
        "null"
      ]);
      var DATA_TYPES = /* @__PURE__ */ new Set([
        "Integer",
        "decimal",
        "string",
        "boolean",
        "int",
        "float",
        "number",
        "bool",
        "void"
      ]);
      var OPERATORS = /* @__PURE__ */ new Set([
        "+",
        "-",
        "*",
        "/",
        "%",
        "==",
        "!=",
        "<=",
        ">=",
        "<",
        ">",
        "&&",
        "||",
        "!",
        "="
      ]);
      var DELIMITERS = /* @__PURE__ */ new Set([
        "(",
        ")",
        "{",
        "}",
        "[",
        "]",
        ",",
        ";",
        ":"
      ]);
      module.exports = {
        TokenType,
        KEYWORDS,
        DATA_TYPES,
        OPERATORS,
        DELIMITERS
      };
    }
  });

  // chilllang/lexer.js
  var require_lexer = __commonJS({
    "chilllang/lexer.js"(exports, module) {
      var { TokenType, KEYWORDS, DATA_TYPES, OPERATORS, DELIMITERS } = require_tokens();
      var ChillLexer = class {
        constructor(source = "") {
          this.source = source;
          this.pos = 0;
          this.line = 1;
          this.column = 1;
          this.tokens = [];
          this.errors = [];
        }
        tokenize() {
          this.tokens = [];
          this.errors = [];
          this.pos = 0;
          this.line = 1;
          this.column = 1;
          let index = 1;
          while (this.pos < this.source.length) {
            const char = this.peek();
            if (char === " " || char === "	" || char === "\r") {
              this.advance();
              continue;
            }
            if (char === "\n") {
              this.line++;
              this.column = 1;
              this.pos++;
              continue;
            }
            if (char === "/" && this.peek(1) === "/") {
              const startLine2 = this.line;
              const startCol2 = this.column;
              let commentText = "";
              this.advance();
              this.advance();
              while (this.pos < this.source.length && this.peek() !== "\n") {
                commentText += this.advance();
              }
              continue;
            }
            if (char === "/" && this.peek(1) === "*") {
              const startLine2 = this.line;
              const startCol2 = this.column;
              this.advance();
              this.advance();
              let closed = false;
              while (this.pos < this.source.length) {
                if (this.peek() === "*" && this.peek(1) === "/") {
                  this.advance();
                  this.advance();
                  closed = true;
                  break;
                }
                if (this.peek() === "\n") {
                  this.line++;
                  this.column = 1;
                  this.pos++;
                } else {
                  this.advance();
                }
              }
              if (!closed) {
                this.errors.push({
                  phase: "Lexical",
                  line: startLine2,
                  column: startCol2,
                  message: "Unterminated multi-line comment"
                });
              }
              continue;
            }
            const startLine = this.line;
            const startCol = this.column;
            const twoChar = char + this.peek(1);
            if (OPERATORS.has(twoChar)) {
              this.advance();
              this.advance();
              this.tokens.push({
                index: index++,
                type: TokenType.OPERATOR,
                value: twoChar,
                raw: twoChar,
                line: startLine,
                column: startCol
              });
              continue;
            }
            if (OPERATORS.has(char)) {
              this.advance();
              this.tokens.push({
                index: index++,
                type: TokenType.OPERATOR,
                value: char,
                raw: char,
                line: startLine,
                column: startCol
              });
              continue;
            }
            if (DELIMITERS.has(char)) {
              this.advance();
              this.tokens.push({
                index: index++,
                type: TokenType.DELIMITER,
                value: char,
                raw: char,
                line: startLine,
                column: startCol
              });
              continue;
            }
            if (char === '"' || char === "'") {
              const quote = char;
              this.advance();
              let strVal = "";
              let closed = false;
              while (this.pos < this.source.length) {
                const c = this.peek();
                if (c === "\\") {
                  this.advance();
                  const next = this.advance();
                  if (next === "n")
                    strVal += "\n";
                  else if (next === "t")
                    strVal += "	";
                  else if (next === "r")
                    strVal += "\r";
                  else if (next === "\\")
                    strVal += "\\";
                  else if (next === quote)
                    strVal += quote;
                  else
                    strVal += next;
                  continue;
                }
                if (c === quote) {
                  this.advance();
                  closed = true;
                  break;
                }
                if (c === "\n") {
                  this.line++;
                  this.column = 1;
                  this.pos++;
                  strVal += "\n";
                  continue;
                }
                strVal += this.advance();
              }
              if (!closed) {
                this.errors.push({
                  phase: "Lexical",
                  line: startLine,
                  column: startCol,
                  message: `Unterminated string literal starting with ${quote}`
                });
              }
              this.tokens.push({
                index: index++,
                type: TokenType.STRING,
                value: strVal,
                raw: `${quote}${strVal}${closed ? quote : ""}`,
                line: startLine,
                column: startCol
              });
              continue;
            }
            if (this.isDigit(char)) {
              let numStr = "";
              let isDecimal = false;
              while (this.isDigit(this.peek())) {
                numStr += this.advance();
              }
              if (this.peek() === "." && this.isDigit(this.peek(1))) {
                isDecimal = true;
                numStr += this.advance();
                while (this.isDigit(this.peek())) {
                  numStr += this.advance();
                }
              }
              const parsedVal = isDecimal ? parseFloat(numStr) : parseInt(numStr, 10);
              this.tokens.push({
                index: index++,
                type: isDecimal ? TokenType.DECIMAL : TokenType.INTEGER,
                value: parsedVal,
                raw: numStr,
                line: startLine,
                column: startCol
              });
              continue;
            }
            if (this.isAlpha(char) || char === "_") {
              let ident = "";
              while (this.isAlphaNumeric(this.peek()) || this.peek() === "_") {
                ident += this.advance();
              }
              let type = TokenType.IDENTIFIER;
              let val = ident;
              if (ident === "true" || ident === "false") {
                type = TokenType.BOOLEAN;
                val = ident === "true";
              } else if (DATA_TYPES.has(ident)) {
                type = TokenType.TYPE;
              } else if (KEYWORDS.has(ident)) {
                type = TokenType.KEYWORD;
              }
              this.tokens.push({
                index: index++,
                type,
                value: val,
                raw: ident,
                line: startLine,
                column: startCol
              });
              continue;
            }
            const badChar = this.advance();
            this.errors.push({
              phase: "Lexical",
              line: startLine,
              column: startCol,
              message: `Unexpected or invalid character '${badChar}'`
            });
            this.tokens.push({
              index: index++,
              type: TokenType.ERROR,
              value: badChar,
              raw: badChar,
              line: startLine,
              column: startCol
            });
          }
          this.tokens.push({
            index: index++,
            type: TokenType.EOF,
            value: "EOF",
            raw: "",
            line: this.line,
            column: this.column
          });
          return {
            tokens: this.tokens,
            errors: this.errors
          };
        }
        peek(offset = 0) {
          const idx = this.pos + offset;
          return idx < this.source.length ? this.source[idx] : "";
        }
        advance() {
          const ch = this.source[this.pos++];
          this.column++;
          return ch;
        }
        isDigit(ch) {
          return ch >= "0" && ch <= "9";
        }
        isAlpha(ch) {
          return ch >= "a" && ch <= "z" || ch >= "A" && ch <= "Z";
        }
        isAlphaNumeric(ch) {
          return this.isAlpha(ch) || this.isDigit(ch);
        }
      };
      module.exports = { ChillLexer };
    }
  });

  // chilllang/parser.js
  var require_parser = __commonJS({
    "chilllang/parser.js"(exports, module) {
      var { TokenType } = require_tokens();
      var ChillParser = class {
        constructor(tokens = []) {
          this.tokens = tokens.filter((t) => t.type !== TokenType.COMMENT);
          this.pos = 0;
          this.errors = [];
        }
        parse() {
          this.pos = 0;
          this.errors = [];
          const body = [];
          while (!this.isAtEnd()) {
            if (this.matchDelimiter(";"))
              continue;
            try {
              const stmt = this.parseStatement();
              if (stmt)
                body.push(stmt);
            } catch (err) {
              this.errors.push({
                phase: "Syntax",
                line: this.peek()?.line || 1,
                column: this.peek()?.column || 1,
                message: err.message
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
                end: body[body.length - 1]?.loc?.end || { line: 1, column: 1 }
              }
            },
            errors: this.errors
          };
        }
        // ── Statements ─────────────────────────────────────────────────────────────
        parseStatement() {
          const token = this.peek();
          if (!token || token.type === TokenType.EOF)
            return null;
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
          this.matchDelimiter(";");
          return {
            type: "VariableDeclaration",
            name: nameToken.value,
            dataType: explicitType,
            value: initializer,
            loc: {
              start: { line: kwToken.line, column: kwToken.column },
              end: { line: this.previous()?.line || kwToken.line, column: this.previous()?.column || kwToken.column }
            }
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
              end: { line: this.previous()?.line || kw.line, column: this.previous()?.column || kw.column }
            }
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
              end: { line: this.previous()?.line || kw.line, column: this.previous()?.column || kw.column }
            }
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
              end: { line: this.previous()?.line || kw.line, column: this.previous()?.column || kw.column }
            }
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
              end: { line: this.previous()?.line || kw.line, column: this.previous()?.column || kw.column }
            }
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
              end: { line: this.previous()?.line || kw.line, column: this.previous()?.column || kw.column }
            }
          };
        }
        parseBlock() {
          const openBrace = this.consumeDelimiter("{", "Expected '{' to start block");
          const statements = [];
          while (!this.checkDelimiter("}") && !this.isAtEnd()) {
            if (this.matchDelimiter(";"))
              continue;
            const stmt = this.parseStatement();
            if (stmt)
              statements.push(stmt);
          }
          const closeBrace = this.consumeDelimiter("}", "Expected '}' to close block");
          return {
            type: "Block",
            body: statements,
            loc: {
              start: { line: openBrace.line, column: openBrace.column },
              end: { line: closeBrace.line, column: closeBrace.column }
            }
          };
        }
        parseAssignmentOrExpression() {
          const startTok = this.peek();
          const expr = this.parseExpression();
          if (expr.type === "Identifier" && this.matchOperator("=")) {
            const value = this.parseExpression();
            this.matchDelimiter(";");
            return {
              type: "AssignmentStatement",
              target: expr.name,
              value,
              loc: {
                start: expr.loc.start,
                end: { line: this.previous()?.line || expr.loc.end.line, column: this.previous()?.column || expr.loc.end.column }
              }
            };
          }
          this.matchDelimiter(";");
          return {
            type: "ExpressionStatement",
            expression: expr,
            loc: {
              start: expr.loc.start,
              end: { line: this.previous()?.line || expr.loc.end.line, column: this.previous()?.column || expr.loc.end.column }
            }
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
              loc: { start: left.loc.start, end: right.loc.end }
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
              loc: { start: left.loc.start, end: right.loc.end }
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
              loc: { start: left.loc.start, end: right.loc.end }
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
              loc: { start: left.loc.start, end: right.loc.end }
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
              loc: { start: left.loc.start, end: right.loc.end }
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
              loc: { start: left.loc.start, end: right.loc.end }
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
                end: right.loc.end
              }
            };
          }
          return this.parsePrimary();
        }
        parsePrimary() {
          const token = this.peek();
          if (!token || token.type === TokenType.EOF) {
            throw new Error("Unexpected end of input");
          }
          if (this.matchDelimiter("(")) {
            const openParen = this.previous();
            const expr = this.parseExpression();
            const closeParen = this.consumeDelimiter(")", "Expected ')' after expression");
            return {
              ...expr,
              loc: {
                start: { line: openParen.line, column: openParen.column },
                end: { line: closeParen.line, column: closeParen.column }
              }
            };
          }
          if (token.type === TokenType.INTEGER || token.type === TokenType.DECIMAL) {
            this.advance();
            return {
              type: "Literal",
              dataType: token.type === TokenType.INTEGER ? "Integer" : "decimal",
              value: token.value,
              raw: token.raw,
              loc: {
                start: { line: token.line, column: token.column },
                end: { line: token.line, column: token.column + token.raw.length }
              }
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
                end: { line: token.line, column: token.column + token.raw.length }
              }
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
                end: { line: token.line, column: token.column + token.raw.length }
              }
            };
          }
          if (token.type === TokenType.IDENTIFIER) {
            this.advance();
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
                  end: { line: closeParen.line, column: closeParen.column }
                }
              };
            }
            return {
              type: "Identifier",
              name: token.value,
              loc: {
                start: { line: token.line, column: token.column },
                end: { line: token.line, column: token.column + token.raw.length }
              }
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
          if (!this.isAtEnd())
            this.pos++;
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
          if (this.checkKeyword(kw))
            return this.advance();
          throw new Error(errMsg || `Expected keyword '${kw}', got '${this.peek()?.raw}'`);
        }
        consumeDelimiter(d, errMsg) {
          if (this.checkDelimiter(d))
            return this.advance();
          throw new Error(errMsg || `Expected delimiter '${d}', got '${this.peek()?.raw}'`);
        }
        consumeOperator(op, errMsg) {
          if (this.matchOperator(op))
            return this.previous();
          throw new Error(errMsg || `Expected operator '${op}', got '${this.peek()?.raw}'`);
        }
        consumeIdentifier(errMsg) {
          const tok = this.peek();
          if (tok && tok.type === TokenType.IDENTIFIER)
            return this.advance();
          throw new Error(errMsg || `Expected identifier, got '${tok?.raw}'`);
        }
        synchronize() {
          this.advance();
          while (!this.isAtEnd()) {
            if (this.previous()?.value === ";")
              return;
            const next = this.peek();
            if (next.type === TokenType.KEYWORD && ["make", "check", "repeat", "task", "give", "say"].includes(next.value)) {
              return;
            }
            this.advance();
          }
        }
      };
      module.exports = { ChillParser };
    }
  });

  // chilllang/symbol-table.js
  var require_symbol_table = __commonJS({
    "chilllang/symbol-table.js"(exports, module) {
      var SymbolEntry = class {
        constructor({ name, type = "any", kind = "variable", scopeName = "Global", scopeLevel = 0, line = 1, column = 1, initialized = true }) {
          this.name = name;
          this.type = type;
          this.kind = kind;
          this.scopeName = scopeName;
          this.scopeLevel = scopeLevel;
          this.line = line;
          this.column = column;
          this.initialized = initialized;
          this.references = 0;
        }
      };
      var Scope = class {
        constructor(name = "Global", level = 0, parent = null) {
          this.name = name;
          this.level = level;
          this.parent = parent;
          this.symbols = /* @__PURE__ */ new Map();
          this.children = [];
        }
        define(entry) {
          this.symbols.set(entry.name, entry);
        }
        hasLocal(name) {
          return this.symbols.has(name);
        }
        lookup(name) {
          if (this.symbols.has(name)) {
            return this.symbols.get(name);
          }
          if (this.parent) {
            return this.parent.lookup(name);
          }
          return null;
        }
      };
      var SymbolTableManager = class {
        constructor() {
          this.globalScope = new Scope("Global", 0, null);
          this.currentScope = this.globalScope;
          this.allScopes = [this.globalScope];
          this.allEntries = [];
        }
        enterScope(name = "block") {
          const newScope = new Scope(name, this.currentScope.level + 1, this.currentScope);
          this.currentScope.children.push(newScope);
          this.allScopes.push(newScope);
          this.currentScope = newScope;
          return newScope;
        }
        exitScope() {
          if (this.currentScope.parent) {
            this.currentScope = this.currentScope.parent;
          }
        }
        insert(entryData) {
          const entry = new SymbolEntry({
            ...entryData,
            scopeName: this.currentScope.name,
            scopeLevel: this.currentScope.level
          });
          this.currentScope.define(entry);
          this.allEntries.push(entry);
          return entry;
        }
        lookup(name) {
          return this.currentScope.lookup(name);
        }
        lookupLocal(name) {
          return this.currentScope.symbols.get(name) || null;
        }
        getAllEntries() {
          return this.allEntries;
        }
        /**
         * Export clean tabular records for UI presentation
         */
        toTableData() {
          return this.allEntries.map((e, index) => ({
            index: index + 1,
            name: e.name,
            type: e.type,
            kind: e.kind,
            scope: `${e.scopeName} (lvl ${e.scopeLevel})`,
            line: e.line,
            column: e.column,
            initialized: e.initialized ? "Yes" : "No",
            references: e.references
          }));
        }
      };
      module.exports = {
        SymbolEntry,
        Scope,
        SymbolTableManager
      };
    }
  });

  // chilllang/semantic.js
  var require_semantic = __commonJS({
    "chilllang/semantic.js"(exports, module) {
      var { SymbolTableManager } = require_symbol_table();
      var ChillSemanticAnalyzer = class {
        constructor(ast) {
          this.ast = ast;
          this.symbols = new SymbolTableManager();
          this.errors = [];
          this.warnings = [];
          this.currentTask = null;
          this.taskSignatures = /* @__PURE__ */ new Map();
        }
        analyze() {
          this.errors = [];
          this.warnings = [];
          if (this.ast && Array.isArray(this.ast.body)) {
            for (const stmt of this.ast.body) {
              if (stmt.type === "TaskDeclaration") {
                this.taskSignatures.set(stmt.name, {
                  paramsCount: stmt.params.length,
                  params: stmt.params,
                  returnType: stmt.returnType || "any",
                  line: stmt.loc?.start?.line || 1
                });
                this.symbols.insert({
                  name: stmt.name,
                  type: `task(${stmt.params.map((p) => p.dataType || "any").join(", ")}) -> ${stmt.returnType || "any"}`,
                  kind: "task",
                  line: stmt.loc?.start?.line || 1,
                  column: stmt.loc?.start?.column || 1,
                  initialized: true
                });
              }
            }
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
              ...this.warnings.map((w) => ({ ...w, severity: "warning" }))
            ]
          };
        }
        visitStatement(stmt) {
          if (!stmt)
            return;
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
          if (this.symbols.lookupLocal(name)) {
            this.errors.push({
              phase: "Semantic",
              line,
              column: col,
              message: `Duplicate variable declaration: '${name}' is already declared in current scope`
            });
            return;
          }
          let inferredType = "any";
          if (stmt.value) {
            inferredType = this.inferExpressionType(stmt.value);
          }
          const declaredType = stmt.dataType || inferredType || "any";
          if (stmt.dataType && stmt.value && inferredType !== "any") {
            if (!this.areTypesCompatible(stmt.dataType, inferredType)) {
              this.warnings.push({
                phase: "Semantic",
                line,
                column: col,
                message: `Type mismatch in variable '${name}': declared as '${stmt.dataType}' but assigned '${inferredType}'`
              });
            }
          }
          this.symbols.insert({
            name,
            type: declaredType,
            kind: "variable",
            line,
            column: col,
            initialized: stmt.value !== null
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
              message: `Cannot assign to undeclared variable '${name}'`
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
                message: `Type mismatch in assignment to '${name}': expected '${symbol.type}', got '${valType}'`
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
              message: `Condition in 'check' statement should evaluate to boolean, got '${condType}'`
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
              message: `Loop condition in 'repeat' should evaluate to boolean, got '${condType}'`
            });
          }
          this.visitBlock(stmt.body);
        }
        visitTaskDeclaration(stmt) {
          const prevTask = this.currentTask;
          this.currentTask = stmt;
          this.symbols.enterScope(`task:${stmt.name}`);
          for (const param of stmt.params) {
            const line = stmt.loc?.start?.line || 1;
            const col = stmt.loc?.start?.column || 1;
            if (this.symbols.lookupLocal(param.name)) {
              this.errors.push({
                phase: "Semantic",
                line,
                column: col,
                message: `Duplicate parameter name '${param.name}' in task '${stmt.name}'`
              });
            } else {
              this.symbols.insert({
                name: param.name,
                type: param.dataType || "any",
                kind: "parameter",
                line,
                column: col,
                initialized: true
              });
            }
          }
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
              message: `'give' statement must be inside a task declaration`
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
                  message: `Task '${this.currentTask.name}' declared return type '${this.currentTask.returnType}', but gives '${returnValType}'`
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
          if (!block)
            return;
          this.symbols.enterScope("block");
          if (Array.isArray(block.body)) {
            for (const stmt of block.body) {
              this.visitStatement(stmt);
            }
          }
          this.symbols.exitScope();
        }
        inferExpressionType(expr) {
          if (!expr)
            return "any";
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
                  message: `Undefined identifier '${expr.name}': variable used before declaration`
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
                  return "string";
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
              if (expr.operator === "!")
                return "boolean";
              if (expr.operator === "-" || expr.operator === "+")
                return argType === "decimal" ? "decimal" : "Integer";
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
                  message: `Undefined task '${callee}': function called before definition`
                });
              } else if (sig) {
                if (expr.arguments.length !== sig.paramsCount) {
                  this.warnings.push({
                    phase: "Semantic",
                    line,
                    column: col,
                    message: `Task '${callee}' expects ${sig.paramsCount} argument(s), but called with ${expr.arguments.length}`
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
          if (!expected || !actual)
            return true;
          if (expected === "any" || actual === "any")
            return true;
          const normExp = expected.toLowerCase();
          const normAct = actual.toLowerCase();
          if (normExp === normAct)
            return true;
          if ((normExp === "integer" || normExp === "int") && (normAct === "integer" || normAct === "int"))
            return true;
          if ((normExp === "decimal" || normExp === "float") && (normAct === "decimal" || normAct === "float"))
            return true;
          if ((normExp === "decimal" || normExp === "float") && (normAct === "integer" || normAct === "int"))
            return true;
          if (normExp === "boolean" && normAct === "bool")
            return true;
          if (normExp === "bool" && normAct === "boolean")
            return true;
          return false;
        }
      };
      module.exports = { ChillSemanticAnalyzer };
    }
  });

  // chilllang/tac.js
  var require_tac = __commonJS({
    "chilllang/tac.js"(exports, module) {
      var TACInstruction = class {
        constructor({ op, arg1 = null, arg2 = null, result = null, label = null, comment = null, line = null }) {
          this.op = op;
          this.arg1 = arg1;
          this.arg2 = arg2;
          this.result = result;
          this.label = label;
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
      };
      var ChillTACGenerator = class {
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
            quadruples: this.toQuadruples()
          };
        }
        generateStatement(stmt) {
          if (!stmt)
            return;
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
              this.emit({
                op: "if_false",
                arg1: condTemp,
                result: elseLabel || endLabel,
                line: stmt.loc?.start?.line
              });
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
                line: stmt.loc?.start?.line
              });
              this.generateBlock(stmt.body);
              this.emit({ op: "goto", arg1: startLabel });
              this.emitLabel(endLabel);
              break;
            }
            case "TaskDeclaration": {
              const funcLabel = `TASK_${stmt.name}`;
              const endFuncLabel = `END_TASK_${stmt.name}`;
              this.emit({ op: "goto", arg1: endFuncLabel });
              this.emitLabel(funcLabel);
              for (let i = 0; i < stmt.params.length; i++) {
                this.emit({ op: "=", arg1: `param_${i + 1}`, result: stmt.params[i].name });
              }
              this.generateBlock(stmt.body);
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
          if (!block || !Array.isArray(block.body))
            return;
          for (const stmt of block.body) {
            this.generateStatement(stmt);
          }
        }
        generateExpression(expr) {
          if (!expr)
            return "null";
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
                result: resTemp
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
                result: resTemp
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
                result: resTemp
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
              return `
${lineNum} | ${inst.toString()}`;
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
            text: inst.toString()
          }));
        }
      };
      module.exports = {
        TACInstruction,
        ChillTACGenerator
      };
    }
  });

  // chilllang/optimizer.js
  var require_optimizer = __commonJS({
    "chilllang/optimizer.js"(exports, module) {
      var { TACInstruction } = require_tac();
      var ChillOptimizer = class {
        constructor(instructions = []) {
          this.originalInstructions = instructions;
          this.stats = {
            constantFolds: 0,
            algebraicSimplifications: 0,
            instructionsBefore: instructions.length,
            instructionsAfter: 0,
            optimizationsApplied: []
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
            current = this.runFoldingAndAlgebraicPass(current);
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
              text: inst.toString()
            })),
            stats: this.stats
          };
        }
        runFoldingAndAlgebraicPass(instructions) {
          const constMap = /* @__PURE__ */ new Map();
          const optimized = [];
          for (let i = 0; i < instructions.length; i++) {
            const inst = instructions[i];
            if (inst.op === "label" || inst.op === "goto" || inst.op === "if_false" || inst.op === "if_true" || inst.op === "call") {
              if (inst.op === "label") {
                constMap.clear();
              }
              optimized.push(inst);
              continue;
            }
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
                line: inst.line
              }));
              continue;
            }
            if (["+", "-", "*", "/", "%", "==", "!=", "<", "<=", ">", ">=", "&&", "||"].includes(inst.op)) {
              let left = inst.arg1;
              let right = inst.arg2;
              if (constMap.has(left))
                left = constMap.get(left);
              if (constMap.has(right))
                right = constMap.get(right);
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
                    line: inst.line
                  }));
                  continue;
                }
              }
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
                  line: inst.line
                }));
                continue;
              }
              optimized.push(new TACInstruction({
                op: inst.op,
                arg1: left,
                arg2: right,
                result: inst.result,
                line: inst.line
              }));
              continue;
            }
            if (inst.op === "neg" || inst.op === "not") {
              let arg = inst.arg1;
              if (constMap.has(arg))
                arg = constMap.get(arg);
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
                  line: inst.line
                }));
                continue;
              }
              optimized.push(new TACInstruction({
                op: inst.op,
                arg1: arg,
                result: inst.result,
                line: inst.line
              }));
              continue;
            }
            if (inst.op === "say" || inst.op === "return" || inst.op === "param") {
              let arg = inst.arg1;
              if (constMap.has(arg))
                arg = constMap.get(arg);
              optimized.push(new TACInstruction({
                op: inst.op,
                arg1: arg,
                arg2: inst.arg2,
                result: inst.result,
                line: inst.line
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
          if (op === "+") {
            if (rightIsZero)
              return left;
            if (leftIsZero)
              return right;
          }
          if (op === "-") {
            if (rightIsZero)
              return left;
            if (left === right)
              return "0";
          }
          if (op === "*") {
            if (rightIsOne)
              return left;
            if (leftIsOne)
              return right;
            if (rightIsZero || leftIsZero)
              return "0";
          }
          if (op === "/") {
            if (rightIsOne)
              return left;
          }
          if (op === "&&") {
            if (right === "true")
              return left;
            if (left === "true")
              return right;
            if (right === "false" || left === "false")
              return "false";
          }
          if (op === "||") {
            if (right === "false")
              return left;
            if (left === "false")
              return right;
            if (right === "true" || left === "true")
              return "true";
          }
          return null;
        }
        eliminateDeadTemporaries(instructions) {
          const usedVars = /* @__PURE__ */ new Set();
          for (const inst of instructions) {
            if (inst.arg1 && !this.isLiteral(inst.arg1))
              usedVars.add(inst.arg1);
            if (inst.arg2 && !this.isLiteral(inst.arg2))
              usedVars.add(inst.arg2);
          }
          return instructions.filter((inst) => {
            if (inst.op === "=" && inst.result && inst.result.startsWith("t")) {
              const isUsed = usedVars.has(inst.result);
              return isUsed;
            }
            return true;
          });
        }
        isLiteral(str) {
          if (typeof str !== "string")
            return false;
          if (str === "true" || str === "false" || str === "null")
            return true;
          if (/^-?\d+(\.\d+)?$/.test(str))
            return true;
          if (str.startsWith('"') && str.endsWith('"') || str.startsWith("'") && str.endsWith("'"))
            return true;
          return false;
        }
        parseLiteral(str) {
          if (str === "true")
            return true;
          if (str === "false")
            return false;
          if (str === "null")
            return null;
          if (/^-?\d+(\.\d+)?$/.test(str))
            return parseFloat(str);
          if (str.startsWith('"') && str.endsWith('"') || str.startsWith("'") && str.endsWith("'")) {
            return str.slice(1, -1);
          }
          return str;
        }
        evalBinary(op, a, b) {
          switch (op) {
            case "+":
              return typeof a === "string" || typeof b === "string" ? `${a}${b}` : a + b;
            case "-":
              return a - b;
            case "*":
              return a * b;
            case "/":
              return b !== 0 ? a / b : null;
            case "%":
              return b !== 0 ? a % b : null;
            case "==":
              return a === b;
            case "!=":
              return a !== b;
            case "<":
              return a < b;
            case "<=":
              return a <= b;
            case ">":
              return a > b;
            case ">=":
              return a >= b;
            case "&&":
              return Boolean(a && b);
            case "||":
              return Boolean(a || b);
            default:
              return null;
          }
        }
        toFormattedText(instructions) {
          return instructions.map((inst, index) => {
            const lineNum = String(index + 1).padStart(3, " ");
            if (inst.op === "label") {
              return `
${lineNum} | ${inst.toString()}`;
            }
            return `${lineNum} |   ${inst.toString()}`;
          }).join("\n").trim();
        }
      };
      module.exports = { ChillOptimizer };
    }
  });

  // chilllang/codegen.js
  var require_codegen = __commonJS({
    "chilllang/codegen.js"(exports, module) {
      var ChillJSGenerator = class {
        constructor(ast) {
          this.ast = ast;
          this.indent = 0;
        }
        generate() {
          if (!this.ast || !Array.isArray(this.ast.body))
            return "";
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
          if (!stmt)
            return "";
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
              let out = `${prefix}if (${cond}) {
`;
              this.indent++;
              out += this.generateBlockStatements(stmt.consequent);
              this.indent--;
              out += `
${prefix}}`;
              if (stmt.alternate) {
                if (stmt.alternate.type === "ConditionalStatement") {
                  out += ` else ${this.generateStatement(stmt.alternate).trim()}`;
                } else {
                  out += ` else {
`;
                  this.indent++;
                  out += this.generateBlockStatements(stmt.alternate);
                  this.indent--;
                  out += `
${prefix}}`;
                }
              }
              return out;
            }
            case "RepeatStatement": {
              const cond = this.generateExpression(stmt.condition);
              let out = `${prefix}while (${cond}) {
`;
              this.indent++;
              out += this.generateBlockStatements(stmt.body);
              this.indent--;
              out += `
${prefix}}`;
              return out;
            }
            case "TaskDeclaration": {
              const params = stmt.params.map((p) => p.name).join(", ");
              let out = `${prefix}function ${stmt.name}(${params}) {
`;
              this.indent++;
              out += this.generateBlockStatements(stmt.body);
              this.indent--;
              out += `
${prefix}}`;
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
              let out = `${prefix}{
`;
              this.indent++;
              out += this.generateBlockStatements(stmt);
              this.indent--;
              out += `
${prefix}}`;
              return out;
            }
            default:
              return `${prefix}/* unhandled statement: ${stmt.type} */`;
          }
        }
        generateBlockStatements(block) {
          if (!block || !Array.isArray(block.body))
            return "";
          return block.body.map((s) => this.generateStatement(s)).join("\n");
        }
        generateExpression(expr) {
          if (!expr)
            return "null";
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
      };
      module.exports = { ChillJSGenerator };
    }
  });

  // chilllang/executor.js
  var require_executor = __commonJS({
    "chilllang/executor.js"(exports, module) {
      var ChillExecutor = class {
        static run(jsCode, options = { timeoutMs: 2e3 }) {
          const logs = [];
          let runtimeError = null;
          const sandboxConsole = {
            log: (...args) => {
              logs.push(args.map((a) => typeof a === "object" ? JSON.stringify(a) : String(a)).join(" "));
            },
            error: (...args) => {
              logs.push("[ERROR] " + args.map(String).join(" "));
            },
            warn: (...args) => {
              logs.push("[WARN] " + args.map(String).join(" "));
            }
          };
          try {
            const runner = new Function("console", `"use strict";
${jsCode}`);
            runner(sandboxConsole);
          } catch (err) {
            runtimeError = err.message || String(err);
            logs.push(`
[Runtime Error]: ${runtimeError}`);
          }
          return {
            success: runtimeError === null,
            output: logs.join("\n"),
            error: runtimeError
          };
        }
      };
      module.exports = { ChillExecutor };
    }
  });

  // chilllang/compiler.js
  var require_compiler = __commonJS({
    "chilllang/compiler.js"(exports, module) {
      var { ChillLexer } = require_lexer();
      var { ChillParser } = require_parser();
      var { ChillSemanticAnalyzer } = require_semantic();
      var { ChillTACGenerator } = require_tac();
      var { ChillOptimizer } = require_optimizer();
      var { ChillJSGenerator } = require_codegen();
      var { ChillExecutor } = require_executor();
      var ChillCompiler = class {
        static compile(sourceCode = "", options = { run: false }) {
          const startTime = Date.now();
          const allDiagnostics = [];
          const lexer = new ChillLexer(sourceCode);
          const { tokens, errors: lexErrors } = lexer.tokenize();
          for (const e of lexErrors) {
            allDiagnostics.push({ ...e, phase: "Lexical", severity: "error" });
          }
          const parser = new ChillParser(tokens);
          const { ast, errors: parseErrors } = parser.parse();
          for (const e of parseErrors) {
            allDiagnostics.push({ ...e, phase: "Syntax", severity: "error" });
          }
          const semanticAnalyzer = new ChillSemanticAnalyzer(ast);
          const { symbolTable, errors: semErrors, warnings: semWarnings } = semanticAnalyzer.analyze();
          for (const e of semErrors) {
            allDiagnostics.push({ ...e, phase: "Semantic", severity: "error" });
          }
          for (const w of semWarnings) {
            allDiagnostics.push({ ...w, phase: "Semantic", severity: "warning" });
          }
          const tacGenerator = new ChillTACGenerator(ast);
          const tacResult = tacGenerator.generate();
          const optimizer = new ChillOptimizer(tacResult.instructions);
          const optResult = optimizer.optimize();
          const jsGenerator = new ChillJSGenerator(ast);
          const jsCode = jsGenerator.generate();
          const elapsedTime = Date.now() - startTime;
          const hasFatalErrors = allDiagnostics.some((d) => d.severity === "error");
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
            run: () => ChillExecutor.run(jsCode)
          };
        }
      };
      module.exports = { ChillCompiler };
    }
  });

  // chilllang/index.js
  var require_chilllang = __commonJS({
    "chilllang/index.js"(exports, module) {
      var { TokenType, KEYWORDS, DATA_TYPES, OPERATORS, DELIMITERS } = require_tokens();
      var { ChillLexer } = require_lexer();
      var { ChillParser } = require_parser();
      var { SymbolTableManager } = require_symbol_table();
      var { ChillSemanticAnalyzer } = require_semantic();
      var { ChillTACGenerator, TACInstruction } = require_tac();
      var { ChillOptimizer } = require_optimizer();
      var { ChillJSGenerator } = require_codegen();
      var { ChillExecutor } = require_executor();
      var { ChillCompiler } = require_compiler();
      module.exports = {
        TokenType,
        KEYWORDS,
        DATA_TYPES,
        OPERATORS,
        DELIMITERS,
        ChillLexer,
        ChillParser,
        SymbolTableManager,
        ChillSemanticAnalyzer,
        ChillTACGenerator,
        TACInstruction,
        ChillOptimizer,
        ChillJSGenerator,
        ChillExecutor,
        ChillCompiler,
        compile: (source, options) => ChillCompiler.compile(source, options),
        run: (jsCode) => ChillExecutor.run(jsCode)
      };
    }
  });
  return require_chilllang();
})();
