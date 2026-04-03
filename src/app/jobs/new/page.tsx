import { Suspense } from "react";
import RefreshButton from "@/components/jobs/RefreshButton";
import { Job } from "@/types";
import JobListSkeleton from "@/components/jobs/JobListSkeleton";
import { getAllActiveJobsCount, getNewJobs } from "@/lib/supabase/queries";
import TopMatchesList from "@/components/jobs/TopMatchesList";
import SearchComponent from "@/components/jobs/SearchComponent";
import FilterButton from "@/components/jobs/FilterButton";

const PAGE_SIZE = 10; // Define page size

export default async function NewJobsPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  // Get current page from search params, default to 1
  const currentPage = parseInt(params?.page as string) || 1;

  // Get search query from search params
  const searchQuery = params?.query as string;

  // Get provider filter from search params
  const provider = params?.provider as string;
  const providerFilter = provider && provider !== "all" ? provider : undefined;

  // Get interest filter from search params
  const interestParam = params?.interest as string;
  let interestFilter: boolean | null | undefined = undefined;
  if (interestParam === "true") {
    interestFilter = true;
  } else if (interestParam === "false") {
    interestFilter = false;
  } else if (interestParam === "null") {
    interestFilter = null;
  }

  // Get resume score filter from search params
  const minScoreParam = params?.minScore as string;
  const maxScoreParam = params?.maxScore as string;

  const minScore = minScoreParam ? parseInt(minScoreParam) : undefined;
  const maxScore = maxScoreParam ? parseInt(maxScoreParam) : undefined;

  // Get score status filter ("pending" = unscored, "scored" = has score)
  const scoreStatus = params?.scoreStatus as string | undefined;

  // Get resume score stage filter ("initial" or "custom") — used with scoreStatus=scored
  const resumeScoreStage = params?.resumeScoreStage as string | undefined;

  // Get custom resume filter ("true" = has custom resume, "false" = no custom resume)
  const customResume = params?.customResume as string | undefined;

  // Fetch the jobs for the current page
  const newJobs: Job[] = await getNewJobs(
    currentPage,
    PAGE_SIZE,
    providerFilter,
    minScore,
    maxScore,
    interestFilter,
    searchQuery,
    scoreStatus,
    resumeScoreStage,
    customResume
  );

  // Fetch total count
  const totalCount = await getAllActiveJobsCount(
    providerFilter,
    minScore,
    maxScore,
    interestFilter,
    searchQuery,
    scoreStatus,
    resumeScoreStage,
    customResume
  );

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Page header with actions */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Jobs</h1>
          <p className="mt-1 text-sm text-gray-500">
            New jobs ({totalCount} total)
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <SearchComponent />
          <FilterButton />
          <RefreshButton currentPage={currentPage} />
        </div>
      </div>

      {/* Main content with loading state */}
      <Suspense fallback={<JobListSkeleton />}>
        <TopMatchesList
          jobs={newJobs}
          currentPage={currentPage}
          totalPages={totalPages}
        />
      </Suspense>
    </div>
  );
}

// Optional: Add revalidation if needed
export const revalidate = 0; // Revalidate once per hour
