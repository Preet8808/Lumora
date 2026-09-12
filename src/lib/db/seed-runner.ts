import { seedDatabase } from "./seed";

async function main() {
  console.log("🌱 Starting Lumora database seeding...");
  try {
    const result = await seedDatabase();
    console.log("✅ Seed completed successfully:", result.message);
    console.log("👤 Demo user: demo@lumora.app (Password: password123)");
    console.log("👤 Alice user (isolation test): alice@lumora.app (Password: password123)");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  }
}

main();
