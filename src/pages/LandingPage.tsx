import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import phosaiLogo from '../assets/phosai_logo.png';

export default function LandingPage() {
	const { signIn, signUp, signInWithGoogle } = useAuth();

	const [step, setStep] = useState<'email' | 'password' | 'signup'>('email');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	const handleContinue = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		if (step === 'email') {
			if (!email.trim()) { setError('Please enter your email address.'); return; }
			setStep('password');
			return;
		}
		if (step === 'signup') {
			if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
			if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
			setLoading(true);
			try { await signUp(email, password); }
			catch (err: any) { setError(err.message || 'Failed to create account.'); }
			finally { setLoading(false); }
			return;
		}
		setLoading(true);
		try { await signIn(email, password); }
		catch (err: any) { setError(err.message || 'Invalid email or password.'); }
		finally { setLoading(false); }
	};

	const handleGoogle = async () => {
		setError('');
		setLoading(true);
		try { await signInWithGoogle(); }
		catch (err: any) { setError(err.message || 'Google sign-in failed.'); }
		finally { setLoading(false); }
	};

	return (
		<div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>

			{/* ══════════════════════════════════
			    LEFT PANEL
			══════════════════════════════════ */}
			<div style={{
				flex: '0 0 50%',
				background: 'linear-gradient(145deg, #0d0d0d 0%, #161616 50%, #111111 100%)',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				padding: '60px 64px',
				position: 'relative',
				overflow: 'hidden',
			}}>

				{/* Subtle radial glow behind center content */}
				<div style={{
					position: 'absolute',
					top: '50%',
					left: '50%',
					transform: 'translate(-50%, -50%)',
					width: '500px',
					height: '500px',
					borderRadius: '50%',
					background: 'radial-gradient(circle, rgba(240,173,68,0.07) 0%, transparent 70%)',
					pointerEvents: 'none',
				}} />

				{/* Top-left logo */}
				<div style={{ position: 'absolute', top: '28px', left: '32px', display: 'flex', alignItems: 'center', gap: '10px' }}>
					<img src={phosaiLogo} alt="PhosAI" style={{ height: '44px', objectFit: 'contain', opacity: 0.9 }} />
					<span style={{ color: '#ffffff', fontSize: '16px', fontWeight: 700, letterSpacing: '0.08em' }}>PhosAI</span>
				</div>

				{/* Centre content */}
				<div style={{ textAlign: 'center', maxWidth: '420px', position: 'relative', zIndex: 1 }}>

					{/* Main headline */}
					<h1 style={{
						margin: '0 0 20px',
						fontSize: 'clamp(30px, 3.2vw, 44px)',
						fontWeight: 800,
						lineHeight: 1.18,
						letterSpacing: '-0.03em',
						color: '#ffffff',
					}}>
						Voice agents that<br />
						<span style={{
							background: 'linear-gradient(90deg, #f0ad44 0%, #f5c842 100%)',
							WebkitBackgroundClip: 'text',
							WebkitTextFillColor: 'transparent',
						}}>
							think, speak,<br />and understand.
						</span>
					</h1>

					{/* Sub-headline */}
					<p style={{
						margin: '0 0 48px',
						fontSize: '15px',
						lineHeight: 1.65,
						color: '#cccccc',
						fontWeight: 400,
					}}>
						Build production-ready AI voice agents in minutes — no infrastructure overhead, no complexity.
					</p>

					{/* Stats row */}
					<div style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(3, 1fr)',
						gap: '1px',
						backgroundColor: '#222',
						borderRadius: '14px',
						overflow: 'hidden',
						border: '1px solid #222',
					}}>
						{[
							{ value: '<200ms', label: 'Response time' },
							{ value: '99.9%', label: 'Uptime SLA' },
							{ value: '40+', label: 'Languages' },
						].map((stat, i) => (
							<div key={i} style={{
								backgroundColor: '#141414',
								padding: '20px 16px',
								textAlign: 'center',
							}}>
								<div style={{
									fontSize: '20px',
									fontWeight: 800,
									color: '#f0ad44',
									letterSpacing: '-0.02em',
									marginBottom: '4px',
								}}>
									{stat.value}
								</div>
								<div style={{ fontSize: '11px', color: '#eeeeee', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
									{stat.label}
								</div>
							</div>
						))}
					</div>

					{/* Feature pills */}
					<div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '28px' }}>
						{['Real-time STT', 'LLM Reasoning', 'Natural TTS', 'Workflow Automation'].map((pill, i) => (
							<span key={i} style={{
								padding: '5px 12px',
								borderRadius: '999px',
								border: '1px solid #2a2a2a',
								backgroundColor: '#1a1a1a',
								color: '#ffffff',
								fontSize: '11.5px',
								fontWeight: 500,
								letterSpacing: '0.02em',
							}}>
								{pill}
							</span>
						))}
					</div>
				</div>

				{/* Bottom copyright */}
				<div style={{ position: 'absolute', bottom: '24px', left: 0, right: 0, textAlign: 'center' }}>
					<span style={{ fontSize: '11px', color: '#ffffff' }}>© 2026 PhosAI · Enterprise Voice AI</span>
				</div>
			</div>

			{/* ══════════════════════════════════
			    RIGHT PANEL — Auth form
			══════════════════════════════════ */}
			<div style={{
				flex: 1,
				backgroundColor: '#ffffff',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				padding: '48px 40px',
			}}>
				<div style={{ width: '100%', maxWidth: '360px' }}>

					<h2 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: 700, color: '#111827', letterSpacing: '-0.02em' }}>
						{step === 'signup' ? 'Create your account' : 'Sign in to Agent Studio'}
					</h2>

					<p style={{ margin: '0 0 28px', fontSize: '13.5px', color: '#111827', lineHeight: 1.6 }}>
						{step === 'email'
							? 'PhosAI automates customer calls for businesses of every size. Enter your email or use Google to continue.'
							: step === 'signup'
							? `Creating a new account for ${email}.`
							: `Welcome back — enter your password for ${email}.`}
					</p>

					{error && (
						<div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px' }}>
							<span style={{ color: '#dc2626', fontSize: '13px' }}>{error}</span>
						</div>
					)}

					<form onSubmit={handleContinue} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

						<div>
							<label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
								Email address *
							</label>
							<input
								type="email"
								value={email}
								onChange={e => { setEmail(e.target.value); setError(''); }}
								readOnly={step !== 'email'}
								required
								placeholder="you@company.com"
								style={{
									width: '100%',
									padding: '10px 12px',
									border: '1.5px solid #e5e7eb',
									borderRadius: '8px',
									fontSize: '14px',
									color: '#111827',
									backgroundColor: step !== 'email' ? '#f9fafb' : '#fff',
									outline: 'none',
									boxSizing: 'border-box',
									transition: 'border-color 0.15s',
								}}
								onFocus={e => { if (step === 'email') e.target.style.borderColor = '#f0ad44'; }}
								onBlur={e => e.target.style.borderColor = '#e5e7eb'}
							/>
						</div>

						{(step === 'password' || step === 'signup') && (
							<div>
								<label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
									Password *
								</label>
								<input
									type="password"
									value={password}
									onChange={e => { setPassword(e.target.value); setError(''); }}
									required
									autoFocus
									placeholder="••••••••"
									style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', color: '#111827', outline: 'none', boxSizing: 'border-box' }}
									onFocus={e => e.target.style.borderColor = '#f0ad44'}
									onBlur={e => e.target.style.borderColor = '#e5e7eb'}
								/>
							</div>
						)}

						{step === 'signup' && (
							<div>
								<label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
									Confirm Password *
								</label>
								<input
									type="password"
									value={confirmPassword}
									onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
									required
									placeholder="••••••••"
									style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', color: '#111827', outline: 'none', boxSizing: 'border-box' }}
									onFocus={e => e.target.style.borderColor = '#f0ad44'}
									onBlur={e => e.target.style.borderColor = '#e5e7eb'}
								/>
							</div>
						)}

						<button
							type="submit"
							disabled={loading}
							style={{
								width: '100%',
								padding: '11px',
								backgroundColor: '#111827',
								color: '#fff',
								border: 'none',
								borderRadius: '8px',
								fontSize: '14px',
								fontWeight: 600,
								cursor: loading ? 'not-allowed' : 'pointer',
								opacity: loading ? 0.75 : 1,
								letterSpacing: '0.01em',
								marginTop: '2px',
								transition: 'opacity 0.15s',
							}}
						>
							{loading ? 'Please wait...' : step === 'email' ? 'Continue' : step === 'signup' ? 'Create Account' : 'Sign In'}
						</button>
					</form>

					<div style={{ textAlign: 'center', marginTop: '14px' }}>
						{step === 'email' ? (
							<span style={{ fontSize: '13px', color: '#111827' }}>
								Don't have an account?{' '}
								<button type="button" onClick={() => { setStep('signup'); setError(''); }}
									style={{ background: 'none', border: 'none', color: '#111827', fontWeight: 600, cursor: 'pointer', fontSize: '13px', textDecoration: 'underline', padding: 0 }}>
									Sign up
								</button>
							</span>
						) : (
							<button type="button" onClick={() => { setStep('email'); setError(''); setPassword(''); setConfirmPassword(''); }}
								style={{ background: 'none', border: 'none', color: '#111827', cursor: 'pointer', fontSize: '13px', padding: 0 }}>
								← Use a different email
							</button>
						)}
					</div>

					{/* OR divider */}
					<div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '22px 0' }}>
						<div style={{ flex: 1, height: '1px', backgroundColor: '#f0f0f0' }} />
						<span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 500 }}>or</span>
						<div style={{ flex: 1, height: '1px', backgroundColor: '#f0f0f0' }} />
					</div>

					{/* Google */}
					<button type="button" onClick={handleGoogle} disabled={loading}
						style={{
							width: '100%',
							padding: '10px',
							backgroundColor: '#fff',
							border: '1.5px solid #e5e7eb',
							borderRadius: '8px',
							fontSize: '14px',
							fontWeight: 500,
							color: '#374151',
							cursor: loading ? 'not-allowed' : 'pointer',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							gap: '10px',
							transition: 'border-color 0.15s',
						}}
						onMouseEnter={e => (e.currentTarget.style.borderColor = '#d1d5db')}
						onMouseLeave={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
					>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style={{ width: '18px', height: '18px' }}>
							<path d="M21.6334 12.1873C21.6334 11.3679 21.5669 10.77 21.423 10.1499H12.0664V13.8482H17.5585C17.4479 14.7673 16.8499 16.1514 15.5211 17.0815L15.5025 17.2053L18.4609 19.4972L18.6659 19.5176C20.5482 17.7791 21.6334 15.2213 21.6334 12.1873Z" fill="#4285F4" />
							<path d="M12.0667 21.9312C14.7574 21.9312 17.0163 21.0453 18.6662 19.5173L15.5215 17.0812C14.6799 17.6681 13.5505 18.0777 12.0667 18.0777C9.43139 18.0777 7.19467 16.3393 6.39734 13.9365L6.28047 13.9464L3.20429 16.3271L3.16406 16.439C4.80284 19.6944 8.16902 21.9312 12.0667 21.9312Z" fill="#34A853" />
							<path d="M6.39782 13.9368C6.18744 13.3167 6.06568 12.6523 6.06568 11.9658C6.06568 11.2793 6.18744 10.6149 6.38675 9.99484L6.38118 9.86278L3.26645 7.44385L3.16454 7.49232C2.48912 8.84324 2.10156 10.3603 2.10156 11.9658C2.10156 13.5714 2.48912 15.0884 3.16454 16.4393L6.39782 13.9368Z" fill="#FBBC05" />
							<path d="M12.0667 5.85336C13.938 5.85336 15.2003 6.66168 15.9201 7.33718L18.7326 4.59107C17.0053 2.9855 14.7574 2 12.0667 2C8.16902 2 4.80284 4.23672 3.16406 7.49214L6.38628 9.99466C7.19467 7.59183 9.43139 5.85336 12.0667 5.85336Z" fill="#EB4335" />
						</svg>
						Continue with Google
					</button>
				</div>
			</div>
		</div>
	);
}
