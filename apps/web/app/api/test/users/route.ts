import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

const isProduction = process.env.NODE_ENV === "production";

function getBootstrapSecret(request: NextRequest): string | null {
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return request.headers.get("x-bootstrap-secret");
}

export async function POST(request: NextRequest) {
  if (isProduction) {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 404 },
    );
  }
  const secret = process.env.E2E_BOOTSTRAP_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "E2E_BOOTSTRAP_SECRET is not configured" },
      { status: 503 },
    );
  }
  const provided = getBootstrapSecret(request);
  if (provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    email: string;
    password: string;
    name?: string;
    isAdmin?: boolean;
    bio?: string;
    language?: string;
    slug?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { email, password, name, isAdmin, bio, language, slug } = body;
  if (
    !email ||
    typeof email !== "string" ||
    !password ||
    typeof password !== "string"
  ) {
    return NextResponse.json(
      { error: "email and password are required" },
      { status: 400 },
    );
  }

  const passwordHash = await hashPassword(password);
  const data = {
    email: email.trim().toLowerCase(),
    passwordHash,
    ...(name !== undefined && { name: name ?? null }),
    ...(typeof isAdmin === "boolean" && { isAdmin }),
    ...(bio !== undefined && { bio: bio ?? null }),
    ...(language !== undefined && { language: language ?? "en" }),
    ...(slug !== undefined && { slug: slug ?? null }),
  };

  const user = await prisma.user.upsert({
    where: { email: data.email },
    update: {
      passwordHash: data.passwordHash,
      ...(name !== undefined && { name: data.name }),
      ...(typeof isAdmin === "boolean" && { isAdmin: data.isAdmin }),
      ...(bio !== undefined && { bio: data.bio }),
      ...(language !== undefined && { language: data.language }),
      ...(slug !== undefined && { slug: data.slug }),
    },
    create: {
      email: data.email,
      passwordHash: data.passwordHash,
      name: data.name ?? null,
      isAdmin: data.isAdmin ?? false,
      bio: data.bio ?? null,
      language: data.language ?? "en",
      slug: data.slug ?? null,
    },
    select: {
      id: true,
      email: true,
      name: true,
      isAdmin: true,
      slug: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    isAdmin: user.isAdmin,
    slug: user.slug,
    createdAt: user.createdAt.toISOString(),
  });
}
