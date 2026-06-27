// OpenRouter veri kümesini manuel olarak tazeler.
//   pnpm refresh
// API'den katalog/fiyat alanlarını çeker, benchmark alanlarını mevcut kümeden
// korur ve client/public/models_dataset.json dosyasını yeniden yazar.

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { buildDataset, fetchOpenRouterModels } from "../shared/openrouter";
import type { Dataset } from "../shared/types";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATASET_PATH = path.resolve(
  __dirname,
  "..",
  "client",
  "public",
  "models_dataset.json"
);

function fmtList(ids: string[], n = 12): string {
  if (ids.length === 0) return "—";
  const head = ids.slice(0, n).join(", ");
  return ids.length > n ? `${head} … (+${ids.length - n})` : head;
}

async function main() {
  console.log("→ OpenRouter API'den modeller çekiliyor…");
  const api = await fetchOpenRouterModels();
  console.log(`  ${api.data.length} model alındı.`);

  const prev = JSON.parse(await readFile(DATASET_PATH, "utf8")) as Dataset;
  const { dataset, added, removed, total } = buildDataset(
    api,
    prev,
    new Date().toISOString()
  );

  // Mevcut dosyanın biçimini (1 boşluk girinti) koruyarak diff'i küçük tut.
  await writeFile(
    DATASET_PATH,
    JSON.stringify(dataset, null, 1) + "\n",
    "utf8"
  );

  const benched = dataset.models.filter(m => m.has_benchmark).length;
  console.log(`\n✓ Yazıldı: ${path.relative(process.cwd(), DATASET_PATH)}`);
  console.log(`  Toplam model : ${total} (önceki ${prev.models.length})`);
  console.log(`  Yeni         : ${added.length} → ${fmtList(added)}`);
  console.log(`  Çıkarılan    : ${removed.length} → ${fmtList(removed)}`);
  console.log(`  Benchmark'lı : ${benched}/${total}`);
  console.log(
    "\nNot: Benchmark/hız alanları mevcut kümeden korunur; yeni modeller benchmark'sız eklenir."
  );
}

main().catch(e => {
  console.error("✗ Tazeleme başarısız:", e instanceof Error ? e.message : e);
  process.exit(1);
});
