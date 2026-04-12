"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "@/components/link";
import { buildRoutePath } from "@/lib/routes";
import { Button } from "@createspot/ui-primitives/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PAGE_SIZE = 10;

export interface CreatorCritiqueSubmissionRow {
  id: string;
  title: string | null;
  critiquerCount: number;
}

interface CreatorCritiquesSubmissionsTableProps {
  rows: CreatorCritiqueSubmissionRow[];
  creatorUrl: string;
  creatorid: string;
}

type SortColumn = "title" | "critiquers";

export function CreatorCritiquesSubmissionsTable({
  rows,
  creatorUrl,
  creatorid,
}: CreatorCritiquesSubmissionsTableProps) {
  const t = useTranslations("critique");
  const tCommon = useTranslations("common");
  const tExhibition = useTranslations("exhibition");

  const [sortColumn, setSortColumn] = useState<SortColumn>("title");
  const [sortDesc, setSortDesc] = useState(false);
  const [page, setPage] = useState(1);

  const untitled = tExhibition("untitled");

  const sorted = useMemo(() => {
    const next = [...rows];
    const mul = sortDesc ? -1 : 1;
    next.sort((a, b) => {
      if (sortColumn === "title") {
        const at = (a.title || untitled).toLowerCase();
        const bt = (b.title || untitled).toLowerCase();
        return at.localeCompare(bt) * mul;
      }
      return (a.critiquerCount - b.critiquerCount) * mul;
    });
    return next;
  }, [rows, sortColumn, sortDesc, untitled]);

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageRows = sorted.slice(pageStart, pageStart + PAGE_SIZE);
  const from = total === 0 ? 0 : pageStart + 1;
  const to = pageStart + pageRows.length;

  const setSort = (column: SortColumn) => {
    if (column === sortColumn) {
      setSortDesc((d) => !d);
    } else {
      setSortColumn(column);
      setSortDesc(false);
    }
    setPage(1);
  };

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="ml-1.5 h-4 w-4 opacity-50" aria-hidden />;
    }
    return sortDesc ? (
      <ArrowDown className="ml-1.5 h-4 w-4" aria-hidden />
    ) : (
      <ArrowUp className="ml-1.5 h-4 w-4" aria-hidden />
    );
  };

  return (
    <Card className="overflow-hidden rounded-2xl border-transparent bg-surface-container shadow-[0_14px_35px_rgb(0_0_0_/_0.35)]">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead scope="col" className="min-w-[12rem]">
                <Button
                  type="button"
                  variant="ghost"
                  className="-ml-3 h-8 px-3 font-medium text-on-surface-variant hover:text-foreground"
                  onClick={() => setSort("title")}
                  aria-label={t("submissionsTableSortSubmission")}
                >
                  {t("submissionName")}
                  <SortIcon column="title" />
                </Button>
              </TableHead>
              <TableHead scope="col" className="w-36 text-right">
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    className="-mr-3 h-8 px-3 font-medium text-on-surface-variant hover:text-foreground"
                    onClick={() => setSort("critiquers")}
                    aria-label={t("submissionsTableSortCritiquers")}
                  >
                    {t("critiquers")}
                    <SortIcon column="critiquers" />
                  </Button>
                </div>
              </TableHead>
              <TableHead scope="col" className="w-44 text-right">
                <span className="sr-only">{t("viewCritiques")}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <Link
                    href={`${creatorUrl}/s/${row.id}`}
                    className="font-medium text-foreground hover:underline"
                  >
                    {row.title || untitled}
                  </Link>
                </TableCell>
                <TableCell className="text-right tabular-nums text-on-surface-variant">
                  {row.critiquerCount}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      href={buildRoutePath("submissionCritiques", {
                        creatorid,
                        submissionid: row.id,
                      })}
                    >
                      {t("viewCritiques")}
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="flex flex-col gap-3 border-t border-outline-variant/25 bg-surface-container-high/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-on-surface-variant">
          {t("submissionsTableShowing", { start: from, end: to, total })}
          {totalPages > 1
            ? ` · ${t("submissionsTablePageOf", { page: safePage, totalPages })}`
            : null}
        </p>
        {totalPages > 1 ? (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              {tCommon("previous")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
            >
              {tCommon("next")}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        ) : null}
      </CardFooter>
    </Card>
  );
}
