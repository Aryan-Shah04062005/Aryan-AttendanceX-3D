import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

export let useJsonFallback = false;
export const DATA_DIR = path.join(process.cwd(), 'data');

// Ensure data directory exists for JSON fallback
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export async function connectDB(): Promise<void> {
  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    console.log('\x1b[33m%s\x1b[0m', '⚠️  MONGODB_URI not found in environment. Switching to JSON File Database Fallback.');
    useJsonFallback = true;
    initializeJsonDb();
    return;
  }

  try {
    // Set connection timeout to 3 seconds for quick fallback check
    mongoose.set('strictQuery', false);
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log('\x1b[32m%s\x1b[0m', '✅ MongoDB Connected successfully.');
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', '❌ MongoDB connection failed:', (error as Error).message);
    console.log('\x1b[33m%s\x1b[0m', '⚠️  Switching to JSON File Database Fallback (persistent local files).');
    useJsonFallback = true;
    initializeJsonDb();
  }
}

function initializeJsonDb() {
  const collections = ['users', 'employees', 'attendance', 'settings', 'leaves', 'auditlogs'];
  collections.forEach((col) => {
    const filePath = path.join(DATA_DIR, `${col}.json`);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify([], null, 2));
    }
  });
  console.log('\x1b[32m%s\x1b[0m', `📂 Local JSON database initialized at: ${DATA_DIR}`);
}
