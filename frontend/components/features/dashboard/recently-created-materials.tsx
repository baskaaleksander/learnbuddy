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
  if (!recentlyCreatedMaterials || recentlyCreatedMaterials.length === 0) {
    return null;
  }

  return (
    <Card className="p-4 w-full">
      <CardHeader>
        <h2 className="text-base md:text-lg lg:text-xl font-semibold">
          Recently Created Materials
        </h2>
      </CardHeader>
      <CardContent>
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
      </CardContent>
      <CardFooter className="mt-auto">
        <Link
          href="/dashboard/materials"
          className="ml-auto text-sm text-muted-foreground hover:underline"
        >
          View all materials <ArrowRight className="inline h-4 w-4" />
        </Link>
      </CardFooter>
    </Card>
  );
}

export default RecentlyCreatedMaterials;
