/**
 * ChillLang — Symbol Table & Scope Management
 * Phase 4 & 5: Manages identifiers, data types, scope hierarchy,
 * and tracks symbol definitions and references.
 */

class SymbolEntry {
  constructor({ name, type = "any", kind = "variable", scopeName = "Global", scopeLevel = 0, line = 1, column = 1, initialized = true }) {
    this.name = name;
    this.type = type;             // "Integer", "decimal", "string", "boolean", "any"
    this.kind = kind;             // "variable", "parameter", "task"
    this.scopeName = scopeName;   // e.g. "Global", "task:add", "block"
    this.scopeLevel = scopeLevel; // 0, 1, 2...
    this.line = line;
    this.column = column;
    this.initialized = initialized;
    this.references = 0;
  }
}

class Scope {
  constructor(name = "Global", level = 0, parent = null) {
    this.name = name;
    this.level = level;
    this.parent = parent;
    this.symbols = new Map(); // name -> SymbolEntry
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
}

class SymbolTableManager {
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
      scopeLevel: this.currentScope.level,
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
      references: e.references,
    }));
  }
}

module.exports = {
  SymbolEntry,
  Scope,
  SymbolTableManager,
};
