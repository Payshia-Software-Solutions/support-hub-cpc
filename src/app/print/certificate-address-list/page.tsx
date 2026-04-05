"use client";

import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { getCertificateOrders } from '@/lib/actions/certificates';
import { getParentCourses } from '@/lib/actions/courses';
import { getAllCities } from '@/lib/actions/locations';
import type { CertificateOrder, ParentCourse } from '@/lib/types';
import { useMemo, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft, Phone, Calendar, User } from 'lucide-react';
import Link from 'next/link';
import { ProtectedRoute } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { FileDown, Loader2 } from 'lucide-react';

interface City {
  id: string;
  name_en: string;
}

export default function CertificateAddressListPage() {
    const searchParams = useSearchParams();
    const courseCode = searchParams.get('courseCode');
    const rangeFrom = searchParams.get('rangeFrom');
    const rangeTo = searchParams.get('rangeTo');
    const [isGenerating, setIsGenerating] = useState(false);

    const { data: orders, isLoading: isLoadingOrders } = useQuery<CertificateOrder[]>({
        queryKey: ['certificateOrders'],
        queryFn: getCertificateOrders,
    });

    const { data: parentCourses } = useQuery<ParentCourse[]>({
        queryKey: ['parentCourses'],
        queryFn: getParentCourses,
    });

    const { data: cities } = useQuery<City[]>({
        queryKey: ['cities'],
        queryFn: getAllCities,
    });

    const courseNameMap = useMemo(() => {
        const map = new Map<string, string>();
        parentCourses?.forEach(course => map.set(course.id, course.course_name));
        return map;
    }, [parentCourses]);

    const cityMap = useMemo(() => {
        const map = new Map<string, string>();
        cities?.forEach(city => map.set(city.id, city.name_en));
        return map;
    }, [cities]);

    const filteredOrders = useMemo(() => {
        if (!orders || !courseCode) return [];
        
        let result = orders.filter(order => 
            order.course_code.split(',').map(s => s.trim()).includes(courseCode)
        );

        if (rangeFrom) {
            result = result.filter(order => parseInt(order.id, 10) >= parseInt(rangeFrom, 10));
        }
        if (rangeTo) {
            result = result.filter(order => parseInt(order.id, 10) <= parseInt(rangeTo, 10));
        }

        return result.sort((a, b) => parseInt(a.id, 10) - parseInt(b.id, 10));
    }, [orders, courseCode, rangeFrom, rangeTo]);

    // Cleanup for print
    useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = `
            @media print {
                .no-print { display: none !important; }
                * { -webkit-print-color-adjust: exact !important; font-smoothing: antialiased; }
                html, body { 
                    width: 100% !important; 
                    height: 100% !important; 
                    margin: 0 !important; 
                    padding: 0 !important;
                    background: white !important;
                    overflow: visible !important;
                }
                .print-container { 
                    padding: 0 !important; 
                    margin: 0 !important; 
                    width: 100% !important;
                    height: 100% !important;
                }
                .labels-grid { 
                    display: block !important;
                    width: 100% !important;
                    height: 100% !important;
                    margin: 0 !important;
                }
                .label-card { 
                    border: none !important;
                    padding: 4mm !important;
                    width: 100% !important;
                    height: 100vh !important;
                    page-break-after: always !important;
                    page-break-inside: avoid !important;
                    display: flex !important;
                    flex-direction: column !important;
                    justify-content: space-between !important;
                    box-sizing: border-box !important;
                    margin: 0 !important;
                    border-radius: 0 !important;
                    box-shadow: none !important;
                }
                @page { 
                    size: portrait; 
                    margin: 0; 
                }
            }
            .label-card {
                border: 1px dashed #ccc;
                padding: 1.5rem;
                border-radius: 12px;
                background: white;
                width: 105mm;
                height: 148mm;
                margin: 0 auto 3rem auto;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1);
            }
        `;
        document.head.appendChild(style);
        return () => { document.head.removeChild(style); };
    }, []);

    const generatePDF = async () => {
        setIsGenerating(true);
        try {
            const pdf = new jsPDF('p', 'mm', 'a6');
            const elements = document.querySelectorAll('.label-card');
            
            if (elements.length === 0) {
                alert("No labels found to export");
                return;
            }

            for (let i = 0; i < elements.length; i++) {
                const element = elements[i] as HTMLElement;
                const canvas = await html2canvas(element, { 
                    scale: 3,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff'
                });
                const imgData = canvas.toDataURL('image/png');
                
                if (i > 0) pdf.addPage('a6', 'p');
                pdf.addImage(imgData, 'PNG', 0, 0, 105, 148, undefined, 'FAST');
            }
            
            pdf.save(`Shipping_Labels_${courseCode}_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
        } catch (error) {
            console.error("PDF Generation Error:", error);
            alert("Failed to generate PDF. Please try the browser's native Print option.");
        } finally {
            setIsGenerating(false);
        }
    };

    if (isLoadingOrders) {
        return (
            <div className="p-8 space-y-4 no-print flex flex-col items-center">
                <Skeleton className="h-10 w-48 mb-8" />
                <Skeleton className="h-[148mm] w-[105mm] rounded-xl" />
            </div>
        );
    }

    return (
        <ProtectedRoute>
            <div className="p-4 md:p-8 space-y-6 print-container bg-gray-100 min-h-screen text-black print:bg-white print:p-0">
                <header className="flex justify-between items-center no-print border-b bg-white p-4 rounded-lg shadow-sm mb-6 max-w-3xl mx-auto">
                    <div className="flex items-center gap-4">
                        <Button asChild variant="outline" size="sm">
                            <Link href="/admin/manage/certificate-orders">
                                <ArrowLeft className="mr-2 h-4 w-4" /> Back
                            </Link>
                        </Button>
                        <h1 className="text-xl font-bold italic tracking-tighter uppercase text-primary">A6 Label Preview</h1>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={() => window.print()} variant="outline" size="sm">
                            <Printer className="mr-2 h-4 w-4" /> Print (A6)
                        </Button>
                        <Button 
                            onClick={generatePDF} 
                            variant="default" 
                            size="sm" 
                            disabled={isGenerating || filteredOrders.length === 0}
                            className="bg-blue-600 hover:bg-blue-700 font-bold"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
                                </>
                            ) : (
                                <>
                                    <FileDown className="mr-2 h-4 w-4" /> Open as PDF
                                </>
                            )}
                        </Button>
                    </div>
                </header>

                <div className="labels-grid mx-auto pb-20 print:pb-0">
                    {filteredOrders.length > 0 ? filteredOrders.map(order => (
                        <div key={order.id} className="label-card relative overflow-hidden bg-white">
                            {/* NEW SENDER SECTION */}
                            <div className="border-b-2 border-dashed border-black pb-1 flex justify-between items-start">
                                <div>
                                    <h4 className="text-[8px] font-black uppercase tracking-widest text-gray-400">Sender</h4>
                                    <p className="text-sm font-black text-blue-900 leading-none mb-0.5 uppercase">CEYLON PHARMA COLLEGE</p>
                                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-tight leading-none">Operation Branch | Midigahamulla, Pelmadulla</p>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-tight mt-0.5 leading-none">
                                        0715 884 884 | info@pharmacollege.lk
                                    </p>
                                </div>
                                <div className="p-1 px-2 bg-black text-white text-center min-w-[50px]">
                                     <p className="text-[8px] font-bold uppercase leading-none mb-0.5">Order #</p>
                                     <p className="text-sm font-black italic tracking-tighter leading-none">{order.id}</p>
                                </div>
                            </div>

                            {/* MAIN RECIPIENT SECTION */}
                            <div className="flex-1 py-1 flex flex-col justify-center">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black uppercase bg-black text-white px-2 py-0.5 inline-block mb-0.5 tracking-widest leading-none">Deliver To:</p>
                                    <h2 className="text-lg font-black leading-none uppercase mb-1 tracking-tight border-b-2 border-gray-100 pb-1">{order.name_on_certificate}</h2>
                                    
                                    <div className="text-xs font-bold leading-[1.1] space-y-0 text-black">
                                        <p>{order.address_line1}</p>
                                        {order.address_line2 && order.address_line2.trim().toLowerCase() !== order.address_line1.trim().toLowerCase() && (
                                            <p>{order.address_line2}</p>
                                        )}
                                        <div className="pt-1 flex items-center gap-2">
                                            <p className="text-base font-black uppercase tracking-tighter bg-gray-100 px-2 py-0.5 border border-black leading-none">{cityMap.get(order.city_id) || order.city_id}</p>
                                            <p className="text-[9px] uppercase text-gray-500 font-black flex-1 border-l border-gray-300 pl-2 leading-none">{order.district} District</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-2 pt-2 border-t-2 border-double border-black grid grid-cols-5 gap-2 items-center">
                                    <div className="col-span-3">
                                        <p className="text-[9px] font-black uppercase text-gray-400 flex items-center gap-1 mb-0.5 leading-none">
                                            <Phone className="h-2.5 w-2.5" /> RECIPIENT CONTACTS
                                        </p>
                                        <div className="space-y-0">
                                            <p className="text-xl font-black font-mono tracking-tighter leading-none">{order.mobile}</p>
                                            {order.telephone_1 && order.telephone_1 !== order.mobile && (
                                                <p className="text-sm font-black font-mono tracking-tighter opacity-80 leading-none">{order.telephone_1}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="col-span-2 text-right">
                                        <p className="text-[9px] font-black uppercase text-gray-400 mb-0.5 leading-none">STUDENT ID</p>
                                        <p className="text-sm font-black font-mono bg-gray-50 px-1 border leading-none inline-block">{order.created_by}</p>
                                    </div>
                                </div>
                            </div>

                            {/* BARCODE & ORDER SUMMARY FOOTER */}
                            <div className="border-t-2 border-black pt-2 mt-auto mb-[20mm] flex flex-col gap-2 overflow-hidden">
                                <div className="flex justify-between items-end gap-3">
                                    <div className="flex-1">
                                        <p className="text-[9px] font-black uppercase text-gray-400 mb-1 underline decoration-black/10 leading-none">Parcel Contents</p>
                                        <div className="space-y-1">
                                            <div className="text-[10px] font-black leading-tight text-black uppercase tracking-tighter flex flex-col gap-0.5">
                                                 {order.course_code.split(',').map((id, idx) => (
                                                     <p key={idx}>- {courseNameMap.get(id.trim()) || id}</p>
                                                 ))}
                                            </div>
                                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[9px] font-bold text-gray-600 uppercase leading-none mt-1">
                                                 <span>GARLAND: <span className={order.garlent === '1' ? "text-green-700 font-black" : "opacity-30"}>{order.garlent === '1' ? 'YES' : 'NO'}</span></span>
                                                 <span>SCROLL: <span className={order.scroll === '1' ? "text-green-700 font-black" : "opacity-30"}>{order.scroll === '1' ? 'YES' : 'NO'}</span></span>
                                                 <span>FILE: <span className={order.certificate_file === '1' ? "text-green-700 font-black" : "opacity-30"}>{order.certificate_file === '1' ? 'YES' : 'NO'}</span></span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                         <div className="bg-white p-2 border-2 border-black border-double inline-block shadow-sm">
                                             <p className="text-[9px] font-black uppercase leading-none opacity-40 mb-1">Ref</p>
                                             <p className="text-base font-black leading-none font-mono tracking-tight pointer-events-none">PA-{order.id}</p>
                                         </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="p-20 text-center bg-white border-4 border-double rounded-xl max-w-xl mx-auto shadow-inner no-print">
                            <p className="text-gray-400 italic">No labels to print. Please check your filters.</p>
                        </div>
                    )}
                </div>

                <footer className="no-print pb-10 text-center">
                    <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">
                         A6 STANDALONE LAYOUT | {new Date().toLocaleDateString()}
                    </p>
                </footer>
            </div>
        </ProtectedRoute>
    );
}
