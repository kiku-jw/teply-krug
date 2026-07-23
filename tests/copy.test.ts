import { describe, expect, it } from "vitest";

import interfaceSource from "../src/main.ts?raw";

describe("visible interface copy", () => {
  it("stays free of the known generated and gendered phrases", () => {
    expect(interfaceSource).not.toMatch(/[—–]/u);
    expect(interfaceSource).not.toMatch(/каждый[^.]{0,80}\bему\b/iu);
    expect(interfaceSource).not.toContain("Слушаем без спешки");
    expect(interfaceSource).not.toContain("Тёплый круг");
    expect(interfaceSource).not.toContain("для ${playerName}");
    expect(interfaceSource).not.toContain("с ${escapeHtml(partner.name)}");
  });
});
