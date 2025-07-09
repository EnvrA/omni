"use client";

import useSWR from "swr";
import { useMemo, useState, Fragment } from "react";
import { Textarea, Button, Avatar, Spinner } from "@/components/ui";
import { Clock, Send } from "lucide-react";

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

  const sortedMessages = useMemo(() => {
    if (!messages?.messages) return [] as any[];
    return [...messages.messages].sort(
      (a: any, b: any) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
    );
  }, [messages]);


  return (
    <div className="flex h-screen flex-col gap-4 bg-gray-50 p-4 sm:flex-row overflow-hidden">
      {/* CONTACT LIST */}
      <aside className="flex-shrink-0 overflow-y-auto sm:w-64 sm:border-r sm:border-gray-200 pr-4 sm:pr-0">
        <h2 className="px-2 pb-3 text-lg font-semibold">Contacts</h2>
        {contactsError && (
          <div className="mb-2 px-2 text-red-500">
            Error loading contacts: {contactsError.message || String(contactsError)}
          </div>
        )}
        {!contacts && !contactsError && (
          <div className="flex justify-center py-4">
            <Spinner />
          </div>
        )}
        <ul className="px-2 pb-4 text-sm divide-y divide-transparent">
          {uniqueContacts.map((c: any) => (
            <li key={c.id}>
              <button
                className={`flex w-full items-center gap-3 rounded px-3 py-3 text-left hover:bg-[#F5F5F5] focus:outline-none ${
                  c.id === contactId ? "bg-blue-50" : ""
                }`}
                onClick={() => setContactId(c.id)}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#DDEEFF] text-sm font-medium text-gray-800">
                  {c.name
                    ? c.name
                        .split(" ")
                        .map((p: string) => p[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()
                    : "?"}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-base font-bold">
                    {c.name || c.email || c.phone}
                  </div>
                  <div className="truncate text-sm text-[#666]">
                    {c.lastMessageBody ?? ''}
                  </div>
                </div>
                {c.lastMessageAt && (
                  <span className="ml-auto pl-2 text-xs text-[#999]">
                    {new Date(c.lastMessageAt).toLocaleDateString()}
                  </span>
                )}
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
              {sortedMessages.map((m: any, idx: number) => {
                const prev = sortedMessages[idx - 1];
                const curDay = new Date(m.sentAt).toDateString();
                const prevDay = prev ? new Date(prev.sentAt).toDateString() : null;
                const showDay = idx === 0 || curDay !== prevDay;
                return (
                  <Fragment key={m.id}>
                    {showDay && (
                      <li className="text-center text-xs text-[#AAA]">
                        {new Date(m.sentAt).toLocaleDateString(undefined, {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </li>
                    )}
                    <li
                      className={`flex ${m.direction === "OUT" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`flex items-end gap-2 ${m.direction === "OUT" ? "flex-row-reverse" : ""}`}
                      >
                        <Avatar label={m.direction === "OUT" ? "You" : contactInitials} />
                        <div
                          className={`max-w-[75%] break-words rounded-lg px-3 py-2 text-sm leading-[1.4] ${
                            m.direction === "OUT"
                              ? "bg-[#1F8A70] text-white"
                              : "bg-[#F0F0F0] text-gray-900"
                          }`}
                        >
                          <p>{m.body}</p>
                          <span className="mt-1 flex items-center justify-end text-xs text-gray-500">
                            {new Date(m.sentAt).toLocaleTimeString()}
                            <Clock className="ml-1 h-3 w-3 text-[#999]" aria-hidden="true" />
                          </span>
                        </div>
                      </div>
                    </li>
                  </Fragment>
                );
              })}
            </ul>
            <form
              onSubmit={sendMessage}
              className="sticky bottom-0 left-0 right-0 flex flex-wrap items-start gap-2 border-t border-[#DDD] bg-white p-4"
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
              <div className="relative flex-1">
                <Textarea
                  className="w-full rounded-lg pr-10 min-h-12"
                  placeholder="Type a message…"
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  disabled={!contactId}
                  autoFocus
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 disabled:opacity-40"
                  disabled={!contactId || !messageBody.trim()}
                  aria-label="Send message"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
