"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

type Course = {
  id: string;
  title: string;
  description: string;
  pdfUrl: string;
  createdAt?: string;
  gradeId?: string;
  coverImage?: string;
};

export default function CoursesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const gradeParam = useMemo(() => (searchParams.get("grade") || "").trim(), [searchParams]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [coverImages, setCoverImages] = useState<Record<string, string>>({});
  const [loadingCovers, setLoadingCovers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Filter courses based on search query
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredCourses(courses);
    } else {
      const filtered = courses.filter(course =>
        course.title.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredCourses(filtered);
    }
  };

  const fetchCoverImage = async (courseId: string, pdfUrl: string) => {
    if (coverImages[courseId] || loadingCovers.has(courseId)) return;
    
    setLoadingCovers(prev => new Set(prev).add(courseId));
    
    try {
      const response = await fetch(`/api/courses/cover?url=${encodeURIComponent(pdfUrl)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.coverImage) {
          setCoverImages(prev => ({ ...prev, [courseId]: data.coverImage }));
        }
      } else {
        console.warn(`Failed to generate cover for course ${courseId}:`, response.statusText);
      }
    } catch (error) {
      console.error('Failed to fetch cover image:', error);
    } finally {
      setLoadingCovers(prev => {
        const newSet = new Set(prev);
        newSet.delete(courseId);
        return newSet;
      });
    }
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    const url = gradeParam ? `/api/courses?grade=${encodeURIComponent(gradeParam)}` : "/api/courses";
    fetch(url)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load courses");
        return res.json();
      })
      .then((data) => {
        if (!active) return;
        const list = Array.isArray(data) ? data : data?.courses;
        const coursesList = Array.isArray(list) ? list : [];
        setCourses(coursesList);
        setFilteredCourses(coursesList);
        
        // Fetch cover images for each course
        coursesList.forEach((course: Course) => {
          if (course.pdfUrl) {
            fetchCoverImage(course.id, course.pdfUrl);
          }
        });
      })
      .catch(() => {
        if (!active) return;
        setError("Could not load courses.");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [gradeParam]);

  const readableGrade = gradeParam ? `Grade ${gradeParam}` : "All Grades";

  const handleDownload = async (pdfUrl: string, title: string) => {
    try {
      const response = await fetch(pdfUrl, { mode: "cors" });
      if (!response.ok) throw new Error("Failed to fetch file");
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const safeFilename = `${(title || "course").replace(/[^\w\s.-]+/g, "_")}.pdf`;
      link.href = blobUrl;
      link.download = safeFilename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed:", err);
      // Fallback: open in new tab if direct download fails
      try {
        window.open(pdfUrl, "_blank", "noopener,noreferrer");
      } catch {}
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 gap-3">
            <div className="text-center sm:text-left">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">{readableGrade} Courses</h1>
              <p className="text-xs sm:text-sm text-gray-500">Browse and download course PDFs</p>
            </div>
            <Link href="/" className="text-blue-600 hover:text-blue-700 text-sm font-medium text-center sm:text-right">
              ← Back to Grades
            </Link>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search courses by title..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearch("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      <main className="py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Search Results Counter */}
          {!loading && courses.length > 0 && (
            <div className="mb-4 text-sm text-gray-600">
              {searchQuery ? (
                <span>
                  Showing {filteredCourses.length} of {courses.length} courses
                  {filteredCourses.length !== courses.length && ` matching "${searchQuery}"`}
                </span>
              ) : (
                <span>Showing {courses.length} courses</span>
              )}
            </div>
          )}
          
          {loading ? (
            <div className="text-gray-600">Loading courses…</div>
          ) : error ? (
            <div className="text-red-600">{error}</div>
          ) : courses.length === 0 ? (
            <div className="text-gray-600">No courses found.</div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-gray-600">
              {searchQuery ? `No courses found matching "${searchQuery}".` : "No courses found."}
            </div>
          ) : (
            <ul className="space-y-4">
              {filteredCourses.map((course) => (
                <li key={course.id} className="bg-white border border-gray-100 rounded-lg p-3 sm:p-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    {/* PDF Cover Image */}
                    <div className="flex-shrink-0 mx-auto sm:mx-0">
                      {loadingCovers.has(course.id) ? (
                        <div className="w-24 h-32 sm:w-32 sm:h-40 bg-gray-200 rounded-lg flex items-center justify-center">
                          <div className="text-gray-500 text-xs sm:text-sm">Loading...</div>
                        </div>
                      ) : coverImages[course.id] ? (
                        <img
                          src={coverImages[course.id]}
                          alt={`${course.title} cover`}
                          className="w-24 h-32 sm:w-32 sm:h-40 object-cover rounded-lg shadow-sm border border-gray-200"
                        />
                      ) : (
                        <div className="w-24 h-32 sm:w-32 sm:h-40 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                          <div className="text-gray-500 text-xs sm:text-sm text-center">
                            <div className="text-xl sm:text-2xl mb-1">📄</div>
                            <div>PDF</div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Course Info */}
                    <div className="flex-1 flex flex-col gap-3">
                      <div className="text-center sm:text-left">
                        <h3 className="text-gray-900 font-semibold text-base sm:text-lg">{course.title}</h3>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">{course.description}</p>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row items-center gap-2">
                        <a
                          href={course.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full sm:w-auto inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-xs sm:text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                        >
                          👁️ View PDF
                        </a>
                        <button
                          onClick={() => handleDownload(course.pdfUrl, course.title)}
                          className="w-full sm:w-auto inline-flex items-center justify-center rounded-md bg-green-600 px-3 py-2 text-xs sm:text-sm font-medium text-white hover:bg-green-700 transition-colors"
                        >
                          ⬇️ Download
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}


