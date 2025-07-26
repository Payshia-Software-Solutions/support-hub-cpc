
"use client";

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { PlusCircle, Trash2, Printer, Mail, Phone, Linkedin, MapPin, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const experienceSchema = z.object({
  title: z.string().min(1, "Job title is required"),
  company: z.string().min(1, "Company name is required"),
  location: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  description: z.string().min(1, "Description is required"),
});

const educationSchema = z.object({
  degree: z.string().min(1, "Degree is required"),
  school: z.string().min(1, "School name is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
});

const cvSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  address: z.string().optional(),
  linkedin: z.string().optional(),
  summary: z.string().min(10, "Summary must be at least 10 characters"),
  experience: z.array(experienceSchema),
  education: z.array(educationSchema),
  skills: z.string().min(1, "At least one skill is required"),
});

type CvFormValues = z.infer<typeof cvSchema>;

export default function RequestCvPage() {
  const { user } = useAuth();
  const [isAiLoading, setIsAiLoading] = useState(false);

  const form = useForm<CvFormValues>({
    resolver: zodResolver(cvSchema),
    defaultValues: {
      fullName: user?.name || '',
      email: user?.email || '',
      phone: '',
      address: '',
      linkedin: '',
      summary: '',
      experience: [{ title: '', company: '', location: '', startDate: '', endDate: '', description: '' }],
      education: [{ degree: '', school: '', startDate: '', endDate: '' }],
      skills: '',
    },
  });

  const { fields: expFields, append: appendExp, remove: removeExp } = useFieldArray({
    control: form.control,
    name: "experience",
  });

  const { fields: eduFields, append: appendEdu, remove: removeEdu } = useFieldArray({
    control: form.control,
    name: "education",
  });

  const watchedValues = form.watch();

  const handlePrint = () => {
    window.print();
  };

  const generateAiSummary = () => {
    const experienceText = watchedValues.experience.map(e => `${e.title} at ${e.company}: ${e.description}`).join('\n');
    const skillsText = watchedValues.skills;
    
    if (!experienceText || !skillsText) {
        toast({ variant: 'destructive', title: 'Not enough information', description: 'Please fill in your recent experience and skills to generate a summary.' });
        return;
    }
    
    // This is where you would call your Genkit flow
    setIsAiLoading(true);
    setTimeout(() => {
        const aiGeneratedSummary = `Highly motivated and skilled professional with experience in ${watchedValues.experience[0]?.title || 'various roles'}. Proficient in ${skillsText.split(',').slice(0, 2).join(' and ')}. Eager to contribute to a dynamic team and leverage expertise to achieve company goals.`;
        form.setValue('summary', aiGeneratedSummary);
        setIsAiLoading(false);
        toast({ title: 'AI Summary Generated!', description: 'Your professional summary has been created.' });
    }, 1500);
  };
  
  const skillList = watchedValues.skills?.split(',').map(s => s.trim()).filter(Boolean) || [];

  return (
    <>
    <style jsx global>{`
        @media print {
            body * {
                visibility: hidden;
            }
            .cv-preview-area, .cv-preview-area * {
                visibility: visible;
            }
            .cv-preview-area {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                margin: 0;
                padding: 0.5in;
                box-shadow: none;
                border: none;
            }
            @page {
                size: A4;
                margin: 0;
            }
        }
    `}</style>
    <div className="p-4 md:p-8 space-y-8 pb-20 print:p-0">
      <header className="print:hidden">
        <h1 className="text-3xl font-headline font-semibold">CV Generator</h1>
        <p className="text-muted-foreground">Create and preview your professional CV in real-time.</p>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start print:grid-cols-1">
        <Card className="shadow-lg print:hidden">
            <CardHeader>
                <CardTitle>Enter Your Details</CardTitle>
            </CardHeader>
            <CardContent>
                <form className="space-y-6">
                    {/* --- Personal Details --- */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg border-b pb-2">Personal Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><Label>Full Name</Label><Input {...form.register('fullName')} /></div>
                            <div><Label>Email</Label><Input {...form.register('email')} type="email" /></div>
                            <div><Label>Phone</Label><Input {...form.register('phone')} /></div>
                            <div><Label>Address</Label><Input {...form.register('address')} placeholder="e.g. Colombo, Sri Lanka"/></div>
                        </div>
                        <div><Label>LinkedIn Profile URL</Label><Input {...form.register('linkedin')} /></div>
                    </div>

                    {/* --- Professional Summary --- */}
                     <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-lg border-b pb-2">Professional Summary</h3>
                            <Button type="button" size="sm" variant="outline" onClick={generateAiSummary} disabled={isAiLoading}>
                                <Sparkles className="mr-2 h-4 w-4" /> {isAiLoading ? 'Generating...' : 'AI Generate'}
                            </Button>
                        </div>
                        <Textarea {...form.register('summary')} rows={4} placeholder="A brief summary of your career..."/>
                    </div>

                    {/* --- Work Experience --- */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg border-b pb-2">Work Experience</h3>
                        {expFields.map((field, index) => (
                            <div key={field.id} className="p-4 border rounded-md space-y-3 relative">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div><Label>Job Title</Label><Input {...form.register(`experience.${index}.title`)} /></div>
                                    <div><Label>Company</Label><Input {...form.register(`experience.${index}.company`)} /></div>
                                    <div><Label>Start Date</Label><Input {...form.register(`experience.${index}.startDate`)} placeholder="e.g. Jan 2020"/></div>
                                    <div><Label>End Date</Label><Input {...form.register(`experience.${index}.endDate`)} placeholder="e.g. Present"/></div>
                                </div>
                                <div><Label>Description</Label><Textarea {...form.register(`experience.${index}.description`)} placeholder="Your responsibilities and achievements..."/></div>
                                <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => removeExp(index)}><Trash2 className="h-4 w-4"/></Button>
                            </div>
                        ))}
                        <Button type="button" variant="outline" onClick={() => appendExp({ title: '', company: '', location: '', startDate: '', endDate: '', description: '' })}><PlusCircle className="mr-2 h-4 w-4"/> Add Experience</Button>
                    </div>

                    {/* --- Education --- */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg border-b pb-2">Education</h3>
                        {eduFields.map((field, index) => (
                             <div key={field.id} className="p-4 border rounded-md space-y-3 relative">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div><Label>Degree/Certificate</Label><Input {...form.register(`education.${index}.degree`)} /></div>
                                    <div><Label>School/University</Label><Input {...form.register(`education.${index}.school`)} /></div>
                                     <div><Label>Start Date</Label><Input {...form.register(`education.${index}.startDate`)} placeholder="e.g. Jan 2018"/></div>
                                    <div><Label>End Date</Label><Input {...form.register(`education.${index}.endDate`)} placeholder="e.g. Dec 2021"/></div>
                                </div>
                                <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => removeEdu(index)}><Trash2 className="h-4 w-4"/></Button>
                            </div>
                        ))}
                        <Button type="button" variant="outline" onClick={() => appendEdu({ degree: '', school: '', startDate: '', endDate: '' })}><PlusCircle className="mr-2 h-4 w-4"/> Add Education</Button>
                    </div>
                    
                    {/* --- Skills --- */}
                    <div className="space-y-2">
                        <h3 className="font-semibold text-lg border-b pb-2">Skills</h3>
                        <Textarea {...form.register('skills')} placeholder="Enter skills, separated by commas..."/>
                    </div>
                </form>
            </CardContent>
        </Card>

        <div className="sticky top-24">
            <div className="flex justify-end mb-4 print:hidden">
                <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4"/> Print / Save as PDF</Button>
            </div>
             <Card className="shadow-2xl cv-preview-area">
                <CardContent className="p-8 font-serif bg-white text-black">
                    <header className="text-center border-b-2 border-gray-700 pb-4">
                        <h1 className="text-4xl font-bold tracking-wider">{watchedValues.fullName}</h1>
                        <div className="flex justify-center items-center gap-x-4 gap-y-1 mt-2 text-xs flex-wrap">
                            <a href={`mailto:${watchedValues.email}`} className="flex items-center gap-1.5 hover:underline"><Mail className="h-3 w-3"/>{watchedValues.email}</a>
                            <a href={`tel:${watchedValues.phone}`} className="flex items-center gap-1.5 hover:underline"><Phone className="h-3 w-3"/>{watchedValues.phone}</a>
                           {watchedValues.address && <p className="flex items-center gap-1.5"><MapPin className="h-3 w-3"/>{watchedValues.address}</p>}
                           {watchedValues.linkedin && <a href={watchedValues.linkedin} className="flex items-center gap-1.5 hover:underline"><Linkedin className="h-3 w-3"/>{watchedValues.linkedin.replace('https://','').replace('www.','')}</a>}
                        </div>
                    </header>
                    
                    <section className="mt-6">
                        <h2 className="text-lg font-bold uppercase tracking-widest border-b border-gray-400 pb-1">Summary</h2>
                        <p className="text-sm mt-2">{watchedValues.summary}</p>
                    </section>

                    <section className="mt-6">
                        <h2 className="text-lg font-bold uppercase tracking-widest border-b border-gray-400 pb-1">Experience</h2>
                        <div className="space-y-4 mt-2">
                            {watchedValues.experience.map((exp, i) => (
                                <div key={i}>
                                    <div className="flex justify-between items-baseline">
                                        <h3 className="text-md font-semibold">{exp.title}</h3>
                                        <p className="text-xs font-mono">{exp.startDate} - {exp.endDate}</p>
                                    </div>
                                    <p className="text-sm italic">{exp.company}</p>
                                    <p className="text-sm mt-1 whitespace-pre-line">{exp.description}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                    
                    <section className="mt-6">
                        <h2 className="text-lg font-bold uppercase tracking-widest border-b border-gray-400 pb-1">Education</h2>
                         <div className="space-y-4 mt-2">
                            {watchedValues.education.map((edu, i) => (
                                <div key={i}>
                                    <div className="flex justify-between items-baseline">
                                        <h3 className="text-md font-semibold">{edu.degree}</h3>
                                         <p className="text-xs font-mono">{edu.startDate} - {edu.endDate}</p>
                                    </div>
                                    <p className="text-sm italic">{edu.school}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                    
                     <section className="mt-6">
                        <h2 className="text-lg font-bold uppercase tracking-widest border-b border-gray-400 pb-1">Skills</h2>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {skillList.map((skill, i) => (
                                <span key={i} className="bg-gray-200 text-gray-800 text-xs font-medium px-2.5 py-1 rounded-full">{skill}</span>
                            ))}
                        </div>
                    </section>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
    </>
  );
}
