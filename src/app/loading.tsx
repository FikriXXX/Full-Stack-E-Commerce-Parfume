import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <>
      {/* Hero skeleton */}
      <section className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="text-center space-y-4">
          <Skeleton className="mx-auto h-4 w-48" />
          <Skeleton className="mx-auto h-12 w-80" />
          <Skeleton className="mx-auto h-4 w-64" />
          <div className="flex justify-center gap-4 pt-4">
            <Skeleton className="h-10 w-36" />
            <Skeleton className="h-10 w-28" />
          </div>
        </div>
      </section>

      {/* Products skeleton */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Skeleton className="h-8 w-48" />
        <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[3/4] w-full rounded-md" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
