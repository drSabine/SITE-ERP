import { Head, Link } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

const UNIVERSITY = 'St. Paul University Philippines';
const DEPARTMENT = 'School of Information Technology and Engineering';
const FOOTER = 'Project created by BSIT-3B Major in Website Development as a requirement for ITE 125. S.Y 2025-2026.';

const PROGRAMS = [
    { code: 'BSIT',   name: 'Bachelor of Science in Information Technology' },
    { code: 'BSCpE',  name: 'Bachelor of Science in Computer Engineering' },
    { code: 'BLIS',   name: 'Bachelor of Library and Information Science' },
    { code: 'BSCE',   name: 'Bachelor of Science in Civil Engineering' },
    { code: 'BSENSE', name: 'Bachelor of Science in Environmental & Sanitary Engineering' },
];

function SignInLink({ className = '' }) {
    return (
        <Link
            href={route('login')}
            className={`inline-flex items-center justify-center border border-emerald-700 bg-emerald-700 px-6 py-2.5 text-xs font-semibold uppercase tracking-widest text-white transition-colors duration-200 hover:bg-emerald-800 ${className}`}
        >
            Sign In
        </Link>
    );
}

function Reveal({ children, className = '', delay = 0 }) {
    const elementRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const element = elementRef.current;
        if (!element) return undefined;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            { threshold: 0.18 }
        );

        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={elementRef}
            className={`transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'} ${className}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
}

export default function Landing() {
    return (
        <div className="flex min-h-screen flex-col bg-white text-gray-900">
            <Head title="St. Paul University Philippines · SITE">
                <link rel="preload" as="image" href="/images/spup-bg-landing-page.jpg" />
            </Head>

            {/* Hero */}
            <main className="flex-1">
                <section className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-emerald-950 bg-[url('/images/spup-bg-landing-page.jpg')] bg-cover bg-center" aria-hidden="true" />
                    <div className="absolute inset-0 bg-emerald-950/80" aria-hidden="true" />
                    <div className="relative z-10 mx-auto max-w-3xl px-6 py-20 text-center sm:py-28">
                        <div className="landing-hero-item mb-8 flex justify-center">
                            <img
                                src="/images/SPUP-final-logo.png"
                                alt="SPUP Seal"
                                className="h-28 w-28 object-contain drop-shadow-xl"
                            />
                        </div>

                        <p className="landing-hero-item mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-emerald-100">
                            Welcome to
                        </p>

                        <h1
                            className="landing-hero-item text-4xl font-normal leading-tight tracking-wide text-white drop-shadow-md sm:text-5xl"
                            style={{ fontFamily: "'OldEnglish', serif" }}
                        >
                            {UNIVERSITY}
                        </h1>

                        <p className="landing-hero-item mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-100">
                            {DEPARTMENT}
                        </p>

                        <p className="landing-hero-item mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/85">
                            The academic information system for managing programs, enrollment, grading, and accreditation.
                        </p>

                        <div className="landing-hero-item mt-10">
                            <SignInLink className="px-8 py-3 text-sm shadow-lg shadow-black/30" />
                        </div>
                    </div>
                </section>

                {/* Programs */}
                <section className="border-y border-gray-200 bg-gray-50">
                    <div className="mx-auto max-w-6xl px-6 py-20">
                        <Reveal className="text-center">
                            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">What We Offer</p>
                            <h2 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">Academic Programs</h2>
                        </Reveal>

                        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {PROGRAMS.map((program, index) => (
                                <Reveal key={program.code} delay={index * 80} className="h-full">
                                    <div className="h-full border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-700 hover:shadow-md">
                                        <p className="text-lg font-bold tracking-wide text-emerald-800">{program.code}</p>
                                        <p className="mt-2 text-sm leading-relaxed text-gray-600">{program.name}</p>
                                    </div>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t border-emerald-800 bg-emerald-900">
                <Reveal className="mx-auto max-w-6xl px-6 py-14">
                    <div className="grid gap-10 sm:grid-cols-3">
                        <div>
                            <p className="text-lg text-white" style={{ fontFamily: "'OldEnglish', serif" }}>{UNIVERSITY}</p>
                            <p className="mt-2 text-sm leading-relaxed text-emerald-200">{DEPARTMENT}</p>
                        </div>

                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-yellow-400 opacity-70">Programs</p>
                            <ul className="mt-3 space-y-1.5 text-sm text-emerald-200">
                                {PROGRAMS.map((program) => (
                                    <li key={program.code}>{program.code}</li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-yellow-400 opacity-70">Get Started</p>
                            <p className="mt-3 text-sm leading-relaxed text-emerald-200">
                                Already enrolled or assigned a role? Sign in to access your dashboard.
                            </p>
                            <SignInLink className="mt-4 border-emerald-300 bg-transparent text-emerald-100 hover:bg-emerald-800" />
                        </div>
                    </div>

                    <div className="mt-10 flex flex-col gap-3 border-t border-emerald-800 pt-6 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-emerald-400">&copy; {new Date().getFullYear()} {UNIVERSITY}</p>
                        <p className="text-xs text-emerald-400">{FOOTER}</p>
                    </div>
                </Reveal>
            </footer>

            <style>{`
                @keyframes rise {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .landing-hero-item {
                    opacity: 0;
                    animation: rise 600ms cubic-bezier(0.16, 1, 0.3, 1) both;
                }

                .landing-hero-item:nth-of-type(1) { animation-delay: 60ms; }
                .landing-hero-item:nth-of-type(2) { animation-delay: 140ms; }
                .landing-hero-item:nth-of-type(3) { animation-delay: 220ms; }
                .landing-hero-item:nth-of-type(4) { animation-delay: 300ms; }
                .landing-hero-item:nth-of-type(5) { animation-delay: 380ms; }
                .landing-hero-item:nth-of-type(6) { animation-delay: 460ms; }

                @media (prefers-reduced-motion: reduce) {
                    .landing-hero-item {
                        opacity: 1;
                        animation: none;
                        transform: none;
                    }
                }
            `}</style>
        </div>
    );
}
