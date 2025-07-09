"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Play, Pause, RotateCcw, BellOff } from "lucide-react";
import {
  subscribeUser,
  unsubscribeUser,
  sendNotification,
} from "@/actions/notifications";
import { Label } from "@/components/ui/label";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function Pomodoro() {
  const [time, setTime] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [workDuration, setWorkDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [isWorkSession, setIsWorkSession] = useState(true);
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isRunningRef = useRef(isRunning);
  const [sessionDuration, setSessionDuration] = useState(workDuration * 60);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const sendNotificationCallback = useCallback(
    async (message: string, onSuccess?: () => void) => {
      if (!subscription) return;
      try {
        const result = await sendNotification(message);
        if (result.error) {
          setError(result.error);
        } else if (onSuccess) {
          setError(null);
          onSuccess();
        }
      } catch (error) {
        setError("Notification error");
        console.error("Notification error:", error);
      }
    },
    [subscription]
  );

  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      registerServiceWorker();
    }

    // Initialize audio element
    audioRef.current = new Audio("/sounds/alarm.mp3");

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  async function registerServiceWorker() {
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      });
      const sub = await registration.pushManager.getSubscription();
      setSubscription(sub);
      if (sub) {
        const result = await subscribeUser(JSON.parse(JSON.stringify(sub)));
        if (result.error) {
          setError(result.error);
          setSubscription(null);
        }
      }
    } catch (error) {
      setError("Failed to register service worker");
      console.error("Service worker error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function subscribeToPush() {
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      });
      setSubscription(sub);
      const result = await subscribeUser(JSON.parse(JSON.stringify(sub)));
      if (result.error) {
        setError(result.error);
        setSubscription(null);
      } else {
        setError(null);
      }
    } catch (error) {
      setError("Failed to subscribe to notifications");
      console.error("Subscription error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function unsubscribeFromPush() {
    setIsLoading(true);
    try {
      if (subscription) {
        await subscription.unsubscribe();
        const result = await unsubscribeUser();
        if (result.error) {
          setError(result.error);
        } else {
          setSubscription(null);
          setError(null);
        }
      }
    } catch (error) {
      setError("Failed to unsubscribe");
      console.error("Unsubscription error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const switchSession = useCallback(
    (nextIsWorkSession: boolean) => {
      const nextDuration =
        (nextIsWorkSession ? workDuration : breakDuration) * 60;
      setIsWorkSession(nextIsWorkSession);
      setTime(nextDuration);
      setSessionDuration(nextDuration);
    },
    [workDuration, breakDuration]
  );

  const playAlarm = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play().catch((error) => {
        console.error("Audio playback error:", error);
      });
    }
  }, []);

  useEffect(() => {
    if (isRunning) {
      if (subscription) {
        sendNotificationCallback(
          isWorkSession ? "Work session started!" : "Break started!"
        );
      }
      timerRef.current = setInterval(() => {
        if (!isRunningRef.current) return;
        setTime((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            playAlarm();

            setTimeout(() => {
              if (subscription) {
                sendNotificationCallback(
                  isWorkSession ? "Work session complete!" : "Break complete!",
                  () => {
                    switchSession(!isWorkSession);
                  }
                );
              } else {
                switchSession(!isWorkSession);
              }
            }, 0);

            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, [
    isRunning,
    isWorkSession,
    workDuration,
    breakDuration,
    sendNotificationCallback,
    subscription,
    switchSession,
    playAlarm,
  ]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleStartPause = () => setIsRunning(!isRunning);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setIsWorkSession(true);
    const seconds = workDuration * 60;
    setTime(seconds);
    setSessionDuration(seconds);
    if (audioRef.current) audioRef.current.pause();
  }, [workDuration]);

  const handleWorkDurationChange = useCallback(
    ([value]: number[]) => {
      setWorkDuration(value);
      if (isWorkSession && !isRunning) {
        const seconds = value * 60;
        setTime(seconds);
        setSessionDuration(seconds);
      }
    },
    [isWorkSession, isRunning]
  );

  const handleBreakDurationChange = useCallback(
    ([value]: number[]) => {
      setBreakDuration(value);
      if (!isWorkSession && !isRunning) {
        const seconds = value * 60;
        setTime(seconds);
        setSessionDuration(seconds);
      }
    },
    [isWorkSession, isRunning]
  );

  const progress = ((sessionDuration - time) / sessionDuration) * 100;

  return (
    <Card className="w-full max-w-md mx-auto border-none shadow-none overflow-hidden">
      <CardHeader className="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            Pomodoro Timer
          </CardTitle>
          <div className="flex items-center space-x-2">
            {isSupported && (
              <Button
                onClick={subscription ? unsubscribeFromPush : subscribeToPush}
                variant="ghost"
                size="icon"
                className="rounded-full w-9 h-9 hover:bg-gray-100 dark:hover:bg-gray-800"
                disabled={isLoading}
              >
                {subscription ? (
                  <BellOff className="h-4 w-4 text-yellow-500" />
                ) : (
                  <Bell className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {error && (
          <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-red-600 dark:text-red-400 text-center text-sm">
              {error}
            </p>
          </div>
        )}

        {/* Timer with animated progress ring */}
        <div className="relative flex justify-center items-center">
          <div className="relative w-48 h-48">
            <svg className="w-full h-full" viewBox="0 0 160 160">
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="currentColor"
                strokeWidth="10"
                fill="transparent"
                className="text-gray-200 dark:text-gray-800"
              />
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="currentColor"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray="439.6"
                strokeDashoffset={(439.6 * (100 - progress)) / 100}
                strokeLinecap="round"
                className={`transition-all duration-1000 ease-[cubic-bezier(0.65,0,0.35,1)] ${
                  isRunning ? "text-blue-500" : "text-blue-400"
                }`}
                transform="rotate(-90 80 80)"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1">
              <span className="text-4xl font-bold tabular-nums text-gray-900 dark:text-white">
                {formatTime(time)}
              </span>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {isWorkSession ? "Focus Time" : "Break Time"}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-3">
          <Button
            onClick={handleStartPause}
            size="lg"
            className="rounded-full h-12 px-6 gap-2 shadow-sm hover:shadow-md transition-shadow"
            disabled={isLoading}
          >
            {isRunning ? (
              <>
                <Pause className="h-5 w-5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="h-5 w-5" />
                <span>Start</span>
              </>
            )}
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            size="lg"
            className="rounded-full h-12 px-6 gap-2"
            disabled={isLoading}
          >
            <RotateCcw className="h-5 w-5" />
            <span>Reset</span>
          </Button>
        </div>

        {/* Sliders */}
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="work-duration"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Work Duration
              </Label>
              <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                {workDuration} min
              </span>
            </div>
            <Slider
              id="work-duration"
              value={[workDuration]}
              onValueChange={handleWorkDurationChange}
              min={15}
              max={90}
              step={5}
              disabled={isRunning || isLoading}
              className={`h-2 rounded-full ${
                isRunning ? "cursor-not-allowed" : "cursor-pointer"
              }`}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="break-duration"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Break Duration
              </Label>
              <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                {breakDuration} min
              </span>
            </div>
            <Slider
              id="break-duration"
              value={[breakDuration]}
              onValueChange={handleBreakDurationChange}
              min={5}
              max={30}
              step={5}
              disabled={isRunning || isLoading}
              className={`h-2 rounded-full ${
                isRunning ? "cursor-not-allowed" : "cursor-pointer"
              }`}
            />
          </div>
        </div>

        {!isSupported && (
          <div className="px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <p className="text-yellow-600 dark:text-yellow-400 text-center text-sm">
              Push notifications not supported in your browser
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
