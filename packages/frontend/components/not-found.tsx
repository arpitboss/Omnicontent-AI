import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-neutral-50 dark:bg-black p-6">
      <div className="w-full max-w-md border border-dashed border-neutral-300 dark:border-neutral-800 bg-white dark:bg-black p-12 relative">
        {/* Corner Markers */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-black dark:border-white" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-black dark:border-white" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-black dark:border-white" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-black dark:border-white" />

        <div className="text-center space-y-6">
          <div className="w-16 h-16 mx-auto bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-500" />
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tighter">404</h1>
            <p className="font-mono text-sm uppercase tracking-widest text-neutral-500">
              System Error: Resource Not Found
            </p>
          </div>

          <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">
            The requested data stream could not be located. It may have been moved, deleted, or never existed in this timeline.
          </p>

          <div className="pt-6">
            <Link href="/dashboard">
              <Button className="w-full rounded-none bg-black text-white dark:bg-white dark:text-black font-bold uppercase tracking-widest hover:opacity-90">
                <ArrowLeft className="mr-2 h-4 w-4" /> Return to Base
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
