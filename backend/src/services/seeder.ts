import bcrypt from 'bcryptjs';
import { UserRepository } from './dbRepository.js';

export async function seedAdmin(): Promise<void> {
  try {
    const existingAdmin = await UserRepository.findByUsername('Aryan');
    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash('Aryanshah', 10);
      await UserRepository.create({
        id: 'ADMIN001',
        username: 'Aryan',
        passwordHash,
        role: 'admin',
        status: 'active'
      });
      console.log('\x1b[32m%s\x1b[0m', '👑 Default Admin seeded successfully! (Username: Aryan)');
    }
  } catch (error) {
    console.error('Error seeding default admin:', error);
  }
}
