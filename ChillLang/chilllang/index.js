/**
 * ChillLang — Main Package Exports
 */

const { TokenType, KEYWORDS, DATA_TYPES, OPERATORS, DELIMITERS } = require("./tokens");
const { ChillLexer } = require("./lexer");
const { ChillParser } = require("./parser");
const { SymbolTableManager } = require("./symbol-table");
const { ChillSemanticAnalyzer } = require("./semantic");
const { ChillTACGenerator, TACInstruction } = require("./tac");
const { ChillOptimizer } = require("./optimizer");
const { ChillJSGenerator } = require("./codegen");
const { ChillExecutor } = require("./executor");
const { ChillCompiler } = require("./compiler");

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
  run: (jsCode) => ChillExecutor.run(jsCode),
};
