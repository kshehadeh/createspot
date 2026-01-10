import { prisma } from "./prisma";

export interface ExhibitWithDetails {
  id: string;
  title: string;
  description: string | null;
  startTime: Date;
  endTime: Date;
  isActive: boolean;
  curatorId: string;
  featuredArtistId: string | null;
  featuredSubmissionId: string | null;
  allowedViewTypes: string[];
  createdAt: Date;
  updatedAt: Date;
  curator: {
    id: string;
    name: string | null;
    image: string | null;
  };
  featuredArtist: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
  featuredSubmission: {
    id: string;
    title: string | null;
    imageUrl: string | null;
    text: string | null;
  } | null;
  _count: {
    submissions: number;
  };
}

export async function getCurrentExhibits(): Promise<ExhibitWithDetails[]> {
  const now = new Date();
  const exhibits = await prisma.exhibit.findMany({
    where: {
      isActive: true,
      startTime: { lte: now },
      endTime: { gte: now },
    },
    include: {
      curator: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      featuredArtist: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      featuredSubmission: {
        select: {
          id: true,
          title: true,
          imageUrl: true,
          text: true,
        },
      },
      _count: {
        select: {
          submissions: true,
        },
      },
    },
    orderBy: {
      startTime: "desc",
    },
  });

  return exhibits;
}

export async function getUpcomingExhibits(): Promise<ExhibitWithDetails[]> {
  const now = new Date();
  const exhibits = await prisma.exhibit.findMany({
    where: {
      startTime: { gt: now },
    },
    include: {
      curator: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      featuredArtist: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      featuredSubmission: {
        select: {
          id: true,
          title: true,
          imageUrl: true,
          text: true,
        },
      },
      _count: {
        select: {
          submissions: true,
        },
      },
    },
    orderBy: {
      startTime: "asc",
    },
    take: 1,
  });

  return exhibits;
}

export async function getExhibitById(
  id: string,
): Promise<ExhibitWithDetails | null> {
  const exhibit = await prisma.exhibit.findUnique({
    where: { id },
    include: {
      curator: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      featuredArtist: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      featuredSubmission: {
        select: {
          id: true,
          title: true,
          imageUrl: true,
          text: true,
        },
      },
      _count: {
        select: {
          submissions: true,
        },
      },
    },
  });

  return exhibit;
}

async function getExhibitSubmissions(
  exhibitId: string,
  options?: {
    skip?: number;
    take?: number;
  },
) {
  const { skip = 0, take = 100 } = options || {};
  const submissions = await prisma.exhibitSubmission.findMany({
    where: {
      exhibitId,
    },
    include: {
      submission: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          prompt: {
            select: {
              word1: true,
              word2: true,
              word3: true,
            },
          },
          _count: {
            select: {
              favorites: true,
            },
          },
        },
      },
    },
    orderBy: {
      order: "asc",
    },
    skip,
    take,
  });

  return submissions.map((es) => es.submission);
}
