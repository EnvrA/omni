"use client";

import useSWR from "swr";
import { useState } from "react";

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
    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-300 text-xs font-medium text-gray-700">
      {label}
    </div>
  )

  return (
    <div className="p-6 flex flex-col sm:flex-row gap-6 h-[calc(100vh-3rem)]">
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
      <main className="flex-1 flex flex-col">
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
            <ul className="flex-1 overflow-y-auto space-y-3 pr-2">
              {messages?.messages?.map((m: any) => (
                <li
                  key={m.id}
                  className={`flex items-end gap-2 ${
                    m.direction === 'OUT' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {m.direction !== 'OUT' && <Avatar label={contactInitials} />}
                  <div
                    className={`rounded-xl px-3 py-2 max-w-[70%] text-sm break-words ${
                      m.direction === 'OUT'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p>{m.body}</p>
                    <span className="mt-1 block text-[10px] text-gray-500">
                      {new Date(m.sentAt).toLocaleString()}
                    </span>
                  </div>
                  {m.direction === 'OUT' && <Avatar label="You" />}
                </li>
              ))}
            </ul>
            {/* Outbound Message Input + Send Button */}
            <form
              onSubmit={sendMessage}
              className="sticky bottom-0 left-0 right-0 mt-4 flex gap-2 bg-white p-2 sm:static"
            >
              <input
                className="border rounded px-2 py-1 flex-1"
                placeholder="Type a message…"
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                disabled={!contactId}
                autoFocus
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-3 py-1 rounded"
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
