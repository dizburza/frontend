"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { thirdwebClient, wallets } from "@/app/client";
import { activeChain } from "@/constants/chain";
import { useActiveAccount, useConnect } from "thirdweb/react";
import { preAuthenticate } from "thirdweb/wallets/in-app";

type Step = "options" | "email-otp";

const inAppWallet = wallets[0];

export default function SignInCard() {
  const router = useRouter();
  const { connect, isConnecting } = useConnect();
  const [step, setStep] = useState<Step>("options");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sendingCode, setSendingCode] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const withErrorToast = async (run: () => Promise<unknown>) => {
    if (!agreed) {
      toast.error("Please accept the Terms & Privacy Policy to continue.");
      return;
    }
    try {
      await run();
    } catch {
      toast.error("Could not sign in. Please try again.");
    }
  };

  const connectWithStrategy = (strategy: "google" | "apple") =>
    withErrorToast(() =>
      connect(async () => {
        await inAppWallet.connect({ client: thirdwebClient, chain: activeChain, strategy });
        return inAppWallet;
      })
    );

  const connectWithPasskey = () =>
    withErrorToast(() =>
      connect(async () => {
        await inAppWallet.connect({
          client: thirdwebClient,
          chain: activeChain,
          strategy: "passkey",
          type: "sign-in",
        });
        return inAppWallet;
      })
    );

  const sendCode = async () => {
    if (!email.trim()) return;
    if (!agreed) {
      toast.error("Please accept the Terms & Privacy Policy to continue.");
      return;
    }
    setSendingCode(true);
    try {
      await preAuthenticate({ client: thirdwebClient, strategy: "email", email });
      setStep("email-otp");
    } catch {
      toast.error("Could not send a verification code. Please try again.");
    } finally {
      setSendingCode(false);
    }
  };

  const verifyCode = () =>
    withErrorToast(() =>
      connect(async () => {
        await inAppWallet.connect({
          client: thirdwebClient,
          chain: activeChain,
          strategy: "email",
          email,
          verificationCode: code,
        });
        return inAppWallet;
      })
    );

  // Connecting is followed by signing in and a redirect, none of which this
  // card sees. Releasing on `isConnecting` alone would unlock it for that gap,
  // which is the part that looks unresponsive and invites a second click.
  const account = useActiveAccount();

  // The redirect is what normally ends this, so anything that stops it leaves
  // the card locked with nothing to press. Waiting is right, waiting forever is
  // not: after this the overlay lifts and says so, which at least leaves a way
  // to try again.
  const [stalled, setStalled] = useState(false);

  useEffect(() => {
    if (!account?.address) {
      setStalled(false);
      return;
    }

    const timer = setTimeout(() => {
      setStalled(true);
      toast.error("Sign-in is taking longer than expected. Please try again.");
    }, 15_000);

    return () => clearTimeout(timer);
  }, [account?.address]);

  const busy = isConnecting || sendingCode || (Boolean(account?.address) && !stalled);

  return (
    <div
      aria-busy={busy}
      className={`relative w-full max-w-[532px] rounded-[40px] p-6 shadow-[0px_4px_78px_31px_rgba(69,74,222,0.08)] outline outline-[0.5px] outline-offset-[-0.5px] outline-brand-indigo-50 sm:p-10 ${
        busy ? "cursor-wait [&_*]:pointer-events-none" : ""
      }`}
    >
      {busy ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[40px] bg-white/70 backdrop-blur-[1px]">
          <div className="flex flex-col items-center gap-3">
            <span className="size-8 animate-spin rounded-full border-2 border-brand-indigo-100 border-t-brand-indigo" />
            <span className="font-inter text-sm text-gray-600">
              {account?.address ? "Signing you in..." : "Connecting..."}
            </span>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col items-center gap-8">
        <div className="flex w-full items-center justify-between">
          <span className="font-nohemi text-3xl text-zinc-800">Sign In</span>
          <button
            type="button"
            onClick={() => router.push("/")}
            aria-label="Close and return to the homepage"
            className="flex h-14 w-14 items-center justify-center rounded-full border-[0.5px] border-brand-indigo-100 bg-brand-indigo-50 transition-colors hover:bg-brand-indigo-100"
          >
            <Image src="/icons/close-circle.svg" alt="" width={24} height={24} aria-hidden />
          </button>
        </div>

        {step === "options" ? (
          <div className="flex w-full flex-col items-start gap-8">
            <div className="flex w-full flex-col items-start gap-4">
              <div className="flex w-full items-center gap-4">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => connectWithStrategy("google")}
                  className="flex h-12 flex-1 items-center justify-center gap-4 overflow-hidden rounded-lg bg-slate-50 px-6 py-4 outline outline-[0.3px] outline-offset-[-0.3px] outline-brand-indigo-100 disabled:opacity-50"
                >
                  <GoogleMark />
                  <span className="text-base font-medium text-gray-600">Google</span>
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => connectWithStrategy("apple")}
                  className="flex h-12 flex-1 items-center justify-center gap-4 overflow-hidden rounded-lg bg-slate-50 px-6 py-4 outline outline-[0.3px] outline-offset-[-0.3px] outline-brand-indigo-100 disabled:opacity-50"
                >
                  <AppleMark />
                  <span className="text-base font-medium text-gray-600">Apple</span>
                </button>
              </div>

              <form
                className="flex w-full items-center justify-between rounded-lg bg-slate-50 p-4 outline outline-1 outline-offset-[-1px] outline-brand-indigo-200"
                onSubmit={(e) => {
                  e.preventDefault();
                  void sendCode();
                }}
              >
                <div className="flex flex-1 items-center gap-2">
                  <MailIcon />
                  <input
                    type="email"
                    required
                    placeholder="Email Address"
                    value={email}
                    disabled={busy}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent text-sm text-gray-600 outline-none placeholder:text-gray-400"
                  />
                </div>
                <button type="submit" disabled={busy} aria-label="Continue with email">
                  <ChevronRightIcon />
                </button>
              </form>

              <button
                type="button"
                disabled={busy}
                onClick={connectWithPasskey}
                className="flex w-full items-center justify-between rounded-lg bg-slate-50 p-4 outline outline-1 outline-offset-[-1px] outline-brand-indigo-200 disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  <PasskeyIcon />
                  <span className="text-sm text-gray-600">Passkey</span>
                </div>
                <ChevronRightIcon />
              </button>
            </div>

            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="h-3.5 w-3.5 shrink-0 cursor-pointer appearance-none rounded-sm outline outline-1 outline-offset-[-1.17px] outline-brand-indigo-200 checked:bg-brand-indigo checked:bg-[url('/icons/check.svg')] checked:bg-center checked:bg-no-repeat checked:outline-brand-indigo"
              />
              <span className="text-xs text-gray-500">
                By creating an account, I agree to the{" "}
                <a
                  href="/terms"
                  onClick={(e) => e.stopPropagation()}
                  className="font-nohemi font-medium text-lime-700"
                >
                  Terms & Privacy Policy
                </a>
              </span>
            </label>
          </div>
        ) : (
          <form
            className="flex w-full flex-col items-start gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              void verifyCode();
            }}
          >
            <p className="text-sm text-gray-600">
              Enter the code sent to <span className="font-medium text-zinc-800">{email}</span>
            </p>
            <input
              type="text"
              inputMode="numeric"
              required
              placeholder="Verification code"
              value={code}
              disabled={busy}
              onChange={(e) => setCode(e.target.value)}
              className="w-full rounded-lg bg-slate-50 p-4 text-sm text-gray-600 outline outline-1 outline-offset-[-1px] outline-brand-indigo-200 placeholder:text-gray-400"
            />
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-brand-indigo px-6 py-4 text-base font-medium text-white disabled:opacity-50"
            >
              Verify
            </button>
            <button
              type="button"
              onClick={() => setStep("options")}
              className="text-sm text-gray-500 hover:text-gray-600"
            >
              Use a different sign-in method
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M19.6 10.23c0-.68-.06-1.36-.18-2.02H10v3.83h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.23c1.9-1.75 2.99-4.33 2.99-7.33Z"
        fill="#4285F4"
      />
      <path
        d="M10 20c2.7 0 4.96-.89 6.61-2.42l-3.23-2.5c-.9.6-2.05.95-3.38.95-2.6 0-4.8-1.75-5.59-4.12H1.08v2.59A10 10 0 0 0 10 20Z"
        fill="#34A853"
      />
      <path
        d="M4.41 11.9a6 6 0 0 1 0-3.83V5.49H1.08a10 10 0 0 0 0 9.01l3.33-2.6Z"
        fill="#FBBC05"
      />
      <path
        d="M10 3.96c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.6 9.6 0 0 0 10 0 10 10 0 0 0 1.08 5.49l3.33 2.59C5.2 5.71 7.4 3.96 10 3.96Z"
        fill="#EA4335"
      />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg width="18" height="20" viewBox="0 0 18 20" fill="none" aria-hidden>
      <path
        d="M14.7 10.6c0-2.1 1.72-3.11 1.8-3.16-.98-1.44-2.51-1.64-3.05-1.66-1.3-.13-2.53.77-3.19.77-.66 0-1.68-.75-2.76-.73-1.42.02-2.73.83-3.46 2.1-1.48 2.56-.38 6.35 1.06 8.43.7 1.02 1.53 2.16 2.63 2.12 1.06-.04 1.45-.68 2.73-.68 1.27 0 1.63.68 2.75.66 1.14-.02 1.86-1.03 2.55-2.06.8-1.18 1.13-2.33 1.14-2.39-.02-.01-2.19-.84-2.2-3.4Z"
        fill="black"
      />
      <path
        d="M12.7 4.24c.57-.7.96-1.66.85-2.62-.83.03-1.83.55-2.42 1.24-.53.61-.99 1.6-.87 2.53.92.07 1.86-.46 2.44-1.15Z"
        fill="black"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="1.33" y="2.33" width="13.33" height="10.33" rx="1.5" stroke="#9CA3AF" />
      <path d="M2 3.5 8 8.5l6-5" stroke="#9CA3AF" />
    </svg>
  );
}

function PasskeyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="6.5" cy="4.5" r="2" stroke="#9CA3AF" />
      <path d="M2.67 12.83c0-2.13 1.72-3.5 3.83-3.5s3.83 1.37 3.83 3.5" stroke="#9CA3AF" />
      <path d="M11.62 8.63 15 12l-1 1-1-1-1 1" stroke="#9CA3AF" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M5.94 2.72 10.67 8l-4.73 5.28" stroke="#9CA3AF" strokeWidth="1" />
    </svg>
  );
}
