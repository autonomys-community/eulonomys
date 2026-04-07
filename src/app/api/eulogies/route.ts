import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = 12;

    const where = {
      visibility: "PUBLIC" as const,
      moderation: "APPROVED" as const,
      ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
    };

    const [eulogies, total] = await Promise.all([
      prisma.eulogy.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: pageSize,
        skip: (page - 1) * pageSize,
        select: {
          cid: true,
          name: true,
          dateOfBirth: true,
          dateOfPassing: true,
          relationship: true,
          contentPreview: true,
          createdAt: true,
        },
      }),
      prisma.eulogy.count({ where }),
    ]);

    return NextResponse.json({
      items: eulogies,
      total,
      page,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("Eulogies query error:", error);
    return NextResponse.json(
      { error: "Could not fetch eulogies" },
      { status: 500 }
    );
  }
}
