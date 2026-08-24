import { prisma } from './lib/db';
import { hashPassword } from './lib/hash';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  const email = 'testuser@example.com';
  // Use the app's built-in PBKDF2 hashing algorithm to guarantee it works
  const passwordHash = hashPassword('password123');
  const role = 'user';

  try {
    const result = await prisma.$queryRaw`
      INSERT INTO profiles (id, email, password, role)
      VALUES (gen_random_uuid(), ${email}, ${passwordHash}, ${role})
      RETURNING id, email, role
    `;
    console.log('--- TEST USER CREATED SUCCESSFULLY ---');
    console.log(`\nYou can now log in with:`);
    console.log(`Email: ${email}`);
    console.log(`Password: password123`);
  } catch (error: any) {
    if (error.message?.includes('Unique constraint failed') || error.code === '23505') {
      console.log(`User ${email} already exists! Let's update their password instead.`);
      const updateResult = await prisma.$queryRaw`
        UPDATE profiles 
        SET password = ${passwordHash}
        WHERE email = ${email}
        RETURNING id, email, role
      `;
      console.log('--- TEST USER PASSWORD UPDATED ---');
      console.log(`\nYou can now log in with:`);
      console.log(`Email: ${email}`);
      console.log(`Password: password123`);
    } else {
      console.error('Error:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
