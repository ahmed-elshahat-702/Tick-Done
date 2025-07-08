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

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const progress =
    ((durationMinutes * 60 - totalSeconds) / (durationMinutes * 60)) * 100;

  useEffect(() => {
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
      if (Notification.permission === "default") {
        Notification.requestPermission()
          .then((permission) => {
            setNotificationPermission(permission);
          })
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
      new Notification("Pomodoro Timer", {
        body: "Your Pomodoro session has ended!",
        icon: "/logo.svg",
      });
      toast.success("Your Pomodoro session has ended!");
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
    } else {
      console.error("Audio element is not available");
    }
  }, []);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTotalSeconds((prev) => {
          if (prev <= 0) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            playAlarm();
            sendNotification();
            return 0; // Stop at 0, don't reset
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, playAlarm, sendNotification, durationMinutes]); // Ensure consistent dependencies

  const handleStartPause = () => {
    if (totalSeconds > 0 || !isRunning) {
      setIsRunning((prev) => !prev);
      if (totalSeconds === 0) {
        setTotalSeconds(durationMinutes * 60); // Restart with selected duration
      }
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setTotalSeconds(durationMinutes * 60);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleSliderChange = (value: number[]) => {
    const minutes = value[0];
    setDurationMinutes(minutes);
    setTotalSeconds(minutes * 60);
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  return (
    <div className="min-h-screen flex md:items-center justify-center">
      <Card className="w-full max-w-md border-none shadow-none">
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
                className="stroke-current text-red-500"
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
            min={5}
            max={60}
            value={[durationMinutes]}
            step={5}
            onValueChange={handleSliderChange}
            disabled={isRunning}
            className="w-3/4"
          />
          <div className="flex gap-4">
            <Button
              variant={isRunning ? "destructive" : "default"}
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
