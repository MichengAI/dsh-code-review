<p align="center">
  <img src="assets/branding/dsh-code-review-banner.png" alt="DSH Code Review" width="100%">
</p>

<div align="center">

# DSH Code Review

**Inicie una revisión en su conversación: un agente independiente inspecciona el código y devuelve los hallazgos**

[简体中文](README.zh-CN.md) · [English](README.en.md) · [日本語](README.ja.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

[Registro de cambios](CHANGELOG.md) · [Apache-2.0](LICENSE)

[![Licencia: Apache-2.0](https://img.shields.io/badge/Licencia-Apache--2.0-blue.svg)](LICENSE)
[![Plugin DSH](https://img.shields.io/badge/DSH-Plugin-0f766e.svg)](https://github.com/MichengAI/dsh-code-review)
[![Compatible con DSH hasta 0.2.2-rc.1](https://img.shields.io/badge/DSH-hasta%200.2.2--rc.1-2563eb.svg)](#compatibilidad-con-el-host)
[![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A522.19.0-339933.svg?logo=node.js&logoColor=white)](https://nodejs.org/)

</div>

DSH Code Review es un plugin comunitario de revisión de código para DeepSeek Harness, con el nombre de paquete `@michengai/dsh-code-review`. Escriba `/review` en la conversación actual, seleccione un alcance o especifique sus requisitos; un subagente nativo e independiente inspeccionará automáticamente Git, código fuente, llamadas y pruebas, devolviendo el informe a la sesión principal. No es necesario instalar Codex.

## Compatibilidad con el host

Rango de compatibilidad del host: Serie completa DeepSeek Harness `0.2.x` (`>=0.2.0-rc.1 <0.3.0-0`), verificado con `0.2.0-rc.1`, `0.2.0-rc.2`, `0.2.1-rc.1`～`0.2.1-rc.5`, `0.2.2-rc.1`, y compatible automáticamente con todas las versiones RC posteriores de 0.2.x. Las versiones iniciales y las modificaciones incompatibles de la generación `0.3.0` son bloqueadas por el filtro de versiones. Se carga mediante `dsh.bundle.patch`. Requiere el proveedor nativo `spawn`, el servicio `userQuestions`, el respondedor de preguntas de su plataforma y un modelo compatible con llamadas a herramientas.

Se puede instalar desde npm o compilar a partir del código fuente. Se han verificado las pruebas sin conexión del host y del empaquetado. La calidad de revisión de los modelos reales, la adherencia al idioma y la interacción en distintas plataformas requieren validación en producción.

## Qué puede hacer

- **Seleccionar el alcance de la revisión**: Comparar con una rama base, revisar cambios no confirmados, seleccionar un commit específico o introducir instrucciones personalizadas.
- **Recopilación autónoma de pruebas por el agente**: En un contexto independiente, lee Git, código relevante y pruebas sin inyectar instantáneas completas del repositorio.
- **Consultar los resultados en la conversación principal**: Reciba hallazgos con prioridad, ruta de archivo y número de línea. Las respuestas en texto plano del modelo se conservan íntegras.
- **Informes multilingües**: Mediante un contexto lingüístico independiente, sigue las preferencias del host (compatible con los 8 idiomas oficiales) conservando las especificaciones en inglés de Codex.
- **Consultar estado o cancelar**: Recupere el último informe o cancele la selección de alcance y las revisiones en curso.

## Requisitos del entorno

- DeepSeek Harness instalado, con comando `dsh` disponible en PowerShell.
- Node.js ≥ `22.19.0`, npm y Git; Node.js debe cumplir además con los requisitos de la versión de DSH instalada.
- Los ejemplos utilizan el perfil `web`; cámbielo por el perfil en el que ejecute DSH.

## Ecosistema de productos DSH

Si desea utilizar la interfaz de escritorio, descargue [DSH Codex Desktop](https://github.com/MichengAI/dsh-codex-desktop/releases); si ya dispone de un entorno [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness), instale los plugins según el README de cada proyecto. A continuación se enumeran 11 plugins desarrollados internamente:

| Plugin | Qué puede hacer |
| --- | --- |
| [Codex UI](https://github.com/MichengAI/dsh-codex-ui) | Organizar proyectos y sesiones, buscar tareas y navegar por turnos |
| [Agency Agents](https://github.com/MichengAI/dsh-agency-agents) | Seleccionar y convocar roles especializados según la tarea |
| [Skills Manager](https://github.com/MichengAI/dsh-skills-manager) | Buscar, habilitar, crear e importar habilidades locales de forma unificada |
| [Archive Manager](https://github.com/MichengAI/dsh-archive-manager) | Buscar, restaurar o limpiar sesiones archivadas |
| [IM Connect](https://github.com/MichengAI/dsh-im-connect) | Enviar tareas y recibir respuestas desde plataformas de mensajería |
| [Automation](https://github.com/MichengAI/dsh-automation) | Ejecutar tareas programadas y consultar los resultados de cada ejecución |
| [BTW](https://github.com/MichengAI/dsh-btw) | Realizar preguntas secundarias en el contexto actual sin interrumpir la tarea principal |
| [Simplify](https://github.com/MichengAI/dsh-simplify) | Utilizar `/simplify` para limpiar y optimizar el código modificado en Git |
| [PUA](https://github.com/MichengAI/dsh-pua) | Guiar al agente a cambiar de método tras fallos y verificar antes de finalizar |
| [Code Review](https://github.com/MichengAI/dsh-code-review) | Iniciar una revisión independiente con `/review` y recibir el informe en la sesión |
| [Codex Pet](https://github.com/MichengAI/dsh-codex-pet) | Consultar avisos de sesión y responder aprobaciones de herramientas desde la mascota |

## Instalación

### Solicitar la instalación a un agente (recomendado)

Envíe la siguiente instrucción a un agente con acceso a la terminal local:

```text
Por favor, instale el plugin DSH @michengai/dsh-code-review en el perfil local web: ejecute dsh plugin --profile web add @michengai/dsh-code-review@latest --registry=https://registry.npmjs.org/, luego dsh --profile web --dump-config para confirmar que se ha cargado, y explique cómo reiniciar DSH y utilizar /review. Si algún paso falla, deténgase y explique el motivo.
```

### Instalación manual

Ejecute los siguientes comandos:

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
dsh plugin --profile web add @michengai/dsh-code-review@latest --registry=https://registry.npmjs.org/
dsh --profile web --dump-config
```

Continúe únicamente tras el éxito de cada paso. Reinicie el backend de DSH en ejecución y escriba `/review`. Es un plugin nativo: no requiere copiar manualmente `lib`, ni es un paquete de habilidades `SKILL.md`.

## Uso

| Objetivo | Comando |
| --- | --- |
| Abrir selección de alcance | `/review` |
| Especificar enfoque personalizado | `/review Revisar posibles regresiones de permisos en el último commit` |
| Ver progreso o informe más reciente | `/review-status` |
| Cancelar selección o revisión en curso | `/review-cancel` |

Al enviar el comando vacío se ofrecen cuatro opciones: comparar con rama base, revisar cambios no confirmados, revisar un commit o instrucciones personalizadas. El alcance sin confirmar incluye archivos preparados, no preparados y no rastreados. El menú de base lista ramas locales; el menú de commits muestra los 100 más recientes. También es posible introducir cualquier otra referencia libremente.

Todo el texto que sigue al comando se considera una instrucción personalizada y no se analiza como parámetros de línea de comandos. Parámetros como `--base main`, `.`, y `status` se transmiten como texto ordinario. El subagente determina y obtiene el contexto necesario; "revisar todo el proyecto" se pasará tal cual, pero no implica una verificación exhaustiva archivo por archivo.

## Configuración e informes

| Configuración opcional | Comportamiento |
| --- | --- |
| `reviewModel` | Nombre del modelo de revisión bajo el mismo proveedor; por defecto hereda la configuración del modelo actual |
| `reportDirectory` | Ruta absoluta para almacenar informes; por defecto `$DSH_HOME/code-review`, o `~/.dsh/code-review` si DSH_HOME no está definido |

El idioma sigue la preferencia del host `locale.preference`: compatible con los 8 idiomas oficiales (`zh` / `en` / `ja` / `es` / `fr` / `de` / `ru` / `pt`). Lee la entrada de configuración `locale` devuelta por `settings.describe()`. El idioma se fija al inicio de cada ronda y se leen nuevas configuraciones en la siguiente. Los textos de los menús en la interfaz entran en vigor inmediatamente al cambiar el idioma, mientras que las descripciones de comandos registradas por el servidor se fijan al cargar el plugin. Si se selecciona explícitamente un idioma no oficial no compatible, la interfaz y los informes recurren al inglés alineándose con el host; sin una preferencia guardada, el backend utiliza chino por defecto mientras que el menú de comandos refleja el idioma detectado por el frontend del host.

Se guarda atómicamente el informe más reciente de cada sesión. El informe devuelto a la sesión utiliza GitHub Flavored Markdown renderizable por DSH: encabezado de estado, títulos de hallazgos, enlaces a archivos locales con número de línea y párrafos. El texto de informes históricos no se traduce automáticamente; claves JSON, enumeraciones, código y rutas se conservan sin cambios. No se reanudan automáticamente revisiones pendientes tras cerrar el host.

## Preguntas frecuentes

### ¿Es idéntico a Codex?

Las especificaciones de revisión y las plantillas de tareas cortas se ajustan al commit de código fuente fijado `a592c38c16cdd7623dacc9168926ebccedfb67d3`. La interfaz de preguntas, herramientas, permisos y eventos utiliza capacidades nativas de DSH; no es una copia gráfica pixel a pixel de Codex Desktop. Diferentes modelos pueden producir diferentes observaciones.

### ¿La revisión modifica el código?

Las instrucciones de revisión no generan modificaciones directas, aunque la capa de herramientas no es estrictamente de solo lectura en su totalidad. Su ejecución sigue el mismo modelo de Agency: inyecta el rol revisor mediante `spawn` nativo, conservando las demás herramientas e instrucciones del host, bloqueando únicamente la revisión recursiva y las herramientas de convocatoria de expertos. Los permisos los determina el host al delegar; el plugin no reescribe políticas ni reenvía solicitudes de aprobación del subagente.

Si Git falla en la preparación del entorno seguro de Windows o las pruebas devuelven `spawn EPERM`, la sesión principal debe resolver los permisos antes de iniciar una nueva revisión. "Completado" indica que el agente ha respondido, no que se haya obtenido todo el diff o completado todas las pruebas exitosamente.

### ¿Qué hacer si no hay respuesta tras la instalación?

Asegúrese de que la instalación y la ejecución utilicen el mismo perfil, reinicie el backend de DSH y verifique que `dsh --profile web --dump-config` incluya el plugin. La revisión utiliza un modo de comando directo alineado con Codex y no expone herramientas globales al agente principal (evitando activaciones automáticas del modelo durante la codificación). `/review` sin argumentos solo requiere el servicio de preguntas del host para la selección interactiva de alcance. Utilice `/review-status` para ver el registro.

### ¿Por qué podría ver otro idioma en la interfaz?

Seleccione explícitamente el idioma de destino en la configuración del host. La salida del modelo se orienta mediante instrucciones de idioma pero no se puede garantizar de forma absoluta. Los errores directos de herramientas externas, fragmentos de código y reportes históricos no se traducen de forma retroactiva.

## Desarrollo y contribución

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
npm ci --ignore-scripts
npm run check
npm run verify:package
dsh plugin --profile web add .\michengai-dsh-code-review-0.1.3.tgz --ignore-scripts
```

`check` incluye TypeScript, hashes de prompts, tareas y pruebas de regresión con modelos desconectados en AgentLoop, así como verificación de enlaces de documentación. `verify:package` comprueba la integración en un perfil aislado. Tras modificar el código fuente, ejecute `npm run build` antes de realizar commit.

| Entrada | Responsabilidad |
| --- | --- |
| [src/index.ts](src/index.ts) | Comandos y entrega de informes |
| [src/selection.ts](src/selection.ts) | Selección nativa de alcance |
| [src/runtime.ts](src/runtime.ts) | Subagente de revisión independiente y restricciones de herramientas |
| [src/request.ts](src/request.ts) | Tareas breves de Codex y resolución de referencias base |
| [src/i18n.ts](src/i18n.ts) | Idioma del host y contexto de idioma de salida |
| [src/report.ts](src/report.ts) | Secuencia de recuperación JSON completo, JSON parcial y texto plano |

Para el registro completo de entrega, consulte la [Guía de lectura](docs/00-交接入口/00-阅读导航.md). Para revertir, reinstale el paquete local anterior y reinicie DSH. Las sesiones y los informes no se eliminan.

## Fuentes y licencia

Publicado bajo [Apache License 2.0](LICENSE). Consulte los originales de Codex en [rubric](assets/codex/review/rubric.md), [source.json](assets/codex/review/source.json) y [NOTICE](NOTICE).

Código fuente original: [Plantillas de tareas](https://github.com/openai/codex/blob/a592c38c16cdd7623dacc9168926ebccedfb67d3/codex-rs/prompts/src/review_request.rs) · [Ejecución de revisión](https://github.com/openai/codex/blob/a592c38c16cdd7623dacc9168926ebccedfb67d3/codex-rs/core/src/tasks/review.rs) · [Selección de alcance](https://github.com/openai/codex/blob/a592c38c16cdd7623dacc9168926ebccedfb67d3/codex-rs/tui/src/chatwidget/review_popups.rs) · [Resolución de rama base](https://github.com/openai/codex/blob/a592c38c16cdd7623dacc9168926ebccedfb67d3/codex-rs/git-utils/src/branch.rs).
