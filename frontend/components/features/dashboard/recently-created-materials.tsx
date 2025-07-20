import { MaterialData } from "@/lib/definitions";
import React from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";
import { ArrowRight, Calendar, File } from "lucide-react";

function RecentlyCreatedMaterials({
  recentlyCreatedMaterials,
}: {
  recentlyCreatedMaterials: MaterialData[];
}) {
  return (
    <Card className="p-4 w-full">
      <CardHeader>
        <h2 className="text-base md:text-lg lg:text-xl font-semibold">
          Recently Created Materials
        </h2>
        <p className="text-sm text-muted-foreground">
          Here are the materials you have created recently. Click on any item to
          view or edit it.
        </p>
      </CardHeader>
      <CardContent>
        {recentlyCreatedMaterials && recentlyCreatedMaterials.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {recentlyCreatedMaterials.map((material) => (
              <li key={material.id}>
                <Link
                  href={`/dashboard/materials/${material.id}`}
                  className="group flex items-center gap-4 rounded-lg px-3 py-2 hover:bg-muted transition"
                >
                  <div className="flex flex-col items-center justify-center">
                    <File className="h-7 w-7 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate text-base group-hover:underline">
                        {material.title}
                      </span>
                    </div>
                    {material.description && (
                      <div className="text-xs text-muted-foreground line-clamp-1">
                        {material.description}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {new Date(material.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="relative mb-4">
              <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center">
                <File className="h-8 w-8 text-muted-foreground/60" />
              </div>
              <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs text-primary font-medium">+</span>
              </div>
            </div>
            <h3 className="font-medium text-foreground mb-2">
              No materials yet
            </h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              Start creating your first learning material to see it appear here.
            </p>
            <Link
              href="/dashboard/materials/upload"
              className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Upload your first material
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </CardContent>
      <CardFooter className="mt-auto">
        {recentlyCreatedMaterials && recentlyCreatedMaterials.length > 0 && (
          <Link
            href="/dashboard/materials"
            className="ml-auto text-sm text-muted-foreground hover:underline"
          >
            View all materials <ArrowRight className="inline h-4 w-4" />
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}

export default RecentlyCreatedMaterials;
