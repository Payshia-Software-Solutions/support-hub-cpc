
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Save, Bell, Shield, Send } from "lucide-react";

export default function AdminSettingsPage() {
  const [siteName, setSiteName] = useState("Support Hub Admin");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [browserNotificationPermission, setBrowserNotificationPermission] = useState<NotificationPermission | "not_supported">("default");

  useEffect(() => {
    if (!("Notification" in window)) {
      setBrowserNotificationPermission("not_supported");
    } else {
      setBrowserNotificationPermission(Notification.permission);
    }
  }, []);

  const handleSaveChanges = () => {
    console.log("Settings saved:", { siteName, notificationsEnabled, maintenanceMode });
    toast({
      title: "Settings Saved",
      description: "Your changes have been successfully saved.",
    });
  };

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      toast({ variant: "destructive", title: "Error", description: "Browser notifications not supported." });
      setBrowserNotificationPermission("not_supported");
      return;
    }
    const permission = await Notification.requestPermission();
    setBrowserNotificationPermission(permission);
    if (permission === "granted") {
      toast({ title: "Success", description: "Browser notifications enabled!" });
    } else if (permission === "denied") {
      toast({ variant: "destructive", title: "Permission Denied", description: "Browser notifications were denied." });
    } else {
      toast({ title: "Permission Pending", description: "Notification permission request closed without a decision." });
    }
  };

  const sendTestNotification = () => {
    if (browserNotificationPermission !== "granted") {
      toast({ variant: "destructive", title: "Permission Required", description: "Please grant notification permission first."});
      return;
    }
    new Notification("Test Notification", {
      body: "This is a test browser notification from Support Hub Admin!",
      icon: "/icon.png", // You'll need an icon in your public folder
    });
     toast({ title: "Test Sent", description: "If permissions are correct, you should see a notification."});
  };


  return (
    <div className="p-4 md:p-8 space-y-8">
      <header>
        <h1 className="text-3xl font-headline font-semibold">Admin Settings</h1>
        <p className="text-muted-foreground">Configure system-wide settings for the admin panel.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 shadow-lg">
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>Basic configuration for the application.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="siteName">Site Name</Label>
              <Input
                id="siteName"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                placeholder="e.g., My Awesome App"
              />
              <p className="text-xs text-muted-foreground">
                This name will be displayed in the admin panel header.
              </p>
            </div>
            
            <div className="flex items-center justify-between space-y-2 border-t pt-6">
              <div>
                <Label htmlFor="notificationsEnabled" className="font-medium flex items-center">
                  <Bell className="mr-2 h-4 w-4"/>
                  Enable Email Notifications
                </Label>
                <p className="text-xs text-muted-foreground">
                  Toggle system-wide email notifications for new tickets or critical alerts. (Backend required)
                </p>
              </div>
              <Switch
                id="notificationsEnabled"
                checked={notificationsEnabled}
                onCheckedChange={setNotificationsEnabled}
              />
            </div>

            <div className="flex items-center justify-between space-y-2 border-t pt-6">
               <div>
                <Label htmlFor="maintenanceMode" className="font-medium flex items-center">
                  <Shield className="mr-2 h-4 w-4"/>
                  Maintenance Mode
                </Label>
                <p className="text-xs text-muted-foreground">
                  Put the student-facing portal into maintenance mode.
                </p>
              </div>
              <Switch
                id="maintenanceMode"
                checked={maintenanceMode}
                onCheckedChange={setMaintenanceMode}
              />
            </div>

            <div className="border-t pt-6 space-y-4">
              <Label className="font-medium flex items-center">
                <Bell className="mr-2 h-4 w-4" />
                Browser Notifications
              </Label>
              <p className="text-xs text-muted-foreground">
                Receive notifications directly in your browser for important events.
                Current status: <span className="font-semibold">{browserNotificationPermission}</span>
              </p>
              {browserNotificationPermission === "default" && (
                <Button onClick={requestNotificationPermission} variant="outline">
                  Request Permission
                </Button>
              )}
              {browserNotificationPermission === "denied" && (
                <p className="text-xs text-destructive">
                  Notifications are blocked. You may need to change this in your browser settings.
                </p>
              )}
              {browserNotificationPermission === "granted" && (
                 <Button onClick={sendTestNotification} variant="secondary">
                  <Send className="mr-2 h-4 w-4" /> Send Test Notification
                </Button>
              )}
               {browserNotificationPermission === "not_supported" && (
                <p className="text-xs text-destructive">
                  Your browser does not support notifications.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
                <CardDescription>More complex configurations.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                    Placeholder for advanced settings like API integrations, security configurations, etc.
                </p>
                <Button variant="outline" className="w-full">Configure API Keys</Button>
                <Button variant="outline" className="w-full">Security Policies</Button>
            </CardContent>
        </Card>

      </div>
       <div className="flex justify-end pt-4">
          <Button onClick={handleSaveChanges}>
            <Save className="mr-2 h-4 w-4" /> Save Changes
          </Button>
        </div>
    </div>
  );
}
