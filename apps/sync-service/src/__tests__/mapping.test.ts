import { describe, it, expect } from '@jest/globals';

describe('price/stock mapping', () => {
  it('maps pvp to minor units and floors stock', () => {
    const pvp = 123.456;
    const stock1 = 10.9;
    const price = Math.round((pvp ?? 0) * 100);
    const stock = Math.max(0, Math.floor(stock1 ?? 0));
    expect(price).toBe(12346);
    expect(stock).toBe(10);
  });
});


