import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import type { Item, Claim, Comment } from '../types';
import UserActionMenu from '../components/UserActionMenu';
import {
  MapPin,
  Calendar,
  User as UserIcon,
  Mail,
  Phone,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  ShieldCheck,
  PackageCheck,
  Undo2,
  MessageSquare,
  Send,
  Pencil,
} from 'lucide-react';
import { toast } from '../components/Toast';

export default function ItemDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [item, setItem] = useState<Item | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImg, setActiveImg] = useState(0);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [myClaim, setMyClaim] = useState<Claim | null>(null);
  const [commentText, setCommentText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [replyTo, setReplyTo] = useState<Comment | null>(null);

  const isOwner = user && item?.postedBy?._id === user._id;
  const canClaim = user && !isOwner;

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    const load = async () => {
      try {
        const data = await api.getItem(id!);
        if (!mounted) return;
        setItem(data.item);

        const commentsPromise = api.itemComments(id!);
        const myClaimPromise = user ? api.myClaim(id!) : Promise.resolve({ claim: null });
        const claimsPromise = user && data.item.postedBy?._id === user._id
          ? api.itemClaims(id!)
          : Promise.resolve({ claims: [] });

        const [c, mc, cl] = await Promise.all([commentsPromise, myClaimPromise, claimsPromise]);
        if (!mounted) return;

        setComments(c.comments || []);
        setMyClaim(mc.claim || null);
        setClaims(cl.claims || []);
      } catch (err) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [id, user]);

  const submitClaim = async (e) => {
    e.preventDefault();
    if (!note.trim()) return;
    setSubmitting(true);
    try {
      const { claim } = await api.createClaim(id!, { verificationNote: note });
      setMyClaim(claim);
      setShowClaimForm(false);
      setNote('');
      toast('Claim submitted! The owner will review it.');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const reviewClaim = async (claimId, status) => {
    try {
      const { claim } = await api.reviewClaim(claimId, { status });
      setClaims((prev) =>
        prev.map((c) => (c._id === claimId ? { ...c, status: claim.status, resolvedAt: claim.resolvedAt } : c))
      );
      if (status === 'approved') {
        setItem((prev) => (prev ? { ...prev, status: 'claimed' } : prev));
        toast('Claim approved — contact info revealed to both parties.');
      } else {
        toast('Claim rejected.');
      }
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const toggleResolved = async () => {
    const newStatus = item?.status === 'resolved' ? 'open' : 'resolved';
    try {
      const { item: updated } = await api.updateItem(id!, { status: newStatus });
      setItem(updated);
      toast(newStatus === 'resolved' ? 'Item marked as resolved.' : 'Item reopened.');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const deleteItem = async () => {
    if (!confirm('Delete this listing permanently?')) return;
    try {
      await api.deleteItem(id!);
      toast('Listing deleted.');
      navigate('/my-items');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const submitComment = async (e, parentId = null, text = commentText) => {
    e.preventDefault();
    if (!text.trim()) return;
    setPostingComment(true);
    try {
      const { comment } = await api.addComment(id!, {
        text,
        parentId,
      });
      setComments((prev) => [...prev, comment]);
      if (parentId) {
        setReplyText('');
        setReplyTo(null);
      } else {
        setCommentText('');
      }
      toast('Comment posted.');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setPostingComment(false);
    }
  };

  const removeComment = async (commentId) => {
    try {
      await api.deleteComment(id!, commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      toast('Comment deleted.');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 size={24} className="animate-spin" /> <span className="ml-2">Loading…</span>
      </div>
    );
  }
  if (error || !item) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <p className="text-error-600">{error || 'Item not found'}</p>
        <Link to="/" className="link mt-4 inline-block">Back to browse</Link>
      </div>
    );
  }

  const date = new Date(item.dateLostOrFound).toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const approvedClaim = claims.find((c) => c.status === 'approved');
  const revealContact = !!approvedClaim || myClaim?.status === 'approved';
  const isResolved = item.status === 'resolved';

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link to="/" className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={16} /> Back to browse
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="card overflow-hidden">
            <div className="aspect-[4/3] w-full bg-slate-100">
              {item.images?.[0] ? (
                <img src={item.images[activeImg]} alt={item.title} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center text-slate-300">No image</div>
              )}
            </div>
          </div>
          {item.images?.length > 1 && (
            <div className="mt-3 flex gap-2">
              {item.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`h-16 w-20 overflow-hidden rounded-lg border-2 transition ${
                    i === activeImg ? 'border-primary-500' : 'border-transparent'
                  }`}
                >
                  <img src={img} alt={`view ${i + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={item.type === 'lost' ? 'badge-lost' : 'badge-found'}>
              {item.type === 'lost' ? 'Lost' : 'Found'}
            </span>
            <span className={`badge ${
              item.status === 'open' ? 'badge-open' : item.status === 'claimed' ? 'badge-claimed' : 'badge-resolved'
            }`}>{item.status}</span>
            <span className="badge bg-slate-100 text-slate-600">{item.category}</span>
          </div>

          <h1 className="mt-3 text-2xl font-bold text-slate-900">{item.title}</h1>

          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <p className="flex items-center gap-2"><MapPin size={16} className="text-slate-400" /> {item.location}</p>
            <p className="flex items-center gap-2"><Calendar size={16} className="text-slate-400" /> {date}</p>
            <p className="flex items-center gap-2"><UserIcon size={16} className="text-slate-400" /> Posted by <UserActionMenu user={item.postedBy} itemId={item._id} /></p>
          </div>

          <div className="mt-5">
            <h2 className="mb-1.5 text-sm font-semibold text-slate-700">Description</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{item.description}</p>
          </div>

          {/* Contact reveal */}
          {revealContact && (
            <div className="mt-5 rounded-lg border border-success-200 bg-success-50 p-3 text-sm">
              <p className="flex items-center gap-2 font-medium text-success-700">
                <Mail size={16} /> Contact information
              </p>
              <div className="mt-1 text-success-700">
                {isOwner ? (
                  <>
                    <p>Email: {approvedClaim?.claimant?.email || item.postedBy?.email}</p>
                    {approvedClaim?.claimant?.phone ? (
                      <p className="mt-1">Phone: {approvedClaim.claimant.phone}</p>
                    ) : null}
                  </>
                ) : (
                  <>
                    <p>Email: {item.postedBy?.email}</p>
                    {item.postedBy?.phone ? (
                      <p className="mt-1">Phone: {item.postedBy.phone}</p>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex flex-wrap gap-2">
            {canClaim && !myClaim && !isResolved && (
              <button onClick={() => setShowClaimForm((v) => !v)} className="btn-primary">
                <ShieldCheck size={16} /> Claim this item
              </button>
            )}
            {canClaim && (
              <button onClick={() => navigate(`/messages/${item.postedBy._id}?itemId=${item._id}`)} className="btn-secondary">
                <MessageSquare size={16} /> Ask about this post
              </button>
            )}
            {myClaim && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm">
                Your claim status:{' '}
                <span className={`badge ${
                  myClaim.status === 'approved' ? 'badge-approved' :
                  myClaim.status === 'rejected' ? 'badge-rejected' : 'badge-pending'
                }`}>{myClaim.status}</span>
              </div>
            )}
            {isOwner && (
              <>
                <Link to={`/items/${id}/edit`} className="btn-secondary">
                  <Pencil size={16} /> Edit
                </Link>
                <button onClick={toggleResolved} className={isResolved ? 'btn-secondary' : 'btn-success'}>
                  {isResolved ? <Undo2 size={16} /> : <PackageCheck size={16} />}
                  {isResolved ? 'Undo resolved' : 'Mark resolved'}
                </button>
                <button onClick={deleteItem} className="btn-danger">
                  <Trash2 size={16} /> Delete
                </button>
              </>
            )}
            {!user && (
              <Link to="/login" className="btn-primary">Log in to claim this item</Link>
            )}
          </div>

          {/* Claim form */}
          {showClaimForm && canClaim && (
            <form onSubmit={submitClaim} className="mt-4 card p-4">
              <label className="label">Verification note</label>
              <p className="mb-2 text-xs text-slate-500">
                Describe details that prove ownership (e.g. engravings, contents, color, serial number).
              </p>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                required
                className="input"
                placeholder="I can prove this is mine because…"
              />
              <div className="mt-3 flex gap-2">
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
                  Submit claim
                </button>
                <button type="button" onClick={() => setShowClaimForm(false)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Owner: claims on this item */}
      {isOwner && claims.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">
            Claims on this item ({claims.length})
          </h2>
          <div className="space-y-3">
            {claims.map((c) => (
              <div key={c._id} className="card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <UserIcon size={16} /> <UserActionMenu user={c.claimant} />
                  </div>
                  <span className={`badge ${
                    c.status === 'approved' ? 'badge-approved' :
                    c.status === 'rejected' ? 'badge-rejected' : 'badge-pending'
                  }`}>{c.status}</span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{c.verificationNote}</p>
                {c.status === 'pending' && (
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => reviewClaim(c._id, 'approved')} className="btn-success">
                      <CheckCircle2 size={16} /> Approve
                    </button>
                    <button onClick={() => reviewClaim(c._id, 'rejected')} className="btn-secondary">
                      <XCircle size={16} /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Claimant: own claim note */}
      {myClaim && !isOwner && (
        <div className="mt-10 card p-4">
          <h2 className="mb-2 text-lg font-semibold text-slate-900">Your claim</h2>
          <p className="text-sm text-slate-600">{myClaim.verificationNote}</p>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
            <Clock size={13} /> Submitted {new Date(myClaim.createdAt).toLocaleDateString()}
          </p>
        </div>
      )}

      {/* Comments section */}
      <div className="mt-10">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
          <MessageSquare size={20} /> Comments ({comments.length})
        </h2>

        {user ? (
          <form onSubmit={submitComment} className="mb-6 flex gap-2">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment…"
              maxLength={500}
              className="input flex-1"
            />
            <button type="submit" disabled={postingComment || !commentText.trim()} className="btn-primary">
              {postingComment ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </form>
        ) : (
          <p className="mb-6 text-sm text-slate-500">
            <Link to="/login" className="link">Log in</Link> to join the conversation.
          </p>
        )}

        {comments.length === 0 ? (
          <p className="text-sm text-slate-400">No comments yet. Be the first to start the conversation.</p>
        ) : (
          <div className="space-y-3">
            {(() => {
              const repliesByParent = comments.reduce((acc, comment) => {
                const parentId = comment.parent?._id;
                if (!parentId) return acc;
                acc[parentId] = acc[parentId] || [];
                acc[parentId].push(comment);
                return acc;
              }, {} as Record<string, Comment[]>);

              return comments
                .filter((comment) => !comment.parent)
                .map((comment) => (
                  <div key={comment._id} className="space-y-3">
                    <div className="card p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                          <UserIcon size={14} /> <UserActionMenu user={comment.author} />
                          {user?._id === comment.author?._id && (
                            <span className="badge bg-primary-50 text-primary-600 text-[10px]">you</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">
                            {new Date(comment.createdAt).toLocaleString(undefined, {
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                            })}
                          </span>
                          {user?._id === comment.author?._id && (
                            <button onClick={() => removeComment(comment._id)} className="text-slate-300 hover:text-error-500" title="Delete comment">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">{comment.text}</p>
                      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                        {user && (
                          <button
                            type="button"
                            onClick={() => {
                              setReplyTo(comment);
                              setReplyText('');
                            }}
                            className="text-primary-600 hover:text-primary-800"
                          >
                            Reply
                          </button>
                        )}
                      </div>
                    </div>

                    {replyTo?._id === comment._id && (
                      <form
                        onSubmit={(e) => submitComment(e, comment._id, replyText)}
                        className="ml-6 rounded-2xl border border-slate-200 bg-white p-4"
                      >
                        <div className="mb-2 text-sm text-slate-500">
                          Replying to <span className="font-medium text-slate-700">{comment.author?.name}</span>
                        </div>
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          rows={3}
                          className="input w-full"
                          placeholder="Write your reply…"
                        />
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button type="submit" disabled={postingComment || !replyText.trim()} className="btn-primary">
                            {postingComment ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                            Reply
                          </button>
                          <button type="button" onClick={() => setReplyTo(null)} className="btn-secondary">
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}

                    {repliesByParent[comment._id]?.map((reply) => (
                      <div key={reply._id} className="ml-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                            <UserIcon size={14} /> <UserActionMenu user={reply.author} />
                            {user?._id === reply.author?._id && (
                              <span className="badge bg-primary-50 text-primary-600 text-[10px]">you</span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400">
                            {new Date(reply.createdAt).toLocaleString(undefined, {
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-slate-600">{reply.text}</p>
                      </div>
                    ))}
                  </div>
                ));
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
