import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const evidenceRoot = path.join(process.cwd(), "storage", "evidence");

export const evidenceStorage = {
  async write(storageKey: string, data: Uint8Array) {
    const absolutePath = path.join(evidenceRoot, storageKey.replace(/^evidence\//, ""));
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, data);
    return absolutePath;
  },
  read(storageKey: string) {
    return readFile(path.join(evidenceRoot, storageKey.replace(/^evidence\//, "")));
  },
};