// app/admin/assets/page.tsx
import { getAllAssets } from "@/app/actions/admin-assets";
import AssetTable from "./AssetTable";
import { Coins } from "lucide-react";
import { connection } from "next/server";

export const instant = false;

export default async function AdminAssetsPage() {
  await connection();
  const { success, assets } = await getAllAssets();

  if (!success || !assets) return <div className="text-red-500">Failed to load assets.</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Coins size={24} className="text-lime-500" /> Asset Manager
        </h1>
        <p className="text-gray-400 text-sm mt-1">Add, edit, or delist tradable assets.</p>
      </div>
      <AssetTable initialAssets={assets} />
    </div>
  );
}