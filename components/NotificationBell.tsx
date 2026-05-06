'use client'

import { useState, useEffect, useCallback } from 'react'
import { Badge, Popover, List, Typography, Spin, Avatar } from 'antd'
import { 
  HiOutlineBell, 
  HiOutlineTrash,
  HiOutlineUser,
  HiOutlineBriefcase,
  HiOutlineCalendar,
  HiOutlineCheckCircle,
  HiOutlineStar,
  HiOutlineInformationCircle,
  HiOutlineClock
} from 'react-icons/hi'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { getUnreadNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, type Notification as AppNotification } from '@/app/api/notifications'
import { useInfiniteNotifications } from '@/lib/hooks'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/en-gb'
import { useRouter } from 'next/navigation'
import { useInView } from 'react-intersection-observer'

dayjs.extend(relativeTime)
dayjs.locale('en-gb')

const { Text } = Typography

export default function NotificationBell() {
  const { user, profile } = useAuth()
  const [unreadNotifications, setUnreadNotifications] = useState<AppNotification[]>([])
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchList
  } = useInfiniteNotifications(user?.id || '', 10)

  const { ref, inView } = useInView()

  // Auto-fetch next page when scrolling down
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  // Badge logic (Unread counts) & Real-time
  const fetchUnread = useCallback(async () => {
    if (!user) return
    const { data } = await getUnreadNotifications(user.id)
    if (data) setUnreadNotifications(data)
  }, [user])

  useEffect(() => {
    if (!user) return
    fetchUnread()

    const channel = supabase
      .channel(`public:notifications:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => {
          fetchUnread()
          refetchList()
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user, fetchUnread, refetchList])

  const handleNotificationClick = async (item: AppNotification) => {
    if (!item.is_read) {
      await markNotificationAsRead(item.id)
    }
    
    setOpen(false)

    // Intelligent Routing logic based on type and role
    const role = profile?.role || (user as any)?.user_metadata?.role
    const lowerTitle = (item.title || '').toLowerCase()
    const lowerMessage = (item.message || '').toLowerCase()
    
    let activeType = item.type
    if (!activeType || activeType === 'info' || activeType === 'default') {
      if (lowerTitle.includes('registration') || lowerTitle.includes('inscription') || lowerMessage.includes('compte')) activeType = 'new_candidate'
      else if (lowerTitle.includes('applied') || lowerTitle.includes('application') || lowerTitle.includes('candidature') || lowerTitle.includes('postulé')) activeType = 'job_application'
      else if (lowerTitle.includes('leave') || lowerTitle.includes('congé') || lowerMessage.includes('demande')) activeType = 'leave_request'
      else if (lowerTitle.includes('approved') || lowerTitle.includes('onboarded') || lowerTitle.includes('félicitations')) activeType = 'congrats'
    }

    if (role === 'admin') {
      if (activeType === 'leave_request') router.push('/dashboard/admin/leaves')
      else if (activeType === 'job_application' || activeType === 'new_candidate') router.push('/dashboard/admin/registrations')
      else router.push('/dashboard/admin')
    } else if (role === 'employee') {
      if (activeType === 'leave_status') router.push('/dashboard/employee/leaves')
      else router.push('/dashboard/employee')
    } else {
      router.push('/dashboard/candidate')
    }
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    await deleteNotification(id)
    refetchList()
    fetchUnread()
  }

  const handleReadAll = async () => {
    if (!user) return
    await markAllNotificationsAsRead(user.id)
    refetchList()
    fetchUnread()
  }

  const translateContent = (text: string) => {
    if (!text) return '';
    const translations: { [key: string]: string } = {
      'nouvelle candidature': 'New Application',
      'nouvelle inscription': 'New Registration',
      'nouvelle demande de congé': 'New Leave Request',
      'a postulé pour le poste de': 'applied for',
      'vient de créer un compte candidat': 'created a candidate account',
      'a demandé un congé': 'requested a leave',
      'du': 'from',
      'au': 'to'
    };

    let translated = text;
    Object.keys(translations).forEach(key => {
      const regex = new RegExp(key, 'gi');
      translated = translated.replace(regex, translations[key]);
    });
    return translated;
  };

  const getNotificationConfig = (type: string, title: string = '', message: string = '') => {
    // Intelligent fallback detection if type is missing or generic
    let activeType = type;
    const lowerTitle = title.toLowerCase();
    const lowerMessage = message.toLowerCase();

    if (!activeType || activeType === 'info' || activeType === 'default') {
      const combinedText = lowerTitle + ' ' + lowerMessage;

      if (combinedText.includes('registration') || combinedText.includes('inscription') || combinedText.includes('compte') || combinedText.includes('account')) activeType = 'new_candidate';
      else if (combinedText.includes('applied') || combinedText.includes('application') || combinedText.includes('candidature') || combinedText.includes('postulé')) activeType = 'job_application';
      else if (combinedText.includes('leave') || combinedText.includes('congé') || combinedText.includes('demande')) activeType = 'leave_request';
      else if (combinedText.includes('approved') || combinedText.includes('onboarded') || combinedText.includes('approuvé') || combinedText.includes('accepté') || combinedText.includes('félicitations') || combinedText.includes('congratulations')) activeType = 'congrats';
    }

    switch (activeType) {
      case 'new_candidate':
        return {
          icon: <HiOutlineUser />,
          bg: '#E0F2FE',
          color: '#0EA5E9',
          label: 'New Candidate'
        }
      case 'job_application':
        return {
          icon: <HiOutlineBriefcase />,
          bg: '#F5F3FF',
          color: '#7C3AED',
          label: 'Application'
        }
      case 'leave_request':
        return {
          icon: <HiOutlineCalendar />,
          bg: '#FEF3C7',
          color: '#D97706',
          label: 'Leave Request'
        }
      case 'leave_status':
        return {
          icon: <HiOutlineCheckCircle />,
          bg: '#DCFCE7',
          color: '#16A34A',
          label: 'Leave Update'
        }
      case 'congrats':
        return {
          icon: <HiOutlineStar />,
          bg: '#FFF7ED',
          color: '#F97316',
          label: 'Congratulations'
        }
      default:
        return {
          icon: <HiOutlineInformationCircle />,
          bg: '#F3F4F6',
          color: '#6B7280',
          label: 'Notification'
        }
    }
  }

  const allNotifications = infiniteData?.pages.flatMap(page => page.data) || []

  const content = (
    <div className="w-[380px] flex flex-col bg-white">
      <div className="max-h-[480px] overflow-y-auto no-scrollbar py-2">
        {allNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-gray-400">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
              <HiOutlineBell style={{ fontSize: '24px', opacity: 0.3 }} />
            </div>
            <span className="text-[14px] font-medium">No notifications yet</span>
            <p className="text-[12px] text-gray-400 mt-1">We'll let you know when something happens</p>
          </div>
        ) : (
          <List
            dataSource={allNotifications}
            renderItem={(item) => {
              const config = getNotificationConfig(item.type, item.title, item.message)
              return (
                <List.Item
                  className={`cursor-pointer transition-all p-4 relative group border-none mb-1 mx-2 rounded-2xl
                    ${item.is_read ? 'hover:bg-gray-50' : 'bg-[#F9F5FF] hover:bg-[#F4EBFF]'}`}
                  onClick={() => handleNotificationClick(item)}
                >
                  <List.Item.Meta
                    avatar={
                      <div className="relative">
                        <Avatar 
                          icon={config.icon} 
                          style={{ backgroundColor: config.bg, color: config.color }} 
                          size={44}
                          className="flex items-center justify-center text-lg"
                        />
                        {!item.is_read && (
                          <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[#7F56D9] border-2 border-white rounded-full" />
                        )}
                      </div>
                    }
                    title={
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex flex-col">
                           <span className={`text-[11px] font-bold uppercase tracking-wider mb-0.5`} style={{ color: config.color }}>
                            {config.label}
                          </span>
                        </div>
                      </div>
                    }
                    description={
                      <div className="flex flex-col gap-1 pr-6 mt-1">
                        <Text className={`text-[12px] leading-relaxed ${item.is_read ? 'text-gray-500 font-normal' : 'text-[#6941C6] font-medium'}`}>
                          {translateContent(item.message)}
                        </Text>
                        <div className="flex items-center gap-1.5 mt-2">
                          <HiOutlineClock className="text-[11px] text-gray-400" />
                          <Text className="text-[11px] text-gray-400 font-medium">
                            {dayjs(item.created_at).fromNow()}
                          </Text>
                        </div>
                      </div>
                    }
                  />
                  <button
                    onClick={(e) => handleDelete(e, item.id)}
                    className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 bg-white shadow-md border border-gray-100 rounded-xl p-2 transition-all duration-200 hover:scale-110 active:scale-95"
                  >
                    <HiOutlineTrash className="text-sm" />
                  </button>
                </List.Item>
              )
            }}
          />
        )}
        
        {/* Infinite Scroll Sentinel */}
        <div ref={ref} className="h-12 flex items-center justify-center">
          {isFetchingNextPage && (
            <div className="flex items-center gap-2 text-gray-400">
              <Spin size="small" />
              <span className="text-[12px]">Loading more...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <Popover
      content={content}
      title={
        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-50">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[18px] text-[#101828]">Notifications</span>
            {unreadNotifications.length > 0 && (
              <span className="bg-[#F9F5FF] text-[#7F56D9] text-[12px] font-bold px-2 py-0.5 rounded-full border border-[#E9D7FE]">
                {unreadNotifications.length}
              </span>
            )}
          </div>
          {unreadNotifications.length > 0 && (
            <button 
              onClick={handleReadAll}
              className="text-[13px] text-[#7F56D9] hover:text-[#6941C6] font-semibold bg-transparent border-none cursor-pointer p-0 hover:underline transition-all"
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
      overlayClassName="notification-popover"
      overlayInnerStyle={{ padding: 0, borderRadius: '24px', overflow: 'hidden' }}
    >
      <Badge 
        count={unreadNotifications.length} 
        size="small" 
        offset={[-4, 4]}
        style={{ backgroundColor: '#F04438', boxShadow: '0 0 0 2px #fff' }}
      >
        <div className="w-11 h-11 rounded-full border border-[#EAECF0] bg-white flex items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-[#D0D5DD] transition-all shadow-sm group">
          <HiOutlineBell className="text-[22px] text-[#667085] group-hover:text-[#7F56D9] transition-colors" />
        </div>
      </Badge>
    </Popover>
  )
}

