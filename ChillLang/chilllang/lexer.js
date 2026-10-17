/**
 * ChillLang — Lexical Analyzer (Scanner / Lexer)
 * Phase 1: Converts source code into a clean stream of tokens.
 */

const { TokenType, KEYWORDS, DATA_TYPES, OPERATORS, DELIMITERS } = require("./tokens");

class ChillLexer {
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

      // Whitespace handling
      if (char === " " || char === "\t" || char === "\r") {
        this.advance();
        continue;
      }

      if (char === "\n") {
        this.line++;
        this.column = 1;
        this.pos++;
        continue;
      }

      // Single-line or multi-line comments
      if (char === "/" && this.peek(1) === "/") {
        const startLine = this.line;
        const startCol = this.column;
        let commentText = "";
        this.advance(); // /
        this.advance(); // /
        while (this.pos < this.source.length && this.peek() !== "\n") {
          commentText += this.advance();
        }
        // Comments can optionally be preserved or ignored
        continue;
      }

      if (char === "/" && this.peek(1) === "*") {
        const startLine = this.line;
        const startCol = this.column;
        this.advance(); // /
        this.advance(); // *
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
            line: startLine,
            column: startCol,
            message: "Unterminated multi-line comment",
          });
        }
        continue;
      }

      const startLine = this.line;
      const startCol = this.column;

      // Two-character operators
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
          column: startCol,
        });
        continue;
      }

      // Single-character operators
      if (OPERATORS.has(char)) {
        this.advance();
        this.tokens.push({
          index: index++,
          type: TokenType.OPERATOR,
          value: char,
          raw: char,
          line: startLine,
          column: startCol,
        });
        continue;
      }

      // Delimiters
      if (DELIMITERS.has(char)) {
        this.advance();
        this.tokens.push({
          index: index++,
          type: TokenType.DELIMITER,
          value: char,
          raw: char,
          line: startLine,
          column: startCol,
        });
        continue;
      }

      // String literals ("..." or '...')
      if (char === '"' || char === "'") {
        const quote = char;
        this.advance(); // open quote
        let strVal = "";
        let closed = false;
        while (this.pos < this.source.length) {
          const c = this.peek();
          if (c === "\\") {
            this.advance();
            const next = this.advance();
            if (next === "n") strVal += "\n";
            else if (next === "t") strVal += "\t";
            else if (next === "r") strVal += "\r";
            else if (next === "\\") strVal += "\\";
            else if (next === quote) strVal += quote;
            else strVal += next;
            continue;
          }
          if (c === quote) {
            this.advance(); // closing quote
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
            message: `Unterminated string literal starting with ${quote}`,
          });
        }

        this.tokens.push({
          index: index++,
          type: TokenType.STRING,
          value: strVal,
          raw: `${quote}${strVal}${closed ? quote : ""}`,
          line: startLine,
          column: startCol,
        });
        continue;
      }

      // Numeric literals (Integers and Decimals)
      if (this.isDigit(char)) {
        let numStr = "";
        let isDecimal = false;
        while (this.isDigit(this.peek())) {
          numStr += this.advance();
        }
        if (this.peek() === "." && this.isDigit(this.peek(1))) {
          isDecimal = true;
          numStr += this.advance(); // .
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
          column: startCol,
        });
        continue;
      }

      // Identifiers, Keywords, Types, Booleans
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
          column: startCol,
        });
        continue;
      }

      // Unrecognized character
      const badChar = this.advance();
      this.errors.push({
        phase: "Lexical",
        line: startLine,
        column: startCol,
        message: `Unexpected or invalid character '${badChar}'`,
      });
      this.tokens.push({
        index: index++,
        type: TokenType.ERROR,
        value: badChar,
        raw: badChar,
        line: startLine,
        column: startCol,
      });
    }

    // Append EOF token
    this.tokens.push({
      index: index++,
      type: TokenType.EOF,
      value: "EOF",
      raw: "",
      line: this.line,
      column: this.column,
    });

    return {
      tokens: this.tokens,
      errors: this.errors,
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
    return (ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z");
  }

  isAlphaNumeric(ch) {
    return this.isAlpha(ch) || this.isDigit(ch);
  }
}

module.exports = { ChillLexer };
