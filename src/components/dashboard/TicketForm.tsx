
"use client";

import { useState, useRef, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { TicketCategory, Attachment as ApiAttachment } from "@/lib/types";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Book, CreditCard, Gamepad2, Truck, MoreHorizontal, ArrowLeft, Video, ClipboardList, ClipboardCheck, Award, Paperclip, FileText, XCircle, Loader2, GraduationCap, UserPlus } from "lucide-react";
import Image from "next/image";
import { Progress } from "@/components/ui/progress";

// Local attachment type with a unique ID for state management
interface Attachment extends ApiAttachment {
  id: string; 
}


const ticketFormSchema = z.object({
  category: z.enum(["Course", "Payment", "Games", "Delivery Packs", "Recordings", "Assignments", "Quiz", "Exam", "Other", "Convocation", "Registration"], {
    required_error: "You need to select a ticket category.",
  }),
  description: z.string().min(1, "Description cannot be empty.").max(1000, "Description must be at most 1000 characters."),
});

type TicketFormValues = Omit<z.infer<typeof ticketFormSchema>, 'subject'>;

interface TicketFormProps {
  onSubmitTicket: (data: Omit<TicketFormValues & { subject: string }, "priority">, attachments?: ApiAttachment[]) => void;
  isSubmitting: boolean;
}

const categoryOptions: { name: TicketCategory; icon: React.ElementType }[] = [
    { name: "Course", icon: Book },
    { name: "Payment", icon: CreditCard },
    { name: "Games", icon: Gamepad2 },
    { name: "Delivery Packs", icon: Truck },
    { name: "Recordings", icon: Video },
    { name: "Assignments", icon: ClipboardList },
    { name: "Quiz", icon: ClipboardCheck },
    { name: "Exam", icon: Award },
    { name: "Convocation", icon: GraduationCap },
    { name: "Registration", icon: UserPlus },
    { name: "Other", icon: MoreHorizontal },
];

export function TicketForm({ onSubmitTicket, isSubmitting }: TicketFormProps) {
  const [selectedCategory, setSelectedCategory] = useState<TicketCategory | null>(null);
  const [stagedAttachments, setStagedAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState(0);

  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      description: "",
    },
  });

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSubmitting) {
      setProgress(0);
      // Simulate progress for a better user experience
      timer = setInterval(() => {
        setProgress(oldProgress => {
          if (oldProgress >= 95) {
            return oldProgress;
          }
          return Math.min(oldProgress + 10, 95);
        });
      }, 500);
    } else {
      setProgress(0);
    }
    return () => {
      clearInterval(timer);
    };
  }, [isSubmitting]);

  // Disable form when submitting
  useEffect(() => {
      if (isSubmitting) {
          form.control.disabled = true;
      } else {
          form.control.disabled = false;
      }
  }, [isSubmitting, form.control]);


  function onSubmit(data: TicketFormValues) {
    const apiAttachments: ApiAttachment[] = stagedAttachments.map(({ id, ...rest }) => rest);
    const subject = `${data.category} Issue`;
    const submissionData = { ...data, subject };
    onSubmitTicket(submissionData, apiAttachments);
    form.reset();
    setStagedAttachments([]);
    setSelectedCategory(null);
  }

  const handleCategorySelect = (category: TicketCategory) => {
    setSelectedCategory(category);
    form.setValue("category", category);
  };
  
  const handleGoBack = () => {
    setSelectedCategory(null);
    setStagedAttachments([]);
    form.reset();
  }

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach((file, index) => {
        if (file.size > 5 * 1024 * 1024) { // 5MB limit per file
          toast({
            variant: "destructive",
            title: "File too large",
            description: `"${file.name}" is larger than 5MB and was not added.`,
          });
          return;
        }

        const fileType = file.type.startsWith("image/") ? "image" : "document";
        const reader = new FileReader();
        reader.onloadend = () => {
            const newAttachment: Attachment = {
                id: `${Date.now()}-${index}-${Math.random()}`,
                type: fileType,
                url: reader.result as string,
                name: file.name,
                file: file,
            };
            setStagedAttachments(prev => [...prev, newAttachment]);
        };
        reader.readAsDataURL(file);
      });

      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeStagedAttachment = (attachmentId: string) => {
    setStagedAttachments(prev => prev.filter(att => att.id !== attachmentId));
  };

  return (
    <Card className="w-full border-0 md:border-y-0 rounded-none bg-transparent mb-16 relative overflow-hidden">
        {isSubmitting && <Progress value={progress} className="absolute top-0 left-0 w-full h-1 rounded-none" />}
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardHeader className="p-6">
                    {!selectedCategory ? (
                        <>
                            <CardTitle className="text-2xl font-headline">Create New Support Ticket</CardTitle>
                            <CardDescription>Step 1: Choose a category for your issue.</CardDescription>
                        </>
                    ) : (
                         <>
                            <Button variant="ghost" onClick={handleGoBack} className="w-fit h-auto mb-2 pl-1 text-sm text-muted-foreground hover:text-foreground" disabled={isSubmitting}>
                                <ArrowLeft className="mr-2 h-4 w-4" /> Change Category
                            </Button>
                            <CardTitle className="text-2xl font-headline">Describe Your Issue</CardTitle>
                            <CardDescription>Step 2: Provide details about your '{selectedCategory}' issue.</CardDescription>
                         </>
                    )}
                </CardHeader>
                <CardContent className="px-6">
                    {!selectedCategory ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {categoryOptions.map((cat) => (
                                <Card
                                    key={cat.name}
                                    className="shadow-lg hover:shadow-xl transition-all duration-200 h-full border-0 cursor-pointer group"
                                    onClick={() => handleCategorySelect(cat.name)}
                                >
                                    <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
                                        <div className="p-3 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500">
                                          <cat.icon className="w-8 h-8 text-white" />
                                        </div>
                                        <span className="text-sm font-semibold text-card-foreground group-hover:text-primary transition-colors">{cat.name}</span>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                    <Textarea
                                        placeholder="Please describe your issue in detail..."
                                        className="min-h-[150px]"
                                        {...field}
                                        disabled={isSubmitting}
                                    />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <div>
                              <FormLabel>Attachments (Optional)</FormLabel>
                               <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" multiple disabled={isSubmitting}/>
                               
                               <div className="mt-2 space-y-2">
                                  {stagedAttachments.map(att => (
                                    <div key={att.id} className="p-2 border rounded-md flex items-center justify-between bg-muted/50">
                                      <div className="flex items-center gap-2 truncate">
                                        {att.type === 'image' ? (
                                          <Image src={att.url} alt={att.name} width={32} height={32} className="rounded object-cover" data-ai-hint="image preview"/>
                                        ) : (
                                          <FileText className="h-5 w-5 text-muted-foreground" />
                                        )}
                                        <span className="text-sm text-muted-foreground truncate">{att.name}</span>
                                      </div>
                                      <Button type="button" variant="ghost" size="icon" onClick={() => removeStagedAttachment(att.id)} className="text-destructive hover:text-destructive h-6 w-6" disabled={isSubmitting}>
                                        <XCircle className="h-5 w-5" />
                                      </Button>
                                    </div>
                                  ))}
                                  <Button type="button" variant="outline" onClick={handleAttachmentClick} className="w-full" disabled={isSubmitting}>
                                      <Paperclip className="mr-2 h-4 w-4" /> Add attachment(s)
                                  </Button>
                               </div>
                            </div>
                        </div>
                    )}
                </CardContent>
                {selectedCategory && (
                     <CardFooter className="px-6">
                        <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {isSubmitting ? "Submitting..." : "Submit Ticket"}
                        </Button>
                    </CardFooter>
                )}
            </form>
        </Form>
    </Card>
  );
}
