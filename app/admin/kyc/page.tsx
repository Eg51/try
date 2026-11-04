// app/admin/kyc/page.tsx
import { getPendingKycRequests } from "@/app/actions/admin-kyc";
import { connection } from "next/server";
import { ShieldCheck, FileText, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";
import KycActionButtons from "./KycActionButtons";

export const instant = false;

export default async function AdminKycPage() {
  await connection();
  
  const { success, requests } = await getPendingKycRequests();

  if (!success || !requests) {
    return <div className="p-8 text-center text-red-500">Failed to load KYC requests.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShieldCheck size={24} className="text-lime-500" /> KYC Review Queue
          </h1>
          <p className="text-gray-400 mt-1">Review and approve user identity verifications.</p>
        </div>
        <span className="bg-[#0a0f0b] border border-lime-500/20 px-4 py-2 rounded-lg text-sm font-mono text-lime-400">
          {requests.length} Pending
        </span>
      </div>

      {requests.length === 0 ? (
        <div className="bg-[#0a0f0b] border border-lime-500/20 rounded-xl p-12 text-center">
          <CheckCircle2 size={48} className="mx-auto text-green-500 mb-4" />
          <h2 className="text-xl font-bold text-white">All Caught Up!</h2>
          <p className="text-gray-400 mt-2">There are no pending KYC requests right now.</p>
        </div>
      ) : (
        <div className="bg-[#0a0f0b] border border-lime-500/20 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-white/5 border-b border-white/10 text-xs uppercase text-gray-400">
                <tr>
                  <th className="p-4">User</th>
                  <th className="p-4">Tier Requested</th>
                  <th className="p-4">Documents</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {requests.map((req: any) => (
                  <tr key={req._id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <p className="font-semibold text-white">{req.userId?.displayName || "Unknown"}</p>
                      <p className="text-xs text-gray-500">{req.userId?.email}</p>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold bg-lime-500/10 text-lime-400">
                        Tier {req.tierRequested}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="text-xs text-gray-400">ID: <span className="text-white">{req.documents.idType}</span></p>
                    </td>
                    <td className="p-4 flex justify-end items-center gap-3">
                      <Link 
                        href={`/admin/kyc/${req._id}`} 
                        className="text-xs font-bold text-lime-400 hover:text-lime-300 flex items-center gap-1 bg-lime-500/10 px-3 py-1.5 rounded-lg"
                      >
                        Review Details <ArrowRight size={12} />
                      </Link>
                      <KycActionButtons submissionId={req._id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}