import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, FileText, MapPin, Calendar, Phone, Mail, User2 } from "lucide-react";
import type { VerificationInfo, EmployerVerification } from "../types";

interface VerificationSectionProps {
    verificationInfo: VerificationInfo;
    updateVerificationField: (field: keyof VerificationInfo, value: string) => void;
    updateVerificationEmployer: (index: number, field: keyof EmployerVerification, value: string) => void;
}

export const VerificationSection = ({
    verificationInfo,
    updateVerificationField,
    updateVerificationEmployer
}: VerificationSectionProps) => {
    return (
        <div className="space-y-12 max-w-5xl mx-auto">
            {/* Background Verification Details */}
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 mb-8 pb-2 border-b border-gray-100">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                        <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 tracking-tight">Background Verification</h3>
                        <p className="text-sm text-gray-500">Official documentation for background checks</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-gray-500 tracking-wider">Full Name</Label>
                        <Input
                            value={verificationInfo.name || ''}
                            onChange={e => updateVerificationField("name", e.target.value)}
                            placeholder="As per legal documents"
                            className="h-11 border-gray-200 focus:ring-blue-500"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-gray-500 tracking-wider">Father's Name</Label>
                        <Input
                            value={verificationInfo.father_name || ''}
                            onChange={e => updateVerificationField("father_name", e.target.value)}
                            placeholder="Enter father's name"
                            className="h-11 border-gray-200 focus:ring-blue-500"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-gray-500 tracking-wider">Date of Birth</Label>
                        <Input
                            type="date"
                            value={verificationInfo.date_of_birth || ''}
                            onChange={e => updateVerificationField("date_of_birth", e.target.value)}
                            className="h-11 border-gray-200 focus:ring-blue-500"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-gray-500 tracking-wider">PAN Card No.</Label>
                        <Input
                            value={verificationInfo.pan_number || ''}
                            onChange={e => updateVerificationField("pan_number", e.target.value)}
                            placeholder="ABCDE1234F"
                            className="h-11 border-gray-200 uppercase"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-gray-500 tracking-wider">Aadhar Card No.</Label>
                        <Input
                            value={verificationInfo.aadhar_number || ''}
                            onChange={e => updateVerificationField("aadhar_number", e.target.value)}
                            placeholder="0000 0000 0000"
                            className="h-11 border-gray-200"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-gray-500 tracking-wider">Gender</Label>
                        <Input
                            value={verificationInfo.gender || ''}
                            onChange={e => updateVerificationField("gender", e.target.value)}
                            placeholder="Enter gender"
                            className="h-11 border-gray-200"
                        />
                    </div>
                </div>
            </section>

            {/* Address Details */}
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center gap-3 mb-8 pb-2 border-b border-gray-100">
                    <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                        <MapPin className="h-5 w-5" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 tracking-tight">Stay & Address History</h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="p-8 bg-gray-50/50 rounded-3xl border border-gray-100 flex flex-col gap-6">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-tighter">Current Residence</span>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-gray-500">Full Address</Label>
                            <Input
                                value={verificationInfo.present_address || ''}
                                onChange={e => updateVerificationField("present_address", e.target.value)}
                                placeholder="Where you live now"
                                className="h-11 border-gray-200 bg-white"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase text-gray-500">Stay Period</Label>
                                <Input
                                    value={verificationInfo.present_stay_period || ''}
                                    onChange={e => updateVerificationField("present_stay_period", e.target.value)}
                                    placeholder="e.g. 3 Years"
                                    className="h-11 border-gray-200 bg-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase text-gray-500">Contact</Label>
                                <Input
                                    value={verificationInfo.present_contact || ''}
                                    onChange={e => updateVerificationField("present_contact", e.target.value)}
                                    placeholder="Contact number"
                                    className="h-11 border-gray-200 bg-white"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-8 bg-gray-50/50 rounded-3xl border border-gray-100 flex flex-col gap-6">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full uppercase tracking-tighter">Permanent Home</span>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-gray-500">Full Address</Label>
                            <Input
                                value={verificationInfo.permanent_address || ''}
                                onChange={e => updateVerificationField("permanent_address", e.target.value)}
                                placeholder="Permanent residence address"
                                className="h-11 border-gray-200 bg-white"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase text-gray-500">Stay Period</Label>
                                <Input
                                    value={verificationInfo.permanent_stay_period || ''}
                                    onChange={e => updateVerificationField("permanent_stay_period", e.target.value)}
                                    placeholder="e.g. 15 Years"
                                    className="h-11 border-gray-200 bg-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase text-gray-500">Contact</Label>
                                <Input
                                    value={verificationInfo.permanent_contact || ''}
                                    onChange={e => updateVerificationField("permanent_contact", e.target.value)}
                                    placeholder="Permanent contact"
                                    className="h-11 border-gray-200 bg-white"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Previous Employers */}
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <div className="flex items-center gap-3 mb-8 pb-2 border-b border-gray-100">
                    <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                        <FileText className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 tracking-tight">Previous Employers</h3>
                        <p className="text-sm text-gray-500">Verification records for previous work history</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-8">
                    {verificationInfo.employers.map((emp, idx) => (
                        <div key={idx} className="p-10 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm hover:shadow-lg transition-all border-t-8 border-t-amber-500/20 group">
                            <div className="flex items-center justify-between mb-8">
                                <span className="bg-amber-50 text-amber-700 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm">Record #{idx + 1}</span>
                                <div className="h-1 w-24 bg-gray-50 rounded-full group-hover:bg-amber-100 transition-colors" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-8">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase text-gray-500">Employer Name</Label>
                                    <Input value={emp.employer_name} onChange={e => updateVerificationEmployer(idx, "employer_name", e.target.value)} placeholder="Enter company" className="h-12 border-gray-100" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase text-gray-500">Designation</Label>
                                    <Input value={emp.designation} onChange={e => updateVerificationEmployer(idx, "designation", e.target.value)} placeholder="Role held" className="h-12 border-gray-100" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase text-gray-500">Working Period</Label>
                                    <Input value={emp.period_of_working} onChange={e => updateVerificationEmployer(idx, "period_of_working", e.target.value)} placeholder="Years/Months" className="h-12 border-gray-100" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase text-gray-500">Location</Label>
                                    <Input value={emp.location} onChange={e => updateVerificationEmployer(idx, "location", e.target.value)} placeholder="City, Region" className="h-12 border-gray-100" />
                                </div>

                                <div className="lg:col-span-2 space-y-2">
                                    <Label className="text-xs font-bold uppercase text-gray-500">HR Contact / Email</Label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                                            <Input value={emp.hr_contact} onChange={e => updateVerificationEmployer(idx, "hr_contact", e.target.value)} placeholder="HR Number" className="h-12 pl-10 border-gray-100" />
                                        </div>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                                            <Input value={emp.hr_mail} onChange={e => updateVerificationEmployer(idx, "hr_mail", e.target.value)} placeholder="HR Email" className="h-12 pl-10 border-gray-100" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase text-gray-500">Supervisor Contact</Label>
                                    <div className="relative">
                                        <User2 className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                                        <Input value={emp.supervisor_contact} onChange={e => updateVerificationEmployer(idx, "supervisor_contact", e.target.value)} placeholder="Reporting manager" className="h-12 pl-10 border-gray-100" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase text-gray-500">Reason for Leaving</Label>
                                    <Input value={emp.reason_for_leaving} onChange={e => updateVerificationEmployer(idx, "reason_for_leaving", e.target.value)} placeholder="Brief reason" className="h-12 border-gray-100" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};
