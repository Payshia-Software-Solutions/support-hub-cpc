"use client";

import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadConvocationStudentCsv } from '@/lib/actions/certificates';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription, 
    DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { FileUp, Loader2, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface CsvUploadDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    convocationId: string;
    convocationName: string;
}

interface CsvRow {
    student_number: string;
    ceremony_number: string;
}

export function CsvUploadDialog({ open, onOpenChange, convocationId, convocationName }: CsvUploadDialogProps) {
    const queryClient = useQueryClient();
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<CsvRow[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isConfirmed, setIsConfirmed] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetState = () => {
        setFile(null);
        setPreviewData([]);
        setError(null);
        setIsConfirmed(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        if (!selectedFile.name.endsWith('.csv')) {
            setError("Please select a valid CSV file.");
            return;
        }

        setFile(selectedFile);
        setError(null);
        setIsConfirmed(false);

        // Read file for preview
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
            
            if (lines.length < 2) {
                setError("The CSV file seems to be empty or missing data.");
                return;
            }

            // Simple CSV parsing (assuming headers: student_number, ceremony_number)
            const rows: CsvRow[] = lines.slice(1).slice(0, 10).map(line => {
                const [student_number, ceremony_number] = line.split(',').map(item => item.trim());
                return { student_number, ceremony_number };
            });

            setPreviewData(rows);
        };
        reader.onerror = () => setError("Failed to read the file.");
        reader.readAsText(selectedFile);
    };

    const uploadMutation = useMutation({
        mutationFn: () => {
            if (!file) throw new Error("No file selected");
            return uploadConvocationStudentCsv(convocationId, file);
        },
        onSuccess: () => {
            toast({ 
                title: "Upload Successful", 
                description: `Student ceremony info for "${convocationName}" has been updated.` 
            });
            queryClient.invalidateQueries({ queryKey: ['convocationRegistrations'] });
            onOpenChange(false);
            resetState();
        },
        onError: (err: Error) => {
            toast({ 
                variant: 'destructive', 
                title: "Upload Failed", 
                description: err.message || "An error occurred during upload." 
            });
        }
    });

    const handleUpload = () => {
        if (!isConfirmed) {
            setIsConfirmed(true);
            return;
        }
        uploadMutation.mutate();
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!uploadMutation.isPending) {
                onOpenChange(val);
                if (!val) resetState();
            }
        }}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileUp className="h-5 w-5 text-primary" />
                        Bulk Upload Student Ceremony Info
                    </DialogTitle>
                    <DialogDescription>
                        Select a CSV file to update ceremony numbers for <strong>{convocationName}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-grow overflow-y-auto py-4 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">CSV File (.csv)</label>
                        <Input 
                            type="file" 
                            accept=".csv" 
                            onChange={handleFileChange} 
                            ref={fileInputRef}
                            disabled={uploadMutation.isPending}
                        />
                        <p className="text-[10px] text-muted-foreground">
                            Structure: student_number, ceremony_number (Headers required)
                        </p>
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {file && !error && (
                        <div className="space-y-4">
                            <div className="rounded-md border overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow>
                                            <TableHead className="py-2">Student Number</TableHead>
                                            <TableHead className="py-2">Ceremony #</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {previewData.map((row, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell className="py-2 font-mono text-xs">{row.student_number}</TableCell>
                                                <TableCell className="py-2 text-xs">{row.ceremony_number}</TableCell>
                                            </TableRow>
                                        ))}
                                        {previewData.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={2} className="text-center py-4 text-muted-foreground italic">
                                                    No data rows found in preview.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                                <div className="p-2 text-center text-[10px] text-muted-foreground border-t bg-muted/20">
                                    Displaying first {previewData.length} records...
                                </div>
                            </div>

                            {isConfirmed ? (
                                <Alert className="bg-primary/5 border-primary/20">
                                    <ShieldCheck className="h-4 w-4 text-primary" />
                                    <AlertTitle className="text-primary">Confirm Upload</AlertTitle>
                                    <AlertDescription className="text-xs">
                                        Are you sure you want to upload this file? This will update ceremony information for matching students in the database.
                                    </AlertDescription>
                                </Alert>
                            ) : (
                                <div className="flex items-center gap-2 text-xs text-green-600 font-medium">
                                    <CheckCircle2 className="h-4 w-4" />
                                    File loaded successfully.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button 
                        variant="outline" 
                        onClick={() => onOpenChange(false)}
                        disabled={uploadMutation.isPending}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleUpload} 
                        disabled={!file || !!error || uploadMutation.isPending}
                        variant={isConfirmed ? "default" : "secondary"}
                    >
                        {uploadMutation.isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Uploading...
                            </>
                        ) : isConfirmed ? (
                            "Confirm & Upload Now"
                        ) : (
                            "Preview & Confirmation"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
