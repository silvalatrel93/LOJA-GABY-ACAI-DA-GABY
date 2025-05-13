import { Skeleton } from "@/components/ui/skeleton"

export default function StoreEditLoading() {
  return (
    <div className="container mx-auto p-4">
      <Skeleton className="h-10 w-1/3 mb-6" />

      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-2/3" />
      </div>

      <div className="mt-6 space-x-4">
        <Skeleton className="h-10 w-24 inline-block" />
        <Skeleton className="h-10 w-24 inline-block" />
      </div>
    </div>
  )
}
