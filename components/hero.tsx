import ConnectWallet from "./ConnectWallet";

export default function Hero() {
  return (
    <section className="flex h-full flex-col items-center justify-center px-8 text-center">
      <h1 className="text-6xl font-bold mb-4 max-w-3xl leading-tight">
        The Smarter Way to
        <br />
        <span>Pay and Disburse.</span>
      </h1>
      <p className="text-lg text-gray-600 mb-8 max-w-2xl">Manage all payment disbursements in one simple place.</p>
      <ConnectWallet
        label="Get Started"
        connectButtonClassName="!h-11 !px-7 !text-base"
      />
    </section>
  )
}
