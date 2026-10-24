import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { ImagePlus, X } from 'lucide-react';

const TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;

// Drag-and-drop image picker matching the multer limits on the backend
// (`images` up to 5 for products, single `image` for categories; 5 MB each).
// `existing` are the saved image URLs. Picking new files replaces all of them,
// which is what the server does on update, so they are hidden once files are chosen.
export function ImageUpload({
  files = [],
  onChange,
  max = 5,
  existing = [],
  hint = 'JPG, PNG or WebP, up to 5 MB each',
}) {
  const [over, setOver] = useState(false);
  const previews = useMemo(() => files.map((f) => ({ file: f, url: URL.createObjectURL(f) })), [files]);
  useEffect(() => () => previews.forEach((p) => URL.revokeObjectURL(p.url)), [previews]);

  const add = (list) => {
    const picked = [...list];
    const images = picked.filter((f) => TYPES.includes(f.type) && f.size <= MAX_BYTES);
    if (images.length < picked.length)
      toast.error('Some files were skipped: only JPG, PNG or WebP up to 5 MB.');
    onChange([...files, ...images].slice(0, max));
  };
  const room = max - files.length;
  const saved = files.length ? [] : existing.filter(Boolean);

  return (
    <div>
      {room > 0 && (
        <label
          className={`dropzone ${over ? 'is-over' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            add(e.dataTransfer.files);
          }}
        >
          <input
            type="file"
            accept={TYPES.join(',')}
            multiple={max > 1}
            onChange={(e) => {
              add(e.target.files);
              e.target.value = '';
            }}
          />
          <ImagePlus size={22} />
          <strong>Drop {max > 1 ? 'images' : 'an image'} here or click to browse</strong>
          <span>
            {hint}
            {max > 1 ? ` · ${room} more allowed` : ''}
            {saved.length ? ' · replaces the current ones' : ''}
          </span>
        </label>
      )}
      {(previews.length > 0 || saved.length > 0) && (
        <div className="thumbs">
          {saved.map((url) => (
            <div className="thumb" key={url}>
              <img src={url} alt="" />
            </div>
          ))}
          {previews.map((p, i) => (
            <div className="thumb" key={p.url}>
              <img src={p.url} alt={p.file.name} />
              <button
                type="button"
                aria-label="Remove image"
                onClick={() => onChange(files.filter((_, j) => j !== i))}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
