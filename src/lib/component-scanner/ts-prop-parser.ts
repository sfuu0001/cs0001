// src/lib/component-scanner/ts-prop-parser.ts
// 使用 ts-morph 解析 .tsx 文件，提取组件 Props 类型定义

import {
  Project,
  SyntaxKind,
  type SourceFile,
  type Type,
  type PropertySignature,
} from "ts-morph"
import type { PropDef } from "./types"

/** 尝试从 TypeScript 类型推断 PropDef 的 type 字段 */
function inferPropType(
  propType: Type,
  propSignature: PropertySignature,
): Pick<PropDef, "type" | "options"> {
  const text = propType.getText()

  // 检查 JSDoc 注释中的 @type 标注
  const jsdocs = propSignature.getJsDocs()
  for (const jsdoc of jsdocs) {
    const tags = jsdoc.getTags()
    for (const tag of tags) {
      if (tag.getTagName() === "type") {
        const textContent = tag.getComment()
        if (textContent === "string") return { type: "string", options: undefined }
        if (textContent === "number") return { type: "number", options: undefined }
        if (textContent === "boolean") return { type: "boolean", options: undefined }
      }
    }
  }

  // boolean 字面量类型：true | false
  if (text === "boolean") {
    return { type: "boolean", options: undefined }
  }

  // string 基本类型
  if (text === "string") {
    return { type: "string", options: undefined }
  }

  // number 基本类型
  if (text === "number") {
    return { type: "number", options: undefined }
  }

  // 检查是否是 string literal union 类型 → select
  const unionTypes = propType.getUnionTypes()
  if (unionTypes.length > 1 && unionTypes.every((t) => t.isStringLiteral() || t.isLiteral())) {
    const options: string[] = []
    for (const t of unionTypes) {
      if (t.isStringLiteral()) {
        options.push(t.getText().replace(/['"]/g, ""))
      } else if (t.isLiteral()) {
        options.push(t.getLiteralValue()?.toString() ?? t.getText())
      }
    }
    return { type: "select", options }
  }

  // 单个 string literal → 存为 select 但只有一个选项
  if (propType.isStringLiteral()) {
    return {
      type: "select",
      options: [propType.getText().replace(/['"]/g, "")],
    }
  }

  // 数组类型
  if (propType.isArray()) {
    return { type: "array", options: undefined }
  }

  // object 类型
  if (propType.isObject()) {
    return { type: "object", options: undefined }
  }

  // ReactNode / React.ReactNode / JSX.Element
  const textLower = text.toLowerCase()
  if (textLower.includes("reactnode") || textLower.includes("reactelement") || textLower.includes("jsx")) {
    return { type: "unknown", options: undefined }
  }

  // 枚举类型 → select
  if (propType.getSymbol()?.getDeclarations()?.some((d) => d.getKind() === SyntaxKind.EnumDeclaration)) {
    const members = propType.getSymbol()?.getDeclarations()?.[0]?.getType()?.getUnionTypes() ?? []
    const options = members
      .map((m) => {
        const val = m.getText().replace(/['"]/g, "")
        return val
      })
      .filter(Boolean)
    if (options.length > 0) {
      return { type: "select", options }
    }
  }

  return { type: "unknown", options: undefined }
}

/** 从 PropertySignature 提取 JSDoc 描述 */
function extractDescription(propSignature: PropertySignature): string | undefined {
  const jsdocs = propSignature.getJsDocs()
  if (jsdocs.length > 0) {
    const comment = jsdocs[0].getComment()
    if (typeof comment === "string") return comment
    if (Array.isArray(comment)) return comment.join("\n")
  }
  return undefined
}

/** 解析单个 Props 属性 */
function parseProperty(propSignature: PropertySignature): PropDef {
  const name = propSignature.getName()
  const isOptional = propSignature.hasQuestionToken()
  const propType = propSignature.getType()
  const { type, options } = inferPropType(propType, propSignature)
  const description = extractDescription(propSignature)

  const def: PropDef = {
    name,
    type,
    required: !isOptional,
    description,
  }

  if (options && options.length > 0) {
    def.options = options
  }

  // 尝试获取默认值（从属性初始值）
  const initializer = propSignature.getInitializer()
  if (initializer) {
    def.defaultValue = initializer.getText()
  }

  return def
}

/** 从 SourceFile 提取 Props 接口/类型 */
function extractPropsType(sourceFile: SourceFile): {
  props: PropDef[]
  typeName: string | null
  hasDefaultExport: boolean
} {
  // 查找默认导出
  const defaultExport = sourceFile.getDefaultExportSymbol()
  if (!defaultExport) {
    return { props: [], typeName: null, hasDefaultExport: false }
  }

  // 找到默认导出的声明
  const declarations = defaultExport.getDeclarations()
  if (declarations.length === 0) {
    return { props: [], typeName: null, hasDefaultExport: true }
  }

  const decl = declarations[0]
  let typeRef: Type | undefined

  // 模式1: export default function Comp(props: PropsType)
  if (decl.getKind() === SyntaxKind.FunctionDeclaration) {
    const funcDecl = decl.asKindOrThrow(SyntaxKind.FunctionDeclaration)
    const params = funcDecl.getParameters()
    if (params.length > 0) {
      typeRef = params[0].getType()
    }
  }
  // 模式2: export default variable (箭头函数/函数表达式)
  else if (decl.getKind() === SyntaxKind.VariableDeclaration) {
    // 可能的结构: export default React.FC<PropsType> 或 export default (props: PropsType) => ...
    // 或者 `export default const Comp = ...`
    // 如果变量有初始值（箭头函数），尝试从第一个参数获取类型
    const varDecl = decl.asKindOrThrow(SyntaxKind.VariableDeclaration)
    const initializer = varDecl.getInitializer()
    if (initializer) {
      // 箭头函数: (props: PropsType) => ...
      if (
        initializer.getKind() === SyntaxKind.ArrowFunction ||
        initializer.getKind() === SyntaxKind.FunctionExpression
      ) {
        const funcLike = initializer.asKindOrThrow(
          initializer.getKind() === SyntaxKind.ArrowFunction
            ? SyntaxKind.ArrowFunction
            : SyntaxKind.FunctionExpression,
        )
        // 由于 asKindOrThrow 的泛型限制，直接取参数
        const params = funcLike.getParameters()
        if (params.length > 0) {
          typeRef = params[0].getType()
        }
      }
    }
  }

  if (!typeRef) {
    return { props: [], typeName: null, hasDefaultExport: true }
  }

  // 获取类型名称
  const typeName = typeRef.getText()

  // 解析类型属性
  const props: PropDef[] = []
  const properties = typeRef.getProperties()

  for (const prop of properties) {
    const declarations2 = prop.getDeclarations()
    if (declarations2.length > 0) {
      const propDecl = declarations2[0]
      if (propDecl.getKind() === SyntaxKind.PropertySignature) {
        const propSig = propDecl.asKindOrThrow(SyntaxKind.PropertySignature)
        props.push(parseProperty(propSig))
      }
    }
  }

  return { props, typeName, hasDefaultExport: true }
}

/** 解析单个 .tsx 文件的 props */
export function parseComponentFile(
  filePath: string,
  project: Project,
): { props: PropDef[]; defaultProps: Record<string, unknown> } | null {
  try {
    let sourceFile: SourceFile
    try {
      sourceFile = project.addSourceFileAtPath(filePath)
    } catch {
      // 语法错误或无法解析
      return null
    }

    const { props, typeName, hasDefaultExport } = extractPropsType(sourceFile)

    if (!hasDefaultExport) {
      // 无 default export → 跳过
      return null
    }

    if (!typeName) {
      // 有 default export 但无 Props 类型 → 组件仍注册，props 为空
      return { props: [], defaultProps: {} }
    }

    // 尝试从组件代码中提取 defaultProps
    const defaultProps: Record<string, unknown> = {}
    const defaultExport = sourceFile.getDefaultExportSymbol()
    if (defaultExport) {
      const defaultExportDecl = sourceFile
        .getExportAssignments()
        .find(() => true)
      if (defaultExportDecl) {
        // 这里不做深度 defaultProps 提取，因为深度分析较复杂
        // 默认值会在 props 解析中从 initializer 获取
      }
    }

    // 为每个有默认值的 prop 设置 defaultProps
    for (const prop of props) {
      if (prop.defaultValue !== undefined) {
        defaultProps[prop.name] = prop.defaultValue
      }
    }

    return { props, defaultProps }
  } catch {
    // 任何未预料的错误，跳过该文件
    return null
  }
}

/** 创建并返回一个 ts-morph Project 实例 */
export function createTsProject(): Project {
  // ts-morph 的 compilerOptions 使用 typescript 的枚举值，不能使用字符串
  // react-jsx = JsxEmit.ReactJSX = 4
  return new Project({
    compilerOptions: {
      jsx: 4, // JsxEmit.ReactJSX
      strict: true,
      noEmit: true,
      skipLibCheck: true,
      allowJs: false,
    },
    skipAddingFilesFromTsConfig: true,
  })
}
