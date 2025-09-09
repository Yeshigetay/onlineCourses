import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // Fetch all grades with their course counts
    const grades = await prisma.grade.findMany({
      include: {
        _count: {
          select: {
            courses: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Transform the data to match the expected format
    const gradesWithCounts = grades.map(grade => ({
      id: parseInt(grade.name), // Convert string name to number for display
      name: `Grade ${grade.name}`,
      description: `Educational content for Grade ${grade.name} students`,
      courseCount: grade._count.courses
    }));

    return NextResponse.json(gradesWithCounts, { status: 200 });
  } catch (error) {
    console.error("List grades error", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
