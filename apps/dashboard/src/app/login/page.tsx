import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Telemax AI Factory — login placeholder</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            type="email"
            placeholder="you@telemax.it"
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          />
          <input
            type="password"
            placeholder="••••••••"
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          />
          <Button className="w-full">Continue</Button>
          <p className="text-center text-xs text-muted-foreground">
            Authentication is a placeholder and will be implemented later.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
