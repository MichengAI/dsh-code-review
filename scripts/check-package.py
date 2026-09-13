"""使用标准 tarfile 读取 UTF-8 包路径，逐字节核对最终 tgz 交付文件。"""

import hashlib
import sys
import tarfile
from pathlib import Path, PurePosixPath

sys.stdout.reconfigure(encoding="utf-8")
root = Path(__file__).resolve().parent.parent
archive = root / "michengai-dsh-code-review-0.1.0.tgz"
required = {"package/package.json", "package/lib/index.js", "package/lib/journal.js", "package/lib/request.js", "package/lib/selection.js",
            "package/assets/codex/review/rubric.md", "package/assets/codex/review/source.json",
            "package/cordis.patch.yml", "package/LICENSE", "package/NOTICE"}
with tarfile.open(archive, "r:gz", encoding="utf-8") as package:
    members = package.getmembers()
    names = {entry.name for entry in members}
    if "package/lib/snapshot.js" in names or "package/lib/snapshot.d.ts" in names:
        raise ValueError("安装包残留旧快照实现")
    if not required.issubset(names):
        raise ValueError(f"安装包缺失：{required - names}")
    for entry in members:
        parts = PurePosixPath(entry.name).parts
        if not entry.isfile() or parts[0] != "package" or any(
            part in {"..", "node_modules", "tests", "src", ".git", ".env"} for part in parts
        ):
            raise ValueError(f"安装包出现非交付路径：{entry.name}")
        stream = package.extractfile(entry)
        if stream is None or stream.read() != root.joinpath(*parts[1:]).read_bytes():
            raise ValueError(f"包内容与工作树不同：{entry.name}")
print(f"最终安装包校验通过：{len(members)} 个文件逐字节一致。")
print("SHA256: " + hashlib.sha256(archive.read_bytes()).hexdigest().upper())
