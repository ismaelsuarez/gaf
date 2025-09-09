import { GraphQLClient, gql } from 'graphql-request';

export class VendureClient {
  private client: GraphQLClient;

  constructor(private adminApiUrl: string, private token: string) {
    this.client = new GraphQLClient(adminApiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async findProductBySlugOrSku(identifier: string): Promise<string | null> {
    const query = gql`
      query SearchProduct($term: String!) {
        search(input: { term: $term, take: 1 }) {
          items { productId }
        }
      }
    `;
    const res = await this.client.request<any>(query, { term: identifier });
    const id = res?.search?.items?.[0]?.productId ?? null;
    return id;
  }

  async createProductWithVariant(input: {
    name: string;
    slug: string;
    description?: string;
    price: number;
    sku: string;
  }): Promise<string> {
    const mutation = gql`
      mutation CreateProduct($product: CreateProductInput!, $variant: CreateProductVariantInput!) {
        createProduct(input: $product) { id }
        createProductVariants(input: [$variant]) { id }
      }
    `;
    const variables = {
      product: {
        translations: [{ languageCode: 'es', name: input.name, slug: input.slug, description: input.description ?? '' }],
      },
      variant: {
        productId: undefined as any, // resolvemos en 2 llamadas si fuera necesario
        translations: [{ languageCode: 'es', name: input.name }],
        sku: input.sku,
        price: input.price,
      },
    };
    // Vendure requiere productId para createProductVariants; simplificamos creando producto y luego variante.
    const createProductMutation = gql`
      mutation ($input: CreateProductInput!) { createProduct(input: $input) { id } }
    `;
    const createVariantMutation = gql`
      mutation ($input: [CreateProductVariantInput!]!) { createProductVariants(input: $input) { id } }
    `;
    const p = await this.client.request<any>(createProductMutation, {
      input: variables.product,
    });
    const productId = p?.createProduct?.id as string;
    await this.client.request<any>(createVariantMutation, {
      input: [
        {
          productId,
          translations: [{ languageCode: 'es', name: input.name }],
          sku: input.sku,
          price: input.price,
        },
      ],
    });
    return productId;
  }

  async updateVariantPriceAndStock(sku: string, price: number, stockOnHand: number): Promise<void> {
    const mutation = gql`
      mutation UpdateVariant($sku: String!, $price: Money!, $stock: Int!) {
        updateProductVariants(input: [{ sku: $sku, price: $price, stockOnHand: $stock }]) { id }
      }
    `;
    await this.client.request(mutation, { sku, price, stock: stockOnHand });
  }

  async createAssetFromBase64(imageBase64: string, fileName: string): Promise<string | null> {
    // Vendure recomienda upload de archivos vía multipart; placeholder de implementación mínima.
    // Dependiendo de la versión, puede requerir otra ruta. Aquí dejamos un stub retornando null si no está implementado.
    try {
      // Implementación real pendiente según configuración de AssetServer.
      return null;
    } catch {
      return null;
    }
  }
}


