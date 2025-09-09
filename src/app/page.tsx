"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FiShield } from "react-icons/fi";
import { FaTelegramPlane, FaInstagram } from "react-icons/fa";


type Grade = {
  id: number;
  name: string;
  description: string;
  courseCount: number;
};

export default function Home() {
  const [grades, setGrades] = useState<Grade[]>([]);

  useEffect(() => {
    // Initialize with empty grades array
    setGrades([]);

    const load = () => {
      fetch("/api/grades")
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          if (Array.isArray(data) && data.length) {
            setGrades(data as Grade[]);
          } else {
            // If no grades exist in database, show default 12 grades with 0 courses
            const defaultGrades: Grade[] = Array.from({ length: 12 }, (_, i) => ({
              id: i + 1,
              name: `Grade ${i + 1}`,
              description: `Educational content for Grade ${i + 1} students`,
              courseCount: 0,
            }));
            setGrades(defaultGrades);
          }
        })
        .catch((error) => {
          console.error("Failed to load grades:", error);
          // Fallback to default grades on error
          const defaultGrades: Grade[] = Array.from({ length: 12 }, (_, i) => ({
            id: i + 1,
            name: `Grade ${i + 1}`,
            description: `Educational content for Grade ${i + 1} students`,
            courseCount: 0,
          }));
          setGrades(defaultGrades);
        });
    };
    load();

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        load();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    const intervalId = setInterval(load, 10000);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(intervalId);
    };
  }, []);

  return (
    <div
      className="min-h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('/bg.jpg')" }}
    >
      <Link
        href="/admin/login"
        className="fixed top-4 left-4 bg-white/90 hover:bg-white p-2 rounded-lg shadow z-50"
        aria-label="Security"
      >
        <FiShield className="w-6 h-6 text-gray-700" />
      </Link>
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <div className=" p-6 rounded-lg">
                <Image src="/logo.jpg" alt="Logo" width={100} height={100} className="rounded" />
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-xl font-bold text-gray-900">የፈጬ ደብረ ገነት ቅድስት ድንግል ማርያም ቤተክርስቲያን የጽርሐ ጽዮን ሰንበት ት/ቤት</h1>
                <p className="text-sm text-gray-500">Mobile Learning Platform</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"></h2>
          <p className="text-lg text-white mb-8 max-w-2xl mx-auto">
          2ኛ ጴጥ 1፦10
          "ስለዚህ፥ወንድሞች ሆይ፥መጠራታችኹንና መመረጣችኹን ታጸኑ ዘንድ ከፊት ይልቅ ትጉ እነዚህን ብታደርጉ ከቶ አትሰናከሉምና።"
          </p>
        </div>
      </section>

      {/* Grade Selection Grid */}
      <section className="pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {grades.map((grade) => (
              <Link
                key={grade.id}
                href={`/courses?grade=${grade.id}`}
                className="group bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 hover:border-blue-200"
              >
                <div className="text-center">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <span className="text-white font-bold text-lg">{grade.id}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{grade.name}</h3>
                  <p className="text-sm text-gray-500 mb-3">{grade.courseCount} courses</p>
                  <div className="text-xs text-blue-600 font-medium group-hover:text-blue-700">
                    View Courses →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 text-sm">
            <p>
              &copy; 2018 የፈጬ ደብረ ገነት ቅድስት ድንግል ማርያም ቤተክርስቲያን የጽርሐ ጽዮን ሰንበት ት/ቤት 
              Developed by Yeshigeta And Michael 
            </p>
            <div className="text-center text-gray-500 text-sm"> 
              <a
                href="https://t.me/Jt12Ws2"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center mt-2 text-blue-500 hover:text-blue-600"
                aria-label="Telegram"
                title="Telegram"
              >
                <FaTelegramPlane className="w-6 h-6" />
              </a>
              <a
                href="https://instagram.com/benjamingx54"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center mt-2 ml-3 text-pink-500 hover:text-pink-600"
                aria-label="Instagram"
                title="Instagram"
              >
                <FaInstagram className="w-6 h-6" />
              </a>
            </div>

          </div>
        </div>
      </footer>
    </div>
  );
}
