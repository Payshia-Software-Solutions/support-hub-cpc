
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from "@/lib/api";
import type { Announcement } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { PlusCircle, Edit, Trash2, Megaphone, Loader2, AlertTriangle, FileText } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const AnnouncementForm = ({
  announcement,
  onClose,
}: {
  announcement?: Announcement | null;
  onClose: () => void;
}) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [title, setTitle] = useState(announcement?.title || "");
  const [content, setContent] = useState(announcement?.content || "");
  const [imageUrl, setImageUrl] = useState(announcement?.imageUrl || "");

  const createMutation = useMutation({
    mutationFn: createAnnouncement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast({ title: "Success", description: "Announcement created." });
      onClose();
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Announcement>) => updateAnnouncement(announcement!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast({ title: "Success", description: "Announcement updated." });
      onClose();
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      toast({ variant: "destructive", title: "Error", description: "Title and content are required." });
      return;
    }

    const mutation = announcement ? updateMutation : createMutation;
    const data = {
      title,
      content,
      imageUrl,
      author: user?.name || "Admin",
      createdAt: announcement ? announcement.createdAt : new Date().toISOString(),
    };
    mutation.mutate(data);
  };
  
  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="content">Content</Label>
        <Textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} required rows={8} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="imageUrl">Image URL (Optional)</Label>
        <Input id="imageUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://placehold.co/800x400.png"/>
      </div>
       <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isLoading}>Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {announcement ? "Save Changes" : "Create Announcement"}
            </Button>
        </DialogFooter>
    </form>
  );
};

export default function AdminAnnouncementsPage() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  const { data: announcements, isLoading, isError, error } = useQuery<Announcement[]>({
    queryKey: ["announcements"],
    queryFn: getAnnouncements,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAnnouncement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast({ title: "Success", description: "Announcement deleted." });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const handleEdit = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setSelectedAnnouncement(null);
    setIsFormOpen(true);
  };
  
  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  }

  return (
    <div className="p-4 md:p-8 space-y-8 pb-20">
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedAnnouncement ? "Edit" : "Create"} Announcement</DialogTitle>
            <DialogDescription>
              {selectedAnnouncement ? "Modify the existing announcement." : "Compose a new announcement for all students."}
            </DialogDescription>
          </DialogHeader>
          <AnnouncementForm
            announcement={selectedAnnouncement}
            onClose={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-semibold">Manage Announcements</h1>
          <p className="text-muted-foreground">Create, edit, and publish announcements for all students.</p>
        </div>
        <Button onClick={handleCreate}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create New
        </Button>
      </header>

      <Card className="shadow-lg">
        <CardHeader>
            <CardTitle>Published Announcements</CardTitle>
        </CardHeader>
        <CardContent>
            {isLoading && (
                <div className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
            )}
            {isError && (
                 <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error Loading Announcements</AlertTitle>
                    <AlertDescription>{error.message}</AlertDescription>
                </Alert>
            )}
            {!isLoading && !isError && announcements && (
                <div className="space-y-4">
                    {announcements.length > 0 ? (
                        announcements.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(announcement => (
                             <Card key={announcement.id} className="bg-muted/50">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-lg">{announcement.title}</CardTitle>
                                            <CardDescription className="text-xs">
                                                By {announcement.author} on {format(new Date(announcement.createdAt), 'PPP')}
                                            </CardDescription>
                                        </div>
                                         <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(announcement)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the announcement.</AlertDialogDescription></AlertDialogHeader>
                                                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(announcement.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-foreground whitespace-pre-wrap">{announcement.content}</p>
                                    {announcement.imageUrl && (
                                        <div className="mt-4">
                                            <a href={announcement.imageUrl} target="_blank" rel="noopener noreferrer">
                                                 <img src={announcement.imageUrl} alt={announcement.title} className="max-h-64 rounded-lg object-cover" />
                                            </a>
                                        </div>
                                    )}
                                </CardContent>
                             </Card>
                        ))
                    ) : (
                        <div className="text-center py-10 text-muted-foreground flex flex-col items-center">
                            <FileText className="w-12 h-12 mb-4" />
                            <h3 className="text-lg font-semibold">No Announcements Yet</h3>
                            <p>Click "Create New" to publish the first announcement.</p>
                        </div>
                    )}
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
