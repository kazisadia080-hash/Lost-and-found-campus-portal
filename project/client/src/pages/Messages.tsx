import { useEffect, useState, useRef } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import type { Conversation, Message } from '../types';
import { Loader2, Send, ArrowLeft, Mail, MessageSquare } from 'lucide-react';
import { toast } from '../components/Toast';

export default function Messages() {
  const { userId } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeMessages, setActiveMessages] = useState<Message[]>([]);
  const [partner, setPartner] = useState<{ _id: string; name: string; email: string } | null>(null);
  const [sharedItem, setSharedItem] = useState<{ _id: string; title: string } | null>(null);
  const [itemIdQuery, setItemIdQuery] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.conversations()
      .then((data) => setConversations(data.conversations || []))
      .catch((e) => toast(e.message, 'error'))
      .finally(() => setLoadingList(false));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setItemIdQuery(params.get('itemId'));
  }, [location.search]);

  useEffect(() => {
    if (!userId) return;
    setLoadingChat(true);
    api.getMessages(userId)
      .then((data) => {
        setActiveMessages(data.messages || []);
        setPartner(data.partner || null);
        const item = data.messages?.find((m) => m.item)?.item;
        if (item) {
          setSharedItem(item);
        } else {
          setSharedItem(null);
        }
      })
      .catch((e) => toast(e.message, 'error'))
      .finally(() => setLoadingChat(false));
  }, [userId]);

  useEffect(() => {
    if (!itemIdQuery) return;
    if (sharedItem?._id === itemIdQuery) return;

    api.getItem(itemIdQuery)
      .then((data) => {
        if (data._id && data.title) {
          setSharedItem({ _id: data._id, title: data.title });
        }
      })
      .catch(() => {
        // ignore missing item details for temporary query context
      });
  }, [itemIdQuery, sharedItem]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || !userId) return;
    setSending(true);
    try {
      const payload: { text: string; itemId?: string } = { text: text.trim() };
      if (itemIdQuery) {
        payload.itemId = itemIdQuery;
      } else if (sharedItem?._id) {
        payload.itemId = sharedItem._id;
      }
      const { message } = await api.sendMessage(userId, payload);
      setActiveMessages((prev) => [...prev, message]);
      setText('');
      api.conversations().then((data) => setConversations(data.conversations || []));
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold text-slate-900">
        <MessageSquare size={24} /> Messages
      </h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {/* Conversation list */}
        <div className="sm:col-span-1">
          <div className="card overflow-hidden">
            <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">
              Conversations
            </div>
            {loadingList ? (
              <div className="flex items-center justify-center py-8 text-slate-400">
                <Loader2 size={20} className="animate-spin" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-400">
                No conversations yet. Start chatting from an item's comment section or claim.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {conversations.map((c) => (
                  <button
                    key={c.user._id}
                    onClick={() => navigate(`/messages/${c.user._id}`)}
                    className={`flex w-full items-center gap-2 px-4 py-3 text-left transition hover:bg-slate-50 ${
                      userId === c.user._id ? 'bg-primary-50' : ''
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{c.user.name}</p>
                      <p className="truncate text-xs text-slate-400">{c.lastMessage || '—'}</p>
                    </div>
                    {c.unread > 0 && (
                      <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary-600 px-1 text-[10px] font-bold text-white">
                        {c.unread}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="sm:col-span-2 lg:col-span-3">
          {!userId ? (
            <div className="card flex flex-col items-center gap-3 p-12 text-center text-slate-400">
              <MessageSquare size={40} />
              <p className="font-medium text-slate-600">Select a conversation to start chatting.</p>
            </div>
          ) : (
            <div className="card flex h-[600px] flex-col">
              {/* Header */}
              <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
                <Link to="/messages" className="sm:hidden">
                  <ArrowLeft size={18} className="text-slate-400" />
                </Link>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">{partner?.name || 'Loading…'}</p>
                  <p className="flex items-center gap-1 text-xs text-slate-400">
                    <Mail size={12} /> {partner?.email || ''}
                  </p>
                  {sharedItem ? (
                    <Link
                      to={`/items/${sharedItem._id}`}
                      className="mt-1 inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-600 transition hover:bg-slate-100"
                    >
                      Post: {sharedItem.title}
                    </Link>
                  ) : null}
                  {!sharedItem && itemIdQuery ? (
                    <span className="mt-1 inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-600">
                      Shared post available
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-2 p-4">
                {loadingChat ? (
                  <div className="flex items-center justify-center py-12 text-slate-400">
                    <Loader2 size={20} className="animate-spin" />
                  </div>
                ) : activeMessages.length === 0 ? (
                  <div className="flex items-center justify-center py-12 text-sm text-slate-400">
                    No messages yet. Say hello!
                  </div>
                ) : (
                  activeMessages.map((m) => {
                    const isMe = m.sender?._id === user?._id;
                    return (
                      <div key={m._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                            isMe
                              ? 'rounded-br-sm bg-primary-600 text-white'
                              : 'rounded-bl-sm bg-slate-100 text-slate-800'
                          }`}
                        >
                          <p>{m.text}</p>
                          <p className={`mt-1 text-[10px] ${isMe ? 'text-primary-100' : 'text-slate-400'}`}>
                            {new Date(m.createdAt).toLocaleString(undefined, {
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={endRef} />
              </div>

              {/* Input */}
              <form onSubmit={send} className="flex gap-2 border-t border-slate-100 p-3">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type a message…"
                  maxLength={1000}
                  className="input flex-1"
                />
                <button type="submit" disabled={sending || !text.trim()} className="btn-primary">
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
