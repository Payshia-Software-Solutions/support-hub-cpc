"use client";

import { StudentEnrollment } from '@/lib/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Truck, ClipboardCheck, Award, Gamepad2, CheckCircle, XCircle } from 'lucide-react';

const GameProgressInfo = ({ enrollment }: { enrollment: StudentEnrollment }) => {
    const hasAnyGame = enrollment.ceylon_pharmacy || enrollment.pharma_hunter || enrollment.pharma_hunter_pro;
    if (!hasAnyGame) return null;

    return (
        <div className="space-y-4 mt-2">
            <h4 className="font-semibold text-sm flex items-center gap-2"><Gamepad2 className="h-4 w-4" /> Game Progress</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {enrollment.ceylon_pharmacy && (
                    <div className="p-3 border rounded-md bg-muted/30">
                        <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">Ceylon Pharmacy</p>
                        <p className="text-sm font-medium">Recovered: {enrollment.ceylon_pharmacy.recoveredCount}</p>
                    </div>
                )}
                {enrollment.pharma_hunter && (
                    <div className="p-3 border rounded-md bg-muted/30">
                        <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">Pharma Hunter</p>
                        <div className="text-sm font-medium space-y-0.5">
                            <p>Correct: {enrollment.pharma_hunter.correctCount}</p>
                            <p className="text-[10px] text-muted-foreground">Gems: {enrollment.pharma_hunter.gemCount} | Coins: {enrollment.pharma_hunter.coinCount}</p>
                        </div>
                    </div>
                )}
                {enrollment.pharma_hunter_pro && (
                    <div className="p-3 border rounded-md bg-muted/30">
                        <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mb-1">Pharma Hunter Pro</p>
                        <div className="text-sm font-medium space-y-0.5">
                            <p>Progress: {enrollment.pharma_hunter_pro.results.progressPercentage}%</p>
                            <p className="text-[10px] text-muted-foreground">Correct: {enrollment.pharma_hunter_pro.results.correctCount}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export const EnrollmentDetailAccordion = ({ enrollment }: { enrollment: StudentEnrollment }) => {
    return (
        <Accordion type="multiple" className="w-full border rounded-md px-4 bg-background">
            <AccordionItem value="main" className="border-b-0">
                <AccordionTrigger className="py-3 text-left hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex flex-col">
                            <span className="font-semibold text-sm md:text-base">{enrollment.parent_course_name}</span>
                            <span className="text-[10px] md:text-xs text-muted-foreground font-normal">{enrollment.course_code} | Batch: {enrollment.batch_name}</span>
                        </div>
                        <Badge variant={enrollment.certificate_eligibility ? 'default' : 'destructive'} className="text-[10px] h-5 px-2 uppercase">
                            {enrollment.certificate_eligibility ? "Eligible" : "Not Eligible"}
                        </Badge>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-6 pt-2 pb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <h4 className="font-semibold text-xs uppercase text-muted-foreground flex items-center gap-2">
                                <ClipboardCheck className="h-3.5 w-3.5" /> 
                                Assignments (Avg: {enrollment.assignment_grades.average_grade}%)
                            </h4>
                            <div className="border rounded-md overflow-hidden bg-muted/10">
                                <Table>
                                    <TableBody>
                                        {enrollment.assignment_grades.assignments.length > 0 ? (
                                            enrollment.assignment_grades.assignments.map(a => (
                                                <TableRow key={a.assignment_id}>
                                                    <TableCell className="py-2 text-[11px] leading-tight">{a.assignment_name}</TableCell>
                                                    <TableCell className="py-2 text-[11px] text-right font-medium">{parseFloat(a.grade).toFixed(2)}%</TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow><TableCell className="py-4 text-center text-xs text-muted-foreground italic">No assignments found</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h4 className="font-semibold text-xs uppercase text-muted-foreground flex items-center gap-2">
                                <Truck className="h-3.5 w-3.5" /> 
                                Delivery Orders
                            </h4>
                            <div className="space-y-2">
                                {enrollment.deliveryOrders.length > 0 ? (
                                    enrollment.deliveryOrders.map(d => (
                                        <div key={d.id} className="text-xs p-2 border rounded-md bg-muted/20">
                                            <p className="font-medium">{d.delivery_title}</p>
                                            <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                                                <span>Tracking: {d.tracking_number}</span>
                                                <Badge variant="outline" className="h-4 px-1 text-[9px] uppercase">{d.active_status}</Badge>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-muted-foreground p-4 border border-dashed rounded-md text-center italic">No delivery orders</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <h4 className="font-semibold text-xs uppercase text-muted-foreground flex items-center gap-2">
                                <Award className="h-3.5 w-3.5" /> 
                                Certificate Records
                            </h4>
                            <div className="space-y-2">
                                {enrollment.certificateRecords.length > 0 ? (
                                    enrollment.certificateRecords.map(c => (
                                        <div key={c.id} className="text-xs p-2 border rounded-md bg-muted/20 flex justify-between items-center">
                                            <div>
                                                <p className="font-medium">{c.type}</p>
                                                <p className="text-[10px] text-muted-foreground">ID: {c.certificate_id}</p>
                                            </div>
                                            <Badge variant="secondary" className="text-[9px] h-4 px-1">{new Date(c.print_date).toLocaleDateString()}</Badge>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-muted-foreground p-4 border border-dashed rounded-md text-center italic">No certificate records</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h4 className="font-semibold text-xs uppercase text-muted-foreground flex items-center gap-2">
                                <Award className="h-3.5 w-3.5" /> Eligibility Details
                            </h4>
                            <div className="border rounded-md bg-muted/5 divide-y">
                                {enrollment.criteria_details.map(c => (
                                    <div key={c.id} className="flex items-center justify-between text-xs p-2">
                                        <div className="flex items-center gap-2">
                                            {c.evaluation.completed ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <XCircle className="h-3.5 w-3.5 text-red-500" />}
                                            <span className="font-medium">{c.list_name}</span>
                                        </div>
                                        <span className="text-muted-foreground text-[10px] bg-muted px-1.5 py-0.5 rounded-sm">{c.evaluation.currentValue} / {c.evaluation.requiredValue}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <GameProgressInfo enrollment={enrollment} />
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
};
