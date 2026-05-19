import { Button, Flex, Heading, Text, Box, Grid, Card, Link } from '@radix-ui/themes';
import { useState } from 'react';
import AuthModal from '../components/AuthModal';
import { Mic, MessageSquare, Zap, Shield, BarChart, Check, ArrowRight, Play, Globe, Users, TrendingUp, Twitter, Github, Linkedin, Mail, Workflow } from 'lucide-react';
import phosaiLogo from '../assets/phosai_logo.png';

export default function LandingPage() {
	const [authModalOpen, setAuthModalOpen] = useState(false);
	const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
	return (
		<Box style={{ minHeight: '100vh', backgroundColor: '#fafafa' }}>
			{/* Navigation */}
			<header style={{
				padding: '0',
				backgroundColor: '#ffffff',
				borderBottom: '1px solid #e5e7eb',
				position: 'sticky',
				top: 0,
				zIndex: 50
			}}>
				<Box style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
					<Flex align="center" gap="0" mb="0">
						<img src={phosaiLogo} alt="phosai" style={{ width: '64px', height: '64px' }} />
						<Text size="4" weight="bold" style={{ color: '#111827', margin: 0 }}>PHOSAI</Text>
					</Flex>
					<Flex gap="6" align="center" display={{ initial: 'none', lg: 'flex' }}>
						<Link href="#features" style={{ color: '#111827', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Features</Link>
						<Link href="#use-cases" style={{ color: '#111827', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Use Cases</Link>
						<Link href="#pricing" style={{ color: '#111827', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Pricing</Link>
						<Link href="#docs" style={{ color: '#111827', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Documentation</Link>
						<Link href="#about" style={{ color: '#111827', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>About</Link>
					</Flex>
					<Flex gap="3" align="center">
						<Button variant="ghost" size="2" style={{ fontSize: '14px' }} onClick={() => { setAuthMode('signin'); setAuthModalOpen(true); }}>Sign In</Button>
						<Button size="2" style={{ backgroundColor: '#f0ad44', fontSize: '14px' }} onClick={() => { setAuthMode('signup'); setAuthModalOpen(true); }}>Get Started</Button>
					</Flex>
				</Box>
			</header>

			{/* Hero Section */}
			<Box style={{
				padding: '100px 24px',
				textAlign: 'center',
				maxWidth: '1000px',
				margin: '0 auto'
			}}>
				<Box style={{
					display: 'inline-block',
					padding: '6px 16px',
					backgroundColor: '#fffbeb',
					borderRadius: '9999px',
					marginBottom: '32px',
					border: '1px solid #fcd34d'
				}}>
					<Text size="2" style={{ color: '#92400e', fontWeight: 500 }}>New: Google Workspace Integration</Text>
				</Box>
				<Heading size="9" style={{
					margin: '0 0 24px',
					fontWeight: 700,
					color: '#111827',
					lineHeight: 1.1,
					letterSpacing: '-0.02em'
				}}>
					Build voice agents<br />that feel human
				</Heading>
				<Text size="5" style={{
					color: '#111827',
					marginBottom: '40px',
					maxWidth: '650px',
					margin: '0 auto 40px',
					lineHeight: 1.6
				}}>
					Create AI-powered voice assistants for your business. Natural conversations, real-time responses, and seamless integrations.
				</Text>
				<Flex gap="3" justify="center" align="center" mb="8">
					<Button size="3" style={{
						paddingLeft: '24px',
						paddingRight: '24px',
						backgroundColor: '#f0ad44',
						height: '48px'
					}} onClick={() => { setAuthMode('signup'); setAuthModalOpen(true); }}>
						Start building <ArrowRight size={18} style={{ marginLeft: '8px' }} />
					</Button>
					<Button variant="outline" size="3" style={{ height: '48px' }}>
						<Play size={18} style={{ marginRight: '8px' }} /> Watch demo
					</Button>
				</Flex>
				<Flex gap="8" justify="center" align="center" mt="6">
					{[
						{ icon: Users, label: '10,000+ users' },
						{ icon: Globe, label: '50+ countries' },
						{ icon: TrendingUp, label: '99.9% uptime' }
					].map((stat, i) => (
						<Flex key={i} gap="2" align="center">
							<stat.icon size={16} style={{ color: '#f0ad44' }} />
							<Text size="2" style={{ color: '#111827' }}>{stat.label}</Text>
						</Flex>
					))}
				</Flex>
			</Box>

			{/* Features Section */}
			<Box style={{ padding: '80px 24px', backgroundColor: '#ffffff', borderTop: '1px solid #e5e7eb' }}>
				<Box style={{ maxWidth: '1200px', margin: '0 auto' }}>
					<Heading size="6" style={{ marginBottom: '12px', color: '#111827', fontWeight: 600 }}>
						Everything you need
					</Heading>
					<Text size="4" style={{ color: '#111827', marginBottom: '48px', display: 'block' }}>
						Powerful features to build production-ready voice agents
					</Text>
					<Grid columns={{ initial: '1', md: '2', lg: '3' }} gap="5">
						{[
							{ icon: Mic, title: 'Natural voice', desc: 'Human-like speech with natural intonation and emotion' },
							{ icon: MessageSquare, title: 'Smart conversations', desc: 'AI that understands context and remembers interactions' },
							{ icon: Zap, title: 'Fast response', desc: 'Sub-second latency for seamless conversations' },
							{ icon: Shield, title: 'Secure', desc: 'End-to-end encryption and SOC 2 compliance' },
							{ icon: BarChart, title: 'Analytics', desc: 'Track performance with real-time dashboards' },
							{ icon: Workflow, title: 'Integrations', desc: 'Connect with Google Workspace, CRM, and more' },
						].map((feature, i) => (
							<Card key={i} style={{
								padding: '24px',
								border: '1px solid #e5e7eb',
								borderRadius: '8px',
								background: '#ffffff'
							}}>
								<Box style={{
									width: '40px',
									height: '40px',
									borderRadius: '8px',
									backgroundColor: '#fffbeb',
									display: 'flex', alignItems: 'center', justifyContent: 'center',
									marginBottom: '16px'
								}}>
									<feature.icon size={20} style={{ color: '#f0ad44' }} />
								</Box>
								<Heading size="4" style={{ marginBottom: '8px', color: '#111827', fontWeight: 600 }}>{feature.title}</Heading>
								<Text size="2" style={{ color: '#111827', lineHeight: 1.5 }}>{feature.desc}</Text>
							</Card>
						))}
					</Grid>
				</Box>
			</Box>

			{/* Use Cases Section */}
			<Box style={{ padding: '80px 24px', backgroundColor: '#fafafa', borderTop: '1px solid #e5e7eb' }}>
				<Box style={{ maxWidth: '1200px', margin: '0 auto' }}>
					<Heading size="6" style={{ marginBottom: '12px', color: '#111827', fontWeight: 600 }}>
						Built for every use case
					</Heading>
					<Text size="4" style={{ color: '#111827', marginBottom: '48px', display: 'block' }}>
						Power voice agents for any industry
					</Text>
					<Grid columns={{ initial: '1', md: '2', lg: '4' }} gap="4">
						{[
							'Customer Support',
							'Sales & Booking',
							'Appointments',
							'Order Taking',
							'Information',
							'Lead Qualification',
							'Tech Support',
							'Voice Assistant'
						].map((useCase, i) => (
							<Card key={i} style={{
								padding: '20px',
								border: '1px solid #e5e7eb',
								borderRadius: '8px',
								background: '#ffffff'
							}}>
								<Flex align="center" gap="3" justify="center">
									<Check size={18} style={{ color: '#f0ad44', flexShrink: 0 }} />
									<Text size="2" weight="medium" style={{ color: '#111827' }}>{useCase}</Text>
								</Flex>
							</Card>
						))}
					</Grid>
				</Box>
			</Box>

			{/* CTA Section */}
			<Box style={{
				padding: '80px 24px',
				backgroundColor: '#211d1e',
				textAlign: 'center'
			}}>
				<Box style={{ maxWidth: '700px', margin: '0 auto' }}>
					<Heading size="6" style={{
						margin: '0 0 16px',
						fontWeight: 600,
						color: '#ffffff'
					}}>
						Ready to build your first agent?
					</Heading>
					<Text size="4" style={{
						color: '#111827',
						marginBottom: '32px',
						display: 'block',
						lineHeight: 1.5
					}}>
						Start building for free. No credit card required.
					</Text>
					<Button size="3" style={{
						paddingLeft: '24px',
						paddingRight: '24px',
						backgroundColor: '#f0ad44',
						color: '#211d1e',
						height: '48px'
					}} onClick={() => { setAuthMode('signup'); setAuthModalOpen(true); }}>
						Get started <ArrowRight size={18} style={{ marginLeft: '8px' }} />
					</Button>
				</Box>
			</Box>

			{/* Footer */}
			<footer style={{ padding: '64px 24px 32px', backgroundColor: '#ffffff', borderTop: '1px solid #e5e7eb' }}>
				<Box style={{ maxWidth: '1280px', margin: '0 auto' }}>
					<Grid columns={{ initial: '1', sm: '2', md: '4' }} gap="8" mb="8">
						{/* Company Column */}
						<Box>
							<Flex align="center" gap="0" mb="4">
								<img src={phosaiLogo} alt="phosai" style={{ width: '64px', height: '64px' }} />
								<Text size="4" weight="bold" style={{ color: '#111827', margin: 0 }}>PHOSAI</Text>
							</Flex>
							<Text size="2" style={{ color: '#111827', marginBottom: '16px', lineHeight: 1.6 }}>
								Build intelligent voice agents for your business with natural conversations and seamless integrations.
							</Text>
							<Flex gap="4">
								<Box style={{
									width: '36px',
									height: '36px',
									borderRadius: '8px',
									backgroundColor: '#f3f4f6',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									cursor: 'pointer'
								}}>
									<Twitter size={18} style={{ color: '#111827' }} />
								</Box>
								<Box style={{
									width: '36px',
									height: '36px',
									borderRadius: '8px',
									backgroundColor: '#f3f4f6',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									cursor: 'pointer'
								}}>
									<Github size={18} style={{ color: '#111827' }} />
								</Box>
								<Box style={{
									width: '36px',
									height: '36px',
									borderRadius: '8px',
									backgroundColor: '#f3f4f6',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									cursor: 'pointer'
								}}>
									<Linkedin size={18} style={{ color: '#111827' }} />
								</Box>
							</Flex>
						</Box>

						{/* Product Column */}
						<Box>
							<Heading size="3" style={{ marginBottom: '16px', color: '#111827', fontWeight: 600 }}>Product</Heading>
							<Flex direction="column" gap="3">
								<Link href="#features" style={{ color: '#111827', textDecoration: 'none', fontSize: '14px' }}>Features</Link>
								<Link href="#pricing" style={{ color: '#111827', textDecoration: 'none', fontSize: '14px' }}>Pricing</Link>
								<Link href="#integrations" style={{ color: '#111827', textDecoration: 'none', fontSize: '14px' }}>Integrations</Link>
								<Link href="#changelog" style={{ color: '#111827', textDecoration: 'none', fontSize: '14px' }}>Changelog</Link>
								<Link href="#roadmap" style={{ color: '#111827', textDecoration: 'none', fontSize: '14px' }}>Roadmap</Link>
							</Flex>
						</Box>

						{/* Resources Column */}
						<Box>
							<Heading size="3" style={{ marginBottom: '16px', color: '#111827', fontWeight: 600 }}>Resources</Heading>
							<Flex direction="column" gap="3">
								<Link href="#docs" style={{ color: '#111827', textDecoration: 'none', fontSize: '14px' }}>Documentation</Link>
								<Link href="#api" style={{ color: '#111827', textDecoration: 'none', fontSize: '14px' }}>API Reference</Link>
								<Link href="#guides" style={{ color: '#111827', textDecoration: 'none', fontSize: '14px' }}>Guides</Link>
								<Link href="#blog" style={{ color: '#111827', textDecoration: 'none', fontSize: '14px' }}>Blog</Link>
								<Link href="#support" style={{ color: '#111827', textDecoration: 'none', fontSize: '14px' }}>Support</Link>
							</Flex>
						</Box>

						{/* Company Column */}
						<Box>
							<Heading size="3" style={{ marginBottom: '16px', color: '#111827', fontWeight: 600 }}>Company</Heading>
							<Flex direction="column" gap="3">
								<Link href="#about" style={{ color: '#111827', textDecoration: 'none', fontSize: '14px' }}>About Us</Link>
								<Link href="#careers" style={{ color: '#111827', textDecoration: 'none', fontSize: '14px' }}>Careers</Link>
								<Link href="#contact" style={{ color: '#111827', textDecoration: 'none', fontSize: '14px' }}>Contact</Link>
								<Link href="#privacy" style={{ color: '#111827', textDecoration: 'none', fontSize: '14px' }}>Privacy Policy</Link>
								<Link href="#terms" style={{ color: '#111827', textDecoration: 'none', fontSize: '14px' }}>Terms of Service</Link>
							</Flex>
						</Box>
					</Grid>

					{/* Bottom Bar */}
					<Box style={{
						paddingTop: '32px',
						borderTop: '1px solid #e5e7eb',
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						flexWrap: 'wrap',
						gap: '16px'
					}}>
						<Text size="2" style={{ color: '#111827' }}>© 2026 phosai. All rights reserved.</Text>
						<Flex gap="6" align="center">
							<Flex gap="2" align="center">
								<Globe size={14} style={{ color: '#111827' }} />
								<Text size="2" style={{ color: '#111827' }}>English</Text>
							</Flex>
							<Flex gap="2" align="center">
								<Mail size={14} style={{ color: '#111827' }} />
								<Text size="2" style={{ color: '#111827' }}>hello@phosai.com</Text>
							</Flex>
						</Flex>
					</Box>
				</Box>
			</footer>
			<AuthModal
				open={authModalOpen}
				onOpenChange={setAuthModalOpen}
				mode={authMode}
			/>
		</Box>
	);
}
