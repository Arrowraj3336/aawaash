import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Info, X, Lock, Clock, ArrowDownToLine } from "lucide-react";
import { useSession } from "@/hooks/useSession";
import { RoleGuard } from "@/components/aawash/AuthGuard";
import { EcoShell } from "@/components/aawash/dashboard/EcoKit";
import { DashboardPageHeading, DashboardWallet } from "@/components/aawash/dashboard/ArchitecturalDashboard";
import {
  SectionCard,
  EmptyState,
  SkeletonBlock,
  formatINR,
} from "@/components/aawash/dashboard-kit";
import {
  cancelMyWithdrawal,
  getWalletOverview,
  listMyWithdrawals,
} from "@/lib/wallet.functions";
import {
  WithdrawalRequestForm,
  WithdrawalStatusPill,
} from "@/components/aawash/wallet/WithdrawalRequestForm";

export const Route = createFileRoute("/_authenticated/leader/withdrawals")({
  component: WithdrawalsPage,
  head: () => ({ meta: [{ title: "Withdrawals — Aawash" }] }),
});

function WithdrawalsPage() {
  return (
    <RoleGuard allow={["team_leader", "super_admin", "member"]}>
      <WithdrawalsContent />
    </RoleGuard>
  );
}

function WithdrawalsContent() {
  const { profile } = useSession();
  const qc = useQueryClient();
  const listFn = useServerFn(listMyWithdrawals);
  const walletFn = useServerFn(getWalletOverview);
  const cancelFn = useServerFn(cancelMyWithdrawal);

  const { data: wallet } = useQuery({ queryKey: ["wallet", "overview"], queryFn: () => walletFn() });
  const { data: withdrawals, isLoading } = useQuery({
    queryKey: ["wallet", "withdrawals"],
    queryFn: () => listFn(),
  });

  const cancel = useMutation({
    mutationFn: (id: string) => cancelFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wallet", "overview"] });
      qc.invalidateQueries({ queryKey: ["wallet", "withdrawals"] });
    },
  });

  const available = Number(wallet?.profile?.wallet_balance ?? profile?.wallet_balance ?? 0);
  const locked = Number(wallet?.profile?.locked_balance ?? 0);

  return (
    <EcoShell role="team_leader" profile={profile} architectural showDock={false}>
      <div className="arch-subpage">
        <DashboardPageHeading title="Wallet & Payouts" description="Manage your balance and payout requests." as="h1" />
        <DashboardWallet balance={formatINR(available)} stats={[
          { icon: <Lock />, label: "Locked", value: formatINR(locked) },
          { icon: <ArrowDownToLine />, label: "Lifetime withdrawn", value: formatINR(Number(wallet?.profile?.lifetime_withdrawals ?? 0)) },
          { icon: <Clock />, label: "Requests", value: String(withdrawals?.length ?? 0) },
          { icon: <Info />, label: "Withdrawal window", value: wallet?.windowLabel ?? "—" },
        ]} />
        <section id="request-withdrawal" className="mt-5 scroll-mt-20 arch-withdrawal-form">
          <SectionCard title="Request withdrawal" subtitle="Window: 25th – 30th every month.">
            <WithdrawalRequestForm
              withdrawable={available}
              invalidateKeys={[
                ["wallet", "overview"],
                ["wallet", "withdrawals"],
              ]}
            />
          </SectionCard>
        </section>

        <section className="mt-6">
          <SectionCard title="History">
            {isLoading ? (
              <div className="grid gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <SkeletonBlock key={i} className="h-16" />
                ))}
              </div>
            ) : (withdrawals ?? []).length === 0 ? (
              <EmptyState icon={<Info size={22} />} title="No withdrawals yet" body="Your requests will appear here." />
            ) : (
              <ul className="flex flex-col gap-2">
                {(withdrawals ?? []).map((w) => {
                  const rec = w as unknown as {
                    id: string;
                    reference_number: string | null;
                    amount: number;
                    status: string;
                    requested_at: string;
                    bank_name: string | null;
                    rejection_reason: string | null;
                  };
                  const cancellable = rec.status === "pending" || rec.status === "approved";
                  return (
                    <li key={rec.id} className="flex flex-col gap-2 rounded-2xl border border-border/50 bg-surface p-3 sm:flex-row sm:items-center">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-semibold text-foreground">{formatINR(rec.amount)}</div>
                          <WithdrawalStatusPill status={rec.status} />
                        </div>
                        <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                          {rec.reference_number} · {new Date(rec.requested_at).toLocaleString("en-IN")}
                        </div>
                        {rec.rejection_reason && (
                          <div className="mt-0.5 text-[11px] text-destructive">Reason: {rec.rejection_reason}</div>
                        )}
                      </div>
                      {cancellable && (
                        <button
                          onClick={() => cancel.mutate(rec.id)}
                          disabled={cancel.isPending}
                          className="inline-flex h-9 items-center gap-1 rounded-xl border border-border px-3 text-xs font-semibold text-muted-foreground hover:text-foreground disabled:opacity-50"
                        >
                          <X size={12} /> Cancel
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </SectionCard>
        </section>
      </div>
    </EcoShell>
  );
}
