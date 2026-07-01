"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";

import type { LeadSource, LeadStatus } from "@/types/database";
import { updateLeadStatus } from "@/app/(dashboard)/leads/actions";
import { LEAD_SOURCE_LABELS, LEAD_STATUSES } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type LeadCard = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  source: LeadSource | null;
  status: LeadStatus;
  interested_in: string[] | null;
  created_at: string | null;
};

function ageInDays(created_at: string | null): number | null {
  if (!created_at) return null;
  const d = new Date(created_at);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  return Math.max(
    0,
    Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
  );
}

function ageLabel(created_at: string | null): string {
  const days = ageInDays(created_at);
  if (days === null) return "";
  if (days === 0) return "today";
  if (days === 1) return "1 day old";
  return `${days} days old`;
}

export function LeadsBoard({ leads }: { leads: LeadCard[] }) {
  const router = useRouter();
  // Local mirror so drag-and-drop feels instant; the server action persists.
  const [columns, setColumns] = React.useState<Record<LeadStatus, LeadCard[]>>(
    () => groupByStatus(leads)
  );

  React.useEffect(() => {
    setColumns(groupByStatus(leads));
  }, [leads]);

  function onDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const from = source.droppableId as LeadStatus;
    const to = destination.droppableId as LeadStatus;

    // Optimistic move.
    setColumns((prev) => {
      const next: Record<LeadStatus, LeadCard[]> = {
        new: [...prev.new],
        contacted: [...prev.contacted],
        quoted: [...prev.quoted],
        won: [...prev.won],
        lost: [...prev.lost],
      };
      const [moved] = next[from].splice(source.index, 1);
      if (!moved) return prev;
      const updated = { ...moved, status: to };
      next[to].splice(destination.index, 0, updated);
      return next;
    });

    if (from !== to) {
      void updateLeadStatus(draggableId, to).then((res) => {
        if (res.error) {
          // Roll back to server truth on failure.
          setColumns(groupByStatus(leads));
        } else {
          router.refresh();
        }
      });
    }
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {LEAD_STATUSES.map((col) => {
          const items = columns[col.value];
          return (
            <Droppable droppableId={col.value} key={col.value}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    "flex min-h-[200px] flex-col rounded-lg border bg-muted/40 p-2",
                    snapshot.isDraggingOver && "bg-muted ring-2 ring-primary/30"
                  )}
                >
                  <div className="flex items-center justify-between px-1 pb-2">
                    <span className="text-sm font-medium">{col.label}</span>
                    <Badge variant="secondary">{items.length}</Badge>
                  </div>

                  <div className="flex flex-1 flex-col gap-2">
                    {items.map((lead, index) => (
                      <Draggable
                        draggableId={lead.id}
                        index={index}
                        key={lead.id}
                      >
                        {(dragProvided, dragSnapshot) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            {...dragProvided.dragHandleProps}
                            style={
                              dragProvided.draggableProps
                                .style as React.CSSProperties
                            }
                            className={cn(
                              "rounded-md border bg-card p-3 shadow-sm transition-shadow",
                              dragSnapshot.isDragging && "shadow-md ring-1 ring-primary/40"
                            )}
                          >
                            <Link
                              href={`/leads/${lead.id}`}
                              className="block"
                              onClick={(e) => {
                                // Don't navigate when finishing a drag.
                                if (dragSnapshot.isDragging) e.preventDefault();
                              }}
                            >
                              <p className="text-sm font-medium leading-tight hover:underline">
                                {lead.full_name}
                              </p>
                            </Link>
                            {lead.interested_in &&
                              lead.interested_in.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {lead.interested_in.map((t) => (
                                    <Badge
                                      key={t}
                                      variant="outline"
                                      className="text-[10px]"
                                    >
                                      {t}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                              <span>
                                {lead.source
                                  ? LEAD_SOURCE_LABELS[lead.source]
                                  : "—"}
                              </span>
                              <span>{ageLabel(lead.created_at)}</span>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {items.length === 0 && (
                      <p className="px-1 py-6 text-center text-xs text-muted-foreground">
                        No leads
                      </p>
                    )}
                  </div>
                </div>
              )}
            </Droppable>
          );
        })}
      </div>
    </DragDropContext>
  );
}

function groupByStatus(leads: LeadCard[]): Record<LeadStatus, LeadCard[]> {
  const cols: Record<LeadStatus, LeadCard[]> = {
    new: [],
    contacted: [],
    quoted: [],
    won: [],
    lost: [],
  };
  for (const lead of leads) {
    const status = (lead.status ?? "new") as LeadStatus;
    (cols[status] ?? cols.new).push(lead);
  }
  return cols;
}
