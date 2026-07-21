import { describe, expect, it } from "vitest";

import { clearStoredData, createDefaultStoredData, loadStoredData, saveStoredData } from "../src/storage";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe("local persistence", () => {
  it("round-trips valid data", () => {
    const storage = new MemoryStorage();
    const data = createDefaultStoredData();
    data.preferences.savedNames = ["Аня", "Борис", "Вера", "Глеб", "Даша", "Егор"];
    data.preferences.seenCardIds = ["spark-personal-1"];
    saveStoredData(data, storage);
    expect(loadStoredData(storage)).toEqual(data);
  });

  it("fails closed on malformed data", () => {
    const storage = new MemoryStorage();
    storage.setItem("teply-krug:v1", JSON.stringify({ version: 1, preferences: { timerSeconds: "fast" } }));
    expect(loadStoredData(storage)).toEqual(createDefaultStoredData());
  });

  it("clears all locally stored state", () => {
    const storage = new MemoryStorage();
    saveStoredData(createDefaultStoredData(), storage);
    expect(storage.length).toBe(1);
    expect(clearStoredData(storage)).toEqual(createDefaultStoredData());
    expect(storage.length).toBe(0);
  });
});
