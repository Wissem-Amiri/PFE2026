'use client'

import { useState, useEffect } from 'react'
import { Modal, Form, Input, Select, DatePicker, Popconfirm, message } from 'antd'
import { getAllJobs, createJob, updateJob, deleteJob } from '@/lib/jobService'
import type { Job } from '@/lib/database.types'
import dayjs from 'dayjs'

export default function JobsPage() {
  const [activeTab, setActiveTab] = useState('View all')
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [form] = Form.useForm()
  const [messageApi, contextHolder] = message.useMessage()

  const fetchJobs = async () => {
    setLoading(true)
    const { data } = await getAllJobs()
    setJobs(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    fetchJobs()
  }, [])

  const handleOpenModal = (job?: Job) => {
    if (job) {
      setEditingJob(job)
      form.setFieldsValue({
        ...job,
        deadline: dayjs(job.deadline)
      })
    } else {
      setEditingJob(null)
      form.resetFields()
      form.setFieldsValue({ status: 'draft' })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    form.resetFields()
    setEditingJob(null)
  }

  const handleSave = async (values: any) => {
    const jobData = {
      ...values,
      deadline: values.deadline.format('YYYY-MM-DD')
    }

    if (editingJob) {
      const { error } = await updateJob(editingJob.id, jobData)
      if (error) {
        messageApi.error('Error updating job')
      } else {
        messageApi.success('Job updated successfully')
        fetchJobs()
        handleCloseModal()
      }
    } else {
      const { error } = await createJob(jobData)
      if (error) {
        messageApi.error('Error creating job')
      } else {
        messageApi.success('Job created successfully')
        fetchJobs()
        handleCloseModal()
      }
    }
  }

  const handleDelete = async (id: string) => {
    const { error } = await deleteJob(id)
    if (error) {
      messageApi.error('Error deleting job')
    } else {
      messageApi.success('Job deleted successfully')
      fetchJobs()
    }
  }

  // Calculate dynamic tabs
  const categories = Array.from(new Set(jobs.map(j => j.category)))
  const tabs = [
    { label: 'View all', count: jobs.length },
    ...categories.map(cat => ({
      label: cat,
      count: jobs.filter(j => j.category === cat).length
    }))
  ]

  const filteredJobs = activeTab === 'View all' 
    ? jobs 
    : jobs.filter(j => j.category === activeTab)

  return (
    <div className="flex-1 p-[24px] px-[28px] h-full overflow-y-auto">
      {contextHolder}
      
      <div className="flex justify-between items-center mb-[20px]">
        <h1 className="text-[22px] font-bold text-[#101828] mb-0">Jobs</h1>
        <div className="flex gap-[8px] items-center">
          <button 
            onClick={() => handleOpenModal()}
            className="px-[14px] py-[7px] border border-[#7C3AED] rounded-[8px] bg-[#7C3AED] text-white font-['Sora',sans-serif] text-[12px] font-medium cursor-pointer hover:bg-[#6D28D9]"
          >
            + Add Job
          </button>
        </div>
      </div>

      <div className="flex gap-[20px] border-b border-[#E4E7EC] mb-[24px] overflow-x-auto">
        {tabs.map(tab => (
          <div 
            key={tab.label}
            onClick={() => setActiveTab(tab.label)}
            className={`pb-[12px] text-[13px] font-medium cursor-pointer relative whitespace-nowrap ${activeTab === tab.label ? 'text-[#7C3AED]' : 'text-[#475467] hover:text-[#101828]'}`}
          >
            {tab.label} ({tab.count})
            {activeTab === tab.label && (
              <div className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-[#7C3AED] rounded-t-[2px]"></div>
            )}
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-400">Loading jobs...</div>
      ) : filteredJobs.length === 0 ? (
        <div className="text-center py-10 text-slate-400">No jobs found in this category.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[20px]">
          {filteredJobs.map(job => (
            <div key={job.id} className="bg-white border border-[#E4E7EC] rounded-[16px] p-[20px] transition-all hover:-translate-y-[2px] hover:shadow-sm">
              <div className="flex justify-between items-start mb-[12px]">
                <h3 className="text-[16px] font-semibold text-[#101828] leading-[1.3] m-0 cursor-pointer hover:text-[#7C3AED]">
                  {job.title}
                </h3>
                <div className="flex gap-[12px] text-[14px] opacity-70">
                  <span className="cursor-pointer hover:opacity-100 hover:text-[#7C3AED]" title="Copy link">🔗</span>
                  <span onClick={() => handleOpenModal(job)} className="cursor-pointer hover:opacity-100 hover:text-[#7C3AED]" title="Edit">✏️</span>
                  <Popconfirm
                    title="Delete Job"
                    description="Are you sure to delete this job?"
                    onConfirm={() => handleDelete(job.id)}
                    okText="Yes"
                    cancelText="No"
                    okButtonProps={{ danger: true }}
                  >
                    <span className="cursor-pointer hover:opacity-100 hover:text-red-500" title="Delete">🗑️</span>
                  </Popconfirm>
                </div>
              </div>
              <p className="text-[12px] text-[#475467] leading-[1.6] mb-[20px] min-h-[58px] line-clamp-3">
                {job.description}
              </p>
              <div className="flex justify-between items-center bg-[#F9FAFB] p-[12px] rounded-[8px]">
                <div>
                  {job.status === 'published' ? (
                    <div className="inline-block px-[10px] py-[4px] rounded-full text-[10px] font-semibold bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]">
                      Published
                    </div>
                  ) : (
                    <div className="inline-block px-[10px] py-[4px] rounded-full text-[10px] font-semibold bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB]">
                      Draft
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-[#98A2B3] block mb-[2px]">Deadline:</span>
                  <span className="text-[12px] text-[#101828] font-bold">
                    {new Date(job.deadline).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <button className="w-full mt-[16px] px-[12px] py-[8px] rounded-[8px] border-[1.5px] border-[#D0D5DD] bg-white font-['Sora',sans-serif] text-[12px] font-medium text-[#101828] cursor-pointer hover:border-[#7c3aed] transition-colors">
                See More
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        title={editingJob ? "Edit Job" : "Create New Job"}
        open={isModalOpen}
        onCancel={handleCloseModal}
        onOk={() => form.submit()}
        okText={editingJob ? "Save Changes" : "Create Job"}
        okButtonProps={{ style: { background: '#7C3AED', borderColor: '#7C3AED' } }}
      >
        <Form form={form} layout="vertical" onFinish={handleSave} className="mt-4">
          <Form.Item name="title" label="Job Title" rules={[{ required: true }]}>
            <Input placeholder="e.g. Lead Software Engineer" />
          </Form.Item>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="category" label="Category" rules={[{ required: true }]}>
              <Select 
                placeholder="e.g. Informatics"
                options={[
                  { value: 'Informatics', label: 'Informatics' },
                  { value: 'Business', label: 'Business' },
                  { value: 'Design', label: 'Design' },
                  { value: 'Marketing', label: 'Marketing' },
                  { value: 'Sales', label: 'Sales' },
                ]}
              />
            </Form.Item>
            <Form.Item name="deadline" label="Deadline" rules={[{ required: true }]}>
              <DatePicker className="w-full" />
            </Form.Item>
          </div>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select 
              options={[
                { value: 'draft', label: 'Draft' },
                { value: 'published', label: 'Published' }
              ]}
            />
          </Form.Item>
          <Form.Item name="description" label="Description" rules={[{ required: true }]}>
            <Input.TextArea rows={4} placeholder="Describe the job role..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
