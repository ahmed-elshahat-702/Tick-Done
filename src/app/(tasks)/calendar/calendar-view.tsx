"use client";

import { TaskCard } from "@/components/tasks/task-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const { tasks } = useAppStore();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getTasksForDate = (date: Date) => {
    return tasks.filter(
      (task) => task.dueDate && isSameDay(new Date(task.dueDate), date)
    );
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === "next" ? 1 : -1));
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const selectedTasks = selectedDate ? getTasksForDate(selectedDate) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Calendar</h2>
        <Button onClick={goToToday} variant="outline">
          Today
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg">
                {format(currentDate, "MMMM yyyy")}
              </CardTitle>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateMonth("prev")}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateMonth("next")}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 mb-4">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day) => (
                    <div
                      key={day}
                      className="p-2 text-center text-sm font-medium text-muted-foreground"
                    >
                      {day}
                    </div>
                  )
                )}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {days.map((day) => {
                  const dayTasks = getTasksForDate(day);
                  const isSelected =
                    selectedDate && isSameDay(day, selectedDate);

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        "p-2 text-sm rounded-md hover:bg-accent transition-colors min-h-[60px] flex flex-col items-center justify-start",
                        !isSameMonth(day, currentDate) &&
                          "text-muted-foreground opacity-50",
                        isToday(day) && "bg-primary text-primary-foreground",
                        isSelected && "ring-2 ring-primary"
                      )}
                    >
                      <span className="font-medium">{format(day, "d")}</span>
                      {dayTasks.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {dayTasks.slice(0, 2).map((task, index) => (
                            <div
                              key={index}
                              className={cn(
                                "w-2 h-2 rounded-full",
                                task.priority === "high" && "bg-red-500",
                                task.priority === "medium" && "bg-yellow-500",
                                task.priority === "low" && "bg-green-500"
                              )}
                            />
                          ))}
                          {dayTasks.length > 2 && (
                            <span className="text-xs">
                              +{dayTasks.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {selectedDate
                  ? format(selectedDate, "MMMM d, yyyy")
                  : "Select a date"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedTasks.length > 0 ? (
                <div className="space-y-3">
                  {selectedTasks.map((task) => (
                    <TaskCard key={task._id} task={task} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {selectedDate
                    ? "No tasks for this date"
                    : "Click on a date to view tasks"}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
