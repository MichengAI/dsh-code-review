<p align="center">
  <img src="assets/branding/dsh-code-review-banner.png" alt="DSH Code Review" width="100%">
</p>

<div align="center">

# DSH Code Review

**Inicie uma revisão na sua conversa: um agente independente inspeciona o código e traz os apontamentos**

[简体中文](README.zh-CN.md) · [English](README.en.md) · [日本語](README.ja.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

[Documentação para desenvolvedores](docs/00-交接入口/00-阅读导航.md) · [Histórico de alterações](CHANGELOG.md) · [Apache-2.0](LICENSE)

[![Licença: Apache-2.0](https://img.shields.io/badge/Licen%C3%A7a-Apache--2.0-blue.svg)](LICENSE)
[![Plugin DSH](https://img.shields.io/badge/DSH-Plugin-0f766e.svg)](https://github.com/MichengAI/dsh-code-review)
[![Compatível com DSH até 0.2.2-rc.1](https://img.shields.io/badge/DSH-at%C3%A9%200.2.2--rc.1-2563eb.svg)](#compatibilidade-com-o-host)
[![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A522.19.0-339933.svg?logo=node.js&logoColor=white)](https://nodejs.org/)

</div>

DSH Code Review é um plugin comunitário de revisão de código para DeepSeek Harness (nome do pacote `@michengai/dsh-code-review`). Digite `/review` na conversa atual, escolha o escopo ou especifique suas instruções; um subagente nativo e independente inspeciona o Git, código-fonte, chamadores e testes de forma autônoma, devolvendo o relatório à sessão principal. Não é necessário instalar o Codex.

## Compatibilidade com o host

Linha de suporte do host: série completa DeepSeek Harness `0.2.x` (`>=0.2.0-rc.1 <0.3.0-0`), verificada com `0.2.0-rc.1`, `0.2.0-rc.2`, `0.2.1-rc.1`～`0.2.1-rc.5`, `0.2.2-rc.1`, e compatível automaticamente com todas as versões RC posteriores de 0.2.x. Versões anteriores e quebras na geração `0.3.0` são bloqueadas pelo controle de versões. Carregado via `dsh.bundle.patch`. Requer o provedor nativo `spawn`, o serviço `userQuestions`, o respondedor de perguntas da plataforma e um modelo compatível com chamadas de ferramentas.

Disponível para instalação via npm ou compilação a partir do código-fonte.

## O que você pode fazer

- **Selecionar o escopo da revisão**: comparar com uma branch base, verificar alterações não confirmadas, selecionar um commit ou inserir instruções personalizadas.
- **Coleta autônoma de evidências pelo agente**: lê Git, código relevante e testes em um contexto isolado sem pré-carregar um snapshot completo do repositório.
- **Visualizar resultados na conversa principal**: receba apontamentos com prioridade, caminho do arquivo e número de linhas. Respostas em texto simples são preservadas.
- **Relatórios multilíngues**: segue as preferências de idioma do host (suporte para todos os 8 idiomas oficiais) por meio de um contexto dedicado, preservando as especificações em inglês do Codex.
- **Verificar status ou cancelar**: recupere o relatório mais recente ou cancele seleções e revisões ativas.

## Requisitos de ambiente

- DeepSeek Harness instalado com comando `dsh` disponível no PowerShell.
- Node.js ≥ `22.19.0`, npm e Git; Node.js deve atender aos requisitos da versão de DSH instalada.
- Os exemplos utilizam o perfil `web`; substitua pelo perfil em que você executa o DSH.

## Ecossistema de produtos DSH

Para utilizar a interface de desktop, baixe [DSH Codex Desktop](https://github.com/MichengAI/dsh-codex-desktop/releases); em ambientes [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) existentes, instale plugins conforme o README de cada projeto:

| Plugin | O que você pode fazer |
| --- | --- |
| [Codex UI](https://github.com/MichengAI/dsh-codex-ui) | Organizar projetos e sessões, pesquisar tarefas e navegar por turnos |
| [Agency Agents](https://github.com/MichengAI/dsh-agency-agents) | Escolher e convocar especialistas dedicados de acordo com a tarefa |
| [Skills Manager](https://github.com/MichengAI/dsh-skills-manager) | Pesquisar, ativar, criar e importar habilidades locais de forma centralizada |
| [Archive Manager](https://github.com/MichengAI/dsh-archive-manager) | Pesquisar, restaurar ou limpar conversas arquivadas |
| [IM Connect](https://github.com/MichengAI/dsh-im-connect) | Enviar tarefas e receber respostas por plataformas de mensagens |
| [Automation](https://github.com/MichengAI/dsh-automation) | Executar tarefas agendadas e acompanhar o resultado de cada execução |
| [BTW](https://github.com/MichengAI/dsh-btw) | Fazer perguntas paralelas no contexto sem interromper a tarefa principal |
| [Simplify](https://github.com/MichengAI/dsh-simplify) | Utilizar `/simplify` para limpar o código no escopo de alterações Git |
| [PUA](https://github.com/MichengAI/dsh-pua) | Orientar o agente a tentar novas abordagens após falhas e validar antes de finalizar |
| [Code Review](https://github.com/MichengAI/dsh-code-review) | Iniciar revisão autônoma com `/review` e receber o relatório |
| [Codex Pet](https://github.com/MichengAI/dsh-codex-pet) | Notificações e aprovação de ferramentas por meio do pet de desktop |

## Instalação

### Instalação via agente (recomendado)

Envie a seguinte instrução para um agente com acesso ao terminal local:

```text
Instale o plugin DSH @michengai/dsh-code-review no perfil web local: execute dsh plugin --profile web add @michengai/dsh-code-review@latest --registry=https://registry.npmjs.org/, depois dsh --profile web --dump-config para confirmar o carregamento, e explique como reiniciar o DSH e usar /review. Se alguma etapa falhar, pare e informe a causa.
```

### Instalação manual

Execute os comandos:

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
dsh plugin --profile web add @michengai/dsh-code-review@latest --registry=https://registry.npmjs.org/
dsh --profile web --dump-config
```

Reinicie o backend DSH em execução e digite `/review`.

## Uso

| Objetivo | Comando |
| --- | --- |
| Abrir seleção de escopo | `/review` |
| Especificar foco personalizado | `/review Verificar regressões de permissões no último commit` |
| Ver progresso ou último relatório | `/review-status` |
| Cancelar seleção ou revisão ativa | `/review-cancel` |

O envio vazio disponibiliza quatro opções: comparar com branch base, verificar alterações não confirmadas, verificar um commit ou instruções personalizadas. Todo o texto após o comando é interpretado como instrução livre.

## Configuração e relatórios

| Configuração | Comportamento |
| --- | --- |
| `reviewModel` | Modelo de revisão no mesmo provedor; herda a configuração atual caso omitido |
| `reportDirectory` | Diretório absoluto de salvamento; padrão `$DSH_HOME/code-review` ou `~/.dsh/code-review` |

O idioma segue `locale.preference` do host: compatível com todos os 8 idiomas oficiais (`zh` / `en` / `ja` / `es` / `fr` / `de` / `ru` / `pt`).

O relatório mais recente de cada sessão é gravado atomicamente em GitHub Flavored Markdown.

## Desenvolvimento

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
npm ci --ignore-scripts
npm run check
npm run verify:package
dsh plugin --profile web add .\michengai-dsh-code-review-0.1.3.tgz --ignore-scripts
```

## Fontes e licença

Publicado sob [Licença Apache 2.0](LICENSE). Consulte o original do Codex em [rubric](assets/codex/review/rubric.md), [source.json](assets/codex/review/source.json) e [NOTICE](NOTICE).

Fontes upstream: [Modelos de tarefas](https://github.com/openai/codex/blob/a592c38c16cdd7623dacc9168926ebccedfb67d3/codex-rs/prompts/src/review_request.rs) · [Execução de revisão](https://github.com/openai/codex/blob/a592c38c16cdd7623dacc9168926ebccedfb67d3/codex-rs/core/src/tasks/review.rs) · [Seleção de escopo](https://github.com/openai/codex/blob/a592c38c16cdd7623dacc9168926ebccedfb67d3/codex-rs/tui/src/chatwidget/review_popups.rs) · [Resolução de branch base](https://github.com/openai/codex/blob/a592c38c16cdd7623dacc9168926ebccedfb67d3/codex-rs/git-utils/src/branch.rs).
