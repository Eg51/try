// app/admin/assets/AssetTable.tsx
"use client";

import { useState } from "react";
import { createAsset, toggleAssetStatus, deleteAsset } from "@/app/actions/admin-assets";
import { Plus, Trash2, Power, Loader2, X } from "lucide-react";

export default function AssetTable({ initialAssets }: { initialAssets: any[] }) {
  const [assets, setAssets] = useState(initialAssets);
  const [loading, setLoading] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    symbol: "",
    name: "",
    category: "commodity",
    basePrice: 0,
    color: "#84cc16",
    isActive: true
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading("create");
    const res = await createAsset(formData);
    
    if (res.error) alert(res.error);
    else {
      setIsModalOpen(false);
      window.location.reload(); // Refresh to show new data
    }
    setLoading(null);
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    setLoading(id);
    const res = await toggleAssetStatus(id, !currentStatus);
    if (res.success) {
      setAssets(assets.map(a => a._id === id ? { ...a, isActive: !currentStatus } : a));
    }
    setLoading(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this asset permanently?")) return;
    setLoading(id);
    const res = await deleteAsset(id);
    if (res.success) setAssets(assets.filter(a => a._id !== id));
    setLoading(null);
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="flex items-center gap-2 bg-lime-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-lime-700 transition-colors"
        >
          <Plus size={16} /> Add New Asset
        </button>
      </div>

      <div className="bg-[#0a0f0b] border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-white/5 text-xs uppercase text-gray-400 border-b border-white/10">
            <tr>
              <th className="px-6 py-4">Asset</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Base Price</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {assets.map((asset) => (
              <tr key={asset._id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-black font-bold" style={{ background: asset.color }}>
                    {asset.symbol[0]}
                  </div>
                  <div>
                    <p className="font-bold text-white">{asset.symbol}</p>
                    <p className="text-xs text-gray-500">{asset.name}</p>
                  </div>
                </td>
                <td className="px-6 py-4 capitalize">{asset.category}</td>
                <td className="px-6 py-4 font-mono">${asset.basePrice.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${asset.isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    {asset.isActive ? "ACTIVE" : "DELISTED"}
                  </span>
                </td>
                <td className="px-6 py-4 flex justify-end gap-2">
                  <button 
                    onClick={() => handleToggle(asset._id, asset.isActive)} 
                    disabled={loading === asset._id}
                    className={`p-2 rounded-lg border transition-colors ${asset.isActive ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'}`}
                  >
                    <Power size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(asset._id)} 
                    disabled={loading === asset._id}
                    className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CREATE ASSET MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form onSubmit={handleCreate} className="w-full max-w-md bg-[#0a0f0b] border border-lime-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white">Add New Asset</h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white"><X size={20} /></button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-400 mb-1 block">Symbol</label>
                <input required type="text" placeholder="e.g. XAU" value={formData.symbol} onChange={e => setFormData({...formData, symbol: e.target.value.toUpperCase()})} className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-lime-500 font-mono" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 mb-1 block">Name</label>
                <input required type="text" placeholder="e.g. Gold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-lime-500" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-400 mb-1 block">Category</label>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-lime-500">
                  <option value="commodity">Commodity</option>
                  <option value="crypto">Crypto</option>
                  <option value="memes">Meme</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 mb-1 block">Base Price (USD)</label>
                <input required type="number" step="any" value={formData.basePrice} onChange={e => setFormData({...formData, basePrice: parseFloat(e.target.value)})} className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-lime-500 font-mono" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 mb-1 block">Theme Color</label>
              <input type="color" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} className="w-full h-10 bg-black border border-white/10 rounded-lg p-1 outline-none cursor-pointer" />
            </div>

            <button type="submit" disabled={loading === "create"} className="w-full py-3 bg-lime-600 text-white rounded-xl font-bold hover:bg-lime-700 transition-colors flex justify-center">
              {loading === "create" ? <Loader2 size={18} className="animate-spin" /> : "Create Asset"}
            </button>
          </form>
        </div>
      )}
    </>
  );
}