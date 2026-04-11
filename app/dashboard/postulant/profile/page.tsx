'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { getProfile, updateProfile } from '@/lib/profileService'
import type { Utilisateur } from '@/lib/database.types'
import { Form, Input, Button, message } from 'antd'
import { SaveOutlined, UserOutlined } from '@ant-design/icons'

export default function PostulantProfilePage() {
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
    })
    if (error) {
      messageApi.error('Erreur lors de la sauvegarde.')
    } else {
      messageApi.success('Profil mis à jour avec succès ✓')
    }
    setSaving(false)
  }

  if (loading) {
    return <div className="p-8 text-[#98A2B3] text-sm">Chargement...</div>
  }

  return (
    <div>
      {contextHolder}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#101828]">Mon profil</h1>
        <p className="text-[#475467] text-sm mt-1">Gérez vos informations personnelles</p>
      </div>

      <div className="bg-white rounded-2xl border border-[#E4E7EC] shadow-sm p-8 max-w-lg">

        {/* Avatar */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-full bg-[#EDE9FE] flex items-center justify-center">
            <UserOutlined className="text-[#7C3AED] text-2xl" />
          </div>
          <div>
            <p className="font-bold text-[#101828]">{profile?.user_name || user?.email}</p>
            <p className="text-sm text-[#98A2B3] capitalize">
              {profile?.role} · <span className="capitalize">{profile?.status ?? 'pending'}</span>
            </p>
          </div>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          requiredMark={false}
        >
          <Form.Item
            label={<span className="font-medium text-[#344054]">Nom complet</span>}
            name="user_name"
            rules={[{ required: true, message: 'Nom requis' }]}
          >
            <Input placeholder="Votre nom" size="large" className="rounded-xl" />
          </Form.Item>

          <Form.Item label={<span className="font-medium text-[#344054]">Email</span>}>
            <Input value={user?.email} disabled size="large" className="rounded-xl" />
          </Form.Item>

          <Form.Item
            label={<span className="font-medium text-[#344054]">Téléphone</span>}
            name="phone"
          >
            <Input placeholder="+213 6xx xxx xxx" size="large" className="rounded-xl" />
          </Form.Item>

          <Form.Item className="pt-2 mb-0">
            <Button
              type="primary"
              htmlType="submit"
              loading={saving}
              block
              size="large"
              icon={<SaveOutlined />}
              className="!bg-[#7C3AED] hover:!bg-[#6D28D9] !border-none font-semibold text-[15px] h-[44px] rounded-xl"
            >
              Sauvegarder
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  )
}
