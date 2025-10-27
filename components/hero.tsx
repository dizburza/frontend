import Link from "next/link";

export default function Hero() {
  return (
    <section className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-8 text-center">
      <h1 className="text-6xl font-bold mb-4 max-w-3xl leading-tight">
        The Smarter Way to
        <br />
        <span>Pay and Disburse.</span>
      </h1>
      <p className="text-lg text-gray-600 mb-8 max-w-2xl">Manage all payment disbursements in one simple place.</p>
      <Link href="/setup-profile"><button className="px-8 py-3 bg-[#454ADE] text-white rounded-lg hover:bg-gray-900 font-medium" >Get Started</button></Link>
    </section>
  )
}
