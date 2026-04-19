'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/api/AuthContext'
import { getProfile, updateProfile, uploadDocument } from '@/api/profile'
import { uploadJobPicture, getJobById } from '@/api/job'
import { applyToJob, getUserCandidatures } from '@/api/candidatures'
import type { FullProfile } from '@/api/database.types'
import { Input, Select, Upload, Button, message, Spin } from 'antd'
import { 
  CloudUploadOutlined, 
  LoadingOutlined, 
  PlusOutlined, 
  MinusCircleOutlined,
  CheckCircleFilled,
  GlobalOutlined,
  UserOutlined,
  MailOutlined
} from '@ant-design/icons'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

/* ─── Validation Schema ────────────────────────────────────── */
const profileSchema = yup.object().shape({
  firstName: yup.string().required('Le prénom est requis'),
  lastName: yup.string().required('Le nom est requis'),
  position: yup.string().required('Le poste est requis'),
  country: yup.string().required('Le pays est requis'),
  timezone: yup.string().required('Le fuseau horaire est requis'),
  bio: yup.string().required('La bio est obligatoire').max(500, 'La bio est trop longue (max 500 chars)'),
  website: yup.string().url('Format URL invalide').nullable().transform(v => v === '' ? null : v),
  portfolio: yup.string().url('Format URL invalide').nullable().transform(v => v === '' ? null : v),
  experiences: yup.array().of(
    yup.object().shape({
      title: yup.string().required('Titre requis'),
      company: yup.string().required('Entreprise requise'),
      startDate: yup.string().required('Date de début requise'),
      endDate: yup.string().nullable().test('date-order', 'La date de fin doit être après le début', function(value) {
        const { startDate } = this.parent
        if (!startDate || !value) return true
        return new Date(value) >= new Date(startDate)
      }),
      projectUrl: yup.string().url('Format URL invalide').nullable().transform(v => v === '' ? null : v),
    })
  ),
})

type ProfileFormInputs = yup.InferType<typeof profileSchema>

/* ─── Constants ────────────────────────────────────────────── */
const COUNTRIES = [
  { value: 'United States', label: 'United States' },
  { value: 'France', label: 'France' },
  { value: 'Canada', label: 'Canada' },
  { value: 'United Kingdom', label: 'United Kingdom' },
  { value: 'Tunisia', label: 'Tunisia' },
]

const TIMEZONES = [
  { value: 'Pacific Standard Time (PST) UTC-08:00', label: 'Pacific Standard Time (PST) UTC-08:00' },
  { value: 'Eastern Standard Time (EST) UTC-05:00', label: 'Eastern Standard Time (EST) UTC-05:00' },
  { value: 'Central European Time (CET) UTC+01:00', label: 'Central European Time (CET) UTC+01:00' },
  { value: 'West Africa Time (WAT) UTC+01:00', label: 'West Africa Time (WAT) UTC+01:00' },
]

export default function CompleteProfilePage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const applyToJobId = searchParams.get('applyTo')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [messageApi, contextHolder] = message.useMessage()

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [resumeUrl, setResumeUrl] = useState<string | null>(null)
  const [uploadingResume, setUploadingResume] = useState(false)
  const [letterUrl, setLetterUrl] = useState<string | null>(null)
  const [uploadingLetter, setUploadingLetter] = useState(false)

  const { control, handleSubmit, reset, formState: { errors } } = useForm<ProfileFormInputs>({
    resolver: yupResolver(profileSchema),
    defaultValues: {
       firstName: '', lastName: '', position: '', country: '', timezone: '', bio: '', website: '', portfolio: '', 
       experiences: [] 
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "experiences"
  })

  useEffect(() => {
    if (!user) return
    getProfile(user.id).then(async ({ data }) => {
      if (data) {
        const names = (data.user_name || '').split(' ')
        const firstName = names[0] || ''
        const lastName = names.slice(1).join(' ') || ''

        let resolvedPosition = data.postulant?.position || '';

        if (applyToJobId) {
          const { data: jobDetails } = await getJobById(applyToJobId)
          if (jobDetails) resolvedPosition = jobDetails.title
        } else {
          const { data: candidatures } = await getUserCandidatures(user.id)
          if (candidatures && candidatures.length > 0) {
            resolvedPosition = candidatures[0].job?.title || resolvedPosition
          }
        }

        reset({
          firstName,
          lastName,
          position: resolvedPosition,
          country: data.postulant?.country || '',
          timezone: data.postulant?.timezone || '',
          bio: data.postulant?.bio || '',
          website: data.postulant?.website || '',
          portfolio: data.postulant?.portfolio || '',
          experiences: (data.postulant?.experiences as any[]) || [],
        })

        setAvatarUrl(data.avatar_url || null)
        setResumeUrl(data.postulant?.resume_url || null)
        setLetterUrl(data.postulant?.motivational_letter_url || null)
      }
      setLoading(false)
    })
  }, [user, reset, applyToJobId])

  const handleSave = async (values: ProfileFormInputs) => {
    if (!user) return
    setSaving(true)

    const fullName = `${values.firstName} ${values.lastName}`.trim()

    const updatePayload: Partial<FullProfile> = {
      user_name: fullName,
      avatar_url: avatarUrl,
      postulant: {
        position: values.position,
        country: values.country,
        timezone: values.timezone,
        bio: values.bio,
        website: values.website || null,
        portfolio: values.portfolio || null,
        resume_url: resumeUrl,
        motivational_letter_url: letterUrl,
        experiences: values.experiences?.map((exp: any) => ({
          ...exp,
          id: exp.id || Math.random().toString(36).substr(2, 9)
        })) || []
      }
    }

    const { error: profileError } = await updateProfile(user.id, updatePayload)

    if (profileError) {
      messageApi.error(`Erreur: ${profileError.message || 'lors de la mise à jour.'}`)
      setSaving(false)
      return
    }

    if (applyToJobId) {
      const { error: applyError } = await applyToJob(user.id, applyToJobId)
      if (applyError) {
        if (applyError.code === '23505') {
          messageApi.warning("Déjà postulé, mais profil mis à jour.")
        } else {
          messageApi.error("Profil mis à jour, mais erreur candidature.")
        }
      } else {
        messageApi.success("Profil sauvé et candidature envoyée !")
        setTimeout(() => router.push('/dashboard/postulant'), 1500)
      }
    } else {
      messageApi.success("Profil mis à jour avec succès.")
    }

    setSaving(false)
  }

  const handleAvatarUpload = async (options: any) => {
    const { file, onSuccess, onError } = options
    setUploadingAvatar(true)
    const { publicUrl, error } = await uploadJobPicture(file)
    setUploadingAvatar(false)
    if (error || !publicUrl) onError('Error')
    else { setAvatarUrl(publicUrl); onSuccess('ok') }
  }

  const handleResumeUpload = async (options: any) => {
    const { file, onSuccess, onError } = options
    setUploadingResume(true)
    const { publicUrl, error } = await uploadDocument(file)
    setUploadingResume(false)
    if (error || !publicUrl) onError('Error')
    else { setResumeUrl(publicUrl); onSuccess('ok') }
  }

  const handleLetterUpload = async (options: any) => {
    const { file, onSuccess, onError } = options
    setUploadingLetter(true)
    const { publicUrl, error } = await uploadDocument(file)
    setUploadingLetter(false)
    if (error || !publicUrl) onError('Error')
    else { setLetterUrl(publicUrl); onSuccess('ok') }
  }

  if (loading) return <div className="flex items-center justify-center p-20"><Spin size="large" /></div>

  return (
    <div className="bg-white min-h-full">
      {contextHolder}

      <div className="max-w-[1000px] mx-auto py-12 px-8">
        
        {/* Header Section */}
        <div className="flex justify-between items-end mb-10 pb-6 border-b border-[#F2F4F7]">
          <div>
            <h1 className="text-[30px] font-bold text-[#101828] mb-1 tracking-tight">Paramètres</h1>
            <p className="text-[14px] text-[#475467] m-0">Gérez vos informations personnelles et professionnelles.</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => router.push('/dashboard/postulant')} className="h-10 px-5 rounded-lg font-medium border-[#D0D5DD]">Annuler</Button>
            <Button type="primary" onClick={handleSubmit(handleSave)} loading={saving} className="h-10 px-5 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] border-none font-medium text-white shadow-sm transition-colors">
              Enregistrer {applyToJobId && '& Postuler'}
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit(handleSave)} className="space-y-0">
          
          {/* 1. Profil Personnel */}
          <Section title="Informations personnelles" subtitle="Mettez à jour votre photo et vos coordonnées.">
            <FormRow label="Nom complet">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Controller name="firstName" control={control} render={({ field }) => (
                    <Input {...field} placeholder="Prénom" className={`h-11 rounded-lg ${errors.firstName ? 'border-red-500' : ''}`} />
                  )} />
                  {errors.firstName && <p className="text-red-500 text-[11px] mt-1 font-medium">{errors.firstName.message}</p>}
                </div>
                <div className="flex-1">
                  <Controller name="lastName" control={control} render={({ field }) => (
                    <Input {...field} placeholder="Nom" className={`h-11 rounded-lg ${errors.lastName ? 'border-red-500' : ''}`} />
                  )} />
                  {errors.lastName && <p className="text-red-500 text-[11px] mt-1 font-medium">{errors.lastName.message}</p>}
                </div>
              </div>
            </FormRow>

            <FormRow label="Adresse e-mail">
               <Input value={user?.email || ''} disabled className="h-11 rounded-lg bg-[#F9FAFB] cursor-not-allowed border-[#EAECF0]" prefix={<MailOutlined className="text-gray-400" />} />
            </FormRow>

            <FormRow label="Avatar" subtitle="Cette photo sera visible sur votre profil.">
              <div className="flex gap-6 items-center">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-[#F9FAFB] border border-[#EAECF0] flex items-center justify-center shrink-0 shadow-inner">
                  {uploadingAvatar ? <LoadingOutlined className="text-[#7C3AED] text-xl" /> : avatarUrl ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : <UserOutlined className="text-gray-300 text-[28px]" />}
                </div>
                <div className="flex-1">
                  <Upload.Dragger accept="image/*" showUploadList={false} customRequest={handleAvatarUpload} className="bg-white hover:border-[#7C3AED] group py-4">
                    <p className="m-0"><CloudUploadOutlined className="text-[#7C3AED] text-xl group-hover:scale-110 transition-transform" /></p>
                    <p className="text-[14px] mt-2 mb-0"><span className="text-[#7C3AED] font-semibold">Cliquer pour uploader</span> ou glisser-déposer</p>
                    <p className="text-[12px] text-[#667085] m-0">SVG, PNG, JPG (max. 800×800px)</p>
                  </Upload.Dragger>
                </div>
              </div>
            </FormRow>
          </Section>

          {/* 2. Profil Professionnel */}
          <Section title="Profil professionnel" subtitle="Mettez en avant vos compétences et votre parcours.">
            <FormRow label="Poste actuel / visé">
              <div className="flex flex-col gap-2">
                <Controller name="position" control={control} render={({ field }) => (
                  <Input {...field} disabled={!!applyToJobId} className="h-11 rounded-lg bg-[#F9FAFB] cursor-not-allowed border-[#EAECF0]" placeholder="Développeur, Designer..." />
                )} />
                <p className="text-[11px] text-[#667085] flex items-center gap-1.5 italic">
                  <CheckCircleFilled className="text-green-500 text-[10px]" /> 
                  Le poste est verrouillé en fonction de votre candidature.
                </p>
              </div>
            </FormRow>

            <FormRow label="Localisation">
              <div className="flex gap-4">
                 <div className="flex-1">
                   <p className="text-[12px] font-semibold text-gray-500 mb-1.5">Pays</p>
                   <Controller name="country" control={control} render={({ field }) => (
                     <Select {...field} options={COUNTRIES} placeholder="Choisir un pays" className="h-11 w-full" />
                   )} />
                   {errors.country && <span className="text-red-500 text-[11px] mt-1 font-medium">{errors.country.message}</span>}
                 </div>
                 <div className="flex-1">
                   <p className="text-[12px] font-semibold text-gray-500 mb-1.5">Fuseau horaire</p>
                   <Controller name="timezone" control={control} render={({ field }) => (
                     <Select {...field} options={TIMEZONES} placeholder="Fuseau horaire" className="h-11 w-full" />
                   )} />
                   {errors.timezone && <span className="text-red-500 text-[11px] mt-1 font-medium">{errors.timezone.message}</span>}
                 </div>
              </div>
            </FormRow>

            <FormRow label="Liens externes">
               <div className="flex flex-col gap-3">
                  <Controller name="website" control={control} render={({ field }) => (
                    <Input {...field} placeholder="Site web (URL)" className="h-11 rounded-lg" prefix={<GlobalOutlined className="text-gray-400" />} />
                  )} />
                  <Controller name="portfolio" control={control} render={({ field }) => (
                    <Input {...field} placeholder="Portfolio (URL)" className="h-11 rounded-lg" prefix={<GlobalOutlined className="text-gray-400" />} />
                  )} />
               </div>
            </FormRow>

            <FormRow label="Présentation (Bio)" subtitle="Décrivez brièvement votre parcours.">
               <Controller name="bio" control={control} render={({ field }) => (
                 <Input.TextArea {...field} rows={5} placeholder="Passionné par le design..." className={`rounded-lg resize-none p-3 ${errors.bio ? 'border-red-500' : ''}`} />
               )} />
               {errors.bio && <p className="text-red-500 text-[11px] mt-1 font-medium">{errors.bio.message}</p>}
            </FormRow>

            <FormRow label="Curriculum Vitae (CV)">
               <div className="w-full">
                 {uploadingResume ? (
                   <div className="h-[76px] rounded-xl border border-dashed border-[#EAECF0] bg-[#F9FAFB] flex items-center justify-center"><LoadingOutlined className="text-[#7C3AED] text-xl" /></div>
                 ) : resumeUrl ? (
                   <div className="h-[76px] rounded-xl border border-[#7C3AED] bg-[#F9F5FF] flex items-center justify-between px-5 group hover:bg-[#F4EBFF] transition-colors">
                      <div className="flex gap-4 items-center">
                        <div className="w-10 h-10 rounded-full bg-[#EDE9FE] flex items-center justify-center text-[#7C3AED] text-[18px]">📄</div>
                        <div>
                          <p className="text-[14px] font-bold text-[#101828] m-0">Mon_CV.pdf</p>
                          <a href={resumeUrl} target="_blank" rel="noreferrer" className="text-[12px] text-[#7C3AED] font-semibold no-underline hover:underline">Consulter le fichier</a>
                        </div>
                      </div>
                      <CheckCircleFilled className="text-[#7C3AED] text-2xl" />
                   </div>
                 ) : (
                   <Upload.Dragger accept=".pdf" showUploadList={false} customRequest={handleResumeUpload} className="bg-white hover:border-[#7C3AED] py-5">
                      <p className="m-0"><CloudUploadOutlined className="text-[#7C3AED] text-xl" /></p>
                      <p className="text-[14px] mt-2 mb-0"><span className="text-[#7C3AED] font-semibold">Uploader votre CV</span> ou glisser-déposer</p>
                      <p className="text-[12px] text-[#667085] m-0">Format PDF (max. 10MB)</p>
                   </Upload.Dragger>
                 )}
               </div>
            </FormRow>
          </Section>

          {/* 3. Historique d'Expérience */}
          <div className="py-10">
            <div className="mb-8">
              <h3 className="text-[20px] font-bold text-[#101828] mb-1">Historique d'expérience</h3>
              <p className="text-[14px] text-[#667085] m-0">Ajoutez vos expériences passées pour enrichir votre profil.</p>
            </div>

            <div className="space-y-6">
              {fields.map((field, index) => (
                <div key={field.id} className="p-8 rounded-2xl border border-[#EAECF0] bg-[#FAFBFC] relative group transition-all hover:border-[#D0D5DD] hover:shadow-sm">
                   <button type="button" onClick={() => remove(index)} className="absolute top-5 right-5 text-[#98A2B3] hover:text-red-500 bg-transparent border-none cursor-pointer transition-colors p-1">
                     <MinusCircleOutlined className="text-xl" />
                   </button>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                      <div className="space-y-1.5">
                         <label className="text-[12px] font-bold text-[#344054] tracking-wide uppercase">Titre du poste</label>
                         <Controller name={`experiences.${index}.title`} control={control} render={({ field }) => (
                           <Input {...field} placeholder="ex: Senior Developer" className="h-11 rounded-lg" />
                         )} />
                         {errors.experiences?.[index]?.title && <span className="text-red-500 text-[11px] font-medium">{errors.experiences[index].title.message}</span>}
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[12px] font-bold text-[#344054] tracking-wide uppercase">Entreprise</label>
                         <Controller name={`experiences.${index}.company`} control={control} render={({ field }) => (
                           <Input {...field} placeholder="ex: Google" className="h-11 rounded-lg" />
                         )} />
                         {errors.experiences?.[index]?.company && <span className="text-red-500 text-[11px] font-medium">{errors.experiences[index].company.message}</span>}
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[12px] font-bold text-[#344054] tracking-wide uppercase">Date de début</label>
                         <Controller name={`experiences.${index}.startDate`} control={control} render={({ field }) => (
                           <Input {...field} type="date" className="h-11 rounded-lg px-3" />
                         )} />
                         {errors.experiences?.[index]?.startDate && <span className="text-red-500 text-[11px] font-medium">{errors.experiences[index].startDate.message}</span>}
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[12px] font-bold text-[#344054] tracking-wide uppercase">Date de fin</label>
                         <Controller name={`experiences.${index}.endDate`} control={control} render={({ field }) => (
                           <Input {...field} type="date" className="h-11 rounded-lg px-3" />
                         )} />
                         {errors.experiences?.[index]?.endDate && <span className="text-red-500 text-[11px] font-medium">{errors.experiences[index].endDate.message}</span>}
                      </div>
                   </div>
                </div>
              ))}

              <Button type="dashed" onClick={() => append({ title: '', company: '', startDate: '', endDate: null, projectUrl: '' })} block className="h-12 rounded-xl border-[#7F56D9] text-[#7F56D9] bg-[#F9F5FF] hover:bg-[#F4EBFF] hover:border-[#7F56D9] font-bold flex items-center justify-center gap-2">
                <PlusOutlined /> Ajouter une expérience professionnelle
              </Button>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex justify-end gap-3 pt-10 border-t border-[#EAECF0] mt-10">
            <Button onClick={() => router.push('/dashboard/postulant')} className="h-11 px-6 rounded-lg font-medium border-[#D0D5DD]">Annuler</Button>
            <Button type="primary" onClick={handleSubmit(handleSave)} loading={saving} className="h-11 px-6 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] border-none font-medium text-white shadow-md transition-all">
                Enregistrer {applyToJobId && '& Postuler'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─── UI Helper Components ───────────────────────────────────── */

function Section({ title, subtitle, children }: { title: string, subtitle: string, children: React.ReactNode }) {
  return (
    <div className="py-10 border-b border-[#F2F4F7] first:border-none first:pt-0">
      <div className="mb-8">
        <h3 className="text-[18px] font-bold text-[#101828] mb-1">{title}</h3>
        <p className="text-[14px] text-[#475467] m-0">{subtitle}</p>
      </div>
      <div className="space-y-8">
        {children}
      </div>
    </div>
  )
}

function FormRow({ label, subtitle, children }: { label: string, subtitle?: string, children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-10">
      <div className="w-[280px] shrink-0 pt-1.5 flex flex-col">
        <span className="text-[14px] font-bold text-[#344054] tracking-tight">{label}</span>
        {subtitle && <span className="text-[13px] text-[#667085] mt-1 m-0 leading-relaxed">{subtitle}</span>}
      </div>
      <div className="flex-1 max-w-[560px]">
        {children}
      </div>
    </div>
  )
}
