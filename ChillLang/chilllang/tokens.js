/**
 * ChillLang — Token Definitions
 * Phase 1: Lexical Specifications
 */

const TokenType = {
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
  ERROR: "ERROR",
};

const KEYWORDS = new Set([
  "make",       // Variable declaration: make x = 10;
  "check",      // Conditional: check (x > 5) { }
  "otherwise",  // Else branch: otherwise { }
  "repeat",     // Loop: repeat (x < 10) { }
  "task",       // Function: task add(a, b) { }
  "give",       // Return: give a + b;
  "say",        // Output: say(x);
  "true",
  "false",
  "null",
]);

const DATA_TYPES = new Set([
  "Integer",
  "decimal",
  "string",
  "boolean",
  "int",
  "float",
  "number",
  "bool",
  "void",
]);

const OPERATORS = new Set([
  "+", "-", "*", "/", "%",
  "==", "!=", "<=", ">=", "<", ">",
  "&&", "||", "!",
  "=",
]);

const DELIMITERS = new Set([
  "(", ")", "{", "}", "[", "]", ",", ";", ":",
]);

module.exports = {
  TokenType,
  KEYWORDS,
  DATA_TYPES,
  OPERATORS,
  DELIMITERS,
};
