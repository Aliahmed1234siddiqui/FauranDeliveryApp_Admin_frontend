import { useState } from 'react';
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck, Zap } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { Button, Field } from '../ui/primitives';

export default function Login() {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(identifier.trim(), password, remember);
    } catch (err) {
      setError(err.message || 'Could not sign you in');
      setLoading(false);
    }
  };

  return (
    <div className="login">
      <section className="login-art">
        <div className="row" style={{ gap: 12 }}>
          <span className="logo-mark"><Zap size={19} fill="currentColor" /></span>
          <div className="logo-text"><strong>Fauran</strong><small>Admin portal</small></div>
        </div>
        <div>
          <h2>Run the whole marketplace from <em>one calm place.</em></h2>
          <p>Approve stores and riders, follow every order, settle payouts and keep the catalog clean, all in a few clicks.</p>
        </div>
        <div className="login-cards">
          <div><strong>Approvals</strong><span>Stores, riders and products</span></div>
          <div><strong>Live map</strong><span>Every online rider</span></div>
          <div><strong>Payouts</strong><span>Vendor and rider balances</span></div>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-form">
          <h1>Welcome back</h1>
          <p>Sign in with your admin or employee account.</p>
          <form onSubmit={submit} noValidate>
            <Field label="Email or phone" error={error && !identifier ? 'Required' : undefined}>
              {(id) => (
                <div className="input-group">
                  <span className="input-affix"><Mail size={16} /></span>
                  <input id={id} className="input" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="name@fauran.pk" autoComplete="username" autoFocus />
                </div>
              )}
            </Field>
            <Field label="Password">
              {(id) => (
                <div className="input-group">
                  <span className="input-affix"><Lock size={16} /></span>
                  <input id={id} className="input" type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
                  <button type="button" className="pw-toggle" onClick={() => setShowPw((s) => !s)} aria-label={showPw ? 'Hide password' : 'Show password'}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              )}
            </Field>
            {error && <div className="callout callout-danger">{error}</div>}
            <div className="login-row">
              <label className="checkbox"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Keep me signed in</label>
                          </div>
            <Button type="submit" size="lg" loading={loading} iconRight={ArrowRight}>Sign in</Button>
          </form>
          <div className="login-foot">
            <ShieldCheck size={15} /> Access is managed by your super admin. Employees only see the pages they&apos;re permitted to.
          </div>
        </div>
      </section>
    </div>
  );
}
