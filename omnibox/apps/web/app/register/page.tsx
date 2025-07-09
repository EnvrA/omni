import Link from "next/link";
import { serverSession } from "@/lib/auth";
import { redirect } from "next/navigation";

const EMPLOYEES = [
  "0-5",
  "6-15",
  "16-30",
  "31-50",
  "51-100",
  "100+",
];

export default async function RegisterPage() {
  const session = await serverSession();
  if (session) {
    const email = session.user?.email ?? "";
    if (email === process.env.ADMIN_EMAIL) {
      redirect("/admin/dashboard");
    } else {
      redirect("/dashboard");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#e0f3ff] to-[#f0e0ff] flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-[800px]">
        <div className="grid md:grid-cols-2 rounded-2xl shadow-lg overflow-hidden">
          <form className="bg-white p-8 space-y-6">
            <h2 className="text-lg font-semibold">General Infomation</h2>
            <input
              type="text"
              placeholder="Company Name"
              className="w-full bg-transparent border-b border-gray-300 p-3 placeholder-gray-400 text-sm focus:outline-none"
            />
            <input
              type="text"
              placeholder="Street + Nr"
              className="w-full bg-transparent border-b border-gray-300 p-3 placeholder-gray-400 text-sm focus:outline-none"
            />
            <input
              type="text"
              placeholder="Additional Information"
              className="w-full bg-transparent border-b border-gray-300 p-3 placeholder-gray-400 text-sm focus:outline-none"
            />
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Zip Code"
                className="w-1/2 bg-transparent border-b border-gray-300 p-3 placeholder-gray-400 text-sm focus:outline-none"
              />
              <input
                type="text"
                placeholder="Place"
                className="w-1/2 bg-transparent border-b border-gray-300 p-3 placeholder-gray-400 text-sm focus:outline-none"
              />
            </div>
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Phone Number"
                className="w-full bg-transparent border-b border-gray-300 p-3 placeholder-gray-400 text-sm focus:outline-none"
              />
            </div>
            <div className="flex gap-4">
              <label className="w-full text-sm text-gray-600">
                <span className="mb-1 block">Company Size</span>
                <select
                  className="w-full bg-transparent border-b border-gray-300 p-3 text-sm text-gray-500 focus:outline-none"
                >
                  {EMPLOYEES.map((e) => (
                    <option key={e}>{e}</option>
                  ))}
                </select>
              </label>
            </div>
          </form>
          <form className="bg-[#4e5cf8] text-white p-8 space-y-6">
            <h2 className="text-lg font-semibold">Contact Details</h2>
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="First Name"
                className="w-1/2 bg-transparent border-b border-white/70 p-3 placeholder-white/70 text-sm focus:outline-none"
              />
              <input
                type="text"
                placeholder="Last Name"
                className="w-1/2 bg-transparent border-b border-white/70 p-3 placeholder-white/70 text-sm focus:outline-none"
              />
            </div>
            <input
              type="text"
              placeholder="Your Email"
              className="w-full bg-transparent border-b border-white/70 p-3 placeholder-white/70 text-sm focus:outline-none"
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full bg-transparent border-b border-white/70 p-3 placeholder-white/70 text-sm focus:outline-none"
            />
            <input
              type="password"
              placeholder="Confirm Password"
              className="w-full bg-transparent border-b border-white/70 p-3 placeholder-white/70 text-sm focus:outline-none"
            />
            <input
              type="text"
              placeholder="Your Name"
              className="w-full bg-transparent border-b border-white/70 p-3 placeholder-white/70 text-sm focus:outline-none"
            />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="h-4 w-4" />
              <span>
                I do accept the{' '}
                <a href="#" className="underline">
                  Terms and Conditions
                </a>{' '}
                of your site.
              </span>
            </label>
            <div className="text-center">
              <button
                type="submit"
                className="bg-white text-black px-6 py-3 rounded-full font-medium"
              >
                Register
              </button>
            </div>
          </form>
        </div>
        <div className="text-center mt-4 space-x-2">
          <span>If you already have an account, please go to</span>
          <Link href="/login">
            <button className="bg-green-500 text-white px-4 py-2 rounded">
              Login
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

