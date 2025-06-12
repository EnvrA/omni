"use client";

import useSWR from 'swr'
import { useState } from 'react'
import Link from 'next/link'

// -- use this robust fetcher --
const fetcher = async (url: string) => {
  const res  = await fetch(url)
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    return { error: text }
  }
}

export default function Dashboard() {
  // contacts for the signed-in user
  const { data: contacts } = useSWR('/api/contacts', fetcher)
  const [contactId, setContactId] = useState<string>()

  // messages for the selected contact
  const { data: messages } = useSWR(
    contactId ? `/api/messages?contactId=${contactId}` : null,
    fetcher
  )

  return (
    <div className="p-6 flex gap-6">
      {/* CONTACT LIST */}
      <aside className="w-64">
        <h2 className="font-bold mb-2">Contacts</h2>
        <ul>
          {contacts?.contacts?.map((c: any) => (
            <li key={c.id}>
              <button
                className={`block w-full text-left px-2 py-1 rounded ${
                  c.id === contactId ? 'bg-gray-200' : ''
                }`}
                onClick={() => setContactId(c.id)}
              >
                {c.name || c.email || c.phone}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* MESSAGE THREAD */}
      <main className="flex-1">
        {!contactId && <p>Select a contact →</p>}
        {contactId && (
          <>
            <h2 className="font-bold mb-2">Messages</h2>
            <ul className="space-y-2">
              {messages?.messages?.map((m: any) => (
                <li key={m.id} className="p-2 bg-gray-100 rounded">
                  <small className="text-xs text-gray-500">
                    {new Date(m.sentAt).toLocaleString()}
                  </small>
                  <p>{m.body}</p>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
    </div>
  )
}
