// app/admin/users/UserTable.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminUserView, updateUserStatus, updateUserRole, lockUserAccount } from "@/app/actions/admin-users";
import { adjustUserBalance } from "@/app/actions/admin-ledger";
import { Shield, ShieldAlert, Ban, CheckCircle2, Wallet, Loader2, X, Lock, Globe, Phone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useDevModal } from "@/components/providers/DevModalProvider"; // 👈 IMPORTED

export function UserTable({ users }: { users: AdminUserView[] }) {
  const router = useRouter();
  const { openModal } = useDevModal(); // 👈 INITIALIZED
  const [isLoading, setIsLoading] = useState<string | null>(null);
  
  const [confirmAction, setConfirmAction] = useState<{ type: 'status' | 'role', userId: string, currentValue: string } | null>(null);
  
  const [adjustUser, setAdjustUser] = useState<AdminUserView | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustAsset, setAdjustAsset] = useState("USD");
  const [adjustReason, setAdjustReason] = useState("");

  const [lockEmail, setLockEmail] = useState("");
  const [lockDuration, setLockDuration] = useState(24);
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);

  async function executeAction() {
    if (!confirmAction) return;
    setIsLoading(confirmAction.userId);
    
    try {
      let res;
      if (confirmAction.type === 'status') {
        const newStatus = confirmAction.currentValue === 'active' ? 'suspended' : 'active';
        res = await updateUserStatus(confirmAction.userId, newStatus);
      } else {
        const newRole = confirmAction.currentValue === 'admin' ? 'user' : 'admin';
        res = await updateUserRole(confirmAction.userId, newRole);
      }
      
      if (res.error) {
        openModal("Action Failed", res.error, "error"); // 👈 REPLACED ALERT
      } else {
        openModal("Success", "User updated successfully.", "success"); // 👈 REPLACED ALERT
        router.refresh();
      }
    } catch (error) {
      openModal("System Error", "An unexpected error occurred.", "error");
    } finally {
      setIsLoading(null);
      setConfirmAction(null);
    }
  }

  async function handleAdjustBalance(e: React.FormEvent) {
    e.preventDefault();
    if (!adjustUser) return;

    const amount = parseFloat(adjustAmount);
    if (isNaN(amount) || amount === 0) {
      openModal("Invalid Amount", "Please enter a valid non-zero amount.", "warning");
      return;
    }

    setIsLoading(adjustUser.id);

    try {
      const res = await adjustUserBalance({
        userId: adjustUser.id,
        assetId: adjustAsset,
        amount,
        reason: adjustReason || "Manual Admin Adjustment",
      });

      if (res.error) {
        openModal("Adjustment Failed", res.error, "error");
      } else {
        openModal("Success", "Balance adjusted successfully!", "success");
        router.refresh();
        setAdjustUser(null);
        setAdjustAmount("");
        setAdjustReason("");
      }
    } catch (error) {
      openModal("System Error", "Failed to adjust balance.", "error");
    } finally {
      setIsLoading(null);
    }
  }

  async function handleLockUser(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading("lock");

    try {
      const res = await lockUserAccount(lockEmail, lockDuration);
      if (res.error) {
        openModal("Lock Failed", res.error, "error");
      } else {
        openModal("Account Locked", res.message || "User account locked.", "success");
        router.refresh();
        setIsLockModalOpen(false);
      }
    } catch (error) {
      openModal("System Error", "Failed to lock user.", "error");
    } finally {
      setIsLoading(null);
    }
  }

  return (
    <>
      <div className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-2xl border border-lime-500/20 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white/50 dark:bg-[#121A14]/50 border-b border-lime-500/10 text-lime-800/60 dark:text-lime-200/50 uppercase text-xs">
              <tr>
                <th className="p-4 sm:px-6 font-bold">User</th>
                <th className="p-4 sm:px-6 font-bold">Role</th>
                <th className="p-4 sm:px-6 font-bold">Tier</th>
                <th className="p-4 sm:px-6 font-bold">Status</th>
                <th className="p-4 sm:px-6 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-lime-500/10">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-lime-500/5 transition-colors">
                  <td className="p-4 sm:px-6">
                    <p className="font-bold text-lime-950 dark:text-white">{user.displayName}</p>
                    <p className="text-xs text-lime-800/60 dark:text-lime-200/40 mt-0.5">{user.email}</p>
                    
                    {(user.country || user.phone) && (
                      <div className="flex items-center gap-3 mt-1.5">
                        {user.country && (
                          <span className="text-[10px] text-lime-700/50 dark:text-lime-300/40 flex items-center gap-1 font-medium">
                            <Globe size={10} /> {user.country}
                          </span>
                        )}
                        {user.phone && (
                          <span className="text-[10px] text-lime-700/50 dark:text-lime-300/40 flex items-center gap-1 font-medium">
                            <Phone size={10} /> {user.phone}
                          </span>
                        )}
                      </div>
                    )}

                    {user.lockedUntil && (
                      <p className="text-[10px] text-red-500 font-bold mt-1">LOCKED UNTIL: {user.lockedUntil}</p>
                    )}
                  </td>
                  <td className="p-4 sm:px-6">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider ${
                      user.role === 'admin' 
                        ? 'bg-lime-500/20 text-lime-600 dark:text-lime-400 border border-lime-500/30' 
                        : 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border border-gray-500/20'
                    }`}>
                      {user.role === 'admin' ? <Shield size={12} /> : null} {user.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 sm:px-6 font-mono text-lime-800/70 dark:text-lime-200/60 font-semibold">Tier {user.kycTier}</td>
                  <td className="p-4 sm:px-6">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider border ${
                      user.status === 'active' 
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' 
                        : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                    }`}>
                      {user.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 sm:px-6 text-right space-x-2">
                    <button 
                      onClick={() => setAdjustUser(user)}
                      disabled={isLoading === user.id}
                      className="p-2 rounded-xl bg-white/50 dark:bg-[#121A14]/50 border border-lime-500/20 hover:border-lime-500 text-lime-800/60 dark:text-lime-200/50 hover:text-lime-600 transition-colors"
                      title="Adjust Balance"
                    >
                      <Wallet size={16} />
                    </button>
                    <button 
                      onClick={() => { setLockEmail(user.email); setIsLockModalOpen(true); }}
                      disabled={isLoading === user.id}
                      className="p-2 rounded-xl bg-white/50 dark:bg-[#121A14]/50 border border-lime-500/20 hover:border-red-500 text-lime-800/60 dark:text-lime-200/50 hover:text-red-500 transition-colors"
                      title="Lock Account"
                    >
                      <Lock size={16} />
                    </button>
                    <button 
                      onClick={() => setConfirmAction({ type: 'role', userId: user.id, currentValue: user.role })}
                      disabled={isLoading === user.id}
                      className="p-2 rounded-xl bg-white/50 dark:bg-[#121A14]/50 border border-lime-500/20 hover:border-lime-500 text-lime-800/60 dark:text-lime-200/50 hover:text-lime-600 transition-colors"
                      title="Toggle Admin Role"
                    >
                      <ShieldAlert size={16} />
                    </button>
                    <button 
                      onClick={() => setConfirmAction({ type: 'status', userId: user.id, currentValue: user.status })}
                      disabled={isLoading === user.id}
                      className={`p-2 rounded-xl bg-white/50 dark:bg-[#121A14]/50 border border-lime-500/20 transition-colors ${
                        user.status === 'active' 
                          ? 'hover:border-red-500 hover:text-red-500 text-lime-800/60 dark:text-lime-200/50' 
                          : 'hover:border-green-500 hover:text-green-500 text-lime-800/60 dark:text-lime-200/50'
                      }`}
                      title={user.status === 'active' ? "Ban User" : "Unban User"}
                    >
                      {user.status === 'active' ? <Ban size={16} /> : <CheckCircle2 size={16} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONFIRMATION MODAL */}
      {confirmAction && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#f4fbf5] dark:bg-[#0a0f0b] border border-lime-500/30 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-lime-950 dark:text-white mb-2">Confirm Action</h3>
            <p className="text-sm text-lime-800/70 dark:text-lime-200/50 mb-6">
              Are you sure you want to change this user's {confirmAction.type}?
            </p>
            <div className="flex gap-3">
              <Button onClick={() => setConfirmAction(null)} variant="ghost" className="flex-1 text-lime-800 dark:text-lime-200 hover:bg-lime-500/10">Cancel</Button>
              <Button onClick={executeAction} disabled={isLoading !== null} className="flex-1 bg-red-600 text-white hover:bg-red-700">
                {isLoading ? <Loader2 className="animate-spin" size={18} /> : "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ADJUST BALANCE MODAL */}
      {adjustUser && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form onSubmit={handleAdjustBalance} className="w-full max-w-md bg-[#f4fbf5] dark:bg-[#0a0f0b] border border-lime-500/30 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-lime-500/10 pb-3">
              <h3 className="text-lg font-bold text-lime-950 dark:text-white flex items-center gap-2">
                <Wallet size={18} className="text-lime-500" /> Adjust Balance
              </h3>
              <button type="button" onClick={() => setAdjustUser(null)} className="text-gray-400 hover:text-red-500 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <p className="text-xs text-lime-800/60 dark:text-lime-200/50 font-medium">
              Modifying balance for <span className="text-lime-950 dark:text-white font-bold">{adjustUser.displayName}</span>.
            </p>

            <div>
              <label className="text-xs font-bold text-lime-800/60 dark:text-lime-200/50 uppercase tracking-wider block mb-1">Asset</label>
              <select value={adjustAsset} onChange={(e) => setAdjustAsset(e.target.value)} className="w-full bg-white/50 dark:bg-[#121A14] border border-lime-500/20 rounded-xl p-2.5 text-lime-950 dark:text-white outline-none focus:border-lime-500">
                <option value="USD">USD</option>
                <option value="BTC">BTC</option>
                <option value="ETH">ETH</option>
                <option value="DOGE">DOGE</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-lime-800/60 dark:text-lime-200/50 uppercase tracking-wider block mb-1">Amount</label>
              <input type="number" step="any" required value={adjustAmount} onChange={(e) => setAdjustAmount(e.target.value)} placeholder="e.g. 500 or -100" className="w-full bg-white/50 dark:bg-[#121A14] border border-lime-500/20 rounded-xl p-2.5 text-lime-950 dark:text-white font-mono outline-none focus:border-lime-500" />
            </div>

            <div>
              <label className="text-xs font-bold text-lime-800/60 dark:text-lime-200/50 uppercase tracking-wider block mb-1">Reason (Internal Note)</label>
              <input type="text" value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} placeholder="e.g. Goodwill refund" className="w-full bg-white/50 dark:bg-[#121A14] border border-lime-500/20 rounded-xl p-2.5 text-lime-950 dark:text-white outline-none focus:border-lime-500" />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" onClick={() => setAdjustUser(null)} variant="ghost" className="flex-1 text-lime-800 dark:text-lime-200 hover:bg-lime-500/10">Cancel</Button>
              <Button type="submit" disabled={isLoading !== null} className="flex-1 bg-lime-600 text-white hover:bg-lime-700">
                {isLoading ? <Loader2 className="animate-spin" size={18} /> : "Apply Adjustment"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* LOCK MODAL */}
      {isLockModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form onSubmit={handleLockUser} className="w-full max-w-sm bg-[#f4fbf5] dark:bg-[#0a0f0b] border border-red-500/30 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-red-500/10 pb-3">
              <h3 className="text-lg font-bold text-red-500 flex items-center gap-2">
                <Lock size={18} /> Lock Account
              </h3>
              <button type="button" onClick={() => setIsLockModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <p className="text-xs text-lime-800/60 dark:text-lime-200/50 font-medium">
              Locking: <span className="text-lime-950 dark:text-white font-bold">{lockEmail}</span>
            </p>

            <div>
              <label className="text-xs font-bold text-lime-800/60 dark:text-lime-200/50 uppercase tracking-wider block mb-1">Duration</label>
              <select value={lockDuration} onChange={(e) => setLockDuration(Number(e.target.value))} className="w-full bg-white/50 dark:bg-[#121A14] border border-lime-500/20 rounded-xl p-2.5 text-lime-950 dark:text-white outline-none focus:border-lime-500">
                <option value={1}>1 Hour</option>
                <option value={24}>24 Hours</option>
                <option value={168}>7 Days</option>
                <option value={-1}>Permanent Lock</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" onClick={() => setIsLockModalOpen(false)} variant="ghost" className="flex-1 text-lime-800 dark:text-lime-200 hover:bg-lime-500/10">Cancel</Button>
              <Button type="submit" disabled={isLoading === "lock"} className="flex-1 bg-red-600 text-white hover:bg-red-700">
                {isLoading === "lock" ? <Loader2 className="animate-spin" size={18} /> : "Lock User"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}















// // app/admin/users/UserTable.tsx
// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import { AdminUserView, updateUserStatus, updateUserRole, lockUserAccount } from "@/app/actions/admin-users";
// import { adjustUserBalance } from "@/app/actions/admin-ledger";
// import { Shield, ShieldAlert, Ban, CheckCircle2, Wallet, Loader2, X, Lock } from "lucide-react";
// import { Button } from "@/components/ui/Button";

// export function UserTable({ users }: { users: AdminUserView[] }) {
//   const router = useRouter();
//   const [isLoading, setIsLoading] = useState<string | null>(null);
  
//   const [confirmAction, setConfirmAction] = useState<{ type: 'status' | 'role', userId: string, currentValue: string } | null>(null);
  
//   const [adjustUser, setAdjustUser] = useState<AdminUserView | null>(null);
//   const [adjustAmount, setAdjustAmount] = useState("");
//   const [adjustAsset, setAdjustAsset] = useState("USD");
//   const [adjustReason, setAdjustReason] = useState("");

//   // 👇 NEW: Lock states
//   const [lockEmail, setLockEmail] = useState("");
//   const [lockDuration, setLockDuration] = useState(24);
//   const [isLockModalOpen, setIsLockModalOpen] = useState(false);

//   async function executeAction() {
//     if (!confirmAction) return;
//     setIsLoading(confirmAction.userId);
    
//     let res;
//     if (confirmAction.type === 'status') {
//       const newStatus = confirmAction.currentValue === 'active' ? 'suspended' : 'active';
//       res = await updateUserStatus(confirmAction.userId, newStatus);
//     } else {
//       const newRole = confirmAction.currentValue === 'admin' ? 'user' : 'admin';
//       res = await updateUserRole(confirmAction.userId, newRole);
//     }
    
//     if (res.error) alert(res.error);
//     else router.refresh();
    
//     setIsLoading(null);
//     setConfirmAction(null);
//   }

//   async function handleAdjustBalance(e: React.FormEvent) {
//     e.preventDefault();
//     if (!adjustUser) return;
//     setIsLoading(adjustUser.id);

//     const amount = parseFloat(adjustAmount);
//     if (isNaN(amount) || amount === 0) {
//       alert("Please enter a valid non-zero amount.");
//       setIsLoading(null);
//       return;
//     }

//     const res = await adjustUserBalance({
//       userId: adjustUser.id,
//       assetId: adjustAsset,
//       amount,
//       reason: adjustReason || "Manual Admin Adjustment",
//     });

//     if (res.error) alert(res.error);
//     else {
//       alert("Balance adjusted successfully!");
//       router.refresh();
//       setAdjustUser(null);
//       setAdjustAmount("");
//       setAdjustReason("");
//     }
//     setIsLoading(null);
//   }

//   // 👇 NEW: Handle lock
//   async function handleLockUser(e: React.FormEvent) {
//     e.preventDefault();
//     setIsLoading("lock");
//     const res = await lockUserAccount(lockEmail, lockDuration);
//     alert(res.message || res.error);
//     setIsLoading(null);
//     setIsLockModalOpen(false);
//     router.refresh();
//   }

//   return (
//     <>
//       <div className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-2xl border border-lime-500/20 rounded-3xl overflow-hidden shadow-xl">
//         <div className="overflow-x-auto custom-scrollbar">
//           <table className="w-full text-left text-sm whitespace-nowrap">
//             <thead className="bg-white/50 dark:bg-[#121A14]/50 border-b border-lime-500/10 text-lime-800/60 dark:text-lime-200/50 uppercase text-xs">
//               <tr>
//                 <th className="p-4 sm:px-6 font-bold">User</th>
//                 <th className="p-4 sm:px-6 font-bold">Role</th>
//                 <th className="p-4 sm:px-6 font-bold">Tier</th>
//                 <th className="p-4 sm:px-6 font-bold">Status</th>
//                 <th className="p-4 sm:px-6 font-bold text-right">Actions</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-lime-500/10">
//               {users.map((user) => (
//                 <tr key={user.id} className="hover:bg-lime-500/5 transition-colors">
//                   <td className="p-4 sm:px-6">
//                     <p className="font-bold text-lime-950 dark:text-white">{user.displayName}</p>
//                     <p className="text-xs text-lime-800/60 dark:text-lime-200/40 mt-0.5">{user.email}</p>
//                     {user.lockedUntil && (
//                       <p className="text-[10px] text-red-500 font-bold mt-1">LOCKED UNTIL: {user.lockedUntil}</p>
//                     )}
//                   </td>
//                   <td className="p-4 sm:px-6">
//                     <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider ${
//                       user.role === 'admin' 
//                         ? 'bg-lime-500/20 text-lime-600 dark:text-lime-400 border border-lime-500/30' 
//                         : 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border border-gray-500/20'
//                     }`}>
//                       {user.role === 'admin' ? <Shield size={12} /> : null} {user.role.toUpperCase()}
//                     </span>
//                   </td>
//                   <td className="p-4 sm:px-6 font-mono text-lime-800/70 dark:text-lime-200/60 font-semibold">Tier {user.kycTier}</td>
//                   <td className="p-4 sm:px-6">
//                     <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider border ${
//                       user.status === 'active' 
//                         ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' 
//                         : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
//                     }`}>
//                       {user.status.toUpperCase()}
//                     </span>
//                   </td>
//                   <td className="p-4 sm:px-6 text-right space-x-2">
//                     <button 
//                       onClick={() => setAdjustUser(user)}
//                       disabled={isLoading === user.id}
//                       className="p-2 rounded-xl bg-white/50 dark:bg-[#121A14]/50 border border-lime-500/20 hover:border-lime-500 text-lime-800/60 dark:text-lime-200/50 hover:text-lime-600 transition-colors"
//                       title="Adjust Balance"
//                     >
//                       <Wallet size={16} />
//                     </button>
//                     {/* 👇 NEW LOCK BUTTON */}
//                     <button 
//                       onClick={() => { setLockEmail(user.email); setIsLockModalOpen(true); }}
//                       disabled={isLoading === user.id}
//                       className="p-2 rounded-xl bg-white/50 dark:bg-[#121A14]/50 border border-lime-500/20 hover:border-red-500 text-lime-800/60 dark:text-lime-200/50 hover:text-red-500 transition-colors"
//                       title="Lock Account"
//                     >
//                       <Lock size={16} />
//                     </button>
//                     <button 
//                       onClick={() => setConfirmAction({ type: 'role', userId: user.id, currentValue: user.role })}
//                       disabled={isLoading === user.id}
//                       className="p-2 rounded-xl bg-white/50 dark:bg-[#121A14]/50 border border-lime-500/20 hover:border-lime-500 text-lime-800/60 dark:text-lime-200/50 hover:text-lime-600 transition-colors"
//                       title="Toggle Admin Role"
//                     >
//                       <ShieldAlert size={16} />
//                     </button>
//                     <button 
//                       onClick={() => setConfirmAction({ type: 'status', userId: user.id, currentValue: user.status })}
//                       disabled={isLoading === user.id}
//                       className={`p-2 rounded-xl bg-white/50 dark:bg-[#121A14]/50 border border-lime-500/20 transition-colors ${
//                         user.status === 'active' 
//                           ? 'hover:border-red-500 hover:text-red-500 text-lime-800/60 dark:text-lime-200/50' 
//                           : 'hover:border-green-500 hover:text-green-500 text-lime-800/60 dark:text-lime-200/50'
//                       }`}
//                       title={user.status === 'active' ? "Ban User" : "Unban User"}
//                     >
//                       {user.status === 'active' ? <Ban size={16} /> : <CheckCircle2 size={16} />}
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* CONFIRMATION MODAL */}
//       {confirmAction && (
//         <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
//           <div className="w-full max-w-sm bg-[#f4fbf5] dark:bg-[#0a0f0b] border border-lime-500/30 rounded-3xl p-6 shadow-2xl">
//             <h3 className="text-lg font-bold text-lime-950 dark:text-white mb-2">Confirm Action</h3>
//             <p className="text-sm text-lime-800/70 dark:text-lime-200/50 mb-6">
//               Are you sure you want to change this user's {confirmAction.type}?
//             </p>
//             <div className="flex gap-3">
//               <Button onClick={() => setConfirmAction(null)} variant="ghost" className="flex-1 text-lime-800 dark:text-lime-200 hover:bg-lime-500/10">Cancel</Button>
//               <Button onClick={executeAction} disabled={isLoading !== null} className="flex-1 bg-red-600 text-white hover:bg-red-700">
//                 {isLoading ? "Updating..." : "Confirm"}
//               </Button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ADJUST BALANCE MODAL */}
//       {adjustUser && (
//         <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
//           <form onSubmit={handleAdjustBalance} className="w-full max-w-md bg-[#f4fbf5] dark:bg-[#0a0f0b] border border-lime-500/30 rounded-3xl p-6 shadow-2xl space-y-4">
//             <div className="flex justify-between items-center border-b border-lime-500/10 pb-3">
//               <h3 className="text-lg font-bold text-lime-950 dark:text-white flex items-center gap-2">
//                 <Wallet size={18} className="text-lime-500" /> Adjust Balance
//               </h3>
//               <button type="button" onClick={() => setAdjustUser(null)} className="text-gray-400 hover:text-red-500 transition-colors">
//                 <X size={20} />
//               </button>
//             </div>
            
//             <p className="text-xs text-lime-800/60 dark:text-lime-200/50 font-medium">
//               Modifying balance for <span className="text-lime-950 dark:text-white font-bold">{adjustUser.displayName}</span>.
//             </p>

//             <div>
//               <label className="text-xs font-bold text-lime-800/60 dark:text-lime-200/50 uppercase tracking-wider block mb-1">Asset</label>
//               <select value={adjustAsset} onChange={(e) => setAdjustAsset(e.target.value)} className="w-full bg-white/50 dark:bg-[#121A14] border border-lime-500/20 rounded-xl p-2.5 text-lime-950 dark:text-white outline-none focus:border-lime-500">
//                 <option value="USD">USD</option>
//                 <option value="BTC">BTC</option>
//                 <option value="ETH">ETH</option>
//                 <option value="DOGE">DOGE</option>
//               </select>
//             </div>

//             <div>
//               <label className="text-xs font-bold text-lime-800/60 dark:text-lime-200/50 uppercase tracking-wider block mb-1">Amount</label>
//               <input type="number" step="any" required value={adjustAmount} onChange={(e) => setAdjustAmount(e.target.value)} placeholder="e.g. 500 or -100" className="w-full bg-white/50 dark:bg-[#121A14] border border-lime-500/20 rounded-xl p-2.5 text-lime-950 dark:text-white font-mono outline-none focus:border-lime-500" />
//             </div>

//             <div>
//               <label className="text-xs font-bold text-lime-800/60 dark:text-lime-200/50 uppercase tracking-wider block mb-1">Reason (Internal Note)</label>
//               <input type="text" value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} placeholder="e.g. Goodwill refund" className="w-full bg-white/50 dark:bg-[#121A14] border border-lime-500/20 rounded-xl p-2.5 text-lime-950 dark:text-white outline-none focus:border-lime-500" />
//             </div>

//             <div className="flex gap-3 pt-2">
//               <Button type="button" onClick={() => setAdjustUser(null)} variant="ghost" className="flex-1 text-lime-800 dark:text-lime-200 hover:bg-lime-500/10">Cancel</Button>
//               <Button type="submit" disabled={isLoading !== null} className="flex-1 bg-lime-600 text-white hover:bg-lime-700">
//                 {isLoading ? <Loader2 className="animate-spin" size={18} /> : "Apply Adjustment"}
//               </Button>
//             </div>
//           </form>
//         </div>
//       )}

//       {/* 👇 NEW LOCK MODAL */}
//       {isLockModalOpen && (
//         <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
//           <form onSubmit={handleLockUser} className="w-full max-w-sm bg-[#f4fbf5] dark:bg-[#0a0f0b] border border-red-500/30 rounded-3xl p-6 shadow-2xl space-y-4">
//             <div className="flex justify-between items-center border-b border-red-500/10 pb-3">
//               <h3 className="text-lg font-bold text-red-500 flex items-center gap-2">
//                 <Lock size={18} /> Lock Account
//               </h3>
//               <button type="button" onClick={() => setIsLockModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
//                 <X size={20} />
//               </button>
//             </div>
            
//             <p className="text-xs text-lime-800/60 dark:text-lime-200/50 font-medium">
//               Locking: <span className="text-lime-950 dark:text-white font-bold">{lockEmail}</span>
//             </p>

//             <div>
//               <label className="text-xs font-bold text-lime-800/60 dark:text-lime-200/50 uppercase tracking-wider block mb-1">Duration</label>
//               <select value={lockDuration} onChange={(e) => setLockDuration(Number(e.target.value))} className="w-full bg-white/50 dark:bg-[#121A14] border border-lime-500/20 rounded-xl p-2.5 text-lime-950 dark:text-white outline-none focus:border-lime-500">
//                 <option value={1}>1 Hour</option>
//                 <option value={24}>24 Hours</option>
//                 <option value={168}>7 Days</option>
//                 <option value={-1}>Permanent Lock</option>
//               </select>
//             </div>

//             <div className="flex gap-3 pt-2">
//               <Button type="button" onClick={() => setIsLockModalOpen(false)} variant="ghost" className="flex-1 text-lime-800 dark:text-lime-200 hover:bg-lime-500/10">Cancel</Button>
//               <Button type="submit" disabled={isLoading === "lock"} className="flex-1 bg-red-600 text-white hover:bg-red-700">
//                 {isLoading === "lock" ? <Loader2 className="animate-spin" size={18} /> : "Lock User"}
//               </Button>
//             </div>
//           </form>
//         </div>
//       )}
//     </>
//   );
// }