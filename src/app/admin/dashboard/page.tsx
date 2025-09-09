'use client'
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, LogOut, BookOpen, Users, BarChart, Cog, X, Edit, Trash2, Eye, RefreshCw, Search } from "lucide-react";

type Course = {
  id: string;
  title: string;
  description: string;
  pdfUrl: string;
  createdAt: string;
  grade: {
    name: string;
  };
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Listen for success events from the add-course iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data: any = event.data;
      if (data && data.type === 'COURSE_CREATED') {
        setShowAddModal(false);
        setSuccessMessage(`Course "${data.courseTitle}" created successfully`);
        fetchCourses();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Check authentication status
  useEffect(() => {
    const checkAuth = () => {
      const authStatus = localStorage.getItem('admin_authenticated');
      if (authStatus === 'true') {
        setIsAuthenticated(true);
      } else {
        router.push('/admin/login');
      }
      setAuthLoading(false);
    };

    checkAuth();
  }, [router]);

  // Fetch courses data
  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/courses');
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Delete course
  const handleDeleteCourse = async (courseId: string) => {
    try {
      const response = await fetch(`/api/courses?id=${courseId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setCourses(courses.filter(course => course.id !== courseId));
        setDeleteConfirm(null);
        console.log('Course and file deleted successfully');
      } else {
        const errorData = await response.json();
        console.error('Failed to delete course:', errorData.error);
        alert('Failed to delete course. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('An error occurred while deleting the course. Please try again.');
    }
  };

  // Update course
  const handleUpdateCourse = async (updatedCourse: Course) => {
    try {
      const response = await fetch('/api/courses', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: updatedCourse.id,
          title: updatedCourse.title,
          description: updatedCourse.description,
          grade: updatedCourse.grade.name,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCourses(courses.map(course => 
          course.id === updatedCourse.id ? data.course : course
        ));
        setShowEditModal(false);
        setEditingCourse(null);
      } else {
        console.error('Failed to update course');
      }
    } catch (error) {
      console.error('Error updating course:', error);
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('admin_authenticated');
    router.push('/admin/login');
  };

  // Filter courses based on search query
  const filteredCourses = courses.filter(course => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      course.title.toLowerCase().includes(query) ||
      course.description.toLowerCase().includes(query) ||
      course.grade.name.toLowerCase().includes(query)
    );
  });

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50" style={{ color: '#000' }}>
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 sm:h-16 py-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
           
            <div>
              <h1 className="text-lg font-semibold">Admin Panel</h1>
              <p className="hidden sm:block text-xs text-gray-500">Welcome, admin • Manage courses and content</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={fetchCourses}
              className="inline-flex items-center gap-2 rounded-md bg-gray-600 text-white px-4 py-2 text-sm font-medium hover:bg-gray-700"
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
           
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-md bg-red-600 text-white px-4 py-2 text-sm font-medium hover:bg-red-700"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {successMessage && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 flex items-start justify-between gap-4">
            <div>{successMessage}</div>
            <button
              className="text-green-700 hover:text-green-900"
              onClick={() => setSuccessMessage(null)}
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <BookOpen className="h-5 w-5" />
              </div>
              <div className="text-sm text-gray-500">Total Courses</div>
            </div>
            <div className="mt-3 text-3xl font-bold tracking-tight">{courses.length}</div>
          </div>

          

          

          
        </div>

        {/* Courses card */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="border-b px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
            <div className="flex items-center gap-2 text-blue-600 font-medium">
              <BookOpen className="h-5 w-5" />
              <span>Courses</span>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" /> Add Course
            </button>
          </div>

          {/* Search Bar */}
          <div className="px-6 py-4 border-b bg-gray-50">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search courses by title, description, or grade..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {searchQuery && (
              <div className="mt-2 text-sm text-gray-600">
                Showing {filteredCourses.length} of {courses.length} courses
              </div>
            )}
          </div>

          <div className="px-6 py-4">
            <h2 className="text-base font-semibold">Course Management</h2>
          </div>

          <div className="px-6 pb-6">
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-3 sm:px-4 py-3 font-medium">COURSE</th>
                    <th className="px-3 sm:px-4 py-3 font-medium">GRADE</th>
                    <th className="px-3 sm:px-4 py-3 font-medium">CREATED</th>
                    <th className="px-3 sm:px-4 py-3 font-medium">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td className="px-3 sm:px-4 py-6 text-gray-500" colSpan={4}>
                        Loading courses...
                      </td>
                    </tr>
                  ) : filteredCourses.length === 0 ? (
                    <tr>
                      <td className="px-3 sm:px-4 py-6 text-gray-500" colSpan={4}>
                        {searchQuery ? 'No courses found matching your search' : 'No courses yet'}
                      </td>
                    </tr>
                  ) : (
                    filteredCourses.map((course) => (
                      <tr key={course.id} className="border-b hover:bg-gray-50">
                        <td className="px-3 sm:px-4 py-4">
                          <div className="flex flex-col">
                            <div className="font-medium text-gray-900">{course.title}</div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {course.description}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 sm:px-4 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Grade {course.grade.name}
                          </span>
                        </td>
                        <td className="px-3 sm:px-4 py-4 text-sm text-gray-500">
                          {formatDate(course.createdAt)}
                        </td>
                        <td className="px-3 sm:px-4 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => window.open(course.pdfUrl, '_blank')}
                              className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                              title="View PDF"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingCourse(course);
                                setShowEditModal(true);
                              }}
                              className="p-1.5 text-gray-400 hover:text-green-600 transition-colors"
                              title="Edit course"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(course.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                              title="Delete course"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
      {/* Add Course Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-20 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAddModal(false)} />
          <div className="relative z-30 w-[95vw] max-w-5xl max-h-[90vh] bg-white rounded-2xl shadow-xl border overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h2 className="text-base font-semibold">Add New Course</h2>
              <button
                className="p-2 rounded hover:bg-gray-100"
                aria-label="Close"
                onClick={() => setShowAddModal(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <iframe
              src="/admin/dashboard/addCourse"
              className="w-full h-[75vh]"
              title="Add Course"
              onLoad={() => {
                // Refresh courses when iframe loads (course added)
                setTimeout(() => fetchCourses(), 1000);
              }}
            />
          </div>
        </div>
      )}

      {/* Edit Course Modal */}
      {showEditModal && editingCourse && (
        <div className="fixed inset-0 z-20 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowEditModal(false)} />
          <div className="relative z-30 w-[95vw] max-w-2xl bg-white rounded-2xl shadow-xl border overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">Edit Course</h2>
              <button
                className="p-2 rounded hover:bg-gray-100"
                onClick={() => setShowEditModal(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <EditCourseForm
                course={editingCourse}
                onSave={handleUpdateCourse}
                onCancel={() => setShowEditModal(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-20 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteConfirm(null)} />
          <div className="relative z-30 bg-white rounded-2xl shadow-xl border p-6 max-w-md w-[95vw]">
            <h3 className="text-lg font-semibold mb-2">Delete Course</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this course? This will permanently remove:
            </p>
            <ul className="text-sm text-gray-600 mb-6 list-disc list-inside space-y-1">
              <li>The course record from the database</li>
              <li>The PDF file from storage</li>
              <li>All associated data</li>
            </ul>
            <p className="text-sm text-red-600 font-medium mb-6">
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteCourse(deleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Edit Course Form Component
function EditCourseForm({ 
  course, 
  onSave, 
  onCancel 
}: { 
  course: Course; 
  onSave: (course: Course) => void; 
  onCancel: () => void; 
}) {
  const [formData, setFormData] = useState({
    title: course.title,
    description: course.description,
    grade: course.grade.name,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const updatedCourse = {
        ...course,
        title: formData.title,
        description: formData.description,
        grade: { name: formData.grade }
      };
      await onSave(updatedCourse);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Course Title
        </label>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-1">
          Grade
        </label>
        <select
          id="grade"
          value={formData.grade}
          onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={String(i + 1)}>
              Grade {i + 1}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-3 justify-end pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          disabled={saving}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}


