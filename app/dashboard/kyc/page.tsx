// app/dashboard/kyc/page.tsx
import { getServerSession } from "@/lib/session";
import connectDB from "@/lib/db";
import { KycSubmission } from "@/lib/models/Kyc";
import { KycForm } from "@/app/dashboard/kyc/KycForm";
import { ShieldCheck, Clock, XCircle } from "lucide-react";

// THIS LINE IS CRITICAL
export const instant = false;

export default async function KycPage() {
  const session = await getServerSession();
  if (!session) return null;

  await connectDB();
  const submission = await KycSubmission.findOne({ userId: session.id }).sort({ createdAt: -1 }).lean();

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Identity Verification (KYC)</h1>
        <p className="text-text-secondary mt-1">Verify your identity to unlock higher trading limits and new asset classes.</p>
      </div>

      {submission ? (
        <div className="bg-surface-800 border border-surface-700 rounded-2xl p-8 text-center space-y-4">
          {submission.status === 'pending' && (
            <>
              <Clock size={48} className="mx-auto text-brand-500" />
              <h2 className="text-xl font-bold text-brand-500">Verification Under Review</h2>
              <p className="text-text-muted">Your documents were submitted on {new Date(submission.submittedAt).toLocaleDateString()}. Our compliance team usually reviews within 24 hours.</p>
            </>
          )}
          {submission.status === 'approved' && (
            <>
              <ShieldCheck size={48} className="mx-auto text-success" />
              <h2 className="text-xl font-bold text-success">Identity Verified</h2>
              <p className="text-text-muted">You are now verified for Tier {submission.tierRequested}. You can access all corresponding trading features.</p>
            </>
          )}
          {submission.status === 'rejected' && (
            <>
              <XCircle size={48} className="mx-auto text-danger" />
              <h2 className="text-xl font-bold text-danger">Submission Rejected</h2>
              <p className="text-text-muted">{submission.rejectionReason || "Your documents were not clear. Please try again."}</p>
              <KycForm currentTier={session.tier} />
            </>
          )}
        </div>
      ) : (
        <div className="bg-surface-800 border border-surface-700 rounded-2xl p-6">
          <KycForm currentTier={session.tier} />
        </div>
      )}
    </div>
  );
}