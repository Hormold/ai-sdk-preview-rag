#!/usr/bin/env tsx

import { seedFAQs } from '../lib/faq/faq-cache';

async function main() {
  try {
    console.log('🌱 Seeding FAQ data...');
    await seedFAQs();
    console.log('✅ FAQ seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ FAQ seeding failed:', error);
    process.exit(1);
  }
}

main();
