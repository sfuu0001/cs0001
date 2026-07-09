#!/usr/bin/env node

import { init } from "../src/commands/init.js"
import { dev } from "../src/commands/dev.js"

const command = process.argv[2]

if (!command || command === "--help" || command === "-h") {
  console.log(`
Usage: pageforge [command]

Commands:
  init    Initialize PageForge in the current project
  dev     Start the PageForge development server

Options:
  --help   Show this message
`)
  process.exit(0)
}

switch (command) {
  case "init":
    await init()
    break
  case "dev":
    await dev()
    break
  default:
    console.error(`Unknown command: ${command}`)
    console.log('Run "pageforge --help" for usage information.')
    process.exit(1)
}
