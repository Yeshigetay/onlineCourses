import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// We will use UploadThing's REST API via UTApi dynamic import
// to avoid shipping client-side code in this route.

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const grade = String(formData.get("grade") ?? "").trim();
    const file = formData.get("file");

    if (!title || !description || !grade || !(file instanceof File)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Ensure grade exists (create if missing by name like "1", "2", etc.)
    let gradeRecord = await prisma.grade.findFirst({ where: { name: grade } });
    if (!gradeRecord) {
      gradeRecord = await prisma.grade.create({ data: { name: grade } });
    }

    // Upload to UploadThing using UTApi
    const { UTApi } = await import("uploadthing/server");
    const utapi = new UTApi({
      token: process.env.UPLOADTHING_TOKEN || process.env.UPLOADTHING_SECRET || undefined,
    });

    // UploadThing accepts a Blob/File directly
    const uploaded = await utapi.uploadFiles(file);
    if (!uploaded || uploaded.error || !uploaded.data?.url) {
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
    }

    const pdfUrl = uploaded.data.url;

    const course = await prisma.course.create({
      data: {
        title,
        description,
        pdfUrl,
        gradeId: gradeRecord.id,
      },
    });

    return NextResponse.json({ course }, { status: 201 });
  } catch (error) {
    console.error("Create course error", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const gradeParam = (searchParams.get("grade") || "").trim();

    // If a grade filter is provided, try to resolve it by name first; otherwise return all courses
    if (gradeParam) {
      // Grades are stored with string names like "1", "2", ...
      const grade = await prisma.grade.findFirst({ where: { name: gradeParam } });
      if (!grade) {
        return NextResponse.json({ courses: [] }, { status: 200 });
      }
      const courses = await prisma.course.findMany({
        where: { gradeId: grade.id },
        orderBy: { createdAt: "desc" },
        select: { 
          id: true, 
          title: true, 
          description: true, 
          pdfUrl: true, 
          createdAt: true,
          grade: {
            select: {
              name: true
            }
          }
        },
      });
      return NextResponse.json({ courses }, { status: 200 });
    }

    // No grade specified: return all courses (most recent first)
    const courses = await prisma.course.findMany({
      orderBy: { createdAt: "desc" },
      select: { 
        id: true, 
        title: true, 
        description: true, 
        pdfUrl: true, 
        createdAt: true, 
        gradeId: true,
        grade: {
          select: {
            name: true
          }
        }
      },
    });
    return NextResponse.json({ courses }, { status: 200 });
  } catch (error) {
    console.error("List courses error", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("id");

    if (!courseId) {
      return NextResponse.json({ error: "Course ID is required" }, { status: 400 });
    }

    // First, get the course to retrieve the PDF URL
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { pdfUrl: true }
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Delete the course from database
    await prisma.course.delete({
      where: { id: courseId }
    });

    // Delete the file from UploadThing
    try {
      const { UTApi } = await import("uploadthing/server");
      const utapi = new UTApi({
        token: process.env.UPLOADTHING_TOKEN || process.env.UPLOADTHING_SECRET || undefined,
      });

      // Extract file key from the URL
      const url = new URL(course.pdfUrl);
      const fileKey = url.pathname.split('/').pop();
      
      if (fileKey) {
        await utapi.deleteFiles(fileKey);
        console.log(`Successfully deleted file from UploadThing: ${fileKey}`);
      }
    } catch (uploadError) {
      // Log the error but don't fail the request since the course is already deleted from DB
      console.error("Failed to delete file from UploadThing:", uploadError);
    }

    return NextResponse.json({ message: "Course and file deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Delete course error", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, title, description, grade } = body;

    if (!id || !title || !description || !grade) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Ensure grade exists (create if missing by name like "1", "2", etc.)
    let gradeRecord = await prisma.grade.findFirst({ where: { name: grade } });
    if (!gradeRecord) {
      gradeRecord = await prisma.grade.create({ data: { name: grade } });
    }

    // Update the course
    const updatedCourse = await prisma.course.update({
      where: { id },
      data: {
        title,
        description,
        gradeId: gradeRecord.id,
      },
      select: {
        id: true,
        title: true,
        description: true,
        pdfUrl: true,
        createdAt: true,
        grade: {
          select: {
            name: true
          }
        }
      }
    });

    return NextResponse.json({ course: updatedCourse }, { status: 200 });
  } catch (error) {
    console.error("Update course error", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}


