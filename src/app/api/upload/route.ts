import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { autoDriveClient } from "@/services/autoDrive";
import { moderationService } from "@/services/moderation";
import type { EulogyMetadata } from "@/types/eulogy";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const name = formData.get("name") as string;
    const content = formData.get("content") as string;
    const visibility = formData.get("visibility") as "public" | "private";
    const dateOfBirth = formData.get("dateOfBirth") as string | null;
    const dateOfPassing = formData.get("dateOfPassing") as string | null;
    const relationship = formData.get("relationship") as string | null;
    const imageFile = formData.get("image") as File | null;

    if (!name || !content) {
      return NextResponse.json(
        { error: "Name and content are required" },
        { status: 400 }
      );
    }

    // Upload image if present
    let imageCid: string | undefined;
    if (imageFile) {
      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const result = await autoDriveClient.uploadFile(
        buffer,
        imageFile.name,
        imageFile.type
      );
      imageCid = result.cid;
    }

    // Build metadata
    const metadata: EulogyMetadata = {
      version: "1.0",
      type: "eulogy",
      name,
      content,
      contentFormat: "markdown",
      visibility,
      createdAt: new Date().toISOString(),
      createdBy: "eulonomys-app",
      fundedBy: "self",
      ...(dateOfBirth ? { dateOfBirth } : {}),
      ...(dateOfPassing ? { dateOfPassing } : {}),
      ...(relationship ? { relationship } : {}),
      ...(imageCid ? { imageCid } : {}),
    };

    // Upload metadata JSON to Auto Drive
    const result = await autoDriveClient.uploadJson(
      metadata as unknown as Record<string, unknown>,
      `${name.replace(/[^a-zA-Z0-9]/g, "-")}-eulogy.json`
    );

    // Content preview for browse cards
    const contentPreview = content.replace(/[#*_>\[\]]/g, "").slice(0, 200);

    // Run moderation if public
    let moderationStatus: "PENDING" | "APPROVED" | "FLAGGED" = "PENDING";
    if (visibility === "public") {
      const screening = await moderationService.screen(content, name);
      moderationStatus = screening.approved ? "APPROVED" : "FLAGGED";
    } else {
      // Private eulogies skip moderation
      moderationStatus = "APPROVED";
    }

    // Index in database
    await prisma.eulogy.create({
      data: {
        cid: result.cid,
        imageCid,
        name,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        dateOfPassing: dateOfPassing ? new Date(dateOfPassing) : null,
        relationship,
        visibility: visibility === "public" ? "PUBLIC" : "PRIVATE",
        contentPreview,
        creatorAddress: "eulonomys-app",
        fundedBy: "SELF",
        moderation: moderationStatus,
      },
    });

    return NextResponse.json({ cid: result.cid });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
