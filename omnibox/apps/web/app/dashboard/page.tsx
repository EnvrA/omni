"use client";

import useSWR from 'swr'
import { useState } from 'react'
import Link from 'next/link'

// Robust fetcher handles non-JSON gracefully
const fetcher = async (url: string) => {
  const res = await fetch(url)
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    return { error: text }
  }
}

export default function Dashboard() {
  // contacts for the signed-in user
  const { data: contacts, error: contactsError } = useSWR('/api/contacts', fetcher)
  const [contactId, setContactId] = useState<string>()

  // messages for the selected contact
  const { data: messages, error: messagesError } = useSWR(
    contactId ? `/api/messages?contactId=${contactId}` : null,
    fetcher
  )

  return (
    <div className="p-6 flex gap-6">
      {/* CONTACT LIST */}
      <aside className="w-64">
        <h2 className="font-bold mb-2">Contacts</h2>
        {/* Show error if contacts failed to load */}
        {contactsError && (
          <div className="text-red-500 mb-2">
            Error loading contacts: {contactsError.message || String(contactsError)}
          </div>
        )}
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
            {/* Show error if messages failed to load */}
            {messagesError && (
              <div className="text-red-500 mb-2">
                Error loading messages: {messagesError.message || String(messagesError)}
              </div>
            )}
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
