import { GraphQLClient, gql } from 'graphql-request';

type SearchResult = {
  id: string;
  variants: Array<{ id: string; sku: string; stockOnHand: number; price: number }>;
};

export class VendureClient {
  private client: GraphQLClient;

  constructor(private adminApiUrl: string, private token: string) {
    this.client = new GraphQLClient(adminApiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // 1) Buscar por SKU y devolver { product id, variants[] }
  async searchProductsBySku(sku: string): Promise<SearchResult | null> {
    try {
      // Primero localizamos la variante por SKU para obtener el productId
      const q1 = gql`
        query ($sku: String!) {
          productVariants(options: { filter: { sku: { eq: $sku } }, take: 1 }) {
            items { id sku stockOnHand price product { id } }
          }
        }
      `;
      const r1 = await this.client.request<any>(q1, { sku });
      const hit = r1?.productVariants?.items?.[0];
      if (!hit?.product?.id) return null;

      // Luego obtenemos todas las variantes del producto
      const q2 = gql`
        query ($id: ID!) {
          product(id: $id) {
            id
            variants { id sku stockOnHand price }
          }
        }
      `;
      const r2 = await this.client.request<any>(q2, { id: hit.product.id });
      const product = r2?.product;
      if (!product) return null;
      const result: SearchResult = {
        id: product.id,
        variants: product.variants ?? [],
      };
      console.log(`[Vendure] searchProductsBySku sku=${sku} -> product=${result.id}, variants=${result.variants.length}`);
      return result;
    } catch (err) {
      console.error('[Vendure] searchProductsBySku error', (err as Error).message);
      return null;
    }
  }

  // 2) Crear producto con variantes
  async createProduct(input: {
    name: string;
    slug: string;
    description?: string;
    assetIds?: string[];
    facetValueIds?: string[];
    variants: Array<{ sku: string; price: number; stockOnHand?: number }>;
  }): Promise<string> {
    const createProductMutation = gql`
      mutation ($input: CreateProductInput!) { createProduct(input: $input) { id } }
    `;
    const createVariantsMutation = gql`
      mutation ($input: [CreateProductVariantInput!]!) { createProductVariants(input: $input) { id } }
    `;

    try {
      const p = await this.client.request<any>(createProductMutation, {
        input: {
          translations: [
            { languageCode: 'es', name: input.name, slug: input.slug, description: input.description ?? '' },
          ],
          assetIds: input.assetIds,
          facetValueIds: input.facetValueIds,
        },
      });
      const productId = p?.createProduct?.id as string;

      const variantsPayload = input.variants.map(v => ({
        productId,
        translations: [{ languageCode: 'es', name: input.name }],
        sku: v.sku,
        price: v.price, // minor units
        stockOnHand: v.stockOnHand ?? 0,
      }));
      const vr = await this.client.request<any>(createVariantsMutation, { input: variantsPayload });
      const count = vr?.createProductVariants?.length ?? variantsPayload.length;
      console.log(`[Vendure] createProduct id=${productId} variants=${count}`);
      return productId;
    } catch (err) {
      console.error('[Vendure] createProduct error', (err as Error).message);
      throw err;
    }
  }

  // 3) Actualizar una variante
  async updateProductVariant(input: { id?: string; sku?: string; price?: number; stockOnHand?: number }): Promise<void> {
    const mutation = gql`
      mutation ($input: [UpdateProductVariantInput!]!) {
        updateProductVariants(input: $input) { id }
      }
    `;
    try {
      let id = input.id;
      if (!id && input.sku) {
        const q = gql`
          query ($sku: String!) {
            productVariants(options: { filter: { sku: { eq: $sku } }, take: 1 }) { items { id } }
          }
        `;
        const r = await this.client.request<any>(q, { sku: input.sku });
        id = r?.productVariants?.items?.[0]?.id;
        if (!id) throw new Error(`No se encontró variante con sku=${input.sku}`);
      }
      if (!id) throw new Error('Se requiere id o sku');

      const payload = [{ id, price: input.price, stockOnHand: input.stockOnHand }];
      await this.client.request(mutation, { input: payload });
      console.log(`[Vendure] updateProductVariant ok (${id})`);
    } catch (err) {
      console.error('[Vendure] updateProductVariant error', (err as Error).message);
      throw err;
    }
  }

  // 4) Subir assets desde Buffer/base64
  async createAssets(file: Buffer | string, _fileName = 'upload.jpg', mimeType = 'image/jpeg'): Promise<string[]> {
    try {
      const buffer = typeof file === 'string' ? Buffer.from(file.replace(/^data:\\w+\/[^;]+;base64,/, ''), 'base64') : file;
      const blob = new Blob([Uint8Array.from(buffer as Buffer)], { type: mimeType });

      const mutation = gql`
        mutation ($input: [CreateAssetInput!]!) {
          createAssets(input: $input) { ... on Asset { id source preview } ... on ErrorResult { message } }
        }
      `;
      const variables = { input: [{ file: blob, type: 'IMAGE' }] } as any;
      // Nota: graphql-request envía multipart automáticamente si detecta Blobs en variables
      const res = await this.client.request<any>(mutation, variables);
      const items = res?.createAssets ?? [];
      const ids = items.filter((x: any) => x?.id).map((x: any) => x.id);
      const errors = items.filter((x: any) => x?.message).map((x: any) => x.message);
      if (errors.length) {
        console.warn('[Vendure] createAssets errores:', errors.join('; '));
      }
      console.log(`[Vendure] createAssets ok: ${ids.length}`);
      return ids;
    } catch (err) {
      console.error('[Vendure] createAssets error', (err as Error).message);
      throw err;
    }
  }
}



