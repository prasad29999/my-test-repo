import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, GraduationCap, Briefcase, FileUp } from "lucide-react";

interface DocumentUploadSectionProps {
    handleKycUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const DocumentUploadSection = ({ handleKycUpload }: DocumentUploadSectionProps) => {
    const documentGroups = [
        {
            title: "Identity & Address Proof",
            icon: <ShieldCheck className="h-5 w-5 text-blue-600" />,
            bgColor: "bg-blue-50",
            docs: [
                { id: "aadhaar", label: "Aadhaar Card" },
                { id: "utility_bill", label: "Electricity / Utility Bill" },
                { id: "pan", label: "PAN Card" },
            ]
        },
        {
            title: "Education Certificates",
            icon: <GraduationCap className="h-5 w-5 text-purple-600" />,
            bgColor: "bg-purple-50",
            docs: [
                { id: "ssc", label: "SSC (10th) Certificate" },
                { id: "hsc", label: "HSC (12th) Certificate" },
                { id: "graduation", label: "Graduation Certificate" },
                { id: "post_graduation", label: "Post Graduation Certificate" },
            ]
        },
        {
            title: "Experience & Employment Documents",
            icon: <Briefcase className="h-5 w-5 text-amber-600" />,
            bgColor: "bg-amber-50",
            docs: [
                { id: "experience_letter", label: "Previous Experience Letter" },
                { id: "salary_slips", label: "Salary Slips (Last 3 Months)" },
                { id: "offer_letter", label: "Offer / Appointment Letter" },
            ]
        }
    ];

    return (
        <div className="space-y-10">
            <div className="flex items-center gap-2 mb-6 border-b pb-4">
                <FileUp className="h-6 w-6 text-gray-700" />
                <h2 className="text-xl font-bold text-gray-900">Document Uploads</h2>
            </div>

            {documentGroups.map((group, gIdx) => (
                <div key={gIdx} className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${group.bgColor}`}>
                            {group.icon}
                        </div>
                        <h3 className="font-bold text-gray-800 tracking-tight">{group.title}</h3>
                    </div>

                    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6 rounded-2xl border bg-white shadow-sm`}>
                        {group.docs.map((doc) => (
                            <div key={doc.id} className="space-y-2 group">
                                <Label htmlFor={doc.id} className="text-sm font-semibold text-gray-600 group-hover:text-blue-600 transition-colors">
                                    {doc.label}
                                </Label>
                                <div className="relative">
                                    <Input
                                        id={doc.id}
                                        type="file"
                                        onChange={handleKycUpload}
                                        className="cursor-pointer file:cursor-pointer file:bg-gray-50 file:border-0 file:text-blue-700 file:font-semibold hover:file:bg-blue-50 transition-all border-dashed"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-xs text-blue-800 leading-relaxed">
                    <p className="font-bold mb-1">Upload Guidelines:</p>
                    <ul className="list-disc ml-4 space-y-1">
                        <li>Files should be in PDF, JPG, or PNG format.</li>
                        <li>Maximum file size per document is 5MB.</li>
                        <li>Ensure the copies are clear and all information is legible.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};
