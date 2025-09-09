import 'dotenv/config';
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

  const ids = products.map(p => p.id);
  const [details, groups] = await Promise.all([
    zetti.fetchDetails(ids),
    zetti.fetchGroups(ids),
  ]);

  const detailsMap = new Map(details.map(d => [d.id, d]));

  for (const p of products) {
    try {
      const d = detailsMap.get(p.id);
      const price = Math.round((d?.pvp ?? 0) * 100);
      const stock = Math.max(0, Math.floor(d?.stock1 ?? 0));
      const sku = p.code || p.id;
      const slug = (p.name || sku).toLowerCase().replace(/[^a-z0-9]+/g, '-');

      const existing = await vendure.findProductBySlugOrSku(sku);
      if (!existing) {
        console.log(`[CREATE] ${sku} - ${p.name}`);
        const productId = await vendure.createProductWithVariant({
          name: p.name,
          slug,
          description: p.description,
          price,
          sku,
        });
        // Imagen (opcional)
        const img = await zetti.fetchImageBase64(p.id);
        if (img) {
          await vendure.createAssetFromBase64(img, `${sku}.jpg`);
        }
      } else {
        console.log(`[UPDATE] ${sku} - ${p.name}`);
        await vendure.updateVariantPriceAndStock(sku, price, stock);
      }
    } catch (err) {
      console.error(`[ERROR] Producto ${p.id} - ${(err as Error).message}`);
    }
  }

  console.log('[SYNC] Finalizado');
}


