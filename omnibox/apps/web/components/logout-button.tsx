'use client';

import { signOut } from 'next-auth/react';

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="w-full rounded px-2 py-1 text-left hover:bg-gray-100"
    >
      Log out
    </button>
  );
}
