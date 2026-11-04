// app/actions/admin-assets.ts
"use server";

import { getServerSession } from "@/lib/session";
import connectDB from "@/lib/db";
import Asset from "@/lib/models/Asset";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Security helper
async function requireAdmin() {
  const session = await getServerSession();
  if (!session || session.role !== "admin") throw new Error("Unauthorized");
}

// Validation Schema
const assetSchema = z.object({
  symbol: z.string().min(1).max(10),
  name: z.string().min(2),
  category: z.enum(['commodity', 'crypto', 'fiat', 'memes']),
  basePrice: z.number().positive(),
  color: z.string(),
  isActive: z.boolean(),
});

export async function getAllAssets() {
  await requireAdmin();
  await connectDB();
  const assets = await Asset.find().sort({ createdAt: -1 }).lean();
  return { success: true, assets: JSON.parse(JSON.stringify(assets)) };
}

export async function createAsset(rawData: unknown) {
  await requireAdmin();
  const parsed = assetSchema.safeParse(rawData);
  if (!parsed.success) return { error: "Invalid asset data." };

  await connectDB();
  
  // Check for duplicates
  const exists = await Asset.findOne({ symbol: parsed.data.symbol.toUpperCase() });
  if (exists) return { error: "Asset symbol already exists." };

  await Asset.create(parsed.data);
  revalidatePath("/admin/assets");
  revalidatePath("/markets"); // Refresh user market table
  return { success: true };
}

export async function toggleAssetStatus(assetId: string, isActive: boolean) {
  await requireAdmin();
  await connectDB();
  
  await Asset.findByIdAndUpdate(assetId, { isActive });
  revalidatePath("/admin/assets");
  revalidatePath("/markets");
  return { success: true };
}

export async function deleteAsset(assetId: string) {
  await requireAdmin();
  await connectDB();
  
  await Asset.findByIdAndDelete(assetId);
  revalidatePath("/admin/assets");
  revalidatePath("/markets");
  return { success: true };
}