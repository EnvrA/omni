/* apps/web/app/signin/page.tsx */
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  async function handleSend() {
    if (!email) return;
    setStatus('sending');

    // `signIn` returns a promise; we redirect manually so `redirect: false`
    const res = await signIn('email', {
      email,
      redirect: false,           // stay on this page
      callbackUrl: '/',          // where to land after e-mail link
    });

    if (res?.ok) setStatus('sent');
    else {
      setStatus('idle');
      alert('Something went wrong. Is the e-mail correct?');
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold">Sign in</h1>

      {status === 'sent' ? (
        <p className="text-green-600">
          Magic link sent! Check your inbox.
        </p>
      ) : (
        <>
          <input
            className="border rounded px-3 py-2 w-64"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button
            onClick={handleSend}
            disabled={status === 'sending'}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {status === 'sending' ? 'Sending…' : 'Send magic link'}
          </button>
        </>
      )}
    </main>
  );
}
