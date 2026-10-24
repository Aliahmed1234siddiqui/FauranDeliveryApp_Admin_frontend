import { useState } from 'react';
import { Eye, EyeOff, KeyRound } from 'lucide-react';

import { Field } from '@/components/ui';

export function PasswordField({ value, onChange, isNew, error }) {
  const [show, setShow] = useState(false);
  return (
    <Field
      label={isNew ? 'Temporary password' : 'Reset password'}
      required={isNew}
      error={error}
      hint={
        isNew
          ? 'Share it securely. They can change it after signing in.'
          : 'Leave blank to keep the current password. Setting one signs them out.'
      }
      className="span-2"
    >
      {(id) => (
        <div className="input-group">
          <span className="input-affix">
            <KeyRound size={15} />
          </span>
          <input
            id={id}
            className="input"
            type={show ? 'text' : 'password'}
            value={value}
            onChange={onChange}
            placeholder="At least 8 characters"
            autoComplete="new-password"
          />
          <button
            type="button"
            className="pw-toggle"
            onClick={() => setShow((s) => !s)}
            aria-label="Toggle password visibility"
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      )}
    </Field>
  );
}
