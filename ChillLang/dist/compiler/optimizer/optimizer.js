export function optimize(ast) {
  let body = ast.body.map(s => optimizeStatement(s));
  body = promoteLetToConst(body);
  body = propagateConstants(body);
  body = lowerArrayMethods(body);
  const program = { type: ast.type, body: body, errors: ast.errors, loc: ast.loc };
  return program;
}
if (left.type === "Literal" && right.type === "Literal") {
  const result = evalBinOp(expr.operator, left.value, right.value);
  if (result !== undefined) {
    return makeLiteral(result, expr.loc);
  }
}
if (expr.operator === "+") {
  if (isLiteralNumber(right, 0)) {
    return left;
  }
  if (isLiteralNumber(left, 0)) {
    return right;
  }
}
if (expr.operator === "-") {
  if (isLiteralNumber(right, 0)) {
    return left;
  }
  if (left.type === "Identifier" && right.type === "Identifier" && left.name === right.name) {
    return makeLiteral(0, expr.loc);
  }
}
if (expr.operator === "*") {
  if (isLiteralNumber(right, 1)) {
    return left;
  }
  if (isLiteralNumber(left, 1)) {
    return right;
  }
  if (isLiteralNumber(right, 0) && isPureExpression(left)) {
    return makeLiteral(0, expr.loc);
  }
  if (isLiteralNumber(left, 0) && isPureExpression(right)) {
    return makeLiteral(0, expr.loc);
  }
}
if (expr.operator === "/") {
  if (isLiteralNumber(right, 1)) {
    return left;
  }
}
if (expr.operator === "**" && isLiteralNumber(right, 2)) {
  return { type: "BinaryExpression", operator: "*", left: left, right: left, loc: expr.loc };
}
if (expr.operator === "&&" && isLiteralBoolean(right, true)) {
  return left;
}
if (expr.operator === "||" && isLiteralBoolean(right, false)) {
  return left;
}
if (expr.operator === "&&" && isLiteralBoolean(left, true)) {
  return right;
}
if (expr.operator === "||" && isLiteralBoolean(left, false)) {
  return right;
}
if (expr.operator === "&&" && isLiteralBoolean(left, false) && isPureExpression(right)) {
  return makeLiteral(false, expr.loc);
}
if (expr.operator === "||" && isLiteralBoolean(left, true) && isPureExpression(right)) {
  return makeLiteral(true, expr.loc);
}
if ((expr.operator === "===" || expr.operator === "==") && left.type === "Identifier" && right.type === "Identifier" && left.name === right.name) {
  return makeLiteral(true, expr.loc);
}
return p;
const allText = parts.every(p => p.kind === "Text");
if (allText) {
  const text = parts.map(p => p.value).join("");
  return { type: "Literal", value: text, literalType: "string", loc: expr.loc };
}
const collapsed = [];
for (const p of parts) {
  if (p.kind === "Expression" && p.expression.type === "Literal" && (p.expression.literalType === "string" || p.expression.literalType === "number")) {
    const textValue = String(p.expression.value);
    const last = collapsed.length > 0 ? collapsed[collapsed.length - 1] : null;
    if (last && last.kind === "Text") {
      collapsed[collapsed.length - 1] = { kind: "Text", value: last.value + textValue };
    } else {
      collapsed.push({ kind: "Text", value: textValue });
    }
  } else {
    collapsed.push(p);
  }
}
if (collapsed.length === 1 && collapsed[0].kind === "Text") {
  return { type: "Literal", value: collapsed[0].value, literalType: "string", loc: expr.loc };
}
function makeLiteral(value, loc) {
  let litType = typeof value;
  if (value === null) {
    litType = "null";
  }
  return { type: "Literal", value: value, literalType: litType, loc: loc };
}
function isLiteralNumber(expr, n) {
  return expr.type === "Literal" && expr.literalType === "number" && expr.value === n;
}
function isLiteralBoolean(expr, val) {
  return expr.type === "Literal" && expr.literalType === "boolean" && expr.value === val;
}
function isPureExpression(expr) {
  switch (expr.type) {
    case "Literal": {
      return true;
    }
    case "Identifier": {
      return true;
    }
    case "MemberExpression": {
      return isPureExpression(expr.object);
    }
    case "BinaryExpression": {
      return isPureExpression(expr.left) && isPureExpression(expr.right);
    }
    case "UnaryExpression": {
      if (expr.operator === "delete") {
        return false;
      }
      return isPureExpression(expr.argument);
    }
    case "ArrayExpression": {
      return expr.elements.every(e => isPureExpression(e));
    }
    case "TemplateLiteral": {
      return true;
    }
    default: {
      return false;
    }
  }
}
function evalBinOp(op, left, right) {
  switch (op) {
    case "+": {
      return left + right;
    }
    case "-": {
      return left - right;
    }
    case "*": {
      return left * right;
    }
    case "/": {
      if (right === 0) {
        return undefined;
      }
      return left / right;
    }
    case "%": {
      if (right === 0) {
        return undefined;
      }
      return left % right;
    }
    case "**": {
      return left ** right;
    }
    case "==": {
      return left === right;
    }
    case "===": {
      return left === right;
    }
    case "!=": {
      return left !== right;
    }
    case "!==": {
      return left !== right;
    }
    case "<": {
      return left < right;
    }
    case ">": {
      return left > right;
    }
    case "<=": {
      return left <= right;
    }
    case ">=": {
      return left >= right;
    }
    case "&&": {
      return left && right;
    }
    case "||": {
      return left || right;
    }
    case "??": {
      return left ?? right;
    }
    case "&": {
      return left & right;
    }
    case "|": {
      return left | right;
    }
    case "^": {
      return left ^ right;
    }
    case "<<": {
      return left << right;
    }
    case ">>": {
      return left >> right;
    }
    case ">>>": {
      return left >>> right;
    }
    default: {
      return undefined;
    }
  }
}
function evalUnaryOp(op, arg) {
  switch (op) {
    case "-": {
      return -arg;
    }
    case "+": {
      return +arg;
    }
    case "!": {
      return !arg;
    }
    case "~": {
      return ~arg;
    }
    case "typeof": {
      return typeof arg;
    }
    default: {
      return undefined;
    }
  }
}
function promoteLetToConst(body) {
  const mutated = new Set();
  walkForMutations(body, mutated);
  return walkForLetPromotion(body, mutated);
}
function walkForMutations(nodes, mutated) {
  if (!nodes) {
    return;
  }
  if (Array.isArray(nodes)) {
    for (const n of nodes) {
      walkForMutations(n, mutated);
    }
    return;
  }
  if (nodes.type === "AssignmentExpression" || nodes.type === "CompoundAssignmentExpression") {
    if (nodes.left.type === "Identifier") {
      mutated.add(nodes.left.name);
    }
    walkForMutations(nodes.right, mutated);
    return;
  }
  if (nodes.type === "UpdateExpression") {
    if (nodes.argument.type === "Identifier") {
      mutated.add(nodes.argument.name);
    }
    return;
  }
  const keys = ["body", "consequent", "alternate", "cases", "expression", "left", "right", "argument", "value", "callee", "arguments", "object", "property", "elements", "properties", "condition", "iterable", "tryBlock", "catchBlock", "finallyBlock", "declaration"];
  for (const key of keys) {
    if (nodes[key]) {
      walkForMutations(nodes[key], mutated);
    }
  }
}
function walkForLetPromotion(nodes, mutated) {
  if (!nodes) {
    return nodes;
  }
  if (Array.isArray(nodes)) {
    return nodes.map(n => walkForLetPromotion(n, mutated));
  }
  if (nodes.type === "VariableDeclaration" && nodes.kind === "let") {
    if (!mutated.has(nodes.name.name)) {
      nodes.kind = "const";
    }
  }
  const keys = ["body", "consequent", "alternate", "cases", "expression", "left", "right", "argument", "value", "callee", "arguments", "object", "property", "elements", "properties", "condition", "iterable", "tryBlock", "catchBlock", "finallyBlock", "declaration"];
  for (const key of keys) {
    if (nodes[key]) {
      nodes[key] = walkForLetPromotion(nodes[key], mutated);
    }
  }
  return nodes;
}
function propagateConstants(body) {
  return walkForConstProp(body, {});
}
if (p.computed) {
  newP.key = walkForConstProp(p.key, constants);
}
return newP;
if (nodes.type === "MemberExpression") {
  nodes.object = walkForConstProp(nodes.object, constants);
  if (nodes.computed) {
    nodes.property = walkForConstProp(nodes.property, constants);
  }
}
if (nodes.type === "SwitchStatement") {
  nodes.discriminant = walkForConstProp(nodes.discriminant, constants);
  nodes.cases = walkForConstProp(nodes.cases, constants);
}
if (nodes.type === "SwitchCase") {
  nodes.test = walkForConstProp(nodes.test, constants);
  nodes.consequent = walkForConstProp(nodes.consequent, constants);
}
if (nodes.type === "MatchStatement") {
  nodes.discriminant = walkForConstProp(nodes.discriminant, constants);
  nodes.cases = walkForConstProp(nodes.cases, constants);
}
if (nodes.type === "MatchCase") {
  nodes.guard = walkForConstProp(nodes.guard, constants);
  nodes.body = walkForConstProp(nodes.body, constants);
}
if (nodes.type === "_OptimizedBlock" || nodes.type === "BlockStatement") {
  nodes.body = walkForConstProp(nodes.body, constants);
}
if (nodes.type === "TryCatchStatement") {
  nodes.tryBlock = walkForConstProp(nodes.tryBlock, constants);
  nodes.catchBlock = walkForConstProp(nodes.catchBlock, constants);
  nodes.finallyBlock = walkForConstProp(nodes.finallyBlock, constants);
}
return nodes;
function lowerArrayMethods(nodes) {
  if (!nodes) {
    return nodes;
  }
  if (Array.isArray(nodes)) {
    return nodes.map(n => lowerArrayMethods(n));
  }
  if (nodes.type === "ExpressionStatement" && nodes.expression.type === "CallExpression") {
    const call = nodes.expression;
    if (call.callee.type === "MemberExpression" && call.callee.object.type === "Identifier" && !call.callee.computed) {
      const method = call.callee.property.name;
      if (method === "forEach" && call.arguments.length === 1) {
        const arg = call.arguments[0];
        if (arg.type === "ArrowFunction" && arg.params.length === 1) {
          return { type: "ForStatement", kind: "in", variable: arg.params[0], iterable: call.callee.object, body: Array.isArray(arg.body) ? lowerArrayMethods(arg.body) : [{ type: "ExpressionStatement", expression: lowerArrayMethods(arg.body) }], loc: nodes.loc };
        }
      }
    }
  }
  const keys = ["body", "consequent", "alternate", "cases", "expression", "left", "right", "argument", "value", "callee", "arguments", "object", "property", "elements", "properties", "condition", "iterable", "tryBlock", "catchBlock", "finallyBlock", "declaration"];
  for (const key of keys) {
    if (nodes[key]) {
      nodes[key] = lowerArrayMethods(nodes[key]);
    }
  }
  return nodes;
}