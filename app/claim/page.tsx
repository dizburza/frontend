"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ConnectWallet from "@/components/ConnectWallet";
import { useToken } from "@/hooks/useToken";
import { hasSessionFor } from "@/lib/session";
import {
  claimAddressFor,
  claimCashLink,
  getPublicLink,
  readLinkKey,
  signClaim,
  type PublicLink,
} from "@/lib/cashlink";

/**
 * The claim page.
 *
 * It shows an amount and a countdown, and that is the whole design. Not who
 * sent it, not what they called it. Anyone holding the link reaches this page,
 * and there is no way to know who that is, so nothing here may disclose a
 * person to them.
 *
 * The link's key is read out of the URL fragment and kept in a ref. It is never
 * put in state that could be serialised, never sent to the server, and the
 * address bar is cleared the moment it has been read.
 */
export default function ClaimPage() {
  const account = useActiveAccount();
  const { symbol, logoUrl } = useToken();

  const linkKey = useRef<`0x${string}` | null>(null);
  const [claimAddress, setClaimAddress] = useState<string | null>(null);
  const [link, setLink] = useState<PublicLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const key = readLinkKey();

    if (!key) {
      setError("This link is not complete. Ask the sender to send it again.");
      setLoading(false);
      return;
    }

    linkKey.current = key;
    const address = claimAddressFor(key);
    setClaimAddress(address);

    getPublicLink(address)
      .then(setLink)
      .catch(() => setError("This link does not exist."))
      .finally(() => setLoading(false));
  }, []);

  const signedIn = hasSessionFor(account?.address);

  const handleClaim = useCallback(async () => {
    if (!linkKey.current || !claimAddress || !account?.address) return;

    setClaiming(true);
    try {
      const signature = await signClaim(linkKey.current, account.address);
      await claimCashLink(claimAddress, signature);

      // The key has done its only job, and there is no reason to keep it.
      linkKey.current = null;
      setClaimed(true);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not claim this link";
      toast.error(message);

      // Refresh rather than guess: the refusal may be that someone else has it.
      getPublicLink(claimAddress).then(setLink).catch(() => undefined);
    } finally {
      setClaiming(false);
    }
  }, [account?.address, claimAddress]);

  return (
    <div className="min-h-screen bg-[#F9F9FE] flex flex-col">
      <header className="bg-white h-[80px] flex items-center px-8 border-b border-gray-200">
        <Link href="/" className="inline-flex">
          <Image src="/logo.svg" alt="Dizburza" width={150} height={40} priority />
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md p-8 text-center">
          {loading && <p className="text-gray-500">Opening your link...</p>}

          {!loading && error && (
            <>
              <h1 className="text-xl font-semibold text-gray-900">Link unavailable</h1>
              <p className="mt-3 text-gray-600">{error}</p>
            </>
          )}

          {!loading && !error && link && (
            <>
              <div className="flex items-center justify-center gap-2">
                <Image
                  src={logoUrl}
                  alt={symbol}
                  width={28}
                  height={28}
                  className="rounded-full"
                />
                <span className="text-sm font-medium text-gray-500">{symbol}</span>
              </div>

              <p className="mt-4 text-4xl font-semibold text-gray-900">
                {link.amountFormatted}
              </p>

              {claimed ? (
                <Claimed symbol={symbol} />
              ) : (
                <Body
                  link={link}
                  signedIn={signedIn}
                  connected={Boolean(account?.address)}
                  claiming={claiming}
                  onClaim={handleClaim}
                />
              )}
            </>
          )}
        </Card>
      </main>
    </div>
  );
}

function Claimed({ symbol }: Readonly<{ symbol: string }>) {
  return (
    <>
      <p className="mt-4 text-gray-600">
        Claimed. Your {symbol} balance will update in a moment.
      </p>
      <Link href="/personal" className="mt-6 inline-block">
        <Button className="w-full">Go to your account</Button>
      </Link>
    </>
  );
}

function Body({
  link,
  signedIn,
  connected,
  claiming,
  onClaim,
}: Readonly<{
  link: PublicLink;
  signedIn: boolean;
  connected: boolean;
  claiming: boolean;
  onClaim: () => void;
}>) {
  if (link.state === "settled") {
    return <p className="mt-4 text-gray-600">This link has already been claimed.</p>;
  }

  if (link.state === "expired") {
    return (
      <p className="mt-4 text-gray-600">
        This link has expired and the money has gone back to the sender.
      </p>
    );
  }

  if (link.state === "claiming") {
    return (
      <p className="mt-4 text-gray-600">
        Someone else is claiming this link right now. If that was not you, it has
        already gone.
      </p>
    );
  }

  return (
    <>
      <Countdown expiresAt={link.expiresAt} />

      {!connected && (
        <div className="mt-6">
          <p className="mb-4 text-sm text-gray-600">
            Sign in to claim it. The money lands in your Dizburza account.
          </p>
          <ConnectWallet label="Sign in to claim" />
        </div>
      )}

      {connected && !signedIn && (
        <p className="mt-6 text-sm text-gray-600">
          Finishing signing you in. Approve the signature in your wallet.
        </p>
      )}

      {connected && signedIn && (
        <Button className="mt-6 w-full" onClick={onClaim} disabled={claiming}>
          {claiming ? "Claiming..." : "Claim"}
        </Button>
      )}
    </>
  );
}

/**
 * A twelve hour window is short enough that the exact time matters, so this
 * counts rather than printing a date.
 */
function Countdown({ expiresAt }: Readonly<{ expiresAt: string }>) {
  const [remaining, setRemaining] = useState(() => Date.parse(expiresAt) - Date.now());

  useEffect(() => {
    const timer = setInterval(
      () => setRemaining(Date.parse(expiresAt) - Date.now()),
      1000
    );
    return () => clearInterval(timer);
  }, [expiresAt]);

  if (remaining <= 0) return <p className="mt-2 text-sm text-gray-500">Expired</p>;

  const hours = Math.floor(remaining / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1000);

  const text =
    hours > 0
      ? `${hours}h ${minutes}m left to claim`
      : `${minutes}m ${seconds}s left to claim`;

  return <p className="mt-2 text-sm text-gray-500">{text}</p>;
}
