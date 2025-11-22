import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { FiUser, FiMail, FiBook, FiTarget } from 'react-icons/fi'

const Profile = () => {
  const { user, updateProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.profile?.phone || '',
    college: user?.profile?.college || '',
    degree: user?.profile?.degree || '',
    graduation_year: user?.profile?.graduation_year || '',
    skills: user?.profile?.skills?.join(', ') || '',
    target_companies: user?.profile?.target_companies?.join(', ') || ''
  })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await updateProfile({
        name: formData.name,
        profile: {
          phone: formData.phone,
          college: formData.college,
          degree: formData.degree,
          graduation_year: parseInt(formData.graduation_year) || 0,
          skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
          target_companies: formData.target_companies.split(',').map(s => s.trim()).filter(Boolean)
        }
      })
      toast.success('Profile updated!')
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Profile Settings</h1>

      <form onSubmit={handleSubmit} className="card space-y-6">
        {/* Personal Info */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FiUser className="w-5 h-5" />
            Personal Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Email (readonly) */}
        <div>
          <label className="block text-sm font-medium mb-2 flex items-center gap-2">
            <FiMail className="w-4 h-4" />
            Email
          </label>
          <input
            type="email"
            value={user?.email || ''}
            disabled
            className="input bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
          />
          <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
        </div>

        {/* Education */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FiBook className="w-5 h-5" />
            Education
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">College/University</label>
              <input
                type="text"
                name="college"
                value={formData.college}
                onChange={handleChange}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Graduation Year</label>
              <input
                type="number"
                name="graduation_year"
                value={formData.graduation_year}
                onChange={handleChange}
                className="input"
                min="2000"
                max="2030"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Degree/Program</label>
            <input
              type="text"
              name="degree"
              value={formData.degree}
              onChange={handleChange}
              className="input"
              placeholder="e.g., B.Tech Computer Science"
            />
          </div>
        </div>

        {/* Skills & Targets */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FiTarget className="w-5 h-5" />
            Skills & Goals
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Skills</label>
              <input
                type="text"
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                className="input"
                placeholder="Python, Java, React, SQL (comma separated)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Target Companies</label>
              <input
                type="text"
                name="target_companies"
                value={formData.target_companies}
                onChange={handleChange}
                className="input"
                placeholder="Google, Amazon, Microsoft (comma separated)"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
          ) : (
            'Save Changes'
          )}
        </button>
      </form>
    </div>
  )
}

export default Profile
