import { useEffect, useMemo, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';

// Drag-and-drop image picker matching the multer limits on the backend
// (`images` up to 5 for products, single `image` for categories).
export default function ImageUpload({ files = [], onChange, max = 5, existing = [], hint = 'PNG or JPG, up to 2 MB each' }) {
  const [over, setOver] = useState(false);
  const previews = useMemo(() => files.map((f) => ({ file: f, url: URL.createObjectURL(f) })), [files]);
  useEffect(() => () => previews.forEach((p) => URL.revokeObjectURL(p.url)), [previews]);

  const add = (list) => {
    const images = [...list].filter((f) => f.type.startsWith('image/'));
    onChange([...files, ...images].slice(0, max));
  };
  const room = max - files.length - existing.length;

  return (
    <div>
      {room > 0 && (
        <label
          className={`dropzone ${over ? 'is-over' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setOver(true); }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); add(e.dataTransfer.files); }}
        >
          <input type="file" accept="image/*" multiple={max > 1} onChange={(e) => { add(e.target.files); e.target.value = ''; }} />
          <ImagePlus size={22} />
          <strong>Drop {max > 1 ? 'images' : 'an image'} here or click to browse</strong>
          <span>{hint}{max > 1 ? ` · ${room} more allowed` : ''}</span>
        </label>
      )}
      {(previews.length > 0 || existing.length > 0) && (
        <div className="thumbs">
          {existing.map((e, i) => <div className="thumb" key={`e${i}`}>{e.startsWith?.('http') || e.startsWith?.('blob') ? <img src={e} alt="" /> : e}</div>)}
          {previews.map((p, i) => (
            <div className="thumb" key={p.url}>
              <img src={p.url} alt={p.file.name} />
              <button type="button" aria-label="Remove image" onClick={() => onChange(files.filter((_, j) => j !== i))}><X size={12} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
