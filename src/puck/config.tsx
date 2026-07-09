// src/puck/config.tsx
// 聚合 8 个基础组件 + 22 个二期组件 + 8 个 P0 新组件 + 自动扫描组件为 Puck Config，并导出 emptyData 空画布兜底。

import type { Config, Data } from "@measured/puck"
import "@measured/puck/puck.css"

// ─── 一期基础组件 ───
import { Heading } from "./components/basic/Heading"
import { Text } from "./components/basic/Text"
import { Image } from "./components/basic/Image"
import { Button } from "./components/basic/Button"
import { Input } from "./components/basic/Input"
import { Divider } from "./components/basic/Divider"
import { Badge } from "./components/basic/Badge"
import { Alert } from "./components/basic/Alert"

// ─── 二期布局组件 (layout/) ───
import { Container } from "./components/layout/Container"
import { Row } from "./components/layout/Row"
import { Column } from "./components/layout/Column"
import { Grid } from "./components/layout/Grid"
import { Card } from "./components/layout/Card"
import { Section } from "./components/layout/Section"
import { Tabs } from "./components/layout/Tabs"

// ─── 二期展示组件 (display/) ───
import { Accordion } from "./components/display/Accordion"
import { Carousel } from "./components/display/Carousel"
import { Table } from "./components/display/Table"
import { List } from "./components/display/List"
import { Progress } from "./components/display/Progress"
import { Video } from "./components/display/Video"

// ─── 二期表单组件 (form/) ───
import { Form } from "./components/form/Form"
import { FormInput } from "./components/form/FormInput"
import { FormSelect } from "./components/form/FormSelect"
import { FormCheckbox } from "./components/form/FormCheckbox"
import { FormSwitch } from "./components/form/FormSwitch"

// ─── 二期高级组件 (advanced/) ───
import { Modal } from "./components/advanced/Modal"
import { Drawer } from "./components/advanced/Drawer"
import { Dropdown } from "./components/advanced/Dropdown"
import { RichText } from "./components/advanced/RichText"
import { Upload } from "./components/advanced/Upload"

// ─── P0 新展示组件 (display/) ───
import { Skeleton } from "./components/display/Skeleton"
import { CodeBlock } from "./components/display/CodeBlock"
import { MarkdownPreview } from "./components/display/MarkdownPreview"
import { IframeEmbed } from "./components/display/IframeEmbed"
import { CountUp } from "./components/display/CountUp"
import { DataTable } from "./components/display/DataTable"
import { EmptyState } from "./components/display/EmptyState"
import { Stepper } from "./components/display/Stepper"

import { scannedComponents } from "../.pageforge/registry"

/** 构建最终组件列表：扫描组件 > 内置组件（同名覆盖） */
function buildComponents() {
  const builtIn: Record<string, unknown> = {
    // 一期
    Heading,
    Text,
    Image,
    Button,
    Input,
    Divider,
    Badge,
    Alert,

    // 二期 - 布局
    Container,
    Row,
    Column,
    Grid,
    Card,
    Section,
    Tabs,

    // 二期 - 展示
    Accordion,
    Carousel,
    Table,
    List,
    Progress,
    Video,

    // 二期 - 表单
    Form,
    FormInput,
    FormSelect,
    FormCheckbox,
    FormSwitch,

    // 二期 - 高级
    Modal,
    Drawer,
    Dropdown,
    RichText,
    Upload,

    // P0 新展示组件
    Skeleton,
    CodeBlock,
    MarkdownPreview,
    IframeEmbed,
    CountUp,
    DataTable,
    EmptyState,
    Stepper,
  }

  // 合并扫描组件（同名覆盖内置组件）
  return { ...builtIn, ...scannedComponents }
}

export const config: Config = {
  components: buildComponents() as Config["components"],
}

// 空画布的初始数据
export const emptyData: Data = { root: { props: {} }, content: [] }
