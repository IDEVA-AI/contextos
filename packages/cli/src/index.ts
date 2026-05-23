import { Command } from 'commander'

import { registerAuthCommands } from './commands/auth.js'
import { registerBrainsCommands } from './commands/brains.js'
import { registerContextCommands } from './commands/compile.js'
import { registerDocsCommands } from './commands/docs.js'
import { registerMemoryCommands } from './commands/memory.js'

const program = new Command()

program
  .name('contextos')
  .description('CLI para ContextOS — gerencie cérebros, memórias, documentos e compile contexto.')
  .version('0.1.0')

registerAuthCommands(program)
registerBrainsCommands(program)
registerContextCommands(program)
registerMemoryCommands(program)
registerDocsCommands(program)

program.parseAsync(process.argv).catch((err) => {
  console.error(err)
  process.exit(1)
})
