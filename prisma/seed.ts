import { PrismaClient } from "@prisma/client";
import {
  BANNERS,
  CATEGORIES,
  DEFAULT_CONFIG,
  PRODUCTS,
  SERVICEABLE_PINCODES,
} from "../lib/data";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Starting QuickCart database seeding...");

  // 1. Seed Store Config
  await db.storeConfig.upsert({
    where: { id: "default" },
    update: {
      deliveryFee: DEFAULT_CONFIG.delivery_fee,
      freeDeliveryThreshold: DEFAULT_CONFIG.free_delivery_above,
      minOrderValue: 9900,
      storeName: DEFAULT_CONFIG.store_name,
      isStoreOpen: true,
    },
    create: {
      id: "default",
      deliveryFee: DEFAULT_CONFIG.delivery_fee,
      freeDeliveryThreshold: DEFAULT_CONFIG.free_delivery_above,
      minOrderValue: 9900,
      storeName: DEFAULT_CONFIG.store_name,
      isStoreOpen: true,
    },
  });
  console.log("✅ StoreConfig seeded.");

  // 2. Seed Serviceable Pincodes
  for (const pincode of SERVICEABLE_PINCODES) {
    await db.serviceablePincode.upsert({
      where: { pincode },
      update: {},
      create: { pincode },
    });
  }
  console.log(`✅ ${SERVICEABLE_PINCODES.length} Serviceable pincodes seeded.`);

  // 3. Seed Categories
  for (const cat of CATEGORIES) {
    await db.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        emoji: cat.emoji,
        imageUrl: cat.imageUrl,
        sortOrder: cat.sortOrder,
        isActive: cat.isActive,
      },
      create: {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        emoji: cat.emoji,
        imageUrl: cat.imageUrl,
        sortOrder: cat.sortOrder,
        isActive: cat.isActive,
      },
    });
  }
  console.log(`✅ ${CATEGORIES.length} Categories seeded.`);

  // 4. Seed Products
  for (const prod of PRODUCTS) {
    await db.product.upsert({
      where: { slug: prod.slug },
      update: {
        name: prod.name,
        description: prod.description ?? null,
        categorySlug: prod.categorySlug,
        brand: prod.brand ?? null,
        unit: prod.unit,
        mrp: prod.mrp,
        price: prod.price,
        stockQty: prod.stockQty,
        lowStockThreshold: prod.lowStockThreshold,
        emoji: prod.emoji,
        imageUrl: prod.imageUrl,
        tags: prod.tags,
        isActive: prod.isActive,
        isFeatured: prod.isFeatured,
        sortOrder: prod.sortOrder,
      },
      create: {
        id: prod.id,
        name: prod.name,
        slug: prod.slug,
        description: prod.description ?? null,
        categorySlug: prod.categorySlug,
        brand: prod.brand ?? null,
        unit: prod.unit,
        mrp: prod.mrp,
        price: prod.price,
        stockQty: prod.stockQty,
        lowStockThreshold: prod.lowStockThreshold,
        emoji: prod.emoji,
        imageUrl: prod.imageUrl,
        tags: prod.tags,
        isActive: prod.isActive,
        isFeatured: prod.isFeatured,
        sortOrder: prod.sortOrder,
      },
    });
  }
  console.log(`✅ ${PRODUCTS.length} Products seeded.`);

  // 5. Seed Banners
  for (const b of BANNERS) {
    await db.banner.upsert({
      where: { id: b.id },
      update: {
        title: b.title,
        subtitle: b.subtitle,
        emoji: b.emoji,
        imageUrl: b.imageUrl,
        bg: b.bg,
        linkUrl: b.linkUrl ?? null,
        isActive: b.isActive,
        sortOrder: b.sortOrder,
      },
      create: {
        id: b.id,
        title: b.title,
        subtitle: b.subtitle,
        emoji: b.emoji,
        imageUrl: b.imageUrl,
        bg: b.bg,
        linkUrl: b.linkUrl ?? null,
        isActive: b.isActive,
        sortOrder: b.sortOrder,
      },
    });
  }
  console.log(`✅ ${BANNERS.length} Banners seeded.`);

  console.log("🎉 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Database seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
