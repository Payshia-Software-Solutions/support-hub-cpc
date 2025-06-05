
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, FileText } from "lucide-react";
import type { PaymentRecord } from "@/lib/types";
import { dummyPayments } from "@/lib/dummy-data"; // Assuming you'll add dummyPayments

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>(dummyPayments);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredPayments = payments
    .filter(
      (payment) =>
        payment.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.id.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(
      (payment) => statusFilter === "all" || payment.status.toLowerCase() === statusFilter.toLowerCase()
    );

  const getStatusBadgeVariant = (status: PaymentRecord['status']) => {
    switch (status) {
      case 'Completed': return 'default'; // Primary green-like by default
      case 'Pending': return 'secondary'; // Yellow-ish by default for secondary
      case 'Failed': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <header>
        <h1 className="text-3xl font-headline font-semibold">Payment Information</h1>
        <p className="text-muted-foreground">View and manage payment records.</p>
      </header>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <CardTitle>All Payments</CardTitle>
            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-grow md:flex-grow-0 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search payments..." 
                  className="pl-10 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment ID</TableHead>
                <TableHead>User Name</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.length > 0 ? filteredPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{payment.id}</TableCell>
                  <TableCell>{payment.userName}</TableCell>
                  <TableCell>{payment.amount.toFixed(2)} {payment.currency}</TableCell>
                  <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(payment.status)}>
                      {payment.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{payment.description}</TableCell>
                  <TableCell>
                     <button 
                        onClick={() => alert(`View details for payment ${payment.id}`)} 
                        className="text-primary hover:underline text-sm flex items-center gap-1"
                      >
                       <FileText size={16} /> Details
                     </button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No payment records found matching your criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

