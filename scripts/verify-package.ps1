[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = 'Stop'

# 在项目内一次性 DSH_HOME 中验证原生 bundle 发现和打包后的真实宿主测试。
$reviewRoot = Split-Path $PSScriptRoot -Parent
$reviewWork = Join-Path $reviewRoot ('.validation-' + [Guid]::NewGuid().ToString('N'))
if (Test-Path -LiteralPath $reviewWork) { throw '验证目录已存在。' }
$reviewPreviousHome = $env:DSH_HOME
try {
    New-Item -ItemType Directory -Path $reviewWork | Out-Null
    Push-Location $reviewRoot
    try {
        npm pack --pack-destination $reviewWork
        if ($LASTEXITCODE -ne 0) { throw 'npm pack 失败。' }
        $reviewPackages = @(Get-ChildItem -LiteralPath $reviewWork -Filter '*.tgz')
        if ($reviewPackages.Count -ne 1) { throw '验证目录必须只有一个安装包。' }
        $reviewPackage = $reviewPackages[0]
        $reviewDeps = @(node scripts/package-deps.mjs)
        if ($LASTEXITCODE -ne 0) { throw '官方依赖闭包检查失败。' }
        $env:DSH_HOME = Join-Path $reviewWork 'dsh-home'
        dsh plugin --profile review-package add $reviewPackage.FullName @reviewDeps --ignore-scripts --registry=https://registry.npmjs.org
        if ($LASTEXITCODE -ne 0) { throw '隔离 profile 安装失败。' }
        dsh plugin --profile review-package peers check
        if ($LASTEXITCODE -ne 0) { throw '隔离 profile peer 依赖检查失败。' }
        $reviewConfig = dsh --profile review-package --dump-config
        if ($LASTEXITCODE -ne 0 -or !($reviewConfig -match '@michengai/dsh-code-review')) { throw '原生 bundle 未进入 DSH 配置。' }
        $reviewProfile = Join-Path $env:DSH_HOME 'profiles\review-package'
        $reviewTest = Get-Content -LiteralPath (Join-Path $reviewRoot 'tests\host.test.mjs') -Raw -Encoding UTF8
        $reviewTest = $reviewTest.Replace("import * as plugin from '../lib/index.js';", "import * as plugin from '@michengai/dsh-code-review';")
        $reviewTest = $reviewTest.Replace("new URL('../assets/codex/review/rubric.md', import.meta.url)", "join(dirname(createRequire(import.meta.url).resolve('@michengai/dsh-code-review')), '..', 'assets', 'codex', 'review', 'rubric.md')")
        $reviewTest = $reviewTest.Replace("import { runReview } from '../lib/runtime.js';", "import { createRequire } from 'node:module';`nimport { pathToFileURL } from 'node:url';`nimport { dirname } from 'node:path';`nconst { runReview } = await import(pathToFileURL(join(dirname(createRequire(import.meta.url).resolve('@michengai/dsh-code-review')), 'runtime.js')).href);")
        Set-Content -LiteralPath (Join-Path $reviewProfile 'host.test.mjs') -Value $reviewTest -Encoding UTF8
        node --test (Join-Path $reviewProfile 'host.test.mjs')
        if ($LASTEXITCODE -ne 0) { throw '已安装包的宿主测试失败。' }
        Copy-Item -LiteralPath $reviewPackage.FullName -Destination $reviewRoot
        $reviewHash = [Security.Cryptography.SHA256]::Create()
        try { Write-Output ('SHA256: ' + [BitConverter]::ToString($reviewHash.ComputeHash([IO.File]::ReadAllBytes((Join-Path $reviewRoot $reviewPackage.Name)))).Replace('-', '')) }
        finally { $reviewHash.Dispose() }
        Write-Output '可安装包验证通过：隔离 DSH profile、bundle 发现、打包后宿主测试。'
    } finally { Pop-Location }
} finally {
    $env:DSH_HOME = $reviewPreviousHome
    if ((Test-Path -LiteralPath $reviewWork) -and [IO.Path]::GetFullPath($reviewWork).StartsWith($reviewRoot + '\.validation-', [StringComparison]::OrdinalIgnoreCase)) {
        Remove-Item -LiteralPath $reviewWork -Recurse -Force
    }
}
