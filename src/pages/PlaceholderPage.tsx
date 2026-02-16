import React from "react";
import { useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction } from "lucide-react";

const PlaceholderPage: React.FC<{ title?: string }> = ({ title }) => {
  const location = useLocation();
  const pageTitle = title ?? location.pathname.split("/").filter(Boolean).pop()?.replace(/-/g, " ") ?? "Página";

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="flex justify-center mb-2">
            <Construction className="h-10 w-10 text-accent" />
          </div>
          <CardTitle className="capitalize">{pageTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Esta sección se encuentra en desarrollo.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlaceholderPage;
