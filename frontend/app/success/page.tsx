"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import api from "@/utils/axios";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, CircleAlert } from "lucide-react";

type CheckoutSession = {
  id?: string;
  status?: string;
  customer_email?: string;
  amount_total?: number;
  currency?: string;
};

function SuccessPageInner() {
  const searchParams = useSearchParams();
  const sessionId = useMemo(
    () => searchParams.get("session_id"),
    [searchParams]
  );

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<CheckoutSession | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchSession(id: string) {
      try {
        setLoading(true);
        setError(null);
        const { data } = await api.get(
          `/billing/retrieve-checkout-session/${id}`
        );
        if (!mounted) return;
        setSession(data);
      } catch {
        if (!mounted) return;
        setError("Failed to retrieve checkout session");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (sessionId) {
      fetchSession(sessionId);
    }
    return () => {
      mounted = false;
    };
  }, [sessionId]);

  return (
    <div className="px-[10%] py-6 min-h-screen">
      {!sessionId && (
        <Alert variant="destructive" className="mb-6">
          <CircleAlert className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Missing checkout session ID.</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="mb-6">
          <CircleAlert className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Payment Success</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Verifying your payment...
            </div>
          )}

          {!loading && session && (
            <Alert className="bg-green-50 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>
                {session.status?.toLowerCase() === "complete" ||
                session.status?.toLowerCase() === "paid"
                  ? "Your payment was processed successfully and your subscription is now active."
                  : "Your payment was received. If the status doesn't update immediately, it may take a moment."}
              </AlertDescription>
            </Alert>
          )}

          {!loading && session && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {session.customer_email && (
                <div>
                  <div className="text-muted-foreground">Email</div>
                  <div className="font-medium">{session.customer_email}</div>
                </div>
              )}
              {typeof session.amount_total === "number" && (
                <div>
                  <div className="text-muted-foreground">Amount</div>
                  <div className="font-medium">
                    {(session.amount_total / 100).toFixed(2)}{" "}
                    {session.currency?.toUpperCase()}
                  </div>
                </div>
              )}
              {session.status && (
                <div>
                  <div className="text-muted-foreground">Status</div>
                  <div className="font-medium capitalize">{session.status}</div>
                </div>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between">
          <Button asChild>
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/dashboard/billing">Manage Billing</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

function SuccessPage() {
  return (
    <Suspense fallback={<div className="px-[10%] py-6 min-h-screen" />}>
      <SuccessPageInner />
    </Suspense>
  );
}

export default SuccessPage;
