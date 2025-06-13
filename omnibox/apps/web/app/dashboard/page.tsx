"use client";

import useSWR from "swr";
import { useState } from "react";

// Robust fetcher handles non-JSON gracefully
const fetcher = async (url: string) => {
  const res = await fetch(url)
  const text = await res.text()
  console.log(`Fetcher got for ${url}:`, text); // <--- ADDED LOGGING
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
  const { data: messages, error: messagesError, mutate: mutateMessages } = useSWR(
    contactId ? `/api/messages?contactId=${contactId}` : null,
    fetcher
  )

  // State for the new outbound message
  const [messageBody, setMessageBody] = useState("")

  // Handler for sending a message
  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!contactId || !messageBody.trim()) return
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactId, body: messageBody }),
    })
    if (res.ok) {
      setMessageBody("")
      if (mutateMessages) mutateMessages()
    }
  }

  const selectedContact = contacts?.contacts?.find((c: any) => c.id === contactId)

  const contactInitials = selectedContact?.name
    ? selectedContact.name
        .split(" ")
        .map((p: string) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?"

  const Avatar = ({ label }: { label: string }) => (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 text-xs font-medium text-gray-700">
      {label}
    </div>
  )

  return (
    <div className="flex flex-col gap-6 p-6 sm:flex-row h-[calc(100vh-3rem)]">
      {/* CONTACT LIST */}
      <aside className="flex-shrink-0 sm:w-64 border-gray-200 sm:border-r overflow-y-auto">
        <h2 className="px-2 pb-2 text-lg font-semibold">Contacts</h2>
        {contactsError && (
          <div className="mb-2 px-2 text-red-500">
            Error loading contacts: {contactsError.message || String(contactsError)}
          </div>
        )}
        <ul className="space-y-1 px-2 pb-4">
          {contacts?.contacts?.map((c: any) => (
            <li key={c.id}>
              <button
                className={`flex w-full items-center gap-2 rounded px-3 py-2 text-left hover:bg-gray-100 ${
                  c.id === contactId ? 'bg-gray-200 font-medium' : ''
                }`}
                onClick={() => setContactId(c.id)}
              >
                <Avatar label={
                  c.name
                    ? c.name
                        .split(' ')
                        .map((p: string) => p[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()
                    : '?'
                } />
                <span className="truncate">{c.name || c.email || c.phone}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* MESSAGE THREAD */}
      <main className="flex h-full flex-1 flex-col">
        {!contactId && (
          <div className="flex flex-1 items-center justify-center text-gray-500">
            Select a contact
          </div>
        )}
        {contactId && (
          <>
            <div className="border-b border-gray-200 px-4 py-2 font-semibold">
              {selectedContact?.name || selectedContact?.email || selectedContact?.phone}
            </div>
            {messagesError && (
              <div className="mb-2 px-4 text-red-500">
                Error loading messages: {messagesError.message || String(messagesError)}
              </div>
            )}
            <ul className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages?.messages?.map((m: any) => (
                <li key={m.id} className={`flex ${m.direction === 'OUT' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex items-end gap-2 ${m.direction === 'OUT' ? 'flex-row-reverse' : ''}`}>
                    <Avatar label={m.direction === 'OUT' ? 'You' : contactInitials} />
                    <div
                      className={`max-w-[70%] break-words rounded-lg px-3 py-2 text-sm ${
                        m.direction === 'OUT' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p>{m.body}</p>
                      <span className="mt-1 block text-[10px] text-gray-500">
                        {new Date(m.sentAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <form onSubmit={sendMessage} className="flex gap-2 border-t border-gray-200 p-4">
              <input
                className="flex-1 rounded border px-3 py-2"
                placeholder="Type a message…"
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                disabled={!contactId}
                autoFocus
              />
              <button
                type="submit"
                className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
                disabled={!contactId || !messageBody.trim()}
              >
                Send
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  )
}
