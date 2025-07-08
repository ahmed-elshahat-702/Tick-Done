"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const PomodoroView = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | "default"
  >("default");
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [totalSeconds, setTotalSeconds] = useState(durationMinutes * 60);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const progress =
    ((durationMinutes * 60 - totalSeconds) / (durationMinutes * 60)) * 100;

  // ✅ Notifications setup
  useEffect(() => {
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
      if (Notification.permission === "default") {
        Notification.requestPermission()
          .then(setNotificationPermission)
          .catch((error) => {
            console.error("Error requesting notification permission:", error);
          });
      }
    } else {
      console.warn("Notifications not supported in this browser");
    }
  }, []);

  const sendNotification = useCallback(() => {
    if (notificationPermission === "granted" && "Notification" in window) {
      const isPWA =
        window.matchMedia("(display-mode: standalone)").matches ||
        ("standalone" in window.navigator && window.navigator.standalone);

      if (isPWA && "serviceWorker" in navigator) {
        navigator.serviceWorker.ready
          .then((registration) => {
            registration.showNotification("Pomodoro Timer", {
              body: "Your Pomodoro session has ended!",
              icon: "/logo.svg",
              badge: "/logo.svg",
            });
          })
          .catch((error) => {
            console.error("ServiceWorker notification error:", error);
            toast.error("Failed to send notification.");
          });
      } else {
        try {
          new Notification("Pomodoro Timer", {
            body: "Your Pomodoro session has ended!",
            icon: "/logo.svg",
          });
          toast.success("Your Pomodoro session has ended!");
        } catch (error) {
          console.error("Notification error:", error);
          toast.error(
            `Notification not sent. Permission: ${notificationPermission}`
          );
        }
      }
    } else {
      toast.error(
        `Notification not sent. Permission: ${notificationPermission}`
      );
    }
  }, [notificationPermission]);

  const playAlarm = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play().catch((error) => {
        console.error("Error playing alarm:", error.message);
      });
    }
  }, []);

  // ✅ Timer tick logic using Date.now()
  useEffect(() => {
    if (!isRunning) return;

    const tick = () => {
      if (!startTimeRef.current) return;

      const now = Date.now();
      const elapsed = Math.floor((now - startTimeRef.current) / 1000);
      const remaining = durationMinutes * 60 - elapsed;

      if (remaining <= 0) {
        setIsRunning(false);
        setTotalSeconds(0);
        playAlarm();
        sendNotification();
        return;
      } else {
        setTotalSeconds(remaining);
        timeoutRef.current = setTimeout(tick, 1000);
      }
    };

    timeoutRef.current = setTimeout(tick, 1000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isRunning, durationMinutes, playAlarm, sendNotification]);

  const handleStartPause = () => {
    if (!isRunning) {
      if (totalSeconds === 0) {
        setTotalSeconds(durationMinutes * 60);
      }
      startTimeRef.current =
        Date.now() - (durationMinutes * 60 - totalSeconds) * 1000;
      setIsRunning(true);
    } else {
      setIsRunning(false);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    startTimeRef.current = null;
    setTotalSeconds(durationMinutes * 60);
  };

  const handleSliderChange = (value: number[]) => {
    const minutes = value[0];
    setDurationMinutes(minutes);
    setTotalSeconds(minutes * 60);
    setIsRunning(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    startTimeRef.current = null;
  };

  return (
    <div className="flex md:items-center justify-center">
      <Card className="w-full max-w-md border-none shadow-none bg-background">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Pomodoro Timer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 flex flex-col items-center">
          <div className="relative w-64 h-64">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle
                className="stroke-current text-gray-200"
                strokeWidth="8"
                cx="50"
                cy="50"
                r="45"
                fill="transparent"
              />
              <circle
                className="stroke-current text-blue-500"
                strokeWidth="8"
                strokeLinecap="round"
                cx="50"
                cy="50"
                r="45"
                fill="transparent"
                strokeDasharray="283"
                strokeDashoffset={283 - (progress / 100) * 283}
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
              <div className="text-5xl font-mono">
                {String(minutes).padStart(2, "0")}:
                {String(seconds).padStart(2, "0")}
              </div>
            </div>
          </div>
          <Slider
            min={1 / 6}
            max={60}
            value={[durationMinutes]}
            step={5}
            onValueChange={handleSliderChange}
            disabled={isRunning}
            className="w-3/4"
          />
          <div className="flex gap-4">
            <Button
              className="bg-blue-500 text-white"
              onClick={handleStartPause}
            >
              {isRunning ? "Pause" : totalSeconds === 0 ? "Restart" : "Start"}
            </Button>
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
          </div>
          {notificationPermission !== "granted" && (
            <p className="text-sm text-muted-foreground">
              Enable notifications for alerts when the timer ends.
            </p>
          )}
        </CardContent>
        <audio ref={audioRef} src="/sounds/alarm.mp3" />
      </Card>
    </div>
  );
};

export default PomodoroView;
