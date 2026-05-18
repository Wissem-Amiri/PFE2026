'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { getAllJobs, isJobOpen } from '@/app/api/job'
import type { Job } from '@/lib/database.types'
import { Spin, Select } from 'antd'
import { BiArrowToTop } from "react-icons/bi";
import { SearchOutlined } from '@ant-design/icons'

export default function LandingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loadingJobs, setLoadingJobs] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeNav, setActiveNav] = useState('')
  const [statusFilter, setStatusFilter] = useState<'Open' | 'Closed'>('Open')
  const [dateSort, setDateSort] = useState<'closing_soon' | 'closing_late'>('closing_soon')
  const [categoryFilter, setCategoryFilter] = useState('All Categories')
  const [categories, setCategories] = useState<string[]>([])
  const [previewJob, setPreviewJob] = useState<Job | null>(null)

  // Fetch categories once on mount
  useEffect(() => {
    async function fetchCategories() {
      const { data } = await getAllJobs()
      if (data) {
        const uniqueCats = Array.from(new Set(data.map(j => j.category).filter(Boolean)))
        setCategories(uniqueCats)
      }
    }
    fetchCategories()
  }, [])

  // Fetch jobs based on filters
  useEffect(() => {
    async function fetchJobs() {
      setLoadingJobs(true)
      try {
        const { data, error } = await getAllJobs({
          search: searchTerm,
          category: categoryFilter,
          status: statusFilter,
          sort: dateSort
        })
        if (!error && data) {
          setJobs(data)
        }
      } catch (err) {
        console.error("Error fetching jobs:", err)
      } finally {
        setLoadingJobs(false)
      }
    }
    fetchJobs()
  }, [searchTerm, categoryFilter, statusFilter, dateSort])

  const handleApplyClick = (jobId?: string) => {
    if (user) {
      if (jobId) {
        router.push(`/dashboard/candidate/apply/${jobId}`)
      } else {
        router.push('/dashboard/candidate')
      }
    } else {
      const loginPath = jobId ? `/login?applyTo=${jobId}` : '/login'
      router.push(loginPath)
    }
  }

  return (
    <div className="relative w-full min-h-screen bg-white font-['Inter',sans-serif] text-[#494453] overflow-x-hidden selection:bg-[#7F56D9] selection:text-white">

      {/* --- Header / TopNavBar --- */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/80 border-b border-[#eaecf0]">
        <div className="flex items-center justify-between max-w-[1280px] mx-auto px-6 py-4 lg:px-8">
          <div className="flex items-center gap-2">
            <img src="/assets/UnifyHR.png" alt="UnifyHR Logo" className="h-[120px] w-auto object-contain -my-10 -ml-4" />
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Link href="#mission" onClick={() => setActiveNav('mission')} className={`nav-link ${activeNav === 'mission' ? 'active' : ''}`}>Our Mission</Link>
            <Link href="#solutions" onClick={() => setActiveNav('solutions')} className={`nav-link ${activeNav === 'solutions' ? 'active' : ''}`}>Our Solutions</Link>
            <Link href="#positions" onClick={() => setActiveNav('positions')} className={`nav-link ${activeNav === 'positions' ? 'active' : ''}`}>Open Positions</Link>
          </div>
          <div className="flex items-center gap-4">
            {!user ? (
              <Link href="/login" className="text-[14px] font-semibold text-[#475569] hover:text-[#1d1a22] transition-colors hidden sm:block">
                Login
              </Link>
            ) : (
              <Link href="/dashboard" className="text-[14px] font-semibold text-[#475569] hover:text-[#1d1a22] transition-colors hidden sm:block">
                Dashboard
              </Link>
            )}
            <button 
              onClick={() => handleApplyClick()}
              className="bg-[#7F56D9] text-white text-[14px] font-semibold px-6 py-2.5 rounded-full hover:bg-[#663BBE] transition-colors shadow-sm"
            >
              Join our team
            </button>
          </div>
        </div>
      </nav>

      {/* --- Main Hero Section --- */}
      <section className="relative pt-[180px] pb-[120px] px-6 lg:px-8 max-w-[1280px] mx-auto overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#d1bcff]/20 blur-[80px] rounded-full -z-10 pointer-events-none" />
        <div className="absolute top-20 left-[-100px] w-[300px] h-[300px] bg-[#d1bcff]/20 blur-[80px] rounded-full -z-10 pointer-events-none" />

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="flex flex-col items-start max-w-[690px]">
            <h1 className="font-['Manrope',sans-serif] font-extrabold text-[56px] lg:text-[72px] leading-[1.1] text-[#1d1a22] tracking-tight mb-6">
              Join Our Team and <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#663bbe] to-[#7f56d9]">Build the Future</span>
            </h1>
            <p className="text-[18px] lg:text-[20px] text-[#494453] leading-[1.6] mb-10 max-w-[570px]">
              Empowering visionaries to create the digital landscapes of tomorrow. We are more than a company; we are a catalyst for change.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <button onClick={() => handleApplyClick()} className="bg-[#7f56d9] text-white text-[18px] font-bold px-8 py-4 rounded-full hover:bg-[#663bbe] transition-colors shadow-lg shadow-[#1d1a22]/5">
                Apply Now
              </button>
              <Link href="#positions" className="bg-white border border-[#cbc3d5]/20 text-[#1d1a22] text-[18px] font-bold px-8 py-4 rounded-full hover:bg-gray-50 transition-colors text-center">
                View Open Positions
              </Link>
            </div>
          </div>

          <div className="relative group">
            <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl shadow-[#1d1a22]/5 bg-gray-100">
              {/* Local image from Figma node */}
              <img src="/assets/team-collaborating.png" alt="Team Collaborating" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-tr from-[#663bbe]/20 to-transparent pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      {/* --- About Us Section --- */}
      <section id="mission" className="bg-[#F8F1FD] py-[96px] px-6 lg:px-8">
        <div className="max-w-[1280px] mx-auto grid lg:grid-cols-2 gap-[80px] items-center">
          <div className="flex flex-col items-start gap-8">
            <div className="bg-[#663bbe]/10 px-4 py-2 rounded-full">
              <span className="text-[#663bbe] text-[12px] font-bold tracking-[1.2px] uppercase">Our Mission</span>
            </div>
            <h2 className="font-['Manrope',sans-serif] font-bold text-[36px] lg:text-[40px] text-[#1d1a22] leading-tight">
              To redefine connectivity through elegant engineering.
            </h2>
            <p className="text-[18px] text-[#494453] leading-relaxed">
              At UnifyHR, we believe that technology should be as beautiful as it is functional. Our culture is built on the pillars of transparency, creative freedom, and radical collaboration.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 relative">
            {/* Decorators */}
            {/* Bento Item 1 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <h3 className="font-['Manrope',sans-serif] font-bold text-[20px] text-[#1d1a22] mb-3">Innovation</h3>
              <p className="text-[14px] text-[#494453] leading-relaxed">Pushing boundaries beyond the possible.</p>
            </div>
            {/* Bento Item 2 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
              <h3 className="font-['Manrope',sans-serif] font-bold text-[20px] text-[#1d1a22] mb-3">Teamwork</h3>
              <p className="text-[14px] text-[#494453] leading-relaxed">Success is a collective masterpiece.</p>
            </div>
            {/* Bento Item 3 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              </div>
              <h3 className="font-['Manrope',sans-serif] font-bold text-[20px] text-[#1d1a22] mb-3">Growth</h3>
              <p className="text-[14px] text-[#494453] leading-relaxed">Constant evolution of self and craft.</p>
            </div>
            {/* Bento Item 4 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="font-['Manrope',sans-serif] font-bold text-[20px] text-[#1d1a22] mb-3">Impact</h3>
              <p className="text-[14px] text-[#494453] leading-relaxed">Global reach, personal touch.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- Why Choose UnifyHR Section --- */}
      <section id="solutions" className="py-[96px] px-6 lg:px-8 max-w-[1280px] mx-auto">
        <div className="flex flex-col items-center text-center mb-16">
          <h2 className="font-['Manrope',sans-serif] font-bold text-[36px] text-[#1d1a22] mb-4">Our Core Solutions</h2>
          <p className="text-[16px] text-[#494453] max-w-[670px]">An all-in-one ecosystem designed to transform how you manage talent, track time, and optimize your workforce.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-[#f8f1fd] p-10 rounded-[32px] hover:-translate-y-1 transition-transform duration-300">
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm">
              <span className="text-2xl">🎯</span>
            </div>
            <h3 className="font-['Manrope',sans-serif] font-bold text-[24px] text-[#1d1a22] mb-4">Smart Recruitment & ATS</h3>
            <p className="text-[16px] text-[#494453] leading-relaxed">Streamline your entire hiring lifecycle. From one-click candidate applications to automated approval workflows, attract and onboard top-tier talent effortlessly.</p>
          </div>
          <div className="bg-[#f8f1fd] p-10 rounded-[32px] hover:-translate-y-1 transition-transform duration-300">
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm">
              <span className="text-2xl">🗓️</span>
            </div>
            <h3 className="font-['Manrope',sans-serif] font-bold text-[24px] text-[#1d1a22] mb-4">Automated Leave Management</h3>
            <p className="text-[16px] text-[#494453] leading-relaxed">Simplify absence tracking. Our intuitive dashboard allows employees to request time off instantly while giving HR full control and visibility over team schedules.</p>
          </div>
          <div className="bg-[#f8f1fd] p-10 rounded-[32px] hover:-translate-y-1 transition-transform duration-300">
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm">
              <span className="text-2xl">📹</span>
            </div>
            <h3 className="font-['Manrope',sans-serif] font-bold text-[24px] text-[#1d1a22] mb-4">AI-Powered Tracking</h3>
            <p className="text-[16px] text-[#494453] leading-relaxed">Revolutionize employee monitoring with real-time AI camera integrations. Automate attendance logging and manage your workforce with unprecedented precision.</p>
          </div>
        </div>
      </section>

      {/* --- Open Positions Section --- */}
      <section id="positions" className="bg-white py-[96px] px-6 lg:px-8 border-t border-gray-100">
        <div className="max-w-[896px] mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
            <div className="flex flex-col gap-2">
              <h2 className="font-['Manrope',sans-serif] font-bold text-[36px] text-[#1d1a22]">Open Positions</h2>
              <p className="font-['Inter',sans-serif] text-[16px] text-[#494453]">Find your next challenge in our growing team.</p>
            </div>
            <span className="font-['Inter',sans-serif] font-semibold text-[#663bbe] text-[14px]">
              {jobs.length} Roles Available
            </span>
          </div>

          <div className="bg-[#f8f1fd]/50 border border-[#cbc3d5]/10 flex flex-col md:flex-row gap-4 p-4 rounded-[16px] mb-8 items-center">
            <div className="flex-1 relative w-full">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none z-10">
                <SearchOutlined className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search positions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-[48px] bg-white border border-[#cbc3d5]/30 rounded-[12px] pl-10 pr-4 text-[14px] text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#7f56d9] transition-all shadow-sm"
              />
            </div>
            <div className="flex flex-wrap gap-4 w-full md:w-auto">
              {/* Category Filter */}
              <Select
                value={categoryFilter}
                onChange={setCategoryFilter}
                className="landing-select h-[48px] min-w-[160px]"
                options={[
                  { label: 'All Categories', value: 'All Categories' },
                  ...categories.map(cat => ({ label: cat, value: cat }))
                ]}
                placeholder="Category"
              />

              {/* Status Filter */}
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                className="landing-select h-[48px] min-w-[160px]"
                options={[
                  { label: 'Open Offers', value: 'Open' },
                  { label: 'Closed Offers', value: 'Closed' }
                ]}
              />

              {/* Date Filter */}
              <Select
                value={dateSort}
                onChange={setDateSort}
                className="landing-select h-[48px] min-w-[160px]"
                options={[
                  { label: 'Closing Soon', value: 'closing_soon' },
                  { label: 'Closing Later', value: 'closing_late' }
                ]}
              />
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {loadingJobs ? (
              <div className="py-12 flex justify-center"><Spin size="large" /></div>
            ) : (() => {
              const finalJobs = jobs; // Logic now on backend

              if (finalJobs.length === 0) {
                return (
                  <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-2xl border border-gray-100">
                    No positions found matching your criteria.
                  </div>
                )
              }

              return finalJobs.map(job => {
                // Calculate display days left
                const today = new Date();
                const d = new Date(job.deadline);
                const diffDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 3600 * 24));
                const deadlineText = diffDays < 0 ? `Expired ${Math.abs(diffDays)} days ago` : `Ends in ${diffDays} days`;

                return (
                  <div
                    key={job.id}
                    className={`bg-[#fef7ff] p-[32px] rounded-[16px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 hover:-translate-y-0.5 transition-transform ${!isJobOpen(job) ? 'opacity-60 grayscale bg-gray-50' : ''}`}
                  >
                    <div className="flex flex-col gap-1">
                      <h3 className="font-['Manrope',sans-serif] font-bold text-[20px] text-[#1d1a22] leading-[28px] group-hover:text-[#663bbe] transition-colors">{job.title}</h3>
                      <div className="flex flex-wrap items-center gap-3 font-['Inter',sans-serif] text-[14px] text-[#494453]">
                        <span>{job.category}</span>
                        <span className="leading-[20px]">•</span>
                        <span>{job.open_seats} Open seats</span>
                        <span className="leading-[20px]">•</span>
                        <span className={diffDays < 3 && isJobOpen(job) ? "text-red-500" : ""}>{deadlineText}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 mt-4 sm:mt-0">
                      <button
                        onClick={() => setPreviewJob(job)}
                        title="Voir les détails"
                        className="bg-white border border-[#cbc3d5]/30 text-[#7f56d9] hover:bg-[#7f56d9] hover:text-white transition-colors h-[40px] px-3 rounded-full flex items-center justify-center shrink-0 shadow-sm"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      {isJobOpen(job) ? (
                        <button onClick={() => handleApplyClick(job.id)} className="flex-1 sm:flex-none sm:w-auto bg-[#7f56d9] flex flex-col items-center justify-center px-[24px] h-[40px] rounded-full shrink-0 text-white font-['Manrope',sans-serif] font-semibold text-[16px] leading-[24px] hover:bg-[#663bbe] transition-colors shadow-sm">
                          Apply
                        </button>
                      ) : (
                        <button disabled className="flex-1 sm:flex-none sm:w-auto bg-gray-300 flex flex-col items-center justify-center px-[24px] h-[40px] rounded-full shrink-0 text-gray-500 font-['Manrope',sans-serif] font-semibold text-[16px] leading-[24px] cursor-not-allowed shadow-none">
                          Closed
                        </button>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </section>

      {/* --- Preview Job Modal --- */}
      {previewJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#1d1a22]/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] w-full max-w-2xl flex flex-col max-h-[90vh] shadow-2xl relative overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex gap-4 justify-between items-start p-6 sm:p-8 pb-6 border-b border-gray-100 shrink-0">
              <div>
                <h3 className="font-['Manrope',sans-serif] font-bold text-[24px] text-[#1d1a22] mb-3 leading-tight">{previewJob.title}</h3>
                <div className="flex flex-wrap items-center gap-3 font-['Inter',sans-serif] text-[14px] text-[#494453]">
                  <span className="bg-[#f8f1fd] text-[#663bbe] font-medium px-3 py-1 rounded-full">{previewJob.category}</span>
                  <span className="leading-[20px]">•</span>
                  <span>{previewJob.open_seats} Open seats</span>
                  <span className="leading-[20px]">•</span>
                  <span>{new Date(previewJob.deadline).toLocaleDateString()}</span>
                </div>
              </div>
              <button
                onClick={() => setPreviewJob(null)}
                className="p-2 sm:p-3 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors shrink-0"
                aria-label="Fermer"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto flex-1 font-['Inter',sans-serif] text-[#494453] text-[16px]">
              <h4 className="font-semibold text-[#1d1a22] text-[18px] mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-[#7f56d9]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Job Description
              </h4>
              <p className="whitespace-pre-wrap leading-[1.7] mb-8 text-gray-600">{previewJob.description || "Aucune description fournie pour cette offre."}</p>

              <h4 className="font-semibold text-[#1d1a22] text-[18px] mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-[#7f56d9]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Requirements
              </h4>
              <p className="whitespace-pre-wrap leading-[1.7] mb-4 text-gray-600">{previewJob.requirements || "Aucune exigence spécifique mentionnée."}</p>
            </div>

            <div className="p-6 sm:p-8 pt-6 border-t border-gray-100 bg-gray-50 shrink-0 flex flex-col sm:flex-row gap-4 items-center justify-end">
              <button
                onClick={() => setPreviewJob(null)}
                className="w-full sm:w-auto bg-white border border-gray-200 text-[#494453] font-['Manrope',sans-serif] font-semibold px-8 h-[48px] rounded-full hover:bg-gray-100 transition-colors order-2 sm:order-1"
              >
                Close
              </button>
              {isJobOpen(previewJob) && (
                <button
                  onClick={() => { setPreviewJob(null); handleApplyClick(previewJob.id); }}
                  className="w-full sm:w-auto bg-[#7f56d9] text-white font-['Manrope',sans-serif] font-semibold px-8 h-[48px] rounded-full hover:bg-[#663bbe] transition-colors shadow-sm order-1 sm:order-2"
                >
                  Apply For This Job
                </button>
              )}
            </div>
          </div>
        </div>
      )}



      {/* --- Footer --- */}
      <footer className="bg-[#f8fafc] border-t border-[#f1f5f9] mt-auto">
        <div className="max-w-[1280px] mx-auto px-6 py-16 lg:px-8 flex flex-col md:flex-row justify-between items-center md:items-start gap-10">
          <div className="text-center md:text-left">
            <h3 className="font-['Inter',sans-serif] font-bold text-[18px] text-[#1d1a22] mb-2">UnifyHR</h3>
            <p className="text-[14px] text-[#64748b]">© {new Date().getFullYear()} UnifyHR. Built for the future of work.</p>
            <p className="text-[14px] text-[#64748b]">softylines.com</p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 md:gap-10 text-[14px] text-[#64748b]">
            <a href="#" className="hover:text-[#7f56d9] underline underline-offset-4">Privacy Policy</a>
            <a href="#" className="hover:text-[#7f56d9] underline underline-offset-4">Terms of Service</a>
            <a href="#" className="hover:text-[#7f56d9] underline underline-offset-4">Diversity & Inclusion</a>
            <a href="#" className="hover:text-[#7f56d9] underline underline-offset-4">Contact Support</a>
          </div>

          <div className="flex gap-6 items-center">
            <a href="#" className="text-gray-400 hover:text-[#7f56d9] transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" /></svg>
            </a>
            <a href="#" className="text-gray-400 hover:text-[#7f56d9] transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
            </a>
            <a href="#" className="text-gray-400 hover:text-[#7f56d9] transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
            </a>

            <div className="w-[1px] h-6 bg-gray-300 mx-2"></div>

            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              title="Back to top"
              className="p-2 text-[#64748b] hover:text-[#7f56d9] transition-colors group"
            >
              <BiArrowToTop size={26} className="transition-all duration-300 group-hover:-translate-y-1.5 group-hover:scale-110" />
            </button>
          </div>
        </div>
      </footer>
      <style jsx global>{`
        .landing-select .ant-select-selector {
          height: 48px !important;
          border-radius: 12px !important;
          border-color: rgba(203, 195, 213, 0.3) !important;
          padding: 0 16px !important;
          display: flex !important;
          align-items: center !important;
          background: white !important;
          font-family: 'Inter', sans-serif !important;
          font-weight: 500 !important;
          color: #494453 !important;
          box-shadow: 0 1px 2px 0 rgba(16, 24, 40, 0.05) !important;
        }
        .landing-select .ant-select-selection-item {
          line-height: 48px !important;
          font-size: 14px !important;
        }
        .landing-select.ant-select-focused .ant-select-selector {
          border-color: #7f56d9 !important;
          box-shadow: 0 0 0 4px rgba(127, 86, 217, 0.1) !important;
        }
        .landing-select .ant-select-arrow {
          color: #9ca3af !important;
          right: 16px !important;
        }
      `}</style>
    </div>
  )
}

