export default function SignIn() {
  return (
    <form action="/auth/signin/email" method="post" className="space-y-4 p-4">
      <label className="block">
        <span>Email</span>
        <input
          type="email"
          name="email"
          required
          className="border p-2 w-full"
        />
      </label>
      <button type="submit" className="bg-blue-600 text-white px-4 py-2">
        Send magic link
      </button>
    </form>
  );
}
