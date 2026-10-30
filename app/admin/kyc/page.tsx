// app/admin/kyc/page.tsx
import { getPendingKycRequests } from "@/app/actions/admin-kyc";
import { connection } from "next/server";
import { ShieldCheck, ShieldAlert, FileText, CheckCircle2, XCircle } from "lucide-react";
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
            <ShieldAlert size={24} className="text-brand-500" /> KYC Review Queue
          </h1>
          <p className="text-text-secondary mt-1">Review and approve user identity verifications.</p>
        </div>
        <span className="bg-surface-800 border border-surface-700 px-4 py-2 rounded-lg text-sm font-mono text-text-muted">
          {requests.length} Pending
        </span>
      </div>

      {requests.length === 0 ? (
        <div className="bg-surface-800 border border-surface-700 rounded-xl p-12 text-center">
          <CheckCircle2 size={48} className="mx-auto text-success mb-4" />
          <h2 className="text-xl font-bold text-white">All Caught Up!</h2>
          <p className="text-text-muted mt-2">There are no pending KYC requests right now.</p>
        </div>
      ) : (
        <div className="bg-surface-800 border border-surface-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-900/50 border-b border-surface-700 text-text-muted">
                <tr>
                  <th className="p-4 font-medium">User</th>
                  <th className="p-4 font-medium">Tier Requested</th>
                  <th className="p-4 font-medium">Documents</th>
                  <th className="p-4 font-medium">Date Submitted</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-700/50">
                {requests.map((req: any) => (
                  <tr key={req._id} className="hover:bg-surface-700/30 transition-colors">
                    <td className="p-4">
                      <p className="font-semibold text-white">{req.userId?.displayName || "Unknown"}</p>
                      <p className="text-xs text-text-muted">{req.userId?.email}</p>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold bg-brand-500/10 text-brand-500">
                        <ShieldCheck size={12} /> Tier {req.tierRequested}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <p className="text-xs text-text-secondary">ID Type: <span className="text-white">{req.documents.idType}</span></p>
                        <p className="text-xs text-text-secondary">ID No: <span className="text-white font-mono">{req.documents.idNumber}</span></p>
                        {req.documents.proofOfAddressUrl && (
                          <a href={req.documents.proofOfAddressUrl} target="_blank" className="text-xs text-brand-500 hover:underline flex items-center gap-1 mt-1">
                            <FileText size={12} /> View Proof of Address
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="p-4 font-mono text-text-muted">
                      {new Date(req.submittedAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
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