// app/page.tsx
// EduSwati public landing page — with embedded Login, Sign Up & Forgot Password modals
// Replaces the Alpine.js version of elearning.html with a fully reactive Next.js client component.
// Auth modals use the same Supabase client-side logic as /login, /signup, /forgot-password.
'use client'

import Link from "next/link";
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import { createClient } from '@/lib/supabase/client'

type View = 'home' | 'plans' | 'subjects' | 'contact' | 'about'
type Modal = 'none' | 'login' | 'signup' | 'forgot'

const GRADES = [8, 9, 10, 11, 12]

// ─────────────────────────────────────────────────────────────────────────────
// ROOT COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [view, setView] = useState<View>('home')
  const [modal, setModal] = useState<Modal>('none')
  const [dark, setDark] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)
  const router = useRouter()

  const nav = (v: View) => { setView(v); setMobileMenu(false) }
  const openLogin = () => {
  setMobileMenu(false)
  router.push('/login')
}

const openSignup = () => {
  setMobileMenu(false)
  router.push('/signup')
}

const openForgot = () => {
  setModal('none')
  router.push('/forgot-password')
}
  const closeModal  = () => setModal('none')

  // Close modal on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <>
      {/* ── External CDN assets ───────────────────────────────────────────── */}
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css" />
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@10/swiper-bundle.min.css" />
      <Script src="https://cdn.jsdelivr.net/npm/swiper@10/swiper-bundle.min.js" strategy="afterInteractive"
        onLoad={() => {
          // @ts-ignore
          new window.Swiper('.testimonialSwiper', { slidesPerView: 1, spaceBetween: 20, breakpoints: { 640: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } }, pagination: { el: '.swiper-pagination', clickable: true }, loop: true })
        }}
      />

      {/* ── Global styles (verbatim from elearning.html) ─────────────────── */}
      <style>{`
        :root { --color-primary:#1a3a8f; --color-primary-dark:#14306f; --color-secondary:#ffc642; --color-secondary-dark:#e6ac25; }
        body { font-family:'Inter','Poppins',sans-serif; }
        h1,h2,h3,h4,h5,h6 { font-family:'Poppins',sans-serif; }
        .swazi-pattern { background-image:url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231a3a8f' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"); }
        .btn-primary { background-color:var(--color-primary); color:white; padding:0.75rem 1.5rem; border-radius:0.5rem; font-weight:500; transition:all 0.3s ease; cursor:pointer; border:none; }
        .btn-primary:hover { background-color:var(--color-primary-dark); transform:translateY(-1px); box-shadow:0 4px 6px rgba(0,0,0,0.1); }
        .btn-secondary { background-color:var(--color-secondary); color:var(--color-primary-dark); padding:0.75rem 1.5rem; border-radius:0.5rem; font-weight:500; transition:all 0.3s ease; cursor:pointer; border:none; }
        .btn-secondary:hover { background-color:var(--color-secondary-dark); transform:translateY(-1px); box-shadow:0 4px 6px rgba(0,0,0,0.1); }
        .card { background-color:white; border-radius:1rem; box-shadow:0 4px 6px rgba(0,0,0,0.05); transition:transform 0.3s ease,box-shadow 0.3s ease; }
        .card:hover { transform:translateY(-5px); box-shadow:0 10px 15px rgba(0,0,0,0.1); }
        .subject-icon { font-size:2rem; height:4rem; width:4rem; display:flex; align-items:center; justify-content:center; border-radius:1rem; margin-bottom:1rem; background-color:rgba(26,58,143,0.1); color:var(--color-primary); }
        .testimonial-card { background-color:white; border-radius:1rem; padding:2rem; box-shadow:0 4px 6px rgba(0,0,0,0.05); position:relative; }
        .testimonial-card::before { content:'"'; position:absolute; top:1rem; left:2rem; font-size:4rem; color:var(--color-secondary); opacity:0.3; font-family:Georgia,serif; }
        .dark .card,.dark .testimonial-card { background-color:#1e1e1e; box-shadow:0 4px 6px rgba(0,0,0,0.2); }
        .form-input { width:100%; padding:0.75rem; border:1px solid #d1d5db; border-radius:0.5rem; margin-bottom:0.25rem; transition:all 0.3s ease; font-size:14px; outline:none; box-sizing:border-box; }
        .form-input:focus { border-color:var(--color-primary); box-shadow:0 0 0 3px rgba(26,58,143,0.2); }
        .form-select { width:100%; padding:0.75rem; border:1px solid #d1d5db; border-radius:0.5rem; margin-bottom:0.25rem; appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%236c757d' viewBox='0 0 16 16'%3E%3Cpath fill-rule='evenodd' d='M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 0.75rem center; background-size:16px 12px; outline:none; font-size:14px; box-sizing:border-box; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .animate-fade-in { animation:fadeIn 0.6s ease forwards; }
        @keyframes modalIn { from{opacity:0;transform:scale(0.95)translateY(10px)} to{opacity:1;transform:scale(1)translateY(0)} }
        .modal-box { animation:modalIn 0.22s ease; }
        .swiper-pagination-bullet-active { background:var(--color-primary) !important; }
        [x-cloak] { display:none; }
      `}</style>

      <div className={dark ? 'dark' : ''}>

        {/* ── HEADER ────────────────────────────────────────────────────── */}
        <header className="bg-white shadow-sm sticky top-0 z-50 dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center py-4">
              <button onClick={() => nav('home')} className="flex items-center bg-transparent border-none cursor-pointer">
                <i className="fas fa-graduation-cap text-blue-700 dark:text-blue-500 text-2xl mr-2"></i>
                <span className="text-xl font-bold text-blue-700 dark:text-white">EduSwati</span>
              </button>

              <nav className="hidden md:flex items-center space-x-6">
                {(['home','subjects','plans','about','contact'] as View[]).map(v => (
                  <button key={v} onClick={() => nav(v)}
                    className={`capitalize bg-transparent border-none cursor-pointer text-gray-600 hover:text-blue-700 dark:text-gray-300 dark:hover:text-white font-medium ${view === v ? 'text-blue-700 dark:text-blue-400 font-semibold' : ''}`}>
                    {v === 'plans' ? 'Subscription Plans' : v === 'home' ? 'Home' : v.charAt(0).toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </nav>

              <div className="flex items-center space-x-4">
                <button onClick={() => setDark(d => !d)} className="text-gray-600 dark:text-gray-300 p-2 bg-transparent border-none cursor-pointer">
                  <i className={`fas ${dark ? 'fa-sun' : 'fa-moon'}`}></i>
                </button>
                <div className="hidden md:flex items-center space-x-2">
                  <button onClick={openLogin} className="px-4 py-2 text-blue-700 border border-blue-700 rounded-md hover:bg-blue-700 hover:text-white transition-colors dark:text-blue-400 dark:border-blue-400 dark:hover:bg-blue-800 cursor-pointer">Login</button>
                  <button onClick={openSignup} className="px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800 transition-colors dark:bg-blue-600 dark:hover:bg-blue-700 cursor-pointer">Sign Up</button>
                </div>
                <button onClick={() => setMobileMenu(m => !m)} className="md:hidden text-gray-600 dark:text-gray-300 bg-transparent border-none cursor-pointer">
                  <i className={`fas ${mobileMenu ? 'fa-times' : 'fa-bars'}`}></i>
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenu && (
            <div className="md:hidden bg-white dark:bg-gray-900 shadow-lg w-full z-50">
              <div className="px-4 py-2 space-y-2">
                {(['home','subjects','plans','about','contact'] as View[]).map(v => (
                  <button key={v} onClick={() => nav(v)} className="block w-full text-left py-2 text-gray-600 dark:text-gray-300 bg-transparent border-none cursor-pointer capitalize">
                    {v === 'plans' ? 'Subscription Plans' : v.charAt(0).toUpperCase() + v.slice(1)}
                  </button>
                ))}
                <hr className="my-2 border-gray-200 dark:border-gray-700" />
                <button onClick={openLogin} className="w-full py-2 text-blue-700 border border-blue-700 rounded-md hover:bg-blue-700 hover:text-white transition-colors dark:text-blue-400 dark:border-blue-400 cursor-pointer">Login</button>
                <button onClick={openSignup} className="w-full py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800 transition-colors dark:bg-blue-600 cursor-pointer">Sign Up</button>
              </div>
            </div>
          )}
        </header>

        <main>
          {/* ── HOME ──────────────────────────────────────────────────── */}
          {view === 'home' && (
            <>
              {/* Hero */}
              <section className="relative bg-blue-700 text-white overflow-hidden">
                <div className="swazi-pattern absolute inset-0 opacity-10"></div>
                <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
                  <div className="grid md:grid-cols-2 gap-8 items-center">
                    <div className="animate-fade-in">
                      <h1 className="text-3xl md:text-5xl font-bold mb-4">Learn Smarter. Pass with Confidence.</h1>
                      <p className="text-xl mb-6 text-blue-100">The complete eLearning platform aligned with the Eswatini Curriculum.</p>
                      <div className="flex flex-wrap gap-4">
                        <button onClick={openSignup} className="btn-secondary">Start Learning Today</button>
                        <button onClick={() => nav('plans')} className="bg-transparent border-2 border-white text-white px-6 py-3 rounded-lg hover:bg-white hover:text-blue-700 transition-colors cursor-pointer">View Plans</button>
                      </div>
                      <div className="mt-8 flex flex-wrap items-center gap-4 text-blue-100">
                        <span><i className="fas fa-check-circle text-yellow-400 mr-2"></i>Accessible on any device</span>
                        <span><i className="fas fa-check-circle text-yellow-400 mr-2"></i>Expert educators</span>
                      </div>
                    </div>
                    <div className="hidden md:block">
                      <div className="bg-white bg-opacity-10 rounded-lg p-8 text-center">
                        <i className="fas fa-graduation-cap text-8xl text-yellow-400 mb-4"></i>
                        <p className="text-blue-100 text-lg font-medium">Eswatini&apos;s Premier Learning Platform</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-white dark:bg-gray-900 transform -skew-y-2 translate-y-8"></div>
              </section>

              {/* Subjects Overview */}
              <section className="py-16 bg-white dark:bg-gray-900">
                <div className="container mx-auto px-4">
                  <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">Comprehensive Subject Coverage</h2>
                    <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">Access quality educational content for all major subjects in the Eswatini curriculum.</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
                    {[
                      ['fa-calculator','Mathematics','Algebra, Geometry, Calculus'],
                      ['fa-book','English','Literature, Grammar, Writing'],
                      ['fa-comments','siSwati','Grammar, Literature, Culture'],
                      ['fa-flask','Physical Science','Physics, Chemistry'],
                      ['fa-leaf','Life Science','Biology, Ecology'],
                      ['fa-globe-africa','Geography','Physical, Human Geography'],
                      ['fa-landmark','History','World, African History'],
                      ['fa-laptop-code','ICT','Computer Science, Programming'],
                      ['fa-chart-line','Accounting','Financial, Management'],
                      ['fa-briefcase','Business Studies','Economics, Entrepreneurship'],
                    ].map(([icon, name, desc]) => (
                      <div key={name} className="card p-6 text-center">
                        <div className="subject-icon mx-auto"><i className={`fas ${icon}`}></i></div>
                        <h3 className="font-semibold text-lg mb-2 dark:text-white">{name}</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">{desc}</p>
                      </div>
                    ))}
                  </div>
                  <div className="text-center mt-10">
                    <button onClick={() => nav('subjects')} className="btn-primary">Explore All Subjects</button>
                  </div>
                </div>
              </section>

              {/* How It Works */}
              <section className="py-16 bg-gray-100 dark:bg-gray-800">
                <div className="container mx-auto px-4">
                  <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">How It Works</h2>
                    <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">Getting started with EduSwati is easy. Follow these simple steps:</p>
                  </div>
                  <div className="grid md:grid-cols-3 gap-8">
                    {[
                      ['1','Sign Up & Choose Your Grade','Create an account and select your current grade level to access tailored content.','fa-user-plus'],
                      ['2','Subscribe to a Plan','Choose a plan that fits your needs and make a secure payment using MTN MoMo or e-Mali.','fa-credit-card'],
                      ['3','Start Learning','Access all your textbooks, video lessons, and revision materials on any device, anytime.','fa-graduation-cap'],
                    ].map(([num, title, desc, icon]) => (
                      <div key={num} className="card p-8 text-center relative">
                        <div className="w-12 h-12 bg-blue-700 text-white rounded-full flex items-center justify-center text-xl font-bold mb-6 mx-auto">{num}</div>
                        <h3 className="text-xl font-bold mb-4 dark:text-white">{title}</h3>
                        <p className="text-gray-600 dark:text-gray-300">{desc}</p>
                        <div className="mt-6"><i className={`fas ${icon} text-4xl text-blue-700 dark:text-blue-500`}></i></div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Testimonials */}
              <section className="py-16 bg-white dark:bg-gray-900">
                <div className="container mx-auto px-4">
                  <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">What Our Students Say</h2>
                    <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">Hear from students across Eswatini who have improved their academic performance.</p>
                  </div>
                  <div className="swiper testimonialSwiper">
                    <div className="swiper-wrapper pb-12">
                      {[
                        ['SN','Sipho Nkambule','Grade 10, Mbabane',"EduSwati helped me improve my grades significantly. The video lessons make complex topics easy to understand, and I can access everything on my phone!"],
                        ['TD','Thandi Dlamini','Parent, Manzini',"As a parent, I appreciate that my daughter can access all her textbooks in one place. The subscription is affordable and the content is excellent."],
                        ['NM','Nomcebo Matsebula','Grade 12, Ezulwini',"Preparing for my EGCSE exams was much easier with EduSwati. The past exam papers and revision notes were invaluable. I got distinctions in all my subjects!"],
                        ['BM','Bongani Masuku','Grade 11, Manzini',"The video lessons are fantastic. I can pause and rewatch the parts I don't understand, which is something I can't do in a classroom."],
                      ].map(([init, name, grade, quote]) => (
                        <div key={name} className="swiper-slide">
                          <div className="testimonial-card h-full">
                            <p className="text-gray-600 dark:text-gray-300 mb-6">{quote}</p>
                            <div className="flex items-center">
                              <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center mr-4">
                                <span className="text-blue-700 font-bold">{init}</span>
                              </div>
                              <div>
                                <h4 className="font-bold dark:text-white">{name}</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{grade}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="swiper-pagination"></div>
                  </div>
                </div>
              </section>

              {/* FAQ */}
              <FaqSection />

              {/* CTA */}
              <section className="py-16 bg-gray-100 dark:bg-gray-800 text-center">
                <div className="container mx-auto px-4">
                  <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Ready to Boost Your Academic Performance?</h2>
                  <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">Join thousands of students across Eswatini who are improving their grades with EduSwati.</p>
                  <div className="flex flex-wrap justify-center gap-4">
                    <button onClick={openSignup} className="btn-primary">Start Learning Today</button>
                    <button onClick={() => nav('plans')} className="bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white px-6 py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors cursor-pointer">View Plans</button>
                  </div>
                  <div className="mt-10 flex flex-wrap justify-center items-center gap-6">
                    <div className="flex items-center"><i className="fas fa-mobile-alt text-2xl text-yellow-500 mr-3"></i><span className="text-gray-600 dark:text-gray-300">MTN MoMo Accepted</span></div>
                    <div className="flex items-center"><i className="fas fa-lock text-2xl text-green-600 mr-3"></i><span className="text-gray-600 dark:text-gray-300">Secure Payments</span></div>
                    <div className="flex items-center"><i className="fas fa-headset text-2xl text-blue-700 dark:text-blue-500 mr-3"></i><span className="text-gray-600 dark:text-gray-300">24/7 WhatsApp Support</span></div>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* ── PLANS ─────────────────────────────────────────────────── */}
          {view === 'plans' && <PlansPage openSignup={openSignup} goContact={() => nav('contact')} />}

          {/* ── SUBJECTS ──────────────────────────────────────────────── */}
          {view === 'subjects' && <SubjectsPage openLogin={openLogin} />}

          {/* ── CONTACT ───────────────────────────────────────────────── */}
          {view === 'contact' && <ContactPage />}

          {/* ── ABOUT ─────────────────────────────────────────────────── */}
          {view === 'about' && <AboutPage />}
        </main>

        {/* ── FOOTER ────────────────────────────────────────────────────── */}
        <footer className="bg-blue-900 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="flex items-center mb-4">
                  <i className="fas fa-graduation-cap text-yellow-400 text-2xl mr-2"></i>
                  <span className="text-xl font-bold">EduSwati</span>
                </div>
                <p className="text-blue-200 text-sm">Empowering Eswatini students with quality digital education aligned with the national curriculum.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-4 text-yellow-400">Quick Links</h4>
                <ul className="space-y-2 text-blue-200 text-sm">
                  {(['home','subjects','plans','about','contact'] as View[]).map(v => (
                    <li key={v}><button onClick={() => nav(v)} className="hover:text-white transition-colors bg-transparent border-none cursor-pointer text-blue-200 capitalize">{v === 'plans' ? 'Subscription Plans' : v.charAt(0).toUpperCase() + v.slice(1)}</button></li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4 text-yellow-400">Subjects</h4>
                <ul className="space-y-2 text-blue-200 text-sm">
                  {['Mathematics','English','siSwati','Physical Science','Life Science','ICT'].map(s => (
                    <li key={s}><button onClick={() => nav('subjects')} className="hover:text-white transition-colors bg-transparent border-none cursor-pointer text-blue-200">{s}</button></li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4 text-yellow-400">Contact</h4>
                <ul className="space-y-2 text-blue-200 text-sm">
                  <li className="flex items-start"><i className="fas fa-map-marker-alt mt-1 mr-2"></i><span>Mbabane Office Park, Eswatini</span></li>
                  <li className="flex items-center"><i className="fas fa-phone mr-2"></i><span>+268 2404 1234</span></li>
                  <li className="flex items-center"><i className="fas fa-envelope mr-2"></i><span>info@eduswati.com</span></li>
                  <li className="flex items-center"><i className="fab fa-whatsapp mr-2 text-green-400"></i><span>+268 76 123 4567</span></li>
                </ul>
              </div>
            </div>
            <hr className="border-blue-800 mb-6" />
            <div className="flex flex-col md:flex-row justify-between items-center text-blue-300 text-sm">
              <p>© 2024 EduSwati. All rights reserved.</p>
              <div className="flex space-x-4 mt-4 md:mt-0">
                <button onClick={openLogin} className="hover:text-white transition-colors bg-transparent border-none cursor-pointer text-blue-300">Login</button>
                <button onClick={openSignup} className="hover:text-white transition-colors bg-transparent border-none cursor-pointer text-blue-300">Sign Up</button>
              </div>
            </div>
          </div>
        </footer>

      </div>{/* end dark wrapper */}

      {/* ── AUTH MODALS ───────────────────────────────────────────────────── */}
      {modal !== 'none' && (
        <ModalBackdrop onClose={closeModal}>
          {modal === 'login'  && <LoginModal  onClose={closeModal} onForgot={openForgot} onSignup={openSignup} />}
          {modal === 'signup' && <SignupModal  onClose={closeModal} onLogin={openLogin} />}
          {modal === 'forgot' && <ForgotModal  onClose={closeModal} onLogin={openLogin} />}
        </ModalBackdrop>
      )}
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL BACKDROP
// ─────────────────────────────────────────────────────────────────────────────
function ModalBackdrop({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(2px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN MODAL
// ─────────────────────────────────────────────────────────────────────────────
function LoginModal({ onClose, onForgot, onSignup }: { onClose: () => void; onForgot: () => void; onSignup: () => void }) {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) { setError(authError.message); setLoading(false); return }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Login failed. Please try again.'); setLoading(false); return }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    router.push(profile?.role === 'admin' ? '/admin' : '/dashboard')
  }

  return (
    <div className="modal-box bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
      <ModalHeader title="Welcome Back" subtitle="Sign in to your EduSwati account" onClose={onClose} />
      <div className="p-7">
        {error && <ErrorBox msg={error} />}
        <form onSubmit={handleLogin} className="space-y-4">
          <Field label="Email Address">
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" className="form-input" />
          </Field>
          <Field label="Password">
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" className="form-input" style={{ paddingRight: '2.5rem' }} />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer">
                <i className={`fas ${showPw ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
              </button>
            </div>
          </Field>
          <div className="flex justify-between items-center text-sm">
            <span></span>
            <button type="button" onClick={onForgot} className="text-blue-700 font-medium hover:underline bg-transparent border-none cursor-pointer">Forgot password?</button>
          </div>
          <AuthBtn loading={loading} label="Sign In" loadingLabel="Signing in…" />
        </form>
        <p className="text-center text-sm text-gray-500 mt-5">
          Don&apos;t have an account?{' '}
          <button onClick={onSignup} className="text-blue-700 font-semibold hover:underline bg-transparent border-none cursor-pointer">Sign Up Free</button>
        </p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SIGN UP MODAL
// ─────────────────────────────────────────────────────────────────────────────
function SignupModal({ onClose, onLogin }: { onClose: () => void; onLogin: () => void }) {
  const supabase = createClient()
  const [form, setForm] = useState({ fullName: '', email: '', grade: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault(); setError('')
    if (!form.grade) { setError('Please select your grade'); return }
    if (form.password !== form.confirm) { setError('Passwords do not match'); return }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    const { error: authError } = await supabase.auth.signUp({
      email: form.email, password: form.password,
      options: {
        data: { full_name: form.fullName, role: 'student', grade: parseInt(form.grade) },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    setLoading(false)
    if (authError) { setError(authError.message); return }
    setSuccess(true)
  }

  if (success) {
    return (
      <div className="modal-box bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl text-center p-10">
        <div className="text-6xl mb-4">📧</div>
        <h3 className="text-xl font-bold text-blue-900 mb-2">Check your email!</h3>
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
          We sent a confirmation link to <strong>{form.email}</strong>.<br />
          Click the link to activate your account, then log in.
        </p>
        <button onClick={onLogin} className="btn-primary w-full">Go to Login</button>
      </div>
    )
  }

  return (
    <div className="modal-box bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
      <ModalHeader title="Create Account" subtitle="Start your learning journey today" onClose={onClose} />
      <div className="p-7">
        {error && <ErrorBox msg={error} />}
        <form onSubmit={handleSignup} className="space-y-3">
          <Field label="Full Name">
            <input type="text" required value={form.fullName} onChange={set('fullName')} placeholder="Sipho Nkosi" className="form-input" />
          </Field>
          <Field label="Email Address">
            <input type="email" required value={form.email} onChange={set('email')} placeholder="sipho@example.com" className="form-input" />
          </Field>
          <Field label="Grade">
            <select required value={form.grade} onChange={set('grade')} className="form-select">
              <option value="">Choose your grade</option>
              {GRADES.map(g => <option key={g} value={g}>Grade {g}</option>)}
            </select>
          </Field>
          <Field label="Password">
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} required minLength={6} value={form.password} onChange={set('password')}
                placeholder="At least 6 characters" className="form-input" style={{ paddingRight: '2.5rem' }} />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer">
                <i className={`fas ${showPw ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
              </button>
            </div>
          </Field>
          <Field label="Confirm Password">
            <input type="password" required value={form.confirm} onChange={set('confirm')} placeholder="Repeat password" className="form-input" />
          </Field>
          <div className="pt-1">
            <AuthBtn loading={loading} label="Create Account" loadingLabel="Creating account…" />
          </div>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{' '}
          <button onClick={onLogin} className="text-blue-700 font-semibold hover:underline bg-transparent border-none cursor-pointer">Login</button>
        </p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FORGOT PASSWORD MODAL
// ─────────────────────────────────────────────────────────────────────────────
function ForgotModal({ onClose, onLogin }: { onClose: () => void; onLogin: () => void }) {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleReset(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError('')
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    setSent(true)
  }

  if (sent) {
    return (
      <div className="modal-box bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl text-center p-10">
        <div className="text-6xl mb-4">✅</div>
        <h3 className="text-xl font-bold text-blue-900 mb-2">Reset link sent!</h3>
        <p className="text-gray-500 text-sm mb-6">Check <strong>{email}</strong> for a password reset link.</p>
        <button onClick={onLogin} className="btn-primary w-full">Back to Login</button>
      </div>
    )
  }

  return (
    <div className="modal-box bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
      <ModalHeader title="Reset Password" subtitle="We'll send you a reset link" onClose={onClose} />
      <div className="p-7">
        {error && <ErrorBox msg={error} />}
        <p className="text-sm text-gray-500 mb-4">Enter the email address associated with your account and we&apos;ll email you a link to reset your password.</p>
        <form onSubmit={handleReset} className="space-y-4">
          <Field label="Email Address">
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" className="form-input" />
          </Field>
          <AuthBtn loading={loading} label="Send Reset Link" loadingLabel="Sending…" />
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          <button onClick={onLogin} className="text-blue-700 font-semibold hover:underline bg-transparent border-none cursor-pointer">← Back to Login</button>
        </p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED MICRO-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
function ModalHeader({ title, subtitle, onClose }: { title: string; subtitle: string; onClose: () => void }) {
  return (
    <div className="relative bg-blue-800 text-white text-center py-7 px-6">
      <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-yellow-400 text-blue-900 font-extrabold text-lg mb-3">ES</div>
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="text-sm text-blue-200 mt-1">{subtitle}</p>
      <button onClick={onClose} className="absolute top-4 right-4 text-white text-opacity-70 hover:text-opacity-100 bg-transparent border-none cursor-pointer text-lg">
        <i className="fas fa-times"></i>
      </button>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</label>
      {children}
    </div>
  )
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-3">
      <i className="fas fa-exclamation-circle mt-0.5 flex-shrink-0"></i>
      <span>{msg}</span>
    </div>
  )
}

function AuthBtn({ loading, label, loadingLabel }: { loading: boolean; label: string; loadingLabel: string }) {
  return (
    <button type="submit" disabled={loading}
      className="w-full py-3 rounded-lg font-semibold text-white text-base transition-all cursor-pointer border-none"
      style={{ background: loading ? '#6b7fbe' : '#1a3a8f' }}>
      {loading ? <><i className="fas fa-circle-notch fa-spin mr-2"></i>{loadingLabel}</> : label}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FAQ SECTION (shared between Home and Plans)
// ─────────────────────────────────────────────────────────────────────────────
function FaqSection() {
  const [open, setOpen] = useState<number | null>(null)
  const toggle = (n: number) => setOpen(o => o === n ? null : n)
  const faqs = [
    ['How does the subscription system work?', 'You can subscribe on a monthly, termly, or annual basis. We accept payments via MTN MoMo, e-Mali, and bank transfers for schools. Once your payment is confirmed, you\'ll get immediate access to all content for your grade level.'],
    ['Is all content aligned with the Eswatini curriculum?', 'Yes, all our content is specifically designed for the Eswatini curriculum at both Junior Certificate (JC) and Eswatini General Certificate of Secondary Education (EGCSE) levels. Our content is regularly updated to match any curriculum changes.'],
    ['Can I access the content offline?', 'Yes, you can download eBooks, notes, and selected video lessons for offline use. The annual subscription provides the most comprehensive offline access options.'],
    ['What devices can I use to access EduSwati?', 'EduSwati works on smartphones, tablets, laptops, and desktop computers. Our platform is optimized for mobile use since most students in Eswatini access the internet via smartphones.'],
    ['How do I get support if I have questions?', 'We provide support via WhatsApp, email, and phone. You can also visit our FAQ section or send a message through the contact form on our website. We aim to respond to all queries within 24 hours.'],
  ]
  return (
    <section className="py-16 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">Frequently Asked Questions</h2>
        </div>
        {faqs.map(([q, a], i) => (
          <div key={i} className="mb-4">
            <button onClick={() => toggle(i)} className="flex justify-between items-center w-full p-5 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-none text-left">
              <span className="font-semibold dark:text-white">{q}</span>
              <i className={`fas ${open === i ? 'fa-chevron-up' : 'fa-chevron-down'} text-gray-400 flex-shrink-0 ml-4`}></i>
            </button>
            {open === i && (
              <div className="p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-b-lg">
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{a}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PLANS PAGE
// ─────────────────────────────────────────────────────────────────────────────
function PlansPage({ openSignup, goContact }: { openSignup: () => void; goContact: () => void }) {
  const plans = [
    { name: 'Monthly Plan', price: 'E99', period: '/month', badge: null, save: null, cta: 'Best for students who want to try the platform',
      features: ['Full access to all subjects','Online textbooks','Video lessons','Basic revision notes','Past exam papers'],
      missing: ['Offline downloads','Mock exams'] },
    { name: 'Termly Plan', price: 'E249', period: '/term', badge: 'POPULAR', save: 'Save E48 per term', cta: 'Perfect for term-by-term learning',
      features: ['Everything in Monthly','Downloadable resources','Progress tracking','Revision quizzes','Detailed study guides','Limited offline access'],
      missing: ['Priority support'] },
    { name: 'Annual Plan', price: 'E899', period: '/year', badge: null, save: 'Save E289 per year', cta: 'Best value for serious students',
      features: ['Everything in Termly','Full offline access','Mock exam simulations','Performance analytics','Premium study resources','Priority support','AI Homework Assistant'],
      missing: [] },
  ]
  return (
    <>
      <section className="bg-blue-700 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-4">Subscription Plans</h1>
          <p className="text-xl text-blue-100">Choose the right plan for your educational journey.</p>
        </div>
      </section>
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">Our Flexible Plans</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">Affordable options designed for Eswatini students.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map(p => (
              <div key={p.name} className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden relative ${p.badge ? 'border-4 border-yellow-400' : ''}`}>
                {p.badge && <div className="absolute top-0 right-0 bg-yellow-400 text-blue-900 py-1 px-4 rounded-bl-lg font-semibold text-sm">{p.badge}</div>}
                <div className="p-6 text-center border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{p.name}</h3>
                  <div className="mt-4 flex items-center justify-center">
                    <span className="text-3xl font-semibold text-gray-800 dark:text-white">{p.price}</span>
                    <span className="text-gray-500 dark:text-gray-400 ml-2">{p.period}</span>
                  </div>
                  {p.save && <p className="mt-2 text-sm text-green-600 dark:text-green-400">{p.save}</p>}
                </div>
                <div className="p-6 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  <ul className="space-y-3">
                    {p.features.map(f => <li key={f} className="flex items-center"><i className="fas fa-check text-green-500 mr-2"></i><span>{f}</span></li>)}
                    {p.missing.map(f => <li key={f} className="flex items-center"><i className="fas fa-times text-red-500 mr-2"></i><span>{f}</span></li>)}
                  </ul>
                  <div className="mt-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{p.cta}</p>
                    <button onClick={openSignup} className="w-full py-3 bg-blue-700 text-white rounded-md hover:bg-blue-800 transition-colors cursor-pointer border-none">Subscribe Now</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-16 text-center">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Special Plans for Schools</h3>
            <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg max-w-3xl mx-auto">
              <p className="text-gray-600 dark:text-gray-300 mb-6">We offer special bulk subscription rates for schools and educational institutions.</p>
              <div className="grid md:grid-cols-2 gap-6">
                {[['School Basic','For up to 50 students with basic access to all educational resources.'],['School Premium','For unlimited students with full access to all premium features.']].map(([n,d]) => (
                  <div key={n} className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow">
                    <h4 className="text-xl font-semibold mb-4 dark:text-white">{n}</h4>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">{d}</p>
                    <p className="text-lg font-bold text-gray-800 dark:text-white">Contact for pricing</p>
                  </div>
                ))}
              </div>
              <button onClick={goContact} className="mt-8 btn-primary">Request School Quote</button>
            </div>
          </div>
        </div>
      </section>
      <section className="bg-blue-700 text-white py-12 text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-4">Payment Methods</h2>
          <div className="flex flex-wrap justify-center gap-6 items-center">
            <div className="bg-white text-blue-700 p-4 rounded-lg font-bold text-lg">MTN MoMo</div>
            <div className="bg-white text-blue-700 p-4 rounded-lg font-bold text-lg">e-Mali</div>
            <div className="bg-white text-blue-700 p-4 rounded-lg font-bold text-lg">Bank Transfer</div>
          </div>
          <p className="mt-6 text-blue-100">Secure, easy payments with instant subscription activation</p>
        </div>
      </section>
      <FaqSection />
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBJECTS PAGE
// ─────────────────────────────────────────────────────────────────────────────
function SubjectsPage({ openLogin }: { openLogin: () => void }) {
  const subjects = [
    { icon: 'fa-calculator', name: 'Mathematics', tags: ['JC','EGCSE'], desc: 'Comprehensive mathematics coverage including algebra, geometry, calculus, and statistics.', topics: ['Number Systems & Operations','Algebra & Equations','Geometry & Trigonometry','Statistics & Probability','Calculus (EGCSE)'] },
    { icon: 'fa-book', name: 'English Language', tags: ['JC','EGCSE'], desc: 'Develop essential English language skills for academic success and effective communication.', topics: ['Grammar & Vocabulary','Reading Comprehension','Essay Writing','Literature Analysis','Speaking & Listening Skills'] },
    { icon: 'fa-comments', name: 'siSwati', tags: ['JC','EGCSE'], desc: 'Master the national language of Eswatini through comprehensive language and cultural studies.', topics: ['Grammar & Vocabulary','Literature & Poetry','Cultural Context','Writing & Composition','Oral Tradition'] },
    { icon: 'fa-flask', name: 'Physical Science', tags: ['JC','EGCSE'], desc: 'Explore the fundamental principles of physics and chemistry through engaging content.', topics: ['Forces & Motion','Energy & Work','Acids, Bases & Salts','Chemical Reactions','Electricity & Magnetism'] },
    { icon: 'fa-leaf', name: 'Life Science', tags: ['JC','EGCSE'], desc: 'Discover the wonders of biology and ecology in the natural world.', topics: ['Cell Biology','Photosynthesis','Genetics & Heredity','Human Body Systems','Ecology & Environment'] },
    { icon: 'fa-globe-africa', name: 'Geography', tags: ['JC','EGCSE'], desc: 'Understand our physical world and human interactions with the environment.', topics: ['Physical Geography','Climate & Weather','Human Settlement','Economic Activities','Map Reading & GIS'] },
    { icon: 'fa-landmark', name: 'History', tags: ['JC','EGCSE'], desc: 'Study the events and movements that shaped our world and Africa.', topics: ['African History','Colonialism & Independence','World War I & II','Cold War','Eswatini History'] },
    { icon: 'fa-laptop-code', name: 'ICT', tags: ['JC','EGCSE'], desc: 'Build essential computer science and programming skills for the digital age.', topics: ['Computer Hardware & Software','Internet & Networks','Programming Basics','Database Concepts','Digital Citizenship'] },
    { icon: 'fa-chart-line', name: 'Accounting', tags: ['EGCSE'], desc: 'Master financial accounting concepts and business record-keeping.', topics: ['Double Entry Bookkeeping','Financial Statements','Trial Balance','Depreciation','Cash Flow Statements'] },
    { icon: 'fa-store', name: 'Commerce', tags: ['JC'], desc: 'Learn the foundations of trade, business, and the economy.', topics: ['Business Structures','Trade & Commerce','Banking & Finance','Consumer Rights','Business Communication'] },
    { icon: 'fa-seedling', name: 'Agriculture', tags: ['JC','EGCSE'], desc: 'Study agricultural science and sustainable farming practices.', topics: ['Soil Science','Crop Production','Animal Husbandry','Farm Management','Agricultural Economics'] },
    { icon: 'fa-briefcase', name: 'Business Studies', tags: ['EGCSE'], desc: 'Understand business management and entrepreneurial principles.', topics: ['Business Planning','Marketing','Human Resources','Financial Management','EGCSE Exam Preparation'] },
  ]
  return (
    <>
      <section className="bg-blue-700 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-4">Our Subjects</h1>
          <p className="text-xl text-blue-100">Comprehensive coverage of the Eswatini curriculum.</p>
        </div>
      </section>
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">Junior Certificate (JC) &amp; EGCSE Subjects</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">All subjects are aligned with the national curriculum and regularly updated.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {subjects.map(s => (
              <div key={s.name} className="card p-6 flex flex-col">
                <div className="flex items-center mb-4">
                  <div className="subject-icon mr-4 flex-shrink-0"><i className={`fas ${s.icon}`}></i></div>
                  <div>
                    <h3 className="font-bold text-xl mb-1 dark:text-white">{s.name}</h3>
                    <div className="flex space-x-2">
                      {s.tags.map(t => <span key={t} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full dark:bg-blue-900 dark:text-blue-300">{t}</span>)}
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">{s.desc}</p>
                <div className="mt-auto">
                  <h4 className="font-semibold dark:text-white mb-2 text-sm">Topics include:</h4>
                  <ul className="text-gray-600 dark:text-gray-300 text-sm space-y-1 mb-4">
                    {s.topics.map(t => <li key={t}>• {t}</li>)}
                  </ul>
                  <button onClick={openLogin} className="w-full py-2 border border-blue-700 text-blue-700 rounded hover:bg-blue-700 hover:text-white transition-colors dark:border-blue-500 dark:text-blue-500 dark:hover:bg-blue-700 cursor-pointer">View Content</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTACT PAGE
// ─────────────────────────────────────────────────────────────────────────────
function ContactPage() {
  const [sent, setSent] = useState(false)
  const [faq, setFaq] = useState<number | null>(null)
  const [form, setForm] = useState({ name:'', email:'', phone:'', subject:'', message:'' })
  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm(p => ({...p, [f]: e.target.value}))

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); setSent(true) }

  return (
    <>
      <section className="bg-blue-700 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl text-blue-100">We&apos;re here to help with any questions about EduSwati.</p>
        </div>
      </section>
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <div>
              <h2 className="text-2xl font-bold mb-6 dark:text-white">Get in Touch</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-8 text-sm leading-relaxed">Have questions about our platform, subscriptions, or need technical support? Fill out the form and our team will get back to you as soon as possible.</p>
              {sent ? (
                <div className="text-center py-10">
                  <div className="text-5xl mb-4">✅</div>
                  <h3 className="text-xl font-bold text-blue-900 mb-2">Message sent!</h3>
                  <p className="text-gray-500 text-sm">We&apos;ll get back to you within 24 hours.</p>
                  <button onClick={() => setSent(false)} className="mt-4 text-blue-700 text-sm underline bg-transparent border-none cursor-pointer">Send another message</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {[['name','Full Name','text','Your full name'],['email','Email Address','email','Your email address'],['phone','Phone Number','tel','Your phone number']].map(([f,l,t,p]) => (
                    <div key={f}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{l}</label>
                      <input type={t} name={f} placeholder={p} value={(form as any)[f]} onChange={set(f)} className="form-input" />
                    </div>
                  ))}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                    <select name="subject" value={form.subject} onChange={set('subject')} className="form-select">
                      <option value="">Select a subject</option>
                      {['Subscription Inquiry','Technical Support','Content Question','School Partnership','Other'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message</label>
                    <textarea name="message" rows={4} placeholder="Your message" value={form.message} onChange={set('message')} className="form-input" style={{resize:'vertical'}} />
                  </div>
                  <button type="submit" className="btn-primary w-full">Send Message</button>
                </form>
              )}
            </div>
            <div className="mt-10 md:mt-0">
              <h2 className="text-2xl font-bold mb-6 dark:text-white">Contact Information</h2>
              <div className="space-y-6">
                {[
                  ['fa-map-marker-alt','Office Address','Mbabane Office Park\nMhlambanyatsi Road\nMbabane, Eswatini'],
                  ['fa-phone','Phone','+268 2404 1234\n+268 76 123 4567 (WhatsApp)'],
                  ['fa-envelope','Email','info@eduswati.com\nsupport@eduswati.com'],
                  ['fa-clock','Office Hours','Monday - Friday: 8:00 AM - 5:00 PM\nSaturday: 9:00 AM - 12:00 PM\nSunday: Closed'],
                ].map(([icon, title, info]) => (
                  <div key={title} className="flex items-start">
                    <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full text-blue-700 dark:text-blue-300 mr-4 flex-shrink-0">
                      <i className={`fas ${icon}`}></i>
                    </div>
                    <div>
                      <h3 className="font-semibold dark:text-white mb-1">{title}</h3>
                      {info.split('\n').map((l,i) => <p key={i} className="text-gray-600 dark:text-gray-300 text-sm">{l}</p>)}
                    </div>
                  </div>
                ))}
              </div>
              {/* Contact FAQ */}
              <div className="mt-10">
                <h3 className="text-xl font-bold mb-4 dark:text-white">Common Questions</h3>
                {[['Can I change my subscription plan?','Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.'],
                  ['How long does it take to activate my account?','Account activation is instant once payment is confirmed. You\'ll receive an email with your login details.'],
                  ['Do you offer school or group discounts?','Yes, we offer special rates for schools and educational institutions. Please contact our team at info@eduswati.com to discuss bulk subscription options.'],
                ].map(([q, a], i) => (
                  <div key={i} className="mb-3">
                    <button onClick={() => setFaq(f => f === i ? null : i)} className="flex justify-between items-center w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-none text-left">
                      <span className="font-medium dark:text-white text-sm">{q}</span>
                      <i className={`fas ${faq === i ? 'fa-chevron-up' : 'fa-chevron-down'} text-gray-400 ml-4 flex-shrink-0`}></i>
                    </button>
                    {faq === i && <div className="p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-b-lg text-gray-600 dark:text-gray-300 text-sm">{a}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ABOUT PAGE
// ─────────────────────────────────────────────────────────────────────────────
function AboutPage() {
  return (
    <>
      <section className="bg-blue-700 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-4">About EduSwati</h1>
          <p className="text-xl text-blue-100">Empowering Eswatini&apos;s students with quality digital education.</p>
        </div>
      </section>
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Our Mission</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">EduSwati was created with a clear mission: to make high-quality education accessible to every student in Eswatini, regardless of their location or socioeconomic background.</p>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">We believe that digital technology can bridge educational gaps and provide equal learning opportunities for all students. By offering curriculum-aligned resources accessible on mobile devices, we aim to support academic success across the country.</p>
              <p className="text-lg text-gray-600 dark:text-gray-300">Our platform is designed to complement traditional classroom learning, providing students with additional resources, practice materials, and revision tools to help them excel in their studies.</p>
            </div>
            <div className="mt-8 md:mt-0">
              <div className="bg-gradient-to-br from-blue-700 to-blue-900 rounded-lg p-12 text-center text-white">
                <i className="fas fa-graduation-cap text-8xl text-yellow-400 mb-6"></i>
                <p className="text-xl font-semibold">Transforming Education in Eswatini</p>
                <p className="text-blue-200 mt-2">Since 2024</p>
              </div>
            </div>
          </div>
          <div className="mt-20">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6 text-center">Why Choose EduSwati?</h2>
            <div className="grid md:grid-cols-3 gap-8 mt-10">
              {[
                ['fa-check-circle','Curriculum Aligned','All our content is specifically developed for the Eswatini national curriculum at both JC and EGCSE levels.'],
                ['fa-mobile-alt','Mobile Optimized','Designed for smartphones and tablets, making learning accessible anywhere, even with limited data.'],
                ['fa-wallet','Affordable Access','Flexible subscription options with local payment methods make quality education accessible to all.'],
                ['fa-chalkboard-teacher','Expert Educators','Our content is created by experienced Eswatini teachers who understand the local educational context.'],
                ['fa-book-open','Comprehensive Resources','From textbooks and notes to video lessons and practice exams — everything in one platform.'],
                ['fa-headset','Local Support','Our support team is based in Eswatini and understands the local educational context and challenges.'],
              ].map(([icon, title, desc]) => (
                <div key={title} className="text-center">
                  <div className="bg-blue-100 dark:bg-blue-900 w-16 h-16 rounded-full flex items-center justify-center text-blue-700 dark:text-blue-300 mx-auto mb-6">
                    <i className={`fas ${icon} text-2xl`}></i>
                  </div>
                  <h3 className="text-xl font-bold mb-4 dark:text-white">{title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">{desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-20 max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Our Story</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">EduSwati was founded by a team of Eswatini educators and technology professionals who saw a gap in accessible, curriculum-aligned digital resources for local students. Built with the Swazi student in mind — affordable, mobile-first, and fully aligned with the national curriculum — we are committed to raising academic achievement across the Kingdom.</p>
          </div>
        </div>
      </section>
    </>
  )
}
