import axios, { AxiosInstance } from 'axios';

type OAuthTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

export interface ZettiProduct {
  id: string;
  code?: string;
  name: string;
  description?: string;
}

export interface ZettiProductDetails {
  id: string;
  stock1?: number;
  pvp?: number;
}

export class ZettiApiClient {
  private http: AxiosInstance;
  private oauthHttp: AxiosInstance;
  private token: string | null = null;
  private tokenExpiresAt = 0;

  constructor(private baseUrl: string, private oauthUrl: string, private username: string, private password: string, private nodoId: string) {
    this.http = axios.create({ baseURL: baseUrl, timeout: 30000 });
    this.oauthHttp = axios.create({ baseURL: oauthUrl, timeout: 15000 });
  }

  private async ensureToken(): Promise<string> {
    const now = Date.now();
    if (this.token && now < this.tokenExpiresAt - 30_000) {
      return this.token;
    }
    const form = new URLSearchParams();
    form.set('grant_type', 'password');
    form.set('username', this.username);
    form.set('password', this.password);

    const { data } = await this.oauthHttp.post<OAuthTokenResponse>('/oauth/token', form.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    this.token = data.access_token;
    this.tokenExpiresAt = Date.now() + data.expires_in * 1000;
    return this.token;
  }

  private async authHeaders() {
    const token = await this.ensureToken();
    return { Authorization: `Bearer ${token}` };
  }

  async searchProductsEcommerceGroup(): Promise<ZettiProduct[]> {
    const headers = await this.authHeaders();
    const url = `/${this.nodoId}/products/search`;
    const payload = { groupId: 2 };
    const { data } = await this.http.post(url, payload, { headers });
    return data?.products ?? data ?? [];
  }

  async fetchDetails(ids: string[]): Promise<ZettiProductDetails[]> {
    const headers = await this.authHeaders();
    const url = `/${this.nodoId}/products/details-per-nodes`;
    const payload = { ids };
    const { data } = await this.http.post(url, payload, { headers });
    return data?.details ?? data ?? [];
  }

  async fetchGroups(ids: string[]): Promise<any[]> {
    const headers = await this.authHeaders();
    const url = `/${this.nodoId}/products/groups-search`;
    const payload = { ids };
    const { data } = await this.http.post(url, payload, { headers });
    return data?.groups ?? data ?? [];
  }

  async fetchImageBase64(productId: string): Promise<string | null> {
    const headers = await this.authHeaders();
    const url = `/${this.nodoId}/products/${productId}/image`;
    const { data } = await this.http.get(url, { headers });
    const base64 = typeof data === 'string' ? data : data?.image;
    return base64 || null;
  }
}


