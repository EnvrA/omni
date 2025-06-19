"use client";

import useSWR from "swr";
import { useMemo, useState } from "react";
import { Input, Button, Avatar } from "@/components/ui";

// Robust fetcher handles non-JSON gracefully
const fetcher = async (url: string) => {
  const res = await fetch(url);
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
};

export default function InboxPage() {
  // contacts for the signed-in user
  const { data: contacts, error: contactsError } = useSWR(
    "/api/contacts",
    fetcher,
  );
  const [contactId, setContactId] = useState<string>();

  // quick replies for dropdown
  const { data: quickReplies } = useSWR("/api/quick-replies", fetcher);

  // messages for the selected contact
  const {
    data: messages,
    error: messagesError,
    mutate: mutateMessages,
  } = useSWR(
    contactId ? `/api/messages?contactId=${contactId}` : null,
    fetcher,
  );

  // State for the new outbound message
  const [messageBody, setMessageBody] = useState("");

  // Handler for sending a message
  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!contactId || !messageBody.trim()) return;
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactId, body: messageBody }),
    });
    if (res.ok) {
      setMessageBody("");
      if (mutateMessages) mutateMessages();
    }
  }

  const selectedContact = contacts?.contacts?.find(
    (c: any) => c.id === contactId,
  );

  const uniqueContacts = useMemo(() => {
    if (!contacts?.contacts) return [] as any[];
    return Array.from(
      new Map(contacts.contacts.map((c: any) => [c.id, c])).values(),
    );
  }, [contacts]);

  const contactInitials = selectedContact?.name
    ? selectedContact.name
        .split(" ")
        .map((p: string) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";


  return (
    <div className="flex h-screen flex-col gap-4 bg-gray-50 p-4 sm:flex-row overflow-hidden">
      {/* CONTACT LIST */}
      <aside className="flex-shrink-0 overflow-y-auto sm:w-64 sm:border-r sm:border-gray-200 pr-4 sm:pr-0">
        <h2 className="px-2 pb-3 text-lg font-semibold">Contacts</h2>
        {contactsError && (
          <div className="mb-2 px-2 text-red-500">
            Error loading contacts:{" "}
            {contactsError.message || String(contactsError)}
          </div>
        )}
        <ul className="space-y-1 px-2 pb-4 text-sm">
          {uniqueContacts.map((c: any) => (
            <li key={c.id}>
              <button
                className={`flex w-full items-center gap-2 rounded px-3 py-2 text-left hover:bg-gray-100 focus:outline-none ${
                  c.id === contactId ? "bg-blue-100 text-blue-700 font-medium" : ""
                }`}
                onClick={() => setContactId(c.id)}
              >
                <Avatar
                  label={
                    c.name
                      ? c.name
                          .split(" ")
                          .map((p: string) => p[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()
                      : "?"
                  }
                />
                <span className="flex-1 truncate">{c.name || c.email || c.phone}</span>
                <span className="text-xs text-gray-500">{c.lastMessageBody ?? ''}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* MESSAGE THREAD */}
      <main className="relative flex h-full flex-1 flex-col overflow-hidden rounded-lg bg-white shadow">
        {!contactId && (
          <div className="flex flex-1 items-center justify-center text-gray-500">
            Select a contact
          </div>
        )}
        {contactId && (
          <>
            <div className="border-b border-gray-200 px-4 py-2 font-semibold">
              {selectedContact?.name ||
                selectedContact?.email ||
                selectedContact?.phone}
            </div>
            {messagesError && (
              <div className="mb-2 px-4 text-red-500">
                Error loading messages:{" "}
                {messagesError.message || String(messagesError)}
              </div>
            )}
            <ul className="flex-1 space-y-4 overflow-y-auto p-4 scrollbar-thin">
              {messages?.messages?.map((m: any) => (
                <li
                  key={m.id}
                  className={`flex ${m.direction === "OUT" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`flex items-end gap-2 ${m.direction === "OUT" ? "flex-row-reverse" : ""}`}
                  >
                    <Avatar
                      label={m.direction === "OUT" ? "You" : contactInitials}
                    />
                    <div
                      className={`max-w-[60%] break-words rounded-lg px-3 py-2 text-sm ${
                        m.direction === "OUT"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <p>{m.body}</p>
                      <span className="mt-1 block text-xs text-gray-500">
                        {new Date(m.sentAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <form
              onSubmit={sendMessage}
              className="sticky bottom-0 left-0 right-0 flex flex-wrap gap-2 border-t border-gray-200 bg-white p-4"
            >
              <select
                className="max-w-xs rounded border p-1 shadow-sm"
                onChange={(e) => {
                  if (e.target.value) {
                    setMessageBody(e.target.value);
                    e.currentTarget.selectedIndex = 0;
                  }
                }}
                aria-label="Quick replies"
                disabled={!contactId}
              >
                <option value="">Quick reply…</option>
                {quickReplies?.quickReplies?.map((qr: any) => (
                  <option key={qr.id} value={qr.text}>
                    {qr.label}
                  </option>
                ))}
              </select>
              <Input
                className="flex-1"
                placeholder="Type a message…"
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                disabled={!contactId}
                autoFocus
              />
              <Button type="submit" disabled={!contactId || !messageBody.trim()}
              >
                Send
              </Button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
