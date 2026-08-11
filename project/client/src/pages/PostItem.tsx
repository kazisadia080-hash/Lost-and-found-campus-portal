import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES } from '../types';
import { fileToCompressedDataUrl } from '../utils/image';
import { toast } from '../components/Toast';
import { ImagePlus, X, Loader2, Send, Save } from 'lucide-react';

const TYPES = ['lost', 'found'];

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Something went wrong. Please try again.';
}

export default function PostItem() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const fileRef = useRef<HTMLInputElement>(null);
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    type: 'lost',
    title: '',
    description: '',
    category: 'Electronics',
    location: '',
    dateLostOrFound: new Date().toISOString().slice(0, 10),
  });
  const [images, setImages] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (!isEdit) return;
    api.getItem(id!)
      .then((data) => {
        const item = data.item;
        setForm({
          type: item.type,
          title: item.title,
          description: item.description,
          category: item.category,
          location: item.location,
          dateLostOrFound: new Date(item.dateLostOrFound).toISOString().slice(0, 10),
        });
        setImages(item.images || []);
      })
      .catch((err: unknown) => toast(getErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleFiles = async (files: FileList) => {
    const list = Array.from(files).slice(0, 3 - images.length);
    if (!list.length) return;
    setProcessing(true);
    try {
      const compressed = await Promise.all(list.map((f: File) => fileToCompressedDataUrl(f)));
      setImages((prev) => [...prev, ...compressed].slice(0, 3));
    } catch {
      toast('Could not process one of the images.', 'error');
    } finally {
      setProcessing(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removeImage = (i: number) =>
    setImages((prev) => prev.filter((_, idx) => idx !== i));

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isEdit) {
        await api.updateItem(id!, { ...form, images });
        toast('Listing updated!');
        navigate(`/items/${id}`);
      } else {
        const { item } = await api.createItem({ ...form, images });
        toast('Listing posted!');
        navigate(`/items/${item._id}`);
      }
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 size={24} className="animate-spin" /> <span className="ml-2">Loading…</span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">
        {isEdit ? 'Edit Listing' : 'Post a Lost or Found Item'}
      </h1>

      <form onSubmit={submit} className="card space-y-5 p-6">
        {/* Type toggle */}
        <div>
          <label className="label">Type</label>
          <div className="grid grid-cols-2 gap-2">
            {TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setForm((f) => ({ ...f, type: t }))}
                className={`rounded-lg border-2 px-4 py-3 text-sm font-semibold capitalize transition ${
                  form.type === t
                    ? t === 'lost'
                      ? 'border-error-500 bg-error-50 text-error-700'
                      : 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                {t === 'lost' ? 'I lost something' : 'I found something'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Title</label>
          <input name="title" value={form.title} onChange={handleChange} required className="input" placeholder="e.g. Black leather wallet" />
        </div>

        <div>
          <label className="label">Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} required rows={4} className="input" placeholder="Describe the item, distinguishing features, etc." />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Category</label>
            <select name="category" value={form.category} onChange={handleChange} className="input">
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Location</label>
            <input name="location" value={form.location} onChange={handleChange} required className="input" placeholder="e.g. Library, 2nd floor" />
          </div>
        </div>

        <div>
          <label className="label">Date {form.type === 'lost' ? 'lost' : 'found'}</label>
          <input type="date" name="dateLostOrFound" value={form.dateLostOrFound} onChange={handleChange} required className="input" />
        </div>

        {/* Images */}
        <div>
          <label className="label">Photos (up to 3)</label>
          <p className="mb-2 text-xs text-slate-500">Images are compressed automatically before upload.</p>
          <div className="flex flex-wrap gap-3">
            {images.map((img, i) => (
              <div key={i} className="relative h-24 w-24 overflow-hidden rounded-lg border border-slate-200">
                <img src={img} alt={`preview ${i + 1}`} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            {images.length < 3 && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={processing}
                className="grid h-24 w-24 place-items-center rounded-lg border-2 border-dashed border-slate-300 text-slate-400 transition hover:border-primary-400 hover:text-primary-500"
              >
                {processing ? <Loader2 size={20} className="animate-spin" /> : <ImagePlus size={20} />}
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <p className="text-xs text-slate-400">{isEdit ? 'Editing as' : 'Posting as'} {user?.name}</p>
          <button type="submit" disabled={submitting || processing} className="btn-primary">
            {submitting ? <Loader2 size={16} className="animate-spin" /> : isEdit ? <Save size={16} /> : <Send size={16} />}
            {isEdit ? 'Save changes' : 'Post listing'}
          </button>
        </div>
      </form>
    </div>
  );
}