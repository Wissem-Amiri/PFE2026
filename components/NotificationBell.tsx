'use client'

import { useState, useEffect } from 'react'
import { Badge, Popover, List, Typography, Spin } from 'antd'
import { BellOutlined, CheckCircleOutlined, DeleteOutlined } from '@ant-design/icons'
import { supabase } from '@/api/supabase'
import { useAuth } from '@/api/AuthContext'
import { getUnreadNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, Notification } from '@/api/notifications'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/en-gb'
import { useRouter } from 'next/navigation'

dayjs.extend(relativeTime)
dayjs.locale('en-gb')

const { Text } = Typography

export default function NotificationBell() {
  const { user, profile } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const unreadCount = notifications.length

  useEffect(() => {
    if (!user) return

    // 1. Fetch initial unread notifications
    const fetchNotifications = async () => {
      const { data } = await getUnreadNotifications(user.id)
      if (data) {
        setNotifications(data)
      }
      setLoading(false)
    }
    fetchNotifications()

    // 2. Subscribe to real-time INSERTS
    const channel = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const newNotification = payload.new as Notification
          // Add to top of list
          setNotifications((prev) => [newNotification, ...prev])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const handleNotificationClick = async (item: Notification) => {
    // 1. Mark as read in DB
    await markNotificationAsRead(item.id)
    
    // 2. Remove from local list visually
    setNotifications((prev) => prev.filter((n) => n.id !== item.id))
    
    // 3. Close the popover
    setOpen(false)

    // 4. Navigate based on notification title/content
    const title = item.title.toLowerCase()
    const message = item.message.toLowerCase()
    const role = profile?.role || (user as any)?.user_metadata?.role

    if (role === 'admin') {
      if (title.includes('leave') || message.includes('leave') || title.includes('congé') || message.includes('congé')) {
        router.push('/dashboard/admin/leaves')
      } else if (title.includes('application') || message.includes('applied') || title.includes('candidature') || message.includes('postulé')) {
        router.push('/dashboard/admin/registrations')
      }
    } else if (role === 'employee') {
      router.push('/dashboard/employee')
    } else {
      router.push('/dashboard/candidate')
    }
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation() // Prevent calling handleRead when clicking delete
    // Optimistic UI update
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    // Call API
    await deleteNotification(id)
  }

  const handleReadAll = async () => {
    if (!user) return
    setNotifications([])
    await markAllNotificationsAsRead(user.id)
  }

  const content = (
    <div className="w-[300px] max-h-[400px] overflow-y-auto">
      {loading ? (
        <div className="flex justify-center p-4"><Spin /></div>
      ) : notifications.length === 0 ? (
        <div className="text-center p-4 text-gray-400">No new notifications.</div>
      ) : (
        <List
          dataSource={notifications}
          renderItem={(item) => (
            <List.Item
              className="cursor-pointer hover:bg-gray-50 transition-colors p-3 relative group"
              onClick={() => handleNotificationClick(item)}
            >
              <List.Item.Meta
                avatar={<div className="mt-1"><CheckCircleOutlined style={{ color: '#7F56D9' }} /></div>}
                title={<span className="font-semibold text-sm pr-6">{item.title}</span>}
                description={
                  <div className="flex flex-col gap-1 pr-6">
                    <Text className="text-xs text-gray-600">{item.message}</Text>
                    <Text className="text-[10px] text-gray-400">{dayjs(item.created_at).fromNow()}</Text>
                  </div>
                }
              />
              <button
                onClick={(e) => handleDelete(e, item.id)}
                className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 bg-transparent border-none cursor-pointer p-1 transition-all duration-200"
                title="Delete notification"
              >
                <DeleteOutlined className="text-lg" />
              </button>
            </List.Item>
          )}
        />
      )}
    </div>
  )

  return (
    <Popover
      content={content}
      title={
        <div className="flex justify-between items-center w-full pr-2">
          <span className="font-bold text-gray-800">Notifications</span>
          {notifications.length > 0 && (
            <button 
              onClick={handleReadAll}
              className="text-[11px] text-[#7F56D9] hover:text-[#6941C6] font-semibold bg-transparent border-none cursor-pointer p-0 underline decoration-dotted transition-colors"
            >
              Mark all as read
            </button>
          )}
        </div>
      }
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
    >
      <Badge count={unreadCount} size="small" style={{ backgroundColor: '#F04438' }}>
        <div className="w-10 h-10 rounded-full border border-[#EAECF0] flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
          <BellOutlined className="text-lg text-gray-600" />
        </div>
      </Badge>
    </Popover>
  )
}
