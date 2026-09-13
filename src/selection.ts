import type { Context } from '@deepseek-ai/cordis';
import type { Agent } from '@deepseek-ai/dsh-agent';
import type { AskUserQuestionItem } from '@deepseek-ai/dsh-user-questions';
import { git, parseTarget, type Target } from './request.js';

/** 复用宿主的问题服务；选择过程属于主 Agent，审查子 Agent 不向用户提问。 */
export async function selectTarget(ctx: Context, agent: Agent, input: string, signal: AbortSignal): Promise<Target> {
  if (input.trim()) return parseTarget(input);
  const ask = async (question: AskUserQuestionItem) => {
    signal.throwIfAborted();
    const result = await ctx.userQuestions.ask({ agent, signal, questions: [question] });
    signal.throwIfAborted();
    const answer = result.answers.find(item => item.id === question.id);
    if (!answer || answer.selected.length > 1) throw new Error('未选择有效审查范围。');
    const value = answer.custom?.trim() || answer.selected[0];
    if (!value) throw new Error('审查选择已取消或未填写。');
    return value;
  };
  const choice = await ask({ id: 'review-scope', header: '代码审查', question: '选择审查范围', options: [
    { label: '对比基准分支', description: '从共同祖先审查当前分支的更改' },
    { label: '审查未提交的更改', description: '审查暂存、未暂存及未跟踪的净更改' },
    { label: '审查某次提交', description: '选择一个 Git 提交' },
    { label: '自定义审查要求', description: '输入本次需要检查的内容' },
  ] });
  if (choice === '审查未提交的更改') return { mode: 'worktree' };
  if (choice === '自定义审查要求') return parseTarget(await ask({ id: 'review-instructions', question: '请输入自定义审查要求' }));
  if (!['对比基准分支', '审查某次提交'].includes(choice)) return parseTarget(choice);
  const cwd = agent.session.header.cwd;
  if (!cwd) throw new Error('当前会话没有工作目录。');
  if (choice === '对比基准分支') {
    const branches = (await git(cwd, ['for-each-ref', '--format=%(refname:short)', 'refs/heads'], signal)).toString('utf8').trim().split('\n').filter(Boolean);
    const ref = await ask({ id: 'review-base', question: '选择基准分支，也可输入其他分支或引用', options: branches.map(label => ({ label })) });
    return { mode: 'base', ref };
  }
  const commits = (await git(cwd, ['log', '-n', '100', '--format=%H%x09%s'], signal)).toString('utf8').trim().split('\n').filter(Boolean);
  const options = commits.map(line => { const [sha, ...subject] = line.split('\t'); return { label: `${sha!.slice(0, 10)} ${subject.join('\t')}`, sha: sha! }; });
  const selected = await ask({ id: 'review-commit', question: '选择提交，也可输入其他提交 SHA 或引用', options: options.map(({ label }) => ({ label })) });
  const commit = options.find(item => item.label === selected);
  return { mode: 'commit', ref: commit?.sha ?? selected, ...(commit ? { title: commit.label.slice(11) } : {}) };
}
