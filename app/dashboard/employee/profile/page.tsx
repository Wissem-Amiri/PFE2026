'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { getProfile, updateProfile } from '@/lib/profileService'
import type { Utilisateur } from '@/lib/database.types'
import { Form, Input, Button, DatePicker, message, Select } from 'antd'
import { SaveOutlined, UserOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

const DEPARTMENTS = ['Ressources Humaines', 'Informatique', 'Finance', 'Marketing', 'Commercial', 'Juridique', 'Direction', 'Autre']

export default function EmployeeProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Utilisateur | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm()
  const [messageApi, contextHolder] = message.useMessage()

  useEffect(() => {
    if (!user) return
    getProfile(user.id).then(({ data }) => {
      setProfile(data)
      if (data) {
        form.setFieldsValue({
          user_name: data.user_name,
          phone: data.phone,
          department: data.department,
          position: data.position,
          hire_date: data.hire_date ? dayjs(data.hire_date) : null,
        })
      }
      setLoading(false)
    })
  }, [user, form])

  const handleSave = async (values: any) => {
    if (!user) return
    setSaving(true)
    const { error } = await updateProfile(user.id, {
      user_name: values.user_name,
      phone: values.phone,
      department: values.department,
      position: values.position,
      hire_date: values.hire_date ? values.hire_date.format('YYYY-MM-DD') : null,
    })
    if (error) {
      messageApi.error('Erreur lors de la sauvegarde.')
    } else {
      messageApi.success('Profil mis à jour avec succès ✓')
    }
    setSaving(false)
  }

  if (loading) {
    return <div className="p-8 text-slate-400 text-sm">Chargement...</div>
  }

  return (
    <div className="p-8">
      {contextHolder}

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Mon profil</h1>
        <p className="text-slate-500 text-sm mt-1">Gérez vos informations personnelles</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 max-w-xl">

        {/* Avatar placeholder */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-[#ede9fe] flex items-center justify-center">
            <UserOutlined className="text-[#7c3aed] text-2xl" />
          </div>
          <div>
            <p className="font-bold text-slate-900">{profile?.user_name || user?.email}</p>
            <p className="text-sm text-slate-400 capitalize">{profile?.role} · {profile?.status}</p>
          </div>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          requiredMark={false}
          className="space-y-1"
        >
          <Form.Item
            label={<span className="font-medium text-slate-700">Nom complet</span>}
            name="user_name"
            rules={[{ required: true, message: 'Nom requis' }]}
          >
            <Input placeholder="Votre nom" size="large" className="rounded-lg" />
          </Form.Item>

          <Form.Item
            label={<span className="font-medium text-slate-700">Téléphone</span>}
            name="phone"
          >
            <Input placeholder="+213 6xx xxx xxx" size="large" className="rounded-lg" />
          </Form.Item>

          <Form.Item
            label={<span className="font-medium text-slate-700">Département</span>}
            name="department"
          >
            <Select
              placeholder="Sélectionner un département"
              size="large"
              className="w-full"
              options={DEPARTMENTS.map(d => ({ value: d, label: d }))}
            />
          </Form.Item>

          <Form.Item
            label={<span className="font-medium text-slate-700">Poste</span>}
            name="position"
          >
            <Input placeholder="Ex: Développeur, Manager..." size="large" className="rounded-lg" />
          </Form.Item>

          <Form.Item
            label={<span className="font-medium text-slate-700">Date d'embauche</span>}
            name="hire_date"
          >
            <DatePicker
              className="w-full rounded-lg h-[40px]"
              format="DD/MM/YYYY"
              placeholder="Sélectionner une date"
            />
          </Form.Item>

          <Form.Item className="pt-2">
            <Button
              type="primary"
              htmlType="submit"
              loading={saving}
              block
              size="large"
              icon={<SaveOutlined />}
              className="!bg-[#7c3aed] hover:!bg-[#6d28d9] !border-none font-semibold text-[15px] h-[44px] rounded-lg"
            >
              Sauvegarder
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  )
}
