import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let pipelineMod = null;
let projectToolSchema = null;

try {
  pipelineMod = require('@deepseek-ai/dsh-tools/pipeline');
} catch {}

try {
  const toolsMod = require('@deepseek-ai/dsh-tools');
  projectToolSchema = toolsMod.projectToolSchema;
} catch {}

export function installToolExecutor(ctx) {
  if (typeof ctx.tools?.setExecutor === "function" && pipelineMod) {
    const { ToolExecutionPipeline, executeToolBatch } = pipelineMod;
    const pipeline = new ToolExecutionPipeline(ctx);
    ctx.tools.setExecutor({
      describe: (tools) => ({ schemas: projectToolSchema ? tools.map(t => projectToolSchema(t, false)) : [] }),
      execute: async (input) => {
        const isSingleCall = !input.calls && input.name;
        const batchInput = isSingleCall
          ? { ...input, calls: [{ id: input.callId, name: input.name, arguments: JSON.stringify(input.arguments ?? {}) }] }
          : input;
        const outcome = await executeToolBatch(batchInput, pipeline, () => 10);
        return isSingleCall ? (outcome.results[0]?.result ?? outcome) : outcome;
      },
    });
  }
}
