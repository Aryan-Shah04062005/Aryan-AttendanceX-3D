import fs from 'fs';
import path from 'path';
import { DATA_DIR } from '../config/db.js';

export class JsonDb {
  private static getFilePath(collection: string): string {
    return path.join(DATA_DIR, `${collection.toLowerCase()}.json`);
  }

  static read<T>(collection: string): T[] {
    const filePath = this.getFilePath(collection);
    try {
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify([], null, 2));
        return [];
      }
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data) as T[];
    } catch (error) {
      console.error(`Error reading collection ${collection}:`, error);
      return [];
    }
  }

  static write<T>(collection: string, data: T[]): void {
    const filePath = this.getFilePath(collection);
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      console.error(`Error writing collection ${collection}:`, error);
    }
  }

  static find<T>(collection: string, predicate: (item: T) => boolean = () => true): T[] {
    const items = this.read<T>(collection);
    return items.filter(predicate);
  }

  static findOne<T>(collection: string, predicate: (item: T) => boolean): T | null {
    const items = this.read<T>(collection);
    const item = items.find(predicate);
    return item || null;
  }

  static insert<T>(collection: string, record: T): T {
    const items = this.read<T>(collection);
    items.push(record);
    this.write(collection, items);
    return record;
  }

  static update<T>(collection: string, predicate: (item: T) => boolean, updates: Partial<T>): number {
    const items = this.read<T>(collection);
    let updatedCount = 0;
    const newItems = items.map((item) => {
      if (predicate(item)) {
        updatedCount++;
        return { ...item, ...updates };
      }
      return item;
    });
    this.write(collection, newItems);
    return updatedCount;
  }

  static delete<T>(collection: string, predicate: (item: T) => boolean): number {
    const items = this.read<T>(collection);
    const initialLength = items.length;
    const remainingItems = items.filter((item) => !predicate(item));
    this.write(collection, remainingItems);
    return initialLength - remainingItems.length;
  }
}
