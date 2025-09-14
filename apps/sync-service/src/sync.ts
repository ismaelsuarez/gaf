import 'dotenv/config';
import pLimit from 'p-limit';
import { ZettiApiClient } from './apiClient';
import { VendureClient } from './vendureClient';

export async function runSync(): Promise<void> {
  const {
    API_URL,
    OAUTH_URL,
    API_USER,
    API_PASSWORD,
    NODO_ID,
    VENDURE_API_URL,
    VENDURE_TOKEN,
  } = process.env as Record<string, string>;

  if (!API_URL || !OAUTH_URL || !API_USER || !API_PASSWORD || !NODO_ID) {
    throw new Error('Faltan variables de Zetti: API_URL, OAUTH_URL, API_USER, API_PASSWORD, NODO_ID');
  }
  if (!VENDURE_API_URL || !VENDURE_TOKEN) {
    throw new Error('Faltan variables de Vendure: VENDURE_API_URL, VENDURE_TOKEN');
  }

  const zetti = new ZettiApiClient(API_URL, OAUTH_URL, API_USER, API_PASSWORD, NODO_ID);
  const vendure = new VendureClient(VENDURE_API_URL, VENDURE_TOKEN);

  console.log('[SYNC] Autenticando con Zetti y obteniendo productos...');
  const products = await zetti.searchProductsEcommerceGroup();
  console.log(`[SYNC] Productos E-Commerce recuperados: ${products.length}`);

  // Procesamiento por lotes para reducir carga y memoria
  const batchSize = Number(process.env.SYNC_BATCH_SIZE ?? 50);
  const concurrency = Number(process.env.SYNC_CONCURRENCY ?? 5);
  const limit = pLimit(concurrency);
  let createdCount = 0;
  let updatedCount = 0;
  let errorCount = 0;
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    console.log(`[SYNC] Procesando lote ${i + 1}-${i + batch.length} de ${products.length}`);
    const ids = batch.map(p => p.id);
    const [details, _groups] = await Promise.all([
      zetti.fetchDetails(ids),
      zetti.fetchGroups(ids),
    ]);

    const detailsMap = new Map(details.map(d => [d.id, d]));

    await Promise.all(batch.map((p) => limit(async () => {
      try {
        const d = detailsMap.get(p.id);
        const price = Math.round((d?.pvp ?? 0) * 100);
        const stock = Math.max(0, Math.floor(d?.stock1 ?? 0));
        const sku = p.code || p.id;
        const slug = (p.name || sku).toLowerCase().replace(/[^a-z0-9]+/g, '-');

        const existing = await vendure.searchProductsBySku(sku);
        if (!existing) {
          console.log(`[CREATE] ${sku} - ${p.name}`);
          let assetIds: string[] | undefined;
          const img = await zetti.fetchImageBase64(p.id);
          if (img) {
            try {
              const ids = await vendure.createAssets(img, `${sku}.jpg`);
              if (ids.length > 0) assetIds = ids;
            } catch (e) {
              console.warn(`[WARN] No se pudo subir asset para ${sku}: ${(e as Error).message}`);
            }
          }
          await vendure.createProduct({
            name: p.name,
            slug,
            description: p.description,
            assetIds,
            variants: [ { sku, price, stockOnHand: stock } ],
          });
          createdCount++;
        } else {
          console.log(`[UPDATE] ${sku} - ${p.name}`);
          await vendure.updateProductVariant({ sku, price, stockOnHand: stock });
          updatedCount++;
        }
      } catch (err) {
        errorCount++;
        console.error(`[ERROR] Producto ${p.id} - ${(err as Error).message}`);
      }
    })));
  }

  console.log(`[SYNC] Finalizado - created=${createdCount} updated=${updatedCount} errors=${errorCount}`);
}



