import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md border border-border bg-card rounded-2xl p-12 relative shadow-lg">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 mx-auto bg-destructive/10 border border-destructive/20 rounded-2xl flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tighter">404</h1>
            <p className="font-mono text-sm text-muted-foreground">
              Page Not Found
            </p>
          </div>

          <p className="text-muted-foreground text-sm leading-relaxed">
            The requested page could not be located. It may have been moved or deleted.
          </p>

          <div className="pt-6">
            <Link href="/dashboard">
              <Button className="w-full rounded-xl bg-foreground text-background font-medium tracking-tight hover:opacity-90">
                <ArrowLeft className="mr-2 h-4 w-4" /> Return to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
